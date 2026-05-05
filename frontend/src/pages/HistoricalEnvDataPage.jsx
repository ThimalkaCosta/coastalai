import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Wind, Waves, Droplets, Database, TrendingUp } from 'lucide-react'
import Papa from 'papaparse'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Label,
} from 'recharts'
import PageTransition from '../components/common/PageTransition'

// ── CSV loader ──────────────────────────────────────────────────────────────
function useCsv(path) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(path)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then((text) => {
        const result = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true })
        setRows(result.data)
        setLoading(false)
      })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [path])

  return { rows, loading, error }
}

// ── Numeric formatter ────────────────────────────────────────────────────────
const fmt = (v, d = 4) => (v == null || (typeof v === 'number' && isNaN(v)) ? '—' : Number(v).toFixed(d))

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 text-sm">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          <span className="font-mono font-bold">{p.value != null ? Number(p.value).toFixed(4) : '—'}</span>{' '}
          <span className="text-gray-500">{unit}</span>
        </p>
      ))}
    </div>
  )
}

// ── Single variable line chart ────────────────────────────────────────────────
function VarChart({ title, data, dataKey, color, unit, yLabel, delay = 0 }) {
  const clean = useMemo(
    () => data.filter((r) => r[dataKey] != null && !isNaN(r[dataKey])),
    [data, dataKey]
  )

  // Show only Jan of each year on x-axis
  const tickFormatter = (val) => {
    if (!val) return ''
    const parts = String(val).split('-')
    return parts[1] === '01' ? parts[0] : ''
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Title bar */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-3">
        <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="font-bold text-gray-800 text-base">{title}</span>
        {unit && (
          <span
            className="ml-auto text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
            style={{ background: color }}
          >
            {unit}
          </span>
        )}
      </div>

      {clean.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-gray-400 text-sm">No data available</div>
      ) : (
        <div className="px-3 pb-4" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={clean} margin={{ top: 10, right: 28, left: 16, bottom: 52 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="year_month"
                tickFormatter={tickFormatter}
                tick={{ fontSize: 13, fill: '#6b7280', fontWeight: 600 }}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              >
                <Label
                  value="Year"
                  position="insideBottom"
                  offset={-36}
                  style={{ fontSize: 13, fill: '#9ca3af', fontWeight: 700 }}
                />
              </XAxis>
              <YAxis
                tick={{ fontSize: 13, fill: '#6b7280', fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                width={64}
                tickFormatter={(v) => Number(v).toFixed(2)}
              >
                <Label
                  value={`${yLabel || dataKey} (${unit})`}
                  angle={-90}
                  position="insideLeft"
                  offset={-4}
                  style={{ fontSize: 12, fill: '#9ca3af', fontWeight: 700 }}
                />
              </YAxis>
              <Tooltip content={<ChartTooltip unit={unit} />} />
              <Line
                type="monotone"
                dataKey={dataKey}
                name={yLabel || dataKey}
                stroke={color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, fill: color, strokeWidth: 2, stroke: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  )
}

// ── Chart group card ──────────────────────────────────────────────────────────
function ChartGroup({ title, icon: Icon, color, charts, rows, loading }) {
  if (loading) return (
    <div className="rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">Loading charts…</div>
  )
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r ${color}`}>
        <Icon className="w-5 h-5 text-white" />
        <span className="font-display font-bold text-white text-base">{title}</span>
        <span className="text-white/60 text-sm ml-auto">{rows.length} monthly records</span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {charts.map((c, i) => (
          <VarChart key={c.dataKey} {...c} data={rows} delay={i * 0.07} />
        ))}
      </div>
    </motion.div>
  )
}

// ── Scrollable table ─────────────────────────────────────────────────────────
function DataTable({ title, icon: Icon, color, columns, rows, loading, error }) {
  const [sortCol, setSortCol] = useState(null)
  const [sortAsc, setSortAsc] = useState(true)

  const sorted = useMemo(() => {
    if (!sortCol) return rows
    return [...rows].sort((a, b) => {
      const av = a[sortCol]; const bv = b[sortCol]
      if (av == null) return 1; if (bv == null) return -1
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortAsc ? cmp : -cmp
    })
  }, [rows, sortCol, sortAsc])

  const handleSort = (col) => {
    if (sortCol === col) setSortAsc((p) => !p)
    else { setSortCol(col); setSortAsc(true) }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div className={`px-5 py-3 bg-gradient-to-r ${color}`}>
        <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {title}
        </h3>
        <p className="text-white/70 text-xs mt-0.5">{rows.length} monthly records · click column header to sort</p>
      </div>

      {/* Body */}
      {loading ? (
        <div className="p-10 text-center text-coastal-400 text-sm">Loading…</div>
      ) : error ? (
        <div className="p-10 text-center text-red-500 text-sm">Failed to load data: {error}</div>
      ) : (
        <div className="overflow-auto max-h-96 text-xs">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-coastal-50/95 backdrop-blur-sm border-b border-coastal-200">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="py-2 px-3 text-left font-semibold text-coastal-600 uppercase tracking-wider text-[10px] cursor-pointer select-none whitespace-nowrap hover:text-coastal-900 transition-colors"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortCol === col.key
                        ? sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        : <span className="w-3 h-3" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-1.5 px-3 whitespace-nowrap ${col.mono ? 'font-mono' : ''} ${col.bold ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
                    >
                      {col.numeric ? fmt(row[col.key], col.decimals ?? 4) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}

// ── Chart configurations per dataset ─────────────────────────────────────────
const WAVE_CHARTS = [
  { dataKey: 'VHM0_mean',        title: 'Significant Wave Height Mean',  unit: 'm',    color: '#0d9488', yLabel: 'VHM0_mean' },
  { dataKey: 'VTPK_mean',        title: 'Peak Wave Period Mean',         unit: 's',    color: '#0891b2', yLabel: 'VTPK_mean' },
  { dataKey: 'VMDR_mean',        title: 'Mean Wave Direction',           unit: '°',    color: '#2563eb', yLabel: 'VMDR_mean' },
]

const WIND_CHARTS = [
  { dataKey: 'eastward_wind_mean',  title: 'Eastward Wind Mean',          unit: 'm/s',  color: '#7c3aed', yLabel: 'eastward_wind_mean' },
  { dataKey: 'northward_wind_mean', title: 'Northward Wind Mean',         unit: 'm/s',  color: '#9333ea', yLabel: 'northward_wind_mean' },
]

const CURRENT_CHARTS = [
  { dataKey: 'uo_mean',          title: 'Eastward Current Mean (uo)',    unit: 'm/s',  color: '#059669', yLabel: 'uo_mean' },
  { dataKey: 'vo_mean',          title: 'Northward Current Mean (vo)',   unit: 'm/s',  color: '#10b981', yLabel: 'vo_mean' },
  { dataKey: 'zos_mean',         title: 'Sea Surface Height Mean (zos)', unit: 'm',    color: '#0284c7', yLabel: 'zos_mean' },
]

// ── Column definitions ────────────────────────────────────────────────────────
const WIND_COLS = [
  { key: 'year_month',            label: 'Month',                    bold: true },
  { key: 'monsoon_year',          label: 'Monsoon Year',             numeric: false },
  { key: 'wind_speed_max',        label: 'Wind Speed Max (m/s)',     numeric: true, mono: true, decimals: 3 },
  { key: 'wind_speed_mean',       label: 'Wind Speed Mean (m/s)',    numeric: true, mono: true, decimals: 3 },
  { key: 'eastward_wind_max',     label: 'Eastward Wind Max (m/s)',  numeric: true, mono: true, decimals: 3 },
  { key: 'eastward_wind_mean',    label: 'Eastward Wind Mean (m/s)', numeric: true, mono: true, decimals: 3 },
  { key: 'northward_wind_max',    label: 'Northward Wind Max (m/s)', numeric: true, mono: true, decimals: 3 },
  { key: 'northward_wind_mean',   label: 'Northward Wind Mean (m/s)',numeric: true, mono: true, decimals: 3 },
]

const WAVE_COLS = [
  { key: 'year_month',        label: 'Month',                    bold: true },
  { key: 'monsoon_year',      label: 'Monsoon Year',             numeric: false },
  { key: 'VHM0_max',          label: 'Wave Height Max (m)',      numeric: true, mono: true, decimals: 3 },
  { key: 'VHM0_mean',         label: 'Wave Height Mean (m)',     numeric: true, mono: true, decimals: 3 },
  { key: 'VHM0_std',          label: 'Wave Height Std',          numeric: true, mono: true, decimals: 3 },
  { key: 'VTPK_max',          label: 'Wave Period Max (s)',      numeric: true, mono: true, decimals: 3 },
  { key: 'VTPK_mean',         label: 'Wave Period Mean (s)',     numeric: true, mono: true, decimals: 3 },
  { key: 'VMDR_mean',         label: 'Wave Direction (°)',       numeric: true, mono: true, decimals: 2 },
  { key: 'StokesDrift_max',   label: 'Stokes Drift Max (m/s)',  numeric: true, mono: true, decimals: 4 },
  { key: 'StokesDrift_mean',  label: 'Stokes Drift Mean (m/s)', numeric: true, mono: true, decimals: 4 },
  { key: 'StormDays_wave',    label: 'Storm Days',               numeric: true, mono: true, decimals: 0 },
]

const CURRENT_COLS = [
  { key: 'year_month',   label: 'Month',                      bold: true },
  { key: 'monsoon_year', label: 'Monsoon Year',               numeric: false },
  { key: 'uo_max',       label: 'Eastward Current Max (m/s)', numeric: true, mono: true, decimals: 4 },
  { key: 'uo_mean',      label: 'Eastward Current Mean (m/s)',numeric: true, mono: true, decimals: 4 },
  { key: 'vo_max',       label: 'Northward Current Max (m/s)',numeric: true, mono: true, decimals: 4 },
  { key: 'vo_mean',      label: 'Northward Current Mean (m/s)',numeric: true, mono: true, decimals: 4 },
  { key: 'zos_max',      label: 'Sea Level Max (m)',           numeric: true, mono: true, decimals: 4 },
  { key: 'zos_mean',     label: 'Sea Level Mean (m)',          numeric: true, mono: true, decimals: 4 },
]

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HistoricalEnvDataPage() {
  const wind    = useCsv('/data/monthly_wind.csv')
  const current = useCsv('/data/monthly_current.csv')
  const wave    = useCsv('/data/monthly_wave.csv')

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-coastal-50 to-white bg-mesh-1">
        {/* Page header */}
        <section className="pt-8 sm:pt-10 pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
              <div className="page-badge bg-teal-50 text-teal-600 border-teal-100 mb-4">
                <Database className="w-3.5 h-3.5" />
                Historical Records
              </div>
              <h1 className="section-title mb-3">Historical Environmental Data</h1>
              <p className="section-subtitle">
                Monthly per-variable records for wind, wave, and ocean current forcing from 2009 to 2024.
                Use the table headers to sort by any column.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Charts */}
        <section className="pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

            {/* Section badge */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <div className="page-badge bg-violet-50 text-violet-600 border-violet-100">
                <TrendingUp className="w-3.5 h-3.5" />
                Historical Trends
              </div>
              <span className="text-gray-400 text-xs">per-variable monthly time series</span>
            </motion.div>

            <ChartGroup
              title="Wave Variables"
              icon={Waves}
              color="from-teal-600 to-cyan-600"
              charts={WAVE_CHARTS}
              rows={wave.rows}
              loading={wave.loading}
            />

            <ChartGroup
              title="Wind Variables"
              icon={Wind}
              color="from-violet-600 to-purple-600"
              charts={WIND_CHARTS}
              rows={wind.rows}
              loading={wind.loading}
            />

            <ChartGroup
              title="Ocean Current Variables"
              icon={Droplets}
              color="from-emerald-600 to-teal-600"
              charts={CURRENT_CHARTS}
              rows={current.rows}
              loading={current.loading}
            />
          </div>
        </section>

        {/* Tables */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

            {/* Wind */}
            <DataTable
              title="Monthly Wind Dataset (Per-Variable)"
              icon={Wind}
              color="from-sky-600 to-blue-600"
              columns={WIND_COLS}
              rows={wind.rows}
              loading={wind.loading}
              error={wind.error}
            />

            {/* Wave */}
            <DataTable
              title="Monthly Wave Dataset (Per-Variable)"
              icon={Waves}
              color="from-teal-600 to-emerald-600"
              columns={WAVE_COLS}
              rows={wave.rows}
              loading={wave.loading}
              error={wave.error}
            />

            {/* Current */}
            <DataTable
              title="Monthly Current Dataset (Per-Variable)"
              icon={Droplets}
              color="from-indigo-600 to-violet-600"
              columns={CURRENT_COLS}
              rows={current.rows}
              loading={current.loading}
              error={current.error}
            />

          </div>
        </section>
      </div>
    </PageTransition>
  )
}
