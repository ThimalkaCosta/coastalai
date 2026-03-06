"""
Morphological Notebook Executor Service
Executes thimalka.ipynb via papermill with parameterised file paths,
then extracts results as a single JSON payload for the frontend.
"""
from __future__ import annotations

import json
import os
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

import nbformat
import papermill as pm

from config import (
    FRONTEND_DATA_DIR,
    MORPH_EXECUTED_NOTEBOOKS_DIR,
    MORPH_NOTEBOOK_PATH,
    MORPH_RESULTS_DIR,
    MORPH_UPLOAD_DIR,
)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def execute_morph_analysis(
    data_dir: str,
    events_file: str,
    evaluation_file: str,
) -> dict[str, Any]:
    """
    High-level entry point for morphological analysis.

    1. Inject parameters into thimalka.ipynb.
    2. Execute with papermill.
    3. Return the fully-formed results dict.
    """
    session_id = uuid.uuid4().hex[:12]
    output_nb = MORPH_EXECUTED_NOTEBOOKS_DIR / f"executed_{session_id}.ipynb"
    results_json = MORPH_RESULTS_DIR / f"results_{session_id}.json"

    # ---- 1. Prepare a parameterised copy of the notebook ----
    param_nb = _inject_parameters(
        source_notebook=MORPH_NOTEBOOK_PATH,
        data_dir=data_dir,
        events_file=events_file,
        evaluation_file=evaluation_file,
        results_json_path=str(results_json),
        frontend_data_path=str(FRONTEND_DATA_DIR),
    )

    # ---- 2. Execute the notebook ----
    try:
        pm.execute_notebook(
            str(param_nb),
            str(output_nb),
            kernel_name="python3",
            cwd=str(MORPH_UPLOAD_DIR),
            request_save_on_cell_execute=True,
        )
    except pm.PapermillExecutionError as exc:
        print(f"[morph-executor] Notebook error at cell {exc.cell_index}: {exc.ename}: {exc.evalue}")
    finally:
        if param_nb.exists():
            param_nb.unlink(missing_ok=True)

    # ---- 3. Extract outputs ----
    if results_json.exists():
        with open(results_json, "r") as f:
            analysis_results = json.load(f)
    else:
        analysis_results = _parse_notebook_outputs(output_nb)

    # ---- 4. Copy to frontend public dir ----
    FRONTEND_DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(FRONTEND_DATA_DIR / "morph_analysis_results.json", "w") as f:
        json.dump(analysis_results, f, indent=2, default=str)

    analysis_results["_meta"] = {
        "sessionId": session_id,
        "executedAt": datetime.utcnow().isoformat(),
        "notebookPath": str(output_nb),
    }

    return analysis_results


# ---------------------------------------------------------------------------
# Notebook parameterisation
# ---------------------------------------------------------------------------

def _inject_parameters(
    source_notebook: Path,
    data_dir: str,
    events_file: str,
    evaluation_file: str,
    results_json_path: str,
    frontend_data_path: str,
) -> Path:
    """
    Read thimalka.ipynb, replace hard-coded paths with uploaded ones,
    and append a comprehensive JSON-export cell.
    """
    nb = nbformat.read(str(source_notebook), as_version=4)

    # --- Replace the data_dir path in the CSV-loading cell ---
    for cell in nb.cells:
        if cell.cell_type != "code":
            continue
        src = cell.source
        # Replace: data_dir = Path("/research-dataset")
        if "data_dir" in src and "Path(" in src and "csv_files" in src:
            cell.source = re.sub(
                r'data_dir\s*=\s*Path\(["\'][^"\']*["\']\)',
                lambda _: f'data_dir = Path(r"{data_dir}")',
                src,
            )
            break

    # --- Replace events.xlsx path ---
    for cell in nb.cells:
        if cell.cell_type != "code":
            continue
        if "events.xlsx" in cell.source and "read_excel" in cell.source:
            cell.source = re.sub(
                r"""pd\.read_excel\(['"]/research-dataset/events\.xlsx['"]\)""",
                lambda _: f"pd.read_excel(r'{events_file}')",
                cell.source,
            )
            # Also handle other quote style
            cell.source = re.sub(
                r'pd\.read_excel\([\'"].*?events\.xlsx[\'"]\)',
                lambda _: f"pd.read_excel(r'{events_file}')",
                cell.source,
            )

    # --- Replace evaluation.xlsx path ---
    for cell in nb.cells:
        if cell.cell_type != "code":
            continue
        if "evaluation.xlsx" in cell.source and "read_excel" in cell.source:
            cell.source = re.sub(
                r'pd\.read_excel\([\'"].*?evaluation\.xlsx[\'"]\)',
                lambda _: f"pd.read_excel(r'{evaluation_file}')",
                cell.source,
            )

    # --- Switch matplotlib to non-interactive backend ---
    for cell in nb.cells:
        if cell.cell_type != "code":
            continue
        if "import matplotlib.pyplot as plt" in cell.source:
            cell.source = "import matplotlib\nmatplotlib.use('Agg')\n" + cell.source
            break

    # --- Remove pip install commands ---
    for cell in nb.cells:
        if cell.cell_type != "code":
            continue
        if "!pip install" in cell.source:
            cell.source = "# pip installs removed for server execution\npass"

    # --- Remove Google Colab drive mount ---
    for cell in nb.cells:
        if cell.cell_type != "code":
            continue
        if "google.colab" in cell.source or "drive.mount" in cell.source:
            cell.source = "# Colab mount removed for server execution\npass"

    # --- Fix pandas 3.x compatibility ---
    for cell in nb.cells:
        if cell.cell_type != "code":
            continue
        if ".fillna(method=" in cell.source:
            cell.source = cell.source.replace(
                ".fillna(method='ffill')", ".ffill()"
            ).replace(
                ".fillna(method='bfill')", ".bfill()"
            )

    # --- Append the export cell ---
    export_cell_source = _build_export_cell(results_json_path, frontend_data_path)
    export_cell = nbformat.v4.new_code_cell(source=export_cell_source)
    export_cell.metadata["tags"] = ["export"]
    nb.cells.append(export_cell)

    param_path = MORPH_EXECUTED_NOTEBOOKS_DIR / f"param_{uuid.uuid4().hex[:8]}.ipynb"
    nbformat.write(nb, str(param_path))
    return param_path


def _build_export_cell(results_json_path: str, frontend_data_path: str) -> str:
    """Return Python source for the final export cell that writes
    morph_analysis_results.json with all morphological analysis data."""
    return f'''
# =============================================================================
# AUTO-GENERATED: Morphological analysis JSON export for frontend
# =============================================================================
import json, os, numpy as np

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

results = {{}}

# ── 1. HMM Thresholds (erosion state means in original scale) ──
try:
    _hmm_thresholds = {{}}
    for col_idx, col in enumerate(feature_cols):
        _hmm_thresholds[col] = {{
            "value": _safe(round(float(threshold_df.iloc[0, col_idx]), 4)),
        }}
    results["hmmThresholds"] = _hmm_thresholds
except Exception as e:
    print(f"HMM threshold export error: {{e}}")
    results["hmmThresholds"] = None

# ── 2. Current vs Threshold Comparison ──
try:
    _comparison = []
    for feat in comparison.index:
        _comparison.append({{
            "variable": feat,
            "currentValue": _safe(round(float(comparison.loc[feat, "Current_Value"]), 4)),
            "thresholdValue": _safe(round(float(comparison.loc[feat, "Threshold_Value"]), 4)),
            "gap": _safe(round(float(comparison.loc[feat, "Gap"]), 4)),
        }})
    results["thresholdComparison"] = _comparison
except Exception as e:
    print(f"Comparison export error: {{e}}")
    results["thresholdComparison"] = None

# ── 3. HMM State Means (scaled space) ──
try:
    _state_means = {{}}
    for i in range(hmm.n_components):
        _row = scaler.inverse_transform(hmm.means_[i].reshape(1, -1))[0]
        _state_means[f"State_{{i}}"] = {{}}
        for col_idx, col in enumerate(feature_cols):
            _state_means[f"State_{{i}}"][col] = _safe(round(float(_row[col_idx]), 4))
    results["stateMeans"] = _state_means
except Exception as e:
    print(f"State means export error: {{e}}")
    results["stateMeans"] = None

# ── 4. Transition Matrix ──
try:
    _trans = []
    for i in range(hmm.n_components):
        _row = {{"from": f"S{{i}}"}}
        for j in range(hmm.n_components):
            _row[f"S{{j}}"] = _safe(round(float(hmm.transmat_[i][j]), 4))
        _trans.append(_row)
    results["transitionMatrix"] = _trans
except Exception as e:
    print(f"Transition matrix export error: {{e}}")
    results["transitionMatrix"] = None

# ── 5. State Distribution / Label Map ──
try:
    _state_dist = []
    for state in range(hmm.n_components):
        label_dist = state_label_map[state]
        _state_dist.append({{
            "state": f"State {{state}}",
            "erosionPct": _safe(round(float(label_dist.get("erosion", 0)) * 100, 1)),
            "normalPct": _safe(round(float(label_dist.get("normal", 0)) * 100, 1)),
            "isErosionState": state == erosion_state,
        }})
    results["stateDistribution"] = _state_dist
except Exception as e:
    print(f"State distribution export error: {{e}}")
    results["stateDistribution"] = None

# ── 6. Erosion State Info ──
try:
    results["erosionState"] = {{
        "stateIndex": _safe(int(erosion_state)),
        "transitionProb": _safe(round(float(erosion_transition_prob), 4)),
    }}
except Exception as e:
    results["erosionState"] = None

# ── 7. Regime Stability ──
try:
    _stability = {{
        "switchCounts": [_safe(int(s)) for s in switch_counts],
        "mean": _safe(round(float(np.mean(switch_counts)), 2)),
        "std": _safe(round(float(np.std(switch_counts)), 2)),
        "min": _safe(int(np.min(switch_counts))),
        "max": _safe(int(np.max(switch_counts))),
    }}
    results["regimeStability"] = _stability
except Exception as e:
    results["regimeStability"] = None

# ── 8. Seasonal Alignment ──
try:
    _seasonal = []
    _ct = pd.crosstab(state_month_df["Month"], state_month_df["State"])
    for month in sorted(_ct.index):
        _row = {{"month": _safe(int(month))}}
        for state in _ct.columns:
            _row[f"State_{{state}}"] = _safe(int(_ct.loc[month, state]))
        _seasonal.append(_row)
    results["seasonalAlignment"] = _seasonal
except Exception as e:
    results["seasonalAlignment"] = None

# ── 9. Final State Dominance ──
try:
    _fsd = pd.Series(final_states).value_counts(normalize=True)
    results["finalStateDominance"] = [
        {{"state": f"State {{k}}", "percentage": _safe(round(float(v) * 100, 1))}}
        for k, v in _fsd.items()
    ]
except Exception as e:
    results["finalStateDominance"] = None

# ── 10. CVI (Coastal Vulnerability Index) ──
try:
    _latest = df.loc[df["Year"].idxmax()]
    _v1 = _latest["Elevation AVG m"]
    _v2 = _latest["Elevation Gain m"]
    _v3 = _latest["Elevation Loss m"]
    _v4 = _latest["AVG Slope steepest upward (%)"]
    _v5 = _latest["AVG Slope steepest downward (%)"]
    _cvi_score = CVI(_v1, _v2, _v3, _v4, _v5)

    _interval = (upper_bound - lower_bound) / 4
    _r1 = lower_bound + _interval
    _r2 = lower_bound + 2 * _interval
    _r3 = lower_bound + 3 * _interval

    if _cvi_score <= _r1:
        _cvi_level = "Very low"
    elif _cvi_score <= _r2:
        _cvi_level = "Low"
    elif _cvi_score <= _r3:
        _cvi_level = "Moderate"
    else:
        _cvi_level = "High"

    results["cvi"] = {{
        "score": _safe(round(float(_cvi_score), 4)),
        "vulnerability": _cvi_level,
        "year": _safe(int(_latest["Year"])),
        "upperBound": _safe(round(float(upper_bound), 4)),
        "lowerBound": _safe(round(float(lower_bound), 4)),
        "ranges": {{
            "veryLow": [_safe(round(float(lower_bound), 4)), _safe(round(float(_r1), 4))],
            "low": [_safe(round(float(_r1), 4)), _safe(round(float(_r2), 4))],
            "moderate": [_safe(round(float(_r2), 4)), _safe(round(float(_r3), 4))],
            "high": [_safe(round(float(_r3), 4)), _safe(round(float(upper_bound), 4))],
        }},
        "components": {{
            "elevationAvg": _safe(round(float(_v1), 4)),
            "elevationGain": _safe(round(float(_v2), 4)),
            "elevationLoss": _safe(round(float(_v3), 4)),
            "slopeUp": _safe(round(float(_v4), 4)),
            "slopeDown": _safe(round(float(_v5), 4)),
        }},
    }}
except Exception as e:
    print(f"CVI export error: {{e}}")
    results["cvi"] = None

# ── 11. Annual Morphological Data ──
try:
    _annual = []
    for _, row in annual_df.iterrows():
        _annual.append({{
            "year": _safe(int(row["Year"])),
            "elevationAvg": _safe(round(float(row["Elevation AVG m"]), 4)),
            "elevationGain": _safe(round(float(row["Elevation Gain m"]), 4)),
            "elevationLoss": _safe(round(float(row["Elevation Loss m"]), 4)),
            "slopeUp": _safe(round(float(row["AVG Slope steepest upward (%)"]), 4)),
            "slopeDown": _safe(round(float(row["AVG Slope steepest downward (%)"]), 4)),
        }})
    results["annualData"] = _annual
except Exception as e:
    results["annualData"] = None

# ── 12. Forecasts (VECM vs Linear Trend) ──
try:
    results["forecasts"] = {{
        "vecm": {{
            "year": 2026,
            "values": {{col: _safe(round(float(vecm_2026[col].iloc[0]), 4)) for col in vecm_2026.columns}},
            "rmse": _safe(round(float(vecm_rmse), 4)),
        }},
        "linearTrend": {{
            "year": 2026,
            "values": {{col: _safe(round(float(trend_2026[col].iloc[0]), 4)) for col in trend_2026.columns}},
            "rmse": _safe(round(float(trend_rmse), 4)),
        }},
        "bestModel": "VECM" if vecm_rmse < trend_rmse else "Linear Trend",
    }}
except Exception as e:
    print(f"Forecast export error: {{e}}")
    results["forecasts"] = None

# ── 13. CVI for Forecasted Values ──
try:
    _best = vecm_2026 if vecm_rmse < trend_rmse else trend_2026
    _fv1 = float(_best["Elevation AVG m"].iloc[0])
    _fv2 = float(_best["Elevation Gain m"].iloc[0])
    _fv3 = float(_best["Elevation Loss m"].iloc[0])
    _fv4 = float(_best["AVG Slope steepest upward (%)"].iloc[0])
    _fv5 = float(_best["AVG Slope steepest downward (%)"].iloc[0])
    _fcvi = CVI(_fv1, _fv2, _fv3, _fv4, _fv5)

    _interval = (upper_bound - lower_bound) / 4
    _r1 = lower_bound + _interval
    _r2 = lower_bound + 2 * _interval
    _r3 = lower_bound + 3 * _interval
    if _fcvi <= _r1:
        _flevel = "Very low"
    elif _fcvi <= _r2:
        _flevel = "Low"
    elif _fcvi <= _r3:
        _flevel = "Moderate"
    else:
        _flevel = "High"

    results["forecastCvi"] = {{
        "score": _safe(round(float(_fcvi), 4)),
        "vulnerability": _flevel,
        "year": 2026,
        "components": {{
            "elevationAvg": _safe(round(float(_fv1), 4)),
            "elevationGain": _safe(round(float(_fv2), 4)),
            "elevationLoss": _safe(round(float(_fv3), 4)),
            "slopeUp": _safe(round(float(_fv4), 4)),
            "slopeDown": _safe(round(float(_fv5), 4)),
        }},
    }}
except Exception as e:
    print(f"Forecast CVI error: {{e}}")
    results["forecastCvi"] = None

# ── 14. Environmental Variables Summary ──
try:
    _env_summary = {{}}
    for col in feature_cols:
        _env_summary[col] = {{
            "mean": _safe(round(float(merged_df[col].mean()), 4)),
            "std": _safe(round(float(merged_df[col].std()), 4)),
            "min": _safe(round(float(merged_df[col].min()), 4)),
            "max": _safe(round(float(merged_df[col].max()), 4)),
        }}
    results["envSummary"] = _env_summary
except Exception as e:
    results["envSummary"] = None

# ── 15. Stationarity Test Results ──
try:
    results["stationarity"] = {{
        "adfResults": [
            {{
                "variable": r["Variable"],
                "adfStatistic": _safe(round(float(r["ADF Statistic"]), 4)),
                "pValue": _safe(round(float(r["p-value"]), 4)),
                "stationary": bool(r["Stationary (p<0.05)"]),
            }}
            for _, r in adf_df.iterrows()
        ]
    }}
except Exception as e:
    results["stationarity"] = None

# ── Write JSON ──
os.makedirs(os.path.dirname(_RESULTS_PATH), exist_ok=True)
with open(_RESULTS_PATH, "w") as _f:
    json.dump(results, _f, indent=2, default=str)

os.makedirs(_FRONTEND_PATH, exist_ok=True)
with open(os.path.join(_FRONTEND_PATH, "morph_analysis_results.json"), "w") as _f:
    json.dump(results, _f, indent=2, default=str)

print(f"✓ Morphological results exported to {{_RESULTS_PATH}}")
print(f"✓ Results copied to {{_FRONTEND_PATH}}/morph_analysis_results.json")
'''


# ---------------------------------------------------------------------------
# Fallback output parsing
# ---------------------------------------------------------------------------

def _parse_notebook_outputs(notebook_path: Path) -> dict[str, Any]:
    """Walk the executed notebook and harvest cell outputs as fallback."""
    if not notebook_path.exists():
        return {"error": "Executed notebook not found", "cells": []}

    nb = nbformat.read(str(notebook_path), as_version=4)
    cells_data: list[dict] = []

    for idx, cell in enumerate(nb.cells):
        if cell.cell_type != "code":
            continue
        cell_result: dict[str, Any] = {"cellIndex": idx, "outputs": []}
        for output in cell.get("outputs", []):
            otype = output.get("output_type")
            if otype == "stream":
                cell_result["outputs"].append({"type": "text", "content": output.get("text", "")})
            elif otype in ("display_data", "execute_result"):
                data = output.get("data", {})
                if "text/html" in data:
                    cell_result["outputs"].append({"type": "html", "content": data["text/html"]})
                if "image/png" in data:
                    cell_result["outputs"].append({"type": "image", "content": data["image/png"]})
            elif otype == "error":
                cell_result["outputs"].append({
                    "type": "error", "ename": output.get("ename", ""), "evalue": output.get("evalue", ""),
                })
        if cell_result["outputs"]:
            cells_data.append(cell_result)

    return {"cells": cells_data, "totalCells": len(nb.cells)}
