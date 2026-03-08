import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, Map, BarChart2, Download, FileText,
  ChevronDown, AlertTriangle, CheckCircle, RefreshCw,
  Calendar, Layers, ArrowUpRight, ArrowDownRight,
  Play, Loader2,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const MODELS = [
  { id: 'Ensemble', label: 'Ensemble (Recommended)', desc: 'Average of all models — most robust' },
  { id: 'LinearRegression', label: 'Linear Regression', desc: 'Constant rate assumption' },
  { id: 'WeightedLR', label: 'Weighted Linear', desc: 'Emphasizes recent trends' },
  { id: 'Polynomial_2', label: 'Polynomial (deg 2)', desc: 'Captures acceleration / deceleration' },
  { id: 'Ridge', label: 'Ridge Regression', desc: 'Regularized to prevent overfitting' },
]

export default function LTDashboard() {
  const [years, setYears] = useState([])
  const [selectedYear, setSelectedYear] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  // Run forecast state
  const [showRunPanel, setShowRunPanel] = useState(false)
  const [runYear, setRunYear] = useState(2030)
  const [runModel, setRunModel] = useState('Ensemble')
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState('')

  // Load available years on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/longterm/years`)
      .then(r => r.ok ? r.json() : Promise.reject('Failed'))
      .then(d => {
        setYears(d.years || [])
        if (d.years?.length > 0) setSelectedYear(d.years[0])
      })
      .catch(() => {})
  }, [])

  // Load results when year changes
  useEffect(() => {
    if (!selectedYear) return
    setLoading(true)
    setError('')
    fetch(`${API_BASE}/api/longterm/results/${selectedYear}`)
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load results'))
      .then(d => { setResults(d); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [selectedYear])

  const handleRunForecast = useCallback(async () => {
    setRunning(true)
    setRunError('')
    try {
      const res = await fetch(`${API_BASE}/api/longterm/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetYear: runYear, modelType: runModel }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `${res.status} ${res.statusText}`)
      }
      const data = await res.json()
      setResults(data)
      setSelectedYear(runYear)
      if (!years.includes(runYear)) setYears(prev => [runYear, ...prev].sort((a, b) => b - a))
      setShowRunPanel(false)
    } catch (e) {
      setRunError(e.message)
    } finally {
      setRunning(false)
    }
  }, [runYear, runModel, years])

  const imgUrl = (name) => `${API_BASE}/api/longterm/image/${name}`
  const dlUrl = (name) => `${API_BASE}/api/longterm/download/${name}`

  const summary = results?.summary
  const segments = results?.segments
  const files = results?.files

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart2 size={15} /> },
    { id: 'visualizations', label: 'Visualizations', icon: <TrendingUp size={15} /> },
    { id: 'segments', label: 'Segment Analysis', icon: <Layers size={15} /> },
    { id: 'downloads', label: 'Downloads', icon: <Download size={15} /> },
  ]

  return (
    <div className="lt-root">
      {/* ── Header ── */}
      <header className="lt-header">
        <div className="lt-header-top">
          <div className="lt-header-left">
            <h1 className="lt-title">Long-Term Shoreline Forecasting</h1>
            <p className="lt-subtitle">
              Linear regression-based coastal erosion prediction using historical KML transect data
            </p>
          </div>
          <div className="lt-header-actions">
            {years.length > 0 && (
              <div className="lt-year-select">
                <Calendar size={14} />
                <select
                  value={selectedYear || ''}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                >
                  {years.map(y => <option key={y} value={y}>Forecast {y}</option>)}
                </select>
                <ChevronDown size={14} className="lt-chevron" />
              </div>
            )}
            <button className="lt-run-btn" onClick={() => setShowRunPanel(p => !p)}>
              <Play size={14} /> New Forecast
            </button>
          </div>
        </div>

        {/* Run Forecast Panel */}
        {showRunPanel && (
          <div className="lt-run-panel">
            <div className="lt-run-panel-inner">
              <h3>Generate New Forecast</h3>
              <div className="lt-run-fields">
                <div className="lt-run-field">
                  <label>Target Year</label>
                  <input
                    type="number"
                    min={2026}
                    max={2100}
                    value={runYear}
                    onChange={e => setRunYear(Number(e.target.value))}
                  />
                </div>
                <div className="lt-run-field">
                  <label>Model</label>
                  <select value={runModel} onChange={e => setRunModel(e.target.value)}>
                    {MODELS.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  className="lt-run-submit"
                  onClick={handleRunForecast}
                  disabled={running}
                >
                  {running ? <><Loader2 size={14} className="lt-spin" /> Running…</> : <><RefreshCw size={14} /> Run Forecast</>}
                </button>
              </div>
              {runError && <p className="lt-run-error"><AlertTriangle size={14} /> {runError}</p>}
              <p className="lt-run-hint">
                The notebook will process all historical KML shorelines, train the selected model, and generate forecast outputs. This may take a few minutes.
              </p>
            </div>
          </div>
        )}
      </header>

      {/* ── Loading / Error / Empty ── */}
      {loading && (
        <div className="lt-loading">
          <Loader2 size={28} className="lt-spin" />
          <p>Loading forecast results…</p>
        </div>
      )}

      {error && (
        <div className="lt-error-box">
          <AlertTriangle size={22} />
          <div><h3>Error</h3><p>{error}</p></div>
        </div>
      )}

      {!loading && !error && !results && years.length === 0 && (
        <div className="lt-empty">
          <Map size={48} />
          <h2>No Forecast Results Yet</h2>
          <p>Run the notebook to generate your first long-term shoreline forecast.</p>
          <button className="lt-run-btn" onClick={() => setShowRunPanel(true)}>
            <Play size={14} /> Generate Forecast
          </button>
        </div>
      )}

      {/* ── Results ── */}
      {!loading && !error && results && (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="lt-summary-grid">
              <SummaryCard
                icon={<ArrowDownRight size={20} />}
                label="Total Land Loss"
                value={`${summary.totalLossM2?.toLocaleString(undefined, { maximumFractionDigits: 1 })} m²`}
                sub={`${summary.totalLossHa?.toFixed(4)} ha`}
                accent="red"
              />
              <SummaryCard
                icon={<ArrowUpRight size={20} />}
                label="Total Land Gain"
                value={`${summary.totalGainM2?.toLocaleString(undefined, { maximumFractionDigits: 1 })} m²`}
                sub={`${summary.totalGainHa?.toFixed(4)} ha`}
                accent="green"
              />
              <SummaryCard
                icon={<TrendingUp size={20} />}
                label="Net Change"
                value={`${summary.netChangeM2?.toLocaleString(undefined, { maximumFractionDigits: 1 })} m² ${summary.netDirection}`}
                sub={`Model: ${summary.model || '—'}`}
                accent={summary.netDirection === 'GAIN' ? 'green' : 'red'}
              />
              <SummaryCard
                icon={<Layers size={20} />}
                label="Segments"
                value={`${summary.erosionSegments} erosion · ${summary.accretionSegments} accretion`}
                sub={`${summary.totalSegments} total transect pairs`}
                accent="blue"
              />
            </div>
          )}

          {/* Tabs */}
          <div className="lt-tabs">
            {tabs.map(t => (
              <button
                key={t.id}
                className={`lt-tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="lt-body">
            {activeTab === 'overview' && (
              <OverviewTab summary={summary} segments={segments} year={selectedYear} />
            )}
            {activeTab === 'visualizations' && (
              <VisualizationsTab year={selectedYear} files={files} imgUrl={imgUrl} />
            )}
            {activeTab === 'segments' && (
              <SegmentsTab segments={segments} />
            )}
            {activeTab === 'downloads' && (
              <DownloadsTab year={selectedYear} files={files} dlUrl={dlUrl} />
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ── Sub-components ── */

function SummaryCard({ icon, label, value, sub, accent }) {
  return (
    <div className={`lt-summary-card lt-accent-${accent}`}>
      <div className="lt-summary-icon">{icon}</div>
      <div className="lt-summary-info">
        <span className="lt-summary-label">{label}</span>
        <span className="lt-summary-value">{value}</span>
        {sub && <span className="lt-summary-sub">{sub}</span>}
      </div>
    </div>
  )
}

function OverviewTab({ summary, segments, year }) {
  if (!summary) return <div className="lt-tab-empty">No summary data available for {year}.</div>

  const erosionSegs = segments?.filter(s => s.category === 'Land Loss') || []
  const accretionSegs = segments?.filter(s => s.category === 'Land Gain') || []
  const maxErosion = erosionSegs.length > 0
    ? erosionSegs.reduce((a, b) => Math.abs(a.avgShiftM) > Math.abs(b.avgShiftM) ? a : b)
    : null
  const maxAccretion = accretionSegs.length > 0
    ? accretionSegs.reduce((a, b) => b.avgShiftM > a.avgShiftM ? b : a)
    : null

  return (
    <div className="lt-overview">
      <div className="lt-overview-grid">
        <div className="lt-overview-card">
          <h3><Calendar size={16} /> Forecast Period</h3>
          <p className="lt-overview-big">{summary.baselineDate} → {year}</p>
          <p className="lt-overview-detail">Model: <strong>{summary.model}</strong></p>
        </div>
        <div className="lt-overview-card">
          <h3><AlertTriangle size={16} /> Highest Erosion</h3>
          {maxErosion ? (
            <>
              <p className="lt-overview-big lt-text-red">{maxErosion.avgShiftM.toFixed(2)} m</p>
              <p className="lt-overview-detail">Segment {maxErosion.segment} ({maxErosion.areaM2.toFixed(1)} m²)</p>
            </>
          ) : <p className="lt-overview-detail">No erosion segments</p>}
        </div>
        <div className="lt-overview-card">
          <h3><CheckCircle size={16} /> Highest Accretion</h3>
          {maxAccretion ? (
            <>
              <p className="lt-overview-big lt-text-green">+{maxAccretion.avgShiftM.toFixed(2)} m</p>
              <p className="lt-overview-detail">Segment {maxAccretion.segment} ({maxAccretion.areaM2.toFixed(1)} m²)</p>
            </>
          ) : <p className="lt-overview-detail">No accretion segments</p>}
        </div>
      </div>

      {/* Mini bar chart of segments */}
      {segments && segments.length > 0 && (
        <div className="lt-bar-chart-card">
          <h3>Shoreline Shift per Segment (m)</h3>
          <div className="lt-bar-chart">
            {segments.map((s, i) => {
              const maxAbs = Math.max(...segments.map(x => Math.abs(x.avgShiftM)), 1)
              const pct = (Math.abs(s.avgShiftM) / maxAbs) * 100
              const isGain = s.avgShiftM > 0
              return (
                <div key={i} className="lt-bar-row" title={`${s.segment}: ${s.avgShiftM.toFixed(2)} m`}>
                  <span className="lt-bar-label">{s.segment}</span>
                  <div className="lt-bar-track">
                    <div
                      className={`lt-bar-fill ${isGain ? 'gain' : 'loss'}`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className={`lt-bar-val ${isGain ? 'gain' : 'loss'}`}>
                    {s.avgShiftM > 0 ? '+' : ''}{s.avgShiftM.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function VisualizationsTab({ year, files, imgUrl }) {
  const [lightbox, setLightbox] = useState(null)

  const images = [
    { key: 'trendPlot', file: `trend_forecast_${year}.png`, title: 'Trend Forecast', desc: 'Historical average shoreline distance with forecast projection, confidence ranges, and trend lines.' },
    { key: 'mapPlot', file: `map_forecast_${year}.png`, title: 'Shoreline Map', desc: 'Spatial overlay of the latest observed shoreline vs. forecasted shoreline position.' },
    { key: 'landChangePlot', file: `land_change_${year}.png`, title: 'Land Change Analysis', desc: '4-panel visualization: bar chart, pie chart, cumulative change, and spatial map of erosion/accretion zones.' },
  ]

  const available = images.filter(img => files?.[img.key])

  return (
    <div className="lt-viz">
      {lightbox && (
        <div className="lt-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Full view" onClick={e => e.stopPropagation()} />
          <button className="lt-lightbox-close" onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}
      {available.length === 0 ? (
        <div className="lt-tab-empty">No visualizations generated for {year}.</div>
      ) : (
        <div className="lt-viz-grid">
          {available.map(img => (
            <div key={img.key} className="lt-viz-card">
              <div className="lt-viz-header">
                <h3>{img.title}</h3>
                <p>{img.desc}</p>
              </div>
              <div className="lt-viz-img-wrap" onClick={() => setLightbox(imgUrl(img.file))}>
                <img src={imgUrl(img.file)} alt={img.title} loading="lazy" />
                <div className="lt-viz-zoom-hint">Click to enlarge</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SegmentsTab({ segments }) {
  if (!segments || segments.length === 0) {
    return <div className="lt-tab-empty">No segment data available.</div>
  }

  return (
    <div className="lt-segments">
      <div className="lt-segments-header">
        <h3><Layers size={16} /> Land Change by Segment</h3>
        <p>Each segment is the area between two adjacent transect lines. Negative shift indicates erosion (landward movement).</p>
      </div>
      <div className="lt-table-wrap">
        <table className="lt-table">
          <thead>
            <tr>
              <th>Segment</th>
              <th>Category</th>
              <th>Area (m²)</th>
              <th>Area (ha)</th>
              <th>Avg Shift (m)</th>
              <th>Segment Length (m)</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((s, i) => (
              <tr key={i} className={s.category === 'Land Loss' ? 'lt-row-loss' : 'lt-row-gain'}>
                <td className="lt-cell-segment">{s.segment}</td>
                <td>
                  <span className={`lt-badge ${s.category === 'Land Loss' ? 'loss' : 'gain'}`}>
                    {s.category === 'Land Loss' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                    {s.category}
                  </span>
                </td>
                <td>{s.areaM2.toFixed(2)}</td>
                <td>{s.areaHa.toFixed(4)}</td>
                <td className={s.avgShiftM < 0 ? 'lt-text-red' : 'lt-text-green'}>
                  {s.avgShiftM > 0 ? '+' : ''}{s.avgShiftM.toFixed(2)}
                </td>
                <td>{s.segmentLengthM.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DownloadsTab({ year, files, dlUrl }) {
  const downloads = [
    { key: 'forecastKml', file: `forecast_${year}.kml`, label: 'Forecast KML', desc: 'Forecasted shoreline as KML LineString — open in Google Earth', icon: <Map size={16} /> },
    { key: 'forecastDataCsv', file: `forecast_data_${year}.csv`, label: 'Forecast Data (CSV)', desc: 'Per-transect forecasted distances from baseline', icon: <FileText size={16} /> },
    { key: 'landChangeDetailCsv', file: `land_change_detail_${year}.csv`, label: 'Land Change Detail (CSV)', desc: 'Per-segment erosion/accretion area and shift measurements', icon: <FileText size={16} /> },
    { key: 'landChangeSummaryTxt', file: `land_change_summary_${year}.txt`, label: 'Land Change Summary', desc: 'Text summary of total land loss, gain, and net change', icon: <FileText size={16} /> },
    { key: 'trendPlot', file: `trend_forecast_${year}.png`, label: 'Trend Plot (PNG)', desc: 'Time-series visualization of transect distances', icon: <TrendingUp size={16} /> },
    { key: 'mapPlot', file: `map_forecast_${year}.png`, label: 'Shoreline Map (PNG)', desc: 'Spatial map of observed vs forecasted shoreline', icon: <Map size={16} /> },
    { key: 'landChangePlot', file: `land_change_${year}.png`, label: 'Land Change Chart (PNG)', desc: '4-panel erosion/accretion analysis chart', icon: <BarChart2 size={16} /> },
  ]

  const available = downloads.filter(d => files?.[d.key])

  return (
    <div className="lt-downloads">
      {available.length === 0 ? (
        <div className="lt-tab-empty">No files available for download.</div>
      ) : (
        <div className="lt-dl-grid">
          {available.map(d => (
            <div key={d.key} className="lt-dl-card">
              <div className="lt-dl-icon">{d.icon}</div>
              <div className="lt-dl-info">
                <span className="lt-dl-label">{d.label}</span>
                <span className="lt-dl-desc">{d.desc}</span>
              </div>
              <a href={dlUrl(d.file)} target="_blank" rel="noopener noreferrer" className="lt-dl-btn">
                <Download size={14} /> Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
