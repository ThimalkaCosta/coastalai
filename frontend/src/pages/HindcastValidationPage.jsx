import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Target,
  BarChart3,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import PageTransition from '../components/common/PageTransition'
import StatCard from '../components/common/StatCard'
import { useData } from '../context/DataContext'

const fmt = (v, d = 2) => (v != null && !isNaN(v) ? Number(v).toFixed(d) : '--')
const pct = v => (v != null ? `${(v * 100).toFixed(1)}%` : '--')

const METRIC_LABELS = {
  accuracy: { label: 'Accuracy', desc: 'Overall correct predictions' },
  pod: { label: 'Probability of Detection', desc: 'True positive rate (sensitivity)' },
  far: { label: 'False Alarm Rate', desc: 'False positive rate – lower is better' },
  csi: { label: 'Critical Success Index', desc: 'Combined hit/miss/false-alarm score' },
}

export default function HindcastValidationPage() {
  const { data, loading } = useData()

  const hindcast = useMemo(() => data?.hindcast || {}, [data])
  const results = useMemo(() => hindcast.results || [], [hindcast])
  const metrics = useMemo(() => hindcast.metrics || {}, [hindcast])

  const hasData = results.length > 0 || Object.keys(metrics).length > 0

  // Confusion matrix values
  const confMatrix = useMemo(() => ({
    hits: metrics.hits ?? 0,
    misses: metrics.misses ?? 0,
    falseAlarms: metrics.falseAlarms ?? metrics.false_alarms ?? 0,
    correctRejections: metrics.correctRejections ?? metrics.correct_rejections ?? 0,
  }), [metrics])

  // Chart data for year-by-year results
  const yearChartData = useMemo(() => {
    return results.map(r => ({
      year: r.year,
      actual: r.actual ?? r.observed,
      predicted: r.predicted ?? r.forecast,
      correct: (r.actual ?? r.observed) === (r.predicted ?? r.forecast) ? 1 : 0,
    }))
  }, [results])

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-coastal-50 to-white bg-mesh-1">
        {/* Header */}
        <section className="pt-8 sm:pt-10 pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link to="/forecast" className="inline-flex items-center gap-1.5 text-sm text-coastal-500 hover:text-ocean-600 transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" /> Back to Forecast Overview
            </Link>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
              <div className="page-badge bg-indigo-50 text-indigo-600 border-indigo-100 mb-4">
                <Target className="w-3.5 h-3.5" />
                Hindcast Validation
              </div>
              <h1 className="section-title mb-3">Model Hindcast Performance</h1>
              <p className="section-subtitle">
                Validation of erosion predictions against historical observations.
                Performance metrics include accuracy, probability of detection, false alarm rate,
                and critical success index.
              </p>
            </motion.div>
          </div>
        </section>

        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          </div>
        ) : !hasData ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-coastal-900 mb-2">No Hindcast Data</h3>
            <p className="text-coastal-600">Run the analysis pipeline first.</p>
          </div>
        ) : (
          <>
            {/* Metric Cards */}
            <section className="pb-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Accuracy" value={pct(metrics.accuracy)} subtitle="correct classifications" icon={CheckCircle2} delay={0.1} />
                  <StatCard title="Detection Rate" value={pct(metrics.pod)} subtitle="prob. of detection" icon={Target} delay={0.15} />
                  <StatCard title="False Alarm Rate" value={pct(metrics.far)} subtitle="lower is better" icon={AlertTriangle} delay={0.2} />
                  <StatCard title="CSI Score" value={pct(metrics.csi)} subtitle="critical success index" icon={Activity} delay={0.25} />
                </div>
              </div>
            </section>

            {/* Confusion Matrix + Metrics Detail */}
            <section className="pb-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-6">
                {/* Confusion Matrix */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3">
                    <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Confusion Matrix
                    </h3>
                    <p className="text-indigo-100 text-xs mt-0.5">
                      {metrics.totalYears ?? metrics.total_years ?? results.length} validation years
                    </p>
                  </div>
                  <div className="p-5">
                    <div className="max-w-xs mx-auto">
                      {/* Header labels */}
                      <div className="grid grid-cols-3 gap-1 mb-1">
                        <div />
                        <div className="text-center text-[10px] font-bold text-coastal-600 uppercase">Predicted Erosion</div>
                        <div className="text-center text-[10px] font-bold text-coastal-600 uppercase">Predicted No</div>
                      </div>
                      {/* Actual Erosion row */}
                      <div className="grid grid-cols-3 gap-1 mb-1">
                        <div className="flex items-center justify-end pr-2 text-[10px] font-bold text-coastal-600 uppercase">Actual Erosion</div>
                        <div className="bg-green-100 border-2 border-green-400 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-green-700">{confMatrix.hits}</div>
                          <div className="text-[10px] text-green-600 font-medium">Hits</div>
                        </div>
                        <div className="bg-red-100 border-2 border-red-400 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-red-700">{confMatrix.misses}</div>
                          <div className="text-[10px] text-red-600 font-medium">Misses</div>
                        </div>
                      </div>
                      {/* Actual No row */}
                      <div className="grid grid-cols-3 gap-1">
                        <div className="flex items-center justify-end pr-2 text-[10px] font-bold text-coastal-600 uppercase">Actual No</div>
                        <div className="bg-orange-100 border-2 border-orange-400 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-orange-700">{confMatrix.falseAlarms}</div>
                          <div className="text-[10px] text-orange-600 font-medium">False Alarms</div>
                        </div>
                        <div className="bg-blue-100 border-2 border-blue-400 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-blue-700">{confMatrix.correctRejections}</div>
                          <div className="text-[10px] text-blue-600 font-medium">Correct Rej.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Metrics Detail */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-3">
                    <h3 className="font-display font-bold text-white text-base">Performance Metrics</h3>
                  </div>
                  <div className="p-5 space-y-3">
                    {Object.entries(METRIC_LABELS).map(([key, { label, desc }]) => {
                      const val = metrics[key]
                      const isGood = key === 'far' ? (val != null && val < 0.3) : (val != null && val > 0.7)
                      return (
                        <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                          <div>
                            <div className="text-sm font-semibold text-coastal-800">{label}</div>
                            <div className="text-xs text-coastal-500">{desc}</div>
                          </div>
                          <div className={`text-lg font-bold ${isGood ? 'text-green-600' : 'text-amber-600'}`}>
                            {pct(val)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Year-by-Year Validation */}
            {results.length > 0 && (
              <section className="pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-700 to-gray-800 px-5 py-3">
                      <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Year-by-Year Validation Results
                      </h3>
                    </div>
                    <div className="p-5">
                      <div className="h-56">
                        <ResponsiveContainer>
                          <BarChart data={yearChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 1]} ticks={[0, 1]} tickFormatter={v => v === 1 ? 'Erosion' : 'No'} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v, name) => [v === 1 ? 'Erosion' : 'No Erosion', name]} />
                            <Legend />
                            <Bar dataKey="actual" name="Observed" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                            <Bar dataKey="predicted" name="Predicted" radius={[4, 4, 0, 0]} barSize={12}>
                              {yearChartData.map((d, i) => (
                                <Cell key={i} fill={d.correct ? '#22c55e' : '#ef4444'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Table view */}
                    <div className="border-t border-coastal-200 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-coastal-50/80 border-b-2 border-coastal-200">
                            {Object.keys(results[0] || {}).map(col => (
                              <th key={col} className="py-3 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">
                                {col.replace(/_/g, ' ')}
                              </th>
                            ))}
                            <th className="py-3 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {results.map((row, i) => {
                            const actual = row.actual ?? row.observed
                            const predicted = row.predicted ?? row.forecast
                            const correct = actual === predicted
                            return (
                              <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-indigo-50 transition-colors`}>
                                {Object.values(row).map((val, j) => (
                                  <td key={j} className="py-2.5 px-3 text-center text-xs font-mono">
                                    {typeof val === 'number' ? fmt(val, 3) : String(val ?? '--')}
                                  </td>
                                ))}
                                <td className="py-2.5 px-3 text-center">
                                  {correct ? (
                                    <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-red-600 text-xs font-semibold">
                                      <AlertTriangle className="w-3.5 h-3.5" /> Missed
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </PageTransition>
  )
}
