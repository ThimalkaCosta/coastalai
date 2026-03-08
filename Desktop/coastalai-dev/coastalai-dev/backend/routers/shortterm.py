"""
Short-Term Forecasting router – adapted from the friend's standalone backend.
Executes forecasting_gpt.ipynb via Papermill and serves results/downloads.
"""
from pathlib import Path
import json
import os
import uuid
from datetime import datetime, timezone

import papermill as pm
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

from config import PROJECT_ROOT

router = APIRouter()

# ── Paths ──
ST_BASE_DIR = PROJECT_ROOT / "short-term component"
NOTEBOOK = ST_BASE_DIR / "forecasting_gpt.ipynb"
DATA_CACHE = ST_BASE_DIR / "data_cache"
RESULTS_DIR = ST_BASE_DIR / "backend" / "results"
OUTPUT_FORECASTS_DIR = DATA_CACHE / "output_forecasts"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_FORECASTS_DIR.mkdir(parents=True, exist_ok=True)


class ForecastRequest(BaseModel):
    forecastDate: str
    mode: str = "full"  # "quick" = skip download+train, "full" = run everything


# ── Endpoints ──

@router.get("/health")
def health():
    return {
        "ok": True,
        "notebookFound": NOTEBOOK.exists(),
        "dataCacheFound": DATA_CACHE.exists(),
    }


@router.get("/info")
def dataset_info():
    kml_folder = DATA_CACHE / "shorelines_kml"
    kml_files = list(kml_folder.glob("*.kml")) if kml_folder.exists() else []
    forecast_kml_files = list(OUTPUT_FORECASTS_DIR.glob("*forecast*.kml")) if OUTPUT_FORECASTS_DIR.exists() else []
    training_file = DATA_CACHE / "final_training_dataset.csv"
    dataset_file = DATA_CACHE / "final_era5_cmems_daily_features.csv"

    return {
        "beach": {
            "name": "South West Coast Shoreline",
            "region": "South Western Region",
            "dataPoints": len(kml_files),
            "kmlFilesAvailable": len(kml_files),
        },
        "datasets": {
            "era5Available": (DATA_CACHE / "era5_history_1990_2025.csv").exists(),
            "cemsAvailable": (DATA_CACHE / "cmems_wave_reanalysis_1990_2025.nc").exists(),
            "trainingDataReady": training_file.exists(),
            "featuresReady": dataset_file.exists(),
        },
        "forecasts": {
            "generatedKmlFiles": [f.name for f in sorted(forecast_kml_files, reverse=True)[:5]],
            "totalGenerated": len(forecast_kml_files),
        },
        "kmlSourceFiles": [f.name for f in sorted(kml_files)],
    }


ALLOWED_DOWNLOAD_EXTENSIONS = {".kml", ".csv", ".geojson"}


@router.get("/download/{filename}")
def download_file(filename: str):
    # Prevent path traversal
    safe_name = Path(filename).name
    if safe_name != filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    file_path = OUTPUT_FORECASTS_DIR / safe_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    if file_path.suffix.lower() not in ALLOWED_DOWNLOAD_EXTENSIONS:
        raise HTTPException(status_code=403, detail="File type not allowed")
    return FileResponse(path=file_path, filename=safe_name, media_type="application/octet-stream")


@router.post("/run")
def run_notebook(request: ForecastRequest):
    if not NOTEBOOK.exists():
        raise HTTPException(status_code=500, detail="Forecasting notebook not found")

    session = uuid.uuid4().hex[:10]
    out_nb = RESULTS_DIR / f"executed_{session}.ipynb"

    creds_dir = Path.home() / ".copernicusmarine"
    creds_dir.mkdir(exist_ok=True)
    creds_file = creds_dir / ".copernicusmarine-credentials"
    if not creds_file.exists() and os.getenv("CMEMS_USER") and os.getenv("CMEMS_PASS"):
        creds_file.write_text(f"{os.getenv('CMEMS_USER')}\n{os.getenv('CMEMS_PASS')}\n")

    run_mode = request.mode if request.mode in ("quick", "full") else "full"

    if run_mode == "quick":
        missing = []
        if not (DATA_CACHE / "trained_model.pkl").exists():    missing.append("trained_model.pkl")
        if not (DATA_CACHE / "trained_scaler.pkl").exists():   missing.append("trained_scaler.pkl")
        if not (DATA_CACHE / "wave_surr_model.pkl").exists():  missing.append("wave_surr_model.pkl")
        if not (DATA_CACHE / "wave_surr_scaler.pkl").exists(): missing.append("wave_surr_scaler.pkl")
        if not (DATA_CACHE / "final_era5_cmems_daily_features.csv").exists():
            missing.append("final_era5_cmems_daily_features.csv")
        if missing:
            return JSONResponse(
                status_code=400,
                content={
                    "error": (
                        f"Quick Forecast requires cached data and trained models. "
                        f"Missing: {', '.join(missing)}. "
                        f"Please run Full Rerun first."
                    )
                },
            )

    try:
        pm.execute_notebook(
            input_path=str(NOTEBOOK),
            output_path=str(out_nb),
            parameters={
                "DATA_CACHE_PATH": str(DATA_CACHE),
                "FORECAST_DATE": request.forecastDate,
                "RUN_MODE": run_mode,
            },
            kernel_name="python3",
            cwd=str(ST_BASE_DIR),
        )
    except Exception as e:
        error_msg = str(e)
        if "AssertionError" in error_msg:
            for line in error_msg.split("\n"):
                if "AssertionError" in line and "\u274c" in line:
                    error_msg = line.strip()
                    break
        elif "PapermillExecutionError" in error_msg:
            lines = [l.strip() for l in error_msg.split("\n") if l.strip()]
            error_msg = lines[-1] if lines else error_msg
        return JSONResponse(status_code=500, content={"error": error_msg})

    if not out_nb.exists():
        return JSONResponse(
            status_code=500,
            content={"error": "Notebook ran but output file was not produced."},
        )

    return JSONResponse(content=_parse_notebook(out_nb))


def _normalize_output(value):
    if isinstance(value, list):
        return "".join(str(v) for v in value)
    return str(value)


def _parse_notebook(nb_path: Path):
    with open(nb_path, "r", encoding="utf-8") as f:
        nb = json.load(f)

    outputs = []
    for cell_index, cell in enumerate(nb.get("cells", []), start=1):
        if cell.get("cell_type") == "code" and cell.get("outputs"):
            for out in cell["outputs"]:
                out_type = out.get("output_type")
                if out_type in ("display_data", "execute_result"):
                    data = out.get("data", {})
                    if "image/png" in data:
                        outputs.append({"type": "image", "cell": cell_index, "data": _normalize_output(data["image/png"])})
                    elif "application/vnd.plotly.v1+json" in data:
                        outputs.append({"type": "plotly", "cell": cell_index, "data": data["application/vnd.plotly.v1+json"]})
                    elif "text/html" in data:
                        outputs.append({"type": "html", "cell": cell_index, "data": _normalize_output(data["text/html"])})
                    elif "text/plain" in data:
                        text = _normalize_output(data["text/plain"])
                        if text.strip():
                            outputs.append({"type": "text", "cell": cell_index, "data": text})
                elif out_type == "stream":
                    text = _normalize_output(out.get("text", ""))
                    if text.strip():
                        outputs.append({"type": "text", "cell": cell_index, "data": text})
                elif out_type == "error":
                    traceback = _normalize_output(out.get("traceback", ""))
                    text = traceback or f"{out.get('ename', 'Error')}: {out.get('evalue', '')}"
                    if text.strip():
                        outputs.append({"type": "error", "cell": cell_index, "data": text})

    kml_files = sorted(OUTPUT_FORECASTS_DIR.glob("*.kml"), key=lambda p: p.stat().st_mtime, reverse=True)
    seen = set()
    for kml in kml_files:
        if kml.name not in seen:
            outputs.append({"type": "kml_file", "filename": kml.name, "cell": -1})
            seen.add(kml.name)

    stat = nb_path.stat()
    return {
        "status": "success",
        "sourceNotebook": str(nb_path),
        "generatedAt": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
        "outputCount": len(outputs),
        "outputs": outputs,
    }


@router.get("/results")
def latest_results():
    files = sorted(RESULTS_DIR.glob("executed_*.ipynb"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not files:
        return JSONResponse(status_code=404, content={"error": "No results yet. Run a forecast first."})
    return JSONResponse(content=_parse_notebook(files[0]))


@router.get("/latest-stats")
def latest_stats():
    import pandas as pd

    kml_folder = DATA_CACHE / "shorelines_kml"
    env_file = DATA_CACHE / "final_era5_cmems_daily_features.csv"

    stats = {
        "avgWaveHeight": None,
        "avgWindSpeed": None,
        "highRiskZones": None,
        "lastUpdate": None,
        "era5Updated": None,
        "cmemsUpdated": None,
        "latitude": "6.35\u00b0N \u2013 6.42\u00b0N",
        "longitude": "79.97\u00b0E \u2013 80.02\u00b0E",
        "region": "SW Sri Lanka Coast",
        "kmlFilesCount": len(list(kml_folder.glob("*.kml"))) if kml_folder.exists() else 0,
        "transectCount": 100,
    }

    if env_file.exists():
        try:
            df = pd.read_csv(env_file)
            if len(df) > 0:
                latest = df.iloc[-1]
                if "vhm0" in df.columns:
                    stats["avgWaveHeight"] = round(float(latest.get("vhm0", 0)), 2)
                if "wind_speed" in df.columns:
                    stats["avgWindSpeed"] = round(float(latest.get("wind_speed", 0)), 2)
                if "date" in df.columns:
                    stats["lastUpdate"] = str(latest.get("date", ""))
                    stats["era5Updated"] = str(latest.get("date", ""))
                    stats["cmemsUpdated"] = str(latest.get("date", ""))
        except Exception as e:
            print(f"[shortterm] Error reading env file: {e}")

    spike_file = OUTPUT_FORECASTS_DIR / "spike_summary.csv"
    if spike_file.exists():
        try:
            df_s = pd.read_csv(spike_file)
            stats["highRiskZones"] = int(len(df_s))
        except Exception:
            pass

    return stats


@router.get("/latest-risk-data")
def latest_risk_data():
    import pandas as pd

    risk_data = {
        "envConditions": [],
        "eventDays": [],
        "spikeSummary": [],
        "dataStatus": {
            "predicted30Available": False,
            "spikeSummaryAvailable": False,
            "envConditionsAvailable": False,
        },
    }

    # 1. Full 30-day table
    p30_file = OUTPUT_FORECASTS_DIR / "predicted_30days.csv"
    if p30_file.exists():
        try:
            df = pd.read_csv(p30_file)
            risk_data["dataStatus"]["predicted30Available"] = True
            event_days = []
            for i, row in df.iterrows():
                event_days.append({
                    "day": int(row.get("day", i + 1)),
                    "date": str(row.get("date", "")),
                    "waveHeight": float(row.get("vhm0", 0)),
                    "windSpeed": float(row.get("wind_speed", 0)),
                    "windGust": float(row.get("fg10", 0)),
                    "eventScore": float(row.get("event_score", 0)),
                    "isSpike": bool(str(row.get("is_spike", "False")).strip().lower() in ("true", "1", "yes")),
                    "riskLevel": str(row.get("spike_level", "NORMAL")),
                    "mainDrivers": str(row.get("main_drivers", "")),
                })
            risk_data["eventDays"] = event_days[:30]
        except Exception as e:
            print(f"[shortterm] Error reading predicted_30days.csv: {e}")

    # 2. Spike summary
    spike_file = OUTPUT_FORECASTS_DIR / "spike_summary.csv"
    if spike_file.exists():
        try:
            df_s = pd.read_csv(spike_file)
            risk_data["dataStatus"]["spikeSummaryAvailable"] = True
            spikes = []
            for _, row in df_s.iterrows():
                spikes.append({
                    "day": int(row.get("day", 0)),
                    "date": str(row.get("date", "")),
                    "waveHeight": float(row.get("vhm0", 0)),
                    "windSpeed": float(row.get("wind_speed", 0)),
                    "eventScore": float(row.get("event_score", 0)),
                    "riskLevel": str(row.get("spike_level", "SPIKE")),
                    "mainDrivers": str(row.get("main_drivers", "")),
                    "isSpike": True,
                })
            risk_data["spikeSummary"] = spikes
        except Exception as e:
            print(f"[shortterm] Error reading spike_summary.csv: {e}")

    # 3. Environmental conditions
    env_json = OUTPUT_FORECASTS_DIR / "env_conditions.json"
    if env_json.exists():
        try:
            with open(env_json) as f:
                risk_data["envConditions"] = json.load(f)
            risk_data["dataStatus"]["envConditionsAvailable"] = True
        except Exception as e:
            print(f"[shortterm] Error reading env_conditions.json: {e}")
    else:
        env_file = DATA_CACHE / "final_era5_cmems_daily_features.csv"
        if env_file.exists():
            try:
                df_e = pd.read_csv(env_file)
                if len(df_e) > 0:
                    latest = df_e.iloc[-1]
                    NAMES = {
                        "wind_speed": "Wind Speed", "fg10": "Wind Gust",
                        "msl": "Sea Level Pressure", "tp": "Total Precipitation",
                        "vhm0": "Sig. Wave Height", "vtpk": "Wave Peak Period",
                        "vmdr": "Wave Direction", "wave_energy": "Wave Energy",
                    }
                    UNITS = {
                        "wind_speed": "m/s", "fg10": "m/s", "msl": "Pa",
                        "tp": "m/day", "vhm0": "m", "vtpk": "s",
                        "vmdr": "\u00b0", "wave_energy": "m\u00b2",
                    }
                    env_out = []
                    for col in NAMES:
                        if col in df_e.columns:
                            env_out.append({
                                "variable": col,
                                "label": NAMES[col],
                                "mean": round(float(latest.get(col, 0)), 4),
                                "std": round(float(df_e[col].std()), 4),
                                "unit": UNITS.get(col, ""),
                            })
                    risk_data["envConditions"] = env_out
            except Exception as e:
                print(f"[shortterm] Error reading env fallback: {e}")

    return risk_data
