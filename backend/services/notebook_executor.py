"""
Notebook Executor Service
Executes notebook.ipynb via papermill with parameterised file paths,
then extracts every output (stdout, HTML tables, images) from the
executed notebook and returns a single JSON payload for the frontend.
"""
from __future__ import annotations

import base64
import json
import os
import re
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

import nbformat
import papermill as pm

from config import (
    EXECUTED_NOTEBOOKS_DIR,
    FRONTEND_DATA_DIR,
    NOTEBOOK_PATH,
    RESULTS_DIR,
    UPLOAD_DIR,
)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def execute_analysis(
    shoreline_file: str,
    wave_file: str,
    wind_file: str,
    current_file: str,
) -> dict[str, Any]:
    """
    High-level entry point.

    1. Inject parameters into the notebook.
    2. Execute with papermill.
    3. Parse the executed notebook, extracting tables/plots/metrics.
    4. Return a fully-formed ``analysis_results`` dict.
    """
    session_id = uuid.uuid4().hex[:12]
    output_nb = EXECUTED_NOTEBOOKS_DIR / f"executed_{session_id}.ipynb"
    results_json = RESULTS_DIR / f"results_{session_id}.json"

    # ---- 1. Prepare a parameterised copy of the notebook ----
    param_nb = _inject_parameters(
        source_notebook=NOTEBOOK_PATH,
        data_path=str(Path(shoreline_file).parent),
        shoreline_file=shoreline_file,
        wave_file=wave_file,
        wind_file=wind_file,
        current_file=current_file,
        results_json_path=str(results_json),
        frontend_data_path=str(FRONTEND_DATA_DIR),
    )

    # ---- 2. Execute the notebook ----
    notebook_error = None
    try:
        pm.execute_notebook(
            str(param_nb),
            str(output_nb),
            kernel_name="python3",
            cwd=str(UPLOAD_DIR),
            request_save_on_cell_execute=True,
        )
    except pm.PapermillExecutionError as exc:
        notebook_error = exc
        print(f"[executor] Notebook execution error at cell {exc.cell_index}: {exc.ename}: {exc.evalue}")
    finally:
        # Clean up the parameterised copy
        if param_nb.exists():
            param_nb.unlink(missing_ok=True)

    # ---- 3. Extract outputs ----
    # The export cell writes a structured results JSON; require it.
    if results_json.exists():
        with open(results_json, "r") as f:
            analysis_results = json.load(f)
    elif notebook_error is not None:
        # Notebook failed before the export cell could run
        raise RuntimeError(
            f"Notebook execution failed at cell {notebook_error.cell_index}: "
            f"{notebook_error.ename}: {notebook_error.evalue}. "
            f"No results were generated."
        )
    else:
        # Fallback: parse outputs from the executed notebook cells
        analysis_results = _parse_notebook_outputs(output_nb)

    # ---- 4. Also copy to frontend public dir ----
    FRONTEND_DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(FRONTEND_DATA_DIR / "analysis_results.json", "w") as f:
        json.dump(analysis_results, f, indent=2, default=str)

    # Include session metadata
    analysis_results["_meta"] = {
        "sessionId": session_id,
        "executedAt": datetime.utcnow().isoformat(),
        "notebookPath": str(output_nb),
    }

    return analysis_results


# ---------------------------------------------------------------------------
# Notebook parameterisation helpers
# ---------------------------------------------------------------------------

def _inject_parameters(
    source_notebook: Path,
    data_path: str,
    shoreline_file: str,
    wave_file: str,
    wind_file: str,
    current_file: str,
    results_json_path: str,
    frontend_data_path: str,
) -> Path:
    """
    Read the source notebook, replace the hard-coded DATA_PATH / file paths
    with the ones pointing to the uploaded files, and append a comprehensive
    JSON-export cell at the end. Returns the path to the modified copy.
    """
    nb = nbformat.read(str(source_notebook), as_version=4)

    # --- Replace file paths in the data-loading cell (Section 2) ---
    for cell in nb.cells:
        if cell.cell_type != "code":
            continue
        src = cell.source
        if "DATA_PATH" in src and "SHORELINE_FILE" in src:
            # Replace the path definitions
            # NOTE: use lambda replacements so Windows back-slashes
            # in paths are NOT interpreted as regex escape sequences.
            new_src = re.sub(
                r'DATA_PATH\s*=\s*r?"[^"]*"',
                lambda _: f'DATA_PATH = r"{data_path}"',
                src,
            )
            new_src = re.sub(
                r'SHORELINE_FILE\s*=\s*.*',
                lambda _: f'SHORELINE_FILE = r"{shoreline_file}"',
                new_src,
            )
            new_src = re.sub(
                r'WAVE_FILE\s*=\s*.*',
                lambda _: f'WAVE_FILE = r"{wave_file}"',
                new_src,
            )
            new_src = re.sub(
                r'WIND_FILE\s*=\s*.*',
                lambda _: f'WIND_FILE = r"{wind_file}"',
                new_src,
            )
            new_src = re.sub(
                r'CURRENT_FILE\s*=\s*.*',
                lambda _: f'CURRENT_FILE = r"{current_file}"',
                new_src,
            )
            cell.source = new_src
            break

    # --- Replace the export DATA_PATH references in Section 8.3 ---
    for cell in nb.cells:
        if cell.cell_type != "code":
            continue
        if "Section 8.3" in cell.source or "Export Results" in cell.source:
            cell.source = cell.source.replace(
                "f'{DATA_PATH}/processed_annual_features.csv'",
                f"r'{data_path}/processed_annual_features.csv'",
            )
            cell.source = cell.source.replace(
                "f'{DATA_PATH}/erosion_thresholds.csv'",
                f"r'{data_path}/erosion_thresholds.csv'",
            )
            cell.source = cell.source.replace(
                "f'{DATA_PATH}/erosion_thresholds.json'",
                f"r'{data_path}/erosion_thresholds.json'",
            )

    # --- Append a final cell that generates the comprehensive JSON ---
    export_cell_source = _build_export_cell(results_json_path, frontend_data_path)
    export_cell = nbformat.v4.new_code_cell(source=export_cell_source)
    export_cell.metadata["tags"] = ["export"]
    nb.cells.append(export_cell)

    # --- Switch matplotlib to non-interactive backend ---
    for cell in nb.cells:
        if cell.cell_type != "code":
            continue
        if "import matplotlib.pyplot as plt" in cell.source:
            cell.source = "import matplotlib\nmatplotlib.use('Agg')\n" + cell.source
            break

    # --- Fix pandas 3.x compatibility issues ---
    for cell in nb.cells:
        if cell.cell_type != "code":
            continue
        if ".fillna(method=" in cell.source:
            cell.source = cell.source.replace(
                ".fillna(method='ffill')", ".ffill()"
            ).replace(
                ".fillna(method='bfill')", ".bfill()"
            ).replace(
                '.fillna(method="ffill")', ".ffill()"
            ).replace(
                '.fillna(method="bfill")', ".bfill()"
            )

    # Write parameterised notebook
    param_path = EXECUTED_NOTEBOOKS_DIR / f"param_{uuid.uuid4().hex[:8]}.ipynb"
    nbformat.write(nb, str(param_path))
    return param_path


def _build_export_cell(results_json_path: str, frontend_data_path: str) -> str:
    """Return Python source for the final notebook cell that writes
    analysis_results.json with every piece of data the frontend needs.
    Updated for the new 4-method ensemble + advanced forecast notebook."""
    return f'''
# =============================================================================
# AUTO-GENERATED: Comprehensive JSON export for frontend
# =============================================================================
import json, os, numpy as np, pandas as pd

_RESULTS_PATH = r"{results_json_path}"
_FRONTEND_PATH = r"{frontend_data_path}"

def _safe(v):
    """Make a value JSON-serialisable."""
    import math
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        f = float(v)
        return None if (math.isnan(f) or math.isinf(f)) else f
    if isinstance(v, np.ndarray):
        return [_safe(x) for x in v.tolist()]
    if isinstance(v, pd.Timestamp):
        return v.isoformat()
    if isinstance(v, (pd.Series, pd.Index)):
        return [_safe(x) for x in v.tolist()]
    if hasattr(v, 'item'):
        return _safe(v.item())
    return v

# ---- Build the results dict ----
results = {{}}

# =====================================================================
# 1. Summary statistics
# =====================================================================
try:
    results["summary"] = {{
        "totalTransects": _safe(transect_stats.get("Total_Transects", 0)),
        "erodingTransects": _safe(int(transect_stats.get("Pct_Eroding", 0) / 100 * transect_stats.get("Total_Transects", 0))),
        "erosionRate": _safe(round(transect_stats.get("Pct_Eroding", 0), 1)),
        "meanNSM": _safe(round(transect_stats.get("Mean_NSM", 0), 2)),
        "medianNSM": _safe(round(transect_stats.get("Median_NSM", 0), 2)),
        "totalYears": _safe(len(analysis_df)),
        "erosionYears": _safe(int(analysis_df["erosion_label"].sum())),
        "erosionYearsList": [int(y) for y in sorted(all_erosion_years)],
        "analysisYearRange": f"{{int(analysis_df['monsoon_year'].min())}}-{{int(analysis_df['monsoon_year'].max())}}",
        "meanEPR": _safe(round(transect_stats.get("Mean_EPR", 0), 2)),
        "significantFeatures": list(significant_features),
    }}
except Exception as e:
    print(f"Summary export error: {{e}}")
    results["summary"] = {{}}

# =====================================================================
# 2. Shoreline transect data
# =====================================================================
try:
    results["shoreline"] = dsas_df[['id', 'EPR', 'NSM', 'SCE', 'epr_class', 'erosion_flag']].to_dict(orient='records')
except Exception as e:
    print(f"Shoreline export error: {{e}}")
    results["shoreline"] = []

# =====================================================================
# 3. Annual analysis data (time series)
# =====================================================================
try:
    ts_cols = [c for c in analysis_df.columns if c not in ['geometry']]
    results["timeSeries"] = analysis_df[ts_cols].to_dict(orient='records')
except Exception as e:
    print(f"TimeSeries export error: {{e}}")
    results["timeSeries"] = []

# =====================================================================
# 4. Mann-Whitney statistical tests
# =====================================================================
try:
    results["statisticalTests"] = mw_df.to_dict(orient='records')
except Exception as e:
    print(f"Statistical tests export error: {{e}}")
    results["statisticalTests"] = []

# =====================================================================
# 5. Four-method ensemble thresholds
# =====================================================================
try:
    threshold_export = []
    for feat in significant_features:
        t = individual_thresholds.get(feat, {{}})
        e = ensemble_results.get(feat, {{}})
        row = {{
            "feature": feat,
            "thresholdAll": _safe(t.get('threshold_all')),
            "thresholdLow": _safe(t.get('threshold_low')),
            "thresholdHigh": _safe(t.get('threshold_high')),
            "pValue": _safe(t.get('p_value')),
            "methods": {{}},
        }}
        for method_name in ['roc_youden', 'bayesian_logistic', 'change_point', 'mutual_info']:
            if method_name in e:
                m = e[method_name]
                row["methods"][method_name] = {{
                    "threshold": _safe(m.get('threshold')),
                    "ci_lower": _safe(m.get('ci_lower')),
                    "ci_upper": _safe(m.get('ci_upper')),
                    "statistic": _safe(m.get('statistic', m.get('auc', m.get('mi')))),
                    "pValue": _safe(m.get('p_value')),
                    "significant": bool(m.get('significant', True)),
                }}
        threshold_export.append(row)
    results["thresholds"] = threshold_export
except Exception as e:
    print(f"Threshold export error: {{e}}")
    results["thresholds"] = []

# =====================================================================
# 6. Random Forest model
# =====================================================================
try:
    importances = pd.Series(rf.feature_importances_, index=significant_features).sort_values(ascending=False)
    results["rfModel"] = {{
        "featureImportance": [
            {{"feature": feat, "importance": _safe(round(imp, 4))}}
            for feat, imp in importances.items()
        ],
        "oobScore": _safe(round(rf.oob_score_, 4)) if hasattr(rf, 'oob_score_') else None,
        "nEstimators": _safe(rf.n_estimators),
    }}
except Exception as e:
    print(f"RF model export error: {{e}}")
    results["rfModel"] = None

# =====================================================================
# 7. SARIMA diagnostics (AIC grid search)
# =====================================================================
try:
    results["sarimaDiagnostics"] = sarima_diag_df.to_dict(orient='records')
except Exception as e:
    print(f"SARIMA diagnostics export error: {{e}}")
    results["sarimaDiagnostics"] = []

# =====================================================================
# 8. SARIMA forecasts (monthly per variable) + rich forecasts structure
# =====================================================================
try:
    fc_export = {{}}
    for var_name, fc_df_var in sarima_forecasts.items():
        fc_export[var_name] = {{
            "monthly": fc_df_var.to_dict(orient='records'),
        }}
    results["sarimaForecasts"] = fc_export
except Exception as e:
    print(f"SARIMA forecasts export error: {{e}}")
    results["sarimaForecasts"] = {{}}

# =====================================================================
# 8b. Rich forecasts structure for frontend ForecastThresholdPage
# =====================================================================
try:
    _horizons_list = [6, 12, 18, 24]
    _forecast_vars = {{}}

    for var_name, fc_df_var in sarima_forecasts.items():
        fc_monthly = fc_df_var.copy()
        fc_monthly['date'] = pd.to_datetime(fc_monthly['date'])

        # Historical mean from forcing_vars_monthly
        hist_mean = float(forcing_vars_monthly[var_name].mean()) if var_name in forcing_vars_monthly else 0.0
        hist_std  = float(forcing_vars_monthly[var_name].std())  if var_name in forcing_vars_monthly else 1.0

        # Threshold from individual_thresholds
        thresh = None
        if var_name in individual_thresholds:
            thresh = _safe(individual_thresholds[var_name].get('threshold_all'))
        elif var_name in ensemble_results:
            for m in ['roc_youden', 'bayesian_logistic', 'change_point', 'mutual_info']:
                if m in ensemble_results[var_name] and 'threshold' in ensemble_results[var_name][m]:
                    thresh = _safe(ensemble_results[var_name][m]['threshold'])
                    break

        # Model info from sarima_diag_df
        model_info = {{}}
        diag_row = sarima_diag_df[sarima_diag_df['variable'] == var_name]
        if len(diag_row) > 0:
            row = diag_row.iloc[0]
            try:
                order_val = eval(row['order']) if isinstance(row['order'], str) else row['order']
                seasonal_val = eval(row['seasonal_order']) if isinstance(row['seasonal_order'], str) else row['seasonal_order']
            except Exception:
                order_val = [0, 0, 0]
                seasonal_val = [0, 0, 0, 12]
            model_info = {{
                "order": list(order_val) if hasattr(order_val, '__iter__') else [0, 0, 0],
                "seasonalOrder": list(seasonal_val) if hasattr(seasonal_val, '__iter__') else [0, 0, 0, 12],
                "aic": _safe(row.get('AIC', 0)),
                "mae": _safe(row.get('MAE', 0)),
                "rmse": _safe(row.get('RMSE', 0)),
            }}

        # Validation info
        validation = {{}}
        if len(diag_row) > 0:
            row = diag_row.iloc[0]
            # Compute correlation from hold-out if available
            corr_val = 0.0
            if var_name in sarima_models and var_name in forcing_vars_monthly:
                s = forcing_vars_monthly[var_name].dropna()
                n_ho = min(24, len(s) // 4)
                s_test = s[-n_ho:]
                try:
                    val_mdl = sarima_models[var_name]
                    val_pred = val_mdl.get_prediction(start=len(s) - n_ho, end=len(s) - 1).predicted_mean.values
                    if len(val_pred) == len(s_test):
                        corr_val = float(np.corrcoef(s_test.values, val_pred)[0, 1])
                except Exception:
                    corr_val = 0.0
            validation = {{
                "mae": _safe(row.get('MAE', 0)),
                "rmse": _safe(row.get('RMSE', 0)),
                "mape": _safe(row.get('MAPE', 0)),
                "correlation": _safe(round(corr_val, 4)),
                "holdoutMonths": 24,
            }}

        # Build per-horizon data
        horizons_data = {{}}
        for h in _horizons_list:
            h_monthly = fc_monthly.head(h).copy()
            h_records = []
            for _, r in h_monthly.iterrows():
                h_records.append({{
                    "date": r['date'].strftime('%Y-%m'),
                    "predicted": _safe(r['forecast']),
                    "ci_lower": _safe(r['lower_95']),
                    "ci_upper": _safe(r['upper_95']),
                }})

            avg_fc = float(h_monthly['forecast'].mean()) if len(h_monthly) > 0 else 0.0
            peak_fc = float(h_monthly['forecast'].max()) if len(h_monthly) > 0 else 0.0
            exceed_pct = 0.0
            if thresh is not None and len(h_monthly) > 0:
                exceed_pct = float((h_monthly['forecast'] >= thresh).sum() / len(h_monthly) * 100)
            trend_pct = ((avg_fc - hist_mean) / hist_mean * 100) if hist_mean != 0 else 0.0

            horizons_data[str(h)] = {{
                "monthly": h_records,
                "avgForecast": _safe(round(avg_fc, 4)),
                "peakForecast": _safe(round(peak_fc, 4)),
                "exceedancePct": _safe(round(exceed_pct, 1)),
                "trendPct": _safe(round(trend_pct, 1)),
            }}

        # Risk level
        risk = 'Low'
        if thresh is not None:
            exc_24 = horizons_data.get('24', {{}}).get('exceedancePct', 0)
            if exc_24 > 50:
                risk = 'High'
            elif exc_24 > 20:
                risk = 'Medium'

        _forecast_vars[var_name] = {{
            "threshold": _safe(thresh),
            "historicalMean": _safe(round(hist_mean, 4)),
            "historicalStd": _safe(round(hist_std, 4)),
            "riskLevel": risk,
            "model": model_info,
            "validation": validation,
            "horizons": horizons_data,
        }}

    # Overall risk
    risk_levels = [v.get('riskLevel', 'Low') for v in _forecast_vars.values()]
    if 'High' in risk_levels:
        overall = 'High'
    elif 'Medium' in risk_levels:
        overall = 'Medium'
    else:
        overall = 'Low'

    # Data range
    data_range = ''
    total_months = 0
    if forcing_vars_monthly:
        first_s = list(forcing_vars_monthly.values())[0]
        total_months = len(first_s)
        data_range = f"{{first_s.index.min().strftime('%Y-%m')}} to {{first_s.index.max().strftime('%Y-%m')}}"

    results["forecasts"] = {{
        "metadata": {{
            "totalMonths": total_months,
            "dataRange": data_range,
            "forecastHorizons": _horizons_list,
            "overallRisk": overall,
            "nVariables": len(_forecast_vars),
        }},
        "variables": _forecast_vars,
    }}
except Exception as e:
    print(f"Rich forecasts export error: {{e}}")
    results["forecasts"] = {{"metadata": {{}}, "variables": {{}}}}

# =====================================================================
# 9. Hindcast validation
# =====================================================================
try:
    if len(hc_df) > 0:
        hits   = int(((hc_df['actual'] == 1) & (hc_df['predicted'] == 1)).sum())
        misses = int(((hc_df['actual'] == 1) & (hc_df['predicted'] == 0)).sum())
        false_alarms = int(((hc_df['actual'] == 0) & (hc_df['predicted'] == 1)).sum())
        correct_rej  = int(((hc_df['actual'] == 0) & (hc_df['predicted'] == 0)).sum())
        pod = hits / max(hits + misses, 1)
        far = false_alarms / max(hits + false_alarms, 1)
        csi = hits / max(hits + misses + false_alarms, 1)
        accuracy = (hits + correct_rej) / len(hc_df)
        results["hindcast"] = {{
            "results": hc_df.to_dict(orient='records'),
            "metrics": {{
                "accuracy": _safe(round(accuracy, 4)),
                "pod": _safe(round(pod, 4)),
                "far": _safe(round(far, 4)),
                "csi": _safe(round(csi, 4)),
                "hits": hits,
                "misses": misses,
                "falseAlarms": false_alarms,
                "correctRejections": correct_rej,
                "totalYears": len(hc_df),
            }},
        }}
    else:
        results["hindcast"] = None
except Exception as e:
    print(f"Hindcast export error: {{e}}")
    results["hindcast"] = None

# =====================================================================
# 10. Erosion probability results (analytical, replacing Monte Carlo)
# =====================================================================
try:
    results["monteCarlo"] = {{
        "nSimulations": 0,
        "method": "analytical",
        "horizons": mc_df.to_dict(orient='records'),
    }}
except Exception as e:
    print(f"Erosion probability export error: {{e}}")
    results["monteCarlo"] = None

# =====================================================================
# 11. Retreat predictions (actual meters)
# =====================================================================
try:
    results["retreatPredictions"] = retreat_df.to_dict(orient='records')
except Exception as e:
    print(f"Retreat predictions export error: {{e}}")
    results["retreatPredictions"] = []

# =====================================================================
# 12. Per-transect vulnerability scores
# =====================================================================
try:
    vuln_cols = [c for c in dsas_scored.columns if c.startswith('risk_') or c.startswith('cat_')]
    base_cols = ['id', 'EPR', 'NSM', 'epr_class', 'epr_vulnerability']
    export_cols = [c for c in base_cols + vuln_cols if c in dsas_scored.columns]
    results["transectVulnerability"] = {{
        "data": dsas_scored[export_cols].to_dict(orient='records'),
        "summary": {{}},
    }}
    for col in vuln_cols:
        if col.startswith('cat_') and col in dsas_scored.columns:
            h_name = col.replace('cat_', '')
            dist = dsas_scored[col].value_counts().to_dict()
            results["transectVulnerability"]["summary"][h_name] = {{
                str(k): int(v) for k, v in dist.items()
            }}
except Exception as e:
    print(f"Transect vulnerability export error: {{e}}")
    results["transectVulnerability"] = None

# =====================================================================
# 13. Forecast skill scores
# =====================================================================
try:
    base_rate_val = float(analysis_df['erosion_label'].mean())
    if len(hc_df) > 0:
        bs_fc = float(np.mean((hc_df['probability'].values - hc_df['actual'].values)**2))
        bs_clim = float(np.mean((base_rate_val - hc_df['actual'].values)**2))
        bss_val = 1 - bs_fc / bs_clim if bs_clim > 0 else 0
        results["forecastSkill"] = {{
            "baseRate": _safe(round(base_rate_val, 4)),
            "brierScoreForecast": _safe(round(bs_fc, 4)),
            "brierScoreClimatology": _safe(round(bs_clim, 4)),
            "brierSkillScore": _safe(round(bss_val, 4)),
            "skillful": bss_val > 0,
        }}
    else:
        results["forecastSkill"] = None
except Exception as e:
    print(f"Forecast skill export error: {{e}}")
    results["forecastSkill"] = None

# =====================================================================
# 14. Monthly risk timeline
# =====================================================================
try:
    results["monthlyRisk"] = monthly_risk_df.to_dict(orient='records')
except Exception as e:
    print(f"Monthly risk export error: {{e}}")
    results["monthlyRisk"] = []

# =====================================================================
# 15. Horizon features (aggregated annual per horizon)
# =====================================================================
try:
    results["horizonFeatures"] = horizon_features.to_dict(orient='records')
except Exception as e:
    print(f"Horizon features export error: {{e}}")
    results["horizonFeatures"] = []

# =====================================================================
# 16. Erosion predictions per horizon (RF probabilities)
# =====================================================================
try:
    results["erosionPredictions"] = erosion_predictions
except Exception as e:
    print(f"Erosion predictions export error: {{e}}")
    results["erosionPredictions"] = []

# ---- Sanitise & Write JSON ----
import math as _math

def _sanitise(obj):
    if isinstance(obj, dict):
        return {{k: _sanitise(v) for k, v in obj.items()}}
    if isinstance(obj, list):
        return [_sanitise(v) for v in obj]
    if isinstance(obj, float) and (_math.isnan(obj) or _math.isinf(obj)):
        return None
    return obj

results = _sanitise(results)

os.makedirs(os.path.dirname(_RESULTS_PATH), exist_ok=True)
with open(_RESULTS_PATH, "w") as _f:
    json.dump(results, _f, indent=2, default=str)

os.makedirs(_FRONTEND_PATH, exist_ok=True)
with open(os.path.join(_FRONTEND_PATH, "analysis_results.json"), "w") as _f:
    json.dump(results, _f, indent=2, default=str)

print(f"✓ Results exported to {{_RESULTS_PATH}}")
print(f"✓ Results copied to {{_FRONTEND_PATH}}/analysis_results.json")

# =====================================================================
# 17. Embed figures as base64
# =====================================================================
import base64 as _b64
_figure_dir = os.path.join(os.getcwd(), 'figures')
_figures = {{}}
if os.path.isdir(_figure_dir):
    for fname in sorted(os.listdir(_figure_dir)):
        if fname.lower().endswith(('.png', '.jpg', '.jpeg', '.svg')):
            fpath = os.path.join(_figure_dir, fname)
            with open(fpath, 'rb') as _img:
                _figures[fname] = _b64.b64encode(_img.read()).decode('ascii')
    print(f"✓ Embedded {{len(_figures)}} figures")

# =====================================================================
# 18. Embed output CSV data as JSON arrays
# =====================================================================
_output_dir = os.path.join(os.getcwd(), 'outputs')
_csv_outputs = {{}}
if os.path.isdir(_output_dir):
    for fname in sorted(os.listdir(_output_dir)):
        if fname.lower().endswith('.csv'):
            fpath = os.path.join(_output_dir, fname)
            try:
                _csv_df = pd.read_csv(fpath)
                _csv_outputs[fname] = _sanitise(_csv_df.to_dict(orient='records'))
            except Exception as _csv_err:
                print(f"Warning: Could not read {{fname}}: {{_csv_err}}")
    print(f"✓ Embedded {{len(_csv_outputs)}} CSV output files")

# Add figures and csvOutputs to results
results["figures"] = _figures
results["csvOutputs"] = _csv_outputs

# =====================================================================
# 19. Merge five-class results (written by Section 3.5)
# =====================================================================
try:
    _fc_path = os.path.join(os.getcwd(), 'outputs', 'five_class_results.json')
    if os.path.exists(_fc_path):
        with open(_fc_path) as _fcf:
            _fc_data = json.load(_fcf)
        results.update(_fc_data)
        print(f"✓ Merged five-class results from {{_fc_path}}")
    else:
        print("Info: five_class_results.json not found — skipping merge")
except Exception as _fce:
    print(f"Warning: five-class merge failed: {{_fce}}")

# Re-write with figures, CSVs, and five-class data included
with open(_RESULTS_PATH, "w") as _f:
    json.dump(results, _f, indent=2, default=str)

with open(os.path.join(_FRONTEND_PATH, "analysis_results.json"), "w") as _f:
    json.dump(results, _f, indent=2, default=str)

print("✓ Final results with figures, CSVs, and five-class data saved")

'''


# ---------------------------------------------------------------------------
# Notebook output parsing (fallback if JSON export cell fails)
# ---------------------------------------------------------------------------

def _parse_notebook_outputs(notebook_path: Path) -> dict[str, Any]:
    """
    Walk the executed notebook and harvest cell outputs.
    Returns a dict with cell-indexed results.
    """
    if not notebook_path.exists():
        return {"error": "Executed notebook not found", "cells": []}

    nb = nbformat.read(str(notebook_path), as_version=4)
    cells_data: list[dict] = []

    for idx, cell in enumerate(nb.cells):
        if cell.cell_type != "code":
            continue
        cell_result: dict[str, Any] = {
            "cellIndex": idx,
            "outputs": [],
        }
        for output in cell.get("outputs", []):
            otype = output.get("output_type")

            if otype == "stream":
                cell_result["outputs"].append({
                    "type": "text",
                    "content": output.get("text", ""),
                })

            elif otype in ("display_data", "execute_result"):
                data = output.get("data", {})
                if "text/html" in data:
                    cell_result["outputs"].append({
                        "type": "html",
                        "content": data["text/html"],
                    })
                if "image/png" in data:
                    cell_result["outputs"].append({
                        "type": "image",
                        "content": data["image/png"],  # already base64
                    })
                if "text/plain" in data and "text/html" not in data and "image/png" not in data:
                    cell_result["outputs"].append({
                        "type": "text",
                        "content": data["text/plain"],
                    })

            elif otype == "error":
                cell_result["outputs"].append({
                    "type": "error",
                    "ename": output.get("ename", ""),
                    "evalue": output.get("evalue", ""),
                    "traceback": output.get("traceback", []),
                })

        if cell_result["outputs"]:
            cells_data.append(cell_result)

    return {"cells": cells_data, "totalCells": len(nb.cells)}
