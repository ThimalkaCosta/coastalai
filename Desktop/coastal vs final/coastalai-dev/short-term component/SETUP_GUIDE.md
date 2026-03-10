# 🌊 Coastal Erosion Forecast System - Complete Setup Guide

This is your integrated forecasting system with:
- **Notebook**: `forecasting_gpt.ipynb` — ML model for shoreline prediction
- **Backend**: FastAPI server that runs the notebook and serves results
- **Frontend**: React wizard UI for dataset overview → forecast inputs → results

---

## 🚀 Quick Start (5 minutes)

### Step 1: Check Prerequisites

```powershell
# Check Node.js version (must be 20.19 or higher)
node --version    # Should show v20.19.x or higher
npm --version

# Check Python version
python --version  # Should show 3.8 or higher
```

❌ **Problem?** You have Node 20.10.0 which is too old.
- Download and install: https://nodejs.org/ (LTS version)

### Step 2: Start Backend (Terminal 1)

```powershell
cd backend

# Create Python environment
python -m venv .venv
.venv\Scripts\Activate.ps1

# Set CMEMS credentials (required for wave data)
$env:CMEMS_USER = "tharushinjayasooriya@gmail.com"
$env:CMEMS_PASS = "Research@123"

# Install and run
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

✅ You should see:
```
Uvicorn running on http://127.0.0.1:8080
```

### Step 3: Start Frontend (Terminal 2)

```powershell
cd frontend
npm install
npm run dev
```

✅ You should see:
```
  ➜  Local:   http://localhost:5173/
```

### Step 4: Open Browser

Go to: **http://localhost:5173**

You should see the 3-step wizard:
1. 📊 Dataset Overview (beach info, health report)
2. 📅 Forecast Parameters (choose target date)
3. ✅ Results (download KML files, view graphs)

---

## 🔍 Verify Everything is Working

### Check Backend Health

```powershell
# In any terminal, open browser to:
http://127.0.0.1:8080/api/health
```

Should show:
```json
{
  "ok": true,
  "notebookFound": true,
  "dataCacheFound": true,
  "allowedOrigins": ["http://localhost:5173", "http://127.0.0.1:5173"]
}
```

### Check Frontend Connection

1. Open Frontend in browser: http://localhost:5173
2. Browser DevTools (F12) → Network tab
3. Refresh page
4. Check for `/api/info` request — should be **200 OK** (green)

If it's **red/failed**, backend isn't running. Go back to Step 2.

---

## 📋 Workflow Explanation

### What Happens When You Click "Generate Forecast"?

1. **Frontend sends**: Target date (e.g., July 15, 2026)
2. **Backend runs** `forecasting_gpt.ipynb` with that date as parameter
3. **Notebook**:
   - Loads 30+ years of shoreline KML files
   - Downloads recent climate data (ERA5 wind, pressure)
   - Downloads recent wave data (CMEMS)
   - Trains ML model on historical trends
   - Predicts shoreline position on target date
   - Exports forecast as KML file
4. **Backend parses** notebook outputs:
   - Extracts charts/graphs (Plotly, matplotlib PNG)
   - Extracts analysis tables (HTML)
   - Extracts text summaries
   - Extracts generated KML files
5. **Frontend displays**:
   - Download buttons for KML files
   - Interactive graphs
   - Analysis tables

**Time**: First run = 2-5 minutes (downloads data)
Re-runs = 1-2 minutes (uses cached data)

---

## ❌ Common Issues & Solutions

### Issue 1: "Failed to fetch" error on page load

**Cause**: Backend not running or wrong URL

**Fix**:
1. Check Terminal 1 is still running backend (not crashed)
2. Verify port 8080 is correct
3. Try: http://127.0.0.1:8080/api/health in browser

If that doesn't work:
```powershell
# Kill backend and restart
# In Terminal 1, Ctrl+C to stop
# Then:
uvicorn main:app --reload --port 8080
```

### Issue 2: "CMEMS credentials not found" during forecast

**Cause**: Environment variables expired or not set in backend terminal

**Fix**:
1. Stop backend (Ctrl+C in Terminal 1)
2. Set credentials again:
```powershell
$env:CMEMS_USER = "tharushinjayasooriya@gmail.com"
$env:CMEMS_PASS = "Research@123"
```
3. Restart backend:
```bash
uvicorn main:app --reload --port 8080
```

### Issue 3: Port 8080 already in use

**Cause**: Another program using port 8080 (or old backend process)

**Fix**:
```powershell
# Use different port
uvicorn main:app --reload --port 8081

# Update frontend .env
# Create file: frontend\.env
VITE_API_BASE_URL=http://127.0.0.1:8081

# Restart frontend
npm run dev
```

### Issue 4: Forecast runs but no outputs show

**Cause**: Notebook executed but didn't generate expected files

**Fix**:
1. Check if `data_cache/output_forecasts/` has any `.kml` files
2. Check backend terminal for errors
3. Run the notebook independently to debug:
   - Open `forecasting_gpt.ipynb` in Jupyter
   - Run all cells (skip first one if dependencies installed)
   - Check for error messages

### Issue 5: "Node.js version error" even after updating

**Cause**: npm cache holding old version info

**Fix**:
```powershell
npm cache clean --force
rm -r frontend\node_modules, frontend\package-lock.json
cd frontend
npm install
```

---

## 🌐 Deploy to Firebase (Optional)

### Build Frontend

```powershell
cd frontend
npm run build
# Creates dist/ folder ready to deploy
```

### Setup Firebase (First Time)

```powershell
npm install -g firebase-tools
firebase login
firebase init hosting
```

When prompted:
- **Public directory**: `dist`
- **Single-page app**: `Yes`

### Deploy

```powershell
firebase deploy
```

You'll get: `https://your-project.web.app`

### Connect to Backend

Before next forecast, update backend CORS:

```powershell
# Stop backend (Ctrl+C)

# Set CORS and restart
$env:CMEMS_USER = "tharushinjayasooriya@gmail.com"
$env:CMEMS_PASS = "Research@123"
$env:FRONTEND_ORIGINS = "https://your-project.web.app,https://your-project.firebaseapp.com"

uvicorn main:app --port 8080
# (remove --reload for production)
```

---

## 📁 Folder Structure

```
antigravity frontend/
├── backend/
│   ├── main.py                    (FastAPI server)
│   ├── requirements.txt           (Python packages)
│   ├── README.md                  (Backend docs)
│   └── results/                   (Executed notebooks)
│
├── frontend/
│   ├── src/
│   │   ├── Dashboard.jsx          (Main UI - 3-step wizard)
│   │   ├── App.jsx                (React app wrapper)
│   │   ├── main.jsx               (Entry point)
│   │   └── index.css              (Styles)
│   ├── package.json               (Dependencies)
│   ├── vite.config.js             (Vite + proxy)
│   ├── README.md                  (Frontend docs)
│   └── .env.example               (Environment template)
│
├── forecasting_gpt.ipynb          (ML model notebook)
├── data_cache/
│   ├── shorelines_kml/            (32 historical shoreline files)
│   ├── output_forecasts/          (Generated KML + analysis)
│   ├── era5_*.csv                 (Climate data cache)
│   └── cmems/                     (Wave data cache)
│
└── SETUP_GUIDE.md                 (This file)
```

---

## 📞 Environment Variables Reference

### Backend (`backend/` terminal)

```powershell
# Required for CMEMS data downloads
$env:CMEMS_USER = "your-email@example.com"
$env:CMEMS_PASS = "your-password"

# Optional: CORS for deployed frontend
$env:FRONTEND_ORIGINS = "https://your-site.web.app"
```

### Frontend (`frontend/.env` file)

```
VITE_API_BASE_URL=http://127.0.0.1:8080
```

---

## 🧪 Testing Commands

```powershell
# Test backend health
curl http://127.0.0.1:8080/api/health

# Test dataset info
curl http://127.0.0.1:8080/api/info

# Test with Python (if issues)
python backend/test.py
```

---

## 📝 Next Steps

1. ✅ Start both backend and frontend
2. ✅ Verify "Dataset Overview" loads on page
3. ✅ Set a target date (e.g., 30 days from today)
4. ✅ Click "Generate Forecast" and wait 2-5 minutes
5. ✅ Download generated KML file
6. ✅ Open in Google Earth or GIS software

---

## 💡 Pro Tips

- **Save KML files** for future analysis (they're your forecast shorelines)
- **Check backend terminal** for detailed execution logs
- **Use /api/download/filename** to download files directly
- **Restart backend daily** to refresh CMEMS credentials
- **Keep data_cache/** - don't delete (speeds up re-runs)

---

**Questions?** Check the README files in `backend/` and `frontend/` folders for detailed docs.
