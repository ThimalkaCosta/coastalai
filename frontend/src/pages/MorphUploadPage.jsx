import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Upload,
  FileSpreadsheet,
  Calendar,
  Mountain,
  ArrowRight,
  CheckCircle,
  Info,
  Play,
  Loader2,
  Server,
  XCircle,
  Trash2,
  X,
  FolderOpen,
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import { useMorphData } from '../context/MorphDataContext'

const PROGRESS_STEPS = [
  'Uploading files to server…',
  'Loading & merging environmental CSVs…',
  'Processing erosion events data…',
  'Training HMM state detection model…',
  'Analysing regime stability & seasonal alignment…',
  'Building CVI from evaluation data…',
  'Running VECM / Linear Trend forecasts…',
  'Computing forecasted CVI…',
  'Exporting results…',
]

export default function MorphUploadPage() {
  const {
    files,
    uploadFile,
    uploadEnvFiles,
    clearFile,
    uploadProgress,
    data,
    runAnalysis,
    analysisRunning,
    analysisStatus,
    backendAvailable,
    clearAnalysis,
    error: contextError,
  } = useMorphData()

  const navigate = useNavigate()
  const envInputRef = useRef(null)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [localError, setLocalError] = useState(null)
  const [progressStep, setProgressStep] = useState(0)

  const handleFileChange = (type, e) => {
    const file = e.target.files[0]
    if (file) uploadFile(type, file)
  }

  const handleEnvFilesChange = (e) => {
    if (e.target.files.length > 0) {
      uploadEnvFiles(e.target.files)
    }
  }

  const handleExecuteAnalysis = async () => {
    setLocalError(null)
    setAnalysisComplete(false)
    setProgressStep(0)

    if (!backendAvailable) {
      setLocalError('Backend server is not running. Start it with: cd backend && uvicorn main:app --reload')
      return
    }

    const stepInterval = setInterval(() => {
      setProgressStep((prev) => Math.min(prev + 1, PROGRESS_STEPS.length - 1))
    }, 20_000)

    try {
      const result = await runAnalysis()
      clearInterval(stepInterval)
      if (result) setAnalysisComplete(true)
    } catch (err) {
      clearInterval(stepInterval)
      setLocalError(err.message || 'Analysis execution failed')
    }
  }

  const allReady = files.events && files.evaluation && files.envFiles?.length > 0
  const hasData = data.hmmThresholds || data.cvi
  const displayError = localError || contextError

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-coastal-50 to-white bg-mesh-1">
        {/* Header */}
        <section className="pt-10 pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
              <div className="page-badge bg-emerald-50 text-emerald-600 border-emerald-100 mb-4">
                <Upload className="w-3.5 h-3.5" />
                Morphological Upload
              </div>
              <h1 className="section-title mb-3">Upload Morphological Data</h1>
              <p className="section-subtitle">
                Upload environmental CSV files, erosion events, and terrain evaluation data
                for morphological threshold detection analysis.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Backend Status */}
        <section className="pb-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`card p-4 flex items-center gap-3 ${
                backendAvailable === true ? 'bg-emerald-50/80 border-emerald-200/60'
                : backendAvailable === false ? 'bg-amber-50/80 border-amber-200/60'
                : 'bg-coastal-50/80 border-coastal-200/60'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                backendAvailable === true ? 'bg-emerald-100' : backendAvailable === false ? 'bg-amber-100' : 'bg-coastal-100'
              }`}>
                <Server className={`w-4 h-4 ${
                  backendAvailable === true ? 'text-emerald-600' : backendAvailable === false ? 'text-amber-600' : 'text-coastal-400'
                }`} />
              </div>
              <p className={`text-sm font-medium ${
                backendAvailable === true ? 'text-emerald-800' : backendAvailable === false ? 'text-amber-800' : 'text-coastal-600'
              }`}>
                {backendAvailable === true ? 'Analysis server is online – ready to process your data'
                : backendAvailable === false ? 'Analysis server offline – start it to enable dynamic analysis'
                : 'Checking server status…'}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Upload Sections */}
        <section className="pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-6">

              {/* Events File */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="mb-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/10">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-coastal-900">Events Data</h3>
                    <p className="text-xs text-coastal-400 font-medium">events.xlsx</p>
                  </div>
                </div>
                <div className="card p-5">
                  {files.events ? (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm text-coastal-700 truncate flex-1">{files.events.name}</span>
                      <button onClick={() => clearFile('events')} className="text-coastal-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-3 cursor-pointer py-6 border-2 border-dashed border-coastal-200 rounded-xl hover:border-ocean-300 hover:bg-ocean-50/30 transition-all">
                      <Upload className="w-8 h-8 text-coastal-300" />
                      <span className="text-sm text-coastal-500">Click to upload events.xlsx</span>
                      <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleFileChange('events', e)} />
                    </label>
                  )}
                </div>
              </motion.div>

              {/* Evaluation File */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <div className="mb-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/10">
                    <Mountain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-coastal-900">Evaluation Data</h3>
                    <p className="text-xs text-coastal-400 font-medium">evaluation.xlsx</p>
                  </div>
                </div>
                <div className="card p-5">
                  {files.evaluation ? (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm text-coastal-700 truncate flex-1">{files.evaluation.name}</span>
                      <button onClick={() => clearFile('evaluation')} className="text-coastal-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-3 cursor-pointer py-6 border-2 border-dashed border-coastal-200 rounded-xl hover:border-ocean-300 hover:bg-ocean-50/30 transition-all">
                      <Upload className="w-8 h-8 text-coastal-300" />
                      <span className="text-sm text-coastal-500">Click to upload evaluation.xlsx</span>
                      <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleFileChange('evaluation', e)} />
                    </label>
                  )}
                </div>
              </motion.div>

              {/* Environmental CSVs */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="mb-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/10">
                    <FolderOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-coastal-900">Environmental CSVs</h3>
                    <p className="text-xs text-coastal-400 font-medium">9 variable CSV files</p>
                  </div>
                </div>
                <div className="card p-5">
                  {files.envFiles?.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm text-coastal-700 font-medium">{files.envFiles.length} files selected</span>
                        <button onClick={() => clearFile('envFiles')} className="text-coastal-400 hover:text-red-500 ml-auto">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {files.envFiles.map((f, i) => (
                          <p key={i} className="text-xs text-coastal-500 truncate pl-7">{f.name}</p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-3 cursor-pointer py-6 border-2 border-dashed border-coastal-200 rounded-xl hover:border-ocean-300 hover:bg-ocean-50/30 transition-all">
                      <Upload className="w-8 h-8 text-coastal-300" />
                      <span className="text-sm text-coastal-500 text-center">Click to select all<br/>environmental CSV files</span>
                      <input
                        ref={envInputRef}
                        type="file"
                        accept=".csv"
                        multiple
                        className="hidden"
                        onChange={handleEnvFilesChange}
                      />
                    </label>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Info Banner */}
        <section className="pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="card p-5 bg-gradient-to-r from-ocean-50/60 to-primary-50/60 border-ocean-200/50">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-ocean-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-coastal-900 mb-1">Required Files</h3>
                  <p className="text-sm text-coastal-600">
                    <strong>Environmental CSVs</strong>: Meridional wind speed, Precipitation rate,
                    Relative humidity, Sea surface temperature, Surface soil moisture,
                    Volumetric soil water, 2m temperature, Air temperature, Zonal wind speed. &nbsp;
                    <strong>Events</strong>: Erosion/normal event periods (.xlsx). &nbsp;
                    <strong>Evaluation</strong>: Elevation and slope survey data (.xlsx).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Action Section */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-6 text-center">
              <div className="max-w-lg mx-auto">

                {/* ── Analysis Running ── */}
                {analysisRunning && (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <h3 className="text-xl font-display font-semibold text-coastal-900 mb-2">Running Morphological Analysis…</h3>
                    <p className="text-coastal-600 mb-6">Executing thimalka.ipynb – this may take several minutes.</p>

                    <div className="text-left max-w-sm mx-auto space-y-3 mb-6">
                      {PROGRESS_STEPS.map((step, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          {i < progressStep ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          ) : i === progressStep ? (
                            <Loader2 className="w-4 h-4 text-emerald-600 animate-spin flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-coastal-300 flex-shrink-0" />
                          )}
                          <span className={i <= progressStep ? 'text-coastal-800' : 'text-coastal-400'}>{step}</span>
                        </div>
                      ))}
                    </div>
                    {analysisStatus && <p className="text-xs text-emerald-600 animate-pulse">{analysisStatus}</p>}
                  </>
                )}

                {/* ── Analysis Complete ── */}
                {!analysisRunning && analysisComplete && (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-display font-semibold text-coastal-900 mb-2">Morphological Analysis Complete!</h3>
                    <p className="text-coastal-600 mb-6">Results are ready. View the threshold detection and CVI analysis.</p>
                    <button onClick={() => navigate('/morph/threshold')} className="btn-primary w-full justify-center">
                      View Threshold Results <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => { clearAnalysis(); setAnalysisComplete(false) }}
                      className="btn-secondary w-full justify-center mt-3 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" /> Clear Results & Re-upload
                    </button>
                  </>
                )}

                {/* ── Error ── */}
                {!analysisRunning && displayError && !analysisComplete && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
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
                {!analysisRunning && !analysisComplete && allReady && (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-display font-semibold text-coastal-900 mb-2">All Files Uploaded!</h3>
                    <p className="text-coastal-600 mb-6">Ready to execute morphological analysis with {files.envFiles.length} environmental CSVs, events, and evaluation data.</p>
                    <button
                      onClick={handleExecuteAnalysis}
                      disabled={analysisRunning || !backendAvailable}
                      className="btn-primary w-full mb-4 justify-center disabled:opacity-50"
                    >
                      <Play className="w-5 h-5" /> Run Morphological Analysis
                    </button>
                    {!backendAvailable && (
                      <p className="text-xs text-amber-600 mb-4">Start the backend server first.</p>
                    )}
                  </>
                )}

                {/* ── Upload Prompt ── */}
                {!analysisRunning && !analysisComplete && !allReady && !hasData && (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-coastal-100 flex items-center justify-center mx-auto mb-6">
                      <FileSpreadsheet className="w-8 h-8 text-coastal-400" />
                    </div>
                    <h3 className="text-xl font-display font-semibold text-coastal-900 mb-2">Upload Your Data</h3>
                    <p className="text-coastal-600 mb-6">
                      Upload the required datasets to run the morphological threshold detection analysis.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm text-coastal-500">
                      <span className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${files.events ? 'bg-emerald-500' : 'bg-coastal-300'}`} />
                        Events {files.events ? '✓' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${files.evaluation ? 'bg-emerald-500' : 'bg-coastal-300'}`} />
                        Evaluation {files.evaluation ? '✓' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${files.envFiles?.length > 0 ? 'bg-emerald-500' : 'bg-coastal-300'}`} />
                        Env CSVs ({files.envFiles?.length || 0})
                      </span>
                    </div>
                  </>
                )}

                {/* ── Has existing data ── */}
                {!analysisRunning && !analysisComplete && !allReady && hasData && (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-display font-semibold text-coastal-900 mb-2">Results Available</h3>
                    <p className="text-coastal-600 mb-6">Previous analysis results are available.</p>
                    <Link to="/morph/threshold" className="btn-primary">
                      View Results <ArrowRight className="w-5 h-5" />
                    </Link>
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
