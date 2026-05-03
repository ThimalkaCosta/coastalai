"""
Morphological Threshold Analysis router.
POST /run   → execute the full analysis pipeline and return results
GET  /results/latest → return the most recently saved results
GET  /health → health check
"""

import json
import traceback
from pathlib import Path

from fastapi import APIRouter, HTTPException
from config import PROJECT_ROOT, MORPH_RESULTS_DIR

router = APIRouter()

DATASET_PATH = PROJECT_ROOT / "research-dataset"
LATEST_RESULTS_FILE = MORPH_RESULTS_DIR / "latest_results.json"


@router.get("/health")
async def morph_health():
    dataset_ok = DATASET_PATH.exists() and any(DATASET_PATH.glob("*.csv"))
    return {
        "status": "ok",
        "datasetFound": dataset_ok,
        "datasetPath": str(DATASET_PATH),
    }


@router.post("/run")
async def run_analysis():
    """Execute the full morphological threshold analysis."""
    if not DATASET_PATH.exists():
        raise HTTPException(status_code=400, detail="research-dataset/ folder not found")

    # Lazy import so the heavy ML packages are only loaded when needed
    from services.morphological_analysis import run_morphological_analysis

    try:
        results = run_morphological_analysis(DATASET_PATH)

        # Persist results
        MORPH_RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        with open(LATEST_RESULTS_FILE, "w") as f:
            json.dump(results, f, indent=2)

        return results
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/results/latest")
async def get_latest_results():
    """Return the most recently saved analysis results."""
    if not LATEST_RESULTS_FILE.exists():
        raise HTTPException(status_code=404, detail="No results available. Run the analysis first.")

    with open(LATEST_RESULTS_FILE) as f:
        return json.load(f)
