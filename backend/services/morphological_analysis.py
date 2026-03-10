"""
Morphological Threshold Analysis Service
Replicates all analysis logic from research.ipynb:
  1. Environmental data merging
  2. HMM erosion regime detection
  3. CVI (Coastal Vulnerability Index)
  4. VECM + Linear Trend forecasting
  5. BMSI (Beach Morphological Stability Index)
  6. Shoreline change estimation
  7. Setback risk indicator
"""

import numpy as np
import pandas as pd
from pathlib import Path
from functools import reduce
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
from hmmlearn.hmm import GaussianHMM
from statsmodels.tsa.vector_ar.vecm import coint_johansen, VECM
from statsmodels.tsa.stattools import adfuller


def _quantile_rank_desc(value, series):
    """CVI-style ranking: lower value → higher rank (4,3,2,1)."""
    q25, q50, q75 = series.quantile([0.25, 0.5, 0.75])
    if value <= q25:
        return 4
    elif value <= q50:
        return 3
    elif value <= q75:
        return 2
    else:
        return 1


def _quantile_rank_asc(value, series):
    """BMSI-style normal ranking: lower value → lower rank (1,2,3,4)."""
    q25, q50, q75 = series.quantile([0.25, 0.5, 0.75])
    if value <= q25:
        return 1
    elif value <= q50:
        return 2
    elif value <= q75:
        return 3
    else:
        return 4


def _geometric_mean_index(ranks):
    return float(np.sqrt(np.array(ranks).prod() / len(ranks)))


def _classify_level(value, upper_bound, lower_bound, labels):
    interval = (upper_bound - lower_bound) / 4
    r1 = lower_bound + interval
    r2 = lower_bound + 2 * interval
    r3 = lower_bound + 3 * interval
    if value <= r1:
        return labels[0]
    elif value <= r2:
        return labels[1]
    elif value <= r3:
        return labels[2]
    else:
        return labels[3]


CVI_LABELS = ["very low", "low", "moderate", "high"]
BMSI_LABELS = ["Very low", "Low", "Moderate", "High"]

CVI_COLUMNS = [
    "Elevation AVG m",
    "Elevation Gain m",
    "Elevation Loss m",
    "AVG Slope steepest upward (%)",
    "AVG Slope steepest downward (%)",
]

EVAL_COLUMNS = [
    "Date",
    "Elevation Min m",
    "Elevation Max m",
    "Elevation AVG m",
    "Distance meters",
    "Elevation Gain m",
    "Elevation Loss m",
    "AVG Slope steepest upward (%)",
    "AVG Slope steepest downward (%)",
]


def run_morphological_analysis(dataset_path: Path) -> dict:
    """Run the full morphological threshold analysis pipeline."""
    results = {}

    # ── 1. Load & merge environmental CSV files ──────────────────────
    csv_files = sorted(dataset_path.glob("*.csv"))
    dfs = [pd.read_csv(f) for f in csv_files]
    for d in dfs:
        d["Date"] = pd.to_datetime(d["Date"])

    merged_df = reduce(
        lambda left, right: pd.merge(left, right, on="Date", how="outer"), dfs
    )
    merged_df = merged_df.sort_values("Date").reset_index(drop=True)
    feature_cols = [c for c in merged_df.columns if c != "Date"]

    results["environmentalVariables"] = feature_cols
    results["dataRange"] = {
        "start": str(merged_df["Date"].min().date()),
        "end": str(merged_df["Date"].max().date()),
        "totalRows": int(len(merged_df)),
    }

    # Monthly environmental time-series for frontend charts
    ts_df = merged_df.copy()
    ts_df["Date"] = ts_df["Date"].dt.strftime("%Y-%m")
    results["environmentalTimeSeries"] = [
        {k: (float(v) if isinstance(v, (int, float, np.floating)) else v)
         for k, v in row.items()}
        for row in ts_df.to_dict("records")
    ]

    # ── 2. Load events & extract 12-month cycles ────────────────────
    events_df = pd.read_excel(dataset_path / "events.xlsx")
    events_df[["start_date", "end_date"]] = events_df["Period"].str.split(
        " - ", expand=True
    )
    events_df["start_date"] = pd.to_datetime(events_df["start_date"])
    events_df["end_date"] = pd.to_datetime(events_df["end_date"])

    cycle_sequences, cycle_labels, cycle_years = [], [], []
    for _, row in events_df.iterrows():
        mask = (merged_df["Date"] >= row["start_date"]) & (
            merged_df["Date"] <= row["end_date"]
        )
        cycle = merged_df.loc[mask, feature_cols]
        if len(cycle) == 12:
            cycle_sequences.append(cycle.values)
            cycle_labels.append(row["Label"])
            cycle_years.append(row["start_date"].year)

    # ── 3. HMM erosion regime analysis ───────────────────────────────
    X = np.vstack(cycle_sequences)
    lengths = [12] * len(cycle_sequences)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    hmm = GaussianHMM(
        n_components=4, covariance_type="full", n_iter=500, random_state=42
    )
    hmm.fit(X_scaled, lengths)

    hidden_states = hmm.predict(X_scaled, lengths)
    state_sequences = np.split(hidden_states, np.cumsum(lengths)[:-1])

    # Map states → erosion probability
    state_label_map = {}
    for s in range(hmm.n_components):
        labels_for = [
            cycle_labels[i] for i, seq in enumerate(state_sequences) if s in seq
        ]
        if labels_for:
            state_label_map[s] = sum(1 for l in labels_for if l == "erosion") / len(
                labels_for
            )
        else:
            state_label_map[s] = 0.0

    erosion_state = max(state_label_map, key=state_label_map.get)

    # Current-period transition probability
    current_start = pd.Timestamp("2025-04-01")
    current_cycle = merged_df.loc[merged_df["Date"] >= current_start, feature_cols]

    if len(current_cycle) > 0:
        current_scaled = scaler.transform(current_cycle.values)
        current_states = hmm.predict(current_scaled)
        last_state = int(current_states[-1])
        erosion_transition_prob = float(hmm.transmat_[last_state][erosion_state])
    else:
        erosion_transition_prob = 0.0
        last_state = 0

    # Erosion thresholds (real scale)
    threshold_real = scaler.inverse_transform(
        hmm.means_[erosion_state].reshape(1, -1)
    )[0]

    comparison_data = []
    if len(current_cycle) > 0:
        latest_vals = current_cycle.iloc[-1].values
        for i, col in enumerate(feature_cols):
            cv = float(latest_vals[i])
            tv = float(threshold_real[i])
            comparison_data.append(
                {
                    "variable": col,
                    "currentValue": float(f'{cv:.4g}'),
                    "thresholdValue": float(f'{tv:.4g}'),
                    "gap": float(f'{(tv - cv):.4g}'),
                }
            )

    # State means (real scale)
    state_means_real = scaler.inverse_transform(hmm.means_)
    state_means_data = []
    for i in range(hmm.n_components):
        entry = {"state": f"State_{i}", "isErosion": i == erosion_state}
        for j, col in enumerate(feature_cols):
            entry[col] = float(f'{float(state_means_real[i][j]):.4g}')
        state_means_data.append(entry)

    results["hmm"] = {
        "erosionState": int(erosion_state),
        "erosionTransitionProb": round(erosion_transition_prob, 4),
        "transitionMatrix": np.round(hmm.transmat_, 4).tolist(),
        "thresholdComparison": comparison_data,
        "stateMeans": state_means_data,
        "stateLabelMap": {str(k): round(v, 4) for k, v in state_label_map.items()},
        "totalCycles": len(cycle_sequences),
        "erosionCycles": sum(1 for l in cycle_labels if l == "erosion"),
    }

    # ── 4. Load evaluation data & annual aggregates ──────────────────
    eval_df = pd.read_excel(dataset_path / "evaluation.xlsx")
    main_df = eval_df[EVAL_COLUMNS].copy()
    main_df["Date"] = pd.to_datetime(main_df["Date"])
    main_df["Year"] = main_df["Date"].dt.year

    annual_df = (
        main_df.groupby("Year")
        .agg(
            {
                "Elevation Min m": "mean",
                "Elevation Max m": "mean",
                "Elevation AVG m": "mean",
                "Distance meters": "mean",
                "Elevation Gain m": "mean",
                "Elevation Loss m": "mean",
                "AVG Slope steepest upward (%)": "mean",
                "AVG Slope steepest downward (%)": "mean",
            }
        )
        .reset_index()
    )

    results["annualData"] = annual_df.round(4).to_dict("records")

    # ── 5. CVI calculation (current) ────────────────────────────────
    cvi_df = annual_df.copy()

    def calc_cvi(v1, v2, v3, v4, v5):
        ranks = [
            _quantile_rank_desc(v1, cvi_df["Elevation AVG m"]),
            _quantile_rank_desc(v2, cvi_df["Elevation Gain m"]),
            _quantile_rank_desc(v3, cvi_df["Elevation Loss m"]),
            _quantile_rank_desc(v4, cvi_df["AVG Slope steepest upward (%)"]),
            _quantile_rank_desc(v5, cvi_df["AVG Slope steepest downward (%)"]),
        ]
        return _geometric_mean_index(ranks)

    extremes = {}
    for col in CVI_COLUMNS:
        extremes[col] = (float(cvi_df[col].min()), float(cvi_df[col].max()))

    cvi_upper = calc_cvi(*(extremes[c][0] for c in CVI_COLUMNS))
    cvi_lower = calc_cvi(*(extremes[c][1] for c in CVI_COLUMNS))

    latest = cvi_df.loc[cvi_df["Year"].idxmax()]
    cvi_current = calc_cvi(*(latest[c] for c in CVI_COLUMNS))
    cvi_current_level = _classify_level(cvi_current, cvi_upper, cvi_lower, CVI_LABELS)

    # ── 6. Forecast evaluation variables (VECM + Linear Trend) ──────
    source_df = annual_df[["Year"] + CVI_COLUMNS].copy()
    source_df = source_df.sort_values("Year").set_index("Year")
    source_df.index = pd.to_datetime(source_df.index, format="%Y")

    # ADF stationarity tests
    adf_results = []
    for col in source_df.columns:
        res = adfuller(source_df[col].dropna())
        adf_results.append(
            {
                "variable": col,
                "adfStatistic": round(float(res[0]), 4),
                "pValue": round(float(res[1]), 4),
                "stationary": bool(res[1] < 0.05),
            }
        )

    # VECM forecast
    vecm_2026 = None
    vecm_rmse = float("inf")
    try:
        vecm_df = source_df.copy()
        johansen = coint_johansen(vecm_df, det_order=0, k_ar_diff=1)
        rank = int(sum(johansen.lr1 > johansen.cvt[:, 1]))
        rank = max(rank, 1)

        vecm_model = VECM(
            vecm_df.astype(float), k_ar_diff=0, coint_rank=rank, deterministic="co"
        )
        vecm_res = vecm_model.fit()
        vecm_forecast = np.real(vecm_res.predict(steps=1))
        vecm_2026 = dict(zip(source_df.columns, vecm_forecast[0]))

        # Rolling RMSE
        errors = []
        for i in range(8, len(vecm_df) - 1):
            train = vecm_df.iloc[:i]
            m = VECM(
                train.astype(float), k_ar_diff=0, coint_rank=rank, deterministic="co"
            ).fit()
            pred = np.real(m.predict(steps=1))
            true_val = vecm_df.iloc[i : i + 1].values
            errors.append(float(mean_squared_error(true_val, pred)))
        vecm_rmse = float(np.sqrt(np.mean(errors)))
    except Exception:
        pass

    # Linear Trend forecast
    trend_df = source_df.copy()
    t = np.arange(len(trend_df))
    trend_2026 = {}
    for col in trend_df.columns:
        lr = LinearRegression()
        lr.fit(t.reshape(-1, 1), trend_df[col].values)
        trend_2026[col] = float(lr.predict([[len(t)]])[0])

    # Trend rolling RMSE
    trend_errors = []
    for i in range(8, len(trend_df) - 1):
        train = trend_df.iloc[:i]
        t_train = np.arange(len(train))
        preds = []
        for col in train.columns:
            lr = LinearRegression()
            lr.fit(t_train.reshape(-1, 1), train[col].values)
            preds.append(float(lr.predict([[len(train)]])[0]))
        true_val = trend_df.iloc[i].values
        trend_errors.append(float(mean_squared_error(true_val, preds)))
    trend_rmse = float(np.sqrt(np.mean(trend_errors)))

    # Select best model
    if vecm_rmse < trend_rmse and vecm_2026 is not None:
        selected_model = "VECM"
    else:
        selected_model = "Linear Trend"

    results["modelComparison"] = {
        "vecmRmse": round(vecm_rmse, 4) if vecm_rmse != float("inf") else None,
        "trendRmse": round(trend_rmse, 4),
        "selectedModel": selected_model,
        "adfResults": adf_results,
    }

    # CVI forecast — notebook uses trend_df.iloc[0] (first historical row)
    # Replicating exact notebook behaviour
    fc_vals = {col: float(trend_df[col].iloc[0]) for col in CVI_COLUMNS}
    cvi_forecast = calc_cvi(*(fc_vals[c] for c in CVI_COLUMNS))
    cvi_forecast_level = _classify_level(
        cvi_forecast, cvi_upper, cvi_lower, CVI_LABELS
    )

    results["cvi"] = {
        "currentValue": round(cvi_current, 4),
        "currentLevel": cvi_current_level,
        "forecastValue": round(cvi_forecast, 4),
        "forecastLevel": cvi_forecast_level,
        "upperBound": round(cvi_upper, 4),
        "lowerBound": round(cvi_lower, 4),
        "forecastYear": 2026,
        "latestYear": int(latest["Year"]),
    }

    # ── 7. BMSI calculation ──────────────────────────────────────────
    bmsi_df = annual_df.copy()

    def calc_bmsi(v1, v2, v3, v4, v5):
        ranks = [
            _quantile_rank_asc(v1, bmsi_df["Elevation AVG m"]),
            _quantile_rank_asc(v2, bmsi_df["Elevation Gain m"]),
            _quantile_rank_desc(v3, bmsi_df["Elevation Loss m"]),  # inverted
            _quantile_rank_asc(v4, bmsi_df["AVG Slope steepest upward (%)"]),
            _quantile_rank_desc(v5, bmsi_df["AVG Slope steepest downward (%)"]),  # inverted
        ]
        return _geometric_mean_index(ranks)

    bmsi_extremes = {}
    for col in CVI_COLUMNS:
        bmsi_extremes[col] = (float(bmsi_df[col].min()), float(bmsi_df[col].max()))

    bmsi_upper = calc_bmsi(*(bmsi_extremes[c][0] for c in CVI_COLUMNS))
    bmsi_lower = calc_bmsi(*(bmsi_extremes[c][1] for c in CVI_COLUMNS))

    bmsi_latest = bmsi_df.loc[bmsi_df["Year"].idxmax()]
    bmsi_current = calc_bmsi(*(bmsi_latest[c] for c in CVI_COLUMNS))
    bmsi_current_stability = _classify_level(
        bmsi_current, bmsi_upper, bmsi_lower, BMSI_LABELS
    )

    # BMSI forecast — same trend_df.iloc[0] behaviour as notebook
    bmsi_forecast = calc_bmsi(*(fc_vals[c] for c in CVI_COLUMNS))
    bmsi_forecast_stability = _classify_level(
        bmsi_forecast, bmsi_upper, bmsi_lower, BMSI_LABELS
    )

    results["bmsi"] = {
        "currentValue": round(bmsi_current, 4),
        "currentStability": bmsi_current_stability,
        "forecastValue": round(bmsi_forecast, 4),
        "forecastStability": bmsi_forecast_stability,
        "upperBound": round(bmsi_upper, 4),
        "lowerBound": round(bmsi_lower, 4),
    }

    # ── 8. Shoreline change estimation ───────────────────────────────
    shore_df = annual_df.copy()
    shore_df["Net_Elevation_Change_m"] = (
        shore_df["Elevation Gain m"] + shore_df["Elevation Loss m"]
    )
    shore_df["Mean_Slope_pct"] = (
        shore_df["AVG Slope steepest upward (%)"].abs()
        + shore_df["AVG Slope steepest downward (%)"].abs()
    ) / 2
    shore_df["Mean_Slope"] = shore_df["Mean_Slope_pct"] / 100
    shore_df["Estimated_Shoreline_Shift_m"] = (
        shore_df["Net_Elevation_Change_m"] / shore_df["Mean_Slope"] * 0.1
    )

    historical_shifts = []
    for _, row in shore_df.iterrows():
        historical_shifts.append(
            {
                "year": int(row["Year"]),
                "shift": round(float(row["Estimated_Shoreline_Shift_m"]), 4),
                "netElevationChange": round(float(row["Net_Elevation_Change_m"]), 4),
                "meanSlope": round(float(row["Mean_Slope"]), 4),
            }
        )

    X_shore = shore_df["Year"].values.reshape(-1, 1)
    y_shore = shore_df["Estimated_Shoreline_Shift_m"].values
    shore_model = LinearRegression()
    shore_model.fit(X_shore, y_shore)

    predicted_shift = float(shore_model.predict([[2026]])[0])
    erosion_rate = float(shore_model.coef_[0])

    results["shoreline"] = {
        "historicalShifts": historical_shifts,
        "predictedShift2026": round(predicted_shift, 4),
        "erosionRate": round(erosion_rate, 4),
    }

    # ── 9. Setback risk indicator ────────────────────────────────────
    setback_table = {
        "very low": {"reservation": 15, "restricted": 30},
        "low": {"reservation": 20, "restricted": 30},
        "moderate": {"reservation": 20, "restricted": 35},
        "high": {"reservation": 25, "restricted": 35},
    }

    predicted_retreat = abs(predicted_shift)
    cvi_lvl = cvi_forecast_level
    reservation_distance = setback_table[cvi_lvl]["reservation"]
    restricted_distance = setback_table[cvi_lvl]["restricted"]

    if predicted_retreat <= reservation_distance:
        zone = "Reservation Area (No Build Zone)"
        safety = "Safe"
    elif predicted_retreat <= restricted_distance:
        zone = "Restricted Area (Soft Development Zone)"
        safety = "Caution"
    else:
        zone = "Beyond Restricted Area"
        safety = "High Risk"

    results["setback"] = {
        "cviLevel": cvi_lvl,
        "predictedRetreat": round(predicted_retreat, 4),
        "reservationDistance": reservation_distance,
        "restrictedDistance": restricted_distance,
        "zone": zone,
        "safety": safety,
    }

    # ── 10. Forecast values summary ──────────────────────────────────
    results["forecastValues"] = {
        col: round(float(v), 4) for col, v in trend_2026.items()
    }

    return results
