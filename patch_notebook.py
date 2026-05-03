"""
patch_notebook.py  (v2)
Run once to update Coastal_Erosion_Forecast_Standalone.ipynb for the new beach data.
Changes:
  1. Updates KML_DIR path   : data/kml  (was data/high_res_kml)
  2. Adds ANALYSIS_DIR      : data/analysis
  3. Fixes parse_kml_date   : supports MMYYYY format (new) + MMDDYYYY (old)
  4. Adds load_all_analysis_csvs() to merge all YY-YY-stat.csv files
  5. Changes num_transects from 50 -> 163 everywhere in the notebook
"""

import json, re, os, sys

NOTEBOOK = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        "Coastal_Erosion_Forecast_Standalone.ipynb")

# ── 1. New source for Cell 1 (Setup / Config) ─────────────────────────────
NEW_SETUP_SOURCE = [
    "import pandas as pd\n",
    "import numpy as np\n",
    "import matplotlib.pyplot as plt\n",
    "import os\n",
    "import sys\n",
    "from datetime import datetime, timedelta\n",
    "import xml.etree.ElementTree as ET\n",
    "from sklearn.linear_model import LinearRegression\n",
    "from sklearn.ensemble import RandomForestRegressor\n",
    "from scipy.spatial.distance import cdist\n",
    "\n",
    "try:\n",
    "    import xgboost as xgb\n",
    "    HAS_XGB = True\n",
    "except ImportError:\n",
    "    HAS_XGB = False\n",
    "    print('Warning: xgboost not installed. XGBoost model will be unavailable.')\n",
    "\n",
    "%matplotlib inline\n",
    "\n",
    "# Configuration - overridden by Papermill when run from the backend\n",
    "KML_DIR      = os.path.join(os.getcwd(), 'data', 'kml')       # NEW: data/kml\n",
    "OUTPUT_DIR   = os.path.join(os.getcwd(), 'output')\n",
    "DATA_DIR     = os.path.join(os.getcwd(), 'data')\n",
    "ANALYSIS_DIR = os.path.join(os.getcwd(), 'data', 'analysis')  # NEW: yearly CSV folder\n",
    "TARGET_YEAR  = 2029\n",
    "MODEL_TYPE   = 'Ensemble'\n",
    "NUM_TRANSECTS = 163                                            # NEW: match your CSV data\n",
    "os.makedirs(OUTPUT_DIR, exist_ok=True)\n",
    "print('Setup complete.')\n",
    "print('KML_DIR     :', KML_DIR)\n",
    "print('ANALYSIS_DIR:', ANALYSIS_DIR)\n",
    "print('NUM_TRANSECTS:', NUM_TRANSECTS)\n"
]

# ── 2. New source for Cell 3 (Data Loading) ────────────────────────────────
NEW_DATA_LOADER_SOURCE = [
    "import os\n",
    "import re\n",
    "import pandas as pd\n",
    "import xml.etree.ElementTree as ET\n",
    "from datetime import datetime\n",
    "import glob\n",
    "\n",
    "def parse_kml_date(filename):\n",
    "    \"\"\"\n",
    "    Extracts date from filename. Supports two formats:\n",
    "      - New format: 'MMYYYY.kml'          e.g. '012015.kml' -> datetime(2015, 1, 1)\n",
    "      - Old format: 'SWnew MMDDYYYY.kml'  e.g. 'SWnew 10222010.kml' -> datetime(2010, 10, 22)\n",
    "    \"\"\"\n",
    "    base = os.path.splitext(os.path.basename(filename))[0].strip()\n",
    "\n",
    "    # New format: exactly 6 digits MMYYYY  (e.g. '012015', '112022')\n",
    "    if re.fullmatch(r'\\d{6}', base):\n",
    "        month = int(base[:2])\n",
    "        year  = int(base[2:])\n",
    "        try:\n",
    "            return datetime(year, month, 1)\n",
    "        except ValueError:\n",
    "            pass\n",
    "\n",
    "    # Old format: MMDDYYYY somewhere in the filename\n",
    "    match = re.search(r'(\\d{1,2})(\\d{2})(\\d{4})', filename)\n",
    "    if match:\n",
    "        month, day, year = match.groups()\n",
    "        try:\n",
    "            return datetime(int(year), int(month), int(day))\n",
    "        except ValueError:\n",
    "            pass\n",
    "\n",
    "    return None\n",
    "\n",
    "def read_kml_shoreline(filepath):\n",
    "    \"\"\"Parses a KML file and returns a list of [lon, lat] pairs.\"\"\"\n",
    "    try:\n",
    "        tree = ET.parse(filepath)\n",
    "        root = tree.getroot()\n",
    "        coordinates = []\n",
    "        for elem in root.iter():\n",
    "            if 'coordinates' in elem.tag:\n",
    "                text = elem.text.strip()\n",
    "                for coord in text.split():\n",
    "                    parts = coord.split(',')\n",
    "                    if len(parts) >= 2:\n",
    "                        coordinates.append([float(parts[0]), float(parts[1])])\n",
    "                if coordinates:\n",
    "                    break\n",
    "        return coordinates\n",
    "    except Exception as e:\n",
    "        print(f'Error parsing {filepath}: {e}')\n",
    "        return []\n",
    "\n",
    "def load_all_shorelines(kml_dir):\n",
    "    \"\"\"\n",
    "    Loads all KML files from kml_dir.\n",
    "    Returns a DataFrame with columns ['Date', 'Coordinates'].\n",
    "    \"\"\"\n",
    "    files = glob.glob(os.path.join(kml_dir, '*.kml'))\n",
    "    data, skipped = [], []\n",
    "\n",
    "    for f in files:\n",
    "        filename = os.path.basename(f)\n",
    "        date_obj = parse_kml_date(filename)\n",
    "        if date_obj:\n",
    "            coords = read_kml_shoreline(f)\n",
    "            if coords:\n",
    "                data.append({'Date': date_obj, 'Coordinates': coords})\n",
    "            else:\n",
    "                skipped.append(filename + ' (no coords)')\n",
    "        else:\n",
    "            skipped.append(filename + ' (bad date)')\n",
    "\n",
    "    if skipped:\n",
    "        print(f'Skipped {len(skipped)} files: {skipped}')\n",
    "\n",
    "    df = pd.DataFrame(data)\n",
    "    if not df.empty:\n",
    "        df = df.sort_values('Date').reset_index(drop=True)\n",
    "    print(f'Loaded {len(df)} KML shoreline files from {kml_dir}')\n",
    "    return df\n",
    "\n",
    "def load_all_analysis_csvs(analysis_dir):\n",
    "    \"\"\"\n",
    "    Loads and merges all YY-YY-stat.csv files from analysis_dir.\n",
    "    Each file covers a 2-year period (e.g. 12-13-stat.csv = 2012 -> 2013).\n",
    "    Returns one combined DataFrame sorted by Year_End then transect id.\n",
    "    Columns added: Year_Start, Year_End, Period.\n",
    "    \"\"\"\n",
    "    csv_files = sorted(glob.glob(os.path.join(analysis_dir, '*-stat.csv')))\n",
    "    if not csv_files:\n",
    "        print(f'WARNING: No *-stat.csv files found in {analysis_dir}')\n",
    "        return pd.DataFrame()\n",
    "\n",
    "    frames = []\n",
    "    for f in csv_files:\n",
    "        fname = os.path.basename(f)\n",
    "        m = re.match(r'(\\d{2})-(\\d{2})-stat\\.csv', fname)\n",
    "        if not m:\n",
    "            print(f'Skipping unrecognised file: {fname}')\n",
    "            continue\n",
    "        yr_start = int('20' + m.group(1))\n",
    "        yr_end   = int('20' + m.group(2))\n",
    "        try:\n",
    "            df = pd.read_csv(f)\n",
    "            df['Year_Start'] = yr_start\n",
    "            df['Year_End']   = yr_end\n",
    "            df['Period']     = f'{yr_start}-{yr_end}'\n",
    "            frames.append(df)\n",
    "        except Exception as e:\n",
    "            print(f'Error reading {fname}: {e}')\n",
    "\n",
    "    if not frames:\n",
    "        return pd.DataFrame()\n",
    "\n",
    "    combined = pd.concat(frames, ignore_index=True)\n",
    "    combined = combined.sort_values(['Year_End', 'id']).reset_index(drop=True)\n",
    "    print(f'Loaded {len(csv_files)} analysis CSV files  ->  {len(combined)} rows total')\n",
    "    print(f'Periods covered: {sorted(combined[\"Period\"].unique())}')\n",
    "    return combined\n",
    "\n",
    "def load_transect_stats(csv_path):\n",
    "    \"\"\"Loads a single transect-based statistics CSV (legacy helper).\"\"\"\n",
    "    try:\n",
    "        return pd.read_csv(csv_path)\n",
    "    except Exception as e:\n",
    "        print(f'Error loading stats CSV: {e}')\n",
    "        return pd.DataFrame()\n",
    "\n"
]

# ── 3. Patch the notebook ──────────────────────────────────────────────────
print(f"Loading notebook: {NOTEBOOK}")
with open(NOTEBOOK, "r", encoding="utf-8") as fh:
    nb = json.load(fh)

setup_patched      = False
dataloader_patched = False
transects_fixed    = 0

for cell in nb["cells"]:
    if cell["cell_type"] != "code":
        continue

    src_lines = cell["source"]
    src = "".join(src_lines)

    # ── Cell 1: Setup / Config ──────────────────────────────────────────
    if "KML_DIR" in src and "TARGET_YEAR" in src and not setup_patched:
        cell["source"] = NEW_SETUP_SOURCE
        cell["outputs"] = []
        cell["execution_count"] = None
        setup_patched = True
        print("  ✓ Patched Cell 1 (Setup / Config) — paths + NUM_TRANSECTS=163")
        continue

    # ── Cell 3: Data Loading ────────────────────────────────────────────
    if "parse_kml_date" in src and "load_all_shorelines" in src and not dataloader_patched:
        cell["source"] = NEW_DATA_LOADER_SOURCE
        cell["outputs"] = []
        cell["execution_count"] = None
        dataloader_patched = True
        print("  ✓ Patched Cell 3 (Data Loading) — new date parser + load_all_analysis_csvs()")
        continue

    # ── All other cells: replace num_transects=50 with NUM_TRANSECTS ───
    new_lines = []
    changed = False
    for line in src_lines:
        new_line = re.sub(r'num_transects\s*=\s*50\b', 'num_transects=NUM_TRANSECTS', line)
        if new_line != line:
            changed = True
            transects_fixed += 1
        new_lines.append(new_line)
    if changed:
        cell["source"] = new_lines
        cell["outputs"] = []
        cell["execution_count"] = None

# ── Validation ─────────────────────────────────────────────────────────────
errors = []
if not setup_patched:
    errors.append("Could not find Cell 1 (Setup).")
if not dataloader_patched:
    errors.append("Could not find Cell 3 (Data Loading).")

if errors:
    for e in errors:
        print(f"  ✗ ERROR: {e}")
    print("Notebook NOT saved due to errors.")
    sys.exit(1)

print(f"  ✓ Replaced num_transects=50 -> NUM_TRANSECTS in {transects_fixed} line(s)")

with open(NOTEBOOK, "w", encoding="utf-8") as fh:
    json.dump(nb, fh, indent=1, ensure_ascii=False)

print("\nDone! Notebook updated successfully.")
print("You can now open the notebook and click 'Run All'.")
