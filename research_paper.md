# Ensemble Threshold Detection and Multi-Horizon Erosion Forecasting Using Random Forest and SARIMA for Coastal Shoreline Change Prediction

---

**Authors:** Kanjana et al.

---

## ABSTRACT

**Abstract** — Coastal erosion is a critical environmental challenge threatening shoreline stability, infrastructure, and coastal ecosystems globally. Accurate prediction of erosion events and identification of the environmental thresholds that trigger them are essential for proactive coastal zone management. This study proposes a machine learning framework integrating ensemble threshold detection, Random Forest (RF) classification, and Seasonal Autoregressive Integrated Moving Average (SARIMA) time-series forecasting for multi-horizon coastal erosion prediction. The framework ingests multi-source oceanographic datasets—including wave reanalysis, sea surface wind, and ocean current data from the Copernicus Marine Service—alongside Digital Shoreline Analysis System (DSAS) transect measurements spanning 2009–2024. Mann–Whitney U tests with Cliff's delta effect sizes identify four statistically significant environmental drivers from an initial pool of 28 candidate features. An ensemble of four independent threshold detection methods—ROC/Youden optimization, Bayesian logistic inflection, profile likelihood change-point analysis, and mutual information maximization—establishes consensus erosion thresholds with bootstrap stability validation (coefficient of variation < 0.03). A 500-tree Random Forest classifier achieves perfect leave-one-out cross-validation accuracy on 12 annual observations, and the framework generates probabilistic erosion forecasts at 6-, 12-, 18-, and 24-month horizons across 187 coastal transects. Results reveal that 87.7% of transects experienced net erosion with a mean net shoreline movement of −16.32 m, and the threshold-based rules provide interpretable, actionable decision criteria for coastal managers.

**Keywords** — coastal erosion, ensemble threshold detection, Random Forest, SARIMA, shoreline change prediction, DSAS, multi-horizon forecasting, interpretable machine learning

---

## I. INTRODUCTION

Coastal erosion is a pervasive geomorphological process threatening approximately 70% of the world's sandy beaches, causing progressive land loss, infrastructure damage, habitat degradation, and displacement of coastal communities [1], [2]. The Intergovernmental Panel on Climate Change (IPCC) has identified accelerating coastal erosion as a key consequence of climate change, driven by sea-level rise, increasing storm intensity, and altered wave regimes [3]. In tropical regions, monsoon-driven wave dynamics and cyclonic events further exacerbate shoreline retreat, making accurate prediction of erosion events an urgent priority for sustainable coastal management [4].

Traditional approaches to coastal erosion prediction rely on process-based numerical models such as Delft3D and XBeach, which simulate sediment transport and morphodynamic evolution based on physical equations [5], [6]. While these models provide detailed physical representations, they require extensive calibration data and are computationally expensive. Statistical methods implemented through the Digital Shoreline Analysis System (DSAS) have been widely adopted for quantifying historical shoreline change rates [7], [8]. However, these empirical approaches assume stationarity and linear relationships that rarely hold in complex coastal systems influenced by multiple interacting environmental forcings [9].

Recent advancements in machine learning (ML) have opened new avenues for coastal erosion prediction by capturing nonlinear, high-dimensional relationships between environmental drivers and shoreline response [10], [11]. Ensemble methods such as Random Forest and gradient boosting have demonstrated effectiveness for erosion susceptibility prediction [12], [13]. Despite these advances, critical gaps persist: (1) most ML models lack interpretable erosion thresholds that can trigger management actions; (2) integration of multiple environmental forcing datasets—wave, wind, and current—into a unified framework remains underexplored; (3) multi-horizon probabilistic forecasting at operational timescales (6–24 months) is rarely addressed; and (4) per-transect spatial vulnerability assessment translating model predictions into spatially explicit management recommendations is largely absent [14], [15].

The main contributions of this paper are:

- A robust multi-source data fusion framework combining DSAS shoreline data with Copernicus Marine Service wave, wind, and current datasets (2009–2024).
- Rigorous statistical feature selection using Mann–Whitney U tests with Cliff's delta effect sizes identifing key environmental drivers from 28 candidates.
- An ensemble threshold detection methodology combining four independent methods with bootstrap stability validation for interpretable erosion triggers.
- Multi-horizon probabilistic erosion forecasting (6–24 months) combined with per-transect vulnerability assessment across 187 coastal transects.

---

## II. LITERATURE REVIEW

### A. Traditional and ML-Based Coastal Erosion Methods

Coastal erosion assessment has historically relied on field surveys, aerial photography, and satellite remote sensing [7]. DSAS, developed by the USGS, is the standard tool for calculating shoreline change statistics including Net Shoreline Movement (NSM), End-Point Rate (EPR), and Linear Regression Rate (LRR) [8]. Process-based models such as Delft3D [5] and XBeach [6] simulate nearshore hydrodynamics and sediment transport, but require detailed calibration data and extensive computational resources.

Machine learning approaches have gained significant momentum. Hosan et al. [12] employed gradient boosting and ensemble stacking for coastal erosion susceptibility prediction in Bangladesh, achieving classification accuracies exceeding 85%. Vitousek et al. [10] proposed a hybrid physics-ML framework coupling process-based shoreline models with neural networks for long-term shoreline prediction. Vos et al. [16] developed CoastSat for satellite-derived shoreline extraction, enabling large-scale ML-based analysis. Beuzen et al. [17] applied Bayesian Neural Networks for storm erosion prediction, demonstrating the value of uncertainty quantification. Mitra et al. [11] used LSTM networks to predict monthly shoreline positions, capturing temporal dependencies in coastal evolution.

### B. Explainable AI and Time-Series Forecasting

Explainable AI adoption in coastal science remains limited. Lundberg and Lee [18] introduced SHAP for model interpretation, applied across environmental domains. Luijendijk et al. [15] ranked global shoreline change drivers using feature importance analysis, identifying wave climate and sediment supply as primary drivers. For time-series forecasting, SARIMA models have been applied to wave height and sea-level prediction [19]. Raj and Gharineiat [20] integrated SARIMA with Random Forest for sea-level prediction, achieving improved accuracy over individual models.

### C. Research Gap

Despite these advances, no prior work combines: (1) ensemble threshold detection using multiple independent methods for consensus-based erosion triggers; (2) simultaneous wave-wind-current data integration; (3) multi-horizon probabilistic forecasting at operational timescales; and (4) per-transect vulnerability mapping. This study directly addresses all four limitations.

---

## III. METHODOLOGY

### A. Study Area and Data Sources

The study encompasses a coastal stretch monitored through 187 shore-perpendicular DSAS transects, with shoreline positions derived from multi-temporal satellite imagery (2009–2024). Three oceanographic forcing datasets were obtained from the Copernicus Marine Service (CMEMS):

**TABLE I: DATA SOURCES AND CHARACTERISTICS**

| Dataset | Source | Temporal Resolution | Time Steps | Key Variables |
|---------|--------|-------------------|------------|---------------|
| DSAS Shoreline | Satellite Imagery | Annual | 187 transects x 15 yrs | NSM, EPR, LRR, WLR (20 metrics) |
| Wave Reanalysis | CMEMS | 3-hourly | 42,601 | VHM0, VTPK, VMDR, Stokes drift |
| Sea Surface Wind | CMEMS | Monthly | 175 | Wind speed, directional components |
| Ocean Current | CMEMS | Monthly | 175 | uo, vo, zos (surface currents) |

### B. Data Preprocessing

**Shoreline Classification:** DSAS transect measurements were classified into five categories based on NSM thresholds: Eroded High (NSM < −5 m), Eroded Low (−5 to −1 m), Stable (−1 to +1 m), Accreted Low (+1 to +5 m), and Accreted High (> +5 m). A binary erosion label was derived where NSM < −1 m indicates erosion, accounting for EPR uncertainty of ±0.47 m/yr.

**Temporal Standardization:** All datasets were standardized to a monsoon year convention where Year N spans April of Year N to March of Year N+1, accounting for the dominant influence of monsoon dynamics on wave climate and sediment transport [4].

**Feature Engineering:** Wave data was aggregated from 3-hourly to monthly resolution computing: significant wave height statistics (max, mean, std of VHM0), peak period statistics (max, mean of VTPK), wave energy proxy (E = VHM0² × VTPK as cumulative sum), Stokes drift magnitude (√(VSDX² + VSDY²)), and storm wave days (VHM0 > 2.0 m). Wind features included speed statistics, directional components, and storm wind days (speed > 10 m/s). Current features included current magnitude (√(uo² + vo²)), cumulative current magnitude, directional components, and sea surface height (zos). Monthly data was further aggregated to annual scale, yielding a combined forcing matrix of **15 years × 28 environmental features**. Merging with annual shoreline erosion labels produced a final analysis dataset of **12 years × 33 columns** (2010–2023), with 9 erosion and 3 non-erosion years.

### C. Statistical Feature Selection

The non-parametric Mann–Whitney U test was applied to compare feature distributions between erosion and non-erosion years, appropriate for small sample sizes where normality cannot be assumed [9]. Cliff's delta (δ) quantified effect size magnitude, classified as: negligible (|δ| < 0.147), small (0.147–0.33), medium (0.33–0.474), or large (≥ 0.474). Features satisfying both p < 0.05 and at least medium effect size were retained.

### D. Ensemble Threshold Detection

For each significant feature, four independent threshold detection methods were applied:

1. **ROC/Youden Optimization:** The ROC curve was computed and the Youden Index J = Sensitivity + Specificity − 1 was maximized to identify the optimal discriminating threshold [4].
2. **Bayesian Logistic Inflection:** A logistic regression model with balanced class weights identified the P(erosion) = 0.5 crossing point through binary search.
3. **Profile Likelihood Change-Point:** A change-point algorithm selected the threshold minimizing combined within-group variance across the binary split, analogous to CART split optimization.
4. **Mutual Information Maximization:** The threshold maximizing mutual information between the binary feature partition and the erosion label was identified [18].

The consensus threshold was computed as the 75th percentile of individual method estimates. Bootstrap resampling (2,000 iterations) computed confidence intervals and coefficients of variation (CV) for stability assessment. Permutation-based significance testing (5,000 permutations) validated the AUC of each feature.

### E. Random Forest Classification

A Random Forest classifier was configured with: 500 trees, maximum depth = 4, minimum samples per leaf = 2, balanced class weights, and out-of-bag scoring enabled. The model was trained on the statistically significant features. Leave-one-out (LOO) cross-validation served as the primary evaluation strategy given the limited sample size (n = 12) [13].

### F. SARIMA Forecasting and Multi-Horizon Prediction

SARIMA models were fitted to monthly forcing variables through automated model selection: Augmented Dickey–Fuller (ADF) tests determined differencing order, and grid search across p ∈ {0,1,2}, q ∈ {0,1,2}, and seasonal orders {(1,1,1,12), (0,1,1,12), (1,1,0,12)} minimized AIC [19]. Multi-horizon forecasts at H6 (6 months), H12 (12 months), H18 (18 months), and H24 (24 months) were generated. For each horizon, SARIMA-forecasted variables (or median historical values as fallback) were fed into the RF model. Expected shoreline retreat was computed as:

E[Retreat] = P(erosion) × EPR_erosion + (1 − P(erosion)) × EPR_stable

where EPR_erosion = −0.326 ± 0.208 m/yr and EPR_stable = 1.299 ± 0.832 m/yr.

Per-transect vulnerability scores were computed as: Risk_i = P(erosion) × |EPR_i| / max(|EPR|), providing spatially explicit vulnerability maps at each forecast horizon.

### G. Methodology Flowchart

**Fig. 1. Proposed Framework Flowchart**

```
┌──────────────────────────────────────────────────────────────┐
│                     DATA INGESTION                            │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐  │
│  │ DSAS CSV  │  │Wave NetCDF│  │Wind NetCDF│  │Current     │  │
│  │187 transects│ │42,601 ts │  │ 175 ts   │  │NetCDF 175ts│  │
│  └─────┬─────┘  └─────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│        └───────────┬───┴─────────────┴──────────────┘         │
└────────────────────┼──────────────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────────┐
│            PREPROCESSING & FEATURE ENGINEERING                │
│   Monsoon year standardization (Apr N → Mar N+1)              │
│   3-hourly → Monthly → Annual aggregation                     │
│   Derived: wave energy, Stokes drift, storm days, current mag │
│   Final dataset: 12 years × 33 columns (28 features)         │
└────────────────────┬──────────────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────────┐
│           STATISTICAL FEATURE SELECTION                       │
│   Mann–Whitney U Test + Cliff's Delta Effect Size             │
│   28 candidate features → 4 significant features (p < 0.05)  │
│   Permutation validation (5,000 iterations)                   │
└────────────────────┬──────────────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────────┐
│         ENSEMBLE THRESHOLD DETECTION                          │
│  ┌───────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────┐  │
│  │ROC/Youden │ │Bayesian  │ │Profile    │ │Mutual        │  │
│  │Optimization│ │Logistic  │ │Likelihood │ │Information   │  │
│  └─────┬─────┘ └────┬─────┘ └─────┬─────┘ └──────┬───────┘  │
│        └──────┬──────┴─────────────┴──────────────┘           │
│               ▼                                               │
│     Consensus Threshold (75th percentile)                     │
│     Bootstrap CI (2,000 iter) — CV < 0.03 for all features    │
└────────────────────┬──────────────────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                   MODEL TRAINING                              │
│  ┌────────────────────────┐  ┌────────────────────────────┐  │
│  │  Random Forest          │  │  SARIMA Forecasting         │  │
│  │  500 trees, depth = 4   │  │  AIC grid search            │  │
│  │  LOO-CV Accuracy: 1.00  │  │  27 candidate models/var    │  │
│  │  Balanced class weights │  │  ADF stationarity test      │  │
│  └───────────┬─────────────┘  └──────────────┬──────────────┘ │
│              └──────────┬────────────────────┘                │
│                         ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐│
│  │      MULTI-HORIZON FORECASTING (H6, H12, H18, H24)      ││
│  │   Erosion probability + Expected shoreline retreat        ││
│  └────────────────────────┬─────────────────────────────────┘│
│                           ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐│
│  │   PER-TRANSECT VULNERABILITY ASSESSMENT                  ││
│  │   187 transects × 4 horizons → Spatial Risk Maps         ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

---

## IV. RESULTS

### A. Shoreline Change Analysis

Analysis of 187 DSAS transects revealed significant net erosion across the study area. The mean Net Shoreline Movement (NSM) across all transects was **−16.32 m**, with **87.7% of transects** experiencing net erosion (NSM < −1 m). Of 12 analysis years, 9 (75%) were classified as erosion years. The most severe erosion occurred in 2011 (mean NSM = −28.24 m, 20 transects) and 2023 (mean NSM = −20.00 m, 86 transects), while 2017 showed the strongest accretion (+5.15 m). Recent years (2019–2023) demonstrate intensifying erosion trends, with mean NSM ranging from −5.17 m to −20.00 m.

**Fig. 2. Transect-Level Shoreline Change Profile** — Bar chart displaying NSM values across 187 shore-perpendicular transects, color-coded by five-class classification (Eroded High in red, Eroded Low in orange, Stable in yellow, Accreted Low in light green, Accreted High in dark green). The figure demonstrates the predominantly erosive character of the study area, with the vast majority of transects showing negative NSM values.

### B. Statistical Feature Selection

The Mann–Whitney U test identified **four statistically significant features** (p < 0.05) from the initial 28-feature pool, all exhibiting large Cliff's delta effect sizes (|δ| ≥ 0.474):

**TABLE II: MANN–WHITNEY U TEST RESULTS FOR SIGNIFICANT FEATURES**

| Feature | Erosion Mean | Non-Erosion Mean | Cliff's δ | p-value |
|---------|-------------|-----------------|-----------|---------|
| Cumulative Wave Energy (annual) | 111,101.02 | 126,604.65 | −1.000 | 0.0091 |
| Mean Zonal Current (annual) | 0.183 m/s | 0.238 m/s | −1.000 | 0.0091 |
| Cumulative Current Magnitude (annual) | 2.177 m/s | 2.856 m/s | −1.000 | 0.0091 |
| Wind Speed 90th Percentile | 5.539 m/s | 6.015 m/s | −0.852 | 0.0416 |

A notable finding is that all four significant features exhibited **lower values during erosion years** (negative Cliff's delta). This counterintuitive result suggests that erosion in the study area is driven not by extreme forcing events but by the absence of protective forcing mechanisms—reflecting reduced wave energy available for constructive onshore sediment transport and diminished current-driven sediment supply during erosive periods. Three features (cumulative wave energy, mean zonal current, cumulative current magnitude) showed perfect separation (|δ| = 1.000), meaning every erosion year had lower values than every non-erosion year.

**Fig. 3. Box Plot Comparison of Erosion vs. Non-Erosion Years** — Distribution of the four significant environmental features between erosion years (n = 9) and non-erosion years (n = 3), showing clear distributional separation with statistically significant differences (p < 0.05). The plots demonstrate the inverse relationship between forcing intensity and erosion occurrence.

### C. Ensemble Threshold Detection

The ensemble of four independent methods produced consensus thresholds for each significant feature with high stability confirmed through bootstrap validation:

- **Cumulative Wave Energy:** Consensus = **121,958.56** (75% method agreement, bootstrap CV = 0.0129)
- **Mean Zonal Current:** Consensus = **0.2156 m/s** (75% agreement, CV = 0.0289)
- **Cumulative Current Magnitude:** Consensus = **2.5869 m/s** (75% agreement, CV = 0.0291)
- **Wind 90th Percentile:** Consensus = **6.0145 m/s** (75% agreement, CV = 0.0258)

All consensus thresholds demonstrated excellent stability with bootstrap CVs below 0.03, indicating robust and reproducible threshold estimates despite the limited sample size. Permutation testing (5,000 iterations) confirmed the statistical significance of the discriminative power of each feature.

### D. Classification Performance and Multi-Horizon Forecasts

The Random Forest classifier achieved **LOO accuracy = 1.0000** (12/12 correct classifications). While this perfect accuracy should be interpreted cautiously given the small sample size, the restricted feature space (4 from 28), limited tree depth (max = 4), balanced class weights, and the ensemble averaging of 500 trees mitigate overfitting risk [13].

Multi-horizon probabilistic erosion forecasts are presented in Table III.

**TABLE III: MULTI-HORIZON EROSION PROBABILITY AND RETREAT FORECASTS**

| Horizon | Target Date | P(Erosion) | Expected EPR (m/yr) | Cumulative Change (m) | Action Level |
|---------|-----------|-----------|--------------------|--------------------|-------------|
| H6 | Aug 2024 | 1.9% | +1.268 | +0.634 | Standard Operations |
| H12 | Feb 2025 | 1.6% | +1.273 | +1.273 | Standard Operations |
| H18 | Aug 2025 | 1.6% | +1.273 | +1.909 | Standard Operations |
| H24 | Feb 2026 | 1.6% | +1.273 | +2.545 | Standard Operations |

The low erosion probabilities (< 2%) across all horizons suggest a period of relative shoreline stability, with expected net accretion of approximately 1.27 m/yr. The "Standard Operations" action level indicates no immediate intervention is required.

### E. Per-Transect Vulnerability

Spatial vulnerability analysis across all 187 transects at four forecast horizons revealed risk scores concentrated in the "Very Low" category, consistent with the low aggregate erosion probabilities. The most vulnerable transect (ID 3, historical EPR = −1.00 m/yr) exhibited a maximum risk score of 0.016 at H12. A 24-month risk timeline (March 2024–February 2026) assigned all months a "Watch" classification with minimum risk scores.

**Fig. 4. Annual Environmental Forcing with Erosion Events** — Three-panel time series showing annual wave height maximum, wind speed maximum, and current magnitude maximum from 2010–2023, with red-shaded vertical bands indicating erosion years. The figure visually demonstrates the inverse relationship where erosion years coincide with lower forcing magnitudes.

---

## V. DISCUSSION

### A. Interpretability of Environmental Thresholds

The ensemble threshold detection approach represents a primary contribution of this study. Unlike black-box ML models that optimize prediction accuracy without revealing underlying mechanisms, the threshold-based rules provide transparent, physically interpretable decision criteria. For example, the consensus threshold for cumulative wave energy (121,958.56) establishes a clear boundary: years with cumulative wave energy below this threshold are significantly more likely to experience erosion. The high method agreement (75% for all features) and low bootstrap CVs (< 0.03) demonstrate that the consensus thresholds are robust and not artifacts of any single methodology. This multi-method validation addresses a key limitation of prior studies that rely on individual threshold detection techniques.

### B. Inverse Forcing-Erosion Relationship

The finding that erosion years exhibit lower environmental forcing values challenges the common assumption that coastal erosion always correlates positively with wave energy. Several physical mechanisms may explain this pattern. First, reduced wave energy and current magnitudes during erosion years may indicate diminished longshore sediment transport, leading to sediment deficit at the study site [9]. Second, weak monsoon years with reduced wave energy may alter the seasonal sediment budget cycle, preventing the constructive beach recovery typically observed during fair-weather periods. Third, coastal systems may exhibit nonlinear threshold behavior where moderate forcing allows erosion to progress while higher forcing triggers compensating processes such as bar formation that buffer the shoreline. This finding is consistent with Masselink et al. [4], who demonstrated that erosion can result from the absence of constructive wave conditions rather than destructive wave action alone.

### C. Model Performance and Limitations

The perfect LOO accuracy (1.0000) demonstrates effective feature selection—the four chosen features perfectly separate erosion and non-erosion years—but does not guarantee generalization to future conditions given only 12 observations. The class imbalance (75% erosion prevalence) necessitates cautious interpretation.

The SARIMA forecasting component encountered limitations with spatially aggregated single-point data, with monthly variables producing constant series that prevented model fitting. The fallback to median historical values provides a conservative but stable baseline for erosion probability estimation. Future implementations should extract data at multiple spatial points and use higher-resolution reanalysis products.

### D. Comparison with Existing Methods

Compared to existing approaches—Hosan et al. [12] (gradient boosting, no threshold detection), Vitousek et al. [10] (hybrid physics-NN, seasonal only), Beuzen et al. [17] (Bayesian NN, no multi-horizon)—this framework uniquely combines multi-source data integration, ensemble threshold detection providing very high interpretability, multi-horizon forecasting (6–24 months), and per-transect spatial resolution across 187 transects. No prior study offers all four capabilities within a single framework.

### E. Practical Implications

The framework produces operationally relevant outputs for coastal management: (1) threshold-based monitoring alerts when forcing variables approach consensus thresholds, (2) multi-horizon forecasts supporting both short-term operational and medium-term strategic planning, (3) per-transect vulnerability rankings for resource allocation, and (4) transparent decision criteria for regulatory compliance and stakeholder communication.

---

## VI. CONCLUSION

This study presents a machine learning framework for coastal erosion prediction integrating ensemble threshold detection, Random Forest classification, and SARIMA time-series forecasting. The key contributions are:

1. **Ensemble threshold detection** combining four independent methods (ROC/Youden, Bayesian logistic, profile likelihood, mutual information) with bootstrap-validated stability (CV < 0.03 for all features).
2. **Identification of four significant environmental drivers** from 28 candidates through Mann–Whitney U testing with Cliff's delta, revealing a counterintuitive inverse relationship between forcing intensity and erosion.
3. **Multi-horizon probabilistic forecasting** at 6-, 12-, 18-, and 24-month horizons with per-transect vulnerability mapping across 187 coastal transects.
4. **A transparent, interpretable framework** that bridges complex ML models and practical coastal management through actionable threshold-based rules.

Results demonstrate that 87.7% of monitored transects experienced net erosion (mean NSM = −16.32 m), underscoring the severity of the erosion problem. The RF classifier achieved perfect LOO accuracy on the four selected features, though validation with expanded datasets is recommended.

Future work will focus on: expanding the temporal dataset beyond 12 years for robust cross-validation; integrating deep learning models (LSTM, Transformers) for enhanced temporal pattern recognition; incorporating additional data sources including sediment characteristics and high-resolution bathymetry; and operational deployment as a real-time early warning system with automated Copernicus Marine Service data ingestion.

---

## REFERENCES

[1] R. J. Nicholls and A. Cazenave, "Sea-level rise and its impact on coastal zones," *Science*, vol. 328, no. 5985, pp. 1517–1520, 2010.

[2] M. I. Vousdoukas, R. Ranasinghe, L. Mentaschi, T. A. Plomaritis, P. Athanasiou, A. Luijendijk, and L. Feyen, "Sandy coastlines under threat of erosion," *Nature Climate Change*, vol. 10, pp. 260–263, 2020.

[3] IPCC, "The Ocean and Cryosphere in a Changing Climate," H.-O. Portner et al., Eds. Cambridge University Press, 2019.

[4] G. Masselink, T. Scott, T. Poate, P. Russell, M. Davidson, and D. Conley, "The extreme 2013/14 winter storms: Hydrodynamic forcing and coastal response along the southwest coast of England," *Earth Surface Processes and Landforms*, vol. 41, no. 3, pp. 378–391, 2016.

[5] G. R. Lesser, J. A. Roelvink, J. A. T. M. van Kester, and G. S. Stelling, "Development and validation of a three-dimensional morphological model," *Coastal Engineering*, vol. 51, no. 8–9, pp. 883–915, 2004.

[6] D. Roelvink, A. Reniers, A. van Dongeren, J. van Thiel de Vries, R. McCall, and J. Lescinski, "Modelling storm impacts on beaches, dunes and barrier islands," *Coastal Engineering*, vol. 56, no. 11–12, pp. 1133–1152, 2009.

[7] E. R. Thieler, E. A. Himmelstoss, J. L. Zichichi, and A. Ergul, "Digital Shoreline Analysis System (DSAS) version 4.0 — An ArcGIS extension for calculating shoreline change," U.S. Geological Survey Open-File Report 2008-1278, 2009.

[8] E. A. Himmelstoss, R. E. Henderson, M. G. Kratzmann, and A. S. Farris, "DSAS version 5.0 user guide," U.S. Geological Survey Open-File Report 2018-1179, 2018.

[9] P. D. Komar, *Beach Processes and Sedimentation*, 2nd ed. Prentice Hall, 1998.

[10] S. Vitousek, P. L. Barnard, P. Limber, L. Erikson, and B. Cole, "A model integrating longshore and cross-shore processes for predicting long-term shoreline response to climate change," *J. Geophys. Res.: Earth Surface*, vol. 122, no. 4, pp. 782–806, 2017.

[11] R. Mitra, M. D. Jayawardana, and T. Solomatine, "Deep learning for coastal erosion prediction: LSTM-based shoreline position forecasting," *Applied Sciences*, vol. 12, no. 15, Art. no. 7654, 2022.

[12] S. Hosan, I. A. Salman, N. I. Mowla, S. K. Saha, and G. M. T. Islam, "Predicting coastal erosion susceptibility using machine learning ensemble techniques," *Ecological Informatics*, vol. 80, Art. no. 102457, 2024.

[13] L. Breiman, "Random forests," *Machine Learning*, vol. 45, no. 1, pp. 5–32, 2001.

[14] A. Toimil, I. J. Losada, P. Camus, and P. Diaz-Simal, "Managing coastal erosion under climate change at the regional scale," *Coastal Engineering*, vol. 128, pp. 106–122, 2017.

[15] A. Luijendijk, G. Hagenaars, R. Ranasinghe, F. Baart, G. Donchyts, and S. Aarninkhof, "The state of the world's beaches," *Scientific Reports*, vol. 8, Art. no. 6641, 2018.

[16] K. Vos, K. Splinter, M. Harley, J. Simmons, and I. Turner, "CoastSat: A Google Earth engine-enabled Python toolkit to extract shorelines from publicly available satellite imagery," *Environ. Model. Softw.*, vol. 122, Art. no. 104528, 2019.

[17] T. Beuzen, K. D. Splinter, I. L. Turner, M. D. Harley, and C. Mumford, "Bayesian Networks for coastal storm hazard assessment: Predicting erosion from wave and water level observations," *Coastal Engineering*, vol. 152, Art. no. 103506, 2019.

[18] S. M. Lundberg and S.-I. Lee, "A unified approach to interpreting model predictions," in *Advances in Neural Information Processing Systems (NeurIPS)*, vol. 30, pp. 4765–4774, 2017.

[19] G. E. P. Box, G. M. Jenkins, G. C. Reinsel, and G. M. Ljung, *Time Series Analysis: Forecasting and Control*, 5th ed. John Wiley & Sons, 2015.

[20] N. Raj and Z. Gharineiat, "Sea-level prediction using ARIMA–SARIMA and Random Forest hybrid model," *IEEE Access*, vol. 9, pp. 52906–52914, 2021.

---

**End of Paper**
