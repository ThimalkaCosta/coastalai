import json

def cell(cell_type, source, **kwargs):
    base = {
        "cell_type": cell_type,
        "metadata": {},
        "source": source if isinstance(source, str) else source,
    }
    if cell_type == "code":
        base["outputs"] = []
        base["execution_count"] = None
    return {**base, **kwargs}

MD  = "markdown"
COD = "code"

cells = [

# ── Title ──────────────────────────────────────────────────────────
cell(MD, """\
# 🌊 Coastal Erosion Forecasting System
## Real-Time Environmental Data + Deep Learning (LSTM)

This notebook:
1. Downloads **real-time** atmospheric data from **Copernicus CDS (ERA5)**
2. Downloads **real-time** wave forecast data from **CMEMS**
3. Trains a **multi-output LSTM** deep learning model
4. Forecasts all environmental variables for any future date (< 1 year ahead)

> **Data Sources**
> - ERA5: https://cds.climate.copernicus.eu/
> - CMEMS: https://marine.copernicus.eu/
"""),

# ── Step 1: Install ────────────────────────────────────────────────
cell(MD, "## 📦 Step 1: Install Required Libraries"),
cell(COD, """\
import subprocess, sys

def install(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "-q"])

packages = [
    "cdsapi", "copernicusmarine", "xarray", "netCDF4",
    "h5netcdf", "pandas", "numpy", "matplotlib", "seaborn",
    "scikit-learn", "tensorflow", "scipy", "statsmodels",
    "python-dateutil", "tqdm",
]
for p in packages:
    print(f"Installing {p} ...")
    install(p)
print("\\n✅ All libraries installed.")
"""),

# ── Step 2: Config ────────────────────────────────────────────────
cell(MD, """\
## ⚙️ Step 2: Configuration
Edit below and run this cell first. Enter your CDS API key from your CDS profile.
"""),
cell(COD, """\
# ============================================================
# USER CONFIGURATION
# ============================================================
import datetime, os, warnings
warnings.filterwarnings("ignore")

# Copernicus CDS credentials  — https://cds.climate.copernicus.eu/
CDS_URL = "https://cds.climate.copernicus.eu/api"
CDS_KEY = "YOUR_CDS_API_KEY_HERE"   # Paste your key here  e.g. "abcd1234-xxxx-..."

# CMEMS credentials  — https://marine.copernicus.eu/
CMEMS_USER = "tharushinjayasooriya@gmail.com"
CMEMS_PASS = "Research@12"

# Study area bounding box  (south, north, west, east)
LAT_MIN, LAT_MAX = 5.8,  6.5
LON_MIN, LON_MAX = 80.0, 81.5

# Training date range  (last 3 years, ERA5 has ~5-day latency)
TODAY      = datetime.date.today()
END_DATE   = TODAY - datetime.timedelta(days=7)
START_DATE = END_DATE - datetime.timedelta(days=3*365)

# ── Target prediction date (must be within 1 year from today) ──
TARGET_DATE_STR = "2026-10-01"   # ← CHANGE THIS

TARGET_DATE   = datetime.datetime.strptime(TARGET_DATE_STR, "%Y-%m-%d").date()
FORECAST_DAYS = (TARGET_DATE - TODAY).days
assert 0 < FORECAST_DAYS <= 365, "Target date must be 1–365 days from today!"

print(f"Study area  : Lat [{LAT_MIN}, {LAT_MAX}] | Lon [{LON_MIN}, {LON_MAX}]")
print(f"Training    : {START_DATE}  →  {END_DATE}")
print(f"Forecast to : {TARGET_DATE}  ({FORECAST_DAYS} days ahead)")
"""),

# ── Step 3: ERA5 ──────────────────────────────────────────────────
cell(MD, """\
## 📡 Step 3: Download ERA5 Data (Copernicus CDS)
Downloads hourly single-level variables for your region.
This submits a job to the CDS queue — may take a few minutes.
"""),
cell(COD, """\
import cdsapi
from datetime import date

CDS_FILE = "era5_coastal_data.nc"

if os.path.exists(CDS_FILE):
    print(f"✅ Using cached: {CDS_FILE}  (delete file to re-download)")
else:
    client = cdsapi.Client(url=CDS_URL, key=CDS_KEY, quiet=False)

    # Build full year/month lists for the request
    from dateutil.relativedelta import relativedelta
    months_list = []
    d = START_DATE.replace(day=1)
    while d <= END_DATE:
        months_list.append(d)
        d += relativedelta(months=1)

    years  = sorted(set(str(m.year)  for m in months_list))
    months = sorted(set(f"{m.month:02d}" for m in months_list))

    print(f"Requesting ERA5  {years[0]}–{years[-1]} ...")
    client.retrieve(
        "reanalysis-era5-single-levels",
        {
            "product_type": "reanalysis",
            "variable": [
                "10m_u_component_of_wind",
                "10m_v_component_of_wind",
                "mean_sea_level_pressure",
                "sea_surface_temperature",
                "significant_height_of_combined_wind_waves_and_swell",
                "mean_wave_direction",
                "mean_wave_period",
                "total_precipitation",
            ],
            "year":  years,
            "month": months,
            "day":   [f"{d:02d}" for d in range(1, 32)],
            "time":  ["00:00", "06:00", "12:00", "18:00"],
            "area":  [LAT_MAX, LON_MIN, LAT_MIN, LON_MAX],
            "format": "netcdf",
        },
        CDS_FILE,
    )
    print(f"✅ ERA5 saved → {CDS_FILE}")
"""),

# ── Step 4: CMEMS ─────────────────────────────────────────────────
cell(MD, """\
## 🌊 Step 4: Download CMEMS Wave Data
Global Wave Analysis and Forecast (3-hourly, 0.083°).
"""),
cell(COD, """\
import copernicusmarine as cm

CMEMS_FILE = "cmems_wave_data.nc"

if os.path.exists(CMEMS_FILE):
    print(f"✅ Using cached: {CMEMS_FILE}  (delete file to re-download)")
else:
    cm.login(username=CMEMS_USER, password=CMEMS_PASS,
             overwrite_configuration_file=True)

    cm.subset(
        dataset_id        = "cmems_mod_glo_wav_anfc_0.083deg_PT3H-i",
        variables         = ["VHM0", "VMDR", "VTM01_WW", "VTPK"],
        minimum_latitude  = LAT_MIN,
        maximum_latitude  = LAT_MAX,
        minimum_longitude = LON_MIN,
        maximum_longitude = LON_MAX,
        start_datetime    = str(START_DATE) + " 00:00:00",
        end_datetime      = str(TODAY)      + " 00:00:00",
        output_filename   = CMEMS_FILE,
        force_download    = True,
    )
    print(f"✅ CMEMS saved → {CMEMS_FILE}")
"""),

# ── Step 5: Preprocess ────────────────────────────────────────────
cell(MD, "## 🔄 Step 5: Load, Merge & Preprocess Data"),
cell(COD, """\
import xarray as xr
import pandas as pd
import numpy as np

# Load ERA5 → spatial mean → daily
ds_era5  = xr.open_dataset(CDS_FILE)
era5_ts  = ds_era5.mean(dim=["latitude", "longitude"])
df_era5  = era5_ts.to_dataframe().reset_index()
df_era5.columns = [c.lower() for c in df_era5.columns]
time_col = [c for c in df_era5.columns if "time" in c][0]
df_era5  = (df_era5.rename(columns={time_col: "time"})
                   .assign(time=lambda d: pd.to_datetime(d["time"]))
                   .set_index("time").sort_index())

# Load CMEMS → spatial mean → daily
ds_cmems  = xr.open_dataset(CMEMS_FILE)
cmems_ts  = ds_cmems.mean(dim=["latitude", "longitude"])
df_cmems  = cmems_ts.to_dataframe().reset_index()
df_cmems.columns = [c.lower() for c in df_cmems.columns]
time_col2 = [c for c in df_cmems.columns if "time" in c][0]
df_cmems  = (df_cmems.rename(columns={time_col2: "time"})
                     .assign(time=lambda d: pd.to_datetime(d["time"]))
                     .set_index("time").sort_index())

# Resample to daily & merge
df = (df_era5.resample("D").mean()
             .join(df_cmems.resample("D").mean(), how="outer", rsuffix="_cmems")
             .interpolate("time").dropna())

print(f"ERA5 cols  : {list(df_era5.columns)[:6]} ...")
print(f"CMEMS cols : {list(df_cmems.columns)}")
print(f"Merged     : {df.shape[0]} days × {df.shape[1]} cols")
"""),
cell(COD, """\
# Feature engineering
u_col = next((c for c in df.columns if "u10" in c or "u_component" in c), None)
v_col = next((c for c in df.columns if "v10" in c or "v_component" in c), None)
if u_col and v_col:
    df["wind_speed"] = np.sqrt(df[u_col]**2 + df[v_col]**2)
else:
    df["wind_speed"] = np.nan

if "vhm0" in df.columns:
    df["wave_energy"] = df["vhm0"]**2

df["doy_sin"]    = np.sin(2*np.pi*df.index.day_of_year/365)
df["doy_cos"]    = np.cos(2*np.pi*df.index.day_of_year/365)
df["month_sin"]  = np.sin(2*np.pi*df.index.month/12)
df["month_cos"]  = np.cos(2*np.pi*df.index.month/12)

for col in [c for c in ["wind_speed","vhm0","vtpk"] if c in df.columns]:
    df[f"{col}_r7"]  = df[col].rolling(7,  min_periods=1).mean()
    df[f"{col}_r30"] = df[col].rolling(30, min_periods=1).mean()

df.dropna(inplace=True)
print(f"Final dataset: {df.shape[0]} days | {df.shape[1]} features")
df.head(3)
"""),

# ── Step 6: EDA ───────────────────────────────────────────────────
cell(MD, "## 📊 Step 6: Exploratory Data Analysis"),
cell(COD, """\
import matplotlib.pyplot as plt
import seaborn as sns

sns.set_theme(style="darkgrid")
plt.rcParams["figure.figsize"] = (16, 4)

KEY_VARS = [c for c in ["wind_speed","vhm0","vtpk","msl","sst","vmdr"]
            if c in df.columns]

# Time series
fig, axes = plt.subplots(len(KEY_VARS), 1, figsize=(16, 3*len(KEY_VARS)), sharex=True)
for ax, var in zip(axes, KEY_VARS):
    ax.plot(df.index, df[var], lw=0.8)
    ax.set_ylabel(var, fontsize=9)
    ax.set_title(var, fontsize=9)
plt.suptitle("Environmental Variables — Historical Daily Mean", fontsize=12, y=1.01)
plt.tight_layout()
plt.savefig("eda_timeseries.png", dpi=120, bbox_inches="tight")
plt.show()
"""),
cell(COD, """\
# Correlation heatmap
plt.figure(figsize=(9,7))
sns.heatmap(df[KEY_VARS].corr(), annot=True, fmt=".2f", cmap="coolwarm", square=True)
plt.title("Feature Correlation Matrix")
plt.tight_layout()
plt.savefig("eda_correlation.png", dpi=120, bbox_inches="tight")
plt.show()

# Monthly boxplots
df["_month"] = df.index.month
fig, axes = plt.subplots(1, min(len(KEY_VARS),3), figsize=(16,5))
for ax, col in zip(axes, KEY_VARS[:3]):
    df.boxplot(column=col, by="_month", ax=ax)
    ax.set_title(col); ax.set_xlabel("Month")
plt.suptitle("")
plt.tight_layout()
plt.savefig("eda_monthly.png", dpi=120, bbox_inches="tight")
plt.show()
df.drop(columns=["_month"], inplace=True)
print("✅ EDA plots saved.")
"""),

# ── Step 7: LSTM ──────────────────────────────────────────────────
cell(MD, """\
## 🤖 Step 7: LSTM Deep Learning Model

**Architecture**: Stacked LSTM (128→64) + Multi-Output Dense head
- Input: 30-day sliding window of all features
- Output: Next-day values for all target environmental variables
"""),
cell(COD, """\
from sklearn.preprocessing import MinMaxScaler

TARGET_COLS  = [c for c in ["wind_speed","vhm0","vtpk","vmdr","msl","sst"]
                if c in df.columns]
FEATURE_COLS = list(df.columns)
SEQ_LEN      = 30

print(f"Targets  ({len(TARGET_COLS)}): {TARGET_COLS}")
print(f"Features ({len(FEATURE_COLS)}): {FEATURE_COLS[:8]} ...")

data = df[FEATURE_COLS].values
targ_idx = [FEATURE_COLS.index(c) for c in TARGET_COLS]

scaler_X = MinMaxScaler()
scaler_y = MinMaxScaler()
feat_sc   = scaler_X.fit_transform(data)
targ_sc   = scaler_y.fit_transform(data[:, targ_idx])

def make_sequences(X, y, sl):
    Xs, ys = [], []
    for i in range(len(X)-sl):
        Xs.append(X[i:i+sl])
        ys.append(y[i+sl])
    return np.array(Xs), np.array(ys)

X_seq, y_seq = make_sequences(feat_sc, targ_sc, SEQ_LEN)
n    = len(X_seq)
n_tr = int(n*0.80); n_val = int(n*0.10)

X_train,y_train = X_seq[:n_tr],         y_seq[:n_tr]
X_val,  y_val   = X_seq[n_tr:n_tr+n_val], y_seq[n_tr:n_tr+n_val]
X_test, y_test  = X_seq[n_tr+n_val:],   y_seq[n_tr+n_val:]
print(f"Train {X_train.shape} | Val {X_val.shape} | Test {X_test.shape}")
"""),
cell(COD, """\
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks

tf.random.set_seed(42); np.random.seed(42)
N_FEAT = X_train.shape[2]
N_TARG = y_train.shape[1]

inp = keras.Input(shape=(SEQ_LEN, N_FEAT))
x   = layers.LSTM(128, return_sequences=True)(inp)
x   = layers.Dropout(0.2)(x)
x   = layers.LSTM(64)(x)
x   = layers.Dropout(0.2)(x)
x   = layers.Dense(64, activation="relu")(x)
x   = layers.BatchNormalization()(x)
out = layers.Dense(N_TARG)(x)
model = keras.Model(inp, out)
model.summary()
"""),
cell(COD, """\
lr_sched = keras.optimizers.schedules.CosineDecayRestarts(1e-3, 50)
model.compile(optimizer=keras.optimizers.Adam(lr_sched),
              loss="huber", metrics=["mae"])

cb = [
    callbacks.EarlyStopping("val_loss", patience=25,
                             restore_best_weights=True, verbose=1),
    callbacks.ModelCheckpoint("best_lstm_coastal.keras",
                               save_best_only=True, verbose=0),
    callbacks.ReduceLROnPlateau("val_loss", factor=0.5, patience=10, verbose=1),
]

history = model.fit(X_train, y_train,
                    validation_data=(X_val, y_val),
                    epochs=200, batch_size=32,
                    callbacks=cb, verbose=1)
print("✅ Training complete.")
"""),

# ── Step 8: Evaluation ────────────────────────────────────────────
cell(MD, "## 📈 Step 8: Model Evaluation"),
cell(COD, """\
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

model = keras.models.load_model("best_lstm_coastal.keras")

# Training curves
fig, ax = plt.subplots(1,2,figsize=(14,4))
ax[0].plot(history.history["loss"],     label="Train"); ax[0].plot(history.history["val_loss"],label="Val")
ax[0].set_title("Loss (Huber)"); ax[0].legend()
ax[1].plot(history.history["mae"],      label="Train"); ax[1].plot(history.history["val_mae"], label="Val")
ax[1].set_title("MAE"); ax[1].legend()
plt.suptitle("Training History"); plt.tight_layout()
plt.savefig("training_history.png", dpi=120, bbox_inches="tight"); plt.show()

# Test predictions
y_pred = scaler_y.inverse_transform(model.predict(X_test, verbose=0))
y_true = scaler_y.inverse_transform(y_test)

rows = []
for i, col in enumerate(TARGET_COLS):
    rows.append({
        "Variable": col,
        "R²":       round(r2_score(y_true[:,i], y_pred[:,i]), 4),
        "MAE":      round(mean_absolute_error(y_true[:,i], y_pred[:,i]), 4),
        "RMSE":     round(np.sqrt(mean_squared_error(y_true[:,i], y_pred[:,i])), 4),
        "MAPE(%)":  round(np.mean(np.abs((y_true[:,i]-y_pred[:,i])/(np.abs(y_true[:,i])+1e-8)))*100, 2)
    })
metrics_df = pd.DataFrame(rows)
print("\\n📊 Test-Set Metrics:")
display(metrics_df)
"""),
cell(COD, """\
# Predicted vs Actual
fig, axes = plt.subplots(len(TARGET_COLS),1,figsize=(16,3.5*len(TARGET_COLS)),sharex=True)
if len(TARGET_COLS)==1: axes=[axes]
for ax,col,i in zip(axes,TARGET_COLS,range(len(TARGET_COLS))):
    ax.plot(y_true[:,i], label="Actual",    lw=1.2, color="steelblue")
    ax.plot(y_pred[:,i], label="Predicted", lw=1,   color="coral", ls="--")
    ax.set_ylabel(col); ax.legend()
    ax.set_title(f"{col}: Predicted vs Actual (Test Set)")
plt.tight_layout()
plt.savefig("test_predictions.png", dpi=120, bbox_inches="tight"); plt.show()

# Residuals
fig2, axes2 = plt.subplots(1,len(TARGET_COLS),figsize=(4.5*len(TARGET_COLS),4))
if len(TARGET_COLS)==1: axes2=[axes2]
for ax,col,i in zip(axes2,TARGET_COLS,range(len(TARGET_COLS))):
    ax.hist(y_true[:,i]-y_pred[:,i], bins=40, edgecolor="white", color="steelblue")
    ax.axvline(0, color="red", lw=1.5)
    ax.set_title(f"{col} residuals")
plt.tight_layout()
plt.savefig("residuals.png", dpi=120, bbox_inches="tight"); plt.show()
print("✅ Evaluation plots saved.")
"""),

# ── Step 9: Forecast ──────────────────────────────────────────────
cell(MD, """\
## 🔮 Step 9: Recursive Future Forecast
Predicts all target environmental variables from today to TARGET_DATE.
"""),
cell(COD, """\
current_seq   = feat_sc[-SEQ_LEN:].copy()
all_pred_list = []

for step in range(FORECAST_DAYS):
    inp_arr = current_seq[np.newaxis,:,:]
    pred_sc = model.predict(inp_arr, verbose=0)[0]
    all_pred_list.append(pred_sc)

    next_feat = current_seq[-1].copy()
    for j, tidx in enumerate(targ_idx):
        next_feat[tidx] = pred_sc[j]

    # Update cyclic time features
    future_day = TODAY + datetime.timedelta(days=step+1)
    doy  = future_day.timetuple().tm_yday
    mon  = future_day.month
    for fe, val in [
        ("doy_sin",   np.sin(2*np.pi*doy/365)),
        ("doy_cos",   np.cos(2*np.pi*doy/365)),
        ("month_sin", np.sin(2*np.pi*mon/12)),
        ("month_cos", np.cos(2*np.pi*mon/12)),
    ]:
        if fe in FEATURE_COLS:
            next_feat[FEATURE_COLS.index(fe)] = val

    current_seq = np.vstack([current_seq[1:], next_feat])

all_pred_inv = scaler_y.inverse_transform(np.array(all_pred_list))
forecast_dates = pd.date_range(TODAY + datetime.timedelta(days=1),
                               periods=FORECAST_DAYS, freq="D")
forecast_df = pd.DataFrame(all_pred_inv, index=forecast_dates, columns=TARGET_COLS)
print(f"✅ Forecast complete: {forecast_df.shape[0]} days")
"""),
cell(COD, """\
# ── Summary table for the target date ──
target_row = forecast_df.loc[str(TARGET_DATE)]
units_map  = {"wind_speed":"m/s","vhm0":"m","vtpk":"s","vmdr":"°","msl":"Pa","sst":"K"}

summary = pd.DataFrame({
    "Variable": TARGET_COLS,
    "Predicted Value": [round(float(target_row[c]),4) for c in TARGET_COLS],
    "Unit": [units_map.get(c,"—") for c in TARGET_COLS],
})

print(f"\\n{'='*55}")
print(f"  🌊 ENVIRONMENTAL FORECAST  —  {TARGET_DATE}")
print(f"{'='*55}")
display(summary)

forecast_df.to_csv("full_forecast.csv")
summary.to_csv("target_date_forecast.csv", index=False)
print("\\n✅ Saved: full_forecast.csv  |  target_date_forecast.csv")
"""),

# ── Step 10: Visualize ────────────────────────────────────────────
cell(MD, "## 📉 Step 10: Forecast Visualization"),
cell(COD, """\
hist_tail = df[TARGET_COLS].iloc[-90:]

fig, axes = plt.subplots(len(TARGET_COLS),1,figsize=(16,3.5*len(TARGET_COLS)),sharex=True)
if len(TARGET_COLS)==1: axes=[axes]

for ax, col in zip(axes, TARGET_COLS):
    ax.plot(hist_tail.index, hist_tail[col], color="steelblue", lw=1.2, label="Historical")
    ax.plot(forecast_df.index, forecast_df[col], color="coral", lw=1.5, ls="--", label="Forecast")
    ax.axvline(pd.Timestamp(TODAY), color="gray", ls=":", lw=1.5, label="Today")
    ax.axvline(pd.Timestamp(TARGET_DATE), color="green", ls="--", lw=1.5,
               label=f"Target: {TARGET_DATE}")
    roll_std = forecast_df[col].rolling(7,min_periods=1,center=True).std().fillna(0)
    ax.fill_between(forecast_df.index,
                    forecast_df[col]-roll_std, forecast_df[col]+roll_std,
                    alpha=0.2, color="coral", label="±1 std band")
    ax.set_ylabel(col); ax.legend(fontsize=8, loc="upper right")
    ax.set_title(f"Forecast: {col}")

plt.suptitle(f"Environmental Forecast  |  Target date: {TARGET_DATE}", fontsize=13, y=1.01)
plt.tight_layout()
plt.savefig("forecast_plot.png", dpi=150, bbox_inches="tight")
plt.show()
print("✅ Saved: forecast_plot.png")
"""),

# ── Step 11: Summary ──────────────────────────────────────────────
cell(MD, "## ✅ Step 11: Final Summary"),
cell(COD, """\
print("="*60)
print("  COASTAL EROSION FORECASTING SYSTEM — SUMMARY")
print("="*60)
print(f"  Region      : Lat[{LAT_MIN},{LAT_MAX}] Lon[{LON_MIN},{LON_MAX}]")
print(f"  Training    : {START_DATE} → {END_DATE}  ({df.shape[0]} days)")
print(f"  Features    : {len(FEATURE_COLS)}")
print(f"  Targets     : {TARGET_COLS}")
print(f"  Forecast to : {TARGET_DATE}  ({FORECAST_DAYS} days)")
print()
print("  Test-set metrics:")
for _, r in metrics_df.iterrows():
    print(f"    {r['Variable']:15s}  R²={r['R²']:.3f}  MAE={r['MAE']:.4f}  RMSE={r['RMSE']:.4f}")
print()
print("  Output files:")
for fn in ["era5_coastal_data.nc","cmems_wave_data.nc",
           "best_lstm_coastal.keras","full_forecast.csv",
           "target_date_forecast.csv","forecast_plot.png",
           "training_history.png","test_predictions.png"]:
    print(f"    {'✅' if os.path.exists(fn) else '❌'}  {fn}")
print("="*60)
"""),
]

nb = {
    "nbformat": 4,
    "nbformat_minor": 5,
    "metadata": {
        "kernelspec": {"display_name":"Python 3","language":"python","name":"python3"},
        "language_info": {"name":"python","version":"3.10.0"},
    },
    "cells": cells,
}

OUT = r"c:\Users\Tharu\Downloads\new-coastal\coastal_erosion_forecasting.ipynb"
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

print(f"✅  Notebook written  →  {OUT}")
