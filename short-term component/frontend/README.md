# Coastal Forecast Frontend

React + Vite frontend for the Coastal Erosion Forecasting System.

## Features

- **Multi-step wizard UI** for better UX
- **Step 1**: View dataset health report and beach overview
- **Step 2**: Set forecast parameters (target date, max 1 year)
- **Step 3**: View results with downloadable KML files + interactive charts

Supports: Plotly interactive graphs, base64 images, HTML tables, and text output from the forecasting notebook.

## Prerequisites

- **Node.js 20.19+** (NOT 20.10.0) — [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Backend running** on `http://127.0.0.1:8080` (see backend README)

---

## Quick Start

### Windows (PowerShell)

**Terminal 1: Backend**
```powershell
cd backend

# Create and activate environment
python -m venv .venv
.venv\Scripts\Activate.ps1

# Set CMEMS credentials (one-time per session)
$env:CMEMS_USER = "tharushinjayasooriya@gmail.com"
$env:CMEMS_PASS = "Research@123"

# Install and run backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

**Terminal 2: Frontend**
```powershell
cd frontend
npm install
npm run dev
```

Then open: **http://localhost:5173**

### macOS / Linux

**Terminal 1: Backend**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate

export CMEMS_USER="tharushinjayasooriya@gmail.com"
export CMEMS_PASS="Research@123"

pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

**Terminal 2: Frontend**
```bash
cd frontend
npm install
npm run dev
```

Then open: **http://localhost:5173**

---

## Troubleshooting

### Q: I see "Failed to fetch" error on page load

**A: Backend is not running or not reachable.**

1. Check that you started the backend in Terminal 1
2. Verify you're using the correct API URL: **http://127.0.0.1:8080** (NOT localhost)
3. If using a different port, set it in `.env`:

```bash
# Create frontend/.env (no spaces)
VITE_API_BASE_URL=http://127.0.0.1:8081
```

Then restart frontend dev server: `npm run dev`

### Q: Node.js version error despite having the latest Node

**A: npm may be caching old version info.**

```powershell
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -r node_modules package-lock.json
npm install
```

### Q: Forecast takes too long or times out

**A: Normal.** The first run takes 2-5 minutes as it downloads CMEMS wave data.  
Re-runs are faster if data is cached.

### Q: CMEMS credentials error when running forecast

**A: Environment variables expired or not set.**

Set them again and restart backend:

```powershell
# PowerShell
$env:CMEMS_USER = "tharushinjayasooriya@gmail.com"
$env:CMEMS_PASS = "Research@123"
```

Backend caches credentials in `~/.copernicusmarine/` after first use.

### Q: Port 8080 is already in use

**A: Use a different port:**

Backend:
```bash
uvicorn main:app --reload --port 8081
```

Frontend `.env`:
```bash
VITE_API_BASE_URL=http://127.0.0.1:8081
```

---

## API Configuration

The frontend auto-detects the backend URL. You can override it with a `.env` file in the `frontend/` folder:

```bash
# frontend/.env
VITE_API_BASE_URL=http://127.0.0.1:8080
```

For production (Firebase), use your deployed backend URL:

```bash
VITE_API_BASE_URL=https://your-backend-domain.com
```

Rebuild after changing:
```bash
npm run build
```

---

## Deployment (Firebase Hosting)

### Build
```bash
npm run build
```
This creates a `dist/` folder ready for hosting.

### Setup Firebase (first time)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

When prompted:
- **Public directory:** `dist`
- **Configure as single-page app:** `Yes`
- **Overwrite existing index.html:** `No`

### Deploy
```bash
firebase deploy
```

You'll get a URL like: `https://your-project.web.app`

### Connect to backend
Before deploying, update your backend to allow your Firebase domain:

```bash
export FRONTEND_ORIGINS="https://your-project.web.app,https://your-project.firebaseapp.com"
uvicorn main:app --port 8080
```

---

## Development

### Lint code
```bash
npm run lint
```

### Build for production
```bash
npm run build
```

### Preview production build locally

```bash
npm run preview
```

---

## File Structure

```
frontend/
├── src/
│   ├── Dashboard.jsx      (Main 3-step wizard UI)
│   ├── App.jsx            (App wrapper)
│   ├── main.jsx           (React entry)
│   └── index.css          (Wizard styles)
├── package.json           (Dependencies: React, Plotly, Lucide)
├── vite.config.js         (Vite config + API proxy)
├── eslint.config.js       (Linting rules)
└── README.md              (This file)
```

---

## Environment Variables

**Frontend only:**
- `VITE_API_BASE_URL` — Backend API URL (default: `http://127.0.0.1:8080`)

**Backend only:**
- `CMEMS_USER` — Copernicus email
- `CMEMS_PASS` — Copernicus password
- `FRONTEND_ORIGINS` — CORS origins (comma-separated, for deployed frontend)

---

## Need Help?

Check:
1. Backend is running: `http://127.0.0.1:8080/api/health` should return `{"ok": true}`
2. Frontend can reach backend: Browser DevTools > Network tab > check `/api/info` request
3. CMEMS credentials are fresh and correct
4. Node.js is version 20.19+ (`node --version`)
5. No firewall blocking port 8080
