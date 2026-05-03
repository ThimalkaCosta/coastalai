"""
Long-Term Forecasting router – serves results from
Coastal_Erosion_Forecast_Standalone.ipynb (pre-generated outputs in output/).
Also supports re-running the notebook via Papermill for a new target year.
"""
from pathlib import Path
import csv
import json
import re
import uuid

import papermill as pm
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from config import PROJECT_ROOT

router = APIRouter()

# ── Paths ──
NOTEBOOK = PROJECT_ROOT / "Coastal_Erosion_Forecast_Standalone.ipynb"
OUTPUT_DIR = PROJECT_ROOT / "output"
DATA_DIR = PROJECT_ROOT / "data"
LT_EXECUTED_DIR = PROJECT_ROOT / "backend" / "executed_notebooks" / "longterm"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
LT_EXECUTED_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".png", ".csv", ".txt", ".kml"}

# ── Helpers ──

def _detect_years():
    """Scan the output folder and return a sorted list of forecast years."""
    years = set()
    for f in OUTPUT_DIR.iterdir():
        m = re.search(r"_(\d{4})\.", f.name)
        if m:
            years.add(int(m.group(1)))
    return sorted(years, reverse=True)


def _parse_summary(year: int) -> dict | None:
    path = OUTPUT_DIR / f"land_change_summary_{year}.txt"
    if not path.exists():
        return None
    text = path.read_text()
    info = {"raw": text, "year": year}
    for line in text.splitlines():
        if "Total Land Loss:" in line:
            m = re.search(r"([\d,]+\.\d+)\s*m2.*\(([\d.]+)\s*ha\)", line)
            if m:
                info["totalLossM2"] = float(m.group(1).replace(",", ""))
                info["totalLossHa"] = float(m.group(2))
        elif "Total Land Gain:" in line:
            m = re.search(r"([\d,]+\.\d+)\s*m2.*\(([\d.]+)\s*ha\)", line)
            if m:
                info["totalGainM2"] = float(m.group(1).replace(",", ""))
                info["totalGainHa"] = float(m.group(2))
        elif "Net Change:" in line:
            m = re.search(r"([\d,]+\.\d+)\s*m2\s*(GAIN|LOSS)", line)
            if m:
                info["netChangeM2"] = float(m.group(1).replace(",", ""))
                info["netDirection"] = m.group(2)
        elif "Erosion Segments:" in line:
            m = re.search(r"(\d+)/(\d+)", line)
            if m:
                info["erosionSegments"] = int(m.group(1))
                info["totalSegments"] = int(m.group(2))
        elif "Accretion Segments:" in line:
            m = re.search(r"(\d+)/(\d+)", line)
            if m:
                info["accretionSegments"] = int(m.group(1))
        elif "Model:" in line:
            info["model"] = line.split(":", 1)[1].strip()
        elif "->" in line:
            parts = line.split("->")
            if len(parts) == 2:
                info["baselineDate"] = parts[0].replace("Land Change Analysis:", "").strip()
    return info


def _parse_detail_csv(year: int) -> list[dict] | None:
    path = OUTPUT_DIR / f"land_change_detail_{year}.csv"
    if not path.exists():
        return None
    rows = []
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append({
                "segment": row.get("Segment", ""),
                "category": row.get("Category", ""),
                "areaM2": float(row.get("Area_m2", 0)),
                "areaHa": float(row.get("Area_hectares", 0)),
                "avgShiftM": float(row.get("Avg_Shift_m", 0)),
                "segmentLengthM": float(row.get("Segment_Length_m", 0)),
                "signedAreaM2": float(row.get("Signed_Area_m2", 0)),
            })
    return rows


# ── Endpoints ──

@router.get("/health")
def health():
    return {
        "ok": True,
        "notebookFound": NOTEBOOK.exists(),
        "outputDirFound": OUTPUT_DIR.exists(),
        "dataDirFound": DATA_DIR.exists(),
    }


@router.get("/years")
def available_years():
    """Return list of forecast years that have output files."""
    return {"years": _detect_years()}


@router.get("/results/{year}")
def get_results(year: int):
    """Return all results for a given forecast year."""
    if year < 2000 or year > 2200:
        raise HTTPException(status_code=400, detail="Invalid year")

    summary = _parse_summary(year)
    detail = _parse_detail_csv(year)

    # Collect available output files for this year
    files = {}
    for key, pattern in [
        ("trendPlot", f"trend_forecast_{year}.png"),
        ("mapPlot", f"map_forecast_{year}.png"),
        ("landChangePlot", f"land_change_{year}.png"),
        ("forecastKml", f"forecast_{year}.kml"),
        ("forecastDataCsv", f"forecast_data_{year}.csv"),
        ("landChangeDetailCsv", f"land_change_detail_{year}.csv"),
        ("landChangeSummaryTxt", f"land_change_summary_{year}.txt"),
    ]:
        files[key] = (OUTPUT_DIR / pattern).exists()

    return {
        "year": year,
        "summary": summary,
        "segments": detail,
        "files": files,
    }


@router.get("/image/{filename}")
def serve_image(filename: str):
    """Serve a PNG image from the output directory."""
    safe_name = Path(filename).name
    if safe_name != filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    file_path = OUTPUT_DIR / safe_name
    if not file_path.exists() or file_path.suffix.lower() != ".png":
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(path=file_path, media_type="image/png")


@router.get("/kml/{filename}")
def serve_kml(filename: str):
    """Serve a KML file from the data/kml directory."""
    safe_name = Path(filename).name
    if safe_name != filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    file_path = DATA_DIR / "kml" / safe_name
    if not file_path.exists() or file_path.suffix.lower() != ".kml":
        raise HTTPException(status_code=404, detail="KML file not found")
    return FileResponse(path=file_path, media_type="application/vnd.google-earth.kml+xml")


@router.get("/download/{filename}")
def download_file(filename: str):
    """Download a CSV, TXT, or KML file from the output directory."""
    safe_name = Path(filename).name
    if safe_name != filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    file_path = OUTPUT_DIR / safe_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    if file_path.suffix.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=403, detail="File type not allowed")
    return FileResponse(
        path=file_path, filename=safe_name, media_type="application/octet-stream"
    )


class RunRequest(BaseModel):
    targetYear: int
    modelType: str = "Ensemble"


@router.post("/run")
def run_forecast(req: RunRequest):
    """Re-run the notebook for a new target year via Papermill."""
    if not NOTEBOOK.exists():
        raise HTTPException(status_code=500, detail="Notebook not found")

    if req.targetYear < 2026 or req.targetYear > 2100:
        raise HTTPException(
            status_code=400, detail="Target year must be between 2026 and 2100"
        )

    allowed_models = {
        "LinearRegression", "WeightedLR", "Polynomial_2", "Ridge", "Ensemble"
    }
    if req.modelType not in allowed_models:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model. Choose from: {', '.join(sorted(allowed_models))}",
        )

    session = uuid.uuid4().hex[:10]
    out_nb = LT_EXECUTED_DIR / f"executed_{session}.ipynb"

    try:
        pm.execute_notebook(
            input_path=str(NOTEBOOK),
            output_path=str(out_nb),
            parameters={
                "TARGET_YEAR": req.targetYear,
                "MODEL_TYPE": req.modelType,
                "KML_DIR": str(DATA_DIR / "kml"),
                "OUTPUT_DIR": str(OUTPUT_DIR),
                "DATA_DIR": str(DATA_DIR),
                "ANALYSIS_DIR": str(DATA_DIR / "analysis"),
            },
            kernel_name="python3",
            cwd=str(PROJECT_ROOT),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Notebook execution failed: {e}")

    results = get_results(req.targetYear)
    results["executedNotebook"] = out_nb.name
    return results
