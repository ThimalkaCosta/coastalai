import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
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
  AreaChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell,
  ComposedChart, Scatter,
} from 'recharts'
import PageTransition from '../components/common/PageTransition'
import Tabs from '../components/common/Tabs'
import { useData } from '../context/DataContext'

// ── Variable display config (7 main erosion drivers) ──
const VARIABLE_META = {
  VHM0_max: {
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
    description: 'Maximum significant wave height (Hm0) – primary erosion driver',
  },
  VTPK_max: {
    label: 'Max Peak Wave Period',
    shortLabel: 'Wave Period',
    unit: 's',
    icon: Waves,
    color: '#6366f1',
    gradient: 'from-indigo-500 to-blue-500',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    badge: 'bg-indigo-100 text-indigo-700',
    description: 'Maximum peak wave period – long-period swells increase shore impact',
  },
  WindSpeed_max: {
    label: 'Max Wind Speed',
    shortLabel: 'Wind Speed',
    unit: 'm/s',
    icon: Wind,
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
    badge: 'bg-violet-100 text-violet-700',
    description: 'Maximum wind speed – wave generation and storm surge',
  },
  CurrentMag_max: {
    label: 'Max Current Speed',
    shortLabel: 'Current Speed',
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
  CumWaveEnergy: {
    label: 'Cumulative Wave Energy',
    shortLabel: 'Cum. Energy',
    unit: 'J/m',
    icon: Activity,
    color: '#14b8a6',
    gradient: 'from-teal-500 to-emerald-500',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-700',
    badge: 'bg-teal-100 text-teal-700',
    description: 'Cumulative wave energy flux – sustained shore energy input',
  },
  StormDays_wave: {
    label: 'Storm Wave Days',
    shortLabel: 'Storm Waves',
    unit: 'days',
    icon: Activity,
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    description: 'Days with storm-level wave conditions – prolonged high-energy exposure',
  },
  StormDays_wind: {
    label: 'Storm Wind Days',
    shortLabel: 'Storm Winds',
    unit: 'days',
    icon: Wind,
    color: '#ef4444',
    gradient: 'from-red-500 to-rose-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    description: 'Days with storm-level wind conditions – sustained wind-driven erosion',
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
function ForecastTooltip({ active, payload, label, unit, threshold, color }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const exceeds = threshold != null && d.predicted != null && d.predicted >= threshold
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-sm min-w-[200px]">
      <div className="font-bold text-gray-900 mb-2 pb-2 border-b border-gray-100 text-base">{label}</div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color || '#3b82f6' }} />
            <span className="text-gray-600">Predicted:</span>
          </div>
          <span className={`font-mono font-bold text-base ${exceeds ? 'text-red-600' : 'text-gray-900'}`}>
            {d.predicted?.toFixed(3)} {unit}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm opacity-40" style={{ backgroundColor: color || '#3b82f6' }} />
            <span className="text-gray-600">95% CI:</span>
          </div>
          <span className="font-mono text-gray-700">{d.ci_lower?.toFixed(3)} – {d.ci_upper?.toFixed(3)}</span>
        </div>
        {threshold != null && (
          <div className="flex items-center justify-between gap-4 pt-2 mt-1 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-red-500" />
              <span className="text-gray-600">Threshold:</span>
            </div>
            <span className="font-mono font-semibold text-red-600">{threshold.toFixed(3)} {unit}</span>
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

  // Five-class forecasts
  const fiveClassForecasts = data?.fiveClassForecasts || null

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
    ...(fiveClassForecasts ? [{ id: 'trajectories', label: 'Threshold Trajectories' }] : []),
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
                SARIMA-based forecasting of 7 key erosion drivers using {metadata.totalMonths || '~300'} months
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
                <TrendingUp className="w-9 h-9 text-coastal-300 mx-auto mb-3" />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {summaryCards.map((card, idx) => {
                    const Icon = card.icon
                    const exceeds = card.threshold && card.avgForecast >= card.threshold
                    return (
                      <motion.div
                        key={card.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + idx * 0.05 }}
                        className={`card p-3 border-l-[3px] ${exceeds ? 'border-l-red-400' : 'border-l-emerald-400'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5" style={{ color: card.color }} />
                            <span className="text-xs font-semibold text-coastal-700">{card.label}</span>
                          </div>
                          <RiskBadge level={card.riskLevel} />
                        </div>
                        <div className="text-xl font-bold text-coastal-900 mb-0.5">
                          {card.avgForecast?.toFixed(2)} <span className="text-xs font-normal text-coastal-500">{card.unit}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-coastal-500">
                            Threshold: {card.threshold?.toFixed(2)} {card.unit}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <TrendIcon value={card.trendPct} />
                            <span className={card.trendPct > 0 ? 'text-red-600' : 'text-emerald-600'}>
                              {card.trendPct > 0 ? '+' : ''}{card.trendPct?.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="mt-1.5 h-1 bg-coastal-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${exceeds ? 'bg-red-400' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.min(card.exceedancePct || 0, 100)}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-coastal-500 mt-0.5">
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
                                <div key={varKey} className="card overflow-hidden">
                                  {/* Card header with gradient */}
                                  <div className={`bg-gradient-to-r ${meta.gradient || 'from-gray-500 to-gray-600'} px-5 py-3`}>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2.5">
                                        {meta.icon && <meta.icon className="w-5 h-5 text-white/90" />}
                                        <div>
                                          <h4 className="font-bold text-white text-base">{meta.label || varKey}</h4>
                                          <p className="text-white/70 text-xs">{meta.description}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <RiskBadge level={v?.riskLevel} />
                                        <div className="text-right bg-white/15 rounded-lg px-3 py-1.5">
                                          <div className="text-white/70 text-[10px] font-medium uppercase tracking-wider">Exceedance</div>
                                          <div className="text-white text-xl font-bold">
                                            {horizonData?.exceedancePct?.toFixed(0)}%
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Chart area */}
                                  <div className="px-4 pt-4 pb-2">
                                    {/* Custom legend */}
                                    <div className="flex flex-wrap items-center gap-5 mb-3 text-xs">
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-4 h-[3px] rounded-full" style={{ backgroundColor: meta.color || '#3b82f6' }} />
                                        <span className="text-gray-600 font-medium">Predicted</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-4 h-3 rounded-sm opacity-25" style={{ backgroundColor: meta.color || '#3b82f6' }} />
                                        <span className="text-gray-600 font-medium">95% Confidence Interval</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-4 h-0 border-t-2 border-dashed border-red-500" />
                                        <span className="text-gray-600 font-medium">Erosion Threshold</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-4 h-0 border-t border-dashed border-gray-400" />
                                        <span className="text-gray-600 font-medium">Historical Mean</span>
                                      </div>
                                    </div>

                                    <div className="h-72">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={monthly} margin={{ top: 15, right: 25, left: 15, bottom: 5 }}>
                                          <defs>
                                            <linearGradient id={`ciGrad-${varKey}`} x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="0%" stopColor={meta.color || '#3b82f6'} stopOpacity={0.25} />
                                              <stop offset="100%" stopColor={meta.color || '#3b82f6'} stopOpacity={0.05} />
                                            </linearGradient>
                                          </defs>
                                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.7} />
                                          <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 11, fill: '#6b7280' }}
                                            axisLine={{ stroke: '#d1d5db' }}
                                            tickLine={{ stroke: '#d1d5db' }}
                                          />
                                          <YAxis
                                            tick={{ fontSize: 11, fill: '#6b7280' }}
                                            axisLine={{ stroke: '#d1d5db' }}
                                            tickLine={{ stroke: '#d1d5db' }}
                                            label={{
                                              value: meta.unit ? `Value (${meta.unit})` : 'Value',
                                              angle: -90,
                                              position: 'insideLeft',
                                              offset: -5,
                                              style: { fontSize: 11, fill: '#9ca3af', fontWeight: 500 },
                                            }}
                                          />
                                          <Tooltip
                                            content={<ForecastTooltip unit={meta.unit} threshold={v?.threshold} color={meta.color} />}
                                            cursor={{ stroke: '#d1d5db', strokeWidth: 1, strokeDasharray: '4 4' }}
                                          />
                                          {/* Threshold reference line */}
                                          {v?.threshold && (
                                            <ReferenceLine
                                              y={v.threshold}
                                              stroke="#ef4444"
                                              strokeDasharray="8 5"
                                              strokeWidth={2}
                                              label={{
                                                value: `Threshold: ${v.threshold.toFixed(2)} ${meta.unit}`,
                                                position: 'insideTopRight',
                                                fontSize: 11,
                                                fontWeight: 600,
                                                fill: '#ef4444',
                                                offset: 8,
                                              }}
                                            />
                                          )}
                                          {/* Historical mean reference line */}
                                          <ReferenceLine
                                            y={v?.historicalMean}
                                            stroke="#9ca3af"
                                            strokeDasharray="5 5"
                                            strokeWidth={1.5}
                                            label={{
                                              value: `Hist. Mean: ${v?.historicalMean?.toFixed(2) || '--'}`,
                                              position: 'insideBottomLeft',
                                              fontSize: 10,
                                              fill: '#9ca3af',
                                              offset: 8,
                                            }}
                                          />
                                          {/* CI band — upper boundary (fills down to ci_lower) */}
                                          <Area
                                            type="monotone"
                                            dataKey="ci_upper"
                                            stroke="none"
                                            fill={`url(#ciGrad-${varKey})`}
                                            fillOpacity={1}
                                            isAnimationActive={false}
                                          />
                                          {/* CI band — lower boundary (erases below) */}
                                          <Area
                                            type="monotone"
                                            dataKey="ci_lower"
                                            stroke="none"
                                            fill="#ffffff"
                                            fillOpacity={1}
                                            isAnimationActive={false}
                                          />
                                          {/* CI upper boundary line */}
                                          <Line
                                            type="monotone"
                                            dataKey="ci_upper"
                                            stroke={meta.color || '#3b82f6'}
                                            strokeWidth={1}
                                            strokeOpacity={0.3}
                                            strokeDasharray="3 3"
                                            dot={false}
                                            isAnimationActive={false}
                                          />
                                          {/* CI lower boundary line */}
                                          <Line
                                            type="monotone"
                                            dataKey="ci_lower"
                                            stroke={meta.color || '#3b82f6'}
                                            strokeWidth={1}
                                            strokeOpacity={0.3}
                                            strokeDasharray="3 3"
                                            dot={false}
                                            isAnimationActive={false}
                                          />
                                          {/* Predicted line */}
                                          <Line
                                            type="monotone"
                                            dataKey="predicted"
                                            stroke={meta.color || '#3b82f6'}
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: meta.color || '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 6, fill: meta.color || '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                          />
                                        </AreaChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>

                                  {/* Quick stats row */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100">
                                    <div className="bg-white px-4 py-3">
                                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Avg Forecast</div>
                                      <div className="font-bold text-gray-900 text-lg mt-0.5">
                                        {horizonData?.avgForecast?.toFixed(3)} <span className="text-xs font-normal text-gray-400">{meta.unit}</span>
                                      </div>
                                    </div>
                                    <div className="bg-white px-4 py-3">
                                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Peak Forecast</div>
                                      <div className="font-bold text-gray-900 text-lg mt-0.5">
                                        {horizonData?.peakForecast?.toFixed(3)} <span className="text-xs font-normal text-gray-400">{meta.unit}</span>
                                      </div>
                                    </div>
                                    <div className="bg-white px-4 py-3">
                                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Historical Mean</div>
                                      <div className="font-bold text-gray-500 text-lg mt-0.5">
                                        {v?.historicalMean?.toFixed(3)} <span className="text-xs font-normal text-gray-400">{meta.unit}</span>
                                      </div>
                                    </div>
                                    <div className="bg-white px-4 py-3">
                                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Trend vs History</div>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <TrendIcon value={horizonData?.trendPct} />
                                        <span className={`font-bold text-lg ${horizonData?.trendPct > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
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
                          <div className="mt-4 card p-4 bg-gradient-to-br from-teal-50/80 to-emerald-50/80 border-teal-200/60">
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
                          <div className="card p-4 mb-5">
                            <h3 className="font-display font-bold text-coastal-900 text-sm mb-3">
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
                          <div className="card overflow-hidden mb-5">
                            <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-5 py-3">
                              <h3 className="font-bold text-white text-sm">
                                Threshold Exceedance by Variable ({selectedHorizon}-Month Horizon)
                              </h3>
                              <p className="text-gray-300 text-xs mt-0.5">
                                Percentage of forecasted months where predicted value exceeds the erosion threshold
                              </p>
                            </div>
                            <div className="p-4">
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={summaryCards.map(c => ({
                                      name: c.label,
                                      exceedance: c.exceedancePct || 0,
                                      color: VARIABLE_META[c.key]?.color || '#6b7280',
                                    }))}
                                    margin={{ top: 10, right: 30, left: 15, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.7} />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4b5563', fontWeight: 500 }} axisLine={{ stroke: '#d1d5db' }} />
                                    <YAxis
                                      domain={[0, 100]}
                                      tick={{ fontSize: 11, fill: '#6b7280' }}
                                      axisLine={{ stroke: '#d1d5db' }}
                                      label={{ value: 'Exceedance %', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#9ca3af', fontWeight: 500, offset: -5 }}
                                    />
                                    <Tooltip
                                      cursor={{ fill: '#f3f4f6' }}
                                      formatter={(val) => [`${val.toFixed(1)}%`, 'Exceedance']}
                                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: '50% threshold', position: 'insideTopRight', fontSize: 10, fill: '#ef4444' }} />
                                    <Bar dataKey="exceedance" radius={[8, 8, 0, 0]} barSize={50}>
                                      {summaryCards.map((card, i) => (
                                        <Cell key={i} fill={VARIABLE_META[card.key]?.color || '#6b7280'} fillOpacity={0.85} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
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
                          <div className="card p-4 mb-5">
                            <h3 className="font-display font-bold text-coastal-900 text-sm mb-1.5">
                              Hold-Out Validation Results
                            </h3>
                            <p className="text-xs text-coastal-500 mb-3">
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
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="card p-4 bg-gradient-to-br from-blue-50/80 to-cyan-50/80 border-blue-200/60">
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
                            <div className="card p-4 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border-emerald-200/60">
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

                    {/* ===================== TRAJECTORIES TAB ===================== */}
                    <AnimatePresence mode="wait">
                      {activeTab === 'trajectories' && fiveClassForecasts && (
                        <motion.div key="trajectories" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                          <ThresholdTrajectoryPanel fiveClassForecasts={fiveClassForecasts} />
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

// ═══════════════════════════════════════════════════════════════════════════
// THRESHOLD TRAJECTORY PANEL
// ═══════════════════════════════════════════════════════════════════════════

const BOUNDARY_COLORS = {
  severe_erosion:   '#dc2626',
  erosion_onset:    '#f97316',
  accretion_onset:  '#22c55e',
  strong_accretion: '#0ea5e9',
}
const BOUNDARY_LABELS = {
  severe_erosion:   'Severe Erosion',
  erosion_onset:    'Erosion Onset',
  accretion_onset:  'Accretion Onset',
  strong_accretion: 'Strong Accretion',
}
const HORIZON_COLORS = { H6: '#7c3aed', H12: '#0284c7', H18: '#0891b2', H24: '#059669' }

function TrendBadge({ trend, mkTau, mkP }) {
  if (!trend) return null
  const cfg = trend === 'increasing'
    ? { icon: ArrowUpRight, cls: 'bg-red-100 text-red-700', label: 'Rising' }
    : trend === 'decreasing'
    ? { icon: ArrowDownRight, cls: 'bg-green-100 text-green-700', label: 'Falling' }
    : { icon: Minus, cls: 'bg-gray-100 text-gray-600', label: 'Stable' }
  const Icon = cfg.icon
  const sig = mkP != null && mkP < 0.05
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.cls}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
      {mkP != null && <span className="opacity-70">p={Number(mkP).toFixed(2)}{sig ? '*' : ''}</span>}
    </span>
  )
}

function BoundaryTrajectoryCard({ featureKey, boundaryKey, boundaryData, forecastAnchor }) {
  const history = (boundaryData.history || []).map(h => ({
    year: h.year, threshold: h.threshold, type: 'history',
  }))
  const anchorYear = forecastAnchor ? parseInt(forecastAnchor.split('-')[0]) + (parseInt(forecastAnchor.split('-')[1]) - 1) / 12 : null
  const horizonPoints = Object.entries(boundaryData.horizons || {}).map(([h, v]) => ({
    label: h,
    estimate: v.estimate,
    low95: v.low95,
    high95: v.high95,
    targetDate: v.targetDate,
    year: v.targetDate ? parseInt(v.targetDate.split('-')[0]) + (parseInt(v.targetDate.split('-')[1]) - 1) / 12 : null,
  }))

  const allVals = [...history.map(h => h.threshold), ...horizonPoints.map(p => p.estimate)].filter(v => v != null && isFinite(v))
  const minY = allVals.length ? Math.min(...allVals) * 0.92 : 0
  const maxY = allVals.length ? Math.max(...allVals) * 1.08 : 1

  const color = BOUNDARY_COLORS[boundaryKey] || '#6b7280'

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-xs font-semibold text-gray-700">{BOUNDARY_LABELS[boundaryKey] || boundaryKey}</p>
          <p className="text-[10px] text-gray-400 font-mono">{featureKey}</p>
        </div>
        <TrendBadge trend={boundaryData.trend} mkTau={boundaryData.mkTau} mkP={boundaryData.mkPValue} />
      </div>

      {/* Chart */}
      <div className="h-36 px-2 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={history} margin={{ top: 4, right: 6, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" tickFormatter={v => Math.floor(v)} tick={{ fontSize: 9 }} />
            <YAxis domain={[minY, maxY]} tick={{ fontSize: 9 }} tickFormatter={v => v.toFixed(2)} width={42} />
            <Tooltip
              formatter={(v, name) => [v != null ? Number(v).toFixed(3) : '--', name]}
              contentStyle={{ fontSize: 10, padding: '4px 8px' }}
            />
            {anchorYear && (
              <ReferenceLine x={anchorYear} stroke="#6b7280" strokeDasharray="4 4" label={{ value: 'Now', fontSize: 8, fill: '#6b7280' }} />
            )}
            <Line type="monotone" dataKey="threshold" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} name="Historical" connectNulls />
            {/* Horizon forecast points */}
            {horizonPoints.map(hp => (
              hp.year != null && hp.estimate != null ? (
                <ReferenceLine key={hp.label} x={hp.year} stroke={HORIZON_COLORS[hp.label] || '#888'}
                  strokeDasharray="2 3" strokeWidth={1.5}
                  label={{ value: `${hp.label}:${Number(hp.estimate).toFixed(2)}`, fontSize: 8, fill: HORIZON_COLORS[hp.label] || '#888', position: 'top' }} />
              ) : null
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Horizon cards */}
      <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
        {['H6', 'H12', 'H18', 'H24'].map(h => {
          const hp = horizonPoints.find(p => p.label === h)
          return (
            <div key={h} className="px-2 py-2 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: HORIZON_COLORS[h] }}>{h}</p>
              <p className="text-xs font-semibold font-mono text-gray-800 mt-0.5">
                {hp?.estimate != null ? Number(hp.estimate).toFixed(3) : '--'}
              </p>
              {hp?.low95 != null && hp?.high95 != null && (
                <p className="text-[9px] text-gray-400 font-mono leading-tight">
                  [{Number(hp.low95).toFixed(2)}–{Number(hp.high95).toFixed(2)}]
                </p>
              )}
              <p className="text-[9px] text-gray-400">{hp?.targetDate || ''}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ThresholdTrajectoryPanel({ fiveClassForecasts }) {
  const features = fiveClassForecasts?.features || {}
  const featureKeys = Object.keys(features).slice(0, 5)   // show top 5 drivers
  const forecastAnchor = fiveClassForecasts?.forecastAnchor

  if (!featureKeys.length) {
    return (
      <div className="card p-8 text-center text-gray-500">
        <TrendingUp className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No threshold trajectory data available yet.</p>
        <p className="text-xs mt-1">Run the analysis notebook to generate threshold forecasts.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 py-2">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-sm flex-shrink-0">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-display font-bold text-gray-900 text-base">Threshold Trajectory Forecasts</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Ensemble of TheilSen + Gaussian Process (Matérn) + HuberRegressor.
            Mann-Kendall trend significance shown on each panel.
            Anchor: {forecastAnchor || '—'}
          </p>
        </div>
      </div>

      {/* Method info pills */}
      <div className="flex flex-wrap gap-2 text-[10px]">
        {[
          { label: 'TheilSen', desc: 'Median pairwise slopes — robust to outliers', color: 'bg-violet-100 text-violet-700' },
          { label: 'GP Matérn', desc: 'Bayesian non-parametric — native CI', color: 'bg-blue-100 text-blue-700' },
          { label: 'HuberRegressor', desc: 'Huber loss — downweights outlier years', color: 'bg-teal-100 text-teal-700' },
          { label: 'Mann-Kendall', desc: 'Monotone trend significance test', color: 'bg-amber-100 text-amber-700' },
        ].map(m => (
          <span key={m.label} className={`px-2 py-1 rounded-full font-semibold ${m.color}`} title={m.desc}>{m.label}</span>
        ))}
        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">
          * = p &lt; 0.05 significant trend
        </span>
      </div>

      {/* Feature panels */}
      {featureKeys.map(fk => {
        const fd = features[fk]
        const boundaries = fd?.boundaries || {}
        const bKeys = Object.keys(boundaries).filter(b => Object.keys(boundaries[b]?.horizons || {}).length > 0)
        if (!bKeys.length) return null
        return (
          <div key={fk}>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-coastal-500" />
              <h4 className="font-semibold text-sm text-gray-800">{fk}</h4>
              <span className="text-xs text-gray-400">{fd.driver}</span>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-2 gap-4">
              {bKeys.map(bk => (
                <BoundaryTrajectoryCard
                  key={bk}
                  featureKey={fk}
                  boundaryKey={bk}
                  boundaryData={boundaries[bk]}
                  forecastAnchor={forecastAnchor}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
