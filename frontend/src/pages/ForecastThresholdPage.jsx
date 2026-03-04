import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Waves,
  Wind,
  Droplets,
  Activity,
  Calendar,
  BarChart3,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend, BarChart, Bar, Cell,
} from 'recharts'
import PageTransition from '../components/common/PageTransition'
import Tabs from '../components/common/Tabs'
import { useData } from '../context/DataContext'

// ── Variable display config ──
const VARIABLE_META = {
  Hm0_max: {
    label: 'Max Wave Height',
    shortLabel: 'Wave Height',
    unit: 'm',
    icon: Waves,
    color: '#3b82f6',
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    description: 'Maximum significant wave height – primary erosion driver',
  },
  UcurrMax: {
    label: 'Max Current Speed',
    shortLabel: 'Current',
    unit: 'm/s',
    icon: Droplets,
    color: '#06b6d4',
    gradient: 'from-cyan-500 to-teal-500',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    badge: 'bg-cyan-100 text-cyan-700',
    description: 'Maximum ocean current velocity – offshore sediment transport',
  },
  WindMax: {
    label: 'Max Wind Speed',
    shortLabel: 'Wind',
    unit: 'm/s',
    icon: Wind,
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
    badge: 'bg-violet-100 text-violet-700',
    description: 'Maximum wind speed – wave generation and surge',
  },
  CumCurrent: {
    label: 'Cumulative Current',
    shortLabel: 'Cum. Current',
    unit: 'm/day',
    icon: Droplets,
    color: '#14b8a6',
    gradient: 'from-teal-500 to-emerald-500',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-700',
    badge: 'bg-teal-100 text-teal-700',
    description: 'Cumulative current transport – sustained sediment flux',
  },
  StormDays_wave: {
    label: 'Storm Wave Days',
    shortLabel: 'Storm Days',
    unit: 'days',
    icon: Activity,
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    description: 'Number of storm-wave days – prolonged high-energy exposure',
  },
}

const RISK_COLORS = {
  High: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  Medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  Low: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
}

const HORIZON_OPTIONS = [
  { value: '6', label: '6 Months' },
  { value: '12', label: '12 Months' },
  { value: '18', label: '18 Months' },
  { value: '24', label: '24 Months' },
]

function TrendIcon({ value }) {
  if (value > 2) return <ArrowUpRight className="w-4 h-4 text-red-500" />
  if (value < -2) return <ArrowDownRight className="w-4 h-4 text-emerald-500" />
  return <Minus className="w-4 h-4 text-coastal-400" />
}

function RiskBadge({ level }) {
  const style = RISK_COLORS[level] || RISK_COLORS.Low
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.badge}`}>
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      {level} Risk
    </span>
  )
}

// Custom tooltip for forecast charts
function ForecastTooltip({ active, payload, label, unit, threshold }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-coastal-200 rounded-xl shadow-lg p-3 text-sm">
      <div className="font-semibold text-coastal-900 mb-1">{label}</div>
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-coastal-600">Predicted:</span>
          <span className="font-mono font-medium">{d?.predicted?.toFixed(3)} {unit}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-200" />
          <span className="text-coastal-600">95% CI:</span>
          <span className="font-mono">{d?.ci_lower?.toFixed(3)} – {d?.ci_upper?.toFixed(3)}</span>
        </div>
        {threshold && (
          <div className="flex items-center gap-2 pt-1 border-t border-coastal-100">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-coastal-600">Threshold:</span>
            <span className="font-mono font-medium">{threshold.toFixed(3)} {unit}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ForecastThresholdPage() {
  const { data } = useData()
  const [selectedHorizon, setSelectedHorizon] = useState('12')
  const [activeTab, setActiveTab] = useState('overview')

  const forecasts = data.forecasts
  const metadata = forecasts?.metadata || {}
  const variables = forecasts?.variables || {}
  const varKeys = Object.keys(variables)

  // ── Compute summary stats for selected horizon ──
  const summaryCards = useMemo(() => {
    if (!varKeys.length) return []
    return varKeys.map((key) => {
      const v = variables[key]
      const meta = VARIABLE_META[key] || {}
      const horizonData = v?.horizons?.[selectedHorizon]
      return {
        key,
        label: meta.shortLabel || key,
        unit: meta.unit || '',
        icon: meta.icon || Activity,
        color: meta.color || '#6b7280',
        gradient: meta.gradient || 'from-gray-500 to-gray-600',
        threshold: v?.threshold,
        avgForecast: horizonData?.avgForecast,
        peakForecast: horizonData?.peakForecast,
        exceedancePct: horizonData?.exceedancePct,
        trendPct: horizonData?.trendPct,
        riskLevel: v?.riskLevel || 'Low',
        historicalMean: v?.historicalMean,
      }
    })
  }, [variables, varKeys, selectedHorizon])

  // ── Overall risk ──
  const overallRisk = metadata.overallRisk || 'Low'

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Variable Details' },
    { id: 'validation', label: 'Model Validation' },
  ]

  const noData = !forecasts || varKeys.length === 0

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-coastal-50 to-white bg-mesh-1">
        {/* Header */}
        <section className="pt-8 sm:pt-10 pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <div className="page-badge bg-teal-50 text-teal-600 border-teal-100 mb-4">
                <TrendingUp className="w-3.5 h-3.5" />
                SARIMA Forecasting
              </div>
              <h1 className="section-title mb-3">
                Meteorological Threshold Forecasting
              </h1>
              <p className="section-subtitle">
                SARIMA-based forecasting of 5 key erosion drivers using {metadata.totalMonths || '~300'} months
                of historical data ({metadata.dataRange || '2000–2024'}). Select a forecast horizon to view
                predicted threshold exceedance and risk for each variable.
              </p>
            </motion.div>
          </div>
        </section>

        {noData ? (
          <section className="pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="card p-12 text-center">
                <TrendingUp className="w-12 h-12 text-coastal-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-coastal-700 mb-2">No Forecast Data Available</h3>
                <p className="text-coastal-500">
                  Run the full analysis notebook to generate SARIMA forecasts for each environmental variable.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* Horizon Selector + Overall Risk */}
            <section className="pb-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Horizon buttons */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-coastal-500" />
                    <span className="text-sm font-medium text-coastal-600 mr-2">Forecast Horizon:</span>
                    <div className="flex gap-1.5 bg-white rounded-xl p-1 border border-coastal-200/60 shadow-sm">
                      {HORIZON_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSelectedHorizon(opt.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedHorizon === opt.value
                              ? 'bg-teal-500 text-white shadow-sm'
                              : 'text-coastal-600 hover:bg-coastal-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Overall risk badge */}
                  <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${RISK_COLORS[overallRisk]?.bg} ${RISK_COLORS[overallRisk]?.border}`}>
                    <ShieldAlert className={`w-5 h-5 ${RISK_COLORS[overallRisk]?.text}`} />
                    <div>
                      <div className="text-xs font-medium text-coastal-500">Overall Erosion Risk</div>
                      <div className={`text-lg font-bold ${RISK_COLORS[overallRisk]?.text}`}>{overallRisk}</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Summary Cards */}
            <section className="pb-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {summaryCards.map((card, idx) => {
                    const Icon = card.icon
                    const exceeds = card.threshold && card.avgForecast >= card.threshold
                    return (
                      <motion.div
                        key={card.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + idx * 0.05 }}
                        className={`card p-4 border-l-4 ${exceeds ? 'border-l-red-400' : 'border-l-emerald-400'}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" style={{ color: card.color }} />
                            <span className="text-sm font-semibold text-coastal-700">{card.label}</span>
                          </div>
                          <RiskBadge level={card.riskLevel} />
                        </div>
                        <div className="text-2xl font-bold text-coastal-900 mb-1">
                          {card.avgForecast?.toFixed(2)} <span className="text-sm font-normal text-coastal-500">{card.unit}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-coastal-500">
                            Threshold: {card.threshold?.toFixed(2)} {card.unit}
                          </span>
                          <div className="flex items-center gap-1">
                            <TrendIcon value={card.trendPct} />
                            <span className={card.trendPct > 0 ? 'text-red-600' : 'text-emerald-600'}>
                              {card.trendPct > 0 ? '+' : ''}{card.trendPct?.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 bg-coastal-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${exceeds ? 'bg-red-400' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.min(card.exceedancePct || 0, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-coastal-500 mt-1">
                          {card.exceedancePct?.toFixed(0)}% months exceed threshold
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Tabs */}
            <section className="pb-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                  <div className="mt-6">
                    <AnimatePresence mode="wait">
                      {/* ===================== OVERVIEW TAB ===================== */}
                      {activeTab === 'overview' && (
                        <motion.div
                          key="overview"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {/* Forecast charts for each variable */}
                          <div className="space-y-6">
                            {varKeys.map((varKey) => {
                              const v = variables[varKey]
                              const meta = VARIABLE_META[varKey] || {}
                              const horizonData = v?.horizons?.[selectedHorizon]
                              const monthly = horizonData?.monthly || []

                              return (
                                <div key={varKey} className="card p-5">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      {meta.icon && <meta.icon className="w-5 h-5" style={{ color: meta.color }} />}
                                      <div>
                                        <h4 className="font-semibold text-coastal-900">{meta.label || varKey}</h4>
                                        <p className="text-xs text-coastal-500">{meta.description}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <RiskBadge level={v?.riskLevel} />
                                      <div className="text-right">
                                        <div className="text-xs text-coastal-500">Exceedance</div>
                                        <div className="text-lg font-bold text-coastal-900">
                                          {horizonData?.exceedancePct?.toFixed(0)}%
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={monthly} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip content={<ForecastTooltip unit={meta.unit} threshold={v?.threshold} />} />
                                        {v?.threshold && (
                                          <ReferenceLine
                                            y={v.threshold}
                                            stroke="#f97316"
                                            strokeDasharray="8 4"
                                            strokeWidth={2}
                                            label={{ value: `Threshold: ${v.threshold.toFixed(2)}`, position: 'right', fontSize: 11, fill: '#f97316' }}
                                          />
                                        )}
                                        <ReferenceLine
                                          y={v?.historicalMean}
                                          stroke="#94a3b8"
                                          strokeDasharray="4 4"
                                          strokeWidth={1}
                                          label={{ value: 'Hist. Mean', position: 'left', fontSize: 10, fill: '#94a3b8' }}
                                        />
                                        <Area
                                          type="monotone"
                                          dataKey="ci_upper"
                                          stroke="none"
                                          fill={meta.color || '#3b82f6'}
                                          fillOpacity={0.08}
                                          name="CI Upper"
                                        />
                                        <Area
                                          type="monotone"
                                          dataKey="ci_lower"
                                          stroke="none"
                                          fill="#ffffff"
                                          fillOpacity={1}
                                          name="CI Lower"
                                        />
                                        <Line
                                          type="monotone"
                                          dataKey="predicted"
                                          stroke={meta.color || '#3b82f6'}
                                          strokeWidth={2.5}
                                          dot={{ r: 3, fill: meta.color || '#3b82f6' }}
                                          name="Predicted"
                                        />
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </div>

                                  {/* Quick stats row */}
                                  <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-coastal-100">
                                    <div>
                                      <div className="text-xs text-coastal-500">Avg Forecast</div>
                                      <div className="font-semibold text-coastal-900">
                                        {horizonData?.avgForecast?.toFixed(3)} {meta.unit}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-coastal-500">Peak Forecast</div>
                                      <div className="font-semibold text-coastal-900">
                                        {horizonData?.peakForecast?.toFixed(3)} {meta.unit}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-coastal-500">Historical Mean</div>
                                      <div className="font-semibold text-coastal-500">
                                        {v?.historicalMean?.toFixed(3)} {meta.unit}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-coastal-500">Trend vs History</div>
                                      <div className="flex items-center gap-1">
                                        <TrendIcon value={horizonData?.trendPct} />
                                        <span className={`font-semibold ${horizonData?.trendPct > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                          {horizonData?.trendPct > 0 ? '+' : ''}{horizonData?.trendPct?.toFixed(1)}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Info box */}
                          <div className="mt-6 card p-5 bg-gradient-to-br from-teal-50/80 to-emerald-50/80 border-teal-200/60">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                                <Info className="w-4 h-4 text-teal-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-teal-800 mb-1">About SARIMA Forecasting</h4>
                                <p className="text-sm text-teal-700">
                                  Each variable is modelled independently using Seasonal ARIMA with automatic
                                  order selection (grid-search by AIC). The model captures both long-term trends
                                  and 12-month monsoon seasonality. The shaded area shows 95% confidence intervals
                                  which widen further into the future reflecting increasing uncertainty.
                                  Exceedance probability is computed from the forecast distribution at each month.
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ===================== DETAILS TAB ===================== */}
                      {activeTab === 'details' && (
                        <motion.div
                          key="details"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {/* Comparison table across all horizons */}
                          <div className="card p-5 mb-6">
                            <h3 className="font-display font-bold text-coastal-900 mb-4">
                              Forecast Comparison Across Horizons
                            </h3>
                            <div className="overflow-x-auto rounded-xl ring-1 ring-coastal-200/60">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-coastal-50/80 border-b border-coastal-200">
                                    <th className="text-left py-3.5 px-4 font-semibold text-coastal-700">Variable</th>
                                    <th className="text-center py-3.5 px-4 font-semibold text-coastal-700">Threshold</th>
                                    <th className="text-center py-3.5 px-4 font-semibold text-coastal-700">Hist. Mean</th>
                                    {HORIZON_OPTIONS.map((h) => (
                                      <th key={h.value} className={`text-center py-3.5 px-4 font-semibold ${
                                        h.value === selectedHorizon ? 'text-teal-700 bg-teal-50/60' : 'text-coastal-700'
                                      }`}>
                                        {h.label}
                                      </th>
                                    ))}
                                    <th className="text-center py-3.5 px-4 font-semibold text-coastal-700">Risk</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {varKeys.map((varKey, idx) => {
                                    const v = variables[varKey]
                                    const meta = VARIABLE_META[varKey] || {}
                                    return (
                                      <tr key={varKey} className={`border-b border-coastal-100 ${idx % 2 === 0 ? '' : 'bg-coastal-50/30'}`}>
                                        <td className="py-3 px-4">
                                          <div className="flex items-center gap-2">
                                            {meta.icon && <meta.icon className="w-4 h-4" style={{ color: meta.color }} />}
                                            <span className="font-medium text-coastal-900">{meta.shortLabel || varKey}</span>
                                          </div>
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono">{v?.threshold?.toFixed(3)}</td>
                                        <td className="py-3 px-4 text-center font-mono text-coastal-500">{v?.historicalMean?.toFixed(3)}</td>
                                        {HORIZON_OPTIONS.map((h) => {
                                          const hd = v?.horizons?.[h.value]
                                          const exceeds = v?.threshold && hd?.avgForecast >= v.threshold
                                          return (
                                            <td key={h.value} className={`py-3 px-4 text-center ${
                                              h.value === selectedHorizon ? 'bg-teal-50/60' : ''
                                            }`}>
                                              <span className={`inline-flex px-2.5 py-1 rounded-lg font-mono text-sm font-medium ${
                                                exceeds ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                              }`}>
                                                {hd?.avgForecast?.toFixed(3)}
                                              </span>
                                              <div className="text-xs text-coastal-400 mt-0.5">
                                                {hd?.exceedancePct?.toFixed(0)}% exc.
                                              </div>
                                            </td>
                                          )
                                        })}
                                        <td className="py-3 px-4 text-center">
                                          <RiskBadge level={v?.riskLevel} />
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Exceedance bar chart */}
                          <div className="card p-5 mb-6">
                            <h3 className="font-display font-bold text-coastal-900 mb-2">
                              Threshold Exceedance by Variable ({selectedHorizon}-Month Horizon)
                            </h3>
                            <p className="text-sm text-coastal-500 mb-4">
                              Percentage of forecasted months where predicted value exceeds the erosion threshold.
                            </p>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={summaryCards.map(c => ({
                                    name: c.label,
                                    exceedance: c.exceedancePct || 0,
                                    color: VARIABLE_META[c.key]?.color || '#6b7280',
                                  }))}
                                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: 'Exceedance %', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                                  <Tooltip formatter={(val) => [`${val.toFixed(1)}%`, 'Exceedance']} />
                                  <Bar dataKey="exceedance" radius={[6, 6, 0, 0]}>
                                    {summaryCards.map((card, i) => (
                                      <Cell key={i} fill={VARIABLE_META[card.key]?.color || '#6b7280'} fillOpacity={0.8} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Model info cards */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {varKeys.map((varKey) => {
                              const v = variables[varKey]
                              const meta = VARIABLE_META[varKey] || {}
                              const model = v?.model
                              return (
                                <div key={varKey} className={`card p-4 ${meta.bg} ${meta.border}`}>
                                  <div className="flex items-center gap-2 mb-3">
                                    {meta.icon && <meta.icon className="w-4 h-4" style={{ color: meta.color }} />}
                                    <span className="font-semibold text-coastal-900">{meta.shortLabel || varKey}</span>
                                  </div>
                                  <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-coastal-600">SARIMA Order</span>
                                      <span className="font-mono font-medium">({model?.order?.join(',')})</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-coastal-600">Seasonal</span>
                                      <span className="font-mono font-medium">({model?.seasonalOrder?.join(',')})</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-coastal-600">AIC</span>
                                      <span className="font-mono">{model?.aic?.toFixed(1)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-coastal-600">MAE</span>
                                      <span className="font-mono">{model?.mae?.toFixed(4)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-coastal-600">RMSE</span>
                                      <span className="font-mono">{model?.rmse?.toFixed(4)}</span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}

                      {/* ===================== VALIDATION TAB ===================== */}
                      {activeTab === 'validation' && (
                        <motion.div
                          key="validation"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <div className="card p-5 mb-6">
                            <h3 className="font-display font-bold text-coastal-900 mb-2">
                              Hold-Out Validation Results
                            </h3>
                            <p className="text-sm text-coastal-500 mb-4">
                              Each SARIMA model was re-trained on all data except the last 24 months,
                              then forecasted those held-out months to measure real predictive accuracy.
                            </p>

                            <div className="overflow-x-auto rounded-xl ring-1 ring-coastal-200/60">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-coastal-50/80 border-b border-coastal-200">
                                    <th className="text-left py-3.5 px-4 font-semibold text-coastal-700">Variable</th>
                                    <th className="text-center py-3.5 px-4 font-semibold text-coastal-700">MAE</th>
                                    <th className="text-center py-3.5 px-4 font-semibold text-coastal-700">RMSE</th>
                                    <th className="text-center py-3.5 px-4 font-semibold text-coastal-700">MAPE</th>
                                    <th className="text-center py-3.5 px-4 font-semibold text-coastal-700">Correlation (r)</th>
                                    <th className="text-center py-3.5 px-4 font-semibold text-coastal-700">Hold-out</th>
                                    <th className="text-center py-3.5 px-4 font-semibold text-coastal-700">Grade</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {varKeys.map((varKey, idx) => {
                                    const v = variables[varKey]
                                    const meta = VARIABLE_META[varKey] || {}
                                    const val = v?.validation || {}
                                    const corr = val.correlation || 0
                                    const grade = corr >= 0.8 ? 'Excellent' : corr >= 0.6 ? 'Good' : corr >= 0.4 ? 'Fair' : 'Poor'
                                    const gradeColor = corr >= 0.8 ? 'bg-emerald-100 text-emerald-700' : corr >= 0.6 ? 'bg-blue-100 text-blue-700' : corr >= 0.4 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                    return (
                                      <tr key={varKey} className={`border-b border-coastal-100 ${idx % 2 === 0 ? '' : 'bg-coastal-50/30'}`}>
                                        <td className="py-3 px-4">
                                          <div className="flex items-center gap-2">
                                            {meta.icon && <meta.icon className="w-4 h-4" style={{ color: meta.color }} />}
                                            <span className="font-medium text-coastal-900">{meta.shortLabel || varKey}</span>
                                          </div>
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono">{val.mae?.toFixed(4) || '--'}</td>
                                        <td className="py-3 px-4 text-center font-mono">{val.rmse?.toFixed(4) || '--'}</td>
                                        <td className="py-3 px-4 text-center font-mono">{val.mape?.toFixed(1) || '--'}%</td>
                                        <td className="py-3 px-4 text-center">
                                          <span className="font-mono font-medium">{corr.toFixed(3)}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center text-coastal-500">{val.holdoutMonths || '--'} months</td>
                                        <td className="py-3 px-4 text-center">
                                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${gradeColor}`}>
                                            {grade}
                                          </span>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Validation methodology */}
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="card p-5 bg-gradient-to-br from-blue-50/80 to-cyan-50/80 border-blue-200/60">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <BarChart3 className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-blue-800 mb-1">Validation Methodology</h4>
                                  <p className="text-sm text-blue-700">
                                    <strong>Hold-out test:</strong> The last 24 months of data are withheld.
                                    Models are retrained on the remaining data using the same SARIMA orders,
                                    then forecast the held-out period. Metrics are computed on the held-out months.
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="card p-5 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border-emerald-200/60">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-emerald-800 mb-1">Metric Interpretation</h4>
                                  <p className="text-sm text-emerald-700">
                                    <strong>MAE / RMSE:</strong> Lower is better (same units as the variable).
                                    <strong> MAPE:</strong> Percentage error — below 20% is generally good for environmental data.
                                    <strong> Correlation:</strong> How well the forecast tracks the actual pattern (≥0.7 is strong).
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
