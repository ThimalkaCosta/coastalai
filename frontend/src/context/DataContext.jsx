import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import Papa from 'papaparse'
import api from '../api'

const DataContext = createContext()

// ── Helper transforms (shared between local JSON & API results) ──
const transformFeatureImportance = (data) => {
  if (!data) return []
  return data.map(item => ({
    feature: item.Feature || item.feature,
    importance: item.Importance || item.importance,
    fullName: item.Feature || item.feature,
  }))
}

const transformShapValues = (data) => {
  if (!data) return []
  return data.map(item => ({
    feature: item.Feature || item.feature,
    shap: item.Mean_SHAP || item.meanShap || item.shap || 0,
    importance: Math.abs(item.Mean_SHAP || item.meanShap || item.shap || 0),
    direction: (item.Mean_SHAP || item.meanShap || item.shap || 0) >= 0 ? 'positive' : 'negative',
    impact: (item.Mean_SHAP || item.meanShap || item.shap || 0) >= 0 ? 'Increases erosion risk' : 'Decreases erosion risk',
  }))
}

/** Normalise raw analysis JSON (from API or local file) into the shape the UI expects. */
function normaliseAnalysisData(analysisData) {
  const rfData = analysisData.models?.rf ? {
    featureImportance: transformFeatureImportance(analysisData.models.rf.featureImportance),
    metrics: {
      accuracy: analysisData.models.rf.metrics?.accuracy || 0,
      cvAccuracy: analysisData.models.rf.metrics?.cvAccuracy || 0,
      cvStd: analysisData.models.rf.metrics?.cvStd || 0,
      f1Score: analysisData.models.rf.metrics?.f1Score || 0,
      oobScore: analysisData.models.rf.metrics?.oobScore || 0,
      nEstimators: analysisData.models.rf.metrics?.nEstimators || 100,
      precision: analysisData.models.rf.metrics?.precision || 0,
      recall: analysisData.models.rf.metrics?.recall || 0,
      rocAuc: analysisData.models.rf.metrics?.rocAuc || 0,
    },
    config: analysisData.models.rf.config || {},
    thresholds: analysisData.models.rf.thresholds || {},
  } : null

  const xgbData = analysisData.models?.xgb ? {
    featureImportance: transformFeatureImportance(analysisData.models.xgb.featureImportance),
    shapValues: transformShapValues(analysisData.models.xgb.shapValues),
    metrics: {
      accuracy: analysisData.models.xgb.metrics?.accuracy || 0,
      cvAccuracy: analysisData.models.xgb.metrics?.cvAccuracy || 0,
      cvStd: analysisData.models.xgb.metrics?.cvStd || 0,
      f1Score: analysisData.models.xgb.metrics?.f1Score || analysisData.models.xgb.metrics?.cvAccuracy || 0,
      auc: analysisData.models.xgb.metrics?.auc || analysisData.models.xgb.metrics?.accuracy || 0,
      precision: analysisData.models.xgb.metrics?.precision || analysisData.models.xgb.metrics?.accuracy || 0,
      recall: analysisData.models.xgb.metrics?.recall || analysisData.models.xgb.metrics?.accuracy || 0,
      nEstimators: analysisData.models.xgb.metrics?.nEstimators || 100,
      maxDepth: analysisData.models.xgb.metrics?.maxDepth || 6,
      learningRate: analysisData.models.xgb.metrics?.learningRate || 0.1,
    },
    thresholds: analysisData.models.xgb.thresholds || {},
  } : null

  const gmmData = analysisData.models?.gmm ? {
    stateDistribution: analysisData.models.gmm.stateDistribution || [],
    stateMeans: analysisData.models.gmm.stateMeans || {},
    stateCentroids: analysisData.models.gmm.stateCentroids || {},
    componentSelection: analysisData.models.gmm.componentSelection || [],
    erosionState: analysisData.models.gmm.erosionState ?? null,
    probabilityData: analysisData.models.gmm.probabilityData || [],
    metrics: {
      nStates: analysisData.models.gmm.metrics?.nStates || 3,
      accuracy: analysisData.models.gmm.metrics?.accuracy || 0,
      silhouetteScore: analysisData.models.gmm.metrics?.silhouetteScore || 0,
      logLikelihood: analysisData.models.gmm.metrics?.logLikelihood || 0,
      aic: analysisData.models.gmm.metrics?.aic || 0,
      bic: analysisData.models.gmm.metrics?.bic || 0,
      converged: analysisData.models.gmm.metrics?.converged ?? false,
    },
    thresholds: analysisData.models.gmm.thresholds || {},
  } : null

  return {
    shoreline: analysisData.shoreline,
    thresholds: analysisData.thresholds,
    processed: analysisData.timeSeries,
    summary: analysisData.summary,
    scatter: analysisData.scatter,
    correlation: analysisData.correlation,
    pca: analysisData.pca,
    forcingRegimes: analysisData.forcingRegimes,
    roc: analysisData.roc,
    boxplot: analysisData.boxplot,
    yearlyShoreline: analysisData.yearlyShoreline,
    models: { rf: rfData, gmm: gmmData, xgb: xgbData },
  }
}

export function DataProvider({ children }) {
  // File upload states
  const [files, setFiles] = useState({
    qgisReport: null,
    currentData: null,
    waveData: null,
    windData: null,
  })

  // Parsed data states
  const [data, setData] = useState({
    shoreline: null,
    thresholds: null,
    processed: null,
    summary: null,
    scatter: null,
    correlation: null,
    pca: null,
    forcingRegimes: null,
    roc: null,
    boxplot: null,
    yearlyShoreline: null,
    models: { rf: null, gmm: null, xgb: null },
  })

  // Loading / error / progress states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState({})
  const [dataLoaded, setDataLoaded] = useState(false)

  // Analysis execution state (exposed so the UI can show real-time status)
  const [analysisRunning, setAnalysisRunning] = useState(false)
  const [analysisStatus, setAnalysisStatus] = useState(null) // string message
  const [backendAvailable, setBackendAvailable] = useState(null) // null = unknown

  // ── Check backend availability on mount ──
  useEffect(() => {
    api.health().then(setBackendAvailable)
  }, [])

  // ── Load analysis results (local JSON fallback or API) ──
  const loadAnalysisResults = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let analysisData

      // Try backend API first (if available)
      if (backendAvailable) {
        try {
          analysisData = await api.getResults()
        } catch {
          // fall through to local JSON
        }
      }

      // Fallback: load static JSON from public/data/
      if (!analysisData) {
        const response = await fetch('/data/analysis_results.json')
        if (!response.ok) {
          throw new Error('Analysis results not found. Please upload data and run the analysis.')
        }
        analysisData = await response.json()
      }

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
  const runAnalysis = useCallback(async (uploadedFiles) => {
    const filesToUse = uploadedFiles || files
    const allReady = filesToUse.qgisReport && filesToUse.waveData && filesToUse.windData && filesToUse.currentData

    if (!allReady) {
      setError('Please upload all four required files before running analysis.')
      return null
    }

    setAnalysisRunning(true)
    setAnalysisStatus('Uploading files to server…')
    setError(null)

    try {
      setAnalysisStatus('Executing analysis notebook – this may take several minutes…')
      const analysisData = await api.analyze(filesToUse)

      setAnalysisStatus('Processing results…')
      const normalised = normaliseAnalysisData(analysisData)
      setData(normalised)
      setDataLoaded(true)
      setAnalysisStatus('Analysis complete!')

      console.log('✓ Dynamic analysis completed successfully')
      return analysisData
    } catch (err) {
      console.error('Analysis failed:', err)
      setError(`Analysis failed: ${err.message}`)
      setAnalysisStatus(null)
      return null
    } finally {
      setAnalysisRunning(false)
    }
  }, [files])

  // ── Parse CSV ──
  const parseCSV = useCallback((file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) reject(new Error(results.errors[0].message))
          else resolve(results.data)
        },
        error: (error) => reject(error),
      })
    })
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

      let parsedData = null
      if (file.name.endsWith('.csv')) {
        parsedData = await parseCSV(file)
      } else if (file.name.endsWith('.nc')) {
        parsedData = { fileName: file.name, fileSize: file.size, fileType: 'NetCDF', uploaded: true }
      }

      clearInterval(progressInterval)
      setUploadProgress((prev) => ({ ...prev, [fileType]: 100 }))
      setFiles((prev) => ({ ...prev, [fileType]: file }))

      const dataKeyMap = { qgisReport: 'shoreline', thresholds: 'thresholds', annualFeatures: 'annualFeatures' }
      if (dataKeyMap[fileType] && file.name.endsWith('.csv')) {
        setData((prev) => ({ ...prev, [dataKeyMap[fileType]]: parsedData }))
      }

      setTimeout(() => setUploadProgress((prev) => ({ ...prev, [fileType]: 0 })), 1000)
      return parsedData
    } catch (err) {
      setError(err.message)
      setUploadProgress((prev) => ({ ...prev, [fileType]: 0 }))
      throw err
    } finally {
      setLoading(false)
    }
  }, [parseCSV])

  // ── Clear file ──
  const clearFile = useCallback((fileType) => {
    setFiles((prev) => ({ ...prev, [fileType]: null }))
    setUploadProgress((prev) => ({ ...prev, [fileType]: 0 }))
  }, [])

  // ── Load demo data (from static JSON) ──
  const loadDemoData = useCallback(async () => {
    const result = await loadAnalysisResults()
    return result !== null
  }, [loadAnalysisResults])

  // ── Clear all data ──
  const clearAllData = useCallback(() => {
    setFiles({ qgisReport: null, currentData: null, waveData: null, windData: null })
    setData({
      shoreline: null, thresholds: null, processed: null, summary: null,
      scatter: null, correlation: null, pca: null, forcingRegimes: null,
      roc: null, boxplot: null, yearlyShoreline: null,
      models: { rf: null, gmm: null, xgb: null },
    })
    setDataLoaded(false)
    setAnalysisStatus(null)
  }, [])

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
    getSummaryStats,
    // NEW: dynamic analysis execution
    runAnalysis,
    analysisRunning,
    analysisStatus,
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
