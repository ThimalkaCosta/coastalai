import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Activity,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Play,
  Image,
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import { useData } from '../context/DataContext'

const CLASS_CONFIG = {
  erosion: {
    label: 'Erosion',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    bar: 'bg-red-500',
    icon: TrendingDown,
  },
  stable: {
    label: 'Stable',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    bar: 'bg-amber-400',
    icon: Minus,
  },
  accretion: {
    label: 'Accretion',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    bar: 'bg-emerald-500',
    icon: TrendingUp,
  },
}

const SCREENSHOTS = [
  {
    src: '/output.png',
    title: 'Shoreline Position Analysis',
    caption: 'Annual shoreline position changes across all transects derived from satellite imagery',
  },
  {
    src: '/output2.png',
    title: 'Erosion Classification Map',
    caption: 'Spatial distribution of erosion, stable, and accretion zones along the coastline',
  },
]

const SECTION11_ANNUAL_TABLE = [
  { year: 2013, interval: '2012-2013', trimMean: -2.678, hlMedian: -2.655, ciLow: -3.963, ciHigh: -1.387, wilcoxonP: 0, effectR: -0.412, signif: true, cls: 'erosion' },
  { year: 2014, interval: '2013-2014', trimMean: -6.502, hlMedian: -6.155, ciLow: -7.782, ciHigh: -5.138, wilcoxonP: 0, effectR: -0.743, signif: true, cls: 'erosion' },
  { year: 2015, interval: '2014-2015', trimMean: 4.247, hlMedian: 4.22, ciLow: 3.429, ciHigh: 5.092, wilcoxonP: 0, effectR: 0.742, signif: true, cls: 'accretion' },
  { year: 2016, interval: '2015-2016', trimMean: -3.301, hlMedian: -3.275, ciLow: -3.914, ciHigh: -2.625, wilcoxonP: 0, effectR: -0.701, signif: true, cls: 'erosion' },
  { year: 2017, interval: '2016-2017', trimMean: 3.72, hlMedian: 3.765, ciLow: 2.66, ciHigh: 4.904, wilcoxonP: 0, effectR: 0.603, signif: true, cls: 'accretion' },
  { year: 2018, interval: '2017-2018', trimMean: 1.871, hlMedian: 1.82, ciLow: 0.899, ciHigh: 2.703, wilcoxonP: 0.001, effectR: 0.316, signif: true, cls: 'accretion' },
  { year: 2019, interval: '2018-2019', trimMean: -4.808, hlMedian: -4.745, ciLow: -5.261, ciHigh: -4.33, wilcoxonP: 0, effectR: -0.986, signif: true, cls: 'erosion' },
  { year: 2020, interval: '2019-2020', trimMean: -3.761, hlMedian: -3.81, ciLow: -4.292, ciHigh: -3.202, wilcoxonP: 0, effectR: -0.851, signif: true, cls: 'erosion' },
  { year: 2021, interval: '2020-2021', trimMean: 1.629, hlMedian: 1.77, ciLow: 0.77, ciHigh: 2.533, wilcoxonP: 0, effectR: 0.357, signif: true, cls: 'accretion' },
  { year: 2022, interval: '2021-2022', trimMean: 1.732, hlMedian: 1.815, ciLow: 0.906, ciHigh: 2.626, wilcoxonP: 0, effectR: 0.375, signif: true, cls: 'accretion' },
  { year: 2023, interval: '2022-2023', trimMean: 0.607, hlMedian: 1.16, ciLow: -0.86, ciHigh: 2.18, wilcoxonP: 0.267, effectR: -0.101, signif: false, cls: 'stable' },
  { year: 2024, interval: '2023-2024', trimMean: -6.901, hlMedian: -6.7, ciLow: -8.449, ciHigh: -5.307, wilcoxonP: 0, effectR: -0.694, signif: true, cls: 'erosion' },
]

export default function ShorelineChangesPage() {
  const { data, loading } = useData()
  const navigate = useNavigate()

  const shoreline = useMemo(() => data?.shoreline || [], [data])

  const stats = useMemo(() => {
    if (!shoreline.length) return null
    const erosion = shoreline.filter((t) => t.epr_class === 'erosion')
    const stable = shoreline.filter((t) => t.epr_class === 'stable')
    const accretion = shoreline.filter((t) => t.epr_class === 'accretion')
    const allEPR = shoreline.map((t) => t.EPR)
    const minEPR = Math.min(...allEPR)
    const maxEPR = Math.max(...allEPR)
    const avgEPR = allEPR.reduce((s, v) => s + v, 0) / allEPR.length
    const avgNSM =
      shoreline.map((t) => t.NSM).reduce((s, v) => s + v, 0) / shoreline.length
    return { erosion, stable, accretion, minEPR, maxEPR, avgEPR, avgNSM }
  }, [shoreline])

  const hasData = shoreline.length > 0

  return (
    <PageTransition>
      <div className="p-6 max-w-7xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-ocean-100 text-ocean-700 ring-1 ring-ocean-200">
                <Activity className="w-3 h-3" />
                Shoreline Analysis
              </span>
            </div>
            <h1 className="text-2xl font-display font-bold text-coastal-900">
              Shoreline Changes
            </h1>
            <p className="text-sm text-coastal-500 mt-1">
              Transect-level erosion, stability, and accretion patterns from historical satellite data
            </p>
          </div>

          {!hasData && (
            <button
              onClick={() => navigate('/analysis')}
              className="flex items-center gap-2 px-4 py-2 bg-ocean-500 hover:bg-ocean-600 text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
            >
              <Play className="w-4 h-4" />
              Run Analysis
            </button>
          )}
        </div>

        {/* ── Screenshot Viewer ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Image className="w-4 h-4 text-coastal-400" />
            <h2 className="text-base font-semibold text-coastal-800">Reference Outputs</h2>
            <span className="text-xs text-coastal-400 ml-auto">
              {SCREENSHOTS.length} images
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {SCREENSHOTS.map((ss, idx) => (
              <motion.div
                key={ss.src}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl border border-coastal-200 shadow-sm overflow-hidden"
              >
                <div className="bg-coastal-50 px-4 py-3 border-b border-coastal-200">
                  <p className="text-sm font-semibold text-coastal-800">{ss.title}</p>
                </div>
                <div className="p-4">
                  <img
                    src={ss.src}
                    alt={ss.title}
                    className="w-full rounded-xl object-contain max-h-72 border border-coastal-100"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                  <div
                    className="hidden w-full h-48 rounded-xl border-2 border-dashed border-coastal-200 items-center justify-center flex-col gap-2"
                  >
                    <BarChart3 className="w-8 h-8 text-coastal-300" />
                    <p className="text-xs text-coastal-400">Image not available</p>
                  </div>
                  <p className="text-xs text-coastal-500 mt-3 leading-relaxed">{ss.caption}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── No Data State ── */}
        {!hasData && !loading && (
          <div className="bg-white rounded-2xl border border-dashed border-coastal-200 p-12 text-center">
            <BarChart3 className="w-12 h-12 text-coastal-300 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-coastal-700 mb-1">No analysis results yet</h3>
            <p className="text-sm text-coastal-500 mb-5">
              Run the notebook analysis to see shoreline change data across all transects.
            </p>
            <button
              onClick={() => navigate('/analysis')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-ocean-500 hover:bg-ocean-600 text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
            >
              <Play className="w-4 h-4" />
              Go to Analysis
            </button>
          </div>
        )}

        {/* ── Live Results ── */}
        {hasData && (
          <>
            {/* Summary Cards */}
            <section>
              <h2 className="text-base font-semibold text-coastal-800 mb-4">Analysis Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['erosion', 'stable', 'accretion'].map((cls) => {
                  const cfg = CLASS_CONFIG[cls]
                  const Icon = cfg.icon
                  const count = stats?.[cls]?.length ?? 0
                  const pct = shoreline.length ? ((count / shoreline.length) * 100).toFixed(1) : '0'
                  return (
                    <motion.div
                      key={cls}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`${cfg.bg} ${cfg.border} border rounded-2xl p-4`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                        <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className={`text-2xl font-bold ${cfg.color}`}>{count}</p>
                      <p className="text-xs text-coastal-500 mt-0.5">{pct}% of transects</p>
                    </motion.div>
                  )
                })}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-ocean-50 border border-ocean-200 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-ocean-600" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-ocean-600">
                      Total
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-ocean-700">{shoreline.length}</p>
                  <p className="text-xs text-coastal-500 mt-0.5">transects analysed</p>
                </motion.div>
              </div>
            </section>

            {/* EPR Key Stats */}
            <section>
              <h2 className="text-base font-semibold text-coastal-800 mb-4">Change Rate Overview (EPR)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Fastest Erosion', value: stats?.minEPR?.toFixed(2) + ' m/yr', sub: 'Most negative EPR', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                  { label: 'Average Rate', value: (stats?.avgEPR ?? 0).toFixed(2) + ' m/yr', sub: 'Mean EPR across transects', icon: Minus, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                  { label: 'Highest Accretion', value: stats?.maxEPR?.toFixed(2) + ' m/yr', sub: 'Most positive EPR', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className={`${item.bg} ${item.border} border rounded-2xl p-4`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        <span className={`text-xs font-semibold ${item.color}`}>{item.label}</span>
                      </div>
                      <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                      <p className="text-xs text-coastal-400 mt-0.5">{item.sub}</p>
                    </motion.div>
                  )
                })}
              </div>
            </section>

            {/* Section 1.1 Annual Classification Table */}
            <section className="bg-white rounded-2xl border border-coastal-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-coastal-100">
                <h2 className="text-sm font-semibold text-coastal-800">
                  Section 1.1 - DSAS Year-Pair Transect Files to 3-Class Annual Shoreline Labels
                </h2>
                <p className="text-xs text-coastal-400 mt-0.5">
                  Year-wise shoreline change classification using trimmed mean, Hodges-Lehmann median, bootstrap CI, and Wilcoxon test
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-coastal-50 text-coastal-600 text-xs uppercase tracking-wide">
                      <th className="px-4 py-3 text-left font-semibold">Year</th>
                      <th className="px-4 py-3 text-left font-semibold">Interval</th>
                      <th className="px-4 py-3 text-right font-semibold">TrimMean (m)</th>
                      <th className="px-4 py-3 text-right font-semibold">HLMedian (m)</th>
                      <th className="px-4 py-3 text-right font-semibold">CI Low</th>
                      <th className="px-4 py-3 text-right font-semibold">CI High</th>
                      <th className="px-4 py-3 text-center font-semibold">Signif</th>
                      <th className="px-4 py-3 text-center font-semibold">Class</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-coastal-100">
                    {SECTION11_ANNUAL_TABLE.map((row) => {
                      const cfg = CLASS_CONFIG[row.cls] || CLASS_CONFIG.stable
                      const Icon = cfg.icon
                      return (
                        <tr key={row.interval} className="hover:bg-coastal-50 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-coastal-700">{row.year}</td>
                          <td className="px-4 py-2.5 text-coastal-600">{row.interval}</td>
                          <td className={`px-4 py-2.5 text-right font-mono tabular-nums ${row.trimMean < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {row.trimMean >= 0 ? '+' : ''}{row.trimMean.toFixed(3)}
                          </td>
                          <td className={`px-4 py-2.5 text-right font-mono tabular-nums ${row.hlMedian < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {row.hlMedian >= 0 ? '+' : ''}{row.hlMedian.toFixed(3)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums text-coastal-600">{row.ciLow.toFixed(3)}</td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums text-coastal-600">{row.ciHigh.toFixed(3)}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${row.signif ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-coastal-100 text-coastal-600 border-coastal-200'}`}>
                              {row.signif ? 'True' : 'False'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                              <Icon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

          </>
        )}

        {/* Bottom transect profile image from notebook output */}
        <section className="bg-white rounded-2xl border border-coastal-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-coastal-100">
            <h2 className="text-sm font-semibold text-coastal-800">
              Latest Interval Transect Profile
            </h2>
            <p className="text-xs text-coastal-400 mt-0.5">
              Notebook output figure for transect-level shoreline change (latest interval)
            </p>
          </div>
          <div className="p-4">
            <img
              src="/transect_profile.png"
              alt="Transect-level shoreline change profile"
              className="w-full rounded-xl border border-coastal-100"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            <div className="hidden w-full h-64 rounded-xl border-2 border-dashed border-coastal-200 items-center justify-center flex-col gap-2">
              <BarChart3 className="w-8 h-8 text-coastal-300" />
              <p className="text-xs text-coastal-400">Transect profile image not available</p>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
