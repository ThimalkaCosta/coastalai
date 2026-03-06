import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '../api'

const MorphDataContext = createContext()

export function MorphDataProvider({ children }) {
  // File upload states
  const [files, setFiles] = useState({
    events: null,
    evaluation: null,
    envFiles: [],
  })

  // Parsed data state
  const [data, setData] = useState({
    hmmThresholds: null,
    thresholdComparison: null,
    stateMeans: null,
    transitionMatrix: null,
    stateDistribution: null,
    erosionState: null,
    regimeStability: null,
    seasonalAlignment: null,
    finalStateDominance: null,
    cvi: null,
    annualData: null,
    forecasts: null,
    forecastCvi: null,
    envSummary: null,
    stationarity: null,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState({})
  const [dataLoaded, setDataLoaded] = useState(false)
  const [analysisRunning, setAnalysisRunning] = useState(false)
  const [analysisStatus, setAnalysisStatus] = useState(null)
  const [backendAvailable, setBackendAvailable] = useState(null)

  // Check backend on mount
  useEffect(() => {
    api.health().then(setBackendAvailable)
  }, [])

  // ── Load morphological results ──
  const loadResults = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let resultData

      if (backendAvailable) {
        try {
          resultData = await api.morphGetResults()
        } catch {
          // fall through to local
        }
      }

      if (!resultData) {
        const response = await fetch('/data/morph_analysis_results.json')
        if (!response.ok) {
          throw new Error('No morphological results found. Upload data and run analysis.')
        }
        resultData = await response.json()
      }

      setData(resultData)
      setDataLoaded(true)
      return resultData
    } catch (err) {
      console.warn('Could not load morphological results:', err.message)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [backendAvailable])

  // Auto-load on mount
  useEffect(() => {
    if (backendAvailable !== null) {
      loadResults()
    }
  }, [backendAvailable, loadResults])

  // ── Run analysis ──
  const runAnalysis = useCallback(async (uploadedFiles) => {
    const filesToUse = uploadedFiles || files
    if (!filesToUse.events || !filesToUse.evaluation || !filesToUse.envFiles?.length) {
      setError('Please upload events, evaluation, and environmental CSV files.')
      return null
    }

    setAnalysisRunning(true)
    setAnalysisStatus('Uploading files to server…')
    setError(null)

    try {
      setAnalysisStatus('Executing morphological analysis notebook…')
      const resultData = await api.morphAnalyze(filesToUse)

      setAnalysisStatus('Processing results…')
      setData(resultData)
      setDataLoaded(true)
      setAnalysisStatus('Morphological analysis complete!')
      return resultData
    } catch (err) {
      console.error('Morphological analysis failed:', err)
      setError(`Analysis failed: ${err.message}`)
      setAnalysisStatus(null)
      return null
    } finally {
      setAnalysisRunning(false)
    }
  }, [files])

  // ── Upload individual file ──
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

      if (fileType === 'envFiles') {
        setFiles((prev) => ({ ...prev, envFiles: [...prev.envFiles, file] }))
      } else {
        setFiles((prev) => ({ ...prev, [fileType]: file }))
      }

      setTimeout(() => setUploadProgress((prev) => ({ ...prev, [fileType]: 0 })), 1000)
      return true
    } catch (err) {
      setError(err.message)
      setUploadProgress((prev) => ({ ...prev, [fileType]: 0 }))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Upload multiple env CSV files at once ──
  const uploadEnvFiles = useCallback((fileList) => {
    setFiles((prev) => ({ ...prev, envFiles: Array.from(fileList) }))
  }, [])

  // ── Clear file ──
  const clearFile = useCallback((fileType) => {
    if (fileType === 'envFiles') {
      setFiles((prev) => ({ ...prev, envFiles: [] }))
    } else {
      setFiles((prev) => ({ ...prev, [fileType]: null }))
    }
    setUploadProgress((prev) => ({ ...prev, [fileType]: 0 }))
  }, [])

  // ── Clear all ──
  const clearAllData = useCallback(() => {
    setFiles({ events: null, evaluation: null, envFiles: [] })
    setData({
      hmmThresholds: null, thresholdComparison: null, stateMeans: null,
      transitionMatrix: null, stateDistribution: null, erosionState: null,
      regimeStability: null, seasonalAlignment: null, finalStateDominance: null,
      cvi: null, annualData: null, forecasts: null, forecastCvi: null,
      envSummary: null, stationarity: null,
    })
    setDataLoaded(false)
    setAnalysisStatus(null)
    setError(null)
  }, [])

  const clearAnalysis = useCallback(async () => {
    setData({
      hmmThresholds: null, thresholdComparison: null, stateMeans: null,
      transitionMatrix: null, stateDistribution: null, erosionState: null,
      regimeStability: null, seasonalAlignment: null, finalStateDominance: null,
      cvi: null, annualData: null, forecasts: null, forecastCvi: null,
      envSummary: null, stationarity: null,
    })
    setDataLoaded(false)
    setAnalysisStatus(null)
    setError(null)
    if (backendAvailable) {
      try { await api.morphClearResults() } catch { /* ignore */ }
    }
  }, [backendAvailable])

  const value = {
    files, data, loading, error, uploadProgress, dataLoaded,
    uploadFile, uploadEnvFiles, clearFile,
    loadResults, clearAllData, clearAnalysis,
    runAnalysis, analysisRunning, analysisStatus, backendAvailable,
  }

  return (
    <MorphDataContext.Provider value={value}>
      {children}
    </MorphDataContext.Provider>
  )
}

export function useMorphData() {
  const context = useContext(MorphDataContext)
  if (!context) {
    throw new Error('useMorphData must be used within a MorphDataProvider')
  }
  return context
}

export default MorphDataContext
