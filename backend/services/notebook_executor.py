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
    analysis_results.json with every piece of data the frontend needs."""
    return f'''
# =============================================================================
# AUTO-GENERATED: Comprehensive JSON export for frontend
# =============================================================================
import json, os, base64, io, numpy as np

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
    if hasattr(v, 'item'):
        return v.item()
    return v

def _fig_to_b64(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=100, bbox_inches="tight")
    buf.seek(0)
    return base64.b64encode(buf.read()).decode()

# ---- Build the results dict ----
results = {{}}

# 1. Summary
results["summary"] = {{
    "totalTransects": _safe(transect_stats.get("Total_Transects", 0)),
    "erodingTransects": _safe(int(transect_stats.get("Pct_Eroding", 0) / 100 * transect_stats.get("Total_Transects", 0))),
    "erosionRate": _safe(round(transect_stats.get("Pct_Eroding", 0), 1)),
    "meanNSM": _safe(round(transect_stats.get("Mean_NSM", 0), 2)),
    "medianNSM": _safe(round(transect_stats.get("Median_NSM", 0), 2)),
    "totalYears": _safe(len(shoreline_annual)),
    "erosionYears": _safe(int(shoreline_annual["Erosion_Binary"].sum())),
    "analysisYearRange": f"{{int(shoreline_annual['year'].min())}}-{{int(shoreline_annual['year'].max())}}",
    "beachState": beach_state,
    "meanEPR": _safe(round(transect_stats.get("Mean_EPR", 0), 2)),
    "meanLRR": _safe(round(transect_stats.get("Mean_LRR", 0), 2)),
}}

# 2. Yearly shoreline
results["yearlyShoreline"] = yearly_shoreline_export

# 3. Shoreline transects
results["shoreline"] = shoreline_export

# 4. Time series (monthly env + annual erosion labels)
_ts_cols = [c for c in ['monsoon_year', 'Hm0_max', 'Hm0_mean', 'CumWaveEnergy', 'StormDays_wave',
                         'WindMax', 'WindMean', 'WindStressMean', 'UcurrMax', 'UcurrMean',
                         'CumCurrent', 'Erosion_Label', 'HMM_State'] if c in env_features_monthly.columns]
results["timeSeries"] = env_features_monthly[_ts_cols].to_dict(orient='records')

# 5. Scatter data (annual: wave height vs NSM)
results["scatter"] = [
    {{"Hm0_max": _safe(row["Hm0_max"]), "annual_NSM": _safe(row["annual_NSM"]),
      "Erosion_Label": _safe(row["Erosion_Label"]), "year": _safe(int(row["monsoon_year"]))}}
    for _, row in env_features.iterrows()
]

# 6. Correlation matrix
try:
    _corr_feats = [c for c in ['Hm0_max', 'Hm0_mean', 'CumWaveEnergy', 'StormDays_wave',
                                'WindMax', 'WindMean', 'WindStressMean',
                                'UcurrMax', 'UcurrMean', 'CumCurrent', 'Erosion_Label']
                   if c in env_features.columns]
    _cm = env_features[_corr_feats].corr()
    results["correlation"] = {{
        "features": _corr_feats,
        "matrix": _cm.values.tolist(),
    }}
except Exception:
    results["correlation"] = None

# 7. PCA
try:
    results["pca"] = {{
        "data": [{{"PC1": _safe(r["PC1"]), "PC2": _safe(r["PC2"]),
                    "PC3": _safe(r.get("PC3", 0)),
                    "year": _safe(int(r["monsoon_year"])),
                    "Erosion_Label": _safe(r["Erosion_Label"])}}
                  for _, r in env_features.iterrows()],
        "variance": [_safe(v) for v in pca.explained_variance_ratio_],
        "loadings": pca.components_.tolist(),
        "features": pca_features,
    }}
except Exception:
    results["pca"] = None

# 8. Forcing regimes
results["forcingRegimes"] = forcing_regimes_export

# 9. Boxplot data
results["boxplot"] = boxplot_export

# 10. ROC data
try:
    results["roc"] = {{
        "hmm": {{"fpr": fpr_hmm.tolist(), "tpr": tpr_hmm.tolist(), "auc": _safe(hmm_auc)}},
        "rf":  {{"fpr": fpr_rf.tolist(),  "tpr": tpr_rf.tolist(),  "auc": _safe(rf_auc)}},
        "xgb": {{"fpr": fpr_xgb.tolist(), "tpr": tpr_xgb.tolist(), "auc": _safe(xgb_auc)}},
    }}
except Exception:
    results["roc"] = None

# 11. Models
# -- Random Forest --
try:
    # Export ALL thresholds (sorted by importance), not just top 5
    _importance_order = feature_importance["Feature"].tolist()
    _rf_thresh = {{}}
    for feat in _importance_order:
        if feat in rf_thresholds:
            _rf_thresh[feat] = {{
                "value": _safe(round(rf_thresholds[feat]["threshold"], 3)),
                "lower": _safe(round(rf_thresholds[feat]["threshold_lower"], 3)),
                "upper": _safe(round(rf_thresholds[feat]["threshold_upper"], 3)),
                "nSplits": _safe(rf_thresholds[feat]["n_splits"]),
                "condition": rf_thresholds[feat].get("direction", "\u2265"),
                "unit": "m" if "Hm0" in feat else "m/s" if "curr" in feat.lower() or "Wind" in feat else "",
            }}

    # Model configuration from best estimator
    _bp = rf_search.best_params_ if hasattr(rf_search, 'best_params_') else {{}}
    _rf_config = {{
        "nEstimators": _safe(rf_model.n_estimators),
        "maxDepth": _safe(_bp.get("max_depth", None)),
        "minSamplesSplit": _safe(_bp.get("min_samples_split", 2)),
        "minSamplesLeaf": _safe(_bp.get("min_samples_leaf", 1)),
        "maxFeatures": _safe(str(_bp.get("max_features", "sqrt"))),
        "criterion": _safe(getattr(rf_model, "criterion", "gini")),
        "classWeight": _safe(str(_bp.get("class_weight", "balanced"))),
        "bootstrap": _safe(getattr(rf_model, "bootstrap", True)),
        "cvFolds": _safe(int(n_splits)),
        "randomState": 42,
    }}

    results["models"] = results.get("models", {{}})
    results["models"]["rf"] = {{
        "featureImportance": [{{"Feature": _safe(r["Feature"]), "Importance": _safe(r["Importance"])}}
                              for _, r in feature_importance.iterrows()],
        "metrics": {{
            "accuracy": _safe(round(rf_accuracy, 4)),
            "cvAccuracy": _safe(round(rf_search.best_score_, 4)),
            "cvStd": 0,
            "f1Score": _safe(round(rf_f1, 4)),
            "oobScore": _safe(round(rf_model.oob_score_, 4)) if hasattr(rf_model, 'oob_score_') else 0,
            "precision": _safe(round(precision_score(y_monthly, y_pred_rf, zero_division=0), 4)),
            "recall": _safe(round(recall_score(y_monthly, y_pred_rf, zero_division=0), 4)),
            "nEstimators": _safe(rf_model.n_estimators),
            "rocAuc": _safe(round(rf_auc, 4)),
        }},
        "config": _rf_config,
        "thresholds": _rf_thresh,
    }}
except Exception as e:
    print(f"RF export error: {{e}}")

# -- XGBoost --
try:
    _xgb_thresh = {{}}
    for feat in xgb_thresholds:
        _xgb_thresh[feat] = {{
            "value": _safe(round(xgb_thresholds[feat]["threshold"], 3)),
            "lower": _safe(round(xgb_thresholds[feat]["threshold_lower"], 3)),
            "upper": _safe(round(xgb_thresholds[feat]["threshold_upper"], 3)),
            "nSplits": _safe(xgb_thresholds[feat]["n_splits"]),
            "condition": xgb_thresholds[feat].get("direction", "\u2265"),
            "importance": _safe(round(xgb_thresholds[feat]["importance"], 4)),
            "unit": "m" if "Hm0" in feat else "m/s" if "curr" in feat.lower() or "Wind" in feat else "",
        }}

    results["models"] = results.get("models", {{}})
    results["models"]["xgb"] = {{
        "featureImportance": [{{"Feature": _safe(r["Feature"]), "Importance": _safe(r["Importance"])}}
                              for _, r in xgb_importance.iterrows()],
        "shapValues": [{{"Feature": _safe(r["Feature"]), "Mean_SHAP": _safe(r["Mean_SHAP"])}}
                       for _, r in shap_importance.iterrows()],
        "metrics": {{
            "accuracy": _safe(round(xgb_accuracy, 4)),
            "cvAccuracy": _safe(round(xgb_search.best_score_, 4)),
            "cvStd": 0,
            "f1Score": _safe(round(xgb_f1, 4)),
            "auc": _safe(round(xgb_auc, 4)),
            "precision": _safe(round(precision_score(y_monthly, y_pred_xgb, zero_division=0), 4)),
            "recall": _safe(round(recall_score(y_monthly, y_pred_xgb, zero_division=0), 4)),
            "nEstimators": _safe(xgb_model.n_estimators),
            "maxDepth": _safe(xgb_model.max_depth),
            "learningRate": _safe(xgb_model.learning_rate),
        }},
        "thresholds": _xgb_thresh,
    }}
except Exception as e:
    print(f"XGB export error: {{e}}")

# -- HMM --
try:
    # Export ALL feature thresholds with erosion/normal centroids
    _hmm_thresh = {{}}
    for feat in hmm_thresholds:
        _hmm_thresh[feat] = {{
            "value": _safe(round(hmm_thresholds[feat]['threshold'], 3)),
            "direction": hmm_thresholds[feat]['direction'],
            "erosionValue": _safe(round(hmm_thresholds[feat]['erosion_value'], 3)),
            "normalValue": _safe(round(hmm_thresholds[feat]['normal_value'], 3)),
        }}

    _state_dist = []
    _sc = env_features_monthly['HMM_State'].value_counts()
    for st in sorted(_sc.index):
        _er = env_features_monthly[env_features_monthly['HMM_State'] == st]['Erosion_Label'].mean()
        _state_dist.append({{
            "state": f"State {{st}}",
            "count": _safe(int(_sc[st])),
            "percentage": _safe(round(_sc[st] / len(env_features_monthly) * 100, 1)),
            "erosionRate": _safe(round(_er * 100, 1)),
        }})

    # State centroids (all features, original scale)
    _state_centroids = {{}}
    try:
        for i in range(n_states):
            _row = state_means_df.loc[f'State_{{i}}']
            _state_centroids[f"State_{{i}}"] = {{feat: _safe(round(float(_row[feat]), 3)) for feat in model_features if feat in _row.index}}
    except Exception:
        pass

    # Component selection data (BIC/AIC for each n_components)
    _component_selection = []
    try:
        for idx, n in enumerate(n_components_range):
            _component_selection.append({{
                "nComponents": _safe(int(n)),
                "bic": _safe(round(float(bic_scores[idx]), 1)),
                "aic": _safe(round(float(aic_scores[idx]), 1)),
            }})
    except Exception:
        pass

    # Transition matrix export
    _transition_matrix = []
    try:
        for i in range(n_states):
            row = {{}}
            row["from"] = f"S{{i}}"
            for j in range(n_states):
                row[f"S{{j}}"] = _safe(round(float(transition_matrix[i][j]), 4))
            _transition_matrix.append(row)
    except Exception:
        pass

    # Regime stability data
    _regime_stability = {{}}
    try:
        _regime_stability = {{
            "count": _safe(int(len(regime_stability))),
            "mean": _safe(round(float(regime_stability.mean()), 1)),
            "std": _safe(round(float(regime_stability.std()), 1)),
            "min": _safe(int(regime_stability.min())),
            "q25": _safe(int(regime_stability.quantile(0.25))),
            "q50": _safe(int(regime_stability.quantile(0.5))),
            "q75": _safe(int(regime_stability.quantile(0.75))),
            "max": _safe(int(regime_stability.max())),
        }}
    except Exception:
        pass

    # Final-state dominance
    _final_state_dominance = []
    try:
        for state_idx in range(n_states):
            pct = float(final_state_dist.get(state_idx, 0))
            _final_state_dominance.append({{
                "state": f"State {{state_idx}}",
                "value": _safe(round(pct, 2)),
            }})
    except Exception:
        pass

    # State means for all features
    _all_feats = [f for f in model_features if f in env_features_monthly.columns]
    _normal_means = {{}}
    _highRisk_means = {{}}
    for feat in _all_feats:
        try:
            _normal_means[feat] = _safe(round(float(env_features_monthly[env_features_monthly['HMM_State'] != erosion_state][feat].mean()), 3))
            _highRisk_means[feat] = _safe(round(float(env_features_monthly[env_features_monthly['HMM_State'] == erosion_state][feat].mean()), 3))
        except Exception:
            pass

    results["models"] = results.get("models", {{}})
    results["models"]["hmm"] = {{
        "stateDistribution": _state_dist,
        "stateMeans": {{
            "normal": _normal_means,
            "highRisk": _highRisk_means,
        }},
        "stateCentroids": _state_centroids,
        "componentSelection": _component_selection,
        "transitionMatrix": _transition_matrix,
        "regimeStability": _regime_stability,
        "finalStateDominance": _final_state_dominance,
        "erosionState": _safe(int(erosion_state)),
        "metrics": {{
            "nStates": _safe(n_states),
            "accuracy": _safe(round(hmm_accuracy, 4)),
            "logLikelihood": _safe(round(float(hmm_model.score(X_scaled_monthly)), 3)),
            "aic": _safe(round(float(hmm_aic), 3)),
            "bic": _safe(round(float(hmm_bic), 3)),
            "converged": bool(hmm_converged),
            "silhouetteScore": 0,
        }},
        "thresholds": _hmm_thresh,
    }}
except Exception as e:
    print(f"HMM export error: {{e}}")

# 12. Thresholds — final consensus table + model comparison + per-variable comparison
try:
    results["thresholds"] = threshold_export
except Exception:
    results["thresholds"] = None

try:
    results["modelComparison"] = model_comparison.to_dict(orient="records")
except Exception:
    results["modelComparison"] = None

try:
    # Build per-variable threshold comparison with numeric values (not string ranges)
    _thresh_comp = []
    _all_drv = sorted(set(hmm_thresholds.keys()) & set(rf_thresholds.keys()) & set(xgb_thresholds.keys()))
    for _drv in _all_drv:
        _h = hmm_thresholds[_drv]
        _r = rf_thresholds[_drv]
        _x = xgb_thresholds[_drv]
        _thresh_comp.append({{
            "Variable": _drv,
            "HMM_Threshold": _safe(round(_h["threshold"], 4)),
            "HMM_Range_Lower": _safe(round(_h["threshold_lower"], 4)),
            "HMM_Range_Upper": _safe(round(_h["threshold_upper"], 4)),
            "RF_Threshold": _safe(round(_r["threshold"], 4)),
            "RF_Range_Lower": _safe(round(_r["threshold_lower"], 4)),
            "RF_Range_Upper": _safe(round(_r["threshold_upper"], 4)),
            "XGB_Threshold": _safe(round(_x["threshold"], 4)),
            "XGB_Range_Lower": _safe(round(_x["threshold_lower"], 4)),
            "XGB_Range_Upper": _safe(round(_x["threshold_upper"], 4)),
        }})
    results["thresholdComparison"] = _thresh_comp
except Exception:
    results["thresholdComparison"] = None

# 13. Meteorological Threshold Forecasts (SARIMA)
try:
    results["forecasts"] = {{
        "metadata": forecast_metadata,
        "variables": {{}},
    }}
    for _fvar in forecast_export:
        _fdata = forecast_export[_fvar]
        _var_export = {{
            "threshold": _safe(_fdata["threshold"]),
            "thresholdDirection": _fdata["thresholdDirection"],
            "historicalMean": _safe(_fdata["historicalMean"]),
            "historicalStd": _safe(_fdata["historicalStd"]),
            "historicalMin": _safe(_fdata["historicalMin"]),
            "historicalMax": _safe(_fdata["historicalMax"]),
            "riskLevel": _fdata["riskLevel"],
            "model": _fdata["model"],
            "validation": _fdata.get("validation", {{}}),
            "horizons": {{}},
        }}
        for _hkey, _hdata in _fdata["horizons"].items():
            _var_export["horizons"][_hkey] = {{
                "monthly": _hdata["monthly"],
                "avgForecast": _safe(_hdata["avgForecast"]),
                "peakForecast": _safe(_hdata["peakForecast"]),
                "minForecast": _safe(_hdata["minForecast"]),
                "exceedanceMonths": _safe(_hdata["exceedanceMonths"]),
                "exceedancePct": _safe(_hdata["exceedancePct"]),
                "trendPct": _safe(_hdata["trendPct"]),
            }}
        results["forecasts"]["variables"][_fvar] = _var_export
    print(f"✓ Forecast data exported: {{len(forecast_export)}} variables")
except Exception as e:
    print(f"Forecast export error: {{e}}")
    results["forecasts"] = None

# ---- Write JSON ----
os.makedirs(os.path.dirname(_RESULTS_PATH), exist_ok=True)
with open(_RESULTS_PATH, "w") as _f:
    json.dump(results, _f, indent=2, default=str)

# Also copy to frontend public dir
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
