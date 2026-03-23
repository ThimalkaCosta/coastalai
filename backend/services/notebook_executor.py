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
    try:
        pm.execute_notebook(
            str(param_nb),
            str(output_nb),
            kernel_name="python3",
            cwd=str(UPLOAD_DIR),
            request_save_on_cell_execute=True,
        )
    except pm.PapermillExecutionError as exc:
        # Even on failure the partially-executed notebook is written.
        # We still try to harvest outputs below.
        print(f"[executor] Notebook execution error at cell {exc.cell_index}: {exc.ename}: {exc.evalue}")
    finally:
        # Clean up the parameterised copy
        if param_nb.exists():
            param_nb.unlink(missing_ok=True)

    # ---- 3. Extract outputs ----
    # First check if the notebook itself wrote a results JSON
    if results_json.exists():
        with open(results_json, "r") as f:
            analysis_results = json.load(f)
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
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return float(v)
    if isinstance(v, np.ndarray):
        return v.tolist()
    if isinstance(v, pd.Timestamp):
        return v.isoformat()
    if isinstance(v, (pd.Series, pd.Index)):
        return v.tolist()
    if hasattr(v, 'item'):
        return v.item()
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
# 8. SARIMA forecasts (monthly per variable)
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
# 10. Monte Carlo results
# =====================================================================
try:
    results["monteCarlo"] = {{
        "nSimulations": 2000,
        "horizons": mc_df.to_dict(orient='records'),
    }}
except Exception as e:
    print(f"Monte Carlo export error: {{e}}")
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

# ---- Write JSON ----
os.makedirs(os.path.dirname(_RESULTS_PATH), exist_ok=True)
with open(_RESULTS_PATH, "w") as _f:
    json.dump(results, _f, indent=2, default=str)

os.makedirs(_FRONTEND_PATH, exist_ok=True)
with open(os.path.join(_FRONTEND_PATH, "analysis_results.json"), "w") as _f:
    json.dump(results, _f, indent=2, default=str)

print(f"✓ Results exported to {{_RESULTS_PATH}}")
print(f"✓ Results copied to {{_FRONTEND_PATH}}/analysis_results.json")

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
