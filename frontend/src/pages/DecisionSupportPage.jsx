import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Waves,
  Wind,
  Droplets,
  Activity,
  Target,
  Calendar,
  Gauge,
  ArrowRight,
  BarChart3,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, LineChart, Line, PieChart, Pie,
} from 'recharts'
import PageTransition from '../components/common/PageTransition'
import StatCard from '../components/common/StatCard'
import { useData } from '../context/DataContext'

const RISK_COLORS = {
  Low: '#22c55e', Moderate: '#f59e0b', High: '#ef4444', 'Very High': '#991b1b',
  Monitor: '#22c55e', 'Soft protection': '#f59e0b', 'Hard protection': '#ef4444',
  'Urgent intervention': '#991b1b', 'STANDARD OPS': '#22c55e', 'ROUTINE MONITORING': '#3b82f6',
  'ENHANCED MONITORING': '#f59e0b', 'IMMEDIATE ACTION': '#ef4444',
}
const RISK_BG = {
  Low: 'bg-green-100 text-green-800 border-green-300',
  Moderate: 'bg-amber-100 text-amber-800 border-amber-300',
  High: 'bg-red-100 text-red-800 border-red-300',
  'Very High': 'bg-red-200 text-red-900 border-red-400',
  Strong: 'bg-green-100 text-green-800 border-green-300',
  Weak: 'bg-red-100 text-red-800 border-red-300',
}

const fmt = (v, d = 3) => (v != null && !isNaN(v) ? Number(v).toFixed(d) : '--')
const pct = v => (v != null ? `${(v * 100).toFixed(1)}%` : '--')

const getDriverIcon = (driver) => {
  if (!driver) return Activity
  const d = driver.toLowerCase()
  if (d.includes('hm0') || d.includes('wave') || d.includes('energy')) return Waves
  if (d.includes('wind')) return Wind
  if (d.includes('curr') || d.includes('zos')) return Droplets
  if (d.includes('storm')) return AlertTriangle
  return Activity
}

export default function DecisionSupportPage() {
  const { data, loading } = useData()

  const thresholds = useMemo(() => data?.thresholds || [], [data])
  const monteCarlo = useMemo(() => data?.monteCarlo, [data])
  const retreat = useMemo(() => data?.retreatPredictions || [], [data])
  const monthlyRisk = useMemo(() => data?.monthlyRisk || [], [data])
  const rfModel = useMemo(() => data?.rfModel, [data])
  const forecastSkill = useMemo(() => data?.forecastSkill, [data])
  const summary = useMemo(() => data?.summary, [data])
  const forecastOverview = useMemo(() => data?.forecastOverview, [data])
  const isLegacy = data?.isLegacyFormat

  const hasData = thresholds.length > 0 || monteCarlo || retreat.length > 0

  // Overall risk assessment
  const overallRisk = useMemo(() => {
    if (forecastOverview?.metadata?.overallRisk) return forecastOverview.metadata.overallRisk
    if (!monteCarlo?.horizons?.length) return null
    const maxProb = Math.max(...monteCarlo.horizons.map(h => h.mean_prob || 0))
    if (maxProb > 0.6) return 'High'
    if (maxProb > 0.3) return 'Moderate'
    return 'Low'
  }, [monteCarlo, forecastOverview])

  // Top risk drivers from RF
  const topDrivers = useMemo(() => {
    if (!rfModel?.featureImportance?.length) return []
    return rfModel.featureImportance.slice(0, 5)
  }, [rfModel])

  // Forecast variable details (legacy)
  const forecastVarDetails = useMemo(() => {
    if (!forecastOverview?.variables) return []
    return Object.entries(forecastOverview.variables).map(([name, v]) => {
      const h24 = v.horizons?.['24'] || v.horizons?.['12'] || {}
      return {
        variable: name,
        threshold: v.threshold,
        direction: v.thresholdDirection,
        riskLevel: v.riskLevel,
        historicalMean: v.historicalMean,
        historicalMax: v.historicalMax,
        peakForecast: h24.peakForecast,
        exceedancePct: h24.exceedancePct,
        avgForecast: h24.avgForecast,
      }
    })
  }, [forecastOverview])

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-coastal-50 to-white bg-mesh-1">
        {/* Header */}
        <section className="pt-8 sm:pt-10 pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
              <div className="page-badge bg-red-50 text-red-600 border-red-100 mb-4">
                <ShieldAlert className="w-3.5 h-3.5" />
                Decision Support System
              </div>
              <h1 className="section-title mb-3">Erosion Risk Decision Dashboard</h1>
              <p className="section-subtitle">
                Integrated decision-making view combining threshold analysis, forecast probabilities,
                retreat predictions, and actionable recommendations.
              </p>
            </motion.div>
          </div>
        </section>

        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-coastal-600">Loading decision support data...</p>
          </div>
        ) : !hasData ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-coastal-900 mb-2">No Analysis Results</h3>
            <p className="text-coastal-600">Run the analysis pipeline to generate decision support data.</p>
          </div>
        ) : (
          <>
            {/* ═══ TOP-LEVEL RISK VERDICT ═══ */}
            <section className="pb-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className={`card p-6 border-2 ${
                    overallRisk === 'High' ? 'border-red-400 bg-gradient-to-r from-red-50 to-rose-50' :
                    overallRisk === 'Moderate' ? 'border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50' :
                    'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50'
                  }`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          overallRisk === 'High' ? 'bg-red-500' : overallRisk === 'Moderate' ? 'bg-amber-500' : 'bg-green-500'
                        }`}>
                          <ShieldAlert className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-coastal-500">Overall Erosion Risk Assessment</p>
                          <h2 className={`text-3xl font-bold ${
                            overallRisk === 'High' ? 'text-red-700' : overallRisk === 'Moderate' ? 'text-amber-700' : 'text-green-700'
                          }`}>{overallRisk || 'N/A'} Risk</h2>
                        </div>
                      </div>
                      {summary && (
                        <div className="flex gap-4 mt-3 text-sm text-coastal-600">
                          <span>{summary.totalTransects} transects analysed</span>
                          <span>•</span>
                          <span>{summary.erosionRate}% eroding</span>
                          {summary.erosionYearsList && (
                            <>
                              <span>•</span>
                              <span>Erosion years: {summary.erosionYearsList.join(', ')}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right">
                      {forecastOverview?.metadata?.dataRange && (
                        <p className="text-xs text-coastal-500">Data: {forecastOverview.metadata.dataRange}</p>
                      )}
                      {forecastOverview?.metadata?.forecastFrom && (
                        <p className="text-xs text-coastal-500">Forecast from: {forecastOverview.metadata.forecastFrom}</p>
                      )}
                      {summary?.analysisYearRange && (
                        <p className="text-xs text-coastal-500">Analysis period: {summary.analysisYearRange}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* ═══ SUMMARY STAT CARDS ═══ */}
            <section className="pb-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Threshold Drivers"
                    value={thresholds.length}
                    subtitle="meteorological variables"
                    icon={Target}
                    delay={0.1}
                  />
                  <StatCard
                    title="Forecast Horizons"
                    value={monteCarlo?.horizons?.length || 0}
                    subtitle="prediction windows"
                    icon={Calendar}
                    delay={0.15}
                  />
                  <StatCard
                    title="Max Retreat"
                    value={retreat.length > 0 ? `${fmt(Math.max(...retreat.map(r => r.retreat_m || 0)), 1)} m` : '--'}
                    subtitle="worst-case scenario"
                    icon={TrendingDown}
                    delay={0.2}
                  />
                  <StatCard
                    title="Top Driver"
                    value={topDrivers.length > 0 ? topDrivers[0].feature?.replace(/_annual$/, '') : '--'}
                    subtitle={topDrivers.length > 0 ? `${(topDrivers[0].importance * 100).toFixed(1)}% importance` : ''}
                    icon={Activity}
                    delay={0.25}
                  />
                </div>
              </div>
            </section>

            {/* ═══ MASTER THRESHOLD DECISION TABLE ═══ */}
            {thresholds.length > 0 && (
              <section className="pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3">
                      <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Master Erosion Threshold Decision Table
                      </h3>
                      <p className="text-purple-100 text-xs mt-0.5">
                        When these thresholds are exceeded, erosion risk increases significantly
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-coastal-50/80 border-b-2 border-coastal-200">
                            <th className="py-3.5 px-4 text-left font-semibold text-coastal-600 uppercase tracking-wider text-xs">Driver</th>
                            {isLegacy ? (
                              <>
                                <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">Description</th>
                                <th className="py-3.5 px-3 text-center font-semibold text-purple-600 uppercase tracking-wider text-xs">Consensus Threshold</th>
                                <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">Erosion Range</th>
                                <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">Direction</th>
                                <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">Consensus</th>
                              </>
                            ) : (
                              <>
                                <th className="py-3.5 px-3 text-center font-semibold text-purple-600 uppercase tracking-wider text-xs">Consensus</th>
                                <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">95% CI</th>
                                <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">AUC</th>
                                <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">Agreement</th>
                                <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">p-value</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {thresholds.map((t, i) => {
                            const Icon = getDriverIcon(t.feature)
                            return (
                              <motion.tr key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.05 + i * 0.04 }}
                                className={`hover:bg-purple-50/60 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                                      <Icon className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                      <span className="font-bold text-sm text-gray-900">{t.feature}</span>
                                      {t.unit && <span className="text-xs text-gray-500 ml-1">({t.unit})</span>}
                                    </div>
                                  </div>
                                </td>
                                {isLegacy ? (
                                  <>
                                    <td className="py-3 px-3 text-center text-xs text-gray-600">{t.description || '--'}</td>
                                    <td className="py-3 px-3 text-center">
                                      <span className="inline-flex px-3 py-1 rounded-xl bg-purple-100 text-purple-800 font-bold font-mono text-sm">
                                        {t.direction} {fmt(t.consensusThreshold)}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-center text-xs font-mono text-gray-600">
                                      [{fmt(t.thresholdLow)} – {fmt(t.thresholdHigh)}]
                                    </td>
                                    <td className="py-3 px-3 text-center text-xs text-gray-600">{t.direction}</td>
                                    <td className="py-3 px-3 text-center">
                                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${RISK_BG[t.modelConsensus] || 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                                        {t.modelConsensus}
                                      </span>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="py-3 px-3 text-center">
                                      <span className="inline-flex px-3 py-1 rounded-xl bg-purple-100 text-purple-800 font-bold font-mono text-sm">
                                        {fmt(t.thresholdAll || t.consensusThreshold)}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-center text-xs font-mono text-gray-600">
                                      [{fmt(t.thresholdLow)} – {fmt(t.thresholdHigh)}]
                                    </td>
                                    <td className="py-3 px-3 text-center text-xs font-mono">{fmt(t.auc, 2) || '--'}</td>
                                    <td className="py-3 px-3 text-center text-xs">{t.agreement || '--'}</td>
                                    <td className="py-3 px-3 text-center">
                                      {t.pValue != null ? (
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${
                                          t.pValue < 0.05 ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-300'
                                        }`}>{Number(t.pValue).toExponential(2)}</span>
                                      ) : '--'}
                                    </td>
                                  </>
                                )}
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

            {/* ═══ FORECAST VARIABLE RISK (LEGACY FORMAT) ═══ */}
            {forecastVarDetails.length > 0 && (
              <section className="pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-600 to-red-600 px-5 py-3">
                      <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Forecast Variable Risk Assessment
                      </h3>
                      <p className="text-orange-100 text-xs mt-0.5">Threshold exceedance analysis per meteorological driver</p>
                    </div>
                    <div className="p-5">
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {forecastVarDetails.map((v, i) => {
                          const Icon = getDriverIcon(v.variable)
                          const isHigh = v.riskLevel === 'High' || v.riskLevel === 'Very High'
                          return (
                            <motion.div key={i}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 + i * 0.05 }}
                              className={`p-4 rounded-xl border-2 ${
                                isHigh ? 'border-red-300 bg-gradient-to-br from-red-50 to-rose-50' :
                                v.riskLevel === 'Moderate' ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50' :
                                'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50'
                              }`}>
                              <div className="flex items-center gap-2 mb-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  isHigh ? 'bg-red-500' : v.riskLevel === 'Moderate' ? 'bg-amber-500' : 'bg-green-500'
                                }`}>
                                  <Icon className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <div className="font-bold text-sm text-gray-900">{v.variable}</div>
                                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${RISK_BG[v.riskLevel] || 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                                    {v.riskLevel}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Threshold</span>
                                  <span className="font-mono font-bold">{v.direction} {fmt(v.threshold, 2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Peak Forecast</span>
                                  <span className={`font-mono font-bold ${v.peakForecast > v.threshold ? 'text-red-600' : 'text-green-600'}`}>
                                    {fmt(v.peakForecast, 2)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Exceedance</span>
                                  <span className={`font-bold ${(v.exceedancePct || 0) > 50 ? 'text-red-600' : 'text-green-600'}`}>
                                    {v.exceedancePct != null ? `${v.exceedancePct}%` : '--'} of months
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Historical Mean</span>
                                  <span className="font-mono text-gray-600">{fmt(v.historicalMean, 2)}</span>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </section>
            )}

            {/* ═══ EROSION PROBABILITY BY HORIZON ═══ */}
            {monteCarlo?.horizons?.length > 0 && (
              <section className="pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3">
                      <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Erosion Probability by Forecast Horizon
                      </h3>
                      <p className="text-indigo-100 text-xs mt-0.5">
                        {monteCarlo.nSimulations?.toLocaleString()} simulations | Threshold exceedance probabilities
                      </p>
                    </div>
                    <div className="p-5">
                      <div className="h-64">
                        <ResponsiveContainer>
                          <BarChart data={monteCarlo.horizons}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="horizon" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={[0, 'auto']} tick={{ fontSize: 12 }} />
                            <Tooltip formatter={v => `${(Number(v) * 100).toFixed(1)}%`} />
                            <Bar dataKey="mean_prob" name="Erosion Probability" radius={[6, 6, 0, 0]}>
                              {monteCarlo.horizons.map((h, i) => (
                                <Cell key={i} fill={RISK_COLORS[h.risk_category] || '#6366f1'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                        {monteCarlo.horizons.map((h, i) => (
                          <div key={i} className={`p-3 rounded-xl border-2 ${
                            h.risk_category === 'High' ? 'border-red-200 bg-red-50' :
                            h.risk_category === 'Moderate' ? 'border-amber-200 bg-amber-50' :
                            'border-green-200 bg-green-50'
                          }`}>
                            <div className="text-xs font-semibold text-coastal-600 mb-1">{h.horizon}</div>
                            <div className="text-2xl font-bold text-coastal-900">{pct(h.mean_prob)}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${RISK_BG[h.risk_category] || ''}`}>
                                {h.risk_category}
                              </span>
                            </div>
                            {h.ci_lower_95 != null && (
                              <div className="text-[10px] text-coastal-400 mt-1">
                                95% CI: [{pct(h.ci_lower_95)} – {pct(h.ci_upper_95)}]
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </section>
            )}

            {/* ═══ RETREAT PREDICTIONS & ACTION LEVELS ═══ */}
            {retreat.length > 0 && (
              <section className="pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card overflow-hidden">
                    <div className="bg-gradient-to-r from-red-600 to-rose-600 px-5 py-3">
                      <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Shoreline Retreat Predictions & Action Recommendations
                      </h3>
                    </div>
                    <div className="p-5">
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {retreat.map((r, i) => {
                          const color = RISK_COLORS[r.action_level] || '#6366f1'
                          return (
                            <motion.div key={i}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 + i * 0.05 }}
                              className="p-4 rounded-xl border-2 bg-white"
                              style={{ borderColor: color + '60' }}>
                              <div className="text-xs font-semibold text-coastal-500 mb-1">{r.horizon}</div>
                              <div className="text-3xl font-bold text-coastal-900">{fmt(r.retreat_m, 1)} m</div>
                              <div className="mt-2 space-y-1.5">
                                <div className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: color }}>
                                  {r.action_level}
                                </div>
                                {r.erosion_prob != null && (
                                  <div className="text-xs text-coastal-500">
                                    P(erosion) = {pct(r.erosion_prob)}
                                  </div>
                                )}
                                {r.retreat_low_95 != null && (
                                  <div className="text-[10px] text-coastal-400">
                                    95% CI: [{fmt(r.retreat_low_95, 1)} – {fmt(r.retreat_high_95, 1)}] m
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Action level legend */}
                    <div className="border-t border-coastal-200 p-4 bg-gray-50">
                      <h4 className="text-xs font-bold text-coastal-600 uppercase tracking-wider mb-3">Action Level Guide</h4>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div className="flex items-start gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500 mt-0.5 flex-shrink-0" />
                          <div><strong>Monitor</strong> – Continue routine surveillance, no immediate action needed</div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500 mt-0.5 flex-shrink-0" />
                          <div><strong>Soft Protection</strong> – Beach nourishment, vegetation planting recommended</div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500 mt-0.5 flex-shrink-0" />
                          <div><strong>Hard Protection</strong> – Seawalls, revetments, groynes may be required</div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-900 mt-0.5 flex-shrink-0" />
                          <div><strong>Urgent Intervention</strong> – Immediate engineering response needed</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </section>
            )}

            {/* ═══ TOP RISK DRIVERS (RF FEATURE IMPORTANCE) ═══ */}
            {topDrivers.length > 0 && (
              <section className="pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3">
                      <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                        <Gauge className="w-4 h-4" />
                        Top Erosion Risk Drivers (Random Forest Importance)
                      </h3>
                    </div>
                    <div className="p-5">
                      <div className="h-56">
                        <ResponsiveContainer>
                          <BarChart data={topDrivers} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} />
                            <YAxis dataKey="feature" type="category" width={140} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={v => `${(Number(v) * 100).toFixed(1)}%`} />
                            <Bar dataKey="importance" name="Importance" fill="#0891b2" radius={[0, 6, 6, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </section>
            )}

            {/* ═══ MONTHLY RISK TIMELINE ═══ */}
            {monthlyRisk.length > 0 && (
              <section className="pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="card overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-600 to-gray-700 px-5 py-3">
                      <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Monthly Threshold Exceedance Timeline
                      </h3>
                    </div>
                    <div className="p-5">
                      <div className="h-48">
                        <ResponsiveContainer>
                          <BarChart data={monthlyRisk}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, angle: -45 }} textAnchor="end" height={50} />
                            <YAxis tick={{ fontSize: 11 }} label={{ value: 'Thresholds Exceeded', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="n_exceeded" name="Exceeded" radius={[4, 4, 0, 0]}>
                              {monthlyRisk.map((m, i) => (
                                <Cell key={i} fill={
                                  m.risk_label === 'Alert' ? '#ef4444' :
                                  m.risk_label === 'Warning' ? '#f59e0b' :
                                  m.risk_label === 'Watch' ? '#3b82f6' :
                                  '#22c55e'
                                } />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex gap-4 mt-3 text-xs justify-center">
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500" /><span>Alert</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500" /><span>Warning</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-500" /><span>Watch</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500" /><span>Stable</span></div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </section>
            )}

            {/* ═══ DECISION FRAMEWORK INFO ═══ */}
            <section className="pb-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="card p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border-blue-200/60">
                  <h3 className="font-display font-bold text-blue-900 text-base mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Decision Framework
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-blue-900">
                    <div className="p-3 rounded-xl bg-white/80 border border-blue-200">
                      <div className="font-bold text-red-600 mb-1">P {'>'} 60% — HIGH RISK</div>
                      <p>Immediate action required. Deploy hard coastal protection measures. Alert all stakeholders.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/80 border border-blue-200">
                      <div className="font-bold text-amber-600 mb-1">P 30-60% — MODERATE</div>
                      <p>Enhanced monitoring. Prepare soft protection options. Conduct detailed site assessment.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/80 border border-blue-200">
                      <div className="font-bold text-blue-600 mb-1">P 10-30% — LOW</div>
                      <p>Routine monitoring schedule. Continue data collection. Update forecasts quarterly.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/80 border border-blue-200">
                      <div className="font-bold text-green-600 mb-1">P {'<'} 10% — MINIMAL</div>
                      <p>Standard operations. Annual monitoring cycle. No protective action needed.</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>
          </>
        )}
      </div>
    </PageTransition>
  )
}
