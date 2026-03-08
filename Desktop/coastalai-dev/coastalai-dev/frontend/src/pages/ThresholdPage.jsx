import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Target,
  Waves,
  Wind,
  Droplets,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Activity,
  BarChart3,
  Trash2,
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import StatCard from '../components/common/StatCard'
import { useData } from '../context/DataContext'

const getDriverIcon = (driver) => {
  if (driver.includes('Hm0') || driver.includes('Wave')) return Waves
  if (driver.includes('Wind')) return Wind
  if (driver.includes('curr') || driver.includes('Curr')) return Droplets
  if (driver.includes('Storm')) return AlertTriangle
  return Activity
}

const getConsensusColor = (consensus) => {
  if (!consensus) return 'bg-gray-100 text-gray-700 border-gray-300'
  const c = consensus.toLowerCase()
  if (c === 'strong' || c === 'high') return 'bg-green-100 text-green-700 border-green-300'
  if (c === 'moderate' || c === 'medium') return 'bg-yellow-100 text-yellow-700 border-yellow-300'
  return 'bg-red-100 text-red-700 border-red-300'
}

const fmt = (v, digits = 4) => (v != null ? Number(v).toFixed(digits) : '--')

export default function ThresholdPage() {
  const { data, loading: ctxLoading, clearAnalysis } = useData()
  const navigate = useNavigate()
  const [clearing, setClearing] = useState(false)

  const thresholdData = useMemo(() => data?.thresholds || [], [data])
  const modelComparison = useMemo(() => data?.modelComparison || [], [data])
  const thresholdComparison = useMemo(() => data?.thresholdComparison || [], [data])

  const hasData = thresholdData.length > 0 || modelComparison.length > 0 || thresholdComparison.length > 0

  const stats = useMemo(() => ({
    totalDrivers: thresholdData.length,
    strongConsensus: thresholdData.filter(t => t.Model_Consensus === 'Strong' || t.Model_Consensus === 'High').length,
    moderateConsensus: thresholdData.filter(t => t.Model_Consensus === 'Moderate' || t.Model_Consensus === 'Medium').length,
    bestModel: modelComparison.length > 0
      ? [...modelComparison].sort((a, b) => (b.F1_Score || 0) - (a.F1_Score || 0))[0]?.Model || '--'
      : '--',
  }), [thresholdData, modelComparison])

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-coastal-50 to-white bg-mesh-1">
        {/* Header */}
        <section className="pt-8 sm:pt-10 pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-start justify-between gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
                <div className="page-badge bg-blue-50 text-blue-600 border-blue-100 mb-4">
                  <Target className="w-3.5 h-3.5" />
                  Multi-Model Analysis Results
                </div>
                <h1 className="section-title mb-3">Erosion Threshold Analysis</h1>
                <p className="section-subtitle">
                  Model performance comparison, per-variable threshold comparison, and final consensus thresholds
                  derived from HMM, Random Forest, and XGBoost analysis.
                </p>
              </motion.div>
              {hasData && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  disabled={clearing}
                  onClick={async () => {
                    setClearing(true)
                    await clearAnalysis()
                    setClearing(false)
                    navigate('/upload')
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors flex-shrink-0 mt-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {clearing ? 'Clearing…' : 'Clear Results'}
                </motion.button>
              )}
            </div>
          </div>
        </section>

        {ctxLoading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-coastal-600">Loading analysis results...</p>
          </div>
        ) : !hasData ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-coastal-900 mb-2">No Analysis Results Available</h3>
            <p className="text-coastal-600">Please run the backend analysis to generate threshold data.</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <section className="pb-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Drivers" value={stats.totalDrivers} subtitle="identified factors" icon={Target} delay={0.1} />
                  <StatCard title="Strong Consensus" value={stats.strongConsensus} subtitle="all models agree" icon={CheckCircle} delay={0.15} />
                  <StatCard title="Moderate Consensus" value={stats.moderateConsensus} subtitle="partial agreement" icon={AlertTriangle} delay={0.2} />
                  <StatCard title="Best Model (F1)" value={stats.bestModel} subtitle="highest F1 score" icon={TrendingUp} delay={0.25} />
                </div>
              </div>
            </section>

            {/* 1. Model Performance Comparison */}
            {modelComparison.length > 0 && (
              <section className="pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3">
                      <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Model Performance Comparison
                      </h3>
                      <p className="text-violet-100 text-xs mt-0.5">Monthly data with GroupKFold cross-validation</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-coastal-50/80 border-b-2 border-coastal-200">
                            <th className="py-3.5 px-4 text-left font-semibold text-coastal-600 uppercase tracking-wider text-xs">Model</th>
                            <th className="py-3.5 px-4 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">Accuracy</th>
                            <th className="py-3.5 px-4 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">Precision</th>
                            <th className="py-3.5 px-4 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">Recall</th>
                            <th className="py-3.5 px-4 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">F1 Score</th>
                            <th className="py-3.5 px-4 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">ROC AUC</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {modelComparison.map((m, i) => {
                            const bestF1 = Math.max(...modelComparison.map(x => x.F1_Score || 0))
                            const isBest = (m.F1_Score || 0) === bestF1
                            return (
                              <motion.tr key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                                className={`hover:bg-violet-50 transition-colors ${isBest ? 'bg-violet-50/60' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-gray-900">{m.Model}</span>
                                    {isBest && <span className="inline-flex px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold border border-green-300">BEST</span>}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center font-mono text-sm">{fmt(m.Accuracy, 3)}</td>
                                <td className="py-3 px-4 text-center font-mono text-sm">{fmt(m.Precision, 3)}</td>
                                <td className="py-3 px-4 text-center font-mono text-sm">{fmt(m.Recall, 3)}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`inline-flex px-2.5 py-1 rounded-lg font-semibold font-mono text-sm ${isBest ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {fmt(m.F1_Score, 3)}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center font-mono text-sm">{fmt(m.ROC_AUC, 3)}</td>
                              </motion.tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                </div>
              </section>
            )}

            {/* 2. Threshold Comparison Across Models */}
            {thresholdComparison.length > 0 && (
              <section className="pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-3">
                      <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Threshold Comparison Across All Three Models
                      </h3>
                      <p className="text-cyan-100 text-xs mt-0.5">Per-variable threshold values and ranges from each model</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-coastal-50/80 border-b-2 border-coastal-200">
                            <th className="py-3.5 px-3 text-left font-semibold text-coastal-600 uppercase tracking-wider text-xs">Variable</th>
                            <th className="py-3.5 px-3 text-center font-semibold text-purple-600 uppercase tracking-wider text-xs">HMM Threshold</th>
                            <th className="py-3.5 px-3 text-center font-semibold text-purple-600 uppercase tracking-wider text-xs">HMM Range</th>
                            <th className="py-3.5 px-3 text-center font-semibold text-green-600 uppercase tracking-wider text-xs">RF Threshold</th>
                            <th className="py-3.5 px-3 text-center font-semibold text-green-600 uppercase tracking-wider text-xs">RF Range</th>
                            <th className="py-3.5 px-3 text-center font-semibold text-orange-600 uppercase tracking-wider text-xs">XGB Threshold</th>
                            <th className="py-3.5 px-3 text-center font-semibold text-orange-600 uppercase tracking-wider text-xs">XGB Range</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {thresholdComparison.map((row, i) => {
                            const Icon = getDriverIcon(row.Variable)
                            return (
                              <motion.tr key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.03 }}
                                className={`hover:bg-cyan-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-cyan-100 flex items-center justify-center">
                                      <Icon className="w-3.5 h-3.5 text-cyan-600" />
                                    </div>
                                    <span className="font-semibold text-xs text-gray-900">{row.Variable}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700 font-semibold font-mono text-xs">{fmt(row.HMM_Threshold)}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center text-xs font-mono text-purple-600">
                                  [{fmt(row.HMM_Range_Lower)}, {fmt(row.HMM_Range_Upper)}]
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex px-2 py-0.5 rounded-lg bg-green-100 text-green-700 font-semibold font-mono text-xs">{fmt(row.RF_Threshold)}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center text-xs font-mono text-green-600">
                                  [{fmt(row.RF_Range_Lower)}, {fmt(row.RF_Range_Upper)}]
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex px-2 py-0.5 rounded-lg bg-orange-100 text-orange-700 font-semibold font-mono text-xs">{fmt(row.XGB_Threshold)}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center text-xs font-mono text-orange-600">
                                  [{fmt(row.XGB_Range_Lower)}, {fmt(row.XGB_Range_Upper)}]
                                </td>
                              </motion.tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                </div>
              </section>
            )}

            {/* 3. Final Consensus Threshold Summary */}
            {thresholdData.length > 0 && (
              <section className="pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3">
                      <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Final Erosion Threshold Summary
                      </h3>
                      <p className="text-blue-100 text-xs mt-0.5">Multi-model consensus thresholds with physical interpretation</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-coastal-50/80 border-b-2 border-coastal-200">
                            <th className="py-3.5 px-3 text-left font-semibold text-coastal-600 uppercase tracking-wider text-xs">Driver</th>
                            <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">Unit</th>
                            <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">Description</th>
                            <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">Direction</th>
                            <th className="py-3.5 px-3 text-center font-semibold text-purple-600 uppercase tracking-wider text-xs">HMM</th>
                            <th className="py-3.5 px-3 text-center font-semibold text-green-600 uppercase tracking-wider text-xs">RF</th>
                            <th className="py-3.5 px-3 text-center font-semibold text-orange-600 uppercase tracking-wider text-xs">XGB</th>
                            <th className="py-3.5 px-3 text-center font-semibold text-blue-600 uppercase tracking-wider text-xs">Consensus</th>
                            <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">Range</th>
                            <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">Agreement</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {thresholdData.map((item, index) => {
                            const Icon = getDriverIcon(item.Driver)
                            return (
                              <motion.tr key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + index * 0.04 }}
                                className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                                      <Icon className="w-3.5 h-3.5 text-blue-600" />
                                    </div>
                                    <span className="font-semibold text-xs text-gray-900">{item.Driver}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-mono">{item.Unit}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center text-xs text-gray-600">{item.Description}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex px-2 py-0.5 rounded bg-gray-200 text-gray-800 text-sm font-bold">{item.Direction}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700 font-semibold font-mono text-xs">{fmt(item.HMM_Threshold)}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex px-2 py-0.5 rounded-lg bg-green-100 text-green-700 font-semibold font-mono text-xs">{fmt(item.RF_Threshold)}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex px-2 py-0.5 rounded-lg bg-orange-100 text-orange-700 font-semibold font-mono text-xs">{fmt(item.XGB_Threshold)}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 font-bold font-mono text-xs">{fmt(item.Consensus_Threshold)}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center text-xs font-mono text-gray-600">
                                  [{fmt(item.Erosion_Threshold_Lower)} – {fmt(item.Erosion_Threshold_Upper)}]
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${getConsensusColor(item.Model_Consensus)}`}>
                                    {item.Model_Consensus}
                                  </span>
                                </td>
                              </motion.tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                </div>
              </section>
            )}

            {/* Info Box */}
            <section className="pb-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="card p-4 bg-gradient-to-br from-blue-50/80 to-cyan-50/80 border-blue-200/60 ring-1 ring-blue-100/50">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Info className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900 text-sm mb-2">Column Descriptions</h3>
                        <div className="space-y-1.5 text-xs text-blue-800">
                          <p><strong>HMM:</strong> Threshold from Hidden Markov Model state centroids</p>
                          <p><strong>RF:</strong> Median decision split from Random Forest trees</p>
                          <p><strong>XGB:</strong> Median decision split from XGBoost trees</p>
                          <p><strong>Consensus:</strong> F1-weighted average across all three models</p>
                          <p><strong>Range:</strong> Envelope of all model threshold ranges</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm mb-2">Model Agreement</h3>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-300">Strong</span>
                            <span className="text-gray-600">All three models agree on direction</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold border border-yellow-300">Moderate</span>
                            <span className="text-gray-600">Two of three models agree</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </PageTransition>
  )
}
