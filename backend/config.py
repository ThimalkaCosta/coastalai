"""
Backend configuration for CoastalAI analysis server.
Supports both local development and Cloud Run deployment.
"""
import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent

# In Cloud Run the notebook is copied into the Docker image at /app/notebook.ipynb
# Locally it lives at the project root (one level up from backend/)
NOTEBOOK_PATH = Path(os.environ.get(
    "NOTEBOOK_PATH",
    str(BASE_DIR.parent / "notebook.ipynb"),
))

# Upload / workspace directories (writable tmp in Cloud Run)
_WORK = Path(os.environ.get("WORK_DIR", str(BASE_DIR)))
UPLOAD_DIR = _WORK / "uploads"
RESULTS_DIR = _WORK / "results"
EXECUTED_NOTEBOOKS_DIR = _WORK / "executed_notebooks"

# Create directories
for d in [UPLOAD_DIR, RESULTS_DIR, EXECUTED_NOTEBOOKS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Frontend data path (only used locally; Cloud Run returns JSON via API)
FRONTEND_DATA_DIR = BASE_DIR.parent / "frontend" / "public" / "data"

# CORS origins – extend via EXTRA_CORS_ORIGINS env var (comma-separated)
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://coastaisrilanka.firebaseapp.com",
    "https://coastaisrilanka.web.app",
]
_extra = os.environ.get("EXTRA_CORS_ORIGINS", "")
if _extra:
    CORS_ORIGINS.extend([o.strip() for o in _extra.split(",") if o.strip()])

# Max upload size: 500 MB
MAX_UPLOAD_SIZE = 500 * 1024 * 1024

# Server port (Cloud Run sets PORT env var)
PORT = int(os.environ.get("PORT", 8000))
