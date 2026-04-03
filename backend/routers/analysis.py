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

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse

from config import FRONTEND_DATA_DIR, RESULTS_DIR, UPLOAD_DIR
from services.notebook_executor import execute_analysis

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /api/analyze  –  upload 4 files & run the notebook
# ---------------------------------------------------------------------------
@router.post("/analyze")
async def analyze(
    shoreline: UploadFile = File(..., description="all_stat.csv"),
    wave: UploadFile = File(..., description="Wave NetCDF file"),
    wind: UploadFile = File(..., description="Wind NetCDF file"),
    current: UploadFile = File(..., description="Current NetCDF file"),
):
    """
    Accepts four files, saves them to the upload directory,
    executes the analysis notebook, and returns the full results JSON.
    """
    # ---- Save uploaded files ----
    saved_paths: dict[str, str] = {}
    try:
        for label, upload in [
            ("shoreline", shoreline),
            ("wave", wave),
            ("wind", wind),
            ("current", current),
        ]:
            dest = UPLOAD_DIR / upload.filename
            content = await upload.read()
            # On Windows, remove existing file first to avoid lock conflicts
            if dest.exists():
                try:
                    os.remove(dest)
                except OSError:
                    # File is locked; use a unique name instead
                    stem = dest.stem
                    suffix = dest.suffix
                    dest = UPLOAD_DIR / f"{stem}_{uuid.uuid4().hex[:8]}{suffix}"
            dest.write_bytes(content)
            saved_paths[label] = str(dest)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"File save error: {exc}")

    # ---- Execute notebook ----
    try:
        results = execute_analysis(
            shoreline_file=saved_paths["shoreline"],
            wave_file=saved_paths["wave"],
            wind_file=saved_paths["wind"],
            current_file=saved_paths["current"],
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
    shoreline: UploadFile = File(None),
    wave: UploadFile = File(None),
    wind: UploadFile = File(None),
    current: UploadFile = File(None),
):
    """Upload individual files without triggering analysis."""
    saved = {}
    for label, upload in [
        ("shoreline", shoreline),
        ("wave", wave),
        ("wind", wind),
        ("current", current),
    ]:
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
