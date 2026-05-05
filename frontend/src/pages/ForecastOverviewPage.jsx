import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  BarChart3,
  Target,
  AlertTriangle,
  ArrowRight,
  Activity,
  Waves,
  Wind,
  Droplets,
  Gauge,
  Calendar,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell,
} from 'recharts'
import PageTransition from '../components/common/PageTransition'
import StatCard from '../components/common/StatCard'
import { useData } from '../context/DataContext'

const RISK_COLORS = { Low: '#22c55e', Moderate: '#f59e0b', High: '#ef4444', 'Very High': '#991b1b' }

const fmt = (v, d = 2) => (v != null && !isNaN(v) ? Number(v).toFixed(d) : '--')
const pct = (v) => (v != null ? `${(v * 100).toFixed(1)}%` : '--')

export default function ForecastOverviewPage() {
  const { data, loading } = useData()
  const [activeTab, setActiveTab] = useState('montecarlo')

  const monteCarlo = useMemo(() => data?.monteCarlo, [data])
  const forecastSkill = useMemo(() => data?.forecastSkill, [data])
  const monthlyRisk = useMemo(() => data?.monthlyRisk || [], [data])
  const sarimaDiag = useMemo(() => data?.sarimaDiagnostics || [], [data])
  const sarimaForecasts = useMemo(() => data?.sarimaForecasts || {}, [data])
  const hindcast = useMemo(() => data?.hindcast, [data])
  const retreat = useMemo(() => data?.retreatPredictions || [], [data])

  const hasData = monteCarlo || sarimaDiag.length > 0 || Object.keys(sarimaForecasts).length > 0

  const tabs = [
    { id: 'montecarlo', label: 'Monte Carlo', icon: BarChart3 },
    { id: 'sarima', label: 'SARIMA Models', icon: Activity },
    { id: 'risk', label: 'Monthly Risk', icon: Calendar },
  ]

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-coastal-50 to-white bg-mesh-1">
        {/* Header */}
        <section className="pt-8 sm:pt-10 pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
              <div className="page-badge bg-indigo-50 text-indigo-600 border-indigo-100 mb-4">
                <TrendingUp className="w-3.5 h-3.5" />
                Advanced Forecast Pipeline
              </div>
              <h1 className="section-title mb-3">Erosion Forecast Overview</h1>
              <p className="section-subtitle">
                SARIMA-based meteorological forecasts, Monte Carlo erosion probability,
                and forecast skill assessment.
              </p>
            </motion.div>
          </div>
        </section>

        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-coastal-600">Loading forecast data...</p>
          </div>
        ) : !hasData ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-coastal-900 mb-2">No Forecast Data</h3>
            <p className="text-coastal-600 mb-4">Run the analysis to generate forecasts.</p>
            <Link to="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
              Open Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <section className="pb-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Forecast Horizons"
                    value={monteCarlo?.horizons?.length || 0}
                    subtitle="prediction windows"
                    icon={TrendingUp}
                    delay={0.1}
                  />
                  <StatCard
                    title="SARIMA Variables"
                    value={Object.keys(sarimaForecasts).length}
                    subtitle="forecasted features"
                    icon={Activity}
                    delay={0.15}
                  />
                  <StatCard
                    title="Brier Skill Score"
                    value={forecastSkill ? fmt(forecastSkill.brierSkillScore, 3) : '--'}
                    subtitle={forecastSkill?.skillful ? 'Skillful' : 'Below climatology'}
                    icon={Target}
                    delay={0.2}
                  />
                  <StatCard
                    title="Hindcast Accuracy"
                    value={hindcast ? pct(hindcast.metrics?.accuracy) : '--'}
                    subtitle={hindcast ? `${hindcast.metrics?.totalYears} years validated` : 'not available'}
                    icon={Gauge}
                    delay={0.25}
                  />
                </div>
              </div>
            </section>

            {/* Quick links to sub-pages */}
            <section className="pb-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Link to="/forecast/retreat" className="card p-4 hover:shadow-lg transition-shadow group">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-sm text-coastal-900">Retreat & Vulnerability</h3>
                        <p className="text-xs text-coastal-500 mt-1">Shoreline retreat predictions in meters and per-transect vulnerability</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-coastal-400 group-hover:text-ocean-500 transition-colors" />
                    </div>
                  </Link>
                  <Link to="/forecast/hindcast" className="card p-4 hover:shadow-lg transition-shadow group">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-sm text-coastal-900">Hindcast Validation</h3>
                        <p className="text-xs text-coastal-500 mt-1">Leave-one-year-out cross-validation with confusion matrix</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-coastal-400 group-hover:text-ocean-500 transition-colors" />
                    </div>
                  </Link>
                </div>
              </div>
            </section>

            {/* Tabs */}
            <section className="pb-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white text-coastal-600 hover:bg-coastal-50 border border-coastal-200'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Monte Carlo Tab */}
                {activeTab === 'montecarlo' && monteCarlo && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="card overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3">
                        <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Monte Carlo Erosion Probability ({monteCarlo.nSimulations?.toLocaleString()} simulations)
                        </h3>
                      </div>
                      <div className="p-5">
                        <div className="h-72">
                          <ResponsiveContainer>
                            <BarChart data={monteCarlo.horizons}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="horizon" tick={{ fontSize: 12 }} />
                              <YAxis tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={[0, 1]} tick={{ fontSize: 12 }} />
                              <Tooltip formatter={v => `${(v * 100).toFixed(1)}%`} />
                              <Bar dataKey="mean_prob" name="Erosion Probability" radius={[6, 6, 0, 0]}>
                                {(monteCarlo.horizons || []).map((h, i) => (
                                  <Cell key={i} fill={RISK_COLORS[h.risk_category] || '#6366f1'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        {/* Horizon detail cards */}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                          {(monteCarlo.horizons || []).map((h, i) => (
                            <div key={i} className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200">
                              <div className="text-xs font-semibold text-coastal-600 mb-1">{h.horizon || `Horizon ${i + 1}`}</div>
                              <div className="text-2xl font-bold text-coastal-900">{pct(h.mean_prob)}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold`}
                                  style={{ backgroundColor: `${RISK_COLORS[h.risk_category] || '#6366f1'}20`, color: RISK_COLORS[h.risk_category] || '#6366f1' }}>
                                  {h.risk_category || 'N/A'}
                                </span>
                                <span className="text-[10px] text-coastal-400">CI: {pct(h.ci_lower)} – {pct(h.ci_upper)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Forecast Skill */}
                    {forecastSkill && (
                      <div className="card p-5">
                        <h4 className="font-semibold text-sm text-coastal-900 mb-4 flex items-center gap-2">
                          <Target className="w-4 h-4 text-indigo-500" />
                          Forecast Skill Assessment
                        </h4>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="text-center p-3 rounded-xl bg-gray-50">
                            <div className="text-xs text-coastal-500 mb-1">Base Rate</div>
                            <div className="text-lg font-bold text-coastal-900">{pct(forecastSkill.baseRate)}</div>
                          </div>
                          <div className="text-center p-3 rounded-xl bg-gray-50">
                            <div className="text-xs text-coastal-500 mb-1">Brier Score (Forecast)</div>
                            <div className="text-lg font-bold text-coastal-900">{fmt(forecastSkill.brierScoreForecast, 4)}</div>
                          </div>
                          <div className="text-center p-3 rounded-xl bg-gray-50">
                            <div className="text-xs text-coastal-500 mb-1">Brier Score (Climatology)</div>
                            <div className="text-lg font-bold text-coastal-900">{fmt(forecastSkill.brierScoreClimatology, 4)}</div>
                          </div>
                          <div className={`text-center p-3 rounded-xl ${forecastSkill.skillful ? 'bg-green-50 ring-1 ring-green-200' : 'bg-red-50 ring-1 ring-red-200'}`}>
                            <div className="text-xs text-coastal-500 mb-1">Brier Skill Score</div>
                            <div className={`text-lg font-bold ${forecastSkill.skillful ? 'text-green-700' : 'text-red-700'}`}>
                              {fmt(forecastSkill.brierSkillScore, 4)}
                            </div>
                            <div className={`text-[10px] font-semibold ${forecastSkill.skillful ? 'text-green-600' : 'text-red-600'}`}>
                              {forecastSkill.skillful ? '✓ Skillful' : '✗ Below climatology'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* SARIMA Diagnostics Tab */}
                {activeTab === 'sarima' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {sarimaDiag.length > 0 && (
                      <div className="card overflow-hidden">
                        <div className="bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-3">
                          <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            SARIMA Model Selection (AIC Grid Search)
                          </h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-coastal-50/80 border-b-2 border-coastal-200">
                                {Object.keys(sarimaDiag[0] || {}).map(col => (
                                  <th key={col} className="py-3 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">
                                    {col.replace(/_/g, ' ')}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {sarimaDiag.map((row, i) => (
                                <tr key={i} className={`hover:bg-cyan-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                  {Object.values(row).map((val, j) => (
                                    <td key={j} className="py-2.5 px-3 text-center text-xs font-mono">
                                      {typeof val === 'number' ? fmt(val, 2) : String(val ?? '--')}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* SARIMA Forecast Summary Cards */}
                    {Object.keys(sarimaForecasts).length > 0 && (
                      <div className="card p-5">
                        <h4 className="font-semibold text-sm text-coastal-900 mb-4">SARIMA Forecast Variables</h4>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Object.entries(sarimaForecasts).map(([varName, fcData]) => {
                            const monthly = fcData?.monthly || []
                            const values = monthly.map(m => m.forecast || m.mean || 0).filter(v => !isNaN(v))
                            const avg = values.length ? (values.reduce((a, b) => a + b) / values.length) : 0
                            const VarIcon = varName.toLowerCase().includes('wave') || varName.toLowerCase().includes('hm0') ? Waves
                              : varName.toLowerCase().includes('wind') ? Wind
                              : varName.toLowerCase().includes('curr') ? Droplets : Activity
                            return (
                              <div key={varName} className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <VarIcon className="w-4 h-4 text-cyan-500" />
                                  <span className="text-xs font-semibold text-coastal-800 truncate">{varName}</span>
                                </div>
                                <div className="text-lg font-bold text-coastal-900">{fmt(avg, 3)}</div>
                                <div className="text-[10px] text-coastal-500">{monthly.length} months forecasted</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Monthly Risk Tab */}
                {activeTab === 'risk' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {monthlyRisk.length > 0 ? (
                      <div className="card overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-3">
                          <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Monthly Risk Timeline
                          </h3>
                        </div>
                        <div className="p-5">
                          <div className="h-72">
                            <ResponsiveContainer>
                              <LineChart data={monthlyRisk}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                                <YAxis tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={[0, 1]} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={v => typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : v} />
                                <Legend />
                                <Line type="monotone" dataKey="risk" name="Erosion Risk" stroke="#f59e0b" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          {/* Table view */}
                          <div className="mt-4 overflow-x-auto max-h-96">
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-white">
                                <tr className="border-b-2 border-coastal-200">
                                  {Object.keys(monthlyRisk[0] || {}).map(col => (
                                    <th key={col} className="py-2 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {monthlyRisk.map((row, i) => (
                                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                    {Object.values(row).map((val, j) => (
                                      <td key={j} className="py-2 px-3 text-center text-xs font-mono">
                                        {typeof val === 'number' ? fmt(val, 3) : String(val ?? '--')}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-coastal-500">No monthly risk data available.</div>
                    )}
                  </motion.div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </PageTransition>
  )
}
