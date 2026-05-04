"""
Analysis router – file upload + notebook execution endpoints.
"""
from __future__ import annotations

import json
import os
import shutil
import traceback
import uuid
from pathlib import Path

from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse

from config import (
    FRONTEND_DATA_DIR,
    NOTEBOOK_CURRENT_FILE,
    NOTEBOOK_DATA_DIR,
    NOTEBOOK_WAVE_FILE,
    NOTEBOOK_WIND_FILE,
    RESULTS_DIR,
    UPLOAD_DIR,
)
from services.notebook_executor import execute_analysis

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /api/analyze  –  run the notebook using fixed notebook_data inputs
# ---------------------------------------------------------------------------
@router.post("/analyze")
async def analyze():
    """
    Executes the analysis notebook using pre-existing files in notebook_data.
    Frontend uploads are display-only and are not used by this endpoint.
    """
    if not NOTEBOOK_DATA_DIR.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Notebook data folder not found: {NOTEBOOK_DATA_DIR}",
        )

    shoreline_files = sorted(NOTEBOOK_DATA_DIR.glob("*-stat.csv"))
    if not shoreline_files:
        raise HTTPException(
            status_code=500,
            detail=f"No DSAS interval CSV files found in {NOTEBOOK_DATA_DIR}",
        )

    for required in [NOTEBOOK_WAVE_FILE, NOTEBOOK_WIND_FILE, NOTEBOOK_CURRENT_FILE]:
        if not required.exists():
            raise HTTPException(
                status_code=500,
                detail=f"Required notebook input missing: {required.name}",
            )

    # ---- Execute notebook ----
    try:
        results = execute_analysis(
            shoreline_file=str(shoreline_files[0]),
            wave_file=str(NOTEBOOK_WAVE_FILE),
            wind_file=str(NOTEBOOK_WIND_FILE),
            current_file=str(NOTEBOOK_CURRENT_FILE),
        )
        return JSONResponse(content=results)
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Analysis execution failed: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# GET /api/results  –  return the most recent analysis_results.json
# ---------------------------------------------------------------------------
@router.get("/results")
async def get_results():
    """Return the latest analysis results (from frontend public dir or results dir)."""
    # Try frontend data dir first
    frontend_json = FRONTEND_DATA_DIR / "analysis_results.json"
    if frontend_json.exists():
        with open(frontend_json, "r") as f:
            return JSONResponse(content=json.load(f))

    # Try results dir (most recent)
    result_files = sorted(RESULTS_DIR.glob("results_*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    if result_files:
        with open(result_files[0], "r") as f:
            return JSONResponse(content=json.load(f))

    raise HTTPException(status_code=404, detail="No analysis results found. Run the analysis first.")


# ---------------------------------------------------------------------------
# POST /api/upload  –  upload files only (no execution)
# ---------------------------------------------------------------------------
@router.post("/upload")
async def upload_files(
    shoreline: List[UploadFile] = File(None),
    wave: UploadFile = File(None),
    wind: UploadFile = File(None),
    current: UploadFile = File(None),
):
    """Upload individual files without triggering analysis."""
    saved = {}
    if shoreline:
        csv_dir = UPLOAD_DIR / "dsas_staged"
        csv_dir.mkdir(parents=True, exist_ok=True)
        csv_names = []
        for upload in shoreline:
            dest = csv_dir / upload.filename
            content = await upload.read()
            if dest.exists():
                try:
                    os.remove(dest)
                except OSError:
                    stem = dest.stem
                    suffix = dest.suffix
                    dest = csv_dir / f"{stem}_{uuid.uuid4().hex[:8]}{suffix}"
            dest.write_bytes(content)
            csv_names.append(dest.name)
        saved["shoreline"] = {"files": csv_names, "count": len(csv_names)}

    for label, upload in [("wave", wave), ("wind", wind), ("current", current)]:
        if upload is not None:
            dest = UPLOAD_DIR / upload.filename
            content = await upload.read()
            if dest.exists():
                try:
                    os.remove(dest)
                except OSError:
                    stem = dest.stem
                    suffix = dest.suffix
                    dest = UPLOAD_DIR / f"{stem}_{uuid.uuid4().hex[:8]}{suffix}"
            dest.write_bytes(content)
            saved[label] = {"filename": dest.name, "size": dest.stat().st_size}
    return {"uploaded": saved}


# ---------------------------------------------------------------------------
# DELETE /api/results  –  clear all analysis results
# ---------------------------------------------------------------------------
@router.delete("/results")
async def clear_results():
    """Delete all analysis result files so the frontend starts fresh."""
    deleted = []
    # Clear frontend public data
    frontend_json = FRONTEND_DATA_DIR / "analysis_results.json"
    if frontend_json.exists():
        frontend_json.unlink()
        deleted.append(str(frontend_json))
    # Clear backend results
    if RESULTS_DIR.exists():
        for f in RESULTS_DIR.glob("results_*.json"):
            f.unlink()
            deleted.append(str(f))
    return {"cleared": len(deleted), "files": deleted}


# ---------------------------------------------------------------------------
# GET /api/analyze/status  –  check if backend is ready
# ---------------------------------------------------------------------------
@router.get("/analyze/status")
async def analysis_status():
    """Check if a previous analysis result exists."""
    frontend_json = FRONTEND_DATA_DIR / "analysis_results.json"
    has_results = frontend_json.exists()
    return {
        "hasResults": has_results,
        "dataSource": str(NOTEBOOK_DATA_DIR),
        "uploadsDir": str(UPLOAD_DIR),
        "filesInUploads": [f.name for f in UPLOAD_DIR.iterdir() if f.is_file()] if UPLOAD_DIR.exists() else [],
    }


# ---------------------------------------------------------------------------
# GET /api/figures/{filename}  –  serve a generated figure
# ---------------------------------------------------------------------------
@router.get("/figures/{filename}")
async def get_figure(filename: str):
    """Serve a figure PNG generated by the notebook."""
    # Sanitise filename to prevent path traversal
    safe_name = Path(filename).name
    figure_path = UPLOAD_DIR / "figures" / safe_name
    if not figure_path.exists() or not figure_path.is_file():
        raise HTTPException(status_code=404, detail=f"Figure '{safe_name}' not found")
    return FileResponse(str(figure_path), media_type="image/png")


# ---------------------------------------------------------------------------
# GET /api/figures  –  list available figures
# ---------------------------------------------------------------------------
@router.get("/figures")
async def list_figures():
    """List all available figures generated by the notebook."""
    figures_dir = UPLOAD_DIR / "figures"
    if not figures_dir.exists():
        return {"figures": []}
    return {
        "figures": sorted([
            f.name for f in figures_dir.iterdir()
            if f.is_file() and f.suffix.lower() in ('.png', '.jpg', '.jpeg', '.svg')
        ])
    }


# ---------------------------------------------------------------------------
# GET /api/outputs/{filename}  –  serve an output CSV as JSON
# ---------------------------------------------------------------------------
@router.get("/outputs/{filename}")
async def get_output_csv(filename: str):
    """Serve a notebook output CSV file as JSON records."""
    import pandas as pd
    safe_name = Path(filename).name
    csv_path = UPLOAD_DIR / "outputs" / safe_name
    if not csv_path.exists() or not csv_path.is_file():
        raise HTTPException(status_code=404, detail=f"Output '{safe_name}' not found")
    try:
        df = pd.read_csv(str(csv_path))
        return JSONResponse(content={"filename": safe_name, "data": df.to_dict(orient="records"), "columns": list(df.columns), "rows": len(df)})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSV: {e}")


# ---------------------------------------------------------------------------
# GET /api/outputs  –  list available output CSV files
# ---------------------------------------------------------------------------
@router.get("/outputs")
async def list_outputs():
    """List all available output CSV files."""
    outputs_dir = UPLOAD_DIR / "outputs"
    if not outputs_dir.exists():
        return {"outputs": []}
    return {
        "outputs": sorted([
            f.name for f in outputs_dir.iterdir()
            if f.is_file() and f.suffix.lower() == '.csv'
        ])
    }
