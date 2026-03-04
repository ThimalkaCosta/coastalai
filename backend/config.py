"""
Backend configuration for CoastalAI analysis server.
"""
import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
NOTEBOOK_PATH = PROJECT_ROOT / "notebook.ipynb"

# Upload / workspace directories
UPLOAD_DIR = BASE_DIR / "uploads"
RESULTS_DIR = BASE_DIR / "results"
EXECUTED_NOTEBOOKS_DIR = BASE_DIR / "executed_notebooks"

# Create directories
for d in [UPLOAD_DIR, RESULTS_DIR, EXECUTED_NOTEBOOKS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Frontend data path (where the frontend reads analysis_results.json)
FRONTEND_DATA_DIR = PROJECT_ROOT / "frontend" / "public" / "data"

# CORS origins
CORS_ORIGINS = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# Max upload size: 500 MB
MAX_UPLOAD_SIZE = 500 * 1024 * 1024
