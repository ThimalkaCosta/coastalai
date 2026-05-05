# Coastal Erosion Threshold Detection & Forecasting

## Complete Technical Documentation

**Project:** CoastalAI — Publication-Quality Research Notebook  
**Date:** January 2026  
**Analysis Period:** 2010–2024 (overlapping DSAS and forcing records)  
**Forecast Training:** Full forcing record (2000–present)  
**Monsoon Year:** April (Year N) → March (Year N+1)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Research Objectives](#2-research-objectives)
3. [Data Sources](#3-data-sources)
4. [Methodology Overview](#4-methodology-overview)
5. [Section 0: Setup and Data Loading](#5-section-0-setup-and-data-loading)
6. [Section 1: DSAS Transect Classification](#6-section-1-dsas-transect-classification)
7. [Section 2: Monthly Forcing Feature Extraction](#7-section-2-monthly-forcing-feature-extraction)
8. [Section 3: Erosion Event Labeling and Dataset Join](#8-section-3-erosion-event-labeling-and-dataset-join)
9. [Section 4: Multi-Method Ensemble Threshold Detection](#9-section-4-multi-method-ensemble-threshold-detection)
10. [Section 5: Combined Multi-Factor Threshold Analysis](#10-section-5-combined-multi-factor-threshold-analysis)
11. [Section 6: Results Summary and Master Threshold Table](#11-section-6-results-summary-and-master-threshold-table)
12. [Section 7: Advanced 24-Month Forecast with Actual Predictions](#12-section-7-advanced-24-month-forecast-with-actual-predictions)
13. [Key Findings and Conclusions](#13-key-findings-and-conclusions)

---

## 1. Executive Summary

This analysis implements a research-grade pipeline to identify **scientifically defensible erosion thresholds** from DSAS transect data and oceanographic forcing (wave, wind, current), then forecast erosion risk 24 months ahead using SARIMA + Monte Carlo uncertainty propagation.

The threshold detection uses a **four-method ensemble** approach:

| Method | Principle |
|--------|-----------|
| **ROC / Youden's J** | Maximize sensitivity + specificity (Youden, 1950) |
| **Bayesian Logistic Inflection** | Find P(erosion) = 0.5 via logistic regression |
| **Profile-Likelihood Change-Point** | Maximize log-likelihood ratio across candidate splits |
| **Maximum Mutual Information** | Maximize Shannon information I(X_binary; Y) |

Each method provides independent threshold estimates with 95% confidence intervals from bootstrap resampling and permutation-based p-values. The final **consensus threshold** is the weighted median of all four methods.

---

## 2. Research Objectives

| Objective | Description |
|-----------|-------------|
| **Primary** | Identify quantitative erosion thresholds via 4-method ensemble consensus |
| **Secondary** | Quantify threshold stability and effect sizes for each forcing driver |
| **Tertiary** | Forecast erosion risk 6–24 months ahead with uncertainty quantification |

### Monsoon Year Definition

- **Start:** April (Year N)  
- **End:** March (Year N+1)  
- Seasons: SW Monsoon (May–Sep), NE Monsoon (Nov–Feb), Inter-monsoon (Apr, Oct, Mar)

---

## 3. Data Sources

### 3.1 Shoreline Data (DSAS)
| File | Description |
|------|-------------|
| `all_stat.csv` | Transect-based shoreline statistics from DSAS analysis |

**Key Variables:** EPR (End Point Rate, m/yr), NSM (Net Shoreline Movement), SCE (Shoreline Change Envelope), LRR (Linear Regression Rate), SCE_farthest_year.

**EPR Uncertainty:** 0.47 m/yr (uniform for all transects).

### 3.2 Oceanographic Forcing (NetCDF, 2000–2025)

| File | Variables | Resolution |
|------|-----------|------------|
| Wave reanalysis | VHM0 (wave height), VTPK (peak period) | Monthly |
| Wind reanalysis | wind_speed, wind_stress, eastward/northward wind | Monthly |
| Current reanalysis | uo, vo (current components) | Monthly |

---

## 4. Methodology Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           ANALYSIS PIPELINE                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Sec 0: SETUP & DATA LOADING                                              │
│    ├── Import libraries, create output directories                         │
│    └── Load DSAS CSV + 3 NetCDF forcing datasets                           │
│                                                                            │
│  Sec 1: DSAS TRANSECT CLASSIFICATION (5-class EPR labels)                  │
│    ├── EPR-based classification using uncertainty bounds (±0.47 m/yr)       │
│    ├── eroded_high | eroded_low | stable | accreted_low | accreted_high    │
│    └── Extract erosion event years from peak retreat positions              │
│                                                                            │
│  Sec 2: MONTHLY FORCING FEATURE EXTRACTION (POT logic)                     │
│    ├── Wind: max, P90, storm days, stress                                  │
│    ├── Wave: Hm0 max, P90, cumulative energy, storm days                   │
│    ├── Current: max, P90, cumulative transport                             │
│    └── Merge into single annual forcing dataframe                          │
│                                                                            │
│  Sec 3: EROSION EVENT LABELING & DATASET JOIN (2010–2024)                  │
│    ├── Mann-Whitney U test with Cliff's delta effect size                  │
│    └── Identify statistically significant forcing features                 │
│                                                                            │
│  Sec 4: 4-METHOD ENSEMBLE THRESHOLD DETECTION                             │
│    ├── A: ROC / Youden's J (permutation p-value, bootstrap CI)             │
│    ├── B: Bayesian Logistic Inflection (P=0.5 crossing)                    │
│    ├── C: Profile-Likelihood Change-Point                                  │
│    ├── D: Maximum Mutual Information                                       │
│    ├── Consensus = weighted median of 4 methods                            │
│    └── Sec 4.3: Bootstrap stability analysis (CV metric)                   │
│                                                                            │
│  Sec 5: COMBINED MULTI-FACTOR ANALYSIS                                     │
│    ├── Factor-pair logistic regression decision boundaries                 │
│    ├── Chi-square joint exceedance test                                    │
│    ├── Random Forest LOO-CV + permutation importance                       │
│    └── SHAP or partial dependence analysis                                 │
│                                                                            │
│  Sec 6: RESULTS SUMMARY & MASTER THRESHOLD TABLE                          │
│    ├── Master table: all thresholds + CIs + AUC + agreement               │
│    └── Per-event diagnosis: all 4 method thresholds per year               │
│                                                                            │
│  Sec 7: 24-MONTH SARIMA FORECAST + MONTE CARLO                            │
│    ├── STL decomposition (monsoon seasonality confirmation)                │
│    ├── SARIMA(1,d,1)×(1,1,1,12) per forcing variable                      │
│    ├── Aggregate forecasts to horizon-period annual features               │
│    ├── RF prediction at 6/12/18/24 month horizons                          │
│    ├── Monte Carlo (n=2000) uncertainty propagation                        │
│    ├── Month-by-month risk timeline                                        │
│    └── Publication-quality 4-panel dashboard                               │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Section 0: Setup and Data Loading

### Libraries
numpy, pandas, xarray, matplotlib, seaborn, scipy.stats, scikit-learn (RF, LR, LOO, ROC, SHAP), statsmodels (STL, SARIMAX, ADF).

### Data Loading
- DSAS shoreline CSV parsed with Pandas
- Three NetCDF files opened with xarray, converted to monthly DataFrames
- Monsoon year assignment: April→Dec = Year N; Jan→Mar = Year N−1
- Storm thresholds: wave > 2.0 m, wind > 10 m/s

---

## 6. Section 1: DSAS Transect Classification

### 5-Class EPR-Based Labels

| Class | Condition | Interpretation |
|-------|-----------|----------------|
| eroded_high | EPR < −0.94 m/yr | Severe erosion (>2× uncertainty) |
| eroded_low | −0.94 ≤ EPR < −0.47 | Marginal erosion (1–2× uncertainty) |
| stable | −0.47 ≤ EPR ≤ +0.47 | Within measurement noise |
| accreted_low | +0.47 < EPR ≤ +0.94 | Marginal accretion |
| accreted_high | EPR > +0.94 | Significant accretion |

### Erosion Event Year Extraction
Peak erosion years extracted from `SCE_farthest_year` of eroding transects, with severity classification (high if year appears in `eroded_high` set).

---

## 7. Section 2: Monthly Forcing Feature Extraction

Coastal erosion is driven by **extreme events**, not average conditions. The aggregation follows Peaks-Over-Threshold (POT) logic: maxima, 90th percentiles, storm counts, and cumulative energy.

### Annual Feature Sets

| Domain | Features |
|--------|----------|
| Wind | wind_max_annual, wind_p90, wind_mean_annual, wind_stress_max, storm_days_wind_total, storm_months_wind, wind_std_max |
| Wave | Hm0_max_annual, Hm0_p90, Hm0_mean_annual, Tp_max_annual, cumwave_energy_annual, storm_days_wave_total, storm_months_wave, Hm0_std_max |
| Current | ucurr_max_annual, ucurr_p90, ucurr_mean_annual, cum_current_annual, ucurr_std_max |

---

## 8. Section 3: Erosion Event Labeling and Dataset Join

### Analysis Window
Only overlapping years (2010–2024) between DSAS and forcing records.

### Mann-Whitney U Test + Cliff's Delta
Each forcing feature is tested for significant difference between erosion and non-erosion year distributions. **Cliff's delta** provides a non-parametric effect size measure:

| |δ| Range | Interpretation |
|------------|----------------|
| < 0.147 | Negligible |
| 0.147–0.33 | Small |
| 0.33–0.474 | Medium |
| > 0.474 | Large |

Features with p < 0.05 proceed to threshold detection. If none reach significance, the top 5 by p-value are used.

---

## 9. Section 4: Multi-Method Ensemble Threshold Detection

### Why Not HMMs?
With only ~15 annual observations, HMM transition matrices are under-determined (4 free parameters from 14 transitions). The four selected methods directly optimize threshold location and uncertainty.

### Method A — ROC / Youden's J
- **Principle:** Maximize J = sensitivity + specificity – 1
- **Uncertainty:** 2 000 bootstrap replicates for 95% CI
- **Significance:** 5 000 permutation test for exact p-value on AUC

### Method B — Bayesian Logistic Inflection
- **Principle:** Find X where P(erosion|X) = 0.5 via balanced logistic regression
- **Uncertainty:** 2 000 bootstrap replicates
- **Output:** Inflection point in original feature units

### Method C — Profile-Likelihood Change-Point
- **Principle:** Maximize log-likelihood ratio across all candidate split points
- **CI:** Profile-likelihood interval (LR_stat drop of 1.92)
- **Strength:** Distribution-free, well-suited for small N

### Method D — Maximum Mutual Information
- **Principle:** Maximize Shannon I(X_binary; Y) over binary splits
- **Uncertainty:** 2 000 bootstrap replicates
- **Strength:** Non-parametric, information-theoretic

### Consensus Threshold
Weighted median of all four method thresholds, with method-specific quality weights (AUC for Method A, LR_stat for C, MI for D). Agreement rate measures the fraction of methods within 10% of the consensus.

### Section 4.3 — Threshold Stability Analysis
Bootstrap cross-validation (n = 500) re-runs the full 4-method ensemble on resampled data. The coefficient of variation (CV) quantifies stability:
- **CV < 0.10:** Highly stable threshold
- **CV > 0.15:** Caution warranted

---

## 10. Section 5: Combined Multi-Factor Threshold Analysis

### Factor-Pair Logistic Regression
Two-feature logistic regression with decision boundary visualization showing the 50% erosion probability contour in 2D feature space.

### Chi-Square Joint Exceedance
Test whether simultaneous threshold exceedance of two factors is statistically associated with erosion beyond what individual exceedance would predict.

### Random Forest + Permutation Importance
- **LOO cross-validation** for unbiased performance estimate (F1, accuracy)
- **Gini vs. permutation importance** comparison to guard against correlated-feature bias
- **SHAP analysis** (or partial dependence fallback) for nonlinear interaction effects

### Three-Factor Combined Threshold Statement
Identifies the top-3 features by RF importance and reports their individual low/high erosion thresholds. When all three simultaneously exceed thresholds, compound erosion risk is maximum.

---

## 11. Section 6: Results Summary and Master Threshold Table

### Master Table Columns
| Column | Description |
|--------|-------------|
| Factor_combination | Single factor / Factor pair / All three |
| Variable | Feature name(s) |
| Method | 4-method ensemble consensus / LR boundary / RF+SHAP |
| Threshold_consensus | Weighted median of 4 methods |
| Threshold_low_erosion | Any-severity onset threshold |
| Threshold_high_erosion | High-severity onset threshold |
| CI_95_lower/upper | 95% bootstrap confidence interval |
| AUC | Area under ROC curve |
| Perm_p | Permutation-based exact p-value |
| Agreement | Fraction of methods within 10% of consensus |
| Percentile_rank | Where threshold falls in historical distribution |

### Enhanced Per-Event Diagnosis
For each erosion year, reports:
- Which features exceeded the consensus threshold
- Which of the 4 individual method thresholds were exceeded per feature
- Confidence level (HIGH: ≥3 methods, MODERATE: 2, LOW: 1, NONE: 0)
- Compound score: total method exceedances / maximum possible

---

## 12. Section 7: Advanced 24-Month Forecast with Actual Predictions

This section has been significantly enhanced to produce **actual shoreline retreat predictions in meters**, validated against historical data, with per-transect vulnerability mapping and operational skill metrics.

### 7.0 Forecast Base Date & Horizons (Cell 34)
Establishes the last available data point and four forecast horizons (H6, H12, H18, H24).

### 7.1 STL Decomposition (Cell 35)
Confirms annual monsoon seasonality (period=12) for all forcing variables using Seasonal-Trend decomposition using LOESS (robust mode).

### 7.2 SARIMA Model Selection — AIC Grid Search + Diagnostics (Cell 36)
**Major enhancement over fixed-order SARIMA:**

- **Grid search:** Tests 27 candidate SARIMA orders per variable: (p,d,q) ∈ {0,1,2}³ × seasonal orders {(1,1,1,12), (0,1,1,12), (1,1,0,12)}
- **d** chosen automatically via ADF test (d=0 if stationary at p<0.05)
- Best model selected by minimum AIC with BIC cross-check
- **Diagnostics reported per variable:**
  - Ljung-Box(12) residual autocorrelation test
  - Out-of-sample RMSE, MAE, and MAPE (last 24 months held out)
  - Summary table saved to `./outputs/sarima_model_diagnostics.csv`

### 7.3 Forecast Visualization (Cell 37)
3×2 subplot of all 6 SARIMA forecasts with 95% confidence bands and horizon markers.

### 7.3a Hindcast Validation — Temporal Cross-Validation (Cells 38–39)
**New section — proves the forecast system works on known data before trusting future predictions.**

For each known erosion year in the historical record:
1. Retrain all SARIMA models using only data available **12 months before** the event
2. Forecast 24 months ahead
3. Aggregate to annual features via `sarima_to_annual` mapping
4. Run through the trained RF model for erosion probability
5. Apply decision threshold (p ≥ 0.5) and compare to actual outcome

**Operational skill metrics:**
| Metric | Description |
|--------|-------------|
| **POD** (Probability of Detection) | Fraction of actual erosion years correctly predicted |
| **FAR** (False Alarm Ratio) | Fraction of erosion predictions that were false alarms |
| **CSI** (Critical Success Index) | Hits / (Hits + Misses + False Alarms) |
| **Accuracy** | Overall fraction correct |

Outputs: Hindcast probability timeline plot, confusion matrix heatmap, saved to `./outputs/hindcast_validation.csv`.

### 7.4 Aggregate to Horizon Features (Cell 40)
Maps SARIMA monthly forecasts to annual features:

| SARIMA Variable | Aggregation | Annual Feature |
|-----------------|-------------|----------------|
| WindMax | max | wind_max_annual |
| WindMax | P90 | wind_p90 |
| Hm0_max | max | Hm0_max_annual |
| Hm0_max | P90 | Hm0_p90 |
| UcurrMax | max | ucurr_max_annual |
| UcurrMax | P90 | ucurr_p90 |
| CumWaveEnergy | sum | cumwave_energy_annual |
| StormDays_wave | sum | storm_days_wave_total |
| StormDays_wind | sum | storm_days_wind_total |

### 7.5 RF Erosion Probability (Cell 41)
Random Forest predict_proba at each horizon with threshold exceedance checks and severity classification.

### 7.6 Monte Carlo Uncertainty Propagation (Cell 42)
n=2000 simulations with correct `sarima_to_annual` mapping. Produces probability distributions at each horizon with 95% CI and risk categories (LOW/MODERATE/HIGH).

### 7.6a Actual Shoreline Retreat Predictions in Meters (Cells 43–44)
**New section — translates abstract probabilities into actionable physical predictions.**

**Method:** Weighted expected value using DSAS EPR statistics:

$$E[\text{retreat}] = P(\text{erosion}) \times \bar{EPR}_{erosion} + (1 - P(\text{erosion})) \times \bar{EPR}_{stable}$$

For each horizon, produces:
- **Expected EPR** (m/yr): weighted combination of eroding/stable transect rates
- **Expected cumulative retreat** (m): EPR × years ahead
- **95% prediction interval**: propagates both MC probability uncertainty and EPR variability
- **Action level**: IMMEDIATE ACTION (p>0.7), ENHANCED MONITORING (p>0.5), ROUTINE MONITORING (p>0.3), STANDARD OPERATIONS
- **Driver analysis**: identifies which forcing variables exceed thresholds at each horizon

Saved to `./outputs/retreat_predictions.csv`.

### 7.6b Per-Transect Vulnerability Scoring (Cell 45)
**New section — spatial risk assessment at transect level.**

Combines historical erosion severity (EPR vulnerability index) with forecast erosion probability:

$$\text{Risk}_{transect,horizon} = \text{Vulnerability}_{hist} \times P(\text{erosion})_{horizon}$$

- 5-tier risk categories: Very Low / Low / Moderate / High / Very High
- Identifies top-10 most vulnerable transects per horizon
- Distribution summary of transect risk categories
- Spatial vulnerability plot per horizon
- Saved to `./outputs/transect_vulnerability_scores.csv`

### 7.6c Forecast Skill vs Climatology Baseline (Cell 46)
**New section — proves the forecast adds value beyond naive prediction.**

- **Brier Skill Score (BSS)**: BSS = 1 − BS_forecast / BS_climatology
  - BSS > 0 means forecast is better than always predicting the historical base rate
- **Reliability diagram**: compares binned predicted probabilities against observed frequencies
- **Hindcast AUC**: ROC AUC on temporal cross-validation results
- Skill comparison visualization with Brier Score decomposition

### 7.7 Month-by-Month Risk Timeline (Cell 47)
Each month evaluated against individual thresholds. Risk score = number of factors exceeding thresholds (0–3, mapped to Stable/Watch/Warning/Alert).

### 7.8 Advanced 6-Panel Dashboard (Cell 48)
**Enhanced from 4-panel to 6-panel publication figure:**

| Panel | Content |
|-------|---------|
| 1 (top-left) | Erosion probability bar chart with MC 95% CI |
| 2 (top-right) | **Actual retreat predictions in meters** with uncertainty ranges |
| 3 (mid-left) | Monthly risk score heatmap (24-month timeline) |
| 4 (mid-right) | Wave + wind forecasts with erosion threshold lines |
| 5 (bottom-left) | **Per-transect vulnerability map** (H12 horizon) |
| 6 (bottom-right) | **Actionable prediction summary table** with dates, probabilities, retreat meters, risk class, and recommended action |

Saved to `./figures/forecast_dashboard_advanced.png`.

### 7.9 Comprehensive Output Save (Cell 49)
Saves all outputs with a clear summary of every file produced, plus a final **Prediction Summary** that prints the actual forecast values for each horizon in an easy-to-read format.

---

## 13. Key Findings and Conclusions

### Methodological Advances
1. **Four-method ensemble** provides more robust thresholds than any single method
2. **Cliff's delta** effect sizes quantify practical significance alongside statistical significance
3. **Threshold stability analysis** confirms robustness under resampling
4. **AIC grid search** selects optimal SARIMA order per variable (27 candidates)
5. **Hindcast validation** proves forecast skill on known erosion events before trusting predictions
6. **Actual retreat predictions** in physical units (meters) bridge the gap to coastal management
7. **Per-transect vulnerability** enables spatial targeting of protective measures
8. **Brier Skill Score** demonstrates forecast value over climatological baseline

### Outputs Generated
| File | Content |
|------|---------|
| `./outputs/multi_method_thresholds.csv` | Per-feature 4-method threshold summary |
| `./outputs/erosion_thresholds_master.csv` | Complete master threshold table |
| `./outputs/erosion_event_diagnosis.csv` | Per-year multi-method diagnosis |
| `./outputs/sarima_model_diagnostics.csv` | AIC grid search results + residual tests |
| `./outputs/hindcast_validation.csv` | Temporal cross-validation results (POD, FAR, CSI) |
| `./outputs/erosion_forecast_horizons.csv` | MC probability at 4 horizons |
| `./outputs/erosion_forecast_monthly.csv` | Month-by-month risk timeline |
| `./outputs/erosion_forecast_features.csv` | Aggregated forecast features + risk |
| `./outputs/retreat_predictions.csv` | **Actual shoreline retreat in meters** |
| `./outputs/transect_vulnerability_scores.csv` | **Per-transect risk scores** |
| `./figures/` | All publication-quality plots |

### Notebook Structure (49 cells)
| Cells | Section | Content |
|-------|---------|---------|
| 1–4 | Section 0 | Setup, imports, data loading |
| 5–8 | Section 1 | DSAS classification, spatial plots, erosion years |
| 9–14 | Section 2 | Wind/wave/current feature extraction, merge, time series |
| 15–18 | Section 3 | Labels, Mann-Whitney + Cliff's delta, box plots |
| 19–23 | Section 4 | 4-method ensemble, forest/ROC plots, stability analysis |
| 24–29 | Section 5 | Pair LR, chi-square, RF+SHAP, combined thresholds |
| 30–32 | Section 6 | Master table, enhanced per-event diagnosis |
| 33–49 | Section 7 | Advanced forecast with actual predictions (see details above) |

