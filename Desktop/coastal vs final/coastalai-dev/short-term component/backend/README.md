# Coastal Forecast Backend API

FastAPI backend for running the `forecasting_gpt.ipynb` notebook and serving results to the frontend.

## Prerequisites

- Python 3.8+
- CMEMS account credentials (for wave data downloads)
- Generated Copernicus Marine credentials file

## Setup

### 1. Create Python environment

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Set CMEMS credentials

**Important**: Your CMEMS credentials must be set as environment variables.  
Once set, they'll be cached in `~/.copernicusmarine/.copernicusmarine-credentials`.

#### Windows (PowerShell)

```powershell
$env:CMEMS_USER = "tharushinjayasooriya@gmail.com"
$env:CMEMS_PASS = "Research@123"
```

#### Windows (Command Prompt)

```cmd
set CMEMS_USER=tharushinjayasooriya@gmail.com
set CMEMS_PASS=Research@123
```

#### macOS / Linux

```bash
export CMEMS_USER="tharushinjayasooriya@gmail.com"
export CMEMS_PASS="Research@123"
```

If you set these in the terminal, you only need to do it once per terminal session.

### 4. Run the backend server

```bash
uvicorn main:app --reload --port 8080
```

You should see:
```
Uvicorn running on http://127.0.0.1:8080
```

## API Endpoints

### Health Check
```
GET /api/health
```
Check if backend is running, notebook and data cache are available.

### Dataset Info
```
GET /api/info
```
Returns beach metadata, dataset availability, and recent forecasts.
**Called by frontend on startup to show dataset overview.**

### Run Forecast
```
POST /api/run
Content-Type: application/json

{
  "forecastDate": "2026-07-15"
}
```
Executes the forecasting notebook and returns parsed outputs (images, charts, tables).
**Takes 2-5 minutes to complete.**

### Download File
```
GET /api/download/{filename}
```
Download a generated KML file or CSV.
**Example:** `/api/download/forecast_2026-07-15.kml`

## Troubleshooting

### Issue: "CMEMS credentials not found" error in notebook

**Solution:**
Before running the forecast, set the environment variables:

```powershell
# PowerShell
$env:CMEMS_USER = "your-email@example.com"
$env:CMEMS_PASS = "your-password"
```

The backend will cache them in `~/.copernicusmarine/`.

### Issue: Notebook execution times out or hangs

**Solution:**
1. Check your internet connection (CMEMS downloads require good connectivity)
2. Try running with `--timeout 600` in the uvicorn command
3. Check if the data cache already exists (should speed up re-runs)

### Issue: "Port 8080 already in use"

**Solution:**
```bash
# Use a different port
uvicorn main:app --reload --port 8081
# Then update frontend's VITE_API_BASE_URL to http://127.0.0.1:8081
```

## CORS Configuration (for deployed frontend)

If you deploy the frontend separately (e.g., on Firebase), set:

```bash
export FRONTEND_ORIGINS="https://your-site.web.app,https://your-site.firebaseapp.com"
uvicorn main:app --reload --port 8080
```

## Files Generated

When a forecast runs, the following files are created:

- `data_cache/output_forecasts/forecast_YYYY-MM-DD.kml` — Predicted shoreline
- `data_cache/output_forecasts/*.csv` — Risk analysis data
- `backend/results/executed_XXXXXXXXXX.ipynb` — Full executed notebook

These are served via `/api/download/` endpoint.
