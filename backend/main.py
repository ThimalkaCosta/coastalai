"""
CoastalAI Backend - FastAPI Server
Executes notebook.ipynb with user-uploaded data and returns analysis results.
Deploys locally (uvicorn) or on Google Cloud Run.
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import CORS_ORIGINS, NOTEBOOK_PATH
from routers import analysis

app = FastAPI(
    title="CoastalAI Analysis API",
    description="Backend API for dynamic notebook execution and coastal erosion analysis",
    version="1.0.0",
)

# CORS – allow the Firebase-hosted frontend and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(analysis.router, prefix="/api", tags=["analysis"])


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "coastalai-backend",
        "notebookFound": NOTEBOOK_PATH.exists(),
    }


# ── Entry-point for Cloud Run (gunicorn / uvicorn) ──
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
