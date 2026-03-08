"""
CoastalAI Backend - FastAPI Server
Executes notebook.ipynb with user-uploaded data and returns analysis results.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import CORS_ORIGINS
from routers import analysis
from routers import morphological
from routers import shortterm
from routers import longterm

app = FastAPI(
    title="CoastalAI Analysis API",
    description="Backend API for dynamic notebook execution and coastal erosion analysis",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(analysis.router, prefix="/api", tags=["analysis"])
app.include_router(morphological.router, prefix="/api/morphological", tags=["morphological"])
app.include_router(shortterm.router, prefix="/api/shortterm", tags=["shortterm"])
app.include_router(longterm.router, prefix="/api/longterm", tags=["longterm"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "coastalai-backend"}
