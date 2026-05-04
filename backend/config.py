"""
Backend configuration for CoastalAI analysis server.
"""
import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
NOTEBOOK_PATH = PROJECT_ROOT / "notebook.ipynb"
NOTEBOOK_DATA_DIR = PROJECT_ROOT / "notebook_data"

# Fixed meteorological notebook input files (used by /api/analyze)
NOTEBOOK_WAVE_FILE = NOTEBOOK_DATA_DIR / "Global_Ocean_Waves_Reanalysis_2009_2024.nc"
NOTEBOOK_WIND_FILE = NOTEBOOK_DATA_DIR / "Global Ocean Monthly Mean Sea Surface Wind and Stress from Scatterometer and Model_2009_2024.nc"
NOTEBOOK_CURRENT_FILE = NOTEBOOK_DATA_DIR / "Global Ocean Physics Reanalysis(current_data)_2009_2024.nc"

# Upload / workspace directories
UPLOAD_DIR = BASE_DIR / "uploads"
RESULTS_DIR = BASE_DIR / "results"
EXECUTED_NOTEBOOKS_DIR = BASE_DIR / "executed_notebooks"

# --- Morphological module paths ---
MORPH_NOTEBOOK_PATH = PROJECT_ROOT / "thimalka.ipynb"
MORPH_UPLOAD_DIR = BASE_DIR / "uploads" / "morphological"
MORPH_RESULTS_DIR = BASE_DIR / "results" / "morphological"
MORPH_EXECUTED_NOTEBOOKS_DIR = BASE_DIR / "executed_notebooks" / "morphological"

# Create directories
for d in [UPLOAD_DIR, RESULTS_DIR, EXECUTED_NOTEBOOKS_DIR,
          MORPH_UPLOAD_DIR, MORPH_RESULTS_DIR, MORPH_EXECUTED_NOTEBOOKS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Frontend data path (where the frontend reads analysis_results.json)
FRONTEND_DATA_DIR = PROJECT_ROOT / "frontend" / "public" / "data"

# CORS origins
CORS_ORIGINS = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

# Max upload size: 500 MB
MAX_UPLOAD_SIZE = 500 * 1024 * 1024
