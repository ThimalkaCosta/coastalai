# ═══════════════════════════════════════════════════════════════════════
# CoastalAI Backend – Docker image for Google Cloud Run
# Build context must be the project root so notebook.ipynb is accessible.
#
#   docker build -t coastalai-backend -f Dockerfile .
#   docker run -p 8080:8080 coastalai-backend
# ═══════════════════════════════════════════════════════════════════════
FROM python:3.11-slim

# System deps for netCDF4 / HDF5 / scientific stack
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential libhdf5-dev libnetcdf-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Install Python packages ──
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Install a Jupyter kernel (papermill needs one to execute notebooks)
RUN pip install --no-cache-dir ipykernel \
    && python -m ipykernel install --user --name python3

# ── Copy backend source code ──
COPY backend/ ./

# ── Copy the analysis notebook into the image ──
COPY notebook.ipynb /app/notebook.ipynb

# ── Environment ──
ENV NOTEBOOK_PATH=/app/notebook.ipynb
ENV WORK_DIR=/tmp/coastalai
ENV PORT=8080

RUN mkdir -p /tmp/coastalai

EXPOSE 8080

CMD ["python", "main.py"]
