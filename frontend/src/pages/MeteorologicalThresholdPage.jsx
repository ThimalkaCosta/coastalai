import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  CloudRain, Target, Activity, TrendingUp, Table2,
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
  Trash2, Waves, Wind, Droplets, ArrowRight,
  BarChart2, Calendar, Layers, Upload,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, ReferenceLine, Legend,
} from 'recharts'
import PageTransition from '../components/common/PageTransition'
import { useData } from '../context/DataContext'

// ─── Constants ────────────────────────────────────────────────────────────────

const CLASS = {
  erosion:   { label: 'Erosion',   color: '#ef4444', bg: 'bg-red-100',   text: 'text-red-700',   dot: 'bg-red-500'   },
  stable:    { label: 'Stable',    color: '#6b7280', bg: 'bg-gray-100',  text: 'text-gray-600',  dot: 'bg-gray-400'  },
  accretion: { label: 'Accretion', color: '#22c55e', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
}

const BOUNDARY = {
  erosion_onset:   { label: 'Erosion Onset',   color: '#f97316', lightBg: '#fff7ed', border: '#fed7aa', badge: 'bg-orange-100 text-orange-700 border-orange-200' },
  accretion_onset: { label: 'Accretion Onset', color: '#22c55e', lightBg: '#f0fdf4', border: '#bbf7d0', badge: 'bg-green-100 text-green-700 border-green-200' },
}

const HORIZONS = [
  { key: '6',  label: 'H6',  sub: '6 mo',  color: '#818cf8' },
  { key: '12', label: 'H12', sub: '12 mo', color: '#6366f1' },
  { key: '18', label: 'H18', sub: '18 mo', color: '#4f46e5' },
  { key: '24', label: 'H24', sub: '24 mo', color: '#3730a3' },
]

const TABS = [
  { id: 'overview',    label: 'Overview',    icon: Layers },
  { id: 'thresholds',  label: 'Thresholds',  icon: Target },
  { id: 'forecasts',   label: 'Forecasts',   icon: TrendingUp },
  { id: 'data',        label: 'Data Tables', icon: Table2 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v, d = 3) => (v != null && !isNaN(Number(v)) ? Number(v).toFixed(d) : '—')

function getIcon(driver = '') {
  const d = driver.toLowerCase()
  if (d.includes('vhm0') || d.includes('wave') || d.includes('vtpk')) return Waves
  if (d.includes('wind') || d.includes('uo') || d.includes('vo'))      return Wind
  if (d.includes('curr') || d.includes('rain'))                        return Droplets
  return Activity
}

function ClassChip({ cls, size = 'sm' }) {
  const c = CLASS[cls] || CLASS.stable
  const px = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${c.bg} ${c.text} ${px}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({ recognition }) {
  if (!recognition) return <EmptyState message="Run the analysis to see pattern recognition results." />

  const { balancedAccuracy, macroF1, rocAucOvr, confusionMatrix, classNames,
          loocvResults, shapTopFeatures, permImportance, selectedFeatures } = recognition

  const shapData = (shapTopFeatures || [])
    .map(r => ({ name: r.feature.length > 22 ? r.feature.slice(0, 22) + '…' : r.feature, value: r.mean_abs_shap }))
    .filter(r => r.value != null).slice(0, 10)

  const permData = (permImportance || []).slice(0, 10)
    .map(r => ({ name: r.feature.length > 22 ? r.feature.slice(0, 22) + '…' : r.feature, value: r.mean }))
    .filter(r => r.value != null)

  const loocv = loocvResults || []
  const correct = loocv.filter(r => r.correct).length

  return (
    <div className="space-y-6">
      {/* Skill metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Balanced Accuracy', value: balancedAccuracy != null ? `${(balancedAccuracy*100).toFixed(1)}%` : '—', color: 'from-teal-500 to-cyan-600', icon: CheckCircle },
          { label: 'Macro F1 Score',    value: fmt(macroF1), color: 'from-blue-500 to-indigo-600', icon: Activity },
          { label: 'ROC AUC (OvR)',     value: rocAucOvr != null ? fmt(rocAucOvr) : '—', color: 'from-violet-500 to-purple-600', icon: BarChart2 },
          { label: 'LOOCV Accuracy',    value: loocv.length > 0 ? `${((correct/loocv.length)*100).toFixed(1)}%` : '—', color: 'from-amber-500 to-orange-600', icon: Calendar },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06*i }}
            className="card p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm flex-shrink-0`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Year timeline */}
      {loocv.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-5 py-3.5">
            <h3 className="font-display font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Year-wise Shoreline Classification (LOOCV)
            </h3>
            <p className="text-slate-300 text-xs mt-0.5">Actual vs predicted class per monsoon year — green border = correct, red = misclassified</p>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              {loocv.map((r) => {
                const actual = CLASS[r.actual_class] || CLASS.stable
                const pred   = CLASS[r.predicted_class] || CLASS.stable
                return (
                  <div key={r.monsoon_year}
                    className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 text-center ${r.correct ? 'border-green-400 bg-green-50/60' : 'border-red-300 bg-red-50/60'}`}
                    style={{ minWidth: 72 }}>
                    <span className="text-xs font-bold text-gray-700">{r.monsoon_year}</span>
                    <ClassChip cls={r.actual_class} />
                    {!r.correct && (
                      <div className="flex items-center gap-0.5 text-[9px] text-red-500 font-medium">
                        <ArrowRight className="w-2.5 h-2.5" />{pred.label}
                      </div>
                    )}
                    {r.top_prob != null && (
                      <span className="text-[9px] text-gray-400 font-mono">{(r.top_prob*100).toFixed(0)}%</span>
                    )}
                  </div>
                )
              })}
            </div>
            {/* Class legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
              {Object.values(CLASS).map(c => (
                <div key={c.label} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                  {c.label}
                </div>
              ))}
              <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-green-400 inline-block" />Correct</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-red-300 inline-block" />Misclassified</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Confusion matrix + SHAP side by side */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Confusion matrix */}
        {confusionMatrix && classNames && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="card overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-cyan-700 px-5 py-3.5">
              <h3 className="font-display font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4" /> Confusion Matrix
              </h3>
              <p className="text-teal-100 text-xs mt-0.5">LOOCV predictions vs actual classes</p>
            </div>
            <div className="p-5 flex justify-center">
              <div>
                <div className="flex justify-center mb-1">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Predicted →</span>
                </div>
                <table className="text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="px-2 py-2 text-[9px] text-gray-400 font-normal text-right">Actual ↓</th>
                      {classNames.map(cn => (
                        <th key={cn} className="px-5 py-2 font-semibold text-center capitalize text-gray-700">{cn}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {confusionMatrix.map((row, ri) => (
                      <tr key={ri}>
                        <td className="px-2 py-1 font-semibold capitalize text-right text-gray-700 text-[11px]">{classNames[ri]}</td>
                        {row.map((cell, ci) => {
                          const maxInRow = Math.max(...row)
                          const pct = maxInRow > 0 ? cell / maxInRow : 0
                          return (
                            <td key={ci} className="px-1 py-1 text-center">
                              <div className={`w-14 h-12 rounded-lg flex flex-col items-center justify-center text-sm font-bold
                                ${ri === ci ? 'bg-teal-500 text-white shadow-sm' : 'text-gray-700'}`}
                                style={ri !== ci ? { backgroundColor: `rgba(239,68,68,${pct * 0.3 + 0.05})` } : {}}>
                                {cell}
                                {ri !== ci && cell > 0 && (
                                  <span className="text-[9px] font-normal text-red-500">{(pct*100).toFixed(0)}%</span>
                                )}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* SHAP importance */}
        {shapData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="card overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-3.5">
              <h3 className="font-display font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4" /> SHAP Feature Importance
              </h3>
              <p className="text-blue-100 text-xs mt-0.5">Mean absolute SHAP value — top 10 drivers</p>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={shapData} layout="vertical" margin={{ left: 0, right: 24, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(v) => [fmt(v, 4), 'Mean |SHAP|']}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={18}>
                    {shapData.map((_, i) => (
                      <Cell key={i} fill={`hsl(${220 - i * 8}, 72%, ${52 + i * 2}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>

      {/* Permutation importance */}
      {permData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="card overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-5 py-3.5">
            <h3 className="font-display font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> Permutation Importance
            </h3>
            <p className="text-violet-100 text-xs mt-0.5">Model accuracy drop when each feature is randomly shuffled</p>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={permData} layout="vertical" margin={{ left: 0, right: 24, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v) => [fmt(v, 4), 'Importance']}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {permData.map((_, i) => (
                    <Cell key={i} fill={`hsl(${270 - i * 8}, 65%, ${50 + i * 2}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ─── Tab: Thresholds ─────────────────────────────────────────────────────────

function ThresholdFeatureRow({ item, index }) {
  const [open, setOpen] = useState(index < 3)
  const Icon = getIcon(item.driver)

  const jsdLabel = (v) => {
    if (v == null || isNaN(v)) return null
    if (v >= 0.3) return { text: 'Well separated', cls: 'bg-green-100 text-green-700' }
    if (v >= 0.1) return { text: 'Moderate',       cls: 'bg-amber-100 text-amber-700' }
    return               { text: 'Overlapping',    cls: 'bg-red-100 text-red-600' }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.025 * index }}
      className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 bg-white hover:bg-gray-50/80 transition-colors text-left">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ocean-100 to-blue-100 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-ocean-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">{item.feature}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-gray-400">{item.driver}</span>
              {item.unit && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">{item.unit}</span>}
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.direction === 'direct' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                {item.direction === 'direct' ? '↑ → erosion' : '↓ → erosion'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Quick boundary preview */}
          <div className="hidden md:flex gap-3">
            {['erosion_onset', 'accretion_onset'].map(bk => {
              const b = item.boundaries?.[bk]
              const cfg = BOUNDARY[bk]
              return b?.estimate != null ? (
                <div key={bk} className="text-right">
                  <div className="text-[10px] text-gray-400">{cfg.label}</div>
                  <div className="text-sm font-bold font-mono" style={{ color: cfg.color }}>{Number(b.estimate).toFixed(3)}</div>
                </div>
              ) : null
            })}
          </div>
          {item.spearmanRho != null && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-mono hidden sm:inline">
              ρ={Number(item.spearmanRho).toFixed(2)}
            </span>
          )}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${open ? 'bg-ocean-100' : 'bg-gray-100'}`}>
            {open ? <ChevronUp className="w-4 h-4 text-ocean-600" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-100">
            <div className="px-5 py-5 bg-gray-50/50 space-y-5">
              {/* Boundary cards */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Class Boundary Estimates + 95% BCa CI</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {['erosion_onset', 'accretion_onset'].map(bk => {
                    const cfg = BOUNDARY[bk]
                    const b = item.boundaries?.[bk]
                    const jsd = item.jsd?.[bk]
                    const jsdInfo = jsdLabel(jsd)
                    return (
                      <div key={bk} className="rounded-xl border p-4" style={{ backgroundColor: cfg.lightBg, borderColor: cfg.border }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.badge}`}>{cfg.label}</span>
                          {jsdInfo && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${jsdInfo.cls}`}>
                              JSD {Number(jsd).toFixed(2)} · {jsdInfo.text}
                            </span>
                          )}
                        </div>
                        {b?.estimate != null ? (
                          <>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-display font-bold" style={{ color: cfg.color }}>
                                {Number(b.estimate).toFixed(3)}
                              </span>
                              {item.unit && <span className="text-sm text-gray-400">{item.unit}</span>}
                            </div>
                            {b.low95 != null && b.high95 != null && (
                              <div className="mt-1 text-xs text-gray-400 font-mono">
                                95% CI: [{Number(b.low95).toFixed(3)}, {Number(b.high95).toFixed(3)}]
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">Not estimated</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Class bands */}
              {item.classBands && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Historical Class Ranges (Q₂₅ – Median – Q₇₅)</p>
                  <div className="space-y-2.5">
                    {['erosion', 'stable', 'accretion'].map(cl => {
                      const b = item.classBands?.[cl]
                      if (!b || b.count === 0) return null
                      const c = CLASS[cl]
                      return (
                        <div key={cl} className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 w-24 flex-shrink-0">
                            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                            <span className="text-xs font-medium text-gray-600">{c.label}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono w-10">n={b.count}</span>
                          <div className="flex-1 flex items-center gap-2 text-[10px] font-mono text-gray-400">
                            <span>{b.q25 != null ? Number(b.q25).toFixed(2) : '—'}</span>
                            <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                              <div className="h-full rounded-full opacity-75" style={{ backgroundColor: c.color, width: '65%' }} />
                            </div>
                            <span>{b.q75 != null ? Number(b.q75).toFixed(2) : '—'}</span>
                          </div>
                          <span className="text-xs font-bold font-mono w-20 text-right" style={{ color: c.color }}>
                            med {b.median != null ? Number(b.median).toFixed(3) : '—'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ThresholdsTab({ thresholds }) {
  if (!thresholds.length) return <EmptyState message="Run the analysis to see driver threshold ranges." />
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-display font-bold text-gray-900">Driver Boundary Ranges</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Ordered logit + KDE ensemble · Boundaries separate erosion / stable / accretion classes · 95% BCa bootstrap CIs
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {Object.values(BOUNDARY).map(b => (
            <span key={b.label} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-gray-200 shadow-xs">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
              {b.label}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {thresholds.map((item, i) => (
          <ThresholdFeatureRow key={item.feature} item={item} index={i} />
        ))}
      </div>
    </div>
  )
}

// ─── Tab: Forecasts ──────────────────────────────────────────────────────────

function HistorySparkline({ history, color }) {
  if (!history || history.length < 2) return null
  const data = history.map(r => ({ year: r.year, v: r.threshold }))
  return (
    <ResponsiveContainer width={100} height={36}>
      <LineChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function ForecastsTab({ forecasts }) {
  if (!forecasts?.features || !Object.keys(forecasts.features).length)
    return <EmptyState message="Run the analysis to see threshold forecasts." />

  const features = Object.entries(forecasts.features)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-display font-bold text-gray-900">Threshold Forecasts</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Ensemble method: TheilSen + GP Matérn + Huber · Anchor: <span className="font-mono font-semibold">{forecasts.forecastAnchor}</span>
        </p>
      </div>

      {/* Horizon legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {HORIZONS.map(h => (
          <div key={h.key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-xs text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: h.color }} />
            <span className="font-semibold">{h.label}</span>
            <span className="text-gray-400">{h.sub}</span>
          </div>
        ))}
      </div>

      {/* Per-feature cards */}
      {features.map(([feat, fdata], fi) => {
        const Icon = getIcon(fdata.driver)
        return (
          <motion.div key={feat} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * fi }}
            className="card overflow-hidden">
            <div className="px-5 py-3.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-ocean-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-ocean-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">{feat}</p>
                <p className="text-[11px] text-gray-400">{fdata.driver}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="py-3 px-4 text-left font-semibold text-gray-500 uppercase tracking-wider">Boundary</th>
                    <th className="py-3 px-3 text-center font-semibold text-gray-500 uppercase tracking-wider">Trend (MK)</th>
                    <th className="py-3 px-3 text-center font-semibold text-gray-500 uppercase tracking-wider">History</th>
                    {HORIZONS.map(h => (
                      <th key={h.key} className="py-3 px-3 text-center font-semibold uppercase tracking-wider" style={{ color: h.color }}>
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {Object.entries(fdata.boundaries || {}).map(([bname, bdata]) => {
                    const cfg = BOUNDARY[bname]
                    const trendStyle = bdata.trend === 'increasing' ? 'text-red-600' : bdata.trend === 'decreasing' ? 'text-green-600' : 'text-gray-400'
                    return (
                      <tr key={bname} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg?.badge || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {cfg?.label || bname}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className={`font-semibold capitalize ${trendStyle}`}>{bdata.trend || '—'}</div>
                          {bdata.mkTau != null && (
                            <div className="text-[10px] text-gray-400 font-mono">τ={Number(bdata.mkTau).toFixed(2)}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <HistorySparkline history={bdata.history} color={cfg?.color || '#6b7280'} />
                        </td>
                        {HORIZONS.map(h => {
                          const hd = bdata.horizons?.[h.key]
                          return (
                            <td key={h.key} className="py-3 px-3 text-center">
                              {hd?.estimate != null ? (
                                <div>
                                  <div className="font-bold font-mono text-gray-800">{Number(hd.estimate).toFixed(3)}</div>
                                  {hd.low95 != null && hd.high95 != null && (
                                    <div className="text-[9px] text-gray-400 font-mono">
                                      [{Number(hd.low95).toFixed(2)}, {Number(hd.high95).toFixed(2)}]
                                    </div>
                                  )}
                                  {hd.targetDate && hd.targetDate !== 'None' && (
                                    <div className="text-[9px] text-gray-300">{String(hd.targetDate).slice(0, 7)}</div>
                                  )}
                                </div>
                              ) : <span className="text-gray-300">—</span>}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Tab: Data Tables ────────────────────────────────────────────────────────

const CSV_TITLES = {
  year_wise_shoreline_labels:          'Year-wise Shoreline Labels',
  erosion_driver_thresholds_master:    'Erosion Driver Thresholds (Master)',
  erosion_driver_yearly_ranges:        'Driver Yearly Ranges',
  erosion_driver_yearly_effect_ranges: 'Driver Yearly Effect Ranges',
}

function DataTable({ csvKey, rows }) {
  const [open, setOpen] = useState(false)
  if (!rows?.length) return null
  const cols = Object.keys(rows[0])
  const cleanKey = csvKey.replace(/\.csv$/, '')
  const title = CSV_TITLES[cleanKey] || cleanKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(s => !s)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-white hover:bg-gray-50 transition-colors border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Table2 className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-gray-900">{title}</p>
            <p className="text-[10px] text-gray-400">{rows.length} rows · {cols.length} columns</p>
          </div>
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${open ? 'bg-ocean-100' : 'bg-gray-100'}`}>
          {open ? <ChevronUp className="w-4 h-4 text-ocean-600" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                  <tr className="border-b border-gray-200">
                    {cols.map(c => (
                      <th key={c} className="py-2.5 px-3 text-left font-semibold text-coastal-500 uppercase tracking-wider whitespace-nowrap text-[10px]">
                        {c.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((row, i) => (
                    <tr key={i} className={`hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                      {cols.map(c => {
                        const v = row[c]
                        const vStr = String(v ?? '—').toLowerCase()
                        const isClass = ['erosion', 'stable', 'accretion'].includes(vStr)
                        const isNum = typeof v === 'number'
                        return (
                          <td key={c} className="py-2 px-3 whitespace-nowrap">
                            {isClass ? (
                              <ClassChip cls={vStr} />
                            ) : isNum ? (
                              <span className="font-mono text-gray-700">
                                {Math.abs(v) < 0.001 && v !== 0 ? v.toExponential(2) : Number(v).toFixed(4)}
                              </span>
                            ) : (
                              <span className="text-gray-600">{String(v ?? '—')}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DataTab({ csvOutputs }) {
  const entries = Object.entries(csvOutputs || {})
  if (!entries.length) return <EmptyState message="Run the analysis to generate output data tables." />
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-display font-bold text-gray-900">Output Data Tables</h2>
        <p className="text-xs text-gray-500 mt-0.5">Click each table to expand and inspect the raw analysis outputs.</p>
      </div>
      {entries.map(([k, rows]) => <DataTable key={k} csvKey={k} rows={rows} />)}
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ message }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-amber-400" />
      </div>
      <p className="text-gray-600 max-w-xs mb-4">{message}</p>
      <button onClick={() => navigate('/upload')}
        className="px-5 py-2 bg-ocean-600 text-white rounded-xl text-sm font-medium hover:bg-ocean-700 transition-colors flex items-center gap-2">
        <Upload className="w-4 h-4" /> Go to Upload
      </button>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MeteorologicalThresholdPage() {
  const { data, loading: ctxLoading, clearAnalysis } = useData()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [clearing, setClearing] = useState(false)

  const recognition = useMemo(() => data?.threeClassRecognition || null, [data])
  const thresholds  = useMemo(() => data?.threeClassThresholds  || [], [data])
  const forecasts   = useMemo(() => data?.threeClassForecasts   || null, [data])
  const csvOutputs  = useMemo(() => data?.csvOutputs            || {}, [data])

  const hasData = !!(recognition || thresholds.length)

  // Tab badge counts
  const tabBadge = {
    overview:   recognition ? 1 : 0,
    thresholds: thresholds.length,
    forecasts:  forecasts?.features ? Object.keys(forecasts.features).length : 0,
    data:       Object.keys(csvOutputs).length,
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-coastal-50/60 to-white">
        {/* ── Hero header ── */}
        <div className="bg-white border-b border-coastal-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-start justify-between gap-4">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md">
                    <CloudRain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-display font-extrabold text-gray-900 leading-tight">
                      Meteorological Threshold Analysis
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Three-class shoreline pattern recognition · Wave, Wind &amp; Current drivers
                      {forecasts?.forecastAnchor && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-mono">
                          Anchor: {forecasts.forecastAnchor}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {/* Class legend */}
                <div className="flex items-center gap-3 ml-13 flex-wrap">
                  {Object.values(CLASS).map(c => (
                    <div key={c.label} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
                      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                      {c.label}
                    </div>
                  ))}
                  <span className="text-xs text-gray-400">· NSM threshold: ±1 m</span>
                </div>
              </motion.div>

              {hasData && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                  disabled={clearing}
                  onClick={async () => { setClearing(true); await clearAnalysis(); setClearing(false); navigate('/upload') }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors flex-shrink-0 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {clearing ? 'Clearing…' : 'Clear Results'}
                </motion.button>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1 pb-0">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 -mb-px ${
                    activeTab === tab.id
                      ? 'border-teal-500 text-teal-700 bg-teal-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tabBadge[tab.id] > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.id ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tabBadge[tab.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content area ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {ctxLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-14 h-14 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4" />
              <p className="text-gray-500">Loading analysis results…</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {activeTab === 'overview'   && <OverviewTab   recognition={recognition} />}
                {activeTab === 'thresholds' && <ThresholdsTab thresholds={thresholds} />}
                {activeTab === 'forecasts'  && <ForecastsTab  forecasts={forecasts} />}
                {activeTab === 'data'       && <DataTab       csvOutputs={csvOutputs} />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
