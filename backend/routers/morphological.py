"""
Morphological analysis router – file upload + notebook execution endpoints.
"""
from __future__ import annotations

import json
import shutil
import traceback
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from config import FRONTEND_DATA_DIR, MORPH_RESULTS_DIR, MORPH_UPLOAD_DIR
from services.morph_notebook_executor import execute_morph_analysis

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /api/morphological/analyze
# ---------------------------------------------------------------------------
@router.post("/analyze")
async def morph_analyze(
    events: UploadFile = File(..., description="events.xlsx"),
    evaluation: UploadFile = File(..., description="evaluation.xlsx"),
    env_files: list[UploadFile] = File(..., description="Environmental CSV files"),
):
    """
    Accepts events.xlsx, evaluation.xlsx, and multiple environmental CSV files.
    Saves them and executes thimalka.ipynb.
    """
    # ---- Save uploaded files ----
    saved: dict[str, str] = {}
    csv_dir = MORPH_UPLOAD_DIR / "csv_data"
    csv_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Save events file
        events_dest = MORPH_UPLOAD_DIR / events.filename
        with open(events_dest, "wb") as f:
            shutil.copyfileobj(events.file, f)
        saved["events"] = str(events_dest)

        # Save evaluation file
        eval_dest = MORPH_UPLOAD_DIR / evaluation.filename
        with open(eval_dest, "wb") as f:
            shutil.copyfileobj(evaluation.file, f)
        saved["evaluation"] = str(eval_dest)

        # Save env CSV files into csv_data subdirectory
        for upload in env_files:
            dest = csv_dir / upload.filename
            with open(dest, "wb") as f:
                shutil.copyfileobj(upload.file, f)
            saved[upload.filename] = str(dest)

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"File save error: {exc}")

    # ---- Execute notebook ----
    try:
        results = execute_morph_analysis(
            data_dir=str(csv_dir),
            events_file=saved["events"],
            evaluation_file=saved["evaluation"],
        )
        return JSONResponse(content=results)
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Morphological analysis failed: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# GET /api/morphological/results
# ---------------------------------------------------------------------------
@router.get("/results")
async def morph_get_results():
    """Return the latest morphological analysis results."""
    frontend_json = FRONTEND_DATA_DIR / "morph_analysis_results.json"
    if frontend_json.exists():
        with open(frontend_json, "r") as f:
            return JSONResponse(content=json.load(f))

    result_files = sorted(
        MORPH_RESULTS_DIR.glob("results_*.json"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if result_files:
        with open(result_files[0], "r") as f:
            return JSONResponse(content=json.load(f))

    raise HTTPException(
        status_code=404,
        detail="No morphological analysis results found. Run the analysis first.",
    )


# ---------------------------------------------------------------------------
# POST /api/morphological/upload
# ---------------------------------------------------------------------------
@router.post("/upload")
async def morph_upload_files(
    events: UploadFile = File(None),
    evaluation: UploadFile = File(None),
    env_files: list[UploadFile] = File(None),
):
    """Upload files without triggering analysis."""
    saved = {}
    csv_dir = MORPH_UPLOAD_DIR / "csv_data"
    csv_dir.mkdir(parents=True, exist_ok=True)

    if events is not None:
        dest = MORPH_UPLOAD_DIR / events.filename
        with open(dest, "wb") as f:
            shutil.copyfileobj(events.file, f)
        saved["events"] = {"filename": events.filename, "size": dest.stat().st_size}

    if evaluation is not None:
        dest = MORPH_UPLOAD_DIR / evaluation.filename
        with open(dest, "wb") as f:
            shutil.copyfileobj(evaluation.file, f)
        saved["evaluation"] = {"filename": evaluation.filename, "size": dest.stat().st_size}

    if env_files:
        saved["envFiles"] = []
        for upload in env_files:
            dest = csv_dir / upload.filename
            with open(dest, "wb") as f:
                shutil.copyfileobj(upload.file, f)
            saved["envFiles"].append({"filename": upload.filename, "size": dest.stat().st_size})

    return {"uploaded": saved}


# ---------------------------------------------------------------------------
# DELETE /api/morphological/results
# ---------------------------------------------------------------------------
@router.delete("/results")
async def morph_clear_results():
    """Delete all morphological analysis result files."""
    deleted = []
    frontend_json = FRONTEND_DATA_DIR / "morph_analysis_results.json"
    if frontend_json.exists():
        frontend_json.unlink()
        deleted.append(str(frontend_json))
    if MORPH_RESULTS_DIR.exists():
        for f in MORPH_RESULTS_DIR.glob("results_*.json"):
            f.unlink()
            deleted.append(str(f))
    return {"cleared": len(deleted), "files": deleted}


# ---------------------------------------------------------------------------
# GET /api/morphological/analyze/status
# ---------------------------------------------------------------------------
@router.get("/analyze/status")
async def morph_analysis_status():
    """Check if a morphological analysis result exists."""
    frontend_json = FRONTEND_DATA_DIR / "morph_analysis_results.json"
    has_results = frontend_json.exists()
    csv_dir = MORPH_UPLOAD_DIR / "csv_data"
    return {
        "hasResults": has_results,
        "uploadsDir": str(MORPH_UPLOAD_DIR),
        "filesInUploads": [f.name for f in MORPH_UPLOAD_DIR.iterdir() if f.is_file()] if MORPH_UPLOAD_DIR.exists() else [],
        "csvFiles": [f.name for f in csv_dir.iterdir() if f.is_file()] if csv_dir.exists() else [],
    }
