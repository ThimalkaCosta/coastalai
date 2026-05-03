import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import FileUpload from '../components/upload/FileUpload'
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
  'Loading & processing environmental data (NetCDF)…',
  'Feature engineering & exploratory analysis…',
  'Training HMM state detection model…',
  'Training Random Forest classifier…',
  'Training XGBoost & SHAP analysis…',
  'Computing multi-model consensus thresholds…',
  'Running SARIMA forecasts…',
  'Processing & exporting results…',
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
  } = useData()

  const navigate = useNavigate()
  const [showSuccess, setShowSuccess] = useState(false)
  const [localError, setLocalError] = useState(null)

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
      await runAnalysis()
    } catch (err) {
      setLocalError(err.message || 'Analysis execution failed')
    }
  }

  const allFilesUploaded = Object.values(files).filter(Boolean).length === 4
  const hasData = data.shoreline || data.thresholds
  const uploadedCount = Object.values(files).filter(Boolean).length
  const displayError = localError || contextError

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
                Data Upload
              </div>
              <h1 className="section-title mb-3">Upload Your Research Data</h1>
              <p className="section-subtitle">
                Upload your QGIS analysis reports (CSV) and environmental datasets (NetCDF).
                The system will process your data for threshold detection analysis.
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

        {/* Demo Data Banner */}
        <section className="pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-5 bg-gradient-to-r from-ocean-50/60 to-primary-50/60 border-ocean-200/50"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-ocean-100 flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-ocean-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-coastal-900 mb-1">Try with Demo Data</h3>
                    <p className="text-sm text-coastal-600">
                      Don't have data ready? Load demo data to explore the analysis features.
                    </p>
                  </div>
                </div>
                <button onClick={handleLoadDemo} className="btn-secondary whitespace-nowrap">
                  {hasData ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      Demo Loaded
                    </>
                  ) : (
                    'Load Demo Data'
                  )}
                </button>
              </div>

              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-emerald-100 text-emerald-700 rounded-lg text-sm flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Demo data loaded successfully! You can now view the analysis.
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Upload Sections */}
        <section className="pb-12">
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

        {/* Action Section */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card p-6 text-center"
            >
              <div className="max-w-lg mx-auto">
                {/* ── Analysis Running ── */}
                {analysisRunning && (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ocean-500 to-primary-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <h3 className="text-xl font-display font-semibold text-coastal-900 mb-2">
                      Running Analysis…
                    </h3>
                    <p className="text-coastal-600 mb-6">
                      The notebook is being executed server-side. This typically takes 2–5 minutes
                      depending on your dataset size.
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
                          <span
                            className={
                              i <= progressStep ? 'text-coastal-800' : 'text-coastal-400'
                            }
                          >
                            {step}
                          </span>
                        </div>
                      ))}
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
                      Analysis Complete!
                    </h3>
                    <p className="text-coastal-600 mb-6">
                      All models have been trained and results are ready. Navigate to the analysis
                      dashboard to explore the findings.
                    </p>
                    <button
                      onClick={() => navigate('/analysis')}
                      className="btn-primary w-full justify-center"
                    >
                      View Analysis Results
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => { clearAnalysis(); setAnalysisComplete(false) }}
                      className="btn-secondary w-full justify-center mt-3 text-red-600 border-red-200 hover:bg-red-50"
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
                        <h4 className="font-medium text-red-800 mb-1">Analysis Error</h4>
                        <p className="text-sm text-red-700">{displayError}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Ready to Execute ── */}
                {!analysisRunning && !analysisComplete && allFilesUploaded && (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ocean-500 to-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-display font-semibold text-coastal-900 mb-2">
                      All Files Uploaded!
                    </h3>
                    <p className="text-coastal-600 mb-6">
                      Click below to send files to the backend and execute the full analysis
                      notebook automatically.
                    </p>

                    <button
                      onClick={handleExecuteAnalysis}
                      disabled={analysisRunning || !backendAvailable}
                      className="btn-primary w-full mb-4 justify-center disabled:opacity-50"
                    >
                      <Play className="w-5 h-5" />
                      Run Analysis
                    </button>

                    {!backendAvailable && (
                      <p className="text-xs text-amber-600 mb-4">
                        Start the backend server first to enable analysis execution.
                      </p>
                    )}

                    <div className="border-t border-coastal-200 pt-4 mt-4">
                      <p className="text-sm text-coastal-500 mb-3">Or view existing analysis:</p>
                      <Link to="/analysis" className="btn-secondary">
                        View Analysis
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </>
                )}

                {/* ── Demo Data Ready ── */}
                {!analysisRunning && !analysisComplete && !allFilesUploaded && hasData && (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-display font-semibold text-coastal-900 mb-2">
                      Demo Data Ready
                    </h3>
                    <p className="text-coastal-600 mb-6">
                      Demo data has been loaded. Proceed to view the analysis results.
                    </p>
                    <Link to="/analysis" className="btn-primary">
                      View Analysis
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </>
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
                      Upload all required datasets or load demo data to explore the analysis
                      features.
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
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
