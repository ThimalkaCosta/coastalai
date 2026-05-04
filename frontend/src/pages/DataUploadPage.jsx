import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  Upload,
  FileSpreadsheet,
  Waves,
  Wind,
  Droplets,
  ArrowRight,
  CheckCircle,
  Info,
  Play,
  Loader2,
  Server,
  XCircle,
  Trash2,
  BarChart3,
  ChevronLeft,
  FileText,
  X,
  FolderOpen,
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import NotebookResultsView from '../components/results/NotebookResultsView'
import { useData } from '../context/DataContext'

const PROGRESS_STEPS = [
  'Uploading files to server…',
  'Loading DSAS shoreline CSV files…',
  'Merging multi-year annual shoreline records…',
  'Engineering environmental features…',
  'Building 3-class change labels (erosion / stable / accretion)…',
  'Pattern recognition & LOOCV cross-validation…',
  'Detecting meteorological driver thresholds…',
  'Computing threshold forecasts (H6 – H24)…',
  'Saving results, figures & CSV outputs…',
  'Analysis complete – preparing dashboard…',
]

const NC_SECTIONS = [
  {
    id: 'currentData',
    title: 'Current Data',
    description: 'Ocean current velocity measurements',
    icon: Droplets,
    expectedFile: 'Global Ocean Physics Reanalysis(current_data)_2009_2024.nc',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'waveData',
    title: 'Wave Data',
    description: 'Wave height and period reanalysis',
    icon: Waves,
    expectedFile: 'Global_Ocean_Waves_Reanalysis_2009_2024.nc',
    color: 'from-violet-500 to-purple-500',
  },
  {
    id: 'windData',
    title: 'Wind Data',
    description: 'Wind speed and stress measurements',
    icon: Wind,
    expectedFile: 'Global Ocean Monthly Mean Sea Surface Wind and Stress_2009_2024.nc',
    color: 'from-orange-500 to-amber-500',
  },
]

function MultiCSVDropzone({ files, onAdd, onRemove }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      acceptedFiles.forEach((file) => onAdd(file))
    },
    [onAdd]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    multiple: true,
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-ocean-500 bg-ocean-50'
            : 'border-coastal-200 hover:border-ocean-300 hover:bg-coastal-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isDragActive ? 'bg-ocean-100' : 'bg-coastal-100'
            }`}
          >
            <FolderOpen
              className={`w-6 h-6 ${isDragActive ? 'text-ocean-500' : 'text-coastal-400'}`}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-coastal-800">
              {isDragActive ? 'Drop CSV files here' : 'Drop DSAS year-pair CSV files here'}
            </p>
            <p className="text-xs text-coastal-400 mt-1">
              Upload all year-pair files — e.g. 12-13-stat.csv, 13-14-stat.csv … 23-24-stat.csv
            </p>
          </div>
          <span className="text-xs text-ocean-600 font-semibold bg-ocean-50 border border-ocean-100 px-3 py-1 rounded-full">
            Click to browse or drag multiple files at once
          </span>
        </div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <p className="text-xs font-semibold text-coastal-500 mb-2">
              {files.length} file{files.length !== 1 ? 's' : ''} selected:
            </p>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {files.map((file) => (
                  <motion.div
                    key={file.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs"
                  >
                    <FileText className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    <span className="text-emerald-800 font-medium">{file.name}</span>
                    <span className="text-emerald-400">({(file.size / 1024).toFixed(0)}KB)</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemove(file.name)
                      }}
                      className="text-emerald-400 hover:text-red-500 transition-colors ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NcFileCard({ section, file, onUpload, onClear }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) onUpload(section.id, acceptedFiles[0])
    },
    [onUpload, section.id]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/x-netcdf': ['.nc'],
      'application/netcdf': ['.nc'],
      'application/octet-stream': ['.nc'],
    },
    maxFiles: 1,
  })

  const Icon = section.icon

  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-sm flex-shrink-0`}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <h4 className="font-semibold text-sm text-coastal-900">{section.title}</h4>
          <p className="text-[11px] text-coastal-400 truncate">{section.description}</p>
        </div>
      </div>

      <div className="flex-1">
        {file ? (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-emerald-800 truncate">{file.name}</p>
                <p className="text-[10px] text-emerald-500">
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            </div>
            <button
              onClick={onClear}
              className="text-emerald-400 hover:text-red-500 p-1 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all duration-200 text-center ${
              isDragActive
                ? 'border-ocean-400 bg-ocean-50'
                : 'border-coastal-200 hover:border-ocean-300 hover:bg-coastal-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-5 h-5 text-coastal-300 mx-auto mb-1.5" />
            <p className="text-xs text-coastal-400">
              <span className="text-ocean-600 font-medium">Click</span> or drag .nc file
            </p>
            <p className="text-[10px] text-coastal-300 mt-1 line-clamp-2 px-1">
              {section.expectedFile}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DataUploadPage() {
  const {
    files,
    uploadFile,
    clearFile,
    loadDemoData,
    data,
    runAnalysis,
    analysisRunning,
    analysisStatus,
    analysisComplete,
    setAnalysisComplete,
    progressStep,
    backendAvailable,
    clearAnalysis,
    error: contextError,
    rawAnalysisData,
  } = useData()

  const [showSuccess, setShowSuccess] = useState(false)
  const [localError, setLocalError] = useState(null)
  const [activeView, setActiveView] = useState('upload')

  const csvFiles = Array.isArray(files.qgisReport)
    ? files.qgisReport
    : files.qgisReport
    ? [files.qgisReport]
    : []

  const handleAddCsv = useCallback(
    (file) => {
      uploadFile('qgisReport', file)
    },
    [uploadFile]
  )

  const handleRemoveCsv = useCallback(
    (filename) => {
      clearFile('qgisReport', filename)
    },
    [clearFile]
  )

  const handleNcUpload = useCallback(
    (sectionId, file) => {
      uploadFile(sectionId, file)
    },
    [uploadFile]
  )

  const handleLoadDemo = () => {
    loadDemoData()
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleExecuteAnalysis = async () => {
    setLocalError(null)
    if (!backendAvailable) {
      setLocalError(
        'Backend server is not running. Start it with: cd backend && uvicorn main:app --reload'
      )
      return
    }
    try {
      const result = await runAnalysis()
      if (result) setActiveView('results')
    } catch (err) {
      setLocalError(err.message || 'Analysis execution failed')
    }
  }

  const handleClearAndReset = async () => {
    await clearAnalysis()
    setAnalysisComplete(false)
    setActiveView('upload')
  }

  const allFilesUploaded =
    csvFiles.length > 0 && files.waveData && files.windData && files.currentData
  const hasData = data.summary || data.thresholds?.length > 0
  const displayError = localError || contextError

  const ncReady = [files.waveData, files.windData, files.currentData].filter(Boolean).length

  // ── RESULTS VIEW ──
  if (activeView === 'results' && (hasData || analysisComplete)) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-b from-coastal-50 to-white">
          <section className="pt-6 pb-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveView('upload')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-coastal-600 bg-coastal-50 hover:bg-coastal-100 border border-coastal-200 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Upload
                  </button>
                  <div>
                    <h1 className="text-xl font-display font-bold text-coastal-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-ocean-500" />
                      Notebook Analysis Results
                    </h1>
                    <p className="text-xs text-coastal-500 mt-0.5">
                      All outputs from notebook.ipynb execution
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClearAndReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear & Re-upload
                </button>
              </div>
            </div>
          </section>
          <NotebookResultsView analysisData={rawAnalysisData || data} />
        </div>
      </PageTransition>
    )
  }

  // ── UPLOAD VIEW ──
  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-coastal-50 to-white">
        {/* Header */}
        <section className="pt-10 pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <div className="page-badge bg-ocean-50 text-ocean-600 border-ocean-100 mb-4">
                <Upload className="w-3.5 h-3.5" />
                Meteorological Threshold Analysis
              </div>
              <h1 className="section-title mb-3">Upload Data & Run Analysis</h1>
              <p className="section-subtitle">
                Upload your DSAS year-pair CSV reports and environmental NetCDF datasets, then run
                the analysis notebook to generate shoreline change classification and threshold
                detection results.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Backend Status */}
        <section className="pb-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`card p-4 flex items-center gap-3 ${
                backendAvailable === true
                  ? 'bg-emerald-50/80 border-emerald-200/60'
                  : backendAvailable === false
                  ? 'bg-amber-50/80 border-amber-200/60'
                  : 'bg-coastal-50/80 border-coastal-200/60'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  backendAvailable === true
                    ? 'bg-emerald-100'
                    : backendAvailable === false
                    ? 'bg-amber-100'
                    : 'bg-coastal-100'
                }`}
              >
                <Server
                  className={`w-4 h-4 ${
                    backendAvailable === true
                      ? 'text-emerald-600'
                      : backendAvailable === false
                      ? 'text-amber-600'
                      : 'text-coastal-400'
                  }`}
                />
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    backendAvailable === true
                      ? 'text-emerald-800'
                      : backendAvailable === false
                      ? 'text-amber-800'
                      : 'text-coastal-600'
                  }`}
                >
                  {backendAvailable === true
                    ? 'Analysis server is online – ready to process your data'
                    : backendAvailable === false
                    ? 'Analysis server offline – start it to enable dynamic analysis'
                    : 'Checking server status…'}
                </p>
                {backendAvailable === false && (
                  <p className="text-xs text-amber-600 mt-1">
                    Run:{' '}
                    <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">
                      cd backend &amp;&amp; uvicorn main:app --reload
                    </code>
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Step Indicator */}
        <section className="pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-2">
              {['Upload Files', 'Run Analysis', 'View Results'].map((step, i) => {
                const isActive =
                  (i === 0 && !allFilesUploaded) ||
                  (i === 1 && allFilesUploaded && !analysisComplete) ||
                  (i === 2 && analysisComplete)
                const isComplete =
                  (i === 0 && allFilesUploaded) || (i === 1 && analysisComplete)
                return (
                  <div key={step} className="flex items-center gap-2">
                    {i > 0 && (
                      <div
                        className={`w-12 h-0.5 ${
                          isComplete || isActive ? 'bg-ocean-400' : 'bg-coastal-200'
                        }`}
                      />
                    )}
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-ocean-100 text-ocean-700 ring-2 ring-ocean-300'
                          : isComplete
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-coastal-100 text-coastal-400'
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-current/10 flex items-center justify-center text-[10px]">
                          {i + 1}
                        </span>
                      )}
                      {step}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Upload Grid */}
        <section className="pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {/* DSAS CSV Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                    <FileSpreadsheet className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-display font-bold text-base text-coastal-900">
                        DSAS Shoreline CSV Files
                      </h3>
                      {csvFiles.length > 0 && (
                        <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          {csvFiles.length} file{csvFiles.length !== 1 ? 's' : ''} ready
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-coastal-400 mt-0.5">
                      Upload all year-pair stat files — 12-13-stat.csv through 23-24-stat.csv
                    </p>
                  </div>
                </div>
                <MultiCSVDropzone
                  files={csvFiles}
                  onAdd={handleAddCsv}
                  onRemove={handleRemoveCsv}
                />
              </div>
            </motion.div>

            {/* NetCDF Files */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-5 h-px bg-coastal-300" />
                <p className="text-sm font-bold text-coastal-700 whitespace-nowrap">
                  Environmental Data (NetCDF)
                </p>
                {ncReady > 0 && (
                  <span className="text-[11px] font-semibold bg-coastal-100 text-coastal-500 px-2 py-0.5 rounded-full">
                    {ncReady}/3 uploaded
                  </span>
                )}
                <div className="flex-1 h-px bg-coastal-100" />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {NC_SECTIONS.map((section, index) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + index * 0.05 }}
                  >
                    <NcFileCard
                      section={section}
                      file={files[section.id]}
                      onUpload={handleNcUpload}
                      onClear={() => clearFile(section.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Action Panel */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card p-6"
            >
              <div className="max-w-lg mx-auto text-center">

                {/* Running */}
                {analysisRunning && (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ocean-500 to-primary-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <h3 className="text-xl font-display font-semibold text-coastal-900 mb-2">
                      Analysing Data…
                    </h3>
                    <p className="text-coastal-600 mb-6">
                      The notebook is running on the server. This typically takes 2–5 minutes.
                    </p>
                    <div className="text-left max-w-sm mx-auto space-y-3 mb-6">
                      {PROGRESS_STEPS.map((step, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          {i < progressStep ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          ) : i === progressStep ? (
                            <Loader2 className="w-4 h-4 text-ocean-600 animate-spin flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-coastal-300 flex-shrink-0" />
                          )}
                          <span className={i <= progressStep ? 'text-coastal-800' : 'text-coastal-400'}>
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="w-full bg-coastal-100 rounded-full h-2 mb-4">
                      <motion.div
                        className="bg-gradient-to-r from-ocean-500 to-primary-500 h-2 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{
                          width: `${((progressStep + 1) / PROGRESS_STEPS.length) * 100}%`,
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    {analysisStatus && (
                      <p className="text-xs text-ocean-600 animate-pulse">{analysisStatus}</p>
                    )}
                  </>
                )}

                {/* Complete */}
                {!analysisRunning && analysisComplete && (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-display font-semibold text-coastal-900 mb-2">
                      Analysis Complete!
                    </h3>
                    <p className="text-coastal-600 mb-6">
                      All results, charts, and CSV outputs are ready to explore.
                    </p>
                    <button
                      onClick={() => setActiveView('results')}
                      className="btn-primary w-full justify-center mb-3"
                    >
                      <BarChart3 className="w-5 h-5" />
                      View Results
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleClearAndReset}
                      className="btn-secondary w-full justify-center text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear & Re-upload
                    </button>
                  </>
                )}

                {/* Error */}
                {!analysisRunning && displayError && !analysisComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-red-800 mb-1">Execution Error</h4>
                        <p className="text-sm text-red-700">{displayError}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Ready to run */}
                {!analysisRunning && !analysisComplete && allFilesUploaded && (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ocean-500 to-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-display font-semibold text-coastal-900 mb-2">
                      Ready – {csvFiles.length} CSV + 3 NetCDF files uploaded
                    </h3>
                    <p className="text-coastal-600 mb-6">
                      Click below to run the analysis. The system will classify shoreline changes
                      and detect meteorological thresholds automatically.
                    </p>
                    <button
                      onClick={handleExecuteAnalysis}
                      disabled={analysisRunning || !backendAvailable}
                      className="btn-primary w-full mb-4 justify-center disabled:opacity-50 text-base py-3"
                    >
                      <Play className="w-5 h-5" />
                      Run Analysis
                    </button>
                    {!backendAvailable && (
                      <p className="text-xs text-amber-600 mb-4">
                        Start the backend server first to enable analysis.
                      </p>
                    )}
                  </>
                )}

                {/* Previous results available */}
                {!analysisRunning && !analysisComplete && hasData && (
                  <div className="border-t border-coastal-200 pt-4 mt-4">
                    <p className="text-sm text-coastal-500 mb-3">Previous results available:</p>
                    <button
                      onClick={() => setActiveView('results')}
                      className="btn-secondary w-full justify-center"
                    >
                      <BarChart3 className="w-4 h-4" />
                      View Previous Results
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Upload checklist (shown before all files are ready) */}
                {!analysisRunning && !analysisComplete && !allFilesUploaded && !hasData && (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-coastal-100 flex items-center justify-center mx-auto mb-6">
                      <FileSpreadsheet className="w-8 h-8 text-coastal-400" />
                    </div>
                    <h3 className="text-xl font-display font-semibold text-coastal-900 mb-2">
                      Upload Your Data
                    </h3>
                    <p className="text-coastal-600 mb-5">
                      Upload all DSAS CSV files and 3 NetCDF files above, then click Run Analysis.
                    </p>
                    <div className="grid grid-cols-2 gap-2.5 text-left">
                      <div
                        className={`p-3 rounded-xl border ${
                          csvFiles.length > 0
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-coastal-50 border-coastal-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {csvFiles.length > 0 ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-coastal-300 flex-shrink-0" />
                          )}
                          <span
                            className={`text-xs font-medium ${
                              csvFiles.length > 0 ? 'text-emerald-700' : 'text-coastal-500'
                            }`}
                          >
                            DSAS CSV ({csvFiles.length} files)
                          </span>
                        </div>
                      </div>
                      {[
                        ['waveData', 'Wave NetCDF'],
                        ['windData', 'Wind NetCDF'],
                        ['currentData', 'Current NetCDF'],
                      ].map(([key, label]) => (
                        <div
                          key={key}
                          className={`p-3 rounded-xl border ${
                            files[key]
                              ? 'bg-emerald-50 border-emerald-200'
                              : 'bg-coastal-50 border-coastal-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {files[key] ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-coastal-300 flex-shrink-0" />
                            )}
                            <span
                              className={`text-xs font-medium ${
                                files[key] ? 'text-emerald-700' : 'text-coastal-500'
                              }`}
                            >
                              {label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Demo data link */}
                {!analysisRunning && !analysisComplete && (
                  <div className="border-t border-coastal-200 pt-4 mt-6">
                    <div className="flex items-center gap-3 justify-center">
                      <Info className="w-4 h-4 text-ocean-500 flex-shrink-0" />
                      <span className="text-sm text-coastal-500">Don't have data?</span>
                      <button
                        onClick={handleLoadDemo}
                        className="text-sm text-ocean-600 hover:text-ocean-800 font-semibold underline underline-offset-2"
                      >
                        Load Demo Data
                      </button>
                    </div>
                    {showSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-3 bg-emerald-100 text-emerald-700 rounded-lg text-sm flex items-center gap-2 justify-center"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Demo data loaded!
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
