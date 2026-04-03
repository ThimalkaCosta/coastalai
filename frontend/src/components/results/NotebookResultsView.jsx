import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Table2,
  Image,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  FileSpreadsheet,
  Activity,
  Target,
  TrendingUp,
  Shield,
  AlertTriangle,
  MapPin,
  Eye,
  X,
} from 'lucide-react'

/* ── Section metadata for display ── */
const SECTION_META = {
  summary:              { title: 'Summary Statistics',           icon: BarChart3, color: 'blue' },
  shoreline:            { title: 'Shoreline Transect Data',      icon: MapPin,    color: 'emerald' },
  timeSeries:           { title: 'Annual Time Series',           icon: Activity,  color: 'violet' },
  statisticalTests:     { title: 'Mann-Whitney U Tests',         icon: Target,    color: 'teal' },
  thresholds:           { title: 'Ensemble Thresholds',          icon: Target,    color: 'blue' },
  rfModel:              { title: 'Random Forest Model',          icon: BarChart3, color: 'emerald' },
  sarimaDiagnostics:    { title: 'SARIMA Diagnostics',           icon: Activity,  color: 'indigo' },
  sarimaForecasts:      { title: 'SARIMA Forecasts',             icon: TrendingUp,color: 'purple' },
  forecasts:            { title: 'Forecast Analysis',            icon: TrendingUp,color: 'orange' },
  hindcast:             { title: 'Hindcast Validation',          icon: Shield,    color: 'cyan' },
  monteCarlo:           { title: 'Erosion Probability',          icon: AlertTriangle, color: 'red' },
  retreatPredictions:   { title: 'Retreat Predictions',          icon: MapPin,    color: 'amber' },
  transectVulnerability:{ title: 'Transect Vulnerability',       icon: AlertTriangle, color: 'rose' },
  forecastSkill:        { title: 'Forecast Skill Scores',        icon: Target,    color: 'lime' },
  monthlyRisk:          { title: 'Monthly Risk Timeline',        icon: Activity,  color: 'pink' },
  horizonFeatures:      { title: 'Horizon Features',             icon: TrendingUp,color: 'sky' },
  erosionPredictions:   { title: 'Erosion Predictions',          icon: AlertTriangle, color: 'red' },
}

const FIGURE_META = {
  'transect_profile.png':          'Transect Profile',
  'env_timeseries.png':            'Environmental Time Series',
  'boxplot_comparison.png':        'Boxplot Comparison',
  'ensemble_thresholds.png':       'Ensemble Thresholds',
  'per_factor_thresholds.png':     'Per-Factor Thresholds',
  'factor_exceedance_rates.png':   'Factor Exceedance Rates',
  'stl_decomposition.png':        'STL Decomposition',
  'sarima_forecasts.png':          'SARIMA Forecasts',
  'hindcast_validation.png':       'Hindcast Validation',
  'transect_vulnerability.png':    'Transect Vulnerability',
  'forecast_skill.png':            'Forecast Skill',
  'forecast_dashboard_advanced.png': 'Forecast Dashboard',
  'rf_importance.png':             'Random Forest Importance',
  'pair_logistic.png':             'Pair-wise Logistic',
}

const CSV_META = {
  'erosion_thresholds_master.csv':      'Erosion Thresholds Master',
  'per_factor_threshold_rules.csv':     'Per-Factor Threshold Rules',
  'processed_annual_features.csv':      'Processed Annual Features',
  'monthly_wave.csv':                   'Monthly Wave Data',
  'monthly_wind.csv':                   'Monthly Wind Data',
  'monthly_current.csv':                'Monthly Current Data',
  'monthly_combined_forcing.csv':       'Monthly Combined Forcing',
  'sarima_model_diagnostics.csv':       'SARIMA Model Diagnostics',
  'erosion_event_diagnosis.csv':        'Erosion Event Diagnosis',
  'erosion_forecast_features.csv':      'Erosion Forecast Features',
  'erosion_forecast_horizons.csv':      'Erosion Forecast Horizons',
  'erosion_forecast_monthly.csv':       'Erosion Forecast Monthly',
  'yearwise_shoreline_classification.csv': 'Yearly Shoreline Classification',
  'factor_threshold_summary.csv':       'Factor Threshold Summary',
  'multi_method_thresholds.csv':        'Multi-Method Thresholds',
  'retreat_predictions.csv':            'Retreat Predictions',
  'transect_vulnerability_scores.csv':  'Transect Vulnerability Scores',
}

const fmt = (v, digits = 4) => {
  if (v == null || v === '') return '--'
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return v.toLocaleString()
    return Math.abs(v) < 0.001 ? v.toExponential(2) : v.toFixed(digits)
  }
  return String(v)
}

/* ── DataTable sub-component ── */
function ResultTable({ data, maxRows = 100 }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 25

  if (!Array.isArray(data) || data.length === 0) return null
  const columns = Object.keys(data[0])

  const filtered = searchTerm
    ? data.filter(row =>
        columns.some(col => String(row[col] ?? '').toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : data

  const totalPages = Math.ceil(Math.min(filtered.length, maxRows) / pageSize)
  const pageData = filtered.slice(currentPage * pageSize, Math.min((currentPage + 1) * pageSize, maxRows))

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 bg-coastal-50/50">
        <span className="text-xs text-coastal-500">{filtered.length} rows × {columns.length} columns</span>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-coastal-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(0) }}
            className="pl-8 pr-3 py-1.5 text-xs border border-coastal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-coastal-100/80 border-b-2 border-coastal-200">
              {columns.map(col => (
                <th key={col} className="py-2.5 px-3 text-left font-semibold text-coastal-600 uppercase tracking-wider whitespace-nowrap">
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageData.map((row, i) => (
              <tr key={i} className={`hover:bg-blue-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                {columns.map(col => (
                  <td key={col} className="py-2 px-3 font-mono whitespace-nowrap">
                    {fmt(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-2 border-t border-coastal-100">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="px-2 py-1 text-xs rounded border border-coastal-200 hover:bg-coastal-50 disabled:opacity-40"
          >←</button>
          <span className="text-xs text-coastal-500">Page {currentPage + 1} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="px-2 py-1 text-xs rounded border border-coastal-200 hover:bg-coastal-50 disabled:opacity-40"
          >→</button>
        </div>
      )}
    </div>
  )
}

/* ── Summary Card ── */
function SummaryView({ data }) {
  if (!data || typeof data !== 'object') return null
  const entries = Object.entries(data).filter(([, v]) => v != null)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
      {entries.map(([key, val]) => (
        <div key={key} className="bg-white rounded-xl border border-coastal-200 p-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-coastal-400 mb-1">
            {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
          </p>
          <p className="text-sm font-bold text-coastal-900">
            {Array.isArray(val) ? val.join(', ') : fmt(val)}
          </p>
        </div>
      ))}
    </div>
  )
}

/* ── Object/Dict Viewer ── */
function ObjectView({ data, depth = 0 }) {
  if (data == null) return <span className="text-coastal-400 text-xs">null</span>
  if (Array.isArray(data)) {
    if (data.length > 0 && typeof data[0] === 'object') {
      return <ResultTable data={data} />
    }
    return <span className="text-xs font-mono text-coastal-700">[{data.map(v => fmt(v)).join(', ')}]</span>
  }
  if (typeof data === 'object') {
    // Check if it's a nested object with "data" array (like transectVulnerability)
    if (data.data && Array.isArray(data.data)) {
      return (
        <div>
          {Object.entries(data).filter(([k]) => k !== 'data').map(([k, v]) => (
            <div key={k} className="mb-2">
              <span className="text-xs font-semibold text-coastal-600">{k}: </span>
              <ObjectView data={v} depth={depth + 1} />
            </div>
          ))}
          <ResultTable data={data.data} />
        </div>
      )
    }
    // Check if all values are simple (summary-like)
    const entries = Object.entries(data)
    const allSimple = entries.every(([, v]) => typeof v !== 'object' || v == null || Array.isArray(v) && v.every(x => typeof x !== 'object'))
    if (allSimple && depth === 0) {
      return <SummaryView data={data} />
    }
    // Nested object: render as expandable sections
    return (
      <div className={`space-y-2 ${depth > 0 ? 'ml-4 pl-3 border-l-2 border-coastal-100' : 'p-4'}`}>
        {entries.map(([key, val]) => (
          <NestedSection key={key} label={key} data={val} depth={depth + 1} />
        ))}
      </div>
    )
  }
  return <span className="text-xs font-mono text-coastal-700">{fmt(data)}</span>
}

/* ── Collapsible Nested Section ── */
function NestedSection({ label, data, depth }) {
  const [open, setOpen] = useState(depth <= 1)
  const isComplex = typeof data === 'object' && data != null
  const preview = !isComplex ? fmt(data) : Array.isArray(data) ? `[${data.length} items]` : `{${Object.keys(data).length} keys}`

  return (
    <div className="rounded-lg border border-coastal-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-coastal-50/50 hover:bg-coastal-100/60 transition-colors text-left"
      >
        <span className="text-xs font-semibold text-coastal-700">{label.replace(/_/g, ' ')}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-coastal-400 font-mono">{preview}</span>
          {isComplex && (open ? <ChevronUp className="w-3.5 h-3.5 text-coastal-400" /> : <ChevronDown className="w-3.5 h-3.5 text-coastal-400" />)}
        </div>
      </button>
      {open && isComplex && (
        <div className="border-t border-coastal-100">
          <ObjectView data={data} depth={depth} />
        </div>
      )}
    </div>
  )
}

/* ── Image Lightbox ── */
function ImageLightbox({ src, alt, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
        <X className="w-6 h-6 text-white" />
      </button>
      <img src={src} alt={alt} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════ */
export default function NotebookResultsView({ analysisData }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedSections, setExpandedSections] = useState({})
  const [lightboxImg, setLightboxImg] = useState(null)

  // Extract data sections
  const figures = useMemo(() => analysisData?.figures || {}, [analysisData])
  const csvOutputs = useMemo(() => analysisData?.csvOutputs || {}, [analysisData])

  // Build sections list from analysisData, excluding meta/figures/csvOutputs
  const dataSections = useMemo(() => {
    if (!analysisData) return []
    const skip = new Set(['_meta', 'figures', 'csvOutputs', 'isLegacyFormat'])
    return Object.entries(analysisData)
      .filter(([key, val]) => !skip.has(key) && val != null && (typeof val !== 'object' || Object.keys(val).length > 0 || (Array.isArray(val) && val.length > 0)))
      .map(([key, val]) => ({
        key,
        data: val,
        meta: SECTION_META[key] || { title: key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' '), icon: Activity, color: 'gray' },
        isArray: Array.isArray(val),
        isEmpty: Array.isArray(val) ? val.length === 0 : typeof val === 'object' ? Object.keys(val).length === 0 : val == null,
      }))
      .filter(s => !s.isEmpty)
  }, [analysisData])

  const figureList = useMemo(() => Object.entries(figures), [figures])
  const csvList = useMemo(() => Object.entries(csvOutputs), [csvOutputs])

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'data', label: 'Analysis Data', icon: Table2, count: dataSections.length },
    { id: 'figures', label: 'Figures', icon: Image, count: figureList.length },
    { id: 'csv', label: 'CSV Outputs', icon: FileSpreadsheet, count: csvList.length },
  ]

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-coastal-200 bg-white/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-ocean-500 to-primary-600 text-white shadow-lg shadow-ocean-500/20'
                    : 'text-coastal-600 hover:bg-coastal-100 hover:text-coastal-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count != null && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-coastal-100 text-coastal-500'
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Summary Cards */}
              {analysisData?.summary && (
                <div className="mb-8">
                  <h3 className="text-lg font-display font-bold text-coastal-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    Analysis Summary
                  </h3>
                  <SummaryView data={analysisData.summary} />
                </div>
              )}

              {/* Quick Stats Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="card p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Table2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-900">{dataSections.length}</p>
                      <p className="text-xs text-blue-600 font-medium">Data Sections</p>
                    </div>
                  </div>
                </div>
                <div className="card p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Image className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-900">{figureList.length}</p>
                      <p className="text-xs text-emerald-600 font-medium">Generated Figures</p>
                    </div>
                  </div>
                </div>
                <div className="card p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-violet-900">{csvList.length}</p>
                      <p className="text-xs text-violet-600 font-medium">CSV Output Files</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Figures Preview */}
              {figureList.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-display font-bold text-coastal-900 mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5 text-emerald-500" />
                    Key Visualizations
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {figureList.slice(0, 6).map(([fname, b64]) => (
                      <motion.div
                        key={fname}
                        whileHover={{ scale: 1.02 }}
                        className="card overflow-hidden cursor-pointer group"
                        onClick={() => setLightboxImg({ src: `data:image/png;base64,${b64}`, alt: fname })}
                      >
                        <div className="relative">
                          <img
                            src={`data:image/png;base64,${b64}`}
                            alt={FIGURE_META[fname] || fname}
                            className="w-full h-40 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <div className="px-3 py-2 bg-white">
                          <p className="text-xs font-semibold text-coastal-700 truncate">{FIGURE_META[fname] || fname}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Data Sections Preview */}
              {analysisData?.thresholds?.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-display font-bold text-coastal-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    Ensemble Thresholds
                  </h3>
                  <div className="card overflow-hidden">
                    <ResultTable data={analysisData.thresholds} />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── ANALYSIS DATA TAB ── */}
          {activeTab === 'data' && (
            <motion.div key="data" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {dataSections.map(({ key, data, meta }) => {
                const Icon = meta.icon
                const isExpanded = expandedSections[key]
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card overflow-hidden"
                  >
                    <button
                      onClick={() => toggleSection(key)}
                      className={`w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r ${
                        isExpanded ? `from-${meta.color}-600 to-${meta.color}-700` : 'from-coastal-50 to-coastal-100/80'
                      } transition-all`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isExpanded ? 'bg-white/20' : `bg-${meta.color}-100`
                        }`}>
                          <Icon className={`w-4 h-4 ${isExpanded ? 'text-white' : `text-${meta.color}-600`}`} />
                        </div>
                        <span className={`font-display font-bold text-sm ${isExpanded ? 'text-white' : 'text-coastal-800'}`}>
                          {meta.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          isExpanded ? 'bg-white/20 text-white' : 'bg-coastal-200 text-coastal-500'
                        }`}>
                          {Array.isArray(data) ? `${data.length} rows` : typeof data === 'object' ? `${Object.keys(data).length} keys` : 'value'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className={`w-4 h-4 ${isExpanded ? 'text-white' : 'text-coastal-400'}`} />
                        ) : (
                          <ChevronDown className={`w-4 h-4 ${isExpanded ? 'text-white' : 'text-coastal-400'}`} />
                        )}
                      </div>
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <ObjectView data={data} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {/* ── FIGURES TAB ── */}
          {activeTab === 'figures' && (
            <motion.div key="figures" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {figureList.length === 0 ? (
                <div className="text-center py-16">
                  <Image className="w-12 h-12 text-coastal-300 mx-auto mb-3" />
                  <p className="text-coastal-500">No figures generated yet</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  {figureList.map(([fname, b64]) => (
                    <motion.div
                      key={fname}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="card overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-coastal-600 to-coastal-700 px-4 py-2.5 flex items-center justify-between">
                        <h4 className="text-white font-semibold text-sm truncate">
                          {FIGURE_META[fname] || fname.replace(/_/g, ' ').replace('.png', '')}
                        </h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setLightboxImg({ src: `data:image/png;base64,${b64}`, alt: fname })}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            title="View full size"
                          >
                            <Eye className="w-4 h-4 text-white" />
                          </button>
                          <a
                            href={`data:image/png;base64,${b64}`}
                            download={fname}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4 text-white" />
                          </a>
                        </div>
                      </div>
                      <div
                        className="p-3 bg-white cursor-pointer"
                        onClick={() => setLightboxImg({ src: `data:image/png;base64,${b64}`, alt: fname })}
                      >
                        <img
                          src={`data:image/png;base64,${b64}`}
                          alt={FIGURE_META[fname] || fname}
                          className="w-full rounded-lg border border-coastal-100"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── CSV OUTPUTS TAB ── */}
          {activeTab === 'csv' && (
            <motion.div key="csv" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {csvList.length === 0 ? (
                <div className="text-center py-16">
                  <FileSpreadsheet className="w-12 h-12 text-coastal-300 mx-auto mb-3" />
                  <p className="text-coastal-500">No CSV output files generated yet</p>
                </div>
              ) : (
                csvList.map(([fname, rows]) => {
                  const isExpanded = expandedSections[`csv_${fname}`]
                  return (
                    <div key={fname} className="card overflow-hidden">
                      <button
                        onClick={() => toggleSection(`csv_${fname}`)}
                        className="w-full flex items-center justify-between px-5 py-3 bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                            <FileSpreadsheet className="w-4 h-4 text-violet-600" />
                          </div>
                          <div className="text-left">
                            <span className="font-semibold text-sm text-coastal-800 block">
                              {CSV_META[fname] || fname.replace(/_/g, ' ').replace('.csv', '')}
                            </span>
                            <span className="text-[10px] text-coastal-400 font-mono">{fname}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-semibold">
                            {Array.isArray(rows) ? `${rows.length} rows` : '--'}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-coastal-400" /> : <ChevronDown className="w-4 h-4 text-coastal-400" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && Array.isArray(rows) && rows.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-coastal-100"
                          >
                            <ResultTable data={rows} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImg && (
          <ImageLightbox
            src={lightboxImg.src}
            alt={lightboxImg.alt}
            onClose={() => setLightboxImg(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
