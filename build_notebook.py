"""Build notebook.ipynb with the new 4-method ensemble architecture.

Uses:
  - notebook_data/all_stats_new.csv  (DSAS transect statistics)
  - notebook_data/Global_Ocean_Waves_Reanalysis_2009_2024.nc
  - notebook_data/Global Ocean Monthly Mean Sea Surface Wind...nc
  - notebook_data/Global Ocean Physics Reanalysis(current_data)...nc

Architecture:
  Sec 0  – Setup & data loading
  Sec 1  – DSAS 5-class classification + erosion years
  Sec 2  – Monthly forcing feature extraction
  Sec 3  – Labels + Mann-Whitney/Cliff's δ + box plots
  Sec 4  – 4-method ensemble threshold detection + stability
  Sec 5  – Combined multi-factor analysis (RF + LR pairs)
  Sec 6  – Master threshold table + per-event diagnosis
  Sec 7  – SARIMA forecast + hindcast + MC + retreat + vulnerability
"""

import nbformat as nbf

nb = nbf.v4.new_notebook()
nb.metadata.kernelspec = {
    "display_name": "Python 3",
    "language": "python",
    "name": "python3",
}
nb.metadata.language_info = {
    "name": "python",
    "version": "3.11.0",
}

cells = []

def md(src):
    cells.append(nbf.v4.new_markdown_cell(source=src))

def code(src):
    cells.append(nbf.v4.new_code_cell(source=src))


# =====================================================================
# Cell 0  – Title markdown
# =====================================================================
md("""\
# Coastal Erosion Threshold Detection & Forecasting

## Publication-Quality Research Notebook

**Objective:** Identify scientifically defensible erosion thresholds from DSAS transect data and oceanographic forcing (wave, wind, current), then forecast erosion risk 24 months ahead using SARIMA + Monte Carlo uncertainty propagation.

### Pipeline Overview
1. **DSAS Transect Classification** — 5-class annual labels using NSM uncertainty bounds
2. **Environmental Feature Extraction** — Wave (VHM0, VTPK, VMDR, VSDX, VSDY), Wind (wind_speed, eastward/northward), Current (uo, vo, zos)
3. **Mann-Whitney / Cliff's δ** — Identify statistically significant forcing features
4. **4-Method Ensemble Thresholds** — ROC/Youden, Bayesian Logistic, Change-Point, Mutual Information
5. **Random Forest Classifier** — LOO-CV with permutation importance
6. **SARIMA Forecasting** — AIC grid search per variable
7. **Hindcast Validation** — Temporal cross-validation (POD, FAR, CSI)
8. **Monte Carlo Simulation** — 2 000 realisations for erosion probability
9. **Retreat Predictions** — Physical shoreline movement in meters
10. **Per-Transect Vulnerability** — Spatial risk scores
""")

# =====================================================================
# Cell 1  – Section 0 markdown
# =====================================================================
md("""\
## Section 0 — Setup and Data Loading

Install and import all required libraries, then load the four datasets:
1. **DSAS Shoreline CSV** — Transect-based statistics from QGIS
2. **Wave NetCDF** — Global Ocean Waves Reanalysis (VHM0, VTPK, VMDR, VSDX, VSDY)
3. **Wind NetCDF** — Monthly Sea Surface Wind (wind_speed, eastward_wind, northward_wind)
4. **Current NetCDF** — Physics Reanalysis (uo, vo at surface, zos)
""")

# =====================================================================
# Cell 2  – Section 0.1: Imports
# =====================================================================
code("""\
# =============================================================================
# Section 0.1 — Import all required libraries
# =============================================================================

import numpy as np
import pandas as pd
import xarray as xr
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Scientific / statistical
from scipy import stats
from scipy.stats import mannwhitneyu, chi2_contingency

# Scikit-learn
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import (LeaveOneOut, StratifiedKFold,
                                     cross_val_predict)
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, roc_auc_score, confusion_matrix,
                             classification_report, roc_curve, auc,
                             mutual_info_score)
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.inspection import permutation_importance

# Time-series
from statsmodels.tsa.seasonal import STL
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.stattools import adfuller
from statsmodels.stats.diagnostic import acorr_ljungbox

# Plotting
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams['figure.figsize'] = [12, 6]
plt.rcParams['font.size'] = 11
plt.rcParams['axes.labelsize'] = 12
plt.rcParams['axes.titlesize'] = 14

# Output directories
import os
os.makedirs('./figures', exist_ok=True)
os.makedirs('./outputs', exist_ok=True)

print("✓ Libraries loaded successfully")
""")

# =====================================================================
# Cell 3  – Section 0.2: Load all datasets
# =====================================================================
code("""\
# =============================================================================
# Section 0.2 — Load all datasets
# =============================================================================

DATA_PATH = "notebook_data"
SHORELINE_FILE = f"{DATA_PATH}/all_stats_new.csv"
WAVE_FILE = f"{DATA_PATH}/Global_Ocean_Waves_Reanalysis_2009_2024.nc"
WIND_FILE = f"{DATA_PATH}/Global Ocean Monthly Mean Sea Surface Wind and Stress from Scatterometer and Model_2009_2024.nc"
CURRENT_FILE = f"{DATA_PATH}/Global Ocean Physics Reanalysis(current_data)_2009_2024.nc"

# ── Load shoreline statistics ──
dsas_raw = pd.read_csv(SHORELINE_FILE)
print("=" * 60)
print("SHORELINE DATA SUMMARY (Transect-Based)")
print("=" * 60)
print(f"Shape: {dsas_raw.shape}")
print(f"Columns: {list(dsas_raw.columns)}")
print(f"Year range: {dsas_raw['SCE_closest_year'].min()} – {dsas_raw['SCE_closest_year'].max()}")
display(dsas_raw.head(10))

# ── Load NetCDF datasets ──
wave_ds = xr.open_dataset(WAVE_FILE)
wind_ds = xr.open_dataset(WIND_FILE)
current_ds = xr.open_dataset(CURRENT_FILE)

for name, ds in [('Wave', wave_ds), ('Wind', wind_ds), ('Current', current_ds)]:
    print(f"\\n{name}: {list(ds.data_vars)} | time {ds.sizes.get('time', '?')} steps")
""")

# =====================================================================
# Cell 4  – Section 1 markdown
# =====================================================================
md("""\
## Section 1 — DSAS Transect Classification (5-Class Annual Labels)

This section converts transect-wise DSAS long-term statistics into **year-wise coastal change labels** using Net Shoreline Movement (NSM) with uncertainty-aware thresholds.

| Class | NSM Condition | Interpretation |
|-------|-------------|----------------|
| Eroded High | NSM < −5 m | Severe retreat |
| Eroded Low | −5 ≤ NSM < −1 m | Marginal retreat |
| Stable | −1 ≤ NSM ≤ +1 m | Within measurement noise |
| Accreted Low | +1 < NSM ≤ +5 m | Marginal advance |
| Accreted High | NSM > +5 m | Significant advance |
""")

# =====================================================================
# Cell 5  – Section 1.1: 5-class classification
# =====================================================================
code("""\
# =============================================================================
# Section 1.1 — Apply 5-class uncertainty-aware NSM classification
# =============================================================================

HIGH_EROSION_THRESHOLD = -5.0
LOW_EROSION_THRESHOLD  = -1.0
LOW_ACCRETION_THRESHOLD = 1.0
HIGH_ACCRETION_THRESHOLD = 5.0
EPR_UNCERTAINTY = 0.47  # m/yr uniform DSAS uncertainty

def classify_nsm(nsm):
    if nsm < HIGH_EROSION_THRESHOLD:
        return 'eroded_high'
    elif nsm < LOW_EROSION_THRESHOLD:
        return 'eroded_low'
    elif nsm <= LOW_ACCRETION_THRESHOLD:
        return 'stable'
    elif nsm <= HIGH_ACCRETION_THRESHOLD:
        return 'accreted_low'
    else:
        return 'accreted_high'

# --- Per-transect ---
dsas_df = dsas_raw.copy()
dsas_df['epr_class'] = dsas_df['NSM'].apply(classify_nsm)
dsas_df['erosion_flag'] = (dsas_df['NSM'] < LOW_EROSION_THRESHOLD).astype(int)

# --- Aggregate transects to YEARLY statistics ---
dsas_df['measurement_year'] = dsas_df['SCE_closest_year']
shoreline_annual = dsas_df.groupby('measurement_year').agg(
    annual_NSM=('NSM', 'mean'),
    NSM_median=('NSM', 'median'),
    NSM_std=('NSM', 'std'),
    NSM_min=('NSM', 'min'),
    NSM_max=('NSM', 'max'),
    NSM_count=('NSM', 'count'),
    EPR_mean=('EPR', 'mean'),
    EPR_std=('EPR', 'std'),
    LRR_mean=('LRR', 'mean'),
    SCE_max=('SCE', 'max'),
).reset_index().rename(columns={'measurement_year': 'year'})

shoreline_annual['Change_Class'] = shoreline_annual['annual_NSM'].apply(classify_nsm)
shoreline_annual['Erosion_Binary'] = (shoreline_annual['annual_NSM'] < LOW_EROSION_THRESHOLD).astype(int)

# Beach-scale summary
transect_stats = {
    'Total_Transects': len(dsas_df),
    'Mean_NSM': dsas_df['NSM'].mean(),
    'Median_NSM': dsas_df['NSM'].median(),
    'Std_NSM': dsas_df['NSM'].std(),
    'Pct_Eroding': (dsas_df['erosion_flag'].sum() / len(dsas_df)) * 100,
    'Max_Erosion': dsas_df['NSM'].min(),
    'Max_Accretion': dsas_df['NSM'].max(),
    'Mean_EPR': dsas_df['EPR'].mean(),
}

print("=" * 60)
print("FIVE-CLASS DISTRIBUTION (Annual)")
print("=" * 60)
print(shoreline_annual['Change_Class'].value_counts().to_string())
print(f"\\nErosion years (NSM < {LOW_EROSION_THRESHOLD}): "
      f"{shoreline_annual['Erosion_Binary'].sum()} / {len(shoreline_annual)}")
print(f"Mean NSM across transects: {transect_stats['Mean_NSM']:.2f} m")
print(f"Eroding transects: {transect_stats['Pct_Eroding']:.1f}%")
""")

# =====================================================================
# Cell 6  – Section 1.2: Spatial profile
# =====================================================================
code("""\
# =============================================================================
# Section 1.2 — Spatial profile plot (transect-level)
# =============================================================================

color_map = {
    'eroded_high': '#d62728', 'eroded_low': '#ff7f0e',
    'stable': '#2ca02c', 'accreted_low': '#1f77b4', 'accreted_high': '#9467bd'
}

fig, ax = plt.subplots(figsize=(14, 5))
for cls, clr in color_map.items():
    mask = dsas_df['epr_class'] == cls
    ax.bar(dsas_df.loc[mask, 'id'], dsas_df.loc[mask, 'NSM'],
           color=clr, label=cls, width=1.0, edgecolor='none')
ax.axhline(0, color='black', lw=0.8)
ax.axhline(LOW_EROSION_THRESHOLD, color='red', ls='--', lw=0.8, alpha=0.5)
ax.axhline(LOW_ACCRETION_THRESHOLD, color='blue', ls='--', lw=0.8, alpha=0.5)
ax.set_xlabel('Transect ID')
ax.set_ylabel('Net Shoreline Movement (m)')
ax.set_title('Transect-Level Shoreline Change')
ax.legend(loc='upper right', fontsize=8)
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('./figures/transect_profile.png', dpi=150)
plt.show()
""")

# =====================================================================
# Cell 7  – Section 1.3: Erosion event years
# =====================================================================
code("""\
# =============================================================================
# Section 1.3 — Extract erosion event years from peak retreat positions
# =============================================================================

eroded_transects = dsas_df[dsas_df['erosion_flag'] == 1]
year_col = 'SCE_closest_year'
erosion_year_counts = eroded_transects[year_col].value_counts().sort_index()

# Severity: if year appears in eroded_high set
high_erosion_transects = dsas_df[dsas_df['epr_class'] == 'eroded_high']
severe_years = set(high_erosion_transects[year_col].unique())

all_erosion_years = set(shoreline_annual.loc[shoreline_annual['Erosion_Binary'] == 1, 'year'].values)

print("=" * 60)
print("EROSION EVENT YEARS")
print("=" * 60)
for yr in sorted(all_erosion_years):
    sev = "HIGH" if yr in severe_years else "LOW"
    cnt = erosion_year_counts.get(yr, 0)
    print(f"  {yr}: {cnt} eroding transects ({sev} severity)")

print(f"\\nTotal erosion years: {len(all_erosion_years)}")
print(f"Non-erosion years: {len(shoreline_annual) - len(all_erosion_years)}")
""")

# =====================================================================
# Cell 8  – Section 2 markdown
# =====================================================================
md("""\
## Section 2 — Monthly Forcing Feature Extraction

Coastal erosion is driven by **extreme events**, not average conditions. The aggregation follows Peaks-Over-Threshold (POT) logic: maxima, 90th percentiles, storm counts, and cumulative energy.

| Driver Category | Variables | Aggregation |
|----------------|-----------|-------------|
| **Wave** | VHM0 (Sig. wave height) | Max, Mean, Std, P90 |
| | VTPK (Peak wave period) | Max, Mean |
| | VMDR (Wave direction) | Circular mean |
| | VSDX, VSDY (Stokes drift) | Magnitude mean/max |
| **Wind** | wind_speed | Max, Mean, Std, P90 |
| | eastward_wind, northward_wind | Mean |
| **Current** | uo, vo (Surface currents) | Magnitude mean/max, P90 |
| | zos (Sea surface height) | Max, Mean |
""")

# =====================================================================
# Cell 9  – Section 2.1: Wind features
# =====================================================================
code("""\
# =============================================================================
# Section 2.1 — Annual wind forcing features
# =============================================================================

WIND_VARS = ['wind_speed', 'eastward_wind', 'northward_wind']
STORM_WIND_THRESHOLD = 10.0  # m/s

wind_df = wind_ds[WIND_VARS].to_dataframe().reset_index()
wind_df = wind_df.dropna(subset=['wind_speed'])

def assign_monsoon_year(time):
    \"\"\"April (Year N) – March (Year N+1) → Monsoon Year N\"\"\"
    ts = pd.Timestamp(time)
    return ts.year if ts.month >= 4 else ts.year - 1

wind_df['monsoon_year'] = wind_df['time'].apply(assign_monsoon_year)
wind_df['year_month'] = wind_df['time'].dt.to_period('M')
wind_df['is_storm_wind'] = (wind_df['wind_speed'] > STORM_WIND_THRESHOLD).astype(int)

# Monthly
wind_monthly = wind_df.groupby(['monsoon_year', 'year_month']).agg({
    'wind_speed': ['max', 'mean', 'std'],
    'eastward_wind': 'mean',
    'northward_wind': 'mean',
    'is_storm_wind': 'sum',
    'time': 'first',
}).reset_index()
wind_monthly.columns = ['monsoon_year', 'year_month',
                        'WindSpeed_max', 'WindSpeed_mean', 'WindSpeed_std',
                        'EastWind_mean', 'NorthWind_mean',
                        'StormDays_wind', 'time']

# Annual
wind_annual = wind_df.groupby('monsoon_year').agg({
    'wind_speed': ['max', lambda x: np.percentile(x, 90), 'mean', 'std'],
    'eastward_wind': 'mean',
    'northward_wind': 'mean',
    'is_storm_wind': 'sum',
}).reset_index()
wind_annual.columns = ['monsoon_year',
                       'wind_max_annual', 'wind_p90', 'wind_mean_annual', 'wind_std_annual',
                       'eastwind_mean_annual', 'northwind_mean_annual',
                       'storm_days_wind_total']

print(f"Wind monthly: {wind_monthly.shape}")
print(f"Wind annual: {wind_annual.shape}")
print(f"Storm wind threshold: {STORM_WIND_THRESHOLD} m/s")
""")

# =====================================================================
# Cell 10  – Section 2.2: Wave features
# =====================================================================
code("""\
# =============================================================================
# Section 2.2 — Annual wave forcing features
# =============================================================================

WAVE_VARS = ['VHM0', 'VTPK', 'VMDR', 'VSDX', 'VSDY']
STORM_WAVE_THRESHOLD = 2.0  # meters

wave_df = wave_ds[WAVE_VARS].to_dataframe().reset_index()
wave_df = wave_df.dropna(subset=['VHM0'])
wave_df['monsoon_year'] = wave_df['time'].apply(assign_monsoon_year)
wave_df['year_month'] = wave_df['time'].dt.to_period('M')

wave_df['wave_energy'] = wave_df['VHM0']**2 * wave_df['VTPK']
wave_df['stokes_drift_mag'] = np.sqrt(wave_df['VSDX']**2 + wave_df['VSDY']**2)
wave_df['is_storm_wave'] = (wave_df['VHM0'] > STORM_WAVE_THRESHOLD).astype(int)

# Monthly
wave_monthly = wave_df.groupby(['monsoon_year', 'year_month']).agg({
    'VHM0': ['max', 'mean', 'std'],
    'VTPK': ['max', 'mean'],
    'VMDR': 'mean',
    'stokes_drift_mag': ['max', 'mean'],
    'wave_energy': 'sum',
    'is_storm_wave': 'sum',
    'time': 'first',
}).reset_index()
wave_monthly.columns = ['monsoon_year', 'year_month',
                        'VHM0_max', 'VHM0_mean', 'VHM0_std',
                        'VTPK_max', 'VTPK_mean',
                        'VMDR_mean',
                        'StokesDrift_max', 'StokesDrift_mean',
                        'CumWaveEnergy', 'StormDays_wave', 'time']

# Annual
wave_annual = wave_df.groupby('monsoon_year').agg({
    'VHM0':  ['max', lambda x: np.percentile(x, 90), 'mean', 'std'],
    'VTPK':  ['max', 'mean'],
    'stokes_drift_mag': ['max', 'mean'],
    'wave_energy': 'sum',
    'is_storm_wave': 'sum',
}).reset_index()
wave_annual.columns = ['monsoon_year',
                       'Hm0_max_annual', 'Hm0_p90', 'Hm0_mean_annual', 'Hm0_std_annual',
                       'Tp_max_annual', 'Tp_mean_annual',
                       'stokesdrift_max_annual', 'stokesdrift_mean_annual',
                       'cumwave_energy_annual', 'storm_days_wave_total']

print(f"Wave monthly: {wave_monthly.shape}")
print(f"Wave annual: {wave_annual.shape}")
print(f"Storm wave threshold: {STORM_WAVE_THRESHOLD} m")
""")

# =====================================================================
# Cell 11  – Section 2.3: Current features
# =====================================================================
code("""\
# =============================================================================
# Section 2.3 — Annual current forcing features (surface level)
# =============================================================================

CURRENT_VARS = ['uo', 'vo', 'zos']

# Select surface depth (index 0) for uo, vo
if 'depth' in current_ds.dims:
    current_surface = current_ds.isel(depth=0)
else:
    current_surface = current_ds

current_df = current_surface[CURRENT_VARS].to_dataframe().reset_index()
current_df = current_df.dropna(subset=['uo'])
current_df['monsoon_year'] = current_df['time'].apply(assign_monsoon_year)
current_df['year_month'] = current_df['time'].dt.to_period('M')
current_df['current_mag'] = np.sqrt(current_df['uo']**2 + current_df['vo']**2)

# Monthly
current_monthly = current_df.groupby(['monsoon_year', 'year_month']).agg({
    'current_mag': ['max', 'mean'],
    'uo': 'mean',
    'vo': 'mean',
    'zos': ['max', 'mean'],
    'time': 'first',
}).reset_index()
current_monthly.columns = ['monsoon_year', 'year_month',
                           'CurrentMag_max', 'CurrentMag_mean',
                           'UO_mean', 'VO_mean',
                           'ZOS_max', 'ZOS_mean', 'time']

# Annual
current_annual = current_df.groupby('monsoon_year').agg({
    'current_mag': ['max', lambda x: np.percentile(x, 90), 'mean', 'std'],
    'zos': ['max', 'mean'],
    'current_mag': ['max', 'mean', 'sum'],
}).reset_index()
# Re-compute properly
current_annual = current_df.groupby('monsoon_year').apply(
    lambda g: pd.Series({
        'ucurr_max_annual':  g['current_mag'].max(),
        'ucurr_p90':         np.percentile(g['current_mag'].dropna(), 90),
        'ucurr_mean_annual': g['current_mag'].mean(),
        'ucurr_std_annual':  g['current_mag'].std(),
        'zos_max_annual':    g['zos'].max(),
        'zos_mean_annual':   g['zos'].mean(),
        'cum_current_annual': g['current_mag'].sum(),
    })
).reset_index()

print(f"Current monthly: {current_monthly.shape}")
print(f"Current annual: {current_annual.shape}")
""")

# =====================================================================
# Cell 12  – Section 2.4: Merge
# =====================================================================
code("""\
# =============================================================================
# Section 2.4 — Merge all three into single annual forcing dataframe
# =============================================================================

env_annual = wave_annual.merge(wind_annual, on='monsoon_year', how='outer')
env_annual = env_annual.merge(current_annual, on='monsoon_year', how='outer')

# Restrict to period with reliable data
env_annual = env_annual[(env_annual['monsoon_year'] >= 2009) &
                        (env_annual['monsoon_year'] <= 2024)]
env_annual = env_annual.sort_values('monsoon_year').reset_index(drop=True)
env_annual = env_annual.ffill().bfill()

print("=" * 60)
print("MERGED ANNUAL FORCING MATRIX")
print("=" * 60)
print(f"Shape: {env_annual.shape}")
print(f"Years: {env_annual['monsoon_year'].min()} – {env_annual['monsoon_year'].max()}")
print(f"\\nFeatures ({len(env_annual.columns)}):")
for col in env_annual.columns:
    print(f"  • {col}")

display(env_annual.head())
""")

# =====================================================================
# Cell 13  – Section 2.5: Time series plot
# =====================================================================
code("""\
# =============================================================================
# Section 2.5 — Time series plot with erosion event overlay
# =============================================================================

fig, axes = plt.subplots(3, 1, figsize=(14, 10), sharex=True)

# Wave
ax = axes[0]
ax.plot(env_annual['monsoon_year'], env_annual['Hm0_max_annual'],
        'o-', color='#1f77b4', label='VHM0 max (m)')
for yr in all_erosion_years:
    ax.axvline(yr, color='red', alpha=0.15, lw=8)
ax.set_ylabel('Wave Height (m)')
ax.legend(loc='upper right', fontsize=8)
ax.grid(True, alpha=0.3)
ax.set_title('Annual Environmental Forcing with Erosion Events (red)')

# Wind
ax = axes[1]
ax.plot(env_annual['monsoon_year'], env_annual['wind_max_annual'],
        's-', color='#ff7f0e', label='Wind Speed max (m/s)')
for yr in all_erosion_years:
    ax.axvline(yr, color='red', alpha=0.15, lw=8)
ax.set_ylabel('Wind Speed (m/s)')
ax.legend(loc='upper right', fontsize=8)
ax.grid(True, alpha=0.3)

# Current
ax = axes[2]
ax.plot(env_annual['monsoon_year'], env_annual['ucurr_max_annual'],
        '^-', color='#2ca02c', label='Current mag max (m/s)')
for yr in all_erosion_years:
    ax.axvline(yr, color='red', alpha=0.15, lw=8)
ax.set_ylabel('Current (m/s)')
ax.set_xlabel('Monsoon Year')
ax.legend(loc='upper right', fontsize=8)
ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('./figures/env_timeseries.png', dpi=150)
plt.show()
""")

# =====================================================================
# Cell 14  – Section 3 markdown
# =====================================================================
md("""\
## Section 3 — Erosion Event Labeling and Dataset Join

This section creates the **binary-labeled combined dataset** by merging annual forcing features with actual shoreline erosion observations.

Then performs **Mann-Whitney U tests** with **Cliff's delta** effect sizes to identify which environmental drivers show statistically significant differences between erosion and non-erosion years.
""")

# =====================================================================
# Cell 15  – Section 3.1: Labels
# =====================================================================
code("""\
# =============================================================================
# Section 3.1 — Restrict to overlapping years and create analysis dataset
# =============================================================================

# Merge annual forcing with shoreline labels
analysis_df = env_annual.merge(
    shoreline_annual[['year', 'annual_NSM', 'Erosion_Binary', 'Change_Class', 'NSM_count']],
    left_on='monsoon_year', right_on='year', how='inner'
).drop(columns=['year'], errors='ignore')

analysis_df = analysis_df.rename(columns={'Erosion_Binary': 'erosion_label'})

# Severity label (for diagnosis)
analysis_df['severity'] = analysis_df['Change_Class'].map(
    {'eroded_high': 2, 'eroded_low': 1, 'stable': 0,
     'accreted_low': 0, 'accreted_high': 0}
).fillna(0).astype(int)

print("=" * 60)
print("ANALYSIS DATASET")
print("=" * 60)
print(f"Shape: {analysis_df.shape}")
print(f"Years: {analysis_df['monsoon_year'].min()} – {analysis_df['monsoon_year'].max()}")
print(f"Erosion years: {analysis_df['erosion_label'].sum()} / {len(analysis_df)}")
print(f"Base rate: {analysis_df['erosion_label'].mean():.2%}")

display(analysis_df[['monsoon_year', 'annual_NSM', 'erosion_label', 'Change_Class']].to_string(index=False))
""")

# =====================================================================
# Cell 16  – Section 3.2: Mann-Whitney + Cliff's delta  [FIX 1]
# =====================================================================
code("""\
# =============================================================================
# Section 3.2 — Mann-Whitney U test + Cliff's delta effect size
# =============================================================================

def cliffs_delta(x, y):
    \"\"\"
    Compute Cliff's delta (non-parametric effect size).
    δ = (#{x_i > y_j} - #{x_i < y_j}) / (n_x × n_y)
    |δ| < 0.147: negligible, < 0.33: small, < 0.474: medium, else: large
    \"\"\"
    nx, ny = len(x), len(y)
    if nx == 0 or ny == 0:
        return np.nan, 'N/A'
    more = sum(1 for xi in x for yj in y if xi > yj)
    less = sum(1 for xi in x for yj in y if xi < yj)
    delta = (more - less) / (nx * ny)
    abs_d = abs(delta)
    if abs_d < 0.147:
        magnitude = 'negligible'
    elif abs_d < 0.33:
        magnitude = 'small'
    elif abs_d < 0.474:
        magnitude = 'medium'
    else:
        magnitude = 'large'
    return round(delta, 4), magnitude

feature_cols = [c for c in analysis_df.columns
                if c not in ['monsoon_year', 'erosion_label', 'severity',
                             'annual_NSM', 'Change_Class', 'NSM_count']]

erosion_rows     = analysis_df[analysis_df['erosion_label'] == 1]
non_erosion_rows = analysis_df[analysis_df['erosion_label'] == 0]

mw_results = []
for feat in feature_cols:
    e_vals  = erosion_rows[feat].dropna()
    ne_vals = non_erosion_rows[feat].dropna()
    if len(e_vals) < 1 or len(ne_vals) < 1:
        continue
    cd, cd_mag = cliffs_delta(e_vals.values, ne_vals.values)
    try:
        stat, pval = mannwhitneyu(e_vals, ne_vals, alternative='two-sided')
    except Exception:
        stat, pval = np.nan, np.nan
    mw_results.append({
        'feature':          feat,
        'erosion_mean':     round(e_vals.mean(), 4),
        'non_erosion_mean': round(ne_vals.mean(), 4),
        'difference':       round(e_vals.mean() - ne_vals.mean(), 4),
        'U_statistic':      round(stat, 2) if not np.isnan(stat) else np.nan,
        'p_value':          round(pval, 4) if not np.isnan(pval) else np.nan,
        'cliffs_delta':     cd,
        'effect_size':      cd_mag,
        'significant':      pval < 0.05 if not np.isnan(pval) else False,
    })

mw_df = pd.DataFrame(mw_results)

if len(mw_df) == 0:
    # Fallback: rank features by absolute mean difference
    fallback = []
    for feat in feature_cols:
        e_m = erosion_rows[feat].mean()
        ne_m = non_erosion_rows[feat].mean()
        diff = abs(e_m - ne_m) if not (np.isnan(e_m) or np.isnan(ne_m)) else 0
        fallback.append({'feature': feat, 'erosion_mean': round(e_m, 4),
                         'non_erosion_mean': round(ne_m, 4),
                         'difference': round(e_m - ne_m, 4) if not np.isnan(e_m) else 0,
                         'U_statistic': np.nan, 'p_value': np.nan,
                         'cliffs_delta': np.nan, 'effect_size': 'N/A',
                         'significant': False, 'abs_diff': diff})
    mw_df = pd.DataFrame(fallback).sort_values('abs_diff', ascending=False).drop(columns=['abs_diff'])
else:
    # Sort: significant first by p-value, then non-significant by |cliffs_delta|
    mw_df['_sort_key'] = mw_df.apply(
        lambda r: r['p_value'] if r['significant'] else 1 + (1 - abs(r['cliffs_delta']) if not np.isnan(r['cliffs_delta']) else 2),
        axis=1)
    mw_df = mw_df.sort_values('_sort_key').drop(columns=['_sort_key'])

# Select features
significant_features = mw_df[mw_df['significant'] == True]['feature'].tolist()
if len(significant_features) < 3:
    significant_features = mw_df.head(min(5, len(mw_df)))['feature'].tolist()

print("=== Mann-Whitney U Test Results with Cliff's Delta Effect Size ===")
print(mw_df.to_string(index=False))
print(f"\\nSelected features: {significant_features}")

sig_rows = mw_df[mw_df['significant'] == True]
if len(sig_rows) > 0:
    print("\\nEffect size summary (Cliff's delta):")
    for _, row in sig_rows.iterrows():
        print(f"  {row['feature']}: delta = {row['cliffs_delta']} ({row['effect_size']})")
else:
    print("\\nNo statistically significant features at p<0.05 (small sample).")
    print("Features selected by effect size / mean difference ranking.")
""")

# =====================================================================
# Cell 17  – Section 3.3: Box plots  [FIX 2]
# =====================================================================
code("""\
# =============================================================================
# Section 3.3 — Box plot comparison for top features
# =============================================================================

top_feats = significant_features[:min(6, len(significant_features))]
n_feats = len(top_feats)

if n_feats == 0:
    print("No features to plot.")
else:
    n_cols = min(3, n_feats)
    n_rows = int(np.ceil(n_feats / n_cols))

    fig, axes = plt.subplots(n_rows, n_cols, figsize=(5 * n_cols, 4.5 * n_rows))
    axes = np.atleast_1d(axes).ravel()

    for i, feat in enumerate(top_feats):
        ax = axes[i]
        data = [non_erosion_rows[feat].dropna().values, erosion_rows[feat].dropna().values]
        bp = ax.boxplot(data, labels=['Non-Erosion', 'Erosion'], patch_artist=True,
                        widths=0.5,
                        boxprops=dict(linewidth=1.5),
                        medianprops=dict(color='black', linewidth=2))
        bp['boxes'][0].set_facecolor('#4A90D9')
        bp['boxes'][1].set_facecolor('#E24B4A')
        ax.set_title(feat, fontsize=10, fontweight='bold')
        ax.grid(True, alpha=0.3, axis='y')

    # Hide unused axes
    for j in range(i + 1, len(axes)):
        axes[j].set_visible(False)

    plt.suptitle('Erosion vs Non-Erosion Year Distributions', fontsize=13, y=1.01)
    plt.tight_layout()
    plt.savefig('./figures/boxplot_comparison.png', dpi=150, bbox_inches='tight')
    plt.show()
""")

# =====================================================================
# Cell 18  – Section 4 markdown
# =====================================================================
md("""\
## Section 4 — Advanced Multi-Method Ensemble Threshold Detection

This section implements a **four-method ensemble** for identifying erosion thresholds per forcing feature:

| Method | Principle | Reference |
|--------|-----------|-----------|
| **A. ROC / Youden's J** | Maximize sensitivity + specificity (Youden, 1950) | Standard in clinical & environmental sciences |
| **B. Bayesian Logistic Inflection** | Find P(erosion) = 0.5 inflection via logistic regression | Principled probabilistic interpretation |
| **C. Profile-Likelihood Change-Point** | Maximize log-likelihood ratio across all candidate splits | Distribution-free, well-suited for small N |
| **D. Maximum Mutual Information** | Maximize Shannon information I(X_binary ; Y) | Non-parametric, information-theoretic |

**Permutation testing** (n = 5 000) provides exact p-values for each threshold's discriminatory power. **Bootstrap resampling** (n = 2 000) provides 95 % confidence intervals.

> **Why NOT Hidden Markov Models?**
> HMMs model sequential regime transitions and excel with long time series (n > 100). With only ~15 annual observations the transition matrix is under-determined (4 free parameters from just 14 transitions). Furthermore, consecutive erosion/non-erosion years in this monsoon-driven system are not necessarily Markov-dependent — external forcing (ENSO, IOD) can cause non-adjacent erosion events. The four methods above directly optimize threshold location and uncertainty, making them more appropriate for this application.
""")

# =====================================================================
# Cell 19  – Section 4.1: Four-method ensemble  [FIX 3]
# =====================================================================
code("""\
# =============================================================================
# Section 4.1 — Four-method ensemble threshold detection per feature
# =============================================================================

# ── Helper functions ──

def _permutation_auc(X, y, n_perm=5000, rng_seed=42):
    \"\"\"Exact permutation p-value for AUC > 0.5.\"\"\"
    if len(np.unique(y)) < 2:
        return np.nan
    rng = np.random.default_rng(rng_seed)
    fpr, tpr, _ = roc_curve(y, X)
    observed_auc = auc(fpr, tpr)
    count = sum(
        1 for _ in range(n_perm)
        if auc(*roc_curve(rng.permutation(y), X)[:2]) >= observed_auc
    )
    return count / n_perm


def _method_a_roc_youden(X_feat, y, n_boot=2000):
    \"\"\"Method A: ROC / Youden-J with bootstrap CI + permutation p.\"\"\"
    if len(np.unique(y)) < 2:
        return dict(threshold=np.nan, ci_lower=np.nan, ci_upper=np.nan,
                    auc=np.nan, sensitivity=np.nan, specificity=np.nan,
                    perm_p=np.nan, statistic=np.nan, p_value=np.nan, significant=False)
    fpr, tpr, thresholds = roc_curve(y, X_feat)
    roc_auc = auc(fpr, tpr)
    j_scores = tpr - fpr
    opt_idx  = np.argmax(j_scores)
    opt_thresh = thresholds[opt_idx]
    sens, spec = tpr[opt_idx], 1 - fpr[opt_idx]

    rng = np.random.default_rng(42)
    boot = []
    for _ in range(n_boot):
        idx = rng.choice(len(y), len(y), replace=True)
        if len(np.unique(y[idx])) < 2:
            continue
        fp, tp, ths = roc_curve(y[idx], X_feat[idx])
        boot.append(ths[np.argmax(tp - fp)])
    ci = np.percentile(boot, [2.5, 97.5]) if boot else [np.nan, np.nan]
    perm_p = _permutation_auc(X_feat, y)

    return dict(threshold=opt_thresh, ci_lower=ci[0], ci_upper=ci[1],
                auc=roc_auc, sensitivity=sens, specificity=spec,
                perm_p=perm_p, statistic=roc_auc, p_value=perm_p,
                significant=perm_p < 0.05 if not np.isnan(perm_p) else False)


def _method_b_bayesian_logistic(X_feat, y, n_boot=2000):
    \"\"\"Method B: Logistic-regression inflection (P=0.5 crossing).\"\"\"
    if len(np.unique(y)) < 2:
        return dict(threshold=np.nan, ci_lower=np.nan, ci_upper=np.nan,
                    logistic_coef=np.nan, statistic=np.nan)
    sc = StandardScaler()
    Xs = sc.fit_transform(X_feat.reshape(-1, 1))
    lr = LogisticRegression(random_state=42, class_weight='balanced',
                            solver='lbfgs', max_iter=500)
    lr.fit(Xs, y)
    thresh_orig = (-lr.intercept_[0] / lr.coef_[0][0]) * sc.scale_[0] + sc.mean_[0]

    rng = np.random.default_rng(42)
    boot = []
    for _ in range(n_boot):
        idx = rng.choice(len(y), len(y), replace=True)
        if len(np.unique(y[idx])) < 2:
            continue
        s = StandardScaler(); Xb = s.fit_transform(X_feat[idx].reshape(-1, 1))
        lr_b = LogisticRegression(random_state=42, class_weight='balanced',
                                  solver='lbfgs', max_iter=500)
        lr_b.fit(Xb, y[idx])
        boot.append((-lr_b.intercept_[0] / lr_b.coef_[0][0]) * s.scale_[0] + s.mean_[0])
    ci = np.percentile(boot, [2.5, 97.5]) if boot else [np.nan, np.nan]

    return dict(threshold=thresh_orig, ci_lower=ci[0], ci_upper=ci[1],
                logistic_coef=lr.coef_[0][0] * sc.scale_[0],
                statistic=abs(lr.coef_[0][0] * sc.scale_[0]))


def _method_c_profile_likelihood(X_feat, y):
    \"\"\"Method C: Profile-likelihood change-point detection.\"\"\"
    sorted_x = np.sort(np.unique(X_feat))
    if len(sorted_x) < 3:
        return dict(threshold=np.nan, ci_lower=np.nan, ci_upper=np.nan, LR_stat=np.nan,
                    statistic=np.nan)

    candidates = (sorted_x[:-1] + sorted_x[1:]) / 2
    p_all = np.clip(y.mean(), 1e-8, 1 - 1e-8)
    ll_null = np.sum(y * np.log(p_all) + (1 - y) * np.log(1 - p_all))

    best_ll, best_t = -np.inf, np.nan
    ll_profile = []
    for t in candidates:
        below, above = y[X_feat <= t], y[X_feat > t]
        if len(below) < 1 or len(above) < 1:
            ll_profile.append(-np.inf); continue
        p1 = np.clip(below.mean(), 1e-8, 1 - 1e-8)
        p2 = np.clip(above.mean(), 1e-8, 1 - 1e-8)
        ll = (np.sum(below * np.log(p1) + (1 - below) * np.log(1 - p1)) +
              np.sum(above * np.log(p2) + (1 - above) * np.log(1 - p2)))
        ll_profile.append(ll)
        if ll > best_ll:
            best_ll, best_t = ll, t

    lr_stat = 2 * (best_ll - ll_null) if best_ll > -np.inf else 0.0
    ll_arr = np.array(ll_profile)
    valid = ll_arr > -np.inf
    cutoff = best_ll - 1.92          # chi2(1, 0.95)/2
    in_ci = candidates[valid][ll_arr[valid] >= cutoff] if valid.sum() else np.array([])
    ci = [in_ci.min(), in_ci.max()] if len(in_ci) else [np.nan, np.nan]

    return dict(threshold=best_t, ci_lower=ci[0], ci_upper=ci[1], LR_stat=lr_stat,
                statistic=lr_stat)


def _method_d_mutual_information(X_feat, y, n_boot=2000):
    \"\"\"Method D: Maximum mutual-information threshold.\"\"\"
    sorted_x = np.sort(np.unique(X_feat))
    if len(sorted_x) < 3:
        return dict(threshold=np.nan, ci_lower=np.nan, ci_upper=np.nan, MI=np.nan,
                    statistic=np.nan, mi=np.nan)

    candidates = (sorted_x[:-1] + sorted_x[1:]) / 2
    best_mi, best_t = -np.inf, np.nan
    for t in candidates:
        X_bin = (X_feat > t).astype(int)
        if len(np.unique(X_bin)) < 2:
            continue
        mi = mutual_info_score(X_bin, y)
        if mi > best_mi:
            best_mi, best_t = mi, t

    rng = np.random.default_rng(42)
    boot = []
    for _ in range(n_boot):
        idx = rng.choice(len(y), len(y), replace=True)
        if len(np.unique(y[idx])) < 2:
            continue
        bm, bt = -np.inf, np.nan
        for t in candidates:
            X_bin = (X_feat[idx] > t).astype(int)
            if len(np.unique(X_bin)) < 2:
                continue
            mi = mutual_info_score(X_bin, y[idx])
            if mi > bm:
                bm, bt = mi, t
        if not np.isnan(bt):
            boot.append(bt)
    ci = np.percentile(boot, [2.5, 97.5]) if boot else [np.nan, np.nan]

    return dict(threshold=best_t, ci_lower=ci[0], ci_upper=ci[1], MI=best_mi,
                statistic=best_mi, mi=best_mi)


# ── Safe formatter for NaN values ──
def _sf(v, fmt='.4f'):
    try:
        if v is None:
            return 'N/A'
        return format(v, fmt)
    except (ValueError, TypeError):
        return 'N/A'


# ── Run all 4 methods on each significant feature ──

ensemble_results = {}
individual_thresholds = {}

for feat in significant_features:
    X_feat = analysis_df[feat].values
    y      = analysis_df['erosion_label'].values

    print(f"\\n{'='*65}")
    print(f"  Feature: {feat}")
    print(f"{'='*65}")

    try:
        res_a = _method_a_roc_youden(X_feat, y)
    except Exception:
        res_a = dict(threshold=np.nan, ci_lower=np.nan, ci_upper=np.nan,
                     auc=np.nan, sensitivity=np.nan, specificity=np.nan,
                     perm_p=np.nan, statistic=np.nan, p_value=np.nan, significant=False)
    try:
        res_b = _method_b_bayesian_logistic(X_feat, y)
    except Exception:
        res_b = dict(threshold=np.nan, ci_lower=np.nan, ci_upper=np.nan,
                     logistic_coef=np.nan, statistic=np.nan)
    try:
        res_c = _method_c_profile_likelihood(X_feat, y)
    except Exception:
        res_c = dict(threshold=np.nan, ci_lower=np.nan, ci_upper=np.nan,
                     LR_stat=np.nan, statistic=np.nan)
    try:
        res_d = _method_d_mutual_information(X_feat, y)
    except Exception:
        res_d = dict(threshold=np.nan, ci_lower=np.nan, ci_upper=np.nan,
                     MI=np.nan, statistic=np.nan, mi=np.nan)

    # Weighted-median consensus
    items = [
        ('ROC/Youden J',       res_a, res_a.get('auc', 0.5)),
        ('Bayesian Logistic',  res_b, 1.0),
        ('Profile Likelihood', res_c, max(res_c.get('LR_stat', 0) or 0, 0.01)),
        ('Mutual Information', res_d, max(res_d.get('MI', 0) or 0, 0.01)),
    ]
    tv, wv = [], []
    for _, r, w in items:
        t = r['threshold']
        if not np.isnan(t):
            tv.append(t); wv.append(w)

    if tv:
        sp = sorted(zip(tv, wv))
        cum = np.cumsum([w for _, w in sp])
        consensus = sp[np.searchsorted(cum, cum[-1] / 2)][0]
        tol = 0.10 * abs(consensus) if consensus != 0 else 0.1
        agreement = sum(1 for t in tv if abs(t - consensus) <= tol) / len(tv)
    else:
        consensus, agreement = np.nan, 0.0

    pct_rank = stats.percentileofscore(X_feat, consensus) if not np.isnan(consensus) else np.nan

    ensemble_results[feat] = dict(
        roc_youden=res_a, bayesian_logistic=res_b,
        change_point=res_c, mutual_info=res_d,
        consensus_threshold=consensus, consensus_agreement=agreement,
        percentile_rank=pct_rank,
    )

    # Store for export cell
    mw_row = mw_df[mw_df['feature'] == feat]
    p_val = mw_row['p_value'].values[0] if len(mw_row) else np.nan
    individual_thresholds[feat] = {
        'threshold_all': consensus,
        'threshold_low': min(tv) if tv else np.nan,
        'threshold_high': max(tv) if tv else np.nan,
        'p_value': p_val,
    }

    print(f"  A  ROC/Youden J       : {_sf(res_a['threshold'], '>9.4f')}  "
          f"[{_sf(res_a['ci_lower'])}, {_sf(res_a['ci_upper'])}]  "
          f"AUC={_sf(res_a.get('auc', np.nan), '.3f')}  p={_sf(res_a.get('perm_p', np.nan))}")
    print(f"  B  Bayesian Logistic  : {_sf(res_b['threshold'], '>9.4f')}  "
          f"[{_sf(res_b['ci_lower'])}, {_sf(res_b['ci_upper'])}]")
    print(f"  C  Profile Likelihood : {_sf(res_c['threshold'], '>9.4f')}  "
          f"[{_sf(res_c['ci_lower'])}, {_sf(res_c['ci_upper'])}]  "
          f"LR={_sf(res_c.get('LR_stat', 0), '.2f')}")
    print(f"  D  Mutual Information : {_sf(res_d['threshold'], '>9.4f')}  "
          f"[{_sf(res_d['ci_lower'])}, {_sf(res_d['ci_upper'])}]  "
          f"MI={_sf(res_d.get('MI', 0))}")
    print(f"  ── Consensus          : {_sf(consensus, '>9.4f')}  "
          f"Agreement={agreement:.0%}  Percentile={_sf(pct_rank, '.1f')}")
""")

# =====================================================================
# Cell 20  – Section 4.2: Forest plot + ROC  [FIX 4]
# =====================================================================
code("""\
# =============================================================================
# Section 4.2 — Forest plot + ROC + distribution overlay per feature
# =============================================================================

n_sf = len(significant_features)

if n_sf == 0:
    print("No significant features to plot.")
else:
    fig, axes = plt.subplots(n_sf, 3, figsize=(16, 4.5 * n_sf))
    if n_sf == 1:
        axes = axes.reshape(1, -1)

    method_colors = {'ROC/Youden J': '#1f77b4', 'Bayesian Logistic': '#ff7f0e',
                     'Profile Likelihood': '#2ca02c', 'Mutual Information': '#d62728'}

    for i, feat in enumerate(significant_features):
        er = ensemble_results[feat]
        X_feat = analysis_df[feat].values
        y = analysis_df['erosion_label'].values

        # Forest plot
        ax = axes[i, 0]
        methods = [
            ('ROC/Youden J',       er['roc_youden']),
            ('Bayesian Logistic',  er['bayesian_logistic']),
            ('Profile Likelihood', er['change_point']),
            ('Mutual Information', er['mutual_info']),
        ]
        for j, (mname, mres) in enumerate(methods):
            t = mres['threshold']
            lo, hi = mres.get('ci_lower', np.nan), mres.get('ci_upper', np.nan)
            ax.errorbar(t, j, xerr=[[t - lo], [hi - t]] if not np.isnan(lo) else None,
                        fmt='o', color=list(method_colors.values())[j],
                        capsize=5, markersize=8, label=mname)
        ax.axvline(er['consensus_threshold'], color='black', ls='--', lw=1.5,
                   label=f"Consensus={er['consensus_threshold']:.3f}")
        ax.set_yticks(range(4))
        ax.set_yticklabels([m[0] for m in methods], fontsize=8)
        ax.set_xlabel(feat, fontsize=9)
        ax.set_title(f'{feat} – Forest Plot', fontsize=10)
        ax.legend(fontsize=7, loc='lower right')
        ax.grid(True, alpha=0.3, axis='x')

        # ROC curve
        ax = axes[i, 1]
        fpr, tpr, _ = roc_curve(y, X_feat)
        ax.plot(fpr, tpr, 'b-', lw=2, label=f'AUC={auc(fpr, tpr):.3f}')
        ax.plot([0, 1], [0, 1], 'k--', lw=0.8)
        ax.set_xlabel('FPR'); ax.set_ylabel('TPR')
        ax.set_title(f'{feat} – ROC', fontsize=10)
        ax.legend(fontsize=9)
        ax.grid(True, alpha=0.3)

        # Distribution overlay
        ax = axes[i, 2]
        e_vals  = analysis_df.loc[analysis_df['erosion_label'] == 1, feat]
        ne_vals = analysis_df.loc[analysis_df['erosion_label'] == 0, feat]
        bins = np.linspace(X_feat.min(), X_feat.max(), 15)
        ax.hist(ne_vals, bins=bins, alpha=0.5, color='#4A90D9', label='Non-Erosion', density=True)
        ax.hist(e_vals,  bins=bins, alpha=0.5, color='#E24B4A', label='Erosion', density=True)
        ax.axvline(er['consensus_threshold'], color='black', ls='--', lw=1.5, label='Threshold')
        ax.set_xlabel(feat, fontsize=9)
        ax.set_title(f'{feat} – Distributions', fontsize=10)
        ax.legend(fontsize=8)
        ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig('./figures/ensemble_thresholds.png', dpi=150, bbox_inches='tight')
    plt.show()
""")

# =====================================================================
# Cell 21  – Section 4.3 markdown
# =====================================================================
md("""\
### Section 4.3 — Threshold Stability Analysis (Bootstrap Cross-Validation)

To assess whether the consensus thresholds are robust or an artifact of this particular sample, we perform **bootstrap cross-validation** (n = 500). For each resample, the full 4-method ensemble is re-run and the consensus threshold recorded. The **coefficient of variation (CV)** quantifies stability:
- CV < 0.10 → Highly stable
- CV > 0.15 → Caution warranted
""")

# =====================================================================
# Cell 22  – Section 4.3: Stability analysis  [FIX 5]
# =====================================================================
code("""\
# =============================================================================
# Section 4.3 — Threshold stability: bootstrap cross-validation (n=500)
# =============================================================================

n_bootstrap = 500
rng = np.random.default_rng(42)
stability_results = {}

for feat in significant_features:
    X_feat = analysis_df[feat].values
    y      = analysis_df['erosion_label'].values
    boot_consensi = []

    for _ in range(n_bootstrap):
        idx = rng.choice(len(y), len(y), replace=True)
        if len(np.unique(y[idx])) < 2:
            continue
        Xb, yb = X_feat[idx], y[idx]

        # Quick 4-method run (reduced iterations for speed)
        try:
            fpr, tpr, ths = roc_curve(yb, Xb)
            t_a = ths[np.argmax(tpr - fpr)]
        except Exception:
            t_a = np.nan

        try:
            sc = StandardScaler(); Xs = sc.fit_transform(Xb.reshape(-1, 1))
            lr = LogisticRegression(random_state=42, class_weight='balanced',
                                    solver='lbfgs', max_iter=200)
            lr.fit(Xs, yb)
            t_b = (-lr.intercept_[0] / lr.coef_[0][0]) * sc.scale_[0] + sc.mean_[0]
        except Exception:
            t_b = np.nan

        try:
            sx = np.sort(np.unique(Xb))
            cand = (sx[:-1] + sx[1:]) / 2
            best_ll, t_c = -np.inf, np.nan
            p_all = np.clip(yb.mean(), 1e-8, 1 - 1e-8)
            ll_null = np.sum(yb * np.log(p_all) + (1 - yb) * np.log(1 - p_all))
            for t in cand:
                bl, ab = yb[Xb <= t], yb[Xb > t]
                if len(bl) < 2 or len(ab) < 2: continue
                p1, p2 = np.clip(bl.mean(), 1e-8, 1-1e-8), np.clip(ab.mean(), 1e-8, 1-1e-8)
                ll = (np.sum(bl*np.log(p1) + (1-bl)*np.log(1-p1)) +
                      np.sum(ab*np.log(p2) + (1-ab)*np.log(1-p2)))
                if ll > best_ll: best_ll, t_c = ll, t
        except Exception:
            t_c = np.nan

        try:
            best_mi, t_d = -np.inf, np.nan
            for t in cand:
                xb = (Xb > t).astype(int)
                if len(np.unique(xb)) < 2: continue
                mi = mutual_info_score(xb, yb)
                if mi > best_mi: best_mi, t_d = mi, t
        except Exception:
            t_d = np.nan

        vals = [v for v in [t_a, t_b, t_c, t_d] if not np.isnan(v)]
        if vals:
            boot_consensi.append(np.median(vals))

    if len(boot_consensi) == 0:
        stability_results[feat] = {
            'mean': np.nan, 'std': np.nan, 'cv': np.nan,
            'ci_lower': np.nan, 'ci_upper': np.nan, 'stable': False,
        }
        print(f"{feat}: No valid bootstrap samples (too few data). UNSTABLE")
        continue

    arr = np.array(boot_consensi)
    cv = arr.std() / abs(arr.mean()) if abs(arr.mean()) > 1e-10 else np.nan
    stability_results[feat] = {
        'mean': arr.mean(), 'std': arr.std(), 'cv': cv,
        'ci_lower': np.percentile(arr, 2.5),
        'ci_upper': np.percentile(arr, 97.5),
        'stable': cv < 0.15 if not np.isnan(cv) else False,
    }
    status = "✓ STABLE" if cv < 0.10 else ("⚠ MARGINAL" if cv < 0.15 else "✗ UNSTABLE")
    print(f"{feat}: CV = {cv:.4f}  [{np.percentile(arr, 2.5):.3f}, {np.percentile(arr, 97.5):.3f}]  {status}")
""")

# =====================================================================
# Cell 23  – Section 5 markdown
# =====================================================================
md("""\
## Section 5 — Combined Multi-Factor Threshold Analysis

Three complementary methods for combined thresholds:

1. **Logistic regression decision boundaries** for factor pairs
2. **Chi-square joint exceedance test** — are simultaneous threshold crossings associated with erosion?
3. **Random Forest LOO-CV + permutation importance** — nonlinear multi-factor prediction
""")

# =====================================================================
# Cell 24  – Section 5.1: Pair logistic  [FIX 6]
# =====================================================================
code("""\
# =============================================================================
# Section 5.1 — Factor pair logistic regression decision boundaries
# =============================================================================

from itertools import combinations

top3 = significant_features[:min(3, len(significant_features))]
pairs = list(combinations(top3, 2))

n_pairs = len(pairs)

if n_pairs == 0:
    print("Not enough features for pairwise logistic regression plots.")
else:
    fig, axes = plt.subplots(1, n_pairs, figsize=(6 * n_pairs, 5))
    if n_pairs == 1:
        axes = [axes]

    for ax, (f1, f2) in zip(axes, pairs):
        X_pair = analysis_df[[f1, f2]].values
        y = analysis_df['erosion_label'].values

        sc = StandardScaler()
        Xs = sc.fit_transform(X_pair)
        lr = LogisticRegression(random_state=42, class_weight='balanced',
                                solver='lbfgs', max_iter=500)
        lr.fit(Xs, y)

        # Decision boundary
        x_min, x_max = X_pair[:, 0].min() - 0.5, X_pair[:, 0].max() + 0.5
        y_min, y_max = X_pair[:, 1].min() - 0.5, X_pair[:, 1].max() + 0.5
        xx, yy = np.meshgrid(np.linspace(x_min, x_max, 200),
                             np.linspace(y_min, y_max, 200))
        Zs = sc.transform(np.c_[xx.ravel(), yy.ravel()])
        Z = lr.predict_proba(Zs)[:, 1].reshape(xx.shape)

        ax.contourf(xx, yy, Z, levels=20, cmap='RdBu_r', alpha=0.3)
        ax.contour(xx, yy, Z, levels=[0.5], colors='black', linewidths=2)
        scatter = ax.scatter(X_pair[:, 0], X_pair[:, 1], c=y, cmap='RdBu_r',
                             edgecolors='white', s=60, zorder=5)
        ax.set_xlabel(f1, fontsize=10)
        ax.set_ylabel(f2, fontsize=10)
        ax.set_title(f'{f1} vs {f2}\\nLR Decision Boundary', fontsize=10)
        ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig('./figures/pair_logistic.png', dpi=150, bbox_inches='tight')
    plt.show()
""")

# =====================================================================
# Cell 25  – Section 5.2: Chi-square  [FIX 7]
# =====================================================================
code("""\
# =============================================================================
# Section 5.2 — Chi-square joint exceedance test
# =============================================================================

print("=== JOINT EXCEEDANCE CHI-SQUARE TESTS ===\\n")

if not pairs:
    print("Not enough features for pairwise tests.")
else:
    for f1, f2 in pairs:
        t1 = ensemble_results[f1]['consensus_threshold']
        t2 = ensemble_results[f2]['consensus_threshold']
        exceed_1 = (analysis_df[f1] > t1).astype(int)
        exceed_2 = (analysis_df[f2] > t2).astype(int)
        joint     = ((exceed_1 == 1) & (exceed_2 == 1)).astype(int)
        y = analysis_df['erosion_label'].values

        ct = pd.crosstab(joint, y)
        if ct.shape == (2, 2):
            chi2, p, dof, expected = chi2_contingency(ct)
            print(f"{f1} × {f2}:")
            print(f"  χ² = {chi2:.3f}, p = {p:.4f}, dof = {dof}")
            print(f"  Joint exceedance + erosion: {((joint == 1) & (y == 1)).sum()}")
            print(f"  Joint exceedance + non-erosion: {((joint == 1) & (y == 0)).sum()}")
            print()
        else:
            print(f"{f1} × {f2}: Insufficient variation for chi-square test\\n")
""")

# =====================================================================
# Cell 26  – Section 5.3: Random Forest LOO-CV  [FIX 8]
# =====================================================================
code("""\
# =============================================================================
# Section 5.3 — Random Forest LOO-CV + permutation importance
# =============================================================================

X_rf = analysis_df[significant_features].values
y_rf = analysis_df['erosion_label'].values

try:
    rf = RandomForestClassifier(
        n_estimators=500,
        max_depth=4,
        min_samples_leaf=2,
        class_weight='balanced',
        random_state=42,
        oob_score=True,
        n_jobs=-1,
    )
    rf.fit(X_rf, y_rf)

    # LOO cross-validation
    loo = LeaveOneOut()
    y_pred_loo = cross_val_predict(rf, X_rf, y_rf, cv=loo)
    y_prob_loo = cross_val_predict(rf, X_rf, y_rf, cv=loo, method='predict_proba')[:, 1]

    print("=== RANDOM FOREST — LEAVE-ONE-OUT CROSS-VALIDATION ===")
    try:
        print(f"OOB Score: {rf.oob_score_:.4f}")
    except AttributeError:
        print("OOB Score: N/A")
    print(f"LOO Accuracy:  {accuracy_score(y_rf, y_pred_loo):.4f}")
    print(f"LOO Precision: {precision_score(y_rf, y_pred_loo, zero_division=0):.4f}")
    print(f"LOO Recall:    {recall_score(y_rf, y_pred_loo, zero_division=0):.4f}")
    print(f"LOO F1:        {f1_score(y_rf, y_pred_loo, zero_division=0):.4f}")
    try:
        print(f"LOO ROC-AUC:   {roc_auc_score(y_rf, y_prob_loo):.4f}")
    except ValueError:
        print("LOO ROC-AUC:   N/A (single class in fold)")
    print(f"\\n{classification_report(y_rf, y_pred_loo, zero_division=0)}")

except Exception as e:
    print(f"Random Forest failed: {e}")
    print("Falling back to a simple classifier for downstream cells.")
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=3,
        min_samples_leaf=1,
        class_weight='balanced',
        random_state=42,
        oob_score=False,
        n_jobs=-1,
    )
    rf.fit(X_rf, y_rf)
    y_pred_loo = rf.predict(X_rf)
    y_prob_loo = rf.predict_proba(X_rf)[:, 1]
    print("Fallback RF fitted (no LOO-CV).")
""")

# =====================================================================
# Cell 27  – Section 5.4: Feature importance
# =====================================================================
code("""\
# =============================================================================
# Section 5.4 — Feature importance: Gini vs permutation
# =============================================================================

gini_imp = pd.Series(rf.feature_importances_, index=significant_features).sort_values(ascending=False)

perm_result = permutation_importance(rf, X_rf, y_rf, n_repeats=30, random_state=42, n_jobs=-1)
perm_imp = pd.Series(perm_result.importances_mean, index=significant_features).sort_values(ascending=False)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, max(5, len(significant_features) * 0.5)))

ax1.barh(gini_imp.index, gini_imp.values, color='#1f77b4', edgecolor='white')
ax1.set_xlabel('Gini Importance')
ax1.set_title('Random Forest: Gini Importance')
ax1.grid(True, alpha=0.3, axis='x')
ax1.invert_yaxis()

ax2.barh(perm_imp.index, perm_imp.values, color='#ff7f0e', edgecolor='white')
ax2.set_xlabel('Permutation Importance')
ax2.set_title('Random Forest: Permutation Importance')
ax2.grid(True, alpha=0.3, axis='x')
ax2.invert_yaxis()

plt.tight_layout()
plt.savefig('./figures/rf_importance.png', dpi=150, bbox_inches='tight')
plt.show()
""")

# =====================================================================
# Cell 28  – Section 5.5: Three-factor combined
# =====================================================================
code("""\
# =============================================================================
# Section 5.5 — Three-factor threshold summary statement
# =============================================================================

top3_by_rf = gini_imp.index[:3].tolist()

print("=== THREE-FACTOR COMBINED THRESHOLD STATEMENT ===\\n")
for feat in top3_by_rf:
    er = ensemble_results.get(feat, {})
    ct = er.get('consensus_threshold', np.nan)
    print(f"  {feat}:")
    print(f"    Consensus threshold = {ct:.4f}")
    print(f"    Exceedance rate in erosion years: "
          f"{(analysis_df.loc[analysis_df['erosion_label']==1, feat] > ct).mean():.0%}")
    print(f"    Exceedance rate in non-erosion years: "
          f"{(analysis_df.loc[analysis_df['erosion_label']==0, feat] > ct).mean():.0%}")
    print()

# Joint exceedance of all three
masks = [(analysis_df[f] > ensemble_results[f]['consensus_threshold'])
         for f in top3_by_rf if f in ensemble_results]
if masks:
    joint_all = masks[0]
    for m in masks[1:]:
        joint_all = joint_all & m
    joint_erosion = (joint_all & (analysis_df['erosion_label'] == 1)).sum()
    joint_total = joint_all.sum()
    print(f"Joint exceedance of all 3: {joint_total} years "
          f"({joint_erosion} erosion, {joint_total - joint_erosion} non-erosion)")
""")

# =====================================================================
# Cell 29  – Section 6 markdown
# =====================================================================
md("""\
## Section 6 — Results Summary and Master Threshold Table

This section compiles all individual and combined thresholds into a master table with confidence intervals, AUC, agreement, and percentile rank.
""")

# =====================================================================
# Cell 30  – Section 6.1: Master table
# =====================================================================
code("""\
# =============================================================================
# Section 6.1 — Master threshold table (all features, all methods)
# =============================================================================

master_rows = []
for feat in significant_features:
    er = ensemble_results[feat]
    mw_row = mw_df[mw_df['feature'] == feat]
    p_val = mw_row['p_value'].values[0] if len(mw_row) else np.nan
    master_rows.append({
        'Variable': feat,
        'Threshold_consensus': round(er['consensus_threshold'], 4),
        'Threshold_low':  round(min(r['threshold'] for r in
                         [er['roc_youden'], er['bayesian_logistic'], er['change_point'], er['mutual_info']]
                         if not np.isnan(r['threshold'])), 4) if any(
                         not np.isnan(r['threshold']) for r in
                         [er['roc_youden'], er['bayesian_logistic'], er['change_point'], er['mutual_info']]) else np.nan,
        'Threshold_high': round(max(r['threshold'] for r in
                         [er['roc_youden'], er['bayesian_logistic'], er['change_point'], er['mutual_info']]
                         if not np.isnan(r['threshold'])), 4) if any(
                         not np.isnan(r['threshold']) for r in
                         [er['roc_youden'], er['bayesian_logistic'], er['change_point'], er['mutual_info']]) else np.nan,
        'CI_95_lower': round(er['roc_youden']['ci_lower'], 4),
        'CI_95_upper': round(er['roc_youden']['ci_upper'], 4),
        'AUC': round(er['roc_youden']['auc'], 4),
        'Perm_p': round(er['roc_youden'].get('perm_p', np.nan), 4),
        'Agreement': round(er['consensus_agreement'], 2),
        'Percentile': round(er['percentile_rank'], 1),
        'MW_p': round(p_val, 4),
    })

master_df = pd.DataFrame(master_rows)
print("=== MASTER THRESHOLD TABLE ===")
print(master_df.to_string(index=False))

print("\\n✓ Master threshold table ready (exported via JSON)")
""")

# =====================================================================
# Cell 31  – Section 6.2: Per-event diagnosis
# =====================================================================
code("""\
# =============================================================================
# Section 6.2 — Per erosion-event year factor exceedance diagnosis
# =============================================================================

print("=== ENHANCED PER-EVENT DIAGNOSIS ===\\n")

event_rows = []
for yr in sorted(all_erosion_years):
    yr_data = analysis_df[analysis_df['monsoon_year'] == yr]
    if len(yr_data) == 0:
        continue
    row = {'year': int(yr)}
    total_exceedances = 0
    for feat in significant_features:
        val = yr_data[feat].values[0]
        er = ensemble_results.get(feat, {})
        ct = er.get('consensus_threshold', np.nan)
        exceeded = val > ct if not np.isnan(ct) else False
        row[f'{feat}_val'] = round(val, 3)
        row[f'{feat}_exceed'] = exceeded
        if exceeded:
            total_exceedances += 1
    row['total_exceedances'] = total_exceedances
    row['confidence'] = ('HIGH' if total_exceedances >= 3 else
                         'MODERATE' if total_exceedances >= 2 else
                         'LOW' if total_exceedances >= 1 else 'NONE')
    event_rows.append(row)

event_df = pd.DataFrame(event_rows)
print(event_df.to_string(index=False))

# CSV export removed — data flows to frontend via JSON

# Multi-method per-feature export
multi_method_rows = []
for feat in significant_features:
    er = ensemble_results[feat]
    for method_name, method_key in [('ROC/Youden', 'roc_youden'),
                                     ('Bayesian Logistic', 'bayesian_logistic'),
                                     ('Change-Point', 'change_point'),
                                     ('Mutual Info', 'mutual_info')]:
        r = er[method_key]
        multi_method_rows.append({
            'feature': feat, 'method': method_name,
            'threshold': round(r['threshold'], 4),
            'ci_lower': round(r.get('ci_lower', np.nan), 4),
            'ci_upper': round(r.get('ci_upper', np.nan), 4),
        })
    multi_method_rows.append({
        'feature': feat, 'method': 'CONSENSUS',
        'threshold': round(er['consensus_threshold'], 4),
        'ci_lower': np.nan, 'ci_upper': np.nan,
    })

print("\\n✓ Diagnosis and multi-method thresholds ready (exported via JSON)")
""")

# =====================================================================
# Cell 32  – Section 7 markdown
# =====================================================================
md("""\
## Section 7 — Advanced 24-Month Forecast with Actual Predictions

**SARIMA time-series models** trained on the full monthly environmental record, with:

1. **STL decomposition** to confirm annual monsoon seasonality
2. **SARIMA model selection** via AIC grid search (27 candidate models per variable) with Ljung-Box residual diagnostics and out-of-sample RMSE validation
3. **Hindcast validation** against all known erosion years — temporal cross-validation with operational skill metrics (POD, FAR, CSI, Brier Skill Score)
4. **Monte Carlo simulation** (n=2000) propagates SARIMA uncertainty through the Random Forest erosion model
5. **Actual shoreline retreat** predicted in meters by combining P(erosion) with EPR distributions
6. **Per-transect vulnerability** scores combine historical erosion severity with forecast probability
""")

# =====================================================================
# Cell 33  – Section 7.0: Forecast base  [FIX 9]
# =====================================================================
code("""\
# =============================================================================
# Section 7.0 — Establish forecast base date and horizons
# =============================================================================

import pandas as pd

# Use the last available wind data date as the base
last_wind_date = pd.Timestamp(wind_df['time'].max())
last_wave_date = pd.Timestamp(wave_df['time'].max())
base_date = min(last_wind_date, last_wave_date)
print(f"Forecast base date: {base_date.strftime('%Y-%m')}")

horizons = {
    'H6':  base_date + pd.DateOffset(months=6),
    'H12': base_date + pd.DateOffset(months=12),
    'H18': base_date + pd.DateOffset(months=18),
    'H24': base_date + pd.DateOffset(months=24),
}

for h, d in horizons.items():
    print(f"  {h}: {d.strftime('%Y-%m')}")

# ── Build monthly forcing time series for SARIMA ──
# We need: one monthly series per forcing variable

# Merge monthly datasets
env_monthly = wave_monthly.merge(wind_monthly, on=['monsoon_year', 'year_month'],
                                  how='outer', suffixes=('_wave', '_wind'))
env_monthly = env_monthly.merge(current_monthly, on=['monsoon_year', 'year_month'],
                                 how='outer')
env_monthly = env_monthly.sort_values('year_month').reset_index(drop=True)

# Build datetime index — coalesce from all time columns, fall back to year_month Period
env_monthly['datetime'] = pd.NaT
for tc in ['time_wave', 'time_wind', 'time']:
    if tc in env_monthly.columns:
        env_monthly['datetime'] = env_monthly['datetime'].fillna(
            pd.to_datetime(env_monthly[tc], errors='coerce'))

# Fill remaining NaT from year_month Period (always present as merge key)
nat_mask = env_monthly['datetime'].isna()
if nat_mask.any():
    env_monthly.loc[nat_mask, 'datetime'] = env_monthly.loc[nat_mask, 'year_month'].apply(
        lambda p: p.to_timestamp() if hasattr(p, 'to_timestamp') else pd.Timestamp(str(p)))

env_monthly = env_monthly.dropna(subset=['datetime'])
env_monthly = env_monthly.set_index('datetime').sort_index()
env_monthly = env_monthly[~env_monthly.index.duplicated(keep='first')]

# Define SARIMA variables and their column mapping (7 main erosion drivers)
SARIMA_VARS = {
    'VHM0_max':       'VHM0_max',
    'VTPK_max':       'VTPK_max',
    'WindSpeed_max':   'WindSpeed_max',
    'CurrentMag_max':  'CurrentMag_max',
    'CumWaveEnergy':   'CumWaveEnergy',
    'StormDays_wave':  'StormDays_wave',
    'StormDays_wind':  'StormDays_wind',
}

# Extract monthly series
forcing_vars_monthly = {}
for var_name, col in SARIMA_VARS.items():
    if col in env_monthly.columns:
        s = env_monthly[col].copy()
        s = s[s.index.notna()]
        s = s[~s.index.duplicated(keep='first')]
        try:
            s = s.asfreq('MS')
        except ValueError:
            s = s.resample('MS').first()
        s = s.interpolate(method='linear').ffill().bfill()
        forcing_vars_monthly[var_name] = s

print(f"\\nSARIMA variables prepared: {list(forcing_vars_monthly.keys())}")
for v, s in forcing_vars_monthly.items():
    print(f"  {v}: {len(s)} months, {s.index.min().strftime('%Y-%m')} to {s.index.max().strftime('%Y-%m')}")
""")

# =====================================================================
# Cell 34  – Section 7.1: STL  [FIX 10 / 13]
# =====================================================================
code("""\
# =============================================================================
# Section 7.1 — STL decomposition to confirm monsoon seasonality
# =============================================================================

n_vars = len(forcing_vars_monthly)

if n_vars == 0:
    print("No forcing variables available for STL decomposition.")
else:
    fig, axes = plt.subplots(n_vars, 3, figsize=(16, 3.5 * n_vars))
    if n_vars == 1:
        axes = axes.reshape(1, -1)

    for i, (var_name, series) in enumerate(forcing_vars_monthly.items()):
        s = series.dropna()
        if len(s) < 36:
            continue
        stl = STL(s, period=12, robust=True)
        result = stl.fit()

        axes[i, 0].plot(result.observed, color='#1f77b4', lw=0.8)
        axes[i, 0].set_title(f'{var_name} – Observed', fontsize=9)
        axes[i, 0].grid(True, alpha=0.3)

        axes[i, 1].plot(result.seasonal, color='#ff7f0e', lw=0.8)
        axes[i, 1].set_title(f'{var_name} – Seasonal', fontsize=9)
        axes[i, 1].grid(True, alpha=0.3)

        axes[i, 2].plot(result.resid, color='#2ca02c', lw=0.8)
        axes[i, 2].set_title(f'{var_name} – Residual', fontsize=9)
        axes[i, 2].grid(True, alpha=0.3)

    plt.suptitle('STL Decomposition (period=12)', fontsize=13, y=1.01)
    plt.tight_layout()
    plt.savefig('./figures/stl_decomposition.png', dpi=150, bbox_inches='tight')
    plt.show()
""")

# =====================================================================
# Cell 35  – Section 7.2: SARIMA AIC grid search
# =====================================================================
code("""\
# =============================================================================
# Section 7.2 — SARIMA model selection (AIC grid search + diagnostics)
# =============================================================================

sarima_forecasts = {}
sarima_models = {}
diag_rows = []

# Grid search orders
p_range = [0, 1, 2]
q_range = [0, 1, 2]
seasonal_orders = [(1, 1, 1, 12), (0, 1, 1, 12), (1, 1, 0, 12)]

for var_name, series in forcing_vars_monthly.items():
    s = series.dropna()
    if len(s) < 36:
        print(f"⚠ {var_name}: insufficient data ({len(s)} months)")
        continue

    # Auto d via ADF
    adf_p = adfuller(s.dropna())[1]
    d = 0 if adf_p < 0.05 else 1

    # Hold out last 24 months for validation
    n_holdout = min(24, len(s) // 4)
    s_train = s[:-n_holdout]
    s_test  = s[-n_holdout:]

    best_aic, best_order, best_seasonal = np.inf, None, None

    for p in p_range:
        for q in q_range:
            for sorder in seasonal_orders:
                try:
                    mdl = SARIMAX(s_train, order=(p, d, q),
                                  seasonal_order=sorder,
                                  enforce_stationarity=False,
                                  enforce_invertibility=False).fit(disp=False, maxiter=200)
                    if mdl.aic < best_aic:
                        best_aic = mdl.aic
                        best_order = (p, d, q)
                        best_seasonal = sorder
                except Exception:
                    continue

    if best_order is None:
        print(f"⚠ {var_name}: no valid SARIMA model found")
        continue

    # Fit best model on full data
    best_model = SARIMAX(s, order=best_order, seasonal_order=best_seasonal,
                         enforce_stationarity=False,
                         enforce_invertibility=False).fit(disp=False, maxiter=500)
    sarima_models[var_name] = best_model

    # Forecast 24 months
    fc = best_model.get_forecast(steps=24)
    fc_dates = pd.date_range(start=s.index[-1] + pd.DateOffset(months=1),
                             periods=24, freq='MS')
    fc_df = pd.DataFrame({
        'date': fc_dates,
        'forecast': fc.predicted_mean.values,
        'lower_95': fc.conf_int(alpha=0.05).iloc[:, 0].values,
        'upper_95': fc.conf_int(alpha=0.05).iloc[:, 1].values,
    })
    sarima_forecasts[var_name] = fc_df

    # Diagnostics
    # Out-of-sample metrics
    val_model = SARIMAX(s_train, order=best_order, seasonal_order=best_seasonal,
                        enforce_stationarity=False,
                        enforce_invertibility=False).fit(disp=False, maxiter=300)
    val_fc = val_model.get_forecast(steps=n_holdout)
    val_pred = val_fc.predicted_mean.values[:len(s_test)]
    val_actual = s_test.values[:len(val_pred)]

    rmse = np.sqrt(np.mean((val_actual - val_pred) ** 2))
    mae  = np.mean(np.abs(val_actual - val_pred))
    mape = np.mean(np.abs((val_actual - val_pred) / np.where(np.abs(val_actual) < 1e-8, 1, val_actual))) * 100

    # Ljung-Box
    try:
        lb = acorr_ljungbox(best_model.resid, lags=[12], return_df=True)
        lb_p = lb['lb_pvalue'].values[0]
    except Exception:
        lb_p = np.nan

    diag_rows.append({
        'variable': var_name,
        'order': str(best_order),
        'seasonal_order': str(best_seasonal),
        'AIC': round(best_aic, 2),
        'BIC': round(best_model.bic, 2),
        'RMSE': round(rmse, 4),
        'MAE': round(mae, 4),
        'MAPE': round(mape, 2),
        'LjungBox_p12': round(lb_p, 4),
        'residuals_ok': lb_p > 0.05 if not np.isnan(lb_p) else False,
    })

    print(f"✓ {var_name}: SARIMA{best_order}×{best_seasonal}  AIC={best_aic:.1f}  RMSE={rmse:.4f}")

sarima_diag_df = pd.DataFrame(diag_rows)
print(f"\\n✓ Diagnostics ready. {len(sarima_forecasts)} variables forecasted (exported via JSON).")
""")

# =====================================================================
# Cell 36  – Section 7.3: Forecast plots  [FIX 10 / 11]
# =====================================================================
code("""\
# =============================================================================
# Section 7.3 — Plot all forecasts with 95% confidence bands
# =============================================================================

n_vars = len(sarima_forecasts)

if n_vars == 0:
    print("No SARIMA forecasts to plot.")
else:
    n_cols = min(3, n_vars)
    n_rows = int(np.ceil(n_vars / n_cols))

    fig, axes = plt.subplots(n_rows, n_cols, figsize=(6 * n_cols, 4 * n_rows))
    axes = np.atleast_1d(axes).ravel()

    i = -1
    for i, (var_name, fc_df) in enumerate(sarima_forecasts.items()):
        ax = axes[i]
        s = forcing_vars_monthly[var_name]

        # Historical
        ax.plot(s.index, s.values, color='#1f77b4', lw=0.8, label='Observed')

        # Forecast
        fc_dates = pd.to_datetime(fc_df['date'])
        ax.plot(fc_dates, fc_df['forecast'], color='#E24B4A', lw=1.5, label='Forecast')
        ax.fill_between(fc_dates, fc_df['lower_95'], fc_df['upper_95'],
                        color='#E24B4A', alpha=0.15, label='95% CI')

        # Horizon markers
        for h_name, h_date in horizons.items():
            ax.axvline(h_date, color='gray', ls=':', lw=0.8, alpha=0.5)

        ax.set_title(var_name, fontsize=10, fontweight='bold')
        ax.legend(fontsize=7, loc='upper left')
        ax.grid(True, alpha=0.3)

    for j in range(i + 1, len(axes)):
        axes[j].set_visible(False)

    plt.suptitle('SARIMA 24-Month Forecasts', fontsize=13, y=1.01)
    plt.tight_layout()
    plt.savefig('./figures/sarima_forecasts.png', dpi=150, bbox_inches='tight')
    plt.show()
""")

# =====================================================================
# Cell 37  – Section 7.3a markdown
# =====================================================================
md("""\
### Section 7.3a — Hindcast Validation Against Known Erosion Years

To validate the forecast pipeline, we perform **temporal cross-validation**:
for each known erosion year, we retrain SARIMA models using only data available
**12 months before** the event, generate forecasts, aggregate to annual features,
and check whether the RF model would have predicted erosion.

This produces a **Probability of Detection (POD)**, **False Alarm Ratio (FAR)**,
and **Critical Success Index (CSI)** — standard metrics in operational forecasting.
""")

# =====================================================================
# Cell 38  – Section 7.3a: Hindcast validation
# =====================================================================
code("""\
# =============================================================================
# Section 7.3a — Temporal hindcast validation (leave-future-out)
# =============================================================================

# Mapping: SARIMA var name -> annual feature aggregation
sarima_to_annual = {
    'VHM0_max':       {'max': 'Hm0_max_annual',       'p90': 'Hm0_p90'},
    'WindSpeed_max':   {'max': 'wind_max_annual',       'p90': 'wind_p90'},
    'CurrentMag_max':  {'max': 'ucurr_max_annual',      'p90': 'ucurr_p90'},
    'CumWaveEnergy':   {'sum': 'cumwave_energy_annual'},
    'StormDays_wave':  {'sum': 'storm_days_wave_total'},
    'StormDays_wind':  {'sum': 'storm_days_wind_total'},
}

print("=== TEMPORAL HINDCAST VALIDATION ===\\n")

hindcast_results = []
test_years = sorted(analysis_df['monsoon_year'].unique())

for test_yr in test_years:
    cutoff = pd.Timestamp(f'{test_yr}-04-01') - pd.DateOffset(months=12)
    actual_label = int(test_yr in all_erosion_years)

    hc_forecasts = {}
    valid = True
    for var_name, series in forcing_vars_monthly.items():
        s = series.copy()
        s.index = pd.to_datetime(s.index)
        s = s[s.index.notna()]
        s = s[~s.index.duplicated(keep='first')]
        s = s.sort_index()
        try:
            s = s.asfreq('MS').interpolate(method='linear')
        except ValueError:
            s = s.resample('MS').first().interpolate(method='linear')
        s_train = s[s.index <= cutoff]
        if len(s_train) < 36:
            valid = False
            break
        try:
            adf_p = adfuller(s_train.dropna())[1]
            d = 0 if adf_p < 0.05 else 1
            mdl = SARIMAX(s_train, order=(1, d, 1),
                          seasonal_order=(1, 1, 1, 12),
                          enforce_stationarity=False,
                          enforce_invertibility=False).fit(disp=False)
            fc = mdl.get_forecast(steps=24)
            future_dates = pd.date_range(
                start=s_train.index[-1] + pd.DateOffset(months=1),
                periods=24, freq='MS')
            hc_forecasts[var_name] = pd.DataFrame({
                'date': future_dates,
                'forecast': fc.predicted_mean.values,
                'lower_95': fc.conf_int(alpha=0.05).iloc[:, 0].values,
                'upper_95': fc.conf_int(alpha=0.05).iloc[:, 1].values,
            })
        except Exception:
            valid = False
            break

    if not valid:
        continue

    # Aggregate to annual features for the test monsoon year
    target_start = pd.Timestamp(f'{test_yr}-04-01')
    target_end   = pd.Timestamp(f'{test_yr+1}-03-01')

    hc_feats = {}
    for var_name, mapping in sarima_to_annual.items():
        if var_name not in hc_forecasts:
            continue
        fc = hc_forecasts[var_name]
        fc_w = fc[(fc['date'] >= target_start) & (fc['date'] <= target_end)]
        if len(fc_w) == 0:
            fc_w = fc
        if 'max' in mapping:
            hc_feats[mapping['max']] = fc_w['forecast'].max()
        if 'p90' in mapping:
            hc_feats[mapping['p90']] = np.percentile(fc_w['forecast'].values, 90)
        if 'sum' in mapping:
            hc_feats[mapping['sum']] = fc_w['forecast'].sum()

    feat_vals = [hc_feats.get(f, analysis_df[f].median())
                 for f in significant_features]
    X_hc = np.array(feat_vals).reshape(1, -1)
    hc_prob = rf.predict_proba(X_hc)[0][1]
    hc_pred = int(hc_prob >= 0.5)

    hindcast_results.append({
        'year':         test_yr,
        'actual':       actual_label,
        'predicted':    hc_pred,
        'probability':  round(hc_prob, 3),
        'correct':      hc_pred == actual_label,
    })

hc_df = pd.DataFrame(hindcast_results)
if len(hc_df) > 0:
    hits  = ((hc_df['actual'] == 1) & (hc_df['predicted'] == 1)).sum()
    misses = ((hc_df['actual'] == 1) & (hc_df['predicted'] == 0)).sum()
    false_alarms = ((hc_df['actual'] == 0) & (hc_df['predicted'] == 1)).sum()
    correct_rej  = ((hc_df['actual'] == 0) & (hc_df['predicted'] == 0)).sum()

    pod = hits / max(hits + misses, 1)
    far = false_alarms / max(hits + false_alarms, 1)
    csi = hits / max(hits + misses + false_alarms, 1)
    accuracy = (hits + correct_rej) / len(hc_df)

    print("Year-by-year hindcast results:")
    print(hc_df.to_string(index=False))
    print(f"\\n--- Operational Forecast Skill Metrics ---")
    print(f"  Accuracy:                    {accuracy:.1%}")
    print(f"  Probability of Detection:    {pod:.1%}")
    print(f"  False Alarm Ratio:           {far:.1%}")
    print(f"  Critical Success Index:      {csi:.1%}")

    # Plots
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))

    colors = ['#E24B4A' if a == 1 else '#185FA5' for a in hc_df['actual']]
    ax1.bar(hc_df['year'].astype(str), hc_df['probability'], color=colors,
            edgecolor='white', linewidth=0.5)
    ax1.axhline(0.5, color='red', ls='--', lw=1.2, label='Decision boundary (0.5)')
    ax1.set_ylabel('Predicted erosion probability')
    ax1.set_xlabel('Monsoon year')
    ax1.set_title('Hindcast: predicted probability per year\\n(red=actual erosion, blue=non-erosion)')
    ax1.legend(fontsize=9)
    ax1.set_ylim(0, 1)
    ax1.grid(True, alpha=0.3, axis='y')
    plt.setp(ax1.get_xticklabels(), rotation=45, fontsize=8)

    cm = np.array([[correct_rej, false_alarms], [misses, hits]])
    im = ax2.imshow(cm, cmap='Blues', vmin=0)
    for ii in range(2):
        for jj in range(2):
            ax2.text(jj, ii, str(cm[ii, jj]), ha='center', va='center', fontsize=18)
    ax2.set_xticks([0, 1]); ax2.set_xticklabels(['Pred: No', 'Pred: Yes'])
    ax2.set_yticks([0, 1]); ax2.set_yticklabels(['Actual: No', 'Actual: Yes'])
    ax2.set_title(f'Hindcast Confusion Matrix\\nPOD={pod:.0%}, FAR={far:.0%}, CSI={csi:.0%}')
    plt.colorbar(im, ax=ax2)

    plt.tight_layout()
    plt.savefig('./figures/hindcast_validation.png', dpi=150)
    plt.show()
    # CSV export removed — data flows to frontend via JSON
else:
    print("Insufficient data for hindcast validation.")
""")

# =====================================================================
# Cell 39  – Section 7.4: Aggregate forecasts
# =====================================================================
code("""\
# =============================================================================
# Section 7.4 — Aggregate forecasts to horizon-period annual features
# =============================================================================

horizon_features_list = []
erosion_predictions = []

for h_name, h_date in horizons.items():
    # get months in this horizon's monsoon year
    if h_name == 'H6':
        h_start = base_date + pd.DateOffset(months=1)
        h_end   = h_date
    else:
        # Full monsoon year ending at horizon
        h_end = h_date
        h_start = h_date - pd.DateOffset(months=11)

    feats = {'horizon': h_name, 'target_date': h_date.strftime('%Y-%m')}

    for var_name, mapping in sarima_to_annual.items():
        if var_name not in sarima_forecasts:
            continue
        fc = sarima_forecasts[var_name]
        fc['date'] = pd.to_datetime(fc['date'])
        fc_w = fc[(fc['date'] >= h_start) & (fc['date'] <= h_end)]
        if len(fc_w) == 0:
            fc_w = fc   # use all available

        if 'max' in mapping:
            feats[mapping['max']] = fc_w['forecast'].max()
        if 'p90' in mapping:
            feats[mapping['p90']] = np.percentile(fc_w['forecast'].values, 90)
        if 'sum' in mapping:
            feats[mapping['sum']] = fc_w['forecast'].sum()

    horizon_features_list.append(feats)

    # RF prediction
    feat_vals = [feats.get(f, analysis_df[f].median()) for f in significant_features]
    X_pred = np.array(feat_vals).reshape(1, -1)
    prob = rf.predict_proba(X_pred)[0][1]

    # Threshold exceedance check
    exceeded = []
    for f in significant_features:
        ct = ensemble_results.get(f, {}).get('consensus_threshold', np.nan)
        if not np.isnan(ct) and feats.get(f, 0) > ct:
            exceeded.append(f)

    erosion_predictions.append({
        'horizon': h_name,
        'target_date': h_date.strftime('%Y-%m'),
        'erosion_probability': round(prob, 3),
        'risk_category': 'HIGH' if prob > 0.6 else ('MODERATE' if prob > 0.4 else 'LOW'),
        'thresholds_exceeded': exceeded,
        'n_exceeded': len(exceeded),
    })

    print(f"{h_name} ({h_date.strftime('%Y-%m')}): P(erosion)={prob:.1%}  "
          f"exceeded={len(exceeded)} features  "
          f"→ {'HIGH' if prob > 0.6 else 'MODERATE' if prob > 0.4 else 'LOW'}")

horizon_features = pd.DataFrame(horizon_features_list)
# CSV export removed — data flows to frontend via JSON
""")

# =====================================================================
# Cell 40  – Section 7.5: RF at horizons
# =====================================================================
code("""\
# =============================================================================
# Section 7.5 — Apply RF model to predict erosion at each horizon
# =============================================================================

print("=== RF EROSION PREDICTIONS PER HORIZON ===\\n")

for ep in erosion_predictions:
    print(f"  {ep['horizon']} ({ep['target_date']}): "
          f"P(erosion) = {ep['erosion_probability']:.1%} "
          f"[{ep['risk_category']}]")
    if ep['thresholds_exceeded']:
        print(f"    Thresholds exceeded: {', '.join(ep['thresholds_exceeded'])}")
    print()
""")

# =====================================================================
# Cell 41  – Section 7.6: Monte Carlo
# =====================================================================
code("""\
# =============================================================================
# Section 7.6 — Monte Carlo uncertainty propagation
# =============================================================================

n_simulations = 2000
mc_results = {h: [] for h in horizons.keys()}

for h_name, h_date in horizons.items():
    if h_name == 'H6':
        h_start = base_date + pd.DateOffset(months=1)
        h_end = h_date
    else:
        h_end = h_date
        h_start = h_date - pd.DateOffset(months=11)

    for sim in range(n_simulations):
        sim_feats = {}
        for var_name, mapping in sarima_to_annual.items():
            if var_name not in sarima_forecasts:
                continue
            fc = sarima_forecasts[var_name]
            fc['date'] = pd.to_datetime(fc['date'])
            fc_w = fc[(fc['date'] >= h_start) & (fc['date'] <= h_end)]
            if len(fc_w) == 0:
                continue
            std_est = (fc_w['upper_95'].values -
                       fc_w['lower_95'].values) / (2 * 1.96)
            std_est = np.maximum(std_est, 1e-6)
            sampled = np.random.normal(fc_w['forecast'].values, std_est)
            if 'max' in mapping:
                sim_feats[mapping['max']] = sampled.max()
            if 'p90' in mapping:
                sim_feats[mapping['p90']] = np.percentile(sampled, 90)
            if 'sum' in mapping:
                sim_feats[mapping['sum']] = sampled.sum()

        feat_vals = [sim_feats.get(f, analysis_df[f].median())
                     for f in significant_features]
        X_sim = np.array(feat_vals).reshape(1, -1)
        mc_results[h_name].append(rf.predict_proba(X_sim)[0][1])

mc_summary = []
for h_name, probs in mc_results.items():
    probs = np.array(probs)
    mc_summary.append({
        'horizon':         h_name,
        'target_date':     horizons[h_name].strftime('%Y-%m'),
        'mean_prob':       round(np.mean(probs), 3),
        'median_prob':     round(np.median(probs), 3),
        'ci_lower_95':     round(np.percentile(probs, 2.5), 3),
        'ci_upper_95':     round(np.percentile(probs, 97.5), 3),
        'prob_above_0.5':  round(np.mean(probs > 0.5), 3),
        'risk_category':   ('HIGH'     if np.mean(probs) > 0.6 else
                            'MODERATE' if np.mean(probs) > 0.4 else 'LOW'),
    })

mc_df = pd.DataFrame(mc_summary)
print("\\n=== MONTE CARLO UNCERTAINTY-AWARE PREDICTIONS ===")
print(f"Simulations per horizon: {n_simulations}")
print(mc_df.to_string(index=False))
# CSV export removed — data flows to frontend via JSON
""")

# =====================================================================
# Cell 42  – Section 7.6a markdown
# =====================================================================
md("""\
### Section 7.6a — Actual Shoreline Retreat Predictions (Physical Units)

Translating erosion **probability** into **expected retreat in meters** using DSAS EPR statistics:

$$E[\\text{retreat}] = P(\\text{erosion}) \\times \\bar{EPR}_{erosion} + (1 - P(\\text{erosion})) \\times \\bar{EPR}_{stable}$$
""")

# =====================================================================
# Cell 43  – Section 7.6a: Retreat predictions
# =====================================================================
code("""\
# =============================================================================
# Section 7.6a — Shoreline retreat predictions in physical units (meters)
# =============================================================================

# EPR statistics from transect data
epr_erosion = dsas_df.loc[dsas_df['erosion_flag'] == 1, 'EPR']
epr_stable  = dsas_df.loc[dsas_df['erosion_flag'] == 0, 'EPR']

mean_epr_erosion = epr_erosion.mean() if len(epr_erosion) > 0 else -1.0
std_epr_erosion  = epr_erosion.std()  if len(epr_erosion) > 1 else 0.5
mean_epr_stable  = epr_stable.mean()  if len(epr_stable)  > 0 else 0.0
std_epr_stable   = epr_stable.std()   if len(epr_stable)  > 1 else 0.3

print(f"EPR erosion:  mean={mean_epr_erosion:.3f} ± {std_epr_erosion:.3f} m/yr")
print(f"EPR stable:   mean={mean_epr_stable:.3f} ± {std_epr_stable:.3f} m/yr")

retreat_rows = []
for _, mc_row in mc_df.iterrows():
    p_ero = mc_row['mean_prob']
    h_name = mc_row['horizon']
    years_ahead = {'H6': 0.5, 'H12': 1.0, 'H18': 1.5, 'H24': 2.0}[h_name]

    expected_epr = p_ero * mean_epr_erosion + (1 - p_ero) * mean_epr_stable
    retreat_m = expected_epr * years_ahead

    # MC uncertainty -> retreat uncertainty
    ci_low_p = mc_row['ci_lower_95']
    ci_high_p = mc_row['ci_upper_95']
    retreat_low  = (ci_low_p * mean_epr_erosion + (1 - ci_low_p) * mean_epr_stable) * years_ahead
    retreat_high = (ci_high_p * mean_epr_erosion + (1 - ci_high_p) * mean_epr_stable) * years_ahead

    action_level = ('IMMEDIATE ACTION'    if p_ero > 0.7 else
                    'ENHANCED MONITORING'  if p_ero > 0.5 else
                    'ROUTINE MONITORING'   if p_ero > 0.3 else
                    'STANDARD OPERATIONS')

    retreat_rows.append({
        'horizon': h_name,
        'target_date': mc_row['target_date'],
        'erosion_probability': round(p_ero, 3),
        'erosion_prob': round(p_ero, 3),
        'expected_epr': round(expected_epr, 3),
        'retreat_m': round(retreat_m, 3),
        'mean_retreat': round(retreat_m, 3),
        'retreat_low_95': round(min(retreat_low, retreat_high), 3),
        'retreat_high_95': round(max(retreat_low, retreat_high), 3),
        'action_level': action_level,
        'risk_category': mc_row['risk_category'],
    })

retreat_df = pd.DataFrame(retreat_rows)
print("\\n=== SHORELINE RETREAT PREDICTIONS ===")
print(retreat_df.to_string(index=False))
# CSV export removed — data flows to frontend via JSON
""")

# =====================================================================
# Cell 44  – Section 7.6b: Vulnerability
# =====================================================================
code("""\
# =============================================================================
# Section 7.6b — Per-transect vulnerability scoring
# =============================================================================

print("=== PER-TRANSECT VULNERABILITY SCORING ===\\n")

dsas_scored = dsas_df[['id', 'EPR', 'NSM', 'SCE', 'epr_class', 'erosion_flag']].copy()

severity_map = {
    'eroded_high': 4, 'eroded_low': 3,
    'stable': 2, 'accreted_low': 1, 'accreted_high': 0
}
dsas_scored['hist_severity'] = dsas_scored['epr_class'].map(severity_map)

epr_min, epr_max = dsas_scored['EPR'].min(), dsas_scored['EPR'].max()
dsas_scored['epr_vulnerability'] = (epr_max - dsas_scored['EPR']) / (epr_max - epr_min)

for _, row in retreat_df.iterrows():
    p_ero = row['erosion_probability']
    col_name = f"risk_{row['horizon']}"
    dsas_scored[col_name] = dsas_scored['epr_vulnerability'] * p_ero
    cat_name = f"cat_{row['horizon']}"
    dsas_scored[cat_name] = pd.cut(
        dsas_scored[col_name],
        bins=[0, 0.2, 0.4, 0.6, 0.8, 1.0],
        labels=['Very Low', 'Low', 'Moderate', 'High', 'Very High'],
        include_lowest=True
    )

print("Top 10 most vulnerable transects (H12 forecast):")
h12_col = 'risk_H12' if 'risk_H12' in dsas_scored.columns else dsas_scored.columns[-2]
top10 = dsas_scored.nlargest(10, h12_col)[
    ['id', 'EPR', 'epr_class', 'epr_vulnerability', h12_col]
]
print(top10.to_string(index=False))

print("\\n--- Transect Risk Distribution per Horizon ---")
for _, row in retreat_df.iterrows():
    cat_col = f"cat_{row['horizon']}"
    if cat_col in dsas_scored.columns:
        dist = dsas_scored[cat_col].value_counts().sort_index()
        print(f"\\n  {row['horizon']} ({row['target_date']}):")
        for cat, cnt in dist.items():
            pct = cnt / len(dsas_scored) * 100
            print(f"    {str(cat):12s}: {cnt:3d} transects ({pct:.1f}%)")

# Vulnerability map plot
fig, axes = plt.subplots(1, min(4, len(retreat_df)), figsize=(16, 5))
if len(retreat_df) <= 1:
    axes = [axes]
elif not hasattr(axes, '__iter__'):
    axes = [axes]

vuln_cmap = plt.cm.RdYlGn_r
for ax, (_, row) in zip(axes, retreat_df.iterrows()):
    risk_col = f"risk_{row['horizon']}"
    if risk_col not in dsas_scored.columns:
        continue
    sc = ax.scatter(dsas_scored['id'], dsas_scored[risk_col],
                    c=dsas_scored[risk_col], cmap=vuln_cmap,
                    vmin=0, vmax=1, s=20, edgecolors='none')
    ax.axhline(0.5, color='red', ls='--', lw=1, alpha=0.5)
    ax.set_xlabel('Transect ID')
    ax.set_ylabel('Combined Risk Score')
    ax.set_title(f"{row['horizon']} ({row['target_date']})\\n"
                 f"P(erosion) = {row['erosion_probability']:.0%}")
    ax.grid(True, alpha=0.3)

plt.suptitle('Per-Transect Vulnerability Score (historical × forecast)', fontsize=13)
plt.tight_layout()
plt.savefig('./figures/transect_vulnerability.png', dpi=150, bbox_inches='tight')
plt.show()

# CSV export removed — data flows to frontend via JSON
""")

# =====================================================================
# Cell 45  – Section 7.6c: Forecast skill
# =====================================================================
code("""\
# =============================================================================
# Section 7.6c — Forecast skill vs climatology baseline (Brier Skill Score)
# =============================================================================

print("=== FORECAST SKILL ASSESSMENT ===\\n")

base_rate = analysis_df['erosion_label'].mean()
print(f"Historical base rate (climatology): {base_rate:.2%}")

if len(hc_df) > 0:
    bs_forecast = np.mean((hc_df['probability'].values - hc_df['actual'].values)**2)
    bs_clim = np.mean((base_rate - hc_df['actual'].values)**2)
    bss = 1 - bs_forecast / bs_clim if bs_clim > 0 else 0

    if len(np.unique(hc_df['actual'])) >= 2:
        hc_fpr, hc_tpr, _ = roc_curve(hc_df['actual'], hc_df['probability'])
        hc_auc = auc(hc_fpr, hc_tpr)
    else:
        hc_auc = np.nan

    print(f"\\nBrier Score (forecast):   {bs_forecast:.4f}")
    print(f"Brier Score (climatology): {bs_clim:.4f}")
    print(f"Brier Skill Score (BSS):   {bss:.4f}")
    print(f"  BSS > 0 means forecast is better than always predicting base rate")
    print(f"  BSS interpretation: {'SKILLFUL' if bss > 0 else 'NO SKILL vs climatology'}")
    print(f"\\nHindcast AUC: {hc_auc:.3f}" if not np.isnan(hc_auc) else "Hindcast AUC: N/A")

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))

    labels = ['Forecast', 'Climatology']
    values = [bs_forecast, bs_clim]
    colors_bs = ['#185FA5' if bss > 0 else '#E24B4A', '#888780']
    ax1.bar(labels, values, color=colors_bs, edgecolor='white')
    ax1.set_ylabel('Brier Score (lower = better)')
    ax1.set_title(f'Brier Skill Score = {bss:.3f}\\n'
                  f'({"Forecast beats climatology" if bss > 0 else "Climatology is better"})')
    ax1.grid(True, alpha=0.3, axis='y')

    n_bins = 5
    bins = np.linspace(0, 1, n_bins + 1)
    hc_df_copy = hc_df.copy()
    hc_df_copy['prob_bin'] = pd.cut(hc_df_copy['probability'], bins=bins,
                                     include_lowest=True)
    rel_table = hc_df_copy.groupby('prob_bin', observed=False).agg(
        n_forecasts=('actual', 'count'),
        mean_predicted=('probability', 'mean'),
        observed_freq=('actual', 'mean'),
    ).dropna()

    if len(rel_table) > 0 and not rel_table['mean_predicted'].isna().all():
        ax2.plot([0, 1], [0, 1], 'k--', lw=1, label='Perfect reliability')
        ax2.scatter(rel_table['mean_predicted'], rel_table['observed_freq'],
                    s=rel_table['n_forecasts'] * 30, c='#185FA5', zorder=5,
                    edgecolors='white')
        ax2.set_xlabel('Mean predicted probability')
        ax2.set_ylabel('Observed frequency')
        ax2.set_title('Reliability Diagram')
        ax2.set_xlim(0, 1); ax2.set_ylim(0, 1)
        ax2.legend(fontsize=9)
        ax2.grid(True, alpha=0.3)
    else:
        ax2.text(0.5, 0.5, 'Insufficient data\\nfor reliability diagram',
                 ha='center', va='center', fontsize=12)
        ax2.set_title('Reliability Diagram')

    plt.tight_layout()
    plt.savefig('./figures/forecast_skill.png', dpi=150)
    plt.show()
else:
    print("\\nNo hindcast results available for skill assessment.")
""")

# =====================================================================
# Cell 46  – Section 7.7: Monthly risk timeline
# =====================================================================
code("""\
# =============================================================================
# Section 7.7 — Month-by-month risk timeline
# =============================================================================

monthly_risk_rows = []

for var_name, fc_df in sarima_forecasts.items():
    for _, fc_row in fc_df.iterrows():
        monthly_risk_rows.append({
            'date': fc_row['date'],
            'variable': var_name,
            'forecast': fc_row['forecast'],
            'lower_95': fc_row['lower_95'],
            'upper_95': fc_row['upper_95'],
        })

# Evaluate each month against thresholds
risk_by_month = {}
for var_name, fc_df in sarima_forecasts.items():
    # Find matching threshold
    for feat in significant_features:
        # Simple name matching
        if any(k in feat.lower() for k in var_name.lower().split('_')):
            ct = ensemble_results.get(feat, {}).get('consensus_threshold', np.nan)
            if not np.isnan(ct):
                fc_df_copy = fc_df.copy()
                fc_df_copy['date'] = pd.to_datetime(fc_df_copy['date'])
                for _, r in fc_df_copy.iterrows():
                    d = r['date'].strftime('%Y-%m')
                    if d not in risk_by_month:
                        risk_by_month[d] = {'date': d, 'n_exceeded': 0, 'risk_score': 0}
                    if r['forecast'] > ct:
                        risk_by_month[d]['n_exceeded'] += 1
            break

for d in risk_by_month:
    n = risk_by_month[d]['n_exceeded']
    risk_by_month[d]['risk_label'] = (
        'Alert' if n >= 3 else 'Warning' if n >= 2 else 'Watch' if n >= 1 else 'Stable')
    risk_by_month[d]['risk_score'] = n

monthly_risk_df = pd.DataFrame(list(risk_by_month.values()))
if len(monthly_risk_df) > 0:
    monthly_risk_df = monthly_risk_df.sort_values('date')
    print("=== MONTH-BY-MONTH RISK TIMELINE ===")
    print(monthly_risk_df.to_string(index=False))
    # CSV export removed — data flows to frontend via JSON
else:
    print("No monthly risk data generated.")
    monthly_risk_df = pd.DataFrame(columns=['date', 'n_exceeded', 'risk_score', 'risk_label'])
""")

# =====================================================================
# Cell 47  – Section 7.8: Dashboard
# =====================================================================
code("""\
# =============================================================================
# Section 7.8 — Advanced Forecast Dashboard (6-panel)
# =============================================================================

fig = plt.figure(figsize=(18, 14))
gs = fig.add_gridspec(3, 2, hspace=0.35, wspace=0.3)

# Panel 1: MC erosion probability
ax1 = fig.add_subplot(gs[0, 0])
colors_mc = ['#E24B4A' if r['risk_category'] == 'HIGH'
             else '#FF8C00' if r['risk_category'] == 'MODERATE'
             else '#2ca02c' for _, r in mc_df.iterrows()]
ax1.bar(mc_df['horizon'], mc_df['mean_prob'], color=colors_mc, edgecolor='white')
ax1.errorbar(range(len(mc_df)), mc_df['mean_prob'],
             yerr=[mc_df['mean_prob'] - mc_df['ci_lower_95'],
                   mc_df['ci_upper_95'] - mc_df['mean_prob']],
             fmt='none', color='black', capsize=4)
ax1.set_ylabel('Erosion Probability')
ax1.set_title('Monte Carlo Erosion Probability')
ax1.set_ylim(0, 1)
ax1.axhline(0.5, color='red', ls='--', lw=0.8, alpha=0.5)
ax1.grid(True, alpha=0.3, axis='y')

# Panel 2: Retreat predictions in meters
ax2 = fig.add_subplot(gs[0, 1])
action_colors = {'IMMEDIATE ACTION': '#d62728', 'ENHANCED MONITORING': '#ff7f0e',
                 'ROUTINE MONITORING': '#2ca02c', 'STANDARD OPERATIONS': '#1f77b4'}
retreat_colors = [action_colors.get(r['action_level'], '#888') for _, r in retreat_df.iterrows()]
ax2.bar(retreat_df['horizon'], retreat_df['retreat_m'], color=retreat_colors, edgecolor='white')
ax2.errorbar(range(len(retreat_df)), retreat_df['retreat_m'],
             yerr=[retreat_df['retreat_m'] - retreat_df['retreat_low_95'],
                   retreat_df['retreat_high_95'] - retreat_df['retreat_m']],
             fmt='none', color='black', capsize=4)
ax2.set_ylabel('Retreat (meters)')
ax2.set_title('Predicted Shoreline Retreat')
ax2.grid(True, alpha=0.3, axis='y')

# Panel 3: Monthly risk heatmap
ax3 = fig.add_subplot(gs[1, 0])
if len(monthly_risk_df) > 0:
    risk_vals = monthly_risk_df['risk_score'].values.reshape(1, -1)
    ax3.imshow(risk_vals, cmap='RdYlGn_r', aspect='auto', vmin=0, vmax=3)
    ax3.set_xticks(range(len(monthly_risk_df)))
    ax3.set_xticklabels(monthly_risk_df['date'].values, rotation=45, fontsize=6)
    ax3.set_yticks([])
    ax3.set_title('Monthly Risk Score Heatmap')
else:
    ax3.text(0.5, 0.5, 'No monthly risk data', ha='center', va='center')

# Panel 4: SARIMA forecasts with threshold
ax4 = fig.add_subplot(gs[1, 1])
for var_name, fc_df in list(sarima_forecasts.items())[:3]:
    fc_dates = pd.to_datetime(fc_df['date'])
    ax4.plot(fc_dates, fc_df['forecast'], '-', lw=1.5, label=var_name)
ax4.set_title('SARIMA Forecasts (Top Variables)')
ax4.legend(fontsize=7)
ax4.grid(True, alpha=0.3)

# Panel 5: Per-transect vulnerability
ax5 = fig.add_subplot(gs[2, 0])
if 'risk_H12' in dsas_scored.columns:
    sc = ax5.scatter(dsas_scored['id'], dsas_scored['risk_H12'],
                     c=dsas_scored['risk_H12'], cmap='RdYlGn_r',
                     vmin=0, vmax=1, s=15, edgecolors='none')
    ax5.axhline(0.5, color='red', ls='--', lw=0.8)
    plt.colorbar(sc, ax=ax5)
ax5.set_xlabel('Transect ID')
ax5.set_ylabel('Risk Score')
ax5.set_title('Per-Transect Vulnerability (H12)')
ax5.grid(True, alpha=0.3)

# Panel 6: Summary table
ax6 = fig.add_subplot(gs[2, 1])
ax6.axis('off')
table_data = []
for _, r in retreat_df.iterrows():
    table_data.append([
        r['horizon'], r['target_date'],
        f"{r['erosion_probability']:.0%}",
        f"{r['retreat_m']:.1f} m",
        r['risk_category'], r['action_level']
    ])
tbl = ax6.table(cellText=table_data,
                colLabels=['Horizon', 'Date', 'P(erosion)', 'Retreat', 'Risk', 'Action'],
                loc='center', cellLoc='center')
tbl.auto_set_font_size(False)
tbl.set_fontsize(9)
tbl.scale(1.0, 1.8)
ax6.set_title('Prediction Summary', fontsize=11, fontweight='bold', pad=20)

plt.savefig('./figures/forecast_dashboard_advanced.png', dpi=150, bbox_inches='tight')
plt.show()
""")

# =====================================================================
# Cell 48  – Section 7.9: Analysis Summary
# =====================================================================
code("""\
# =============================================================================
# Section 7.9 — Analysis Summary
# =============================================================================
# NOTE: All outputs are exported to the frontend via analysis_results.json
# No CSV files are written — the backend export cell handles JSON serialisation.

print("=" * 60)
print("  ANALYSIS COMPLETE — ALL DATA EXPORTED TO FRONTEND")
print("=" * 60)

print("\\n--- Data Available in Frontend ---")
print("  • Master threshold table (per factor)")
print("  • Per-event erosion diagnosis")
print("  • Multi-method threshold comparison")
print("  • SARIMA model diagnostics & forecasts")
print("  • Hindcast validation results")
print("  • Monte Carlo erosion probability")
print("  • Monthly risk timeline")
print("  • Shoreline retreat predictions")
print("  • Per-transect vulnerability scores")
print("  • Processed annual features")

print("\\n" + "=" * 60)
print("  PREDICTION SUMMARY")
print("=" * 60)
for _, r in retreat_df.iterrows():
    print(f"  {r['horizon']} ({r['target_date']}): "
          f"P(erosion)={r['erosion_probability']:.0%}, "
          f"Retreat={r['retreat_m']:.1f}m, "
          f"Action: {r['action_level']}")
""")


# =====================================================================
# Write notebook
# =====================================================================
nb.cells = cells
nbf.write(nb, 'notebook.ipynb')
print(f"✓ Created notebook.ipynb with {len(cells)} cells")
