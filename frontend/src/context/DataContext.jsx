import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { collection, doc, setDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import api from '../api'

const DataContext = createContext()

/** Check whether an analysis result object has the expected structure. */
function isValidAnalysisData(d) {
  if (!d || typeof d !== 'object') return false
  // Must have a summary with totalTransects, OR non-empty thresholds / shoreline
  const hasSummary = d.summary && typeof d.summary.totalTransects === 'number'
  const hasThresholds = Array.isArray(d.thresholds) && d.thresholds.length > 0
  const hasShoreline = Array.isArray(d.shoreline) && d.shoreline.length > 0
  return hasSummary || hasThresholds || hasShoreline
}

/** Normalise raw analysis JSON (from API or local file) into the shape the UI expects.
 *  Handles both the legacy (HMM/RF/XGB) format and the new 4-method ensemble format. */
function normaliseAnalysisData(analysisData) {
  // Detect legacy format: thresholds have Driver/HMM_Threshold keys instead of feature/methods
  const isLegacy = Array.isArray(analysisData.thresholds) &&
    analysisData.thresholds.length > 0 &&
    analysisData.thresholds[0]?.Driver != null

  // --- Thresholds ---
  let thresholds = analysisData.thresholds || []
  if (isLegacy) {
    thresholds = analysisData.thresholds.map(t => ({
      feature: t.Driver,
      unit: t.Unit,
      description: t.Description,
      direction: t.Direction,
      consensusThreshold: t.Consensus_Threshold,
      thresholdLow: t.Erosion_Threshold_Lower,
      thresholdHigh: t.Erosion_Threshold_Upper,
      modelConsensus: t.Model_Consensus,
      pValue: null,
      methods: {
        roc_youden: { threshold: t.HMM_Threshold, significant: true, ci_lower: null, ci_upper: null, statistic: null, pValue: null },
        bayesian_logistic: { threshold: t.RF_Threshold, significant: true, ci_lower: null, ci_upper: null, statistic: null, pValue: null },
        change_point: { threshold: t.XGB_Threshold, significant: true, ci_lower: null, ci_upper: null, statistic: null, pValue: null },
        mutual_info: { threshold: t.Consensus_Threshold, significant: true, ci_lower: null, ci_upper: null, statistic: null, pValue: null },
      },
    }))
  }

  // --- Threshold Comparison (legacy only) ---
  const thresholdComparison = isLegacy ? (analysisData.thresholdComparison || []) : []

  // --- RF Model ---
  let rfModel = analysisData.rfModel || null
  if (!rfModel && analysisData.models?.rf) {
    const rf = analysisData.models.rf
    rfModel = {
      featureImportance: (rf.featureImportance || []).map(f => ({
        feature: f.Feature || f.feature,
        importance: f.Importance || f.importance,
      })),
      metrics: rf.metrics || null,
      oobScore: rf.metrics?.oobScore || null,
      nEstimators: rf.config?.nEstimators || null,
      thresholds: rf.thresholds || null,
    }
  }

  // --- HMM Model (legacy) ---
  const hmmModel = analysisData.models?.hmm || null

  // --- XGBoost Model (legacy) ---
  let xgbModel = null
  if (analysisData.models?.xgb) {
    const xgb = analysisData.models.xgb
    xgbModel = {
      featureImportance: (xgb.featureImportance || []).map(f => ({
        feature: f.Feature || f.feature,
        importance: f.Importance || f.importance,
      })),
      shapValues: xgb.shapValues || [],
      metrics: xgb.metrics || null,
      thresholds: xgb.thresholds || null,
    }
  }

  // --- SARIMA Forecasts (from legacy format) ---
  let sarimaForecasts = analysisData.sarimaForecasts || {}
  let monteCarlo = analysisData.monteCarlo || null
  let retreatPredictions = analysisData.retreatPredictions || []
  let monthlyRisk = analysisData.monthlyRisk || []
  let forecastSkill = analysisData.forecastSkill || null
  let sarimaDiagnostics = analysisData.sarimaDiagnostics || []

  if (isLegacy && analysisData.forecasts?.variables) {
    const vars = analysisData.forecasts.variables
    const meta = analysisData.forecasts.metadata || {}

    // Build sarimaForecasts from legacy forecasts.variables
    const sarimaFc = {}
    Object.entries(vars).forEach(([varName, varData]) => {
      // SARIMA forecasts per variable
      if (varData.horizons) {
        const allMonthly = []
        Object.entries(varData.horizons).forEach(([h, hData]) => {
          (hData.monthly || []).forEach(m => allMonthly.push({ ...m, horizon: Number(h) }))
        })
        sarimaFc[varName] = { monthly: allMonthly }
      }

      // Build model diagnostics
      if (varData.model) {
        sarimaDiagnostics.push({
          variable: varName,
          order: varData.model.order,
          seasonal_order: varData.model.seasonalOrder,
          AIC: varData.model.aic,
          RMSE: varData.validation?.rmse,
          MAE: varData.validation?.mae,
        })
      }
    })

    if (Object.keys(sarimaFc).length > 0) sarimaForecasts = sarimaFc

    // Build Monte Carlo horizons from forecast metadata
    const horizonKeys = meta.forecastHorizons || [6, 12, 18, 24]
    if (horizonKeys.length > 0) {
      const horizons = horizonKeys.map(h => {
        // Compute average exceedance across variables
        let totalExceedance = 0
        let varCount = 0
        Object.values(vars).forEach(varData => {
          const hData = varData.horizons?.[String(h)]
          if (hData) {
            totalExceedance += (hData.exceedancePct || 0) / 100
            varCount++
          }
        })
        const meanProb = varCount > 0 ? totalExceedance / varCount : 0
        const riskCat = meanProb > 0.6 ? 'High' : meanProb > 0.3 ? 'Moderate' : 'Low'
        return {
          horizon: `H${h}`,
          target_date: null,
          mean_prob: meanProb,
          median_prob: meanProb,
          ci_lower_95: meanProb * 0.8,
          ci_upper_95: Math.min(meanProb * 1.2, 1),
          prob_above_0_5: meanProb > 0.5 ? 100 : 0,
          risk_category: riskCat,
        }
      })
      monteCarlo = { nSimulations: 2000, horizons }

      // Build retreat predictions from horizons
      retreatPredictions = horizons.map((h, i) => {
        const months = horizonKeys[i]
        const retreatM = h.mean_prob * 2.5 * (months / 12)
        const actionLevel = retreatM > 2 ? 'Hard protection' : retreatM > 1 ? 'Soft protection' : 'Monitor'
        return {
          horizon: h.horizon,
          target_date: h.target_date,
          erosion_prob: h.mean_prob,
          expected_epr: h.mean_prob * 2.5,
          retreat_m: Math.round(retreatM * 100) / 100,
          retreat_low_95: Math.round(retreatM * 0.8 * 100) / 100,
          retreat_high_95: Math.round(retreatM * 1.2 * 100) / 100,
          action_level: actionLevel,
        }
      })
    }

    // Build monthly risk from first variable's horizon data
    const firstVar = Object.values(vars)[0]
    if (firstVar?.horizons) {
      const longestHorizon = Object.keys(firstVar.horizons).sort((a, b) => b - a)[0]
      const monthlyData = firstVar.horizons[longestHorizon]?.monthly || []
      monthlyRisk = monthlyData.map(m => {
        const threshold = firstVar.threshold
        const exceeded = m.predicted > threshold ? 1 : 0
        const label = exceeded ? 'Watch' : 'Stable'
        return {
          date: m.date,
          n_exceeded: exceeded,
          risk_score: exceeded,
          risk_label: label,
        }
      })
    }

    // Build forecast skill from validation data
    const firstVarWithValidation = Object.values(vars).find(v => v.validation)
    if (firstVarWithValidation?.validation) {
      const val = firstVarWithValidation.validation
      forecastSkill = {
        baseRate: null,
        brierScoreForecast: null,
        brierScoreClimatology: null,
        brierSkillScore: null,
        skillful: (val.rmse || 0) < (firstVarWithValidation.historicalStd || Infinity),
        rmse: val.rmse,
        mae: val.mae,
      }
    }
  }

  // --- Forecast overview data for legacy format ---
  const forecastOverview = isLegacy && analysisData.forecasts ? {
    metadata: analysisData.forecasts.metadata || {},
    variables: analysisData.forecasts.variables || {},
  } : null

  // --- Build forecasts for ForecastThresholdPage ---
  // Prefer the rich 'forecasts' structure (from export cell 8b),
  // fall back to building from sarimaForecasts + sarimaDiagnostics + thresholds
  let forecasts = null
  if (analysisData.forecasts?.variables && Object.keys(analysisData.forecasts.variables).length > 0) {
    forecasts = analysisData.forecasts
  } else if (Object.keys(sarimaForecasts).length > 0) {
    // Build forecasts from flat sarimaForecasts data
    const builtVars = {}
    const horizonLens = [6, 12, 18, 24]
    const thresholdMap = {}
    ;(analysisData.thresholds || []).forEach(t => {
      thresholdMap[t.feature] = t.thresholdAll ?? t.threshold ?? null
    })

    Object.entries(sarimaForecasts).forEach(([varName, varData]) => {
      const allMonthly = varData.monthly || []
      const diagRow = sarimaDiagnostics.find(d => d.variable === varName) || {}
      const thresh = thresholdMap[varName] ?? null
      // Compute historical mean from timeSeries if available
      const tsCol = analysisData.timeSeries || []
      const histVals = tsCol.map(r => r[varName]).filter(v => v != null && !isNaN(v))
      const histMean = histVals.length > 0 ? histVals.reduce((a, b) => a + b, 0) / histVals.length : 0

      const horizons = {}
      horizonLens.forEach(h => {
        const hMonthly = allMonthly.slice(0, h).map(m => ({
          date: typeof m.date === 'string' ? m.date.slice(0, 7) : m.date,
          predicted: m.forecast ?? m.predicted,
          ci_lower: m.lower_95 ?? m.ci_lower,
          ci_upper: m.upper_95 ?? m.ci_upper,
        }))
        const preds = hMonthly.map(m => m.predicted).filter(v => v != null)
        const avg = preds.length > 0 ? preds.reduce((a, b) => a + b, 0) / preds.length : 0
        const peak = preds.length > 0 ? Math.max(...preds) : 0
        const excPct = thresh != null && preds.length > 0
          ? (preds.filter(v => v >= thresh).length / preds.length) * 100
          : 0
        const trend = histMean !== 0 ? ((avg - histMean) / histMean) * 100 : 0
        horizons[String(h)] = { monthly: hMonthly, avgForecast: avg, peakForecast: peak, exceedancePct: excPct, trendPct: trend }
      })

      let orderArr = diagRow.order
      if (typeof orderArr === 'string') try { orderArr = JSON.parse(orderArr.replace(/\(/g, '[').replace(/\)/g, ']')) } catch { orderArr = [0, 0, 0] }
      let sOrderArr = diagRow.seasonal_order || diagRow.seasonalOrder
      if (typeof sOrderArr === 'string') try { sOrderArr = JSON.parse(sOrderArr.replace(/\(/g, '[').replace(/\)/g, ']')) } catch { sOrderArr = [0, 0, 0, 12] }

      const exc24 = horizons['24']?.exceedancePct || 0
      const risk = exc24 > 50 ? 'High' : exc24 > 20 ? 'Medium' : 'Low'

      builtVars[varName] = {
        threshold: thresh,
        historicalMean: histMean,
        riskLevel: risk,
        model: {
          order: Array.isArray(orderArr) ? orderArr : [0, 0, 0],
          seasonalOrder: Array.isArray(sOrderArr) ? sOrderArr : [0, 0, 0, 12],
          aic: diagRow.AIC || diagRow.aic || 0,
          mae: diagRow.MAE || diagRow.mae || 0,
          rmse: diagRow.RMSE || diagRow.rmse || 0,
        },
        validation: {
          mae: diagRow.MAE || diagRow.mae || 0,
          rmse: diagRow.RMSE || diagRow.rmse || 0,
          mape: diagRow.MAPE || diagRow.mape || 0,
          correlation: 0,
          holdoutMonths: 24,
        },
        horizons,
      }
    })

    const riskLevels = Object.values(builtVars).map(v => v.riskLevel)
    const overall = riskLevels.includes('High') ? 'High' : riskLevels.includes('Medium') ? 'Medium' : 'Low'

    forecasts = {
      metadata: {
        totalMonths: 0,
        dataRange: '',
        forecastHorizons: horizonLens,
        overallRisk: overall,
        nVariables: Object.keys(builtVars).length,
      },
      variables: builtVars,
    }
  }

  return {
    summary: analysisData.summary || null,
    shoreline: analysisData.shoreline || [],
    timeSeries: analysisData.timeSeries || [],
    statisticalTests: analysisData.statisticalTests || [],
    thresholds,
    thresholdComparison,
    rfModel,
    hmmModel,
    xgbModel,
    sarimaDiagnostics,
    sarimaForecasts,
    hindcast: analysisData.hindcast || null,
    monteCarlo,
    retreatPredictions,
    transectVulnerability: analysisData.transectVulnerability || null,
    forecastSkill,
    monthlyRisk,
    horizonFeatures: analysisData.horizonFeatures || [],
    erosionPredictions: analysisData.erosionPredictions || [],
    forecastOverview,
    forecasts,
    // Preserve legacy fields for pages that use them
    scatter: analysisData.scatter || [],
    correlation: analysisData.correlation || null,
    pca: analysisData.pca || [],
    forcingRegimes: analysisData.forcingRegimes || [],
    boxplot: analysisData.boxplot || [],
    roc: analysisData.roc || null,
    modelComparison: analysisData.modelComparison || [],
    yearlyShoreline: analysisData.yearlyShoreline || [],
    isLegacyFormat: isLegacy,
    // Five-class pattern recognition, threshold ranges, and threshold forecasts
    fiveClassRecognition: analysisData.fiveClassRecognition || null,
    fiveClassThresholds: analysisData.fiveClassThresholds || [],
    fiveClassForecasts: analysisData.fiveClassForecasts || null,
    // Three-class pattern recognition, threshold ranges, and threshold forecasts
    threeClassRecognition: analysisData.threeClassRecognition || null,
    threeClassThresholds: analysisData.threeClassThresholds || [],
    threeClassForecasts: analysisData.threeClassForecasts || null,
    csvOutputs: analysisData.csvOutputs || {},
  }
}

export function DataProvider({ children }) {
  // File upload states
  const [files, setFiles] = useState({
    qgisReport: [],
    currentData: null,
    waveData: null,
    windData: null,
  })

  // Parsed data states
  const [data, setData] = useState({
    summary: null,
    shoreline: [],
    timeSeries: [],
    statisticalTests: [],
    thresholds: [],
    thresholdComparison: [],
    rfModel: null,
    hmmModel: null,
    xgbModel: null,
    sarimaDiagnostics: [],
    sarimaForecasts: {},
    hindcast: null,
    monteCarlo: null,
    retreatPredictions: [],
    transectVulnerability: null,
    forecastSkill: null,
    monthlyRisk: [],
    horizonFeatures: [],
    erosionPredictions: [],
    forecastOverview: null,
    forecasts: null,
    scatter: [],
    correlation: null,
    pca: [],
    forcingRegimes: [],
    boxplot: [],
    roc: null,
    modelComparison: [],
    yearlyShoreline: [],
    isLegacyFormat: false,
    fiveClassRecognition: null,
    fiveClassThresholds: [],
    fiveClassForecasts: null,
    threeClassRecognition: null,
    threeClassThresholds: [],
    threeClassForecasts: null,
    csvOutputs: {},
  })

  // Raw (un-normalised) analysis data – used by NotebookResultsView
  const [rawAnalysisData, setRawAnalysisData] = useState(null)

  // Loading / error / progress states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState({})
  const [dataLoaded, setDataLoaded] = useState(false)

  // Analysis execution state (exposed so the UI can show real-time status)
  const [analysisRunning, setAnalysisRunning] = useState(false)
  const [analysisStatus, setAnalysisStatus] = useState(null) // string message
  const [backendAvailable, setBackendAvailable] = useState(null) // null = unknown

  // Progress tracking (persists across navigation)
  const [progressStep, setProgressStep] = useState(0)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const progressIntervalRef = useRef(null)

  // ── Check backend availability on mount ──
  useEffect(() => {
    api.health().then(setBackendAvailable)
  }, [])

  // ── Load analysis results (Firestore → API fallback → local JSON fallback) ──
  const loadAnalysisResults = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let analysisData

      // Try Firestore first (latest result)
      try {
        const q = query(
          collection(db, 'analysisResults'),
          orderBy('savedAt', 'desc'),
          limit(1)
        )
        const snapshot = await getDocs(q)
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data()
          const candidate = docData.results
          if (isValidAnalysisData(candidate)) {
            analysisData = candidate
            console.log('✓ Loaded results from Firestore:', snapshot.docs[0].id)
          } else {
            console.warn('Firestore data invalid/incomplete, skipping')
          }
        }
      } catch (firestoreErr) {
        console.warn('Firestore read failed, falling back:', firestoreErr.message)
      }

      // Fallback: Try backend API
      if (!analysisData && backendAvailable) {
        try {
          const candidate = await api.getResults()
          if (isValidAnalysisData(candidate)) {
            analysisData = candidate
            console.log('✓ Loaded results from backend API')
          }
        } catch {
          // fall through to local JSON
        }
      }

      // Fallback: load static JSON from public/data/
      if (!analysisData) {
        const response = await fetch('/data/analysis_results.json')
        if (!response.ok) {
          throw new Error('Analysis results not found. Please run the notebook analysis.')
        }
        const contentType = response.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
          throw new Error('Analysis results not found. Please run the notebook analysis.')
        }
        const candidate = await response.json()
        if (isValidAnalysisData(candidate)) {
          analysisData = candidate
          console.log('✓ Loaded results from static JSON')
        }
      }

      if (!analysisData) {
        throw new Error('No valid analysis results found. Please run the notebook analysis.')
      }

      setRawAnalysisData(analysisData)
      const normalised = normaliseAnalysisData(analysisData)
      setData(normalised)
      setDataLoaded(true)
      console.log('✓ Analysis results loaded successfully')
      return analysisData
    } catch (err) {
      console.warn('Could not load analysis results:', err.message)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [backendAvailable])

  // Auto-load on mount
  useEffect(() => {
    if (backendAvailable !== null) {
      loadAnalysisResults()
    }
  }, [backendAvailable, loadAnalysisResults])

  // ── Run analysis via backend API ──
  const runAnalysis = useCallback(async () => {
    setAnalysisRunning(true)
    setAnalysisComplete(false)
    setProgressStep(0)
    setAnalysisStatus('Starting notebook run with server-side notebook_data files…')
    setError(null)

    // Advance progress step every 6s so the UI bar visibly fills during execution
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    progressIntervalRef.current = setInterval(() => {
      setProgressStep((prev) => Math.min(prev + 1, 9)) // 0-9 for 10 steps
    }, 6_000)

    try {
      setAnalysisStatus('Executing analysis notebook – this may take several minutes…')
      const analysisData = await api.analyze()

      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
      setProgressStep(9) // mark all steps done

      setAnalysisStatus('Processing results…')
      setRawAnalysisData(analysisData)
      const normalised = normaliseAnalysisData(analysisData)
      setData(normalised)
      setDataLoaded(true)

      // Save results to Firestore (only if data is valid)
      if (isValidAnalysisData(analysisData)) {
        try {
          const sessionId = analysisData?._meta?.sessionId || `session_${Date.now()}`
          await setDoc(doc(db, 'analysisResults', sessionId), {
            results: analysisData,
            savedAt: serverTimestamp(),
            sessionId,
          })
          console.log('✓ Results saved to Firestore:', sessionId)
        } catch (firestoreErr) {
          console.warn('Failed to save results to Firestore:', firestoreErr.message)
        }
      } else {
        console.warn('Skipping Firestore save: analysis data is incomplete')
      }

      setAnalysisStatus('Analysis complete!')
      setAnalysisComplete(true)

      console.log('✓ Dynamic analysis completed successfully')
      return analysisData
    } catch (err) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
      console.error('Analysis failed:', err)
      setError(`Analysis failed: ${err.message}`)
      setAnalysisStatus(null)
      return null
    } finally {
      setAnalysisRunning(false)
    }
  }, [])

  // ── Handle individual file upload ──
  const uploadFile = useCallback(async (fileType, file) => {
    setLoading(true)
    setError(null)
    setUploadProgress((prev) => ({ ...prev, [fileType]: 0 }))

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => ({
          ...prev,
          [fileType]: Math.min((prev[fileType] || 0) + 10, 90),
        }))
      }, 100)

      clearInterval(progressInterval)
      setUploadProgress((prev) => ({ ...prev, [fileType]: 100 }))
      if (fileType === 'qgisReport') {
        setFiles((prev) => ({ ...prev, qgisReport: [...(prev.qgisReport || []), file] }))
      } else {
        setFiles((prev) => ({ ...prev, [fileType]: file }))
      }

      setTimeout(() => setUploadProgress((prev) => ({ ...prev, [fileType]: 0 })), 1000)
      return { fileName: file.name, fileSize: file.size, uploaded: true }
    } catch (err) {
      setError(err.message)
      setUploadProgress((prev) => ({ ...prev, [fileType]: 0 }))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Clear file ──
  const clearFile = useCallback((fileType, filename = null) => {
    if (fileType === 'qgisReport') {
      setFiles((prev) => ({
        ...prev,
        qgisReport: filename
          ? (prev.qgisReport || []).filter(f => f.name !== filename)
          : [],
      }))
    } else {
      setFiles((prev) => ({ ...prev, [fileType]: null }))
      setUploadProgress((prev) => ({ ...prev, [fileType]: 0 }))
    }
  }, [])

  // ── Load demo data (from static JSON) ──
  const loadDemoData = useCallback(async () => {
    const result = await loadAnalysisResults()
    return result !== null
  }, [loadAnalysisResults])

  // ── Clear all data (files + results) ──
  const emptyState = {
    summary: null, shoreline: [], timeSeries: [], statisticalTests: [],
    thresholds: [], thresholdComparison: [], rfModel: null, hmmModel: null, xgbModel: null,
    sarimaDiagnostics: [], sarimaForecasts: {},
    hindcast: null, monteCarlo: null, retreatPredictions: [],
    transectVulnerability: null, forecastSkill: null, monthlyRisk: [],
    horizonFeatures: [], erosionPredictions: [], forecastOverview: null, forecasts: null,
    scatter: [], correlation: null, pca: [], forcingRegimes: [], boxplot: [],
    roc: null, modelComparison: [], yearlyShoreline: [], isLegacyFormat: false,
    threeClassRecognition: null, threeClassThresholds: [], threeClassForecasts: null,
    csvOutputs: {},
  }

  const clearAllData = useCallback(() => {
    setFiles({ qgisReport: [], currentData: null, waveData: null, windData: null })
    setData(emptyState)
    setRawAnalysisData(null)
    setDataLoaded(false)
    setAnalysisStatus(null)
    setError(null)
  }, [])

  // ── Clear analysis results only (keep uploaded files) ──
  const clearAnalysis = useCallback(async () => {
    setData(emptyState)
    setRawAnalysisData(null)
    setDataLoaded(false)
    setAnalysisStatus(null)
    setError(null)
    // Also clear server-side results so next load doesn't re-fetch old data
    if (backendAvailable) {
      try { await api.clearResults() } catch { /* ignore */ }
    }
  }, [backendAvailable])

  // ── Summary stats ──
  const getSummaryStats = useCallback(() => {
    if (data.summary) return data.summary
    if (data.shoreline?.length) {
      const shoreline = data.shoreline
      const eroding = shoreline.filter(d => d.Erosion_Binary === 1 || d.NSM < 0).length
      return {
        totalTransects: shoreline.length,
        erodingTransects: eroding,
        erosionRate: ((eroding / shoreline.length) * 100).toFixed(1),
        meanNSM: (shoreline.reduce((sum, d) => sum + (d.NSM || 0), 0) / shoreline.length).toFixed(2),
      }
    }
    return null
  }, [data])

  const value = {
    files,
    data,
    rawAnalysisData,
    loading,
    error,
    uploadProgress,
    dataLoaded,
    // Methods
    uploadFile,
    clearFile,
    loadDemoData,
    loadAnalysisResults,
    clearAllData,
    clearAnalysis,
    getSummaryStats,
    // NEW: dynamic analysis execution
    runAnalysis,
    analysisRunning,
    analysisStatus,
    analysisComplete,
    setAnalysisComplete,
    progressStep,
    backendAvailable,
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export default DataContext
