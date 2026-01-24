import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import Papa from 'papaparse'

const DataContext = createContext()

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
    models: {
      rf: null,
      gmm: null,
      xgb: null,
    },
  })
  
  // Loading and error states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState({})
  const [dataLoaded, setDataLoaded] = useState(false)

  // Load actual analysis results from JSON file
  const loadAnalysisResults = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/data/analysis_results.json')
      if (!response.ok) {
        throw new Error('Analysis results not found. Please run the notebook first.')
      }
      
      const analysisData = await response.json()
      
      // Transform feature importance data to match expected format (lowercase keys)
      const transformFeatureImportance = (data) => {
        if (!data) return []
        return data.map(item => ({
          feature: item.Feature || item.feature,
          importance: item.Importance || item.importance,
          fullName: item.Feature || item.feature,
        }))
      }
      
      // Transform SHAP values to match expected format
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
      
      // Transform RF model data
      const rfData = analysisData.models?.rf ? {
        featureImportance: transformFeatureImportance(analysisData.models.rf.featureImportance),
        metrics: {
          accuracy: analysisData.models.rf.metrics?.accuracy || 0,
          cvAccuracy: analysisData.models.rf.metrics?.cvAccuracy || 0,
          cvStd: analysisData.models.rf.metrics?.cvStd || 0,
          f1Score: analysisData.models.rf.metrics?.f1Score || analysisData.models.rf.metrics?.cvAccuracy || 0,
          oobScore: analysisData.models.rf.metrics?.oobScore || analysisData.models.rf.metrics?.cvAccuracy || 0,
          nEstimators: analysisData.models.rf.metrics?.nEstimators || 100,
          precision: analysisData.models.rf.metrics?.precision || analysisData.models.rf.metrics?.accuracy || 0,
          recall: analysisData.models.rf.metrics?.recall || analysisData.models.rf.metrics?.accuracy || 0,
        },
        thresholds: analysisData.models.rf.thresholds || {},
      } : null
      
      // Transform XGB model data  
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
      
      // Transform GMM model data
      const gmmData = analysisData.models?.gmm ? {
        stateDistribution: analysisData.models.gmm.stateDistribution || [],
        stateMeans: analysisData.models.gmm.stateMeans || {},
        probabilityData: analysisData.models.gmm.probabilityData || [],
        metrics: {
          nStates: analysisData.models.gmm.metrics?.nStates || 3,
          accuracy: analysisData.models.gmm.metrics?.accuracy || 0,
          silhouetteScore: analysisData.models.gmm.metrics?.silhouetteScore || 0,
        },
        thresholds: analysisData.models.gmm.thresholds || {},
      } : null
      
      setData({
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
        models: {
          rf: rfData,
          gmm: gmmData,
          xgb: xgbData,
        },
      })
      
      setDataLoaded(true)
      console.log('✓ Analysis results loaded successfully', { rf: rfData, gmm: gmmData, xgb: xgbData })
      return analysisData
    } catch (err) {
      console.warn('Could not load analysis results:', err.message)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-load analysis results on mount
  useEffect(() => {
    loadAnalysisResults()
  }, [loadAnalysisResults])

  // Parse CSV file
  const parseCSV = useCallback((file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(results.errors[0].message))
          } else {
            resolve(results.data)
          }
        },
        error: (error) => reject(error),
      })
    })
  }, [])

  // Handle file upload
  const uploadFile = useCallback(async (fileType, file) => {
    setLoading(true)
    setError(null)
    setUploadProgress((prev) => ({ ...prev, [fileType]: 0 }))

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => ({
          ...prev,
          [fileType]: Math.min((prev[fileType] || 0) + 10, 90),
        }))
      }, 100)

      let parsedData = null

      // Check if it's a CSV or NetCDF file
      if (file.name.endsWith('.csv')) {
        // Parse CSV file
        parsedData = await parseCSV(file)
      } else if (file.name.endsWith('.nc')) {
        // For NetCDF files, we just store the file reference
        // NetCDF processing happens in the Python notebook
        parsedData = {
          fileName: file.name,
          fileSize: file.size,
          fileType: 'NetCDF',
          uploaded: true,
        }
      }

      clearInterval(progressInterval)
      setUploadProgress((prev) => ({ ...prev, [fileType]: 100 }))

      // Store file and parsed data
      setFiles((prev) => ({ ...prev, [fileType]: file }))
      
      // Map file type to data key (only for CSV files)
      const dataKeyMap = {
        qgisReport: 'shoreline',
        thresholds: 'thresholds',
        annualFeatures: 'annualFeatures',
      }
      
      if (dataKeyMap[fileType] && file.name.endsWith('.csv')) {
        setData((prev) => ({ ...prev, [dataKeyMap[fileType]]: parsedData }))
      }

      setTimeout(() => {
        setUploadProgress((prev) => ({ ...prev, [fileType]: 0 }))
      }, 1000)

      return parsedData
    } catch (err) {
      setError(err.message)
      setUploadProgress((prev) => ({ ...prev, [fileType]: 0 }))
      throw err
    } finally {
      setLoading(false)
    }
  }, [parseCSV])

  // Clear uploaded file
  const clearFile = useCallback((fileType) => {
    setFiles((prev) => ({ ...prev, [fileType]: null }))
    setUploadProgress((prev) => ({ ...prev, [fileType]: 0 }))
  }, [])

  // Load demo data - now loads from the actual JSON file
  const loadDemoData = useCallback(async () => {
    const result = await loadAnalysisResults()
    return result !== null
  }, [loadAnalysisResults])

  // Clear all data
  const clearAllData = useCallback(() => {
    setFiles({
      qgisReport: null,
      currentData: null,
      waveData: null,
      windData: null,
    })
    setData({
      shoreline: null,
      thresholds: null,
      processed: null,
      summary: null,
      scatter: null,
      correlation: null,
      pca: null,
      forcingRegimes: null,
      roc: null,
      models: {
        rf: null,
        gmm: null,
        xgb: null,
      },
    })
    setDataLoaded(false)
  }, [])

  // Get summary statistics
  const getSummaryStats = useCallback(() => {
    if (data.summary) {
      return data.summary
    }
    
    // Calculate from shoreline data if summary not available
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
    uploadFile,
    clearFile,
    loadDemoData,
    loadAnalysisResults,
    clearAllData,
    getSummaryStats,
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
