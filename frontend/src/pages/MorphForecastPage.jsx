import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  BarChart3,
  Mountain,
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import PageTransition from '../components/common/PageTransition'
import { useMorphData } from '../context/MorphDataContext'

const VAR_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316',
]

export default function MorphForecastPage() {
  const { data, dataLoaded, loading } = useMorphData()
  const [activeTab, setActiveTab] = useState('vecm')

  const forecasts = data.forecasts || {}
  const forecastCvi = data.forecastCvi || {}
  const vecm = forecasts.vecm || {}
  const linearTrend = forecasts.linearTrend || {}
  const bestModel = forecasts.bestModel || ''

  // Transform VECM forecast data for charts
  const vecmChartData = useMemo(() => {
    if (!vecm || Object.keys(vecm).length === 0) return []
    const vars = Object.keys(vecm)
    const len = vecm[vars[0]]?.length || 0
    return Array.from({ length: len }, (_, i) => {
      const row = { step: i + 1 }
      vars.forEach(v => { row[v] = vecm[v][i] || 0 })
      return row
    })
  }, [vecm])

  // Transform Linear Trend forecast data for charts
  const trendChartData = useMemo(() => {
    if (!linearTrend || Object.keys(linearTrend).length === 0) return []
    const vars = Object.keys(linearTrend)
    const len = linearTrend[vars[0]]?.length || 0
    return Array.from({ length: len }, (_, i) => {
      const row = { step: i + 1 }
      vars.forEach(v => { row[v] = linearTrend[v][i] || 0 })
      return row
    })
  }, [linearTrend])

  const forecastVars = Object.keys(vecm).length > 0 ? Object.keys(vecm) : Object.keys(linearTrend)

  // CVI forecast data
  const cviScore = Number(forecastCvi.score) || 0
  const cviVuln = forecastCvi.vulnerability || 'N/A'
  const cviYear = forecastCvi.year || '—'

  const tabs = [
    { id: 'vecm', name: 'VECM Forecast', icon: TrendingUp },
    { id: 'trend', name: 'Linear Trend', icon: BarChart3 },
    { id: 'comparison', name: 'Model Comparison', icon: Mountain },
    { id: 'cvi', name: 'Forecast CVI', icon: Shield },
  ]

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-coastal-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-10">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold mb-4">
              <TrendingUp className="w-4 h-4" />
              Morphological Forecasting
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-coastal-900 mb-2">
              Environmental <span className="text-emerald-500">Forecast</span> Analysis
            </h1>
            <p className="text-coastal-500 max-w-2xl">
              VECM and Linear Trend forecasting of environmental variables with projected Coastal Vulnerability Index.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-coastal-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-lg font-medium">Loading forecast results...</p>
            </div>
          ) : !dataLoaded ? (
            <div className="flex flex-col items-center justify-center py-20 text-coastal-500">
              <TrendingUp className="w-12 h-12 mb-4 opacity-40" />
              <p className="text-lg font-medium mb-2">No Forecast Data Available</p>
              <p className="text-sm">Upload files and run the morphological analysis first.</p>
              <Link to="/morph/upload" className="mt-4 px-5 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition">
                Go to Upload
              </Link>
            </div>
          ) : (
          <>
            {/* Best Model Badge */}
            {bestModel && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-sm font-semibold border border-emerald-200">
                  <CheckCircle className="w-4 h-4" />
                  Best Model: {bestModel}
                </div>
              </motion.div>
            )}

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                      : 'bg-white text-coastal-600 hover:bg-coastal-50 border border-coastal-200'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </button>
              ))}
            </div>

            <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {/* VECM Forecast */}
              {activeTab === 'vecm' && (
                <div className="space-y-6">
                  <div className="card p-6">
                    <h2 className="text-xl font-display font-bold text-coastal-900 mb-2">VECM Forecast</h2>
                    <p className="text-sm text-coastal-500 mb-6">
                      Vector Error Correction Model multi-step forecast for all environmental variables
                    </p>
                    {vecmChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={vecmChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="step" label={{ value: 'Forecast Step', position: 'insideBottom', offset: -5 }} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {forecastVars.map((v, i) => (
                            <Line key={v} type="monotone" dataKey={v} stroke={VAR_COLORS[i % VAR_COLORS.length]} strokeWidth={2} dot={false} name={v} />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-coastal-400 text-center py-12">No VECM forecast data available</p>
                    )}
                  </div>

                  {/* VECM per-variable cards */}
                  {forecastVars.length > 0 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {forecastVars.map((v, i) => {
                        const vals = vecm[v] || []
                        const last = vals[vals.length - 1] || 0
                        const first = vals[0] || 0
                        const trend = last - first
                        return (
                          <div key={v} className="card p-4">
                            <div className="text-sm text-coastal-500 mb-1">{v}</div>
                            <div className="text-2xl font-bold text-coastal-900">{last.toFixed(3)}</div>
                            <div className={`flex items-center gap-1 text-sm mt-1 ${trend >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                              {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {Math.abs(trend).toFixed(4)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Linear Trend */}
              {activeTab === 'trend' && (
                <div className="space-y-6">
                  <div className="card p-6">
                    <h2 className="text-xl font-display font-bold text-coastal-900 mb-2">Linear Trend Forecast</h2>
                    <p className="text-sm text-coastal-500 mb-6">
                      Linear regression-based extrapolation of environmental variable trends
                    </p>
                    {trendChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={trendChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="step" label={{ value: 'Forecast Step', position: 'insideBottom', offset: -5 }} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {forecastVars.map((v, i) => (
                            <Line key={v} type="monotone" dataKey={v} stroke={VAR_COLORS[i % VAR_COLORS.length]} strokeWidth={2} strokeDasharray="5 5" dot={false} name={v} />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-coastal-400 text-center py-12">No linear trend forecast data available</p>
                    )}
                  </div>
                </div>
              )}

              {/* Model Comparison */}
              {activeTab === 'comparison' && (
                <div className="space-y-6">
                  <div className="card p-6">
                    <h2 className="text-xl font-display font-bold text-coastal-900 mb-2">Model Comparison</h2>
                    <p className="text-sm text-coastal-500 mb-6">
                      Side-by-side comparison of VECM vs Linear Trend final forecasted values
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-coastal-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-coastal-700">Variable</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-emerald-600">VECM (Final)</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-blue-600">Linear Trend (Final)</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-coastal-700">Difference</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-coastal-100">
                          {forecastVars.map((v) => {
                            const vecmVals = vecm[v] || []
                            const trendVals = linearTrend[v] || []
                            const vecmLast = vecmVals[vecmVals.length - 1] || 0
                            const trendLast = trendVals[trendVals.length - 1] || 0
                            const diff = vecmLast - trendLast
                            return (
                              <tr key={v} className="hover:bg-coastal-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-coastal-900">{v}</td>
                                <td className="px-6 py-4 text-sm text-right font-mono text-emerald-600">{vecmLast.toFixed(4)}</td>
                                <td className="px-6 py-4 text-sm text-right font-mono text-blue-600">{trendLast.toFixed(4)}</td>
                                <td className="px-6 py-4 text-sm text-right font-mono">
                                  <span className={diff > 0 ? 'text-amber-600' : 'text-coastal-500'}>
                                    {diff > 0 ? '+' : ''}{diff.toFixed(4)}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {bestModel && (
                    <div className="card p-6">
                      <div className="p-5 bg-emerald-50/80 rounded-xl border border-emerald-200/60">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-medium text-emerald-800">Recommended Model: {bestModel}</div>
                            <div className="text-sm text-emerald-700 mt-1">
                              Based on forecast accuracy metrics, the {bestModel} model provides the most reliable predictions for these environmental variables.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Forecast CVI */}
              {activeTab === 'cvi' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-6">
                    <div className="card p-6 w-full sm:w-auto sm:min-w-[280px]">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-sm text-coastal-500">Forecast Vulnerability</span>
                      </div>
                      <div className="text-3xl font-display font-bold text-emerald-600">{cviVuln}</div>
                      <p className="text-sm text-coastal-500 mt-1">Projected level ({cviYear})</p>
                    </div>
                    <div className="card p-6 w-full sm:w-auto sm:min-w-[280px]">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-ocean-100 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-ocean-600" />
                        </div>
                        <span className="text-sm text-coastal-500">Forecast CVI Score</span>
                      </div>
                      <div className="text-3xl font-display font-bold text-coastal-900">{cviScore.toFixed(2)}</div>
                      <p className="text-sm text-coastal-500 mt-1">Based on {bestModel || 'best'} model</p>
                    </div>
                  </div>

                  {/* Forecast vulnerability scale */}
                  <div className="card p-6">
                    <h3 className="text-lg font-display font-bold text-coastal-900 mb-4">Projected Vulnerability Scale</h3>
                    <div className="relative">
                      <div className="flex h-8 rounded-lg overflow-hidden">
                        {[
                          { level: 'Very Low', color: 'bg-emerald-500', min: 1.0, max: 1.75 },
                          { level: 'Low', color: 'bg-green-500', min: 1.75, max: 2.5 },
                          { level: 'Moderate', color: 'bg-amber-500', min: 2.5, max: 3.25 },
                          { level: 'High', color: 'bg-red-500', min: 3.25, max: 4.0 },
                        ].map((r, i) => (
                          <div key={i} className={`flex-1 flex items-center justify-center text-sm font-medium text-white ${r.color}`}>
                            {r.level}
                          </div>
                        ))}
                      </div>
                      {cviScore > 0 && (
                        <div
                          className="absolute top-10 transform -translate-x-1/2"
                          style={{ left: `${((cviScore - 1.0) / 3.0) * 100}%` }}
                        >
                          <div className="flex flex-col items-center">
                            <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-coastal-800" />
                            <span className="text-sm font-bold text-coastal-800 bg-white px-2 py-1 rounded shadow">
                              {cviScore.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between text-sm text-coastal-500 mt-12">
                      <span>Low Risk (1.0)</span>
                      <span>High Risk (4.0)</span>
                    </div>
                  </div>

                  <div className="card p-6">
                    <div className="p-5 bg-blue-50/80 rounded-xl border border-blue-200/60">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-blue-800">Forecast Interpretation</div>
                          <div className="text-sm text-blue-700 mt-1">
                            This CVI projection uses forecasted environmental values from the {bestModel || 'selected'} model applied to the CVI formula.
                            The score of {cviScore.toFixed(2)} indicates {cviVuln.toLowerCase()} coastal vulnerability for the projected period.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
