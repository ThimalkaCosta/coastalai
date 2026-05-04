import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  MapPin, TrendingDown, TrendingUp, Minus,
  AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp,
  Waves, Calendar,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, PieChart, Pie, Legend, LabelList,
} from 'recharts'
import PageTransition from '../components/common/PageTransition'
import { useData } from '../context/DataContext'

// ─── Constants ────────────────────────────────────────────────────────────────

const CLS = {
  erosion:   { label: 'Erosion',   color: '#ef4444', light: '#fee2e2', text: 'text-red-700',   bg: 'bg-red-50',    border: 'border-red-200',    dot: '#ef4444', icon: TrendingDown },
  stable:    { label: 'Stable',    color: '#6b7280', light: '#f3f4f6', text: 'text-gray-600',  bg: 'bg-gray-50',   border: 'border-gray-200',   dot: '#6b7280', icon: Minus        },
  accretion: { label: 'Accretion', color: '#22c55e', light: '#dcfce7', text: 'text-green-700', bg: 'bg-green-50',  border: 'border-green-200',  dot: '#22c55e', icon: TrendingUp   },
}

function effectLabel(r) {
  const abs = Math.abs(r ?? 0)
  if (abs >= 0.7) return { text: 'Very Strong', cls: 'bg-red-100 text-red-700'    }
  if (abs >= 0.5) return { text: 'Strong',      cls: 'bg-orange-100 text-orange-700' }
  if (abs >= 0.3) return { text: 'Moderate',    cls: 'bg-amber-100 text-amber-700'  }
  return               { text: 'Weak',         cls: 'bg-gray-100 text-gray-500'    }
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function TimelineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const c = CLS[d.Change_Class] || CLS.stable
  const eff = effectLabel(d.effect_r)
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs min-w-[180px]">
      <p className="font-bold text-gray-800 mb-1">{d.interval_label} ({d.monsoon_year})</p>
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${c.bg} ${c.text}`}>{c.label}</span>
        <span className={`px-2 py-0.5 rounded-full font-medium text-[10px] ${eff.cls}`}>{eff.text}</span>
      </div>
      <div className="space-y-0.5 text-gray-600">
        <div className="flex justify-between gap-4">
          <span>Shoreline Change</span>
          <span className="font-bold font-mono" style={{ color: c.color }}>
            {d.trim_mean_m > 0 ? '+' : ''}{Number(d.trim_mean_m).toFixed(2)} m
          </span>
        </div>
        {d.ci_low != null && d.ci_high != null && (
          <div className="flex justify-between gap-4">
            <span>95% Range</span>
            <span className="font-mono">[{Number(d.ci_low).toFixed(1)}, {Number(d.ci_high).toFixed(1)}] m</span>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <span>Transects</span>
          <span className="font-mono">{d.NSM_count}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Statistically reliable</span>
          <span className={`font-semibold ${d.significant ? 'text-green-600' : 'text-amber-500'}`}>
            {d.significant ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShorelineClassificationPage() {
  const { data, loading } = useData()
  const [showFullTable, setShowFullTable] = useState(false)

  // Get from csvOutputs
  const rows = useMemo(() => {
    const raw = data?.csvOutputs?.['year_wise_shoreline_labels.csv'] || []
    return raw.map(r => ({
      ...r,
      trim_mean_m: r.trim_mean_m ?? r.annual_NSM,
      Change_Class: (r.Change_Class || r.change_class || '').toLowerCase(),
    })).sort((a, b) => Number(a.monsoon_year) - Number(b.monsoon_year))
  }, [data])

  // ── Summary stats ──
  const stats = useMemo(() => {
    if (!rows.length) return null
    const byClass = { erosion: 0, stable: 0, accretion: 0 }
    rows.forEach(r => { if (byClass[r.Change_Class] != null) byClass[r.Change_Class]++ })
    const changes = rows.map(r => Number(r.trim_mean_m)).filter(v => !isNaN(v))
    const maxErosion = changes.filter(v => v < 0).length ? Math.min(...changes.filter(v => v < 0)) : 0
    const maxAccretion = changes.filter(v => v > 0).length ? Math.max(...changes.filter(v => v > 0)) : 0
    const sigCount = rows.filter(r => r.significant === true || r.significant === 'True' || r.significant === 'true').length
    return { total: rows.length, ...byClass, maxErosion, maxAccretion, sigCount }
  }, [rows])

  // ── Chart data ──
  const chartData = useMemo(() =>
    rows.map(r => ({
      ...r,
      displayChange: Number(r.trim_mean_m) || 0,
      year: String(r.monsoon_year),
    })), [rows])

  const pieData = useMemo(() => {
    if (!stats) return []
    return Object.entries(CLS)
      .map(([key, c]) => ({ name: c.label, value: stats[key] || 0, color: c.color }))
      .filter(d => d.value > 0)
  }, [stats])

  if (loading) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="w-14 h-14 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-500">Loading shoreline data…</p>
        </div>
      </PageTransition>
    )
  }

  if (!rows.length) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Shoreline Data Available</h2>
          <p className="text-gray-500 max-w-sm">Upload the DSAS report and run analysis to see year-wise shoreline classification results.</p>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-blue-50/40 to-white">

        {/* ── Hero ── */}
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-extrabold text-gray-900">Year-wise Shoreline Change</h1>
                  <p className="text-sm text-gray-500">Waskaduwa Beach — Annual classification · {rows[0]?.monsoon_year}–{rows[rows.length-1]?.monsoon_year}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2 max-w-3xl bg-blue-50 rounded-xl px-4 py-2.5 border border-blue-100">
                <Info className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
                Each year shows whether the beach moved <strong className="text-red-600">towards the sea (erosion)</strong>,
                stayed the same <strong className="text-gray-600">(stable)</strong>,
                or <strong className="text-green-600">built up (accretion)</strong>.
                Positive numbers mean the beach grew; negative means the beach retreated.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* ── Summary stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Years Monitored', value: stats?.total,
                sub: `${rows[0]?.monsoon_year} – ${rows[rows.length-1]?.monsoon_year}`,
                icon: Calendar, grad: 'from-slate-500 to-gray-600',
              },
              {
                label: 'Erosion Years', value: stats?.erosion,
                sub: 'Beach retreated', icon: TrendingDown, grad: 'from-red-500 to-rose-600',
              },
              {
                label: 'Accretion Years', value: stats?.accretion,
                sub: 'Beach built up', icon: TrendingUp, grad: 'from-green-500 to-emerald-600',
              },
              {
                label: 'Statistically Confirmed', value: stats?.sigCount,
                sub: `out of ${stats?.total} years`, icon: CheckCircle, grad: 'from-teal-500 to-cyan-600',
              },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i }}
                className="card p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center shadow-sm flex-shrink-0`}>
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-display font-extrabold text-gray-900">{s.value}</div>
                  <div className="text-xs font-semibold text-gray-700">{s.label}</div>
                  <div className="text-[10px] text-gray-400">{s.sub}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Main chart: Diverging bar ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="card overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 to-cyan-700 px-5 py-4">
              <h2 className="font-display font-bold text-white text-lg flex items-center gap-2">
                <Waves className="w-5 h-5" /> Annual Shoreline Change Timeline
              </h2>
              <p className="text-blue-100 text-sm mt-0.5">
                How much the beach moved each year (in metres) · <span className="text-red-200 font-semibold">Red bars = beach retreated</span> · <span className="text-green-200 font-semibold">Green bars = beach grew</span>
              </p>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={chartData} margin={{ top: 16, right: 24, bottom: 8, left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12, fontWeight: 600 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `${v > 0 ? '+' : ''}${v} m`}
                    label={{ value: 'Change (m)', angle: -90, position: 'insideLeft', offset: -4, style: { fontSize: 11, fill: '#6b7280' } }}
                  />
                  <Tooltip content={<TimelineTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <ReferenceLine y={0} stroke="#374151" strokeWidth={2} />
                  <Bar dataKey="displayChange" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={CLS[entry.Change_Class]?.color || '#6b7280'} fillOpacity={entry.significant ? 1 : 0.5} />
                    ))}
                    <LabelList
                      dataKey="displayChange"
                      position="top"
                      style={{ fontSize: 10, fontWeight: 700 }}
                      formatter={v => (Math.abs(v) >= 1 ? `${v > 0 ? '+' : ''}${Number(v).toFixed(1)}` : '')}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500" />Erosion (beach retreated)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-400" />Stable (no major change)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500" />Accretion (beach grew)</span>
                <span className="flex items-center gap-1.5 ml-auto"><span className="w-3 h-3 rounded bg-gray-300 opacity-50 border border-gray-300" />Faded = not statistically confirmed</span>
              </div>
            </div>
          </motion.div>

          {/* ── Two charts side by side ── */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pie chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="card overflow-hidden">
              <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-5 py-4">
                <h2 className="font-display font-bold text-white text-base flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Overall Beach Health Summary
                </h2>
                <p className="text-violet-100 text-xs mt-0.5">How many years was the beach eroding vs growing?</p>
              </div>
              <div className="p-5 flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} yr${value !== 1 ? 's' : ''} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={{ stroke: '#9ca3af' }}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, name) => [`${v} year${v !== 1 ? 's' : ''}`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Quick summary */}
                <div className="flex gap-4 mt-2">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5 text-sm">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-600">{d.name}:</span>
                      <span className="font-bold text-gray-800">{d.value} yr{d.value !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Effect size chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="card overflow-hidden">
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-4">
                <h2 className="font-display font-bold text-white text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Change Intensity Per Year
                </h2>
                <p className="text-amber-100 text-xs mt-0.5">How strong the change was (higher bar = more dramatic change)</p>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={chartData.filter(r => r.effect_r != null)}
                    margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 1]}
                      tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                    />
                    <ReferenceLine y={0.3} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Moderate', position: 'right', fontSize: 10, fill: '#f59e0b' }} />
                    <ReferenceLine y={0.7} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Very Strong', position: 'right', fontSize: 10, fill: '#ef4444' }} />
                    <Tooltip
                      formatter={(v, _) => [`${(Number(v) * 100).toFixed(0)}%`, 'Change Intensity']}
                      labelFormatter={l => `Year ${l}`}
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    />
                    <Bar dataKey={r => Math.abs(Number(r.effect_r ?? 0))} radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {chartData.filter(r => r.effect_r != null).map((entry, i) => (
                        <Cell key={i} fill={CLS[entry.Change_Class]?.color || '#6b7280'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* ── Simplified table ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="card overflow-hidden">
            <div className="bg-gradient-to-r from-slate-700 to-gray-800 px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-white text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Year-by-Year Summary Table
                </h2>
                <p className="text-slate-300 text-xs mt-0.5">Click a row to see detailed stats</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="py-3.5 px-4 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs">Year</th>
                    <th className="py-3.5 px-4 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs">Period</th>
                    <th className="py-3.5 px-4 text-center font-semibold text-gray-600 uppercase tracking-wider text-xs">Beach Status</th>
                    <th className="py-3.5 px-4 text-center font-semibold text-gray-600 uppercase tracking-wider text-xs">Change (m)</th>
                    <th className="py-3.5 px-4 text-center font-semibold text-gray-600 uppercase tracking-wider text-xs">Intensity</th>
                    <th className="py-3.5 px-4 text-center font-semibold text-gray-600 uppercase tracking-wider text-xs">Confirmed?</th>
                    <th className="py-3.5 px-1 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row, i) => (
                    <TableRow key={row.monsoon_year} row={row} index={i} showFull={showFullTable} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <p className="text-xs text-gray-400">Showing {rows.length} years of data · {stats?.sigCount} statistically confirmed</p>
              <button onClick={() => setShowFullTable(s => !s)}
                className="text-xs text-ocean-600 hover:text-ocean-700 font-medium flex items-center gap-1">
                {showFullTable ? <><ChevronUp className="w-3.5 h-3.5" /> Hide details</> : <><ChevronDown className="w-3.5 h-3.5" /> Show full details</>}
              </button>
            </div>
          </motion.div>

          {/* ── Plain-language interpretation ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="card p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
            <h3 className="font-display font-bold text-blue-900 text-base mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" /> How to Read These Results
            </h3>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-red-800">Erosion Year</p>
                  <p className="text-red-700 text-xs mt-0.5">The beach retreated by more than 1 metre — sand was lost. Requires monitoring and possible intervention.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Minus className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Stable Year</p>
                  <p className="text-gray-600 text-xs mt-0.5">The beach position did not change significantly (within ±1 metre). No immediate action needed.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-800">Accretion Year</p>
                  <p className="text-green-700 text-xs mt-0.5">The beach grew by more than 1 metre — sand was gained. A positive sign for beach health.</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-3 border-t border-blue-200 pt-3">
              <strong>Confirmed?</strong> — Results marked as confirmed passed two statistical tests, meaning the change is real and not due to natural measurement variation.
              Unconfirmed results should be interpreted with caution.
            </p>
          </motion.div>

        </div>
      </div>
    </PageTransition>
  )
}

// ─── Table row component ──────────────────────────────────────────────────────

function TableRow({ row, index, showFull }) {
  const [expanded, setExpanded] = useState(false)
  const open = expanded || showFull
  const c = CLS[row.Change_Class] || CLS.stable
  const eff = effectLabel(row.effect_r)
  const isConfirmed = row.significant === true || row.significant === 'True' || row.significant === 'true'
  const change = Number(row.trim_mean_m)

  return (
    <>
      <tr
        onClick={() => setExpanded(e => !e)}
        className={`cursor-pointer transition-colors ${open ? 'bg-blue-50/40' : index % 2 === 0 ? 'bg-white hover:bg-gray-50/60' : 'bg-gray-50/30 hover:bg-gray-50/80'}`}
      >
        {/* Year */}
        <td className="py-3 px-4">
          <span className="font-bold text-gray-900 text-base">{row.monsoon_year}</span>
        </td>
        {/* Period */}
        <td className="py-3 px-4 text-gray-500 font-mono text-xs">{row.interval_label}</td>
        {/* Status */}
        <td className="py-3 px-4 text-center">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${c.bg} ${c.text} ${c.border} border`}>
            <c.icon className="w-3.5 h-3.5" />
            {c.label}
          </span>
        </td>
        {/* Change */}
        <td className="py-3 px-4 text-center">
          <span className="font-display font-extrabold text-lg" style={{ color: c.color }}>
            {change > 0 ? '+' : ''}{change.toFixed(2)} m
          </span>
        </td>
        {/* Intensity */}
        <td className="py-3 px-4 text-center">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${eff.cls}`}>{eff.text}</span>
        </td>
        {/* Confirmed */}
        <td className="py-3 px-4 text-center">
          {isConfirmed ? (
            <div className="flex items-center justify-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-semibold">Yes</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1 text-amber-500">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-semibold">Uncertain</span>
            </div>
          )}
        </td>
        <td className="py-3 px-2 text-center">
          {open ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
        </td>
      </tr>

      {/* Expanded detail */}
      {open && (
        <tr className="bg-blue-50/30">
          <td colSpan={7} className="px-4 py-3">
            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="font-semibold text-gray-500 mb-1 uppercase tracking-wider text-[10px]">Statistical Estimate</p>
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">Trimmed Mean</span><span className="font-mono font-semibold">{change > 0 ? '+' : ''}{change.toFixed(3)} m</span></div>
                  {row.hl_median_m != null && <div className="flex justify-between"><span className="text-gray-500">H–L Median</span><span className="font-mono">{Number(row.hl_median_m) > 0 ? '+' : ''}{Number(row.hl_median_m).toFixed(3)} m</span></div>}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="font-semibold text-gray-500 mb-1 uppercase tracking-wider text-[10px]">Confidence Range (95%)</p>
                <div className="space-y-1">
                  {row.ci_low != null && <div className="flex justify-between"><span className="text-gray-500">Minimum likely</span><span className="font-mono">{Number(row.ci_low).toFixed(2)} m</span></div>}
                  {row.ci_high != null && <div className="flex justify-between"><span className="text-gray-500">Maximum likely</span><span className="font-mono">{Number(row.ci_high).toFixed(2)} m</span></div>}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="font-semibold text-gray-500 mb-1 uppercase tracking-wider text-[10px]">Survey Details</p>
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">Transects measured</span><span className="font-mono font-semibold">{row.NSM_count}</span></div>
                  {row.effect_r != null && <div className="flex justify-between"><span className="text-gray-500">Effect size</span><span className="font-mono">{Number(row.effect_r).toFixed(3)}</span></div>}
                  {row.wilcoxon_p != null && <div className="flex justify-between"><span className="text-gray-500">Significance (p)</span><span className="font-mono">{Number(row.wilcoxon_p) < 0.001 ? '<0.001' : Number(row.wilcoxon_p).toFixed(3)}</span></div>}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
