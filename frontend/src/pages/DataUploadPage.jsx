import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Upload,
  FileSpreadsheet,
  Waves,
  Wind,
  Droplets,
  MapPin,
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
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import FileUpload from '../components/upload/FileUpload'
import NotebookResultsView from '../components/results/NotebookResultsView'
import { useData } from '../context/DataContext'

const uploadSections = [
  {
    id: 'qgisReport',
    title: 'QGIS Analysis Report',
    description: 'Upload all_stat.csv from DSAS analysis',
    icon: MapPin,
    acceptedFile: 'all_stat.csv',
    acceptTypes: 'csv',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'currentData',
    title: 'Current Data',
    description: 'Ocean current velocity measurements',
    icon: Droplets,
    acceptedFile: '2000-2025_Current_Data.nc',
    acceptTypes: 'nc',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'waveData',
    title: 'Wave Data',
    description: 'Wave height and period reanalysis',
    icon: Waves,
    acceptedFile: '2000-2025_Gobal_Ocean_waves.nc',
    acceptTypes: 'nc',
    color: 'from-violet-500 to-purple-500',
  },
  {
    id: 'windData',
    title: 'Wind Data',
    description: 'Wind speed and stress measurements',
    icon: Wind,
    acceptedFile: '2000-2025_Global_Ocean_Wind.nc',
    acceptTypes: 'nc',
    color: 'from-orange-500 to-amber-500',
  },
]

/* ── Execution progress steps (mirrors notebook.ipynb flow) ── */
const PROGRESS_STEPS = [
  'Uploading files to server…',
  'Loading shoreline & environmental data…',
  'Feature engineering & annual aggregation…',
  'Statistical analysis (Mann-Whitney / Cliff\'s δ)…',
  'Computing 4-method ensemble thresholds…',
  'Training Random Forest classifier…',
  'Running SARIMA forecasts (AIC grid search)…',
  'Hindcast validation & Monte Carlo simulation…',
  'Computing retreat predictions & vulnerability…',
  'Exporting results to JSON…',
]

export default function DataUploadPage() {
  const {
    files,
    uploadFile,
    clearFile,
    uploadProgress,
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
  const [activeView, setActiveView] = useState('upload') // 'upload' | 'results'

  const handleUpload = async (sectionId, file) => {
    try {
      await uploadFile(sectionId, file)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleLoadDemo = () => {
    loadDemoData()
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  // ── Execute Analysis via Backend API ──
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
      if (result) {
        setActiveView('results')
      }
    } catch (err) {
      setLocalError(err.message || 'Analysis execution failed')
    }
  }

  const handleClearAndReset = async () => {
    await clearAnalysis()
    setAnalysisComplete(false)
    setActiveView('upload')
  }

  const allFilesUploaded = Object.values(files).filter(Boolean).length === 4
  const hasData = data.summary || data.thresholds?.length > 0
  const uploadedCount = Object.values(files).filter(Boolean).length
  const displayError = localError || contextError

  // ── RESULTS VIEW ──
  if (activeView === 'results' && (hasData || analysisComplete)) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-b from-coastal-50 to-white">
          {/* Results Header */}
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

          {/* Results View */}
          <NotebookResultsView analysisData={rawAnalysisData || data} />
        </div>
      </PageTransition>
    )
  }

  // ── UPLOAD VIEW ──
  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-coastal-50 to-white bg-mesh-1">
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
                Upload your QGIS analysis reports (CSV) and environmental datasets (NetCDF),
                then run the notebook to generate threshold detection results.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Backend Status Banner */}
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
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                backendAvailable === true
                  ? 'bg-emerald-100'
                  : backendAvailable === false
                  ? 'bg-amber-100'
                  : 'bg-coastal-100'
              }`}>
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
        <section className="pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-2">
              {['Upload Files', 'Run Notebook', 'View Results'].map((step, i) => {
                const isActive = (i === 0 && !allFilesUploaded) ||
                                 (i === 1 && allFilesUploaded && !analysisComplete && !analysisRunning) ||
                                 (i === 1 && analysisRunning) ||
                                 (i === 2 && analysisComplete)
                const isComplete = (i === 0 && allFilesUploaded) ||
                                   (i === 1 && analysisComplete)
                return (
                  <div key={step} className="flex items-center gap-2">
                    {i > 0 && <div className={`w-12 h-0.5 ${isComplete || isActive ? 'bg-ocean-400' : 'bg-coastal-200'}`} />}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isActive ? 'bg-ocean-100 text-ocean-700 ring-2 ring-ocean-300' :
                      isComplete ? 'bg-emerald-100 text-emerald-700' :
                      'bg-coastal-100 text-coastal-400'
                    }`}>
                      {isComplete ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-current/10 flex items-center justify-center text-[10px]">{i + 1}</span>
                      )}
                      {step}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Upload Sections */}
        <section className="pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-6">
              {uploadSections.map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg shadow-ocean-500/10`}
                    >
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-coastal-900">
                        {section.title}
                      </h3>
                      <p className="text-xs text-coastal-400 font-medium">{section.acceptedFile}</p>
                    </div>
                  </div>

                  <FileUpload
                    title={section.title}
                    description={section.description}
                    icon={section.icon}
                    file={files[section.id]}
                    acceptTypes={section.acceptTypes}
                    onUpload={(file) => handleUpload(section.id, file)}
                    onClear={() => clearFile(section.id)}
                    progress={uploadProgress[section.id] || 0}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Action Section – Run Notebook */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card p-6"
            >
              <div className="max-w-lg mx-auto text-center">
                {/* ── Analysis Running ── */}
                {analysisRunning && (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ocean-500 to-primary-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <h3 className="text-xl font-display font-semibold text-coastal-900 mb-2">
                      Running Notebook…
                    </h3>
                    <p className="text-coastal-600 mb-6">
                      The notebook is being executed server-side. This typically takes 2–5 minutes.
                    </p>

                    {/* Progress Steps */}
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

                    {/* Progress Bar */}
                    <div className="w-full bg-coastal-100 rounded-full h-2 mb-4">
                      <motion.div
                        className="bg-gradient-to-r from-ocean-500 to-primary-500 h-2 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: `${((progressStep + 1) / PROGRESS_STEPS.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>

                    {analysisStatus && (
                      <p className="text-xs text-ocean-600 animate-pulse">{analysisStatus}</p>
                    )}
                  </>
                )}

                {/* ── Analysis Complete ── */}
                {!analysisRunning && analysisComplete && (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-display font-semibold text-coastal-900 mb-2">
                      Notebook Executed Successfully!
                    </h3>
                    <p className="text-coastal-600 mb-6">
                      All analysis results, charts, and CSV outputs are ready to explore.
                    </p>
                    <button
                      onClick={() => setActiveView('results')}
                      className="btn-primary w-full justify-center mb-3"
                    >
                      <BarChart3 className="w-5 h-5" />
                      View All Results
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleClearAndReset}
                      className="btn-secondary w-full justify-center text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Results & Re-upload
                    </button>
                  </>
                )}

                {/* ── Error ── */}
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

                {/* ── Ready to Execute ── */}
                {!analysisRunning && !analysisComplete && allFilesUploaded && (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ocean-500 to-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-display font-semibold text-coastal-900 mb-2">
                      All {uploadedCount} Files Uploaded
                    </h3>
                    <p className="text-coastal-600 mb-6">
                      Click below to execute the analysis notebook. The system will run all
                      threshold detection, forecasting, and vulnerability analysis automatically.
                    </p>

                    <button
                      onClick={handleExecuteAnalysis}
                      disabled={analysisRunning || !backendAvailable}
                      className="btn-primary w-full mb-4 justify-center disabled:opacity-50 text-base py-3"
                    >
                      <Play className="w-5 h-5" />
                      Run Notebook
                    </button>

                    {!backendAvailable && (
                      <p className="text-xs text-amber-600 mb-4">
                        Start the backend server first to enable analysis.
                      </p>
                    )}
                  </>
                )}

                {/* ── Has Previous Results ── */}
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

                {/* ── Upload Prompt ── */}
                {!analysisRunning && !analysisComplete && !allFilesUploaded && !hasData && (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-coastal-100 flex items-center justify-center mx-auto mb-6">
                      <FileSpreadsheet className="w-8 h-8 text-coastal-400" />
                    </div>
                    <h3 className="text-xl font-display font-semibold text-coastal-900 mb-2">
                      Upload Your Data
                    </h3>
                    <p className="text-coastal-600 mb-6">
                      Upload all 4 required datasets, then click Run Notebook to start the analysis.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm text-coastal-500">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        {uploadedCount} uploaded
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-coastal-300" />
                        {4 - uploadedCount} remaining
                      </span>
                    </div>
                  </>
                )}

                {/* ── Demo Data ── */}
                {!analysisRunning && !analysisComplete && (
                  <div className="border-t border-coastal-200 pt-4 mt-6">
                    <div className="flex items-center gap-3 justify-center">
                      <Info className="w-4 h-4 text-ocean-500 flex-shrink-0" />
                      <span className="text-sm text-coastal-500">Don't have data?</span>
                      <button onClick={handleLoadDemo} className="text-sm text-ocean-600 hover:text-ocean-800 font-semibold underline underline-offset-2">
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
