import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Waves,
  Wind,
  Droplets,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Target,
  Brain,
  Calendar,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'
import PageTransition from '../components/common/PageTransition'
import StatCard from '../components/common/StatCard'
import { useData } from '../context/DataContext'

// 7 main meteorological variables with display config (fallback for known column names)
const KNOWN_VAR_META = {
  VHM0_max:          { label: 'Max Wave Height',     unit: 'm',    color: '#3b82f6', icon: Waves },
  VHM0_max_annual:   { label: 'Max Wave Height',     unit: 'm',    color: '#3b82f6', icon: Waves },
  VHM0_mean:         { label: 'Mean Wave Height',    unit: 'm',    color: '#60a5fa', icon: Waves },
  VHM0_mean_annual:  { label: 'Mean Wave Height',    unit: 'm',    color: '#60a5fa', icon: Waves },
  VTPK_max:          { label: 'Max Wave Period',     unit: 's',    color: '#6366f1', icon: Waves },
  VTPK_max_annual:   { label: 'Max Wave Period',     unit: 's',    color: '#6366f1', icon: Waves },
  VTPK_mean:         { label: 'Mean Wave Period',    unit: 's',    color: '#818cf8', icon: Waves },
  VTPK_mean_annual:  { label: 'Mean Wave Period',    unit: 's',    color: '#818cf8', icon: Waves },
  VMDR_mean_annual:  { label: 'Mean Wave Direction', unit: '°',    color: '#a78bfa', icon: Waves },
  VSDX_max_annual:   { label: 'Max Stokes Drift X',  unit: 'm/s',  color: '#c084fc', icon: Waves },
  VSDX_mean_annual:  { label: 'Mean Stokes Drift X', unit: 'm/s',  color: '#d8b4fe', icon: Waves },
  VSDY_max_annual:   { label: 'Max Stokes Drift Y',  unit: 'm/s',  color: '#e879f9', icon: Waves },
  VSDY_mean_annual:  { label: 'Mean Stokes Drift Y', unit: 'm/s',  color: '#f0abfc', icon: Waves },
  WindSpeed_max:     { label: 'Max Wind Speed',      unit: 'm/s',  color: '#8b5cf6', icon: Wind },
  wind_speed_max_annual: { label: 'Max Wind Speed',  unit: 'm/s',  color: '#8b5cf6', icon: Wind },
  wind_speed_mean_annual:{ label: 'Mean Wind Speed', unit: 'm/s',  color: '#a78bfa', icon: Wind },
  eastward_wind_max_annual:  { label: 'Max E-Wind',  unit: 'm/s',  color: '#7c3aed', icon: Wind },
  eastward_wind_mean_annual: { label: 'Mean E-Wind', unit: 'm/s',  color: '#8b5cf6', icon: Wind },
  northward_wind_max_annual: { label: 'Max N-Wind',  unit: 'm/s',  color: '#6d28d9', icon: Wind },
  northward_wind_mean_annual:{ label: 'Mean N-Wind', unit: 'm/s',  color: '#7c3aed', icon: Wind },
  CurrentMag_max:    { label: 'Max Current Speed',   unit: 'm/s',  color: '#06b6d4', icon: Droplets },
  uo_max_annual:     { label: 'Max Current U',       unit: 'm/s',  color: '#06b6d4', icon: Droplets },
  uo_mean_annual:    { label: 'Mean Current U',      unit: 'm/s',  color: '#22d3ee', icon: Droplets },
  vo_max_annual:     { label: 'Max Current V',       unit: 'm/s',  color: '#0891b2', icon: Droplets },
  vo_mean_annual:    { label: 'Mean Current V',      unit: 'm/s',  color: '#67e8f9', icon: Droplets },
  zos_max_annual:    { label: 'Max Sea Level',       unit: 'm',    color: '#0e7490', icon: Droplets },
  zos_mean_annual:   { label: 'Mean Sea Level',      unit: 'm',    color: '#155e75', icon: Droplets },
  CumWaveEnergy:     { label: 'Cum. Wave Energy',    unit: 'J/m',  color: '#14b8a6', icon: Activity },
  StormDays_wave:    { label: 'Storm Wave Days',     unit: 'days', color: '#f59e0b', icon: Activity },
  StormDays_wind:    { label: 'Storm Wind Days',     unit: 'days', color: '#ef4444', icon: Wind },
}

// Columns to exclude from the meteorological variable list
const EXCLUDE_COLS = new Set([
  'monsoon_year', 'annual_NSM', 'erosion_label', 'Erosion_Label',
  'Change_Class', 'NSM_count', 'severity', 'geometry',
])

/** Build a display-ready variable descriptor from a column name */
function varMeta(key) {
  if (KNOWN_VAR_META[key]) return { key, ...KNOWN_VAR_META[key] }
  // Auto-generate label from column name
  const label = key.replace(/_annual$/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return { key, label, unit: '', color: '#94a3b8', icon: Activity }
}

export default function AnalysisPage() {
  const { data, loading, dataLoaded } = useData()

  // Dynamically detect meteorological variables from timeSeries column names
  const METEO_VARS = useMemo(() => {
    if (!data.timeSeries?.length) return []
    const cols = Object.keys(data.timeSeries[0] || {}).filter(c => !EXCLUDE_COLS.has(c))
    return cols.map(c => varMeta(c))
  }, [data])

  // Default selection: pick the first 3 available variables (or significant features)
  const defaultSelected = useMemo(() => {
    const significant = (data.thresholds || []).map(t => t.feature).filter(Boolean)
    if (significant.length > 0) return significant.slice(0, 3)
    return METEO_VARS.slice(0, 3).map(v => v.key)
  }, [METEO_VARS, data])

  const [selectedVars, setSelectedVars] = useState([])

  // Sync default selection once data loads
  useMemo(() => {
    if (selectedVars.length === 0 && defaultSelected.length > 0) {
      setSelectedVars(defaultSelected)
    }
  }, [defaultSelected])

  const stats = useMemo(() => {
    if (data.summary) {
      return {
        totalTransects: data.summary.totalTransects,
        erodingTransects: data.summary.erodingTransects,
        erosionRate: data.summary.erosionRate,
        meanNSM: data.summary.meanNSM,
        totalYears: data.summary.totalYears,
        yearRange: data.summary.analysisYearRange,
        erosionYears: data.summary.erosionYears,
        erosionYearsList: data.summary.erosionYearsList || [],
      }
    }
    return { totalTransects: 0, erodingTransects: 0, meanNSM: 0, erosionRate: 0 }
  }, [data])

  // Build time series from analysis_df rows
  const timeSeriesData = useMemo(() => {
    if (!data.timeSeries?.length) return []
    return data.timeSeries.map(row => {
      const out = { year: row.monsoon_year }
      METEO_VARS.forEach(v => { out[v.key] = row[v.key] ?? null })
      out.erosion_label = row.erosion_label ?? row.Erosion_Label ?? 0
      return out
    })
  }, [data, METEO_VARS])

  // Threshold values from ensemble thresholds (all 7)
  const thresholdMap = useMemo(() => {
    const map = {}
    if (data.thresholds?.length) {
      data.thresholds.forEach(t => {
        const feat = t.feature || ''
        map[feat] = t.consensusThreshold ?? t.thresholdAll ?? t.thresholdHigh ?? null
      })
    }
    return map
  }, [data])

  // Available vars in the data (all METEO_VARS that have at least one non-null value)
  const availableVars = useMemo(() => {
    if (!timeSeriesData.length) return METEO_VARS
    return METEO_VARS.filter(v => timeSeriesData.some(r => r[v.key] != null))
  }, [timeSeriesData, METEO_VARS])

  const toggleVar = (key) => {
    setSelectedVars(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const modelCards = [
    {
      id: 'rf',
      title: 'Random Forest',
      description: 'Feature importance and ensemble learning',
      icon: Brain,
      accuracy: data.rfModel?.oobScore ? `${(data.rfModel.oobScore * 100).toFixed(1)}%` : '--',
      link: '/models/random-forest',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      id: 'forecast',
      title: 'SARIMA Forecasting',
      description: 'Threshold forecasting for 7 meteorological variables',
      icon: Target,
      accuracy: data.forecasts?.metadata?.nVariables ? `${data.forecasts.metadata.nVariables} vars` : '--',
      link: '/forecast/thresholds',
      color: 'from-violet-500 to-purple-500',
    },
    {
      id: 'hindcast',
      title: 'Hindcast Validation',
      description: 'Historical prediction accuracy assessment',
      icon: BarChart3,
      accuracy: data.hindcast?.metrics?.accuracy ? `${(data.hindcast.metrics.accuracy * 100).toFixed(1)}%` : '--',
      link: '/forecast/hindcast',
      color: 'from-orange-500 to-amber-500',
    },
  ]

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-ocean-200 border-t-ocean-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-coastal-600">Loading analysis data...</p>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (!dataLoaded && !data.timeSeries?.length) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-display font-semibold text-coastal-900 mb-2">
              No Analysis Data Available
            </h2>
            <p className="text-coastal-600 mb-6">
              Please run the Jupyter notebook first to generate analysis results, 
              then refresh this page.
            </p>
            <Link to="/upload" className="btn-primary">
              Go to Upload Page
            </Link>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-coastal-50 to-white bg-mesh-1">
        {/* Header */}
        <section className="pt-8 sm:pt-10 pb-6">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <div className="page-badge bg-primary-50 text-primary-600 border-primary-100 mb-4">
                <Activity className="w-3.5 h-3.5" />
                Analysis Overview
              </div>
              <h1 className="section-title mb-3">
                Coastal Erosion Analysis
              </h1>
              <p className="section-subtitle">
                Comprehensive analysis of shoreline changes, environmental drivers, and
                AI-detected erosion thresholds from your research data.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="pb-6 sm:pb-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <StatCard
                title="Total Transects"
                value={stats.totalTransects || 82}
                icon={Activity}
                delay={0.1}
              />
              <StatCard
                title="Erosion Rate"
                value={`${stats.erosionRate || '--'}%`}
                subtitle="transects eroding"
                icon={TrendingDown}
                trend={{ value: stats.erosionRate || 0, isPositive: false }}
                delay={0.15}
              />
              <StatCard
                title="Mean NSM"
                value={`${stats.meanNSM || '--'}m`}
                subtitle="average change"
                icon={TrendingUp}
                delay={0.2}
              />
              <StatCard
                title="Analysis Years"
                value={stats.totalYears || '--'}
                subtitle={stats.yearRange || ''}
                icon={Waves}
                delay={0.25}
              />
            </div>
          </div>
        </section>

        {/* Model Cards */}
        <section className="pb-6 sm:pb-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-display font-bold text-coastal-900 mb-6"
            >
              Model Results
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-4">
              {modelCards.map((model, index) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                >
                  <Link to={model.link}>
                    <div className="card p-4 group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${model.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                          <model.icon className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-100">
                          <CheckCircle className="w-3 h-3" />
                          <span className="font-semibold text-xs">{model.accuracy}</span>
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-coastal-900 text-sm mb-0.5 group-hover:text-ocean-600 transition-colors">
                        {model.title}
                      </h3>
                      <p className="text-xs text-coastal-500 mb-3 leading-relaxed">
                        {model.description}
                      </p>
                      <div className="flex items-center text-xs text-ocean-600 font-semibold pt-2.5 border-t border-coastal-100">
                        View Results
                        <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Overview & Key Findings */}
        <section className="pb-8" id="overview">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-7 rounded-full bg-gradient-to-b from-ocean-500 to-ocean-300" />
                <h2 className="text-lg font-display font-bold text-coastal-900">Overview</h2>
              </div>
              <div className="space-y-4">
                {/* Key Findings */}
                <div className="card p-5">
                  <h3 className="font-display font-bold text-coastal-900 mb-4 text-sm">Key Findings</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-amber-50/80 rounded-lg border border-amber-200/60 ring-1 ring-amber-100/50">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-amber-800 text-sm mb-0.5">High Erosion Alert</h4>
                          <p className="text-xs text-amber-700 leading-relaxed">
                            {stats.erosionRate || '--'}% of transects show erosion with mean NSM of {stats.meanNSM || '--'}m,
                            indicating significant coastal retreat.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3.5 bg-ocean-50/80 rounded-lg border border-ocean-200/60 ring-1 ring-ocean-100/50">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-ocean-100 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-ocean-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-ocean-800 text-sm mb-0.5">Erosion Years</h4>
                          <p className="text-xs text-ocean-700 leading-relaxed">
                            {stats.erosionYears ?? '--'} erosion years detected
                            {stats.erosionYearsList?.length > 0 && (
                              <span className="block mt-1 font-mono">{stats.erosionYearsList.join(', ')}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* All 7 Detected Thresholds */}
                <div className="card p-5">
                  <h3 className="font-display font-bold text-coastal-900 mb-4 text-sm">
                    Detected Erosion Thresholds ({data.thresholds?.length || 0} Meteorological Variables)
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(data.thresholds || []).map(t => {
                      const key = t.feature || ''
                      const thVal = t.consensusThreshold ?? t.thresholdAll ?? t.thresholdHigh ?? null
                      const meta = varMeta(key)
                      const Icon = meta.icon
                      return (
                        <div key={key} className="p-3.5 bg-gradient-to-br from-white to-coastal-50 rounded-lg ring-1 ring-coastal-200/60">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: meta.color + '20' }}>
                              <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                            </div>
                            <span className="text-xs font-semibold text-coastal-700">{meta.label}</span>
                          </div>
                          <p className="text-xl font-display font-bold text-coastal-900">
                            {thVal != null ? `≥ ${typeof thVal === 'number' ? thVal.toFixed(2) : thVal}` : '--'}
                            <span className="text-sm font-normal text-coastal-500 ml-1">{meta.unit}</span>
                          </p>
                          <p className="text-[11px] text-coastal-500 mt-1 font-medium font-mono">{key}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pb-6">
          <div className="border-t border-coastal-200/60" />
        </div>

        {/* Meteorological Time Series */}
        <section className="pb-8" id="timeseries">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-7 rounded-full bg-gradient-to-b from-blue-500 to-blue-300" />
                <h2 className="text-lg font-display font-bold text-coastal-900">
                  Meteorological Time Series
                </h2>
              </div>

              {/* Variable Toggle */}
              <div className="card p-4 mb-4">
                <p className="text-xs text-coastal-500 mb-2 font-medium">Select variables to display:</p>
                <div className="flex flex-wrap gap-2">
                  {availableVars.map(v => (
                    <button
                      key={v.key}
                      onClick={() => toggleVar(v.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        selectedVars.includes(v.key)
                          ? 'text-white shadow-sm'
                          : 'bg-white text-coastal-600 border-coastal-200 hover:border-coastal-300'
                      }`}
                      style={selectedVars.includes(v.key) ? { backgroundColor: v.color, borderColor: v.color } : {}}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart */}
              {timeSeriesData.length > 0 ? (
                <div className="card p-5">
                  <h3 className="font-display font-bold text-coastal-900 mb-1 text-sm">
                    Environmental Variables Over Time ({stats.yearRange || ''})
                  </h3>
                  <p className="text-xs text-coastal-500 mb-4">
                    Shaded years indicate detected erosion events. Dashed lines show ensemble thresholds.
                  </p>
                  <ResponsiveContainer width="100%" height={380}>
                    <LineChart data={timeSeriesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                        labelFormatter={v => `Year ${v}`}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {selectedVars.map(key => {
                        const v = availableVars.find(m => m.key === key) || varMeta(key)
                        return (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            name={`${v.label} (${v.unit})`}
                            stroke={v.color}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                            connectNulls
                          />
                        )
                      })}
                      {/* Threshold reference lines for selected vars */}
                      {selectedVars.map(key => {
                        const thVal = thresholdMap[key]
                        const v = availableVars.find(m => m.key === key) || varMeta(key)
                        if (thVal == null) return null
                        return (
                          <ReferenceLine
                            key={`th-${key}`}
                            y={thVal}
                            stroke={v.color}
                            strokeDasharray="6 4"
                            strokeWidth={1.5}
                            label={{ value: `${v.label} threshold`, fontSize: 10, fill: v.color }}
                          />
                        )
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="card p-8 text-center text-coastal-500 text-sm">
                  No time series data available. Run the analysis first.
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pb-6">
          <div className="border-t border-coastal-200/60" />
        </div>

        {/* Statistical Tests */}
        <section className="pb-8" id="statistical-tests">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-7 rounded-full bg-gradient-to-b from-violet-500 to-violet-300" />
                <h2 className="text-lg font-display font-bold text-coastal-900">Statistical Tests</h2>
              </div>
              {data.statisticalTests?.length > 0 ? (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-coastal-50/80 border-b-2 border-coastal-200">
                          {Object.keys(data.statisticalTests[0] || {}).map(col => (
                            <th key={col} className="py-3 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">{col.replace(/_/g, ' ')}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.statisticalTests.map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="py-2.5 px-3 text-center text-xs font-mono">
                                {typeof val === 'number' ? val.toFixed(4) : String(val ?? '--')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card p-8 text-center text-coastal-500 text-sm">
                  No statistical test results available. Run the analysis first.
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pb-6">
          <div className="border-t border-coastal-200/60" />
        </div>

        {/* Annual Data Table */}
        <section className="pb-20" id="annual-data">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-7 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-300" />
                <h2 className="text-lg font-display font-bold text-coastal-900">Annual Data</h2>
              </div>
              <div className="card p-5">
                <h3 className="font-display font-bold text-coastal-900 mb-2 text-sm">
                  Processed Annual Features ({timeSeriesData.length} years)
                </h3>
                <p className="text-xs text-coastal-500 mb-5 leading-relaxed">
                  Annual meteorological features and erosion labels used in the analysis pipeline.
                </p>
                {timeSeriesData.length > 0 ? (
                  <div className="overflow-x-auto max-h-[450px]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="bg-coastal-50/80 border-b-2 border-coastal-200">
                          <th className="py-3 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs whitespace-nowrap">Year</th>
                          {availableVars.map(v => (
                            <th key={v.key} className="py-3 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs whitespace-nowrap">
                              {v.label}
                              <span className="block text-[10px] font-normal text-coastal-400">({v.unit})</span>
                            </th>
                          ))}
                          <th className="py-3 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs whitespace-nowrap">Erosion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {timeSeriesData.map((row, i) => (
                          <tr key={i} className={row.erosion_label === 1 ? 'bg-red-50/60' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                            <td className="py-2 px-3 text-center text-xs font-semibold text-coastal-800">{row.year}</td>
                            {availableVars.map(v => (
                              <td key={v.key} className="py-2 px-3 text-center text-xs font-mono">
                                {row[v.key] != null ? Number(row[v.key]).toFixed(3) : '--'}
                              </td>
                            ))}
                            <td className="py-2 px-3 text-center">
                              {row.erosion_label === 1 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Erosion</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">Stable</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-coastal-400 text-sm text-center py-8">No time series data available.</p>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
