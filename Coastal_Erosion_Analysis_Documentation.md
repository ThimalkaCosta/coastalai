# Coastal Erosion Analysis: Threshold Detection and Pattern Recognition

## Complete Technical Documentation

**Project:** CoastalAI - Machine Learning for Coastal Erosion Prediction  
**Date:** January 2026  
**Data Period:** 2000-2025

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Research Objectives](#2-research-objectives)
3. [Data Sources](#3-data-sources)
4. [Methodology Overview](#4-methodology-overview)
5. [Section 1: Environment Setup](#5-section-1-environment-setup)
6. [Section 2: Shoreline Data Processing](#6-section-2-shoreline-data-processing)
7. [Section 3: Environmental Data Processing](#7-section-3-environmental-data-processing)
8. [Section 4: Exploratory Data Analysis](#8-section-4-exploratory-data-analysis)
9. [Section 5: Pattern Recognition](#9-section-5-pattern-recognition)
10. [Section 6: Threshold Detection Models](#10-section-6-threshold-detection-models)
11. [Section 7: Model Evaluation](#11-section-7-model-evaluation)
12. [Section 8: Final Thresholds](#12-section-8-final-thresholds)
13. [Key Findings and Conclusions](#13-key-findings-and-conclusions)

---

## 1. Executive Summary

This analysis implements a comprehensive machine learning pipeline to identify **critical environmental thresholds** that trigger coastal erosion events. By combining shoreline change data with oceanographic drivers (waves, winds, currents), the system detects patterns and predicts erosion risk using three complementary models:

- **Gaussian Mixture Model (GMM)** for state detection
- **Random Forest** for feature importance and threshold extraction
- **XGBoost with SHAP** for high-accuracy prediction and interpretability

---

## 2. Research Objectives

| Objective | Description |
|-----------|-------------|
| **Primary** | Identify quantitative thresholds for environmental drivers that trigger erosion |
| **Secondary** | Classify erosion events by dominant forcing mechanism |
| **Tertiary** | Develop a predictive framework for early warning systems |

### Monsoon Year Definition

The analysis uses a **monsoon year** temporal framework:
- **Start:** April (Year N)
- **End:** March (Year N+1)
- **Rationale:** Aligns with the Southwest/Northeast monsoon cycle affecting the study region

---

## 3. Data Sources

### 3.1 Shoreline Data
| File | Description |
|------|-------------|
| `all_stat.csv` | Transect-based shoreline statistics from DSAS analysis |

**Key Variables:**
- **NSM (Net Shoreline Movement):** Total shoreline change in meters (negative = erosion)
- **EPR (End Point Rate):** Annualized shoreline change rate (m/year)
- **LRR (Linear Regression Rate):** Statistically robust rate estimate
- **SCE (Shoreline Change Envelope):** Maximum range of shoreline positions
- **SCE_closest_year:** Year of the shoreline measurement

### 3.2 Environmental Data (NetCDF)

| File | Variables | Resolution |
|------|-----------|------------|
| `2000-2025_Gobal_Ocain_waves_reanalysis.nc` | VHM0 (wave height), VTPK (peak period) | Monthly |
| `2000-2025_Global Ocean Monthly Mean Sea Surface Wind...nc` | wind_speed, wind_stress, eastward/northward wind | Monthly |
| `2000-2025_Current_Data(Physics_Reanalysis).nc` | uo, vo (current components) | Monthly |

---

## 4. Methodology Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ANALYSIS PIPELINE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   DATA INGESTION          FEATURE ENGINEERING         MODEL TRAINING    │
│   ─────────────          ───────────────────         ──────────────     │
│   • Shoreline CSV        • Monsoon year aggregation  • GMM states       │
│   • Wave NetCDF          • Intensity normalization   • Random Forest    │
│   • Wind NetCDF          • Storm day counting        • XGBoost + SHAP   │
│   • Current NetCDF       • Seasonal indicators                          │
│                                                                          │
│                    ↓                    ↓                    ↓           │
│                                                                          │
│              ┌─────────────────────────────────────────────────┐        │
│              │         THRESHOLD EXTRACTION & VALIDATION        │        │
│              │  • GMM state centroids → thresholds              │        │
│              │  • RF decision tree splits → thresholds          │        │
│              │  • SHAP values → feature importance              │        │
│              │  • Cross-model consensus → final thresholds      │        │
│              └─────────────────────────────────────────────────┘        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Section 1: Environment Setup

### Purpose
Establish the computational environment with all necessary libraries for data processing, visualization, and machine learning.

### Libraries Used

| Library | Purpose |
|---------|---------|
| **numpy** | Numerical computing and array operations |
| **pandas** | Data manipulation and analysis |
| **xarray** | NetCDF file handling for multidimensional arrays |
| **matplotlib/seaborn** | Data visualization |
| **scikit-learn** | Machine learning algorithms (RF, PCA, clustering, metrics) |
| **xgboost** | Gradient boosting classifier |
| **shap** | Model interpretability and feature importance |
| **hmmlearn** | Hidden Markov Models (optional, fallback to GMM) |

### Configuration
```python
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams['figure.figsize'] = [12, 6]
warnings.filterwarnings('ignore')
```

---

## 6. Section 2: Shoreline Data Processing

### 6.1 Data Loading

**Task:** Load transect-based shoreline statistics from DSAS (Digital Shoreline Analysis System) output.

**Technique:** Pandas CSV parsing with automatic type inference.

```
Input: all_stat.csv (109 transects)
Output: shoreline_df DataFrame
```

### 6.2 Temporal Aggregation: Transect to Annual

**Purpose:** Convert individual transect measurements to annual beach-scale statistics.

**Technique:** GroupBy aggregation using `SCE_closest_year` as the temporal key.

| Aggregation | Statistic | Purpose |
|-------------|-----------|---------|
| NSM | mean, median, std, min, max, count | Central tendency and variability of shoreline change |
| EPR | mean, median, std | Annualized rate statistics |
| LRR | mean, median, std | Long-term trend statistics |
| SCE | mean, max | Shoreline movement envelope |

### 6.3 Erosion Label Creation

**Purpose:** Create binary and categorical labels for supervised learning.

**Technique:** Quantile-based relative thresholds (since all transects show erosion).

**Logic:**
```
Since ALL transects show erosion (negative NSM), use RELATIVE thresholds:
  • Severe Erosion:   NSM < Q25 (most negative, most erosion)
  • Moderate Erosion: Q25 ≤ NSM < Q75
  • Mild Erosion:     NSM ≥ Q75 (least negative)
  
Binary Classification:
  • Erosion (1): NSM < median
  • Stable (0):  NSM ≥ median
```

**Why Relative Thresholds?**
- Absolute threshold (NSM < 0) would classify ALL years as erosion
- Relative thresholds distinguish HIGH erosion years from LOW erosion years
- Enables meaningful classification even in erosion-dominated systems

### 6.4 Beach-Scale Aggregation

**Purpose:** Calculate overall beach state from transect statistics.

**Metrics Computed:**
| Metric | Formula | Interpretation |
|--------|---------|----------------|
| Pct_Eroding | (Eroding transects / Total) × 100 | Spatial extent of erosion |
| Mean_NSM | Average of all transect NSM | Overall shoreline retreat |
| Max_Erosion | Minimum NSM value | Worst-case erosion hotspot |

**Beach State Classification:**
```
IF Mean_NSM < 0 AND Pct_Eroding > 60%:
    Beach_State = "EROSION"
ELSE:
    Beach_State = "STABLE/ACCRETION"
```

---

## 7. Section 3: Environmental Data Processing

### 7.1 Wave Data Processing

**Purpose:** Extract wave forcing parameters that drive sediment transport and erosion.

**Source:** Global Ocean Waves Reanalysis (Copernicus Marine Service)

**Key Variables:**

| Variable | Name | Unit | Physical Meaning |
|----------|------|------|------------------|
| VHM0 | Significant Wave Height | meters | Average height of highest 1/3 of waves |
| VTPK | Peak Wave Period | seconds | Period of dominant wave energy |

**Derived Features:**

| Feature | Formula | Purpose |
|---------|---------|---------|
| wave_energy | VHM0² × VTPK | Proxy for wave power (energy flux) |
| is_storm_wave | VHM0 > 2.0 m | Binary storm event indicator |
| StormDays_wave | Count of storm days per month | Storm frequency metric |

**Monsoon Year Assignment Function:**
```python
def assign_monsoon_year(time):
    month = pd.Timestamp(time).month
    year = pd.Timestamp(time).year
    if month >= 4:  # April onwards
        return year
    else:  # Jan-March belongs to previous year's monsoon
        return year - 1
```

### 7.2 Wind Data Processing

**Purpose:** Capture wind forcing that generates waves and storm surge.

**Source:** Global Ocean Monthly Mean Sea Surface Wind from Scatterometer and Model

**Key Variables:**

| Variable | Unit | Physical Meaning |
|----------|------|------------------|
| wind_speed | m/s | Surface wind magnitude |
| wind_stress_magnitude | N/m² | Momentum transfer to ocean surface |
| eastward_wind | m/s | Zonal wind component |
| northward_wind | m/s | Meridional wind component |

**Storm Wind Threshold:** > 10 m/s

### 7.3 Current Data Processing

**Purpose:** Quantify ocean currents that transport sediment offshore/alongshore.

**Source:** Physics Reanalysis (Copernicus Marine Service)

**Key Variables:**

| Variable | Unit | Physical Meaning |
|----------|------|------------------|
| uo | m/s | Eastward current velocity |
| vo | m/s | Northward current velocity |

**Derived Feature:**
```python
current_magnitude = √(uo² + vo²)
```

### 7.4 Temporal Aggregation Strategy

**Purpose:** Aggregate high-frequency environmental data to match shoreline data resolution.

| Driver | Monthly Aggregation | Annual Aggregation |
|--------|--------------------|--------------------|
| Wave Height (Hm0) | max, mean, std | Annual maximum |
| Wave Period (Tp) | max, mean | Annual maximum |
| Wave Energy | sum | Cumulative annual |
| Storm Days | count | Total per year |
| Wind Speed | max, mean, std | Annual max, mean |
| Wind Stress | max, mean | Annual mean |
| Current | max, mean, sum | Annual max, cumulative |

**Why Monthly Resolution?**
- Provides ~300 samples vs ~25 annual samples (12× more training data)
- Captures seasonal patterns in erosion drivers
- Better model generalization with more training examples

### 7.5 Feature Merging and Seasonal Indicators

**Purpose:** Create unified feature matrix with environmental drivers and seasonal context.

**Seasonal Classification:**
```python
def get_season(month):
    if month in [6, 7, 8, 9]:     # SW Monsoon
        return 'SW_Monsoon'
    elif month in [10, 11]:        # NE Monsoon onset
        return 'NE_Monsoon'
    elif month in [12, 1, 2]:      # NE Monsoon peak
        return 'NE_Peak'
    else:                          # Pre-monsoon
        return 'Pre_Monsoon'
```

**One-Hot Encoding:** Seasons converted to dummy variables (Season_SW_Monsoon, etc.)

### 7.6 Intensity Normalization

**Purpose:** Create comparable intensity scores across different physical units.

**Technique:** Z-score standardization

```python
wave_intensity = (Hm0_max - mean(Hm0_max)) / std(Hm0_max)
wind_intensity = (WindMax - mean(WindMax)) / std(WindMax)
current_intensity = (UcurrMax - mean(UcurrMax)) / std(UcurrMax)

env_forcing_index = (wave_intensity + wind_intensity + current_intensity) / 3
```

**Why Normalize?**
- Wave height (meters) vs Current velocity (m/s) vs Wind speed (m/s) have different scales
- Normalization allows direct comparison of driver contributions
- Required for clustering and PCA algorithms

---

## 8. Section 4: Exploratory Data Analysis

### 8.1 Boxplot Comparison

**Purpose:** Visually compare environmental driver distributions between erosion and stable years.

**Technique:** Side-by-side boxplots with median, quartiles, and outliers.

**Interpretation:**
- Higher median values in "Erosion" group suggest positive correlation
- Non-overlapping boxes indicate strong discriminatory power
- Outliers may represent extreme storm events

### 8.2 Correlation Matrix

**Purpose:** Quantify linear relationships between all variables and erosion.

**Technique:** Pearson correlation coefficient matrix with hierarchical clustering.

**Visualization:** Heatmap with lower triangle mask, color-coded by correlation strength.

**Key Insights:**
- Correlation with Erosion_Label identifies potential predictors
- High inter-feature correlations may indicate multicollinearity
- Helps feature selection for modeling

### 8.3 Principal Component Analysis (PCA)

**Purpose:** Reduce dimensionality and identify latent environmental regimes.

**Technique:** Singular Value Decomposition to find orthogonal principal components.

**Mathematical Foundation:**
```
X_scaled = StandardScaler().fit_transform(X)
PCA: X_scaled → [PC1, PC2, PC3]

Where:
- PC1 captures maximum variance direction
- PC2 orthogonal to PC1, captures next maximum
- PC3 orthogonal to PC1 and PC2
```

**Outputs:**
1. **Scatter plot:** PC1 vs PC2 colored by erosion label
2. **Explained variance:** Percentage of total variance per component
3. **Loadings table:** Feature contributions to each PC

**Interpretation:**
- Clusters in PC space indicate distinct environmental regimes
- Separation between erosion/stable in PC space validates predictability
- Loadings reveal which features define each regime

---

## 9. Section 5: Pattern Recognition

### 9.1 K-Means Clustering for Forcing Regime Classification

**Purpose:** Automatically categorize years/months into distinct forcing regimes.

**Technique:** K-Means clustering on standardized intensity scores.

**Algorithm:**
```
1. Initialize k centroids randomly
2. Assign each point to nearest centroid
3. Recalculate centroids as cluster means
4. Repeat until convergence
```

**Parameters:**
- k = 5 clusters (different forcing regimes)
- Features: [wave_intensity, wind_intensity, current_intensity]
- n_init = 10 (run 10 times with different seeds)

### 9.2 Forcing Regime Classification Rules

**Purpose:** Assign descriptive labels based on which drivers are elevated.

**Classification Logic:**
```python
threshold = 0.5  # Standard deviations above mean

if high_wave AND high_wind AND high_current:
    regime = 'Wave-Wind-Current Combined'
elif high_wave AND high_wind:
    regime = 'Wave-Wind Combined'
elif high_wave AND high_current:
    regime = 'Wave-Current Combined'
elif high_wind AND high_current:
    regime = 'Wind-Current Combined'
elif high_wave:
    regime = 'Wave-Dominated'
elif high_wind:
    regime = 'Wind-Dominated'
elif high_current:
    regime = 'Current-Dominated'
else:
    regime = 'Low-Energy'
```

**Why This Matters:**
- Different forcing regimes may require different mitigation strategies
- Understanding dominant drivers helps predict erosion mechanisms
- Enables regime-specific threshold recommendations

---

## 10. Section 6: Threshold Detection Models

### 10.1 Feature Preparation for Modeling

**Purpose:** Prepare feature matrices for machine learning models.

**Monthly Features:**
```python
['Hm0_max', 'Hm0_mean', 'CumWaveEnergy', 'StormDays_wave',
 'WindMax', 'WindMean', 'WindStressMean',
 'UcurrMax', 'UcurrMean', 'CumCurrent',
 'month', 'Season_SW_Monsoon', 'Season_NE_Monsoon', ...]
```

**Feature Scaling:**
```python
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
```

**Why Scale?**
- Many ML algorithms assume features have similar scales
- Gradient-based optimization converges faster
- Distance-based algorithms (GMM) work correctly

---

### 10.2 Gaussian Mixture Model (GMM)

#### Purpose
Identify **latent erosion states** in the environmental data without using labels. GMM finds natural clusters that may correspond to erosion-prone vs. stable conditions.

#### Technique: Probabilistic Clustering

Unlike K-Means (hard clustering), GMM assigns **probabilities** of belonging to each cluster.

**Mathematical Model:**
```
P(x) = Σ πₖ N(x | μₖ, Σₖ)

Where:
- πₖ = mixing coefficient (cluster weight)
- μₖ = cluster mean (centroid)
- Σₖ = cluster covariance matrix
- N() = multivariate Gaussian distribution
```

#### Optimal Component Selection

**Technique:** Bayesian Information Criterion (BIC) minimization

```python
for n in range(2, 8):
    gmm = GaussianMixture(n_components=n)
    gmm.fit(X_scaled)
    bic_scores.append(gmm.bic(X_scaled))

optimal_n = argmin(bic_scores)
```

**Why BIC?**
- Balances model fit against complexity
- Penalizes overfitting (too many components)
- Lower BIC = better model

#### Threshold Extraction from GMM

**Method:** Compare cluster centroids between erosion and stable states.

```python
erosion_state = state_with_highest_erosion_rate
erosion_centroid = gmm.means_[erosion_state]
normal_centroid = mean(gmm.means_[other_states])

threshold = (erosion_centroid + normal_centroid) / 2
```

**Interpretation:**
- Threshold is the midpoint between erosion and stable state centroids
- Features with large centroid differences are strong discriminators

---

### 10.3 Random Forest Classifier

#### Purpose
Build an ensemble of decision trees to classify erosion/stable and extract **feature importance** and **split thresholds**.

#### Technique: Bagging Ensemble

**Algorithm:**
```
For each tree (1 to n_estimators):
    1. Bootstrap sample (random subset with replacement)
    2. At each node, consider random subset of features
    3. Split on feature/threshold that maximizes information gain
    4. Grow tree until stopping criterion

Final prediction = majority vote across all trees
```

#### Key Hyperparameters

| Parameter | Values Tested | Purpose |
|-----------|---------------|---------|
| n_estimators | 100-300 | Number of trees in forest |
| max_depth | 3-8, None | Maximum tree depth (prevents overfitting) |
| min_samples_split | 2-15 | Minimum samples to split a node |
| min_samples_leaf | 1-6 | Minimum samples in leaf node |
| max_features | sqrt, log2, 0.3-0.5 | Features considered per split |
| class_weight | balanced | Adjust for class imbalance |

#### Cross-Validation Strategy: GroupKFold

**Purpose:** Prevent data leakage between years.

**Problem:** Monthly data from the same year shares the same erosion label. Standard K-Fold might put January and December of the same year in different folds, causing leakage.

**Solution:**
```python
group_cv = GroupKFold(n_splits=5)
# All 12 months from each year stay in the same fold
# Train on years A, B, C; Test on years D, E
```

#### Threshold Extraction from Random Forest

**Technique:** Extract decision tree split points

```python
for tree in rf_model.estimators_:
    for node in tree.tree_:
        if node.is_split_node:
            feature = feature_names[node.feature]
            threshold = node.threshold
            all_thresholds[feature].append(threshold)

final_threshold = median(all_thresholds[feature])
```

**Why Median?**
- Robust to outlier splits
- Represents "consensus" threshold across all trees
- More stable than individual tree thresholds

#### Feature Importance

**Technique:** Mean Decrease in Impurity (Gini importance)

```
Importance(feature) = Σ (weighted impurity decrease at all splits using this feature)
```

**Interpretation:**
- Higher importance = feature contributes more to classification
- Guides threshold prioritization
- Identifies primary erosion drivers

---

### 10.4 XGBoost Classifier

#### Purpose
State-of-the-art gradient boosting for maximum predictive accuracy with built-in regularization.

#### Technique: Gradient Boosting

**Algorithm:**
```
Initialize: F₀(x) = constant

For m = 1 to M (n_estimators):
    1. Compute pseudo-residuals: rᵢ = -∂L(yᵢ, F_{m-1}(xᵢ))/∂F
    2. Fit tree hₘ(x) to pseudo-residuals
    3. Update: Fₘ(x) = F_{m-1}(x) + η × hₘ(x)

Final: F(x) = F₀(x) + Σ η × hₘ(x)
```

**Key Differences from Random Forest:**
- Trees are built **sequentially** (not parallel)
- Each tree corrects errors of previous trees
- Uses gradient descent optimization
- Built-in L1/L2 regularization

#### Key Hyperparameters

| Parameter | Values | Purpose |
|-----------|--------|---------|
| learning_rate | 0.01-0.15 | Step size shrinkage (prevents overfitting) |
| max_depth | 2-6 | Shallower than RF (boosting already complex) |
| min_child_weight | 1-5 | Minimum sum of instance weight in child |
| subsample | 0.6-0.9 | Row subsampling per tree |
| colsample_bytree | 0.6-0.9 | Column subsampling per tree |
| gamma | 0-0.3 | Minimum loss reduction for split |
| reg_alpha | 0-0.1 | L1 regularization (Lasso) |
| reg_lambda | 1-2 | L2 regularization (Ridge) |
| scale_pos_weight | 1 or ratio | Handle class imbalance |

---

### 10.5 SHAP Analysis (SHapley Additive exPlanations)

#### Purpose
Provide **interpretable explanations** for model predictions using game-theoretic principles.

#### Technique: Shapley Values

**Concept from Game Theory:**
- Each feature is a "player" in a coalition
- SHAP value = average marginal contribution of feature across all possible coalitions

**Mathematical Definition:**
```
φᵢ = Σ [|S|!(M-|S|-1)!/M!] × [f(S∪{i}) - f(S)]

Where:
- φᵢ = SHAP value for feature i
- S = subset of features (coalition)
- M = total number of features
- f(S) = model prediction using only features in S
```

#### SHAP Outputs

**1. Summary Plot (Beeswarm):**
- Each dot = one sample
- X-axis = SHAP value (impact on prediction)
- Color = feature value (red=high, blue=low)
- Features sorted by mean |SHAP|

**2. Bar Plot:**
- Mean absolute SHAP value per feature
- Direct measure of feature importance
- More reliable than model-specific importance

#### Interpretation Example

```
If SHAP(Hm0_max) = +0.8 for a sample:
  → This sample's wave height INCREASED erosion probability by 0.8
  
If SHAP(WindMax) = -0.2 for same sample:
  → This sample's wind speed DECREASED erosion probability by 0.2
```

**Why SHAP?**
- Model-agnostic (works with any model)
- Additive: sum of SHAP values = prediction - baseline
- Consistent: features that contribute more get higher SHAP
- Local + Global: explains individual predictions AND overall importance

---

## 11. Section 7: Model Evaluation

### 11.1 Evaluation Metrics

| Metric | Formula | Purpose |
|--------|---------|---------|
| **Accuracy** | (TP + TN) / Total | Overall correctness |
| **Precision** | TP / (TP + FP) | "Of predicted erosion, how many are correct?" |
| **Recall** | TP / (TP + FN) | "Of actual erosion, how many did we catch?" |
| **F1-Score** | 2 × (P × R) / (P + R) | Harmonic mean of precision and recall |
| **ROC-AUC** | Area under ROC curve | Overall discrimination ability |

**Confusion Matrix:**
```
                    Predicted
                 Stable  Erosion
Actual Stable     TN       FP
       Erosion    FN       TP
```

### 11.2 ROC Curve Analysis

**Purpose:** Visualize trade-off between True Positive Rate and False Positive Rate.

**Technique:**
```
For each probability threshold (0 to 1):
    TPR = TP / (TP + FN)  # Sensitivity
    FPR = FP / (FP + TN)  # 1 - Specificity
    Plot (FPR, TPR)
    
AUC = Area under this curve
```

**Interpretation:**
- AUC = 0.5: Random guessing
- AUC = 0.7-0.8: Acceptable
- AUC = 0.8-0.9: Excellent
- AUC > 0.9: Outstanding

### 11.3 Model Comparison

| Model | Strengths | Weaknesses |
|-------|-----------|------------|
| **GMM** | Unsupervised, probabilistic states | Doesn't optimize for classification |
| **Random Forest** | Robust, handles non-linearity | Black box, overfitting risk |
| **XGBoost** | Highest accuracy, regularized | Complex tuning, overfitting risk |

---

## 12. Section 8: Final Thresholds

### 12.1 Multi-Model Consensus Thresholds

**Purpose:** Combine thresholds from all models for robust recommendations.

| Driver | Unit | GMM Threshold | RF Threshold | Consensus |
|--------|------|---------------|--------------|-----------|
| Hm0_max (Wave Height) | m | ≥ 2.7 | ≥ 2.9 | **≥ 2.7 - 2.9** |
| UcurrMax (Current) | m/s | ≥ 0.44 | ≥ 0.51 | **≥ 0.44 - 0.51** |
| WindMax (Wind Speed) | m/s | ≥ 6.5 | ≥ 6.7 | **≥ 6.5 - 6.7** |

### 12.2 Combined Threshold Rules

```
HIGH EROSION RISK:
├── Rule 1: Hm0_max ≥ 2.9 m AND UcurrMax ≥ 0.5 m/s
├── Rule 2: Hm0_max ≥ 2.7 m AND WindMax ≥ 6.5 m/s AND UcurrMax ≥ 0.4 m/s
└── Rule 3: env_forcing_index > 1.0 (all drivers elevated)

WAVE-DOMINATED EROSION:
└── Hm0_max ≥ 3.0 m (regardless of other conditions)

CURRENT-DOMINATED EROSION:
└── UcurrMax ≥ 0.55 m/s (high offshore transport)
```

### 12.3 Physical Interpretation

| Driver | Threshold | Erosion Mechanism |
|--------|-----------|-------------------|
| Wave Height | ≥ 2.9 m | Wave energy exceeds sediment resistance |
| Current Velocity | ≥ 0.5 m/s | Offshore sediment transport intensifies |
| Wind Speed | ≥ 6.5 m/s | Wave generation and storm surge enhancement |
| Storm Days | ≥ 5/month | Prolonged high-energy exposure |
| Cumulative Energy | High | Fatigue-like beach profile breakdown |

---

## 13. Key Findings and Conclusions

### 13.1 Shoreline Status
- **99% of transects show erosion** (108/109 transects)
- Mean Net Shoreline Movement: **-7.97 meters**
- Classification uses relative thresholds (high vs. low erosion years)

### 13.2 Primary Erosion Drivers (Ranked by Importance)

| Rank | Driver | Evidence |
|------|--------|----------|
| **1** | Maximum Wave Height (Hm0_max) | Highest importance in RF, XGBoost, SHAP |
| **2** | Maximum Current Velocity (UcurrMax) | 38% higher during erosion years |
| **3** | Maximum Wind Speed (WindMax) | Supporting driver for wave generation |

### 13.3 Methodological Advantages

| Approach | Benefit |
|----------|---------|
| Monthly data (vs. annual) | 12× more training samples, captures seasonality |
| GroupKFold CV | Prevents temporal data leakage |
| Multi-model consensus | Robust thresholds, reduced model bias |
| SHAP analysis | Interpretable, actionable insights |

### 13.4 Recommended Applications

1. **Early Warning System**
   - Monitor when Hm0_max approaches 2.7 m
   - Alert when UcurrMax > 0.4 m/s
   - Combined threshold triggers high-priority warnings

2. **Seasonal Planning**
   - Track cumulative wave energy during monsoon
   - Pre-position coastal protection during SW monsoon onset

3. **Risk Assessment**
   - Use forcing regime classification for vulnerability mapping
   - Prioritize intervention in wave-dominated erosion zones

---

## Appendix: Exported Files

| File | Format | Contents |
|------|--------|----------|
| `processed_annual_features.csv` | CSV | Annual environmental features with erosion labels |
| `erosion_thresholds.csv` | CSV | Threshold summary from all models |
| `erosion_thresholds.json` | JSON | Frontend-ready threshold data |
| `frontend/public/data/analysis_results.json` | JSON | Complete analysis results for web dashboard |

---

*Document generated from notebook analysis workflow*  
*CoastalAI Research Project*
