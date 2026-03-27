import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import api from '../api'

const DataContext = createContext()

/** Normalise raw analysis JSON (from API or local file) into the shape the UI expects.
 *  Updated for the 4-method ensemble + advanced forecast notebook. */
function normaliseAnalysisData(analysisData) {
  return {
    summary: analysisData.summary || null,
    shoreline: analysisData.shoreline || [],
    timeSeries: analysisData.timeSeries || [],
    statisticalTests: analysisData.statisticalTests || [],
    thresholds: analysisData.thresholds || [],
    rfModel: analysisData.rfModel || null,
    sarimaDiagnostics: analysisData.sarimaDiagnostics || [],
    sarimaForecasts: analysisData.sarimaForecasts || {},
    hindcast: analysisData.hindcast || null,
    monteCarlo: analysisData.monteCarlo || null,
    retreatPredictions: analysisData.retreatPredictions || [],
    transectVulnerability: analysisData.transectVulnerability || null,
    forecastSkill: analysisData.forecastSkill || null,
    monthlyRisk: analysisData.monthlyRisk || [],
    horizonFeatures: analysisData.horizonFeatures || [],
    erosionPredictions: analysisData.erosionPredictions || [],
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
    summary: null,
    shoreline: [],
    timeSeries: [],
    statisticalTests: [],
    thresholds: [],
    rfModel: null,
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

  // Progress tracking (persists across navigation)
  const [progressStep, setProgressStep] = useState(0)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const progressIntervalRef = useRef(null)

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
        const contentType = response.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
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
    setAnalysisComplete(false)
    setProgressStep(0)
    setAnalysisStatus('Uploading files to server…')
    setError(null)

    // Advance progress step every 16s (10 steps × ~16s ≈ ~2.5 min typical)
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    progressIntervalRef.current = setInterval(() => {
      setProgressStep((prev) => Math.min(prev + 1, 9)) // 0-9 for 10 steps
    }, 16_000)

    try {
      setAnalysisStatus('Executing analysis notebook – this may take several minutes…')
      const analysisData = await api.analyze(filesToUse)

      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
      setProgressStep(9) // mark all steps done

      setAnalysisStatus('Processing results…')
      const normalised = normaliseAnalysisData(analysisData)
      setData(normalised)
      setDataLoaded(true)
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

  // ── Clear all data (files + results) ──
  const clearAllData = useCallback(() => {
    setFiles({ qgisReport: null, currentData: null, waveData: null, windData: null })
    setData({
      summary: null, shoreline: [], timeSeries: [], statisticalTests: [],
      thresholds: [], rfModel: null, sarimaDiagnostics: [], sarimaForecasts: {},
      hindcast: null, monteCarlo: null, retreatPredictions: [],
      transectVulnerability: null, forecastSkill: null, monthlyRisk: [],
      horizonFeatures: [], erosionPredictions: [],
    })
    setDataLoaded(false)
    setAnalysisStatus(null)
    setError(null)
  }, [])

  // ── Clear analysis results only (keep uploaded files) ──
  const clearAnalysis = useCallback(async () => {
    setData({
      summary: null, shoreline: [], timeSeries: [], statisticalTests: [],
      thresholds: [], rfModel: null, sarimaDiagnostics: [], sarimaForecasts: {},
      hindcast: null, monteCarlo: null, retreatPredictions: [],
      transectVulnerability: null, forecastSkill: null, monthlyRisk: [],
      horizonFeatures: [], erosionPredictions: [],
    })
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
