import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Play,
  RefreshCw,
  Server,
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import { useData } from '../context/DataContext'

const RUN_STEPS = [
  'Request sent to backend',
  'Notebook kernel preparing',
  'Loading shoreline and meteo files',
  'Building shoreline labels',
  'Extracting monthly driver patterns',
  'Training classification models',
  'Estimating threshold ranges',
  'Forecasting threshold horizons',
  'Writing results and figures',
  'Finalizing output package',
]

export default function AnalysisPage() {
  const {
    runAnalysis,
    loadAnalysisResults,
    analysisRunning,
    analysisStatus,
    analysisComplete,
    progressStep,
    backendAvailable,
    dataLoaded,
    error,
  } = useData()

  const progressPercent = useMemo(() => {
    if (analysisComplete) return 100
    if (!analysisRunning) return 0
    return Math.min(10 + progressStep * 9, 95)
  }, [analysisComplete, analysisRunning, progressStep])

  const activeStepText = useMemo(() => {
    if (analysisComplete) return 'Notebook execution finished.'
    if (analysisRunning) {
      return RUN_STEPS[Math.min(progressStep, RUN_STEPS.length - 1)]
    }
    return 'Ready to run notebook.ipynb'
  }, [analysisComplete, analysisRunning, progressStep])

  const handleRunNotebook = async () => {
    await runAnalysis()
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-coastal-50 to-white bg-mesh-1">
        <section className="pt-8 sm:pt-10 pb-6">
          <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <div className="page-badge bg-primary-50 text-primary-600 border-primary-100 mb-4">
                <Server className="w-3.5 h-3.5" />
                Meteorological Analysis Runner
              </div>
              <h1 className="section-title mb-3">Run notebook.ipynb</h1>
              <p className="section-subtitle">
                Use this page to start the full notebook run from frontend. The backend executes
                notebook.ipynb using files in notebook_data and shows live run progress below.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="pb-10 sm:pb-12">
          <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-5 sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-display font-semibold text-coastal-900">
                    Notebook Execution Control
                  </h2>
                  <p className="text-sm text-coastal-600 mt-1">
                    Start a new analysis run and monitor progress in real time.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    backendAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${backendAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {backendAvailable ? 'Backend online' : 'Backend unavailable'}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleRunNotebook}
                  disabled={analysisRunning || !backendAvailable}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-ocean-600 to-primary-600 hover:from-ocean-700 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {analysisRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Running notebook...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run notebook.ipynb
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={loadAnalysisResults}
                  disabled={analysisRunning}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold border border-coastal-200 text-coastal-700 hover:bg-coastal-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Results
                </button>

                {dataLoaded && (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold border border-primary-200 text-primary-700 hover:bg-primary-50 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Open Dashboard
                  </Link>
                )}
              </div>

              <div className="mt-7">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-coastal-700">
                    {analysisStatus || activeStepText}
                  </p>
                  <p className="text-xs font-semibold text-coastal-500">{progressPercent}%</p>
                </div>

                <div className="h-3 w-full rounded-full bg-coastal-100 border border-coastal-200 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-ocean-500 to-primary-600"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {RUN_STEPS.map((step, idx) => {
                    const done = analysisComplete || idx <= progressStep
                    return (
                      <div
                        key={step}
                        className={`px-3 py-2 rounded-lg border text-xs ${
                          done
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-coastal-50 border-coastal-200 text-coastal-500'
                        }`}
                      >
                        {idx + 1}. {step}
                      </div>
                    )
                  })}
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
