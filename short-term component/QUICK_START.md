# ⚡ Quick Reference Card

## 🚀 Start Everything (2 Commands)

### Terminal 1: Backend
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
$env:CMEMS_USER = "tharushinjayasooriya@gmail.com"
$env:CMEMS_PASS = "Research@123"
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

### Terminal 2: Frontend
```powershell
cd frontend
npm install
npm run dev
```

### Browser
Open: **http://localhost:5173**

---

## 📋 The 3-Step Wizard

| Step | What | Action |
|------|------|--------|
| 1️⃣ | See dataset overview | **Open page** - auto-loads info |
| 2️⃣ | Pick forecast date | **Choose date** (max 1 year ahead) |
| 3️⃣ | Get results | **Click "Generate"** - wait 2-5 min |

---

## 🔗 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Check if backend is running |
| `/api/info` | GET | Get dataset overview |
| `/api/run` | POST | Run forecast with date |
| `/api/download/{filename}` | GET | Download KML file |
| `/api/results` | GET | Get latest forecast |

---

## 🆘 If Something Goes Wrong

### "Failed to fetch"
```powershell
# Check backend
http://127.0.0.1:8080/api/health
# Should show: {"ok": true}
```

### "CMEMS credentials not found"
```powershell
# Set again, restart backend
$env:CMEMS_USER = "tharushinjayasooriya@gmail.com"
$env:CMEMS_PASS = "Research@123"
# Ctrl+C to stop backend, then restart
uvicorn main:app --reload --port 8080
```

### "Port 8080 already in use"
```powershell
# Use different port
uvicorn main:app --reload --port 8081

# Update frontend .env
echo "VITE_API_BASE_URL=http://127.0.0.1:8081" > frontend\.env
```

### Slow? It's normal.
- First run: 2-5 minutes (downloads 30 years of data)
- Next runs: ~1 minute (uses cached data)

---

## 📂 Key Files

```
backend/main.py          ← API endpoints
frontend/src/Dashboard.jsx  ← 3-step UI
data_cache/             ← Historical data + outputs
forecasting_gpt.ipynb   ← ML model notebook
```

---

## ✅ Verify It Works

### Test 1: Backend health
```
GET http://127.0.0.1:8080/api/health
```

### Test 2: Frontend loads
```
Open http://localhost:5173
Should see: "Dataset Overview" with beach info
```

### Test 3: Run forecast
1. Click "Set Forecast Parameters"
2. Pick a date (e.g., 30 days from today)
3. Click "Generate Forecast"
4. Wait 2-5 minutes
5. Download KML file

---

## 🌐 Deployed to Firebase?

```powershell
# Build frontend
cd frontend
npm run build

# Deploy
firebase deploy

# Update backend CORS
$env:FRONTEND_ORIGINS = "https://your-project.web.app"
uvicorn main:app --port 8080
```

---

## 📞 Need Help?

1. Read: `SETUP_GUIDE.md` (comprehensive)
2. Check: `backend/README.md` (API docs)
3. Check: `frontend/README.md` (UI docs)
4. Debug: Terminal output (backend logs everything)

---

**That's it!** 🎉 Go make some forecasts!
