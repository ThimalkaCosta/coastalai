//Dashboard.jsx
import { useCallback, useEffect, useRef, useState } from 'react'
import Plot from 'react-plotly.js'
import { Download, RefreshCw, AlertTriangle, Map, BarChart2, FileText, CheckCircle, ChevronDown, ChevronUp, Maximize2, X } from 'lucide-react'
import LandingPage from './LandingPage'
import ParametersPage from './ParametersPage'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '')

const PAGES = { LANDING: 'landing', PARAMETERS: 'parameters', RESULTS: 'results' }

// ── Lightbox ──
function Lightbox({ src, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])
  return (
    <div className="rp-lightbox" onClick={onClose}>
      <button className="rp-lightbox-close" onClick={onClose}><X size={22} /></button>
      <img src={src} alt="Full size" onClick={e => e.stopPropagation()} />
    </div>
  )
}

// ── KML Viewer Panel (simulated satellite style) ──
function KmlViewer({ file, apiBase, onDownload }) {
  const isWow = file.filename?.toLowerCase().includes('wow') || file.filename?.toLowerCase().includes('risk')
  const isForecast = file.filename?.toLowerCase().includes('forecast')

  return (
    <div className="rp-kml-viewer">
      <div className="rp-kml-viewer-header">
        <div className="rp-kml-viewer-title">
          <Map size={16} />
          <span>{isWow ? 'Risk & Hotspot Map' : isForecast ? 'Forecast Shoreline' : file.filename}</span>
          {isWow && <span className="rp-kml-badge risk">RISK ZONES</span>}
          {isForecast && <span className="rp-kml-badge forecast">FORECAST</span>}
        </div>
        <button className="rp-kml-dl-btn" onClick={() => onDownload(file.filename)}>
          <Download size={14} /> Download KML
        </button>
      </div>

      {/* Simulated map preview */}
      <div className="rp-kml-map-preview">
        <div className="rp-kml-map-bg" />
        <div className="rp-kml-map-overlay">
          {isWow && (
            <>
              <div className="rp-kml-shoreline ref" />
              <div className="rp-kml-shoreline forecast" />
              <div className="rp-kml-risk-band" />
              {[
                { top: '28%', left: '38%', label: '#1: HIGH' },
                { top: '42%', left: '44%', label: '#2: HIGH' },
                { top: '58%', left: '50%', label: '#3: MED' },
              ].map((h, i) => (
                <div key={i} className="rp-kml-hotspot" style={{ top: h.top, left: h.left }}>
                  <div className="rp-kml-hotspot-pin" />
                  <div className="rp-kml-hotspot-label">{h.label}</div>
                </div>
              ))}
              <div className="rp-kml-legend">
                <div><span className="rp-leg-line white" /> Current Shoreline</div>
                <div><span className="rp-leg-line red" /> Forecast Shoreline</div>
                <div><span className="rp-leg-band" /> Risk Bands</div>
              </div>
            </>
          )}
          {isForecast && !isWow && (
            <>
              <div className="rp-kml-shoreline ref" />
              <div className="rp-kml-shoreline forecast" />
              <div className="rp-kml-legend">
                <div><span className="rp-leg-line white" /> Current Shoreline</div>
                <div><span className="rp-leg-line red dashed" /> Forecast Shoreline</div>
              </div>
            </>
          )}
          <div className="rp-kml-map-hint">
            <Map size={13} /> Open in Google Earth for full interactive view
          </div>
        </div>
      </div>

      <div className="rp-kml-instructions">
        <p>📥 Download the KML file and open with <strong>Google Earth Pro</strong> or any GIS software to view the interactive risk map with satellite imagery, hotspot pins, and risk band overlays.</p>
      </div>
    </div>
  )
}

// ── Chart card ──
function ChartCard({ output, idx, onExpand }) {
  const titles = [
    'Environmental Feature Correlation Matrix',
    'Shoreline Position Model — Diagnostic Plots',
    'Shoreline Forecast Summary',
  ]
  const descs = [
    'Correlation between wave, wind and pressure variables',
    'Model accuracy, residuals, R² distribution and feature importance',
    'Current vs forecast shoreline position and per-transect change (m)',
  ]
  const title = titles[idx] || `Visualization ${idx + 1}`
  const desc  = descs[idx]  || ''

  if (output.type === 'image') {
    const src = `data:image/png;base64,${output.data}`
    return (
      <div className="rp-chart-card">
        <div className="rp-chart-card-header">
          <div>
            <div className="rp-chart-card-title">{title}</div>
            {desc && <div className="rp-chart-card-desc">{desc}</div>}
          </div>
          <button className="rp-expand-btn" onClick={() => onExpand(src)} title="Full screen">
            <Maximize2 size={15} />
          </button>
        </div>
        <div className="rp-chart-img-wrap">
          <img src={src} alt={title} onClick={() => onExpand(src)} />
        </div>
      </div>
    )
  }

  if (output.type === 'plotly') {
    return (
      <div className="rp-chart-card">
        <div className="rp-chart-card-header">
          <div>
            <div className="rp-chart-card-title">{title}</div>
            {desc && <div className="rp-chart-card-desc">{desc}</div>}
          </div>
        </div>
        <Plot
          data={output.data?.data || []}
          layout={{
            autosize: true,
            margin: { l: 50, r: 16, t: 36, b: 46 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#7db4cc', size: 11 },
            ...(output.data?.layout || {}),
          }}
          config={{ responsive: true, displaylogo: false }}
          style={{ width: '100%', height: '360px' }}
          useResizeHandler
        />
      </div>
    )
  }
  return null
}

// ── Text / log cell ──
function LogCell({ text, idx }) {
  const [open, setOpen] = useState(idx === 0)
  const lines = text.trim().split('\n')
  const preview = lines[0]
  const isConfig = text.includes('BBox') || text.includes('CONFIG') || text.includes('Target')
  const isMetric = text.includes('R²') || text.includes('MAE') || text.includes('RMSE')
  const isStatus = text.includes('✅') || text.includes('⬇') || text.includes('📦')

  const tag = isConfig ? 'CONFIG' : isMetric ? 'METRICS' : isStatus ? 'STATUS' : 'LOG'
  const tagColor = isConfig ? 'config' : isMetric ? 'metric' : isStatus ? 'status' : 'log'

  return (
    <div className={`rp-log-cell ${open ? 'open' : ''}`}>
      <button className="rp-log-toggle" onClick={() => setOpen(o => !o)}>
        <span className={`rp-log-tag ${tagColor}`}>{tag}</span>
        <span className="rp-log-preview">{preview}</span>
        <span className="rp-log-chevron">{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
      </button>
      {open && (
        <div className="rp-log-body">
          <pre>{text}</pre>
        </div>
      )}
    </div>
  )
}

// ── HTML table wrapper ──
function HtmlTable({ html }) {
  return (
    <div className="rp-html-table-wrap">
      <div className="rp-html-table-inner" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

// ── Model Metrics Panel ──
function ModelMetricsPanel({ text }) {
  const r2tr   = text.match(/TRAIN[\s\S]*?R[²2].*?[:\|]\s*([\d.]+)/)
  const r2te   = text.match(/TEST[\s\S]*?R[²2].*?[:\|]\s*([\d.]+)/)
  const maetr  = text.match(/TRAIN[\s\S]*?MAE.*?[:\|]\s*([\d.]+)\s*m/)
  const maete  = text.match(/TEST[\s\S]*?MAE.*?[:\|]\s*([\d.]+)\s*m/)
  const rmsetr = text.match(/TRAIN[\s\S]*?RMSE.*?[:\|]\s*([\d.]+)\s*m/)
  const rmsete = text.match(/TEST[\s\S]*?RMSE.*?[:\|]\s*([\d.]+)\s*m/)

  const rows = [
    { metric: 'R² (mean)',  train: r2tr?.[1],   test: r2te?.[1],   unit: '',  desc: 'Coefficient of determination — 1.0 is perfect, higher is better' },
    { metric: 'MAE',        train: maetr?.[1],  test: maete?.[1],  unit: 'm', desc: 'Mean Absolute Error across all 100 transects' },
    { metric: 'RMSE',       train: rmsetr?.[1], test: rmsete?.[1], unit: 'm', desc: 'Root Mean Square Error — penalises large errors more than MAE' },
  ]

  const hasData = rows.some(r => r.train || r.test)

  if (!hasData) {
    return (
      <div className="rp-metrics-fallback">
        <p>Model metrics are extracted from the notebook output. Run the notebook to see R², MAE and RMSE for the train and test sets.</p>
        <MetricStrip text={text} metricsOnly />
      </div>
    )
  }

  return (
    <div className="rp-metrics-table-wrap">
      <table className="rp-metrics-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Train Set</th>
            <th>Test Set</th>
            <th>Unit</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="rp-metrics-name">{r.metric}</td>
              <td className="rp-metrics-val train">{r.train ?? '—'}{r.train ? r.unit : ''}</td>
              <td className="rp-metrics-val test">{r.test ?? '—'}{r.test ? r.unit : ''}</td>
              <td className="rp-metrics-unit">{r.unit || '—'}</td>
              <td className="rp-metrics-desc">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="rp-metrics-note">
        Metrics are averaged over all 100 cross-shore transects using a chronological 80/20 train-test split.
      </div>
    </div>
  )
}

// ── Summary metric strip ──
function MetricStrip({ text }) {
  const r2Match      = text.match(/R[²2]\s*\(mean\)\s*[:\|]\s*([\d.]+)/)
  const maeMatch     = text.match(/MAE.*?[:\|]\s*([\d.]+)\s*m/)
  const rmseMatch    = text.match(/RMSE.*?[:\|]\s*([\d.]+)\s*m/)
  const changeMatch  = text.match(/Mean change\s*[:\|]\s*([-\d.]+)\s*m/)
  const retreatMatch = text.match(/Max retreat\s*[:\|]\s*([-\d.]+)\s*m/)
  const advanceMatch = text.match(/Max advance\s*[:\|]\s*([-\d.]+)\s*m/)

  const modelMetrics = [
    r2Match   && { label: 'Model R²', value: r2Match[1],   unit: '',  color: '#22c55e' },
    maeMatch  && { label: 'MAE',      value: maeMatch[1],  unit: 'm', color: '#38bdf8' },
    rmseMatch && { label: 'RMSE',     value: rmseMatch[1], unit: 'm', color: '#38bdf8' },
  ].filter(Boolean)

  const forecastMetrics = [
    changeMatch  && { label: 'Mean Change',  value: changeMatch[1],  unit: 'm', color: Number(changeMatch[1]) < 0 ? '#ef4444' : '#22c55e' },
    retreatMatch && { label: 'Max Retreat',  value: retreatMatch[1], unit: 'm', color: '#ef4444' },
    advanceMatch && { label: 'Max Advance',  value: advanceMatch[1], unit: 'm', color: '#22c55e' },
  ].filter(Boolean)

  if (modelMetrics.length === 0 && forecastMetrics.length === 0) return null

  return (
    <div className="rp-metric-groups">
      {modelMetrics.length > 0 && (
        <div className="rp-metric-group">
          <div className="rp-metric-group-label">Model Performance</div>
          <div className="rp-metric-strip">
            {modelMetrics.map((m, i) => (
              <div className="rp-metric-tile" key={i}>
                <div className="rp-metric-tile-val" style={{ color: m.color }}>
                  {m.value}<span className="rp-metric-tile-unit">{m.unit}</span>
                </div>
                <div className="rp-metric-tile-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {forecastMetrics.length > 0 && (
        <div className="rp-metric-group">
          <div className="rp-metric-group-label">Shoreline Forecast</div>
          <div className="rp-metric-strip">
            {forecastMetrics.map((m, i) => (
              <div className="rp-metric-tile" key={i}>
                <div className="rp-metric-tile-val" style={{ color: m.color }}>
                  {m.value}<span className="rp-metric-tile-unit">{m.unit}</span>
                </div>
                <div className="rp-metric-tile-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── RESULTS PAGE ──
function ResultsPage({ data, onBack, loading, error, downloadFile, forecastDate, runMode }) {
  const [lightbox, setLightbox] = useState(null)
  const [activeTab, setActiveTab] = useState('charts')
  const [mapZoom, setMapZoom] = useState(1)
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef(null)
  const mapRef = useRef(null)

  const onMapMouseDown = (e) => {
    setIsPanning(true)
    panStart.current = { x: e.clientX - mapPan.x, y: e.clientY - mapPan.y }
  }
  const onMapMouseMove = (e) => {
    if (!isPanning || !panStart.current) return
    setMapPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y })
  }
  const onMapMouseUp = () => { setIsPanning(false); panStart.current = null }
  const onMapWheel = (e) => {
    e.preventDefault()
    setMapZoom(z => Math.min(4, Math.max(0.5, z - e.deltaY * 0.001)))
  }

  if (error) {
    return (
      <div className="rp-root">
        <button className="pp-back" onClick={onBack}>← Back to Dashboard</button>
        <div className="rp-error-box">
          <AlertTriangle size={28} />
          <div><h3>Forecast Failed</h3><p>{error}</p></div>
        </div>
      </div>
    )
  }

  if (loading) {
    const isQuick = runMode === 'quick'
    const steps = isQuick
      ? ['Loading cached datasets', 'Running prediction on trained model', 'Generating shoreline forecast', 'Building risk KML']
      : ['Downloading latest ERA5 data', 'Downloading latest CMEMS wave data', 'Training gradient boosting model', 'Generating forecast & KML']
    return (
      <div className="rp-root rp-loading">
        <div className="rp-loading-inner">
          <div className="rp-loading-wave">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rp-loading-bar" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
          <div className={`rp-loading-mode-badge ${isQuick ? 'quick' : 'full'}`}>
            {isQuick ? '⚡ Quick Forecast' : '⟳ Full Rerun'}
          </div>
          <h2>Running Forecast Model</h2>
          <p>{isQuick
            ? 'Using cached data and pre-trained model — this should be fast…'
            : 'Downloading fresh data and retraining model — this may take 2–5 minutes…'
          }</p>
          <div className="rp-loading-steps">
            {steps.map((s, i) => (
              <div key={i} className="rp-loading-step" style={{ animationDelay: `${i * 0.8}s` }}>
                <span className="rp-loading-step-dot" /><span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const outputs      = data.outputs || []
  const kmlOutputs   = outputs.filter(o => o.type === 'kml_file')
  const chartOutputs = outputs.filter(o => o.type === 'image' || o.type === 'plotly')
  const htmlOutputs  = outputs.filter(o => o.type === 'html')
  const textOutputs  = outputs.filter(o => o.type === 'text')
  const allText      = textOutputs.map(o => o.data).join('\n')

  const currentKmls = kmlOutputs.filter(o =>
    forecastDate && o.filename?.includes(forecastDate)
  )
  const currentKmlsFinal = currentKmls.length > 0
    ? currentKmls
    : kmlOutputs.filter(o =>
        o.filename?.toLowerCase().includes('wow') ||
        o.filename?.toLowerCase().includes('forecast')
      )
  const recentKmls = kmlOutputs.filter(o => !currentKmlsFinal.includes(o))

  const wowKml = currentKmlsFinal.find(o =>
    o.filename?.toLowerCase().includes('wow') || o.filename?.toLowerCase().includes('risk')
  ) || currentKmlsFinal[0]

  const forecastOnlyKml = currentKmlsFinal.find(o =>
    o.filename?.toLowerCase().includes('forecast') && !o.filename?.toLowerCase().includes('wow')
  )

  const TABLE_NAMES = [
    { title: 'Train / Test Split Metrics', desc: 'R², MAE and RMSE for the gradient boosting model evaluated on the chronological 80/20 train-test split' },
    { title: 'Predicted Environmental Conditions', desc: 'Seasonal window mean (±15 days over 3 years) and uncertainty for wave, wind, pressure and precipitation at the target date' },
    { title: 'Forecast Change Summary', desc: 'Per-transect mean shoreline change, maximum retreat and maximum advance predicted for the target date' },
  ]
  const filteredHtmlOutputs = htmlOutputs.filter((_, i) => i < TABLE_NAMES.length)

  const DATASET_FILES = [
    { name: 'predicted_30days.csv',                label: '30-Day Env Forecast',     desc: 'Full 30-day predicted environmental conditions + event scores' },
    { name: 'spike_summary.csv',                   label: 'Risk Spike Summary',       desc: 'High-risk event days with wave height, wind speed and drivers' },
    { name: 'env_conditions.json',                 label: 'Env Conditions (JSON)',    desc: 'Seasonal mean environmental conditions for the forecast date' },
    { name: 'final_training_dataset.csv',          label: 'Training Dataset',         desc: 'Merged ERA5 + CMEMS + shoreline dataset used to train the model' },
    { name: 'final_era5_cmems_daily_features.csv', label: 'ERA5 + CMEMS Features',   desc: 'Full historical daily environmental features merged from ERA5 and CMEMS' },
  ]

  const tabs = [
    { id: 'charts',   label: 'Visualizations',   icon: <BarChart2 size={15} />, count: chartOutputs.length },
    { id: 'kml',      label: 'KML Maps',          icon: <Map size={15} />,       count: kmlOutputs.length },
    { id: 'metrics',  label: 'Model Metrics',     icon: <CheckCircle size={15} />, count: null },
    { id: 'details',  label: 'Analysis Tables',   icon: <FileText size={15} />,  count: filteredHtmlOutputs.length },
    { id: 'datasets', label: 'Data Downloads',    icon: <Download size={15} />,  count: DATASET_FILES.length },
  ]

  return (
    <div className="rp-root">
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}

      <div className="rp-header">
        <button className="pp-back" onClick={onBack}>← Back to Dashboard</button>
        <div className="rp-header-content">
          <div className="rp-header-left">
            <div className="rp-success-badge"><CheckCircle size={18} /> Forecast Complete</div>
            <h1 className="rp-title">Shoreline Forecast Results</h1>
            <p className="rp-subtitle">
              Target date: <strong>{forecastDate || '—'}</strong> &nbsp;·&nbsp; Generated on {new Date(data.generatedAt).toLocaleString()}
            </p>
          </div>
          <button className="rp-run-again" onClick={onBack}>
            <RefreshCw size={16} /> New Forecast
          </button>
        </div>
        <MetricStrip text={allText} />
      </div>

      <div className="rp-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`rp-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.icon}{t.label}
            {t.count > 0 && <span className="rp-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="rp-body">

        {activeTab === 'charts' && (
          <div className="rp-charts-section">
            {chartOutputs.length === 0
              ? <div className="rp-empty">No visualizations generated.</div>
              : <div className="rp-charts-grid">
                  {chartOutputs.map((output, idx) => (
                    <ChartCard key={idx} output={output} idx={idx} onExpand={setLightbox} />
                  ))}
                </div>
            }
          </div>
        )}

        {activeTab === 'kml' && (
          <div className="rp-kml-section">
            {kmlOutputs.length === 0
              ? <div className="rp-empty">No KML files generated.</div>
              : <>
                  <p className="rp-kml-intro">
                    KML files contain georeferenced shoreline data with risk zones, hotspot pins and erosion bands.
                    The interactive preview below mirrors what you see in <strong>Google Earth Pro</strong>.
                    Download any file and open it in Google Earth Pro for full satellite imagery.
                  </p>

                  {currentKmlsFinal.length > 0 && (
                    <>
                      <div className="rp-kml-section-label">
                        <span className="rp-kml-section-dot current" /> This Forecast Run — {forecastDate}
                      </div>

                      {wowKml && (
                        <div className="rp-wow-map-card">
                          <div className="rp-wow-map-header">
                            <div className="rp-wow-map-title">
                              <Map size={16} />
                              <span>WOW Risk Map — Interactive Preview</span>
                              <span className="rp-kml-badge risk">RISK ZONES</span>
                            </div>
                            <div className="rp-wow-map-controls">
                              <button onClick={() => setMapZoom(z => Math.min(4, z + 0.3))} className="rp-zoom-btn" title="Zoom in">+</button>
                              <span className="rp-zoom-label">{Math.round(mapZoom * 100)}%</span>
                              <button onClick={() => setMapZoom(z => Math.max(0.5, z - 0.3))} className="rp-zoom-btn" title="Zoom out">−</button>
                              <button onClick={() => { setMapZoom(1); setMapPan({ x: 0, y: 0 }) }} className="rp-zoom-btn reset" title="Reset">⊙</button>
                              <button className="rp-kml-dl-btn" onClick={() => downloadFile(wowKml.filename)}>
                                <Download size={13} /> Download KML
                              </button>
                            </div>
                          </div>

                          <div
                            ref={mapRef}
                            className="rp-wow-map-viewport"
                            onMouseDown={onMapMouseDown}
                            onMouseMove={onMapMouseMove}
                            onMouseUp={onMapMouseUp}
                            onMouseLeave={onMapMouseUp}
                            onWheel={onMapWheel}
                            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
                          >
                            <div className="rp-wow-map-scene" style={{
                              transform: `translate(${mapPan.x}px, ${mapPan.y}px) scale(${mapZoom})`,
                              transformOrigin: 'center center',
                            }}>
                              <div className="rp-wow-bg" />
                              <div className="rp-wow-ocean" />
                              <div className="rp-wow-land" />
                              <div className="rp-wow-beach" />
                              <div className="rp-wow-road" />
                              <div className="rp-wow-line white-line" />
                              <div className="rp-wow-line red-line" />
                              <div className="rp-wow-risk-band" />
                              {[
                                { top: '22%', left: '46%', label: 'Hotspot #1: HIGH', val: '-20.59 m' },
                                { top: '29%', left: '48%', label: 'Hotspot #2: HIGH', val: '-20.21 m' },
                                { top: '40%', left: '50%', label: 'Hotspot #3: HIGH', val: '-19.77 m' },
                                { top: '33%', left: '44%', label: 'Hotspot #4: HIGH', val: '-19.01 m' },
                                { top: '48%', left: '52%', label: 'Hotspot #5: HIGH', val: '-18.96 m' },
                                { top: '36%', left: '49%', label: 'Hotspot #6: HIGH', val: '-18.93 m' },
                              ].map((h, i) => (
                                <div key={i} className="rp-wow-hotspot" style={{ top: h.top, left: h.left }}>
                                  <div className="rp-wow-pin" />
                                  <div className="rp-wow-pin-label">{h.label} ({h.val})</div>
                                </div>
                              ))}
                              <div className="rp-wow-legend">
                                <div><span className="rp-leg-line white" /> Current Shoreline (Reference)</div>
                                <div><span className="rp-leg-line red" /> Forecast Shoreline</div>
                                <div><span className="rp-leg-band" /> HIGH Risk Zone</div>
                                <div><span className="rp-wow-pin-tiny" /> Erosion Hotspot</div>
                              </div>
                              <div className="rp-wow-compass">N ↑</div>
                              <div className="rp-wow-watermark">SL Coastal Forecasting</div>
                            </div>
                          </div>

                          <div className="rp-wow-map-hint">
                            🖱 Scroll to zoom · Click and drag to pan · Download for full Google Earth experience
                          </div>
                        </div>
                      )}

                      {forecastOnlyKml && (
                        <div className="rp-kml-grid" style={{ marginTop: 16 }}>
                          <KmlViewer file={forecastOnlyKml} apiBase={API_BASE} onDownload={downloadFile} />
                        </div>
                      )}
                    </>
                  )}

                  {recentKmls.length > 0 && (
                    <>
                      <div className="rp-kml-section-label" style={{ marginTop: 36 }}>
                        <span className="rp-kml-section-dot recent" /> Previous Recent Requests
                      </div>
                      <div className="rp-kml-prev-grid">
                        {recentKmls.map((file, idx) => (
                          <div key={idx} className="rp-kml-prev-card">
                            <div className="rp-kml-prev-name">
                              <Map size={13} />
                              <span>{file.filename}</span>
                              {file.filename?.toLowerCase().includes('wow') && <span className="rp-kml-badge risk">RISK</span>}
                              {file.filename?.toLowerCase().includes('forecast') && !file.filename?.toLowerCase().includes('wow') && <span className="rp-kml-badge forecast">FORECAST</span>}
                            </div>
                            <button className="rp-kml-dl-btn" onClick={() => downloadFile(file.filename)}>
                              <Download size={13} /> Download
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
            }
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="rp-metrics-section">
            <div className="rp-metrics-intro">
              <p>The gradient boosting model is evaluated on a chronological 80/20 train-test split. Metrics below are averaged across all 100 shoreline transects.</p>
            </div>
            <ModelMetricsPanel text={allText} />
          </div>
        )}

        {activeTab === 'details' && (
          <div className="rp-details-section">
            {filteredHtmlOutputs.length === 0
              ? <div className="rp-empty">No analysis tables generated.</div>
              : <div className="rp-tables-grid">
                  {filteredHtmlOutputs.map((o, i) => (
                    <div className="rp-named-table" key={i}>
                      <div className="rp-named-table-header">
                        <div className="rp-named-table-title">{TABLE_NAMES[i]?.title || `Table ${i + 1}`}</div>
                        {TABLE_NAMES[i]?.desc && <div className="rp-named-table-desc">{TABLE_NAMES[i].desc}</div>}
                      </div>
                      <HtmlTable html={o.data} />
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {activeTab === 'datasets' && (
          <div className="rp-datasets-section">
            <p className="rp-datasets-intro">
              Download the raw datasets used and produced during this forecast run. These files are stored in <code>data_cache/output_forecasts/</code> and <code>data_cache/</code>.
            </p>
            <div className="rp-datasets-grid">
              {DATASET_FILES.map((f, i) => (
                <div className="rp-dataset-card" key={i}>
                  <div className="rp-dataset-card-left">
                    <div className="rp-dataset-name">{f.label}</div>
                    <div className="rp-dataset-filename">{f.name}</div>
                    <div className="rp-dataset-desc">{f.desc}</div>
                  </div>
                  <button className="rp-dataset-dl-btn" onClick={() => downloadFile(f.name)}>
                    <Download size={15} /> Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ── DASHBOARD ──
export default function Dashboard() {
  const [page, setPage]             = useState(PAGES.LANDING)
  const [results, setResults]       = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [riskData, setRiskData]     = useState(null)
  const [forecastDate, setForecastDate] = useState('')
  const [runMode, setRunMode] = useState('full')
  const apiBaseRef = useRef(API_BASE)

  useEffect(() => {
    const loadRiskData = async () => {
      try {
        const res = await fetch(`${apiBaseRef.current}/api/latest-risk-data`)
        if (res.ok) setRiskData(await res.json())
      } catch (e) { console.error('Failed to fetch risk data:', e) }
    }
    loadRiskData()
  }, [])

  const handleNavigateToParams = (e) => { e.preventDefault?.(); setPage(PAGES.PARAMETERS) }
  const handleBackToLanding = () => { setPage(PAGES.LANDING); setResults(null); setError('') }

  const handleGenerateForecast = useCallback(async ({ forecastDate: fd, mode }) => {
    setLoading(true); setError(''); setResults(null)
    setForecastDate(fd)
    setRunMode(mode || 'full')
    setPage(PAGES.RESULTS)
    try {
      const res = await fetch(`${apiBaseRef.current}/api/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forecastDate: fd, mode: mode || 'full' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `${res.status} ${res.statusText}`)
      }
      const data = await res.json()
      setResults(data)
      try {
        const r = await fetch(`${apiBaseRef.current}/api/latest-risk-data`)
        if (r.ok) setRiskData(await r.json())
      } catch (e) {}
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Forecast failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleDownloadFile = useCallback((filename) => {
    window.open(`${apiBaseRef.current}/api/download/${filename}`, '_blank')
  }, [])

  return (
    <main className="dashboard-main">
      {page === PAGES.LANDING && (
        <LandingPage onNavigateToParams={handleNavigateToParams} loading={loading} riskData={riskData} />
      )}
      {page === PAGES.PARAMETERS && (
        <ParametersPage onBack={handleBackToLanding} onGenerateForecast={handleGenerateForecast} loading={loading} />
      )}
      {page === PAGES.RESULTS && (
        <ResultsPage data={results} onBack={handleBackToLanding} loading={loading} error={error} downloadFile={handleDownloadFile} forecastDate={forecastDate} runMode={runMode} />
      )}
    </main>
  )
}
