import { useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Target,
  Waves,
  Wind,
  Droplets,
  AlertTriangle,
  CheckCircle,
  Info,
  Activity,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import StatCard from '../components/common/StatCard'
import { useData } from '../context/DataContext'

const METHOD_LABELS = {
  roc_youden: { name: 'ROC / Youden', legacyName: 'HMM', color: 'violet' },
  bayesian_logistic: { name: 'Bayesian Logistic', legacyName: 'Random Forest', color: 'blue' },
  change_point: { name: 'Profile-Likelihood', legacyName: 'XGBoost', color: 'emerald' },
  mutual_info: { name: 'Mutual Information', legacyName: 'Consensus', color: 'amber' },
}

const getDriverIcon = (driver) => {
  if (!driver) return Activity
  const d = driver.toLowerCase()
  if (d.includes('hm0') || d.includes('wave') || d.includes('energy')) return Waves
  if (d.includes('wind')) return Wind
  if (d.includes('curr')) return Droplets
  if (d.includes('storm')) return AlertTriangle
  return Activity
}

const fmt = (v, digits = 4) => (v != null && !isNaN(v) ? Number(v).toFixed(digits) : '--')

export default function ThresholdPage() {
  const { data, loading: ctxLoading, clearAnalysis } = useData()
  const navigate = useNavigate()
  const [clearing, setClearing] = useState(false)
  const [expandedFeature, setExpandedFeature] = useState(null)

  const thresholdData = useMemo(() => data?.thresholds || [], [data])
  const statisticalTests = useMemo(() => data?.statisticalTests || [], [data])
  const thresholdComparison = useMemo(() => data?.thresholdComparison || [], [data])
  const fiveClassThresholds = useMemo(() => data?.fiveClassThresholds || [], [data])
  const fiveClassRecognition = useMemo(() => data?.fiveClassRecognition || null, [data])
  const isLegacy = data?.isLegacyFormat
  const hasData = thresholdData.length > 0

  const stats = useMemo(() => {
    const significant = isLegacy
      ? thresholdData.filter(t => t.modelConsensus === 'Strong')
      : thresholdData.filter(t => t.pValue != null && t.pValue < 0.05)
    const methodCounts = {}
    thresholdData.forEach(t => {
      Object.keys(t.methods || {}).forEach(m => {
        if (t.methods[m].significant) methodCounts[m] = (methodCounts[m] || 0) + 1
      })
    })
    return {
      totalFeatures: thresholdData.length,
      significantFeatures: significant.length,
      methodsUsed: Object.keys(METHOD_LABELS).length,
      avgMethods: thresholdData.length > 0
        ? (thresholdData.reduce((s, t) => s + Object.keys(t.methods || {}).length, 0) / thresholdData.length).toFixed(1)
        : 0,
    }
  }, [thresholdData, isLegacy])

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
                  {isLegacy ? '3-Model Ensemble Analysis' : '4-Method Ensemble Analysis'}
                </div>
                <h1 className="section-title mb-3">Erosion Threshold Detection</h1>
                <p className="section-subtitle">
                  {isLegacy
                    ? 'Ensemble thresholds derived from HMM, Random Forest, and XGBoost models with consensus scoring.'
                    : 'Ensemble thresholds derived from ROC/Youden, Bayesian Logistic Regression, Profile-Likelihood Change-Point, and Mutual Information methods.'}
                </p>
              </motion.div>
              {hasData && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  disabled={clearing}
                  onClick={async () => { setClearing(true); await clearAnalysis(); setClearing(false); navigate('/upload') }}
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
                  <StatCard title="Features Analysed" value={stats.totalFeatures} subtitle="environmental drivers" icon={Target} delay={0.1} />
                  <StatCard title="Significant" value={stats.significantFeatures} subtitle="p < 0.05" icon={CheckCircle} delay={0.15} />
                  <StatCard title="Methods Used" value={stats.methodsUsed} subtitle="ensemble approaches" icon={Activity} delay={0.2} />
                  <StatCard title="Avg Methods/Feature" value={stats.avgMethods} subtitle="detection coverage" icon={Info} delay={0.25} />
                </div>
              </div>
            </section>

            {/* Ensemble Threshold Comparison Table */}
            <section className="pb-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3">
                    <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      4-Method Ensemble Threshold Summary
                    </h3>
                    <p className="text-blue-100 text-xs mt-0.5">Click on a feature to see per-method details</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-coastal-50/80 border-b-2 border-coastal-200">
                          <th className="py-3.5 px-4 text-left font-semibold text-coastal-600 uppercase tracking-wider text-xs">Feature</th>
                          {Object.entries(METHOD_LABELS).map(([key, { name, legacyName, color }]) => (
                            <th key={key} className={`py-3.5 px-3 text-center font-semibold text-${color}-600 uppercase tracking-wider text-xs`}>{isLegacy ? legacyName : name}</th>
                          ))}
                          <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">Consensus Range</th>
                          <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">p-value</th>
                          <th className="py-3.5 px-1 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {thresholdData.map((item, index) => {
                          const Icon = getDriverIcon(item.feature)
                          const isExpanded = expandedFeature === index
                          const sig = item.pValue != null && item.pValue < 0.05
                          return (
                            <motion.tr
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.05 + index * 0.03 }}
                              className={`hover:bg-blue-50/60 cursor-pointer transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                              onClick={() => setExpandedFeature(isExpanded ? null : index)}
                            >
                              <td className="py-2.5 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Icon className="w-3.5 h-3.5 text-blue-600" />
                                  </div>
                                  <span className="font-semibold text-xs text-gray-900">{item.feature}</span>
                                </div>
                              </td>
                              {Object.entries(METHOD_LABELS).map(([key, { color }]) => {
                                const m = item.methods?.[key]
                                return (
                                  <td key={key} className="py-2.5 px-3 text-center">
                                    {m ? (
                                      <span className={`inline-flex px-2 py-0.5 rounded-lg bg-${color}-100 text-${color}-700 font-semibold font-mono text-xs`}>
                                        {fmt(m.threshold)}
                                      </span>
                                    ) : (
                                      <span className="text-gray-300 text-xs">--</span>
                                    )}
                                  </td>
                                )
                              })}
                              <td className="py-2.5 px-3 text-center text-xs font-mono text-gray-600">
                                [{fmt(item.thresholdLow)} – {fmt(item.thresholdHigh)}]
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${sig ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                                  {item.pValue != null ? item.pValue.toExponential(2) : '--'}
                                </span>
                              </td>
                              <td className="py-2.5 px-1 text-center">
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-coastal-400" /> : <ChevronDown className="w-4 h-4 text-coastal-400" />}
                              </td>
                            </motion.tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Expanded detail panel */}
                  {expandedFeature !== null && thresholdData[expandedFeature] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-coastal-200 bg-gradient-to-br from-blue-50/40 to-indigo-50/40 p-5"
                    >
                      <h4 className="font-semibold text-sm text-coastal-900 mb-4">
                        Method Details for: <span className="text-blue-600">{thresholdData[expandedFeature].feature}</span>
                      </h4>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {Object.entries(METHOD_LABELS).map(([key, { name, legacyName, color }]) => {
                          const m = thresholdData[expandedFeature].methods?.[key]
                          const displayName = isLegacy ? legacyName : name
                          if (!m) return (
                            <div key={key} className="p-3 rounded-xl bg-white border border-gray-200 opacity-50">
                              <div className="text-xs font-semibold text-gray-400 mb-1">{displayName}</div>
                              <p className="text-xs text-gray-400">Not available</p>
                            </div>
                          )
                          return (
                            <div key={key} className={`p-3 rounded-xl bg-white border border-${color}-200 shadow-sm`}>
                              <div className={`text-xs font-semibold text-${color}-600 mb-2`}>{displayName}</div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between"><span className="text-gray-500">Threshold</span><span className="font-mono font-semibold">{fmt(m.threshold)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">95% CI</span><span className="font-mono">[{fmt(m.ci_lower)}, {fmt(m.ci_upper)}]</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Statistic</span><span className="font-mono">{fmt(m.statistic)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">p-value</span><span className="font-mono">{m.pValue != null ? Number(m.pValue).toExponential(2) : '--'}</span></div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Significant</span>
                                  <span className={`font-semibold ${m.significant ? 'text-green-600' : 'text-red-500'}`}>{m.significant ? 'Yes' : 'No'}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </section>

            {/* Mann-Whitney Statistical Tests */}
            {statisticalTests.length > 0 && (
              <section className="pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3">
                      <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Mann-Whitney U Tests (Cliff&apos;s Delta)
                      </h3>
                      <p className="text-teal-100 text-xs mt-0.5">Statistical comparison of erosion vs. non-erosion year feature distributions</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-coastal-50/80 border-b-2 border-coastal-200">
                            {Object.keys(statisticalTests[0] || {}).map(col => (
                              <th key={col} className="py-3 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">{col.replace(/_/g, ' ')}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {statisticalTests.map((row, i) => (
                            <tr key={i} className={`hover:bg-teal-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                              {Object.entries(row).map(([col, val], j) => (
                                <td key={j} className="py-2.5 px-3 text-center text-xs font-mono">
                                  {typeof val === 'number' ? (Math.abs(val) < 0.01 ? val.toExponential(2) : val.toFixed(4)) : String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
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
                        <h3 className="font-semibold text-blue-900 text-sm mb-2">4-Method Ensemble</h3>
                        <div className="space-y-1.5 text-xs text-blue-800">
                          <p><strong>ROC/Youden:</strong> Optimal cut-point maximising sensitivity + specificity</p>
                          <p><strong>Bayesian Logistic:</strong> Inflection point of logistic regression posterior</p>
                          <p><strong>Profile-Likelihood:</strong> Change-point detection via likelihood ratio</p>
                          <p><strong>Mutual Information:</strong> Maximum information gain partitioning</p>
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
                        <h3 className="font-semibold text-gray-900 text-sm mb-2">Consensus Range</h3>
                        <div className="space-y-1.5 text-xs text-gray-700">
                          <p><strong>Low:</strong> Minimum threshold across all 4 methods</p>
                          <p><strong>High:</strong> Maximum threshold across all 4 methods</p>
                          <p><strong>p-value:</strong> Mann-Whitney U test significance</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Threshold Comparison Table (legacy) */}
            {thresholdComparison.length > 0 && (
              <section className="pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="card overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3">
                      <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Multi-Model Threshold Comparison (with Confidence Ranges)
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-coastal-50/80 border-b-2 border-coastal-200">
                            <th className="py-3 px-4 text-left font-semibold text-coastal-600 uppercase tracking-wider text-xs">Variable</th>
                            <th className="py-3 px-3 text-center font-semibold text-violet-600 uppercase tracking-wider text-xs">HMM Threshold</th>
                            <th className="py-3 px-3 text-center font-semibold text-violet-500 uppercase tracking-wider text-xs">HMM Range</th>
                            <th className="py-3 px-3 text-center font-semibold text-blue-600 uppercase tracking-wider text-xs">RF Threshold</th>
                            <th className="py-3 px-3 text-center font-semibold text-blue-500 uppercase tracking-wider text-xs">RF Range</th>
                            <th className="py-3 px-3 text-center font-semibold text-emerald-600 uppercase tracking-wider text-xs">XGB Threshold</th>
                            <th className="py-3 px-3 text-center font-semibold text-emerald-500 uppercase tracking-wider text-xs">XGB Range</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {thresholdComparison.map((row, i) => (
                            <tr key={i} className={`hover:bg-purple-50/60 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                              <td className="py-2.5 px-4 font-semibold text-xs text-gray-900">{row.Variable}</td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="inline-flex px-2 py-0.5 rounded-lg bg-violet-100 text-violet-700 font-semibold font-mono text-xs">
                                  {fmt(row.HMM_Threshold)}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center text-xs font-mono text-gray-500">
                                [{fmt(row.HMM_Range_Lower)} – {fmt(row.HMM_Range_Upper)}]
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="inline-flex px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 font-semibold font-mono text-xs">
                                  {fmt(row.RF_Threshold)}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center text-xs font-mono text-gray-500">
                                [{fmt(row.RF_Range_Lower)} – {fmt(row.RF_Range_Upper)}]
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="inline-flex px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 font-semibold font-mono text-xs">
                                  {fmt(row.XGB_Threshold)}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center text-xs font-mono text-gray-500">
                                [{fmt(row.XGB_Range_Lower)} – {fmt(row.XGB_Range_Upper)}]
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                </div>
              </section>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            FIVE-CLASS BOUNDARY RANGES
            (Ordered Logit + KDE + BCa Bootstrap — always visible when available)
            ═══════════════════════════════════════════════════════════════════ */}
        {fiveClassThresholds.length > 0 && (
          <FiveClassBoundarySection
            thresholds={fiveClassThresholds}
            recognition={fiveClassRecognition}
          />
        )}
      </div>
    </PageTransition>
  )
}

// ── Five-Class Boundary Section ───────────────────────────────────────────────

const BOUNDARY_CONFIG = [
  { key: 'severe_erosion',    label: 'Severe Erosion',    color: '#dc2626', bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700' },
  { key: 'erosion_onset',     label: 'Erosion Onset',     color: '#f97316', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  { key: 'accretion_onset',   label: 'Accretion Onset',   color: '#22c55e', bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700' },
  { key: 'strong_accretion',  label: 'Strong Accretion',  color: '#0ea5e9', bg: 'bg-sky-50',    border: 'border-sky-200',    badge: 'bg-sky-100 text-sky-700' },
]

const CLASS_ORDER = ['eroded_high', 'eroded_low', 'stable', 'accreted_low', 'accreted_high']
const CLASS_LABELS = {
  eroded_high:   'Strongly Eroded',
  eroded_low:    'Mildly Eroded',
  stable:        'Stable',
  accreted_low:  'Mildly Accreted',
  accreted_high: 'Strongly Accreted',
}
const CLASS_COLORS = {
  eroded_high:   '#dc2626',
  eroded_low:    '#f97316',
  stable:        '#6b7280',
  accreted_low:  '#22c55e',
  accreted_high: '#0ea5e9',
}

function jsdColor(jsd) {
  if (jsd == null || isNaN(jsd)) return 'bg-gray-100 text-gray-500'
  if (jsd >= 0.3) return 'bg-green-100 text-green-700'
  if (jsd >= 0.1) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-600'
}

function RangeBar({ estimate, low95, high95, unit, color }) {
  if (estimate == null) return <span className="text-xs text-gray-400">—</span>
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="font-semibold" style={{ color }}>{Number(estimate).toFixed(3)}</span>
      {low95 != null && high95 != null && (
        <span className="text-gray-400 text-[10px]">
          [{Number(low95).toFixed(3)} – {Number(high95).toFixed(3)}]
        </span>
      )}
      {unit && <span className="text-gray-400">{unit}</span>}
    </div>
  )
}

function FeatureRow({ item, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false)
  const DriverIcon = getDriverIcon(item.driver)
  const methodBadge = item.method?.includes('logit') ? 'Ordered Logit + KDE'
    : item.method?.includes('kde') ? 'KDE Crossing'
    : 'Empirical'

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Row header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-coastal-50/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-coastal-100 flex items-center justify-center flex-shrink-0">
            <DriverIcon className="w-4 h-4 text-coastal-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">{item.feature}</p>
            <p className="text-xs text-gray-500">{item.driver} · {item.direction === 'direct' ? 'Higher → erosion' : 'Lower → erosion'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">{methodBadge}</span>
          {item.spearmanRho != null && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">
              ρ={Number(item.spearmanRho).toFixed(2)}
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-gray-100 bg-gray-50/40 px-4 py-4 space-y-5">
          {/* Boundaries grid */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Ordered Class Boundaries (Ensemble Estimate + 95% BCa CI)</p>
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {BOUNDARY_CONFIG.map(bc => {
                const b = item.boundaries?.[bc.key]
                const jsd = item.jsd?.[bc.key]
                return (
                  <div key={bc.key} className={`rounded-lg border p-3 ${bc.bg} ${bc.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${bc.badge}`}>{bc.label}</span>
                      {jsd != null && !isNaN(jsd) && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${jsdColor(jsd)}`} title="Jensen-Shannon Divergence">
                          JSD {Number(jsd).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <RangeBar
                      estimate={b?.estimate}
                      low95={b?.low95}
                      high95={b?.high95}
                      unit={item.unit}
                      color={bc.color}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Class bands */}
          {item.classBands && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Historical Class Ranges (Q25 – Median – Q75)</p>
              <div className="space-y-2">
                {CLASS_ORDER.map(cl => {
                  const b = item.classBands?.[cl]
                  if (!b || b.count === 0) return null
                  return (
                    <div key={cl} className="flex items-center gap-3 text-xs">
                      <span className="w-28 text-right font-medium text-gray-700 flex-shrink-0">{CLASS_LABELS[cl]}</span>
                      <span className="text-gray-400 font-mono text-[10px]">n={b.count}</span>
                      <div className="flex-1 flex items-center gap-1">
                        <span className="font-mono text-[10px] text-gray-500">{b.q25 != null ? Number(b.q25).toFixed(3) : '--'}</span>
                        <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full rounded-full opacity-70" style={{ backgroundColor: CLASS_COLORS[cl], width: '70%' }} />
                        </div>
                        <span className="font-mono text-[10px] text-gray-500">{b.q75 != null ? Number(b.q75).toFixed(3) : '--'}</span>
                      </div>
                      <span className="font-semibold font-mono text-[10px] w-16 text-center" style={{ color: CLASS_COLORS[cl] }}>
                        med {b.median != null ? Number(b.median).toFixed(3) : '--'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

function FiveClassBoundarySection({ thresholds, recognition }) {
  const [expandAll, setExpandAll] = useState(false)
  const toggleAll = useCallback(() => setExpandAll(e => !e), [])

  const skillItems = recognition ? [
    { label: 'Balanced Accuracy', value: recognition.balancedAccuracy != null ? `${(recognition.balancedAccuracy * 100).toFixed(1)}%` : '--' },
    { label: 'Macro F1', value: recognition.macroF1 != null ? Number(recognition.macroF1).toFixed(3) : '--' },
    { label: 'ROC AUC (OvR)', value: recognition.rocAucOvr != null ? Number(recognition.rocAucOvr).toFixed(3) : '--' },
    { label: 'Features Used', value: recognition.selectedFeatures?.length ?? '--' },
  ] : []

  return (
    <section className="pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-sm">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-display font-bold text-gray-900">Five-Class Ordered Boundary Ranges</h2>
              </div>
              <p className="text-sm text-gray-600 max-w-2xl">
                Ordered logistic regression + KDE crossing ensemble. Boundaries separate five shoreline change classes.
                Uncertainty shown as 95% BCa bootstrap confidence intervals. JSD = Jensen-Shannon Divergence (class separability).
              </p>
            </div>
            <button onClick={toggleAll}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0">
              {expandAll ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
        </motion.div>

        {/* Recognition skill pills */}
        {skillItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-3 mb-6">
            {skillItems.map(si => (
              <div key={si.label} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-xs">
                <span className="text-xs text-gray-500">{si.label}</span>
                <span className="text-xs font-semibold text-teal-700">{si.value}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-gray-500">JSD ≥ 0.3 = well separated</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 ml-1" />
              <span className="text-xs text-gray-500">0.1–0.3 = moderate</span>
              <span className="w-2 h-2 rounded-full bg-red-400 ml-1" />
              <span className="text-xs text-gray-500">&lt; 0.1 = overlapping</span>
            </div>
          </motion.div>
        )}

        {/* Feature rows */}
        <div className="space-y-3">
          {thresholds.map((item, i) => (
            <FeatureRow key={item.feature} item={item} defaultOpen={expandAll || i < 2} />
          ))}
        </div>
      </div>
    </section>
  )
}
