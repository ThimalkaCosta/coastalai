// STDashboard.jsx — Integrated + UI improvements merged
import { useCallback, useEffect, useRef, useState } from 'react'
import Plot from 'react-plotly.js'
import { Download, RefreshCw, AlertTriangle, Map, BarChart2, FileText, CheckCircle, ChevronDown, ChevronUp, Maximize2, X } from 'lucide-react'
import STLandingPage from './STLandingPage'
import STParametersPage from './STParametersPage'

// ── Static transect history images ──
import transect0  from '../../assets/transect_0.png'
import transect50 from '../../assets/transect_50.png'
import transect99 from '../../assets/transect_99.png'

// ✅ Preserved: friend's API base using VITE_API_URL + shortterm paths
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '').replace(/\/$/, '')

const PAGES = { LANDING: 'landing', PARAMETERS: 'parameters', RESULTS: 'results' }

// ── ResultsWaveCanvas — animated wave canvas for the results banner (NEW) ──
function ResultsWaveCanvas() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, t = 0
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)
    const configs = [
      { amp: 14, freq: 0.009, speed: 0.022, yFrac: 0.45, c0: 'rgba(29,101,212,0.38)', c1: 'rgba(29,101,212,0.08)' },
      { amp: 10, freq: 0.013, speed: 0.032, yFrac: 0.58, c0: 'rgba(6,182,212,0.30)',  c1: 'rgba(29,101,212,0.06)' },
      { amp: 7,  freq: 0.018, speed: 0.044, yFrac: 0.70, c0: 'rgba(96,165,250,0.22)', c1: 'rgba(6,182,212,0.05)' },
      { amp: 5,  freq: 0.025, speed: 0.058, yFrac: 0.82, c0: 'rgba(147,197,253,0.16)', c1: 'rgba(96,165,250,0.03)' },
    ]
    const draw = () => {
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)
      configs.forEach(({ amp, freq, speed, yFrac, c0, c1 }) => {
        const yBase = height * yFrac
        ctx.beginPath()
        ctx.moveTo(0, yBase)
        for (let x = 0; x <= width; x += 2) {
          const y = yBase + Math.sin(x * freq + t * speed) * amp
            + Math.sin(x * freq * 1.6 + t * speed * 0.7) * (amp * 0.4)
          ctx.lineTo(x, y)
        }
        ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath()
        const g = ctx.createLinearGradient(0, yBase - amp, 0, height)
        g.addColorStop(0, c0); g.addColorStop(1, c1)
        ctx.fillStyle = g; ctx.fill()
      })
      t++; animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="rp-results-banner-canvas" />
}

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

// ── Parse KML coordinates string → [[lat,lng], ...] ──
function parseKmlCoords(coordStr) {
  if (!coordStr) return []
  return coordStr.trim().split(/\s+/).map(c => {
    const [lng, lat] = c.split(',').map(Number)
    return [lat, lng]
  }).filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng))
}

// ── Parse full KML text into layers ──
function parseKml(kmlText) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(kmlText, 'text/xml')
  const placemarks = Array.from(doc.querySelectorAll('Placemark'))
  const layers = { refLine: null, fcLine: null, riskZones: [], hotspots: [] }

  placemarks.forEach(pm => {
    const nameEl = pm.querySelector('n, name')
    const name = nameEl?.textContent?.trim() || ''
    const styleUrl = pm.querySelector('styleUrl')?.textContent?.trim().replace('#', '') || ''
    const coordEl = pm.querySelector('LineString coordinates, LinearRing coordinates, coordinates')
    const coords = coordEl ? parseKmlCoords(coordEl.textContent) : []
    const pointEl = pm.querySelector('Point coordinates')

    if (pointEl) {
      const [lng, lat] = pointEl.textContent.trim().split(',').map(Number)
      if (!isNaN(lat)) layers.hotspots.push({ lat, lng, name })
      return
    }

    if (name.includes('Reference') || styleUrl === 'refLine' || styleUrl === 'whiteLine') {
      layers.refLine = coords
    } else if (name.includes('Forecast') || styleUrl === 'fcLine' || styleUrl === 'redLine') {
      layers.fcLine = coords
    } else if (name.includes('HIGH') && coords.length > 2) {
      layers.riskZones.push({ coords, level: 'HIGH', name })
    } else if (name.includes('MED') && coords.length > 2) {
      layers.riskZones.push({ coords, level: 'MED', name })
    } else if (name.includes('LOW') && coords.length > 2) {
      layers.riskZones.push({ coords, level: 'LOW', name })
    }
  })
  return layers
}

// ── LeafletKmlMap — real Leaflet map with satellite tiles (NEW) ──
function LeafletKmlMap({ kmlUrl, filename, onDownload, mapId }) {
  const mapRef = useRef(null)
  const leafletRef = useRef(null)
  const [status, setStatus] = useState('loading')
  const isWow = filename?.toLowerCase().includes('wow') || filename?.toLowerCase().includes('risk')
  const isForecast = filename?.toLowerCase().includes('forecast')

  useEffect(() => {
    let map = null
    let cancelled = false

    const initMap = async () => {
      if (!window.L) {
        await new Promise((resolve, reject) => {
          const css = document.createElement('link')
          css.rel = 'stylesheet'
          css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
          document.head.appendChild(css)
          const js = document.createElement('script')
          js.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
          js.onload = resolve; js.onerror = reject
          document.head.appendChild(js)
        })
      }
      if (cancelled) return
      const L = window.L

      let kmlText = ''
      try {
        const res = await fetch(kmlUrl)
        kmlText = await res.text()
      } catch (e) {
        setStatus('error'); return
      }
      if (cancelled) return

      const layers = parseKml(kmlText)
      const allCoords = [...(layers.refLine || []), ...(layers.fcLine || [])]
      if (allCoords.length === 0) { setStatus('error'); return }

      const lats = allCoords.map(c => c[0]), lngs = allCoords.map(c => c[1])
      const centre = [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2]

      if (!mapRef.current || leafletRef.current) return
      map = L.map(mapRef.current, { zoomControl: true, attributionControl: true }).setView(centre, 17)
      leafletRef.current = map

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri',
        maxZoom: 20,
      }).addTo(map)

      L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner-hybrid/{z}/{x}/{y}.png', {
        opacity: 0.3, maxZoom: 20
      }).addTo(map)

      const RISK_COLORS = { HIGH: '#ef4444', MED: '#f97316', LOW: '#22c55e' }
      layers.riskZones.forEach(({ coords, level }) => {
        if (coords.length < 3) return
        L.polygon(coords, {
          color: RISK_COLORS[level] || '#ef4444',
          fillColor: RISK_COLORS[level] || '#ef4444',
          fillOpacity: 0.2,
          weight: 1.5,
          opacity: 0.7,
        }).addTo(map).bindPopup(`<b>${level} Risk Zone</b>`)
      })

      if (layers.refLine?.length > 1) {
        L.polyline(layers.refLine, { color: '#ffffff', weight: 3, opacity: 0.95 })
          .addTo(map).bindPopup('<b>Current Shoreline (Reference)</b>')
      }

      if (layers.fcLine?.length > 1) {
        L.polyline(layers.fcLine, { color: '#f87171', weight: 3, opacity: 0.95, dashArray: isWow ? null : '8 5' })
          .addTo(map).bindPopup('<b>Forecast Shoreline</b>')
      }

      layers.hotspots.forEach(({ lat, lng, name }) => {
        const isHigh = name.includes('HIGH')
        const isMed = name.includes('MED')
        const pinColor = isHigh ? '#ef4444' : isMed ? '#f97316' : '#22c55e'
        const icon = L.divIcon({
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${pinColor};border:2.5px solid white;box-shadow:0 0 8px ${pinColor}aa"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7], className: ''
        })
        L.marker([lat, lng], { icon }).addTo(map).bindPopup(`<b>${name}</b>`)
      })

      const bounds = L.latLngBounds(allCoords)
      map.fitBounds(bounds, { padding: [30, 30] })
      if (!cancelled) setStatus('ready')
    }

    initMap().catch(() => setStatus('error'))

    return () => {
      cancelled = true
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null }
    }
  }, [kmlUrl])

  return (
    <div className="rp-kml-viewer">
      <div className="rp-kml-viewer-header">
        <div className="rp-kml-viewer-title">
          <Map size={16} />
          <span>{isWow ? 'WOW Risk Map — Live Preview' : isForecast ? 'Forecast Shoreline — Live Preview' : filename}</span>
          {isWow && <span className="rp-kml-badge risk">RISK ZONES</span>}
          {isForecast && <span className="rp-kml-badge forecast">FORECAST</span>}
        </div>
        <button className="rp-kml-dl-btn" onClick={() => onDownload(filename)}>
          <Download size={14} /> Download KML
        </button>
      </div>

      <div className="rp-leaflet-wrap" style={{ position: 'relative', height: 360 }}>
        {status === 'loading' && (
          <div className="rp-map-loading">
            <div className="rp-map-spinner" />
            <span>Loading satellite map…</span>
          </div>
        )}
        {status === 'error' && (
          <div className="rp-map-loading">
            <Map size={22} style={{ color: 'var(--text3)' }} />
            <span style={{ color: 'var(--text3)', marginTop: 8 }}>Map unavailable — download KML for Google Earth</span>
          </div>
        )}
        <div ref={mapRef} id={mapId} style={{ width: '100%', height: '100%', borderRadius: '0 0 18px 18px' }} />
      </div>

      <div className="rp-kml-instructions">
        <p>🛰 Live map with satellite imagery (Esri World Imagery). Scroll to zoom, drag to pan.
          &nbsp;·&nbsp; Download KML for full <strong>Google Earth Pro</strong> experience with 3D terrain.</p>
      </div>
    </div>
  )
}

// ── KmlViewer — delegates to LeafletKmlMap, uses shortterm download path ──
function KmlViewer({ file, onDownload }) {
  // ✅ Preserved: shortterm API path
  const kmlUrl = `${API_BASE}/api/shortterm/download/${encodeURIComponent(file.filename)}`
  return <LeafletKmlMap kmlUrl={kmlUrl} filename={file.filename} onDownload={onDownload} mapId={`kml-map-${file.filename}`} />
}

// ── ChartCard ──
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

// ── TransectHistoryCard — static card showing 3 transect history plots ──
function TransectHistoryCard({ onExpand }) {
  const transects = [
    { img: transect0,  label: 'Transect 0',  sub: 'Northern end' },
    { img: transect50, label: 'Transect 50', sub: 'Mid-shore' },
    { img: transect99, label: 'Transect 99', sub: 'Southern end' },
  ]

  return (
    <div className="rp-chart-card">
      <div className="rp-chart-card-header">
        <div>
          <div className="rp-chart-card-title">Historical Shoreline Movement — Key Transects</div>
          <div className="rp-chart-card-desc">Observed shoreline position change 2010–2026 at three representative cross-shore transects</div>
        </div>
      </div>
      <div className="rp-transect-grid">
        {transects.map(({ img, label, sub }) => (
          <div key={label} className="rp-transect-item">
            <img
              src={img}
              alt={label}
              className="rp-transect-img"
              onClick={() => onExpand(img)}
            />
            <div className="rp-transect-label">{label}</div>
            <div className="rp-transect-sub">{sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

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
      {open && <div className="rp-log-body"><pre>{text}</pre></div>}
    </div>
  )
}

function HtmlTable({ html }) {
  return (
    <div className="rp-html-table-wrap">
      <div className="rp-html-table-inner" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

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
        <MetricStrip text={text} />
      </div>
    )
  }

  return (
    <div className="rp-metrics-table-wrap">
      <table className="rp-metrics-table">
        <thead>
          <tr><th>Metric</th><th>Train Set</th><th>Test Set</th><th>Unit</th><th>Description</th></tr>
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
                <div className="rp-metric-tile-val" style={{ color: m.color }}>{m.value}<span className="rp-metric-tile-unit">{m.unit}</span></div>
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
                <div className="rp-metric-tile-val" style={{ color: m.color }}>{m.value}<span className="rp-metric-tile-unit">{m.unit}</span></div>
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

  // ── Loading screen — NEW: full animated ocean background ──
  if (loading) {
    const isQuick = runMode === 'quick'
    const steps = isQuick
      ? ['Loading cached datasets', 'Running prediction on trained model', 'Generating shoreline forecast', 'Building risk KML']
      : ['Downloading latest ERA5 data', 'Downloading latest CMEMS wave data', 'Training gradient boosting model', 'Generating forecast & KML']
    return (
      <div className="rp-root rp-loading">
        {/* ── Animated ocean background ── */}
        <div className="rp-loading-ocean">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rp-orb" style={{
              '--delay': `${i * 0.7}s`,
              '--size':  `${120 + i * 40}px`,
              '--x':     `${10 + i * 11}%`,
              '--dur':   `${6 + i * 1.2}s`,
            }} />
          ))}
          <div className="rp-loading-grid" />
          <div className="rp-radar">
            <div className="rp-radar-ring rp-radar-r1" />
            <div className="rp-radar-ring rp-radar-r2" />
            <div className="rp-radar-ring rp-radar-r3" />
            <div className="rp-radar-sweep" />
            <div className="rp-radar-center" />
          </div>
          <div className="rp-loading-waves">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rp-loading-wave-strip" style={{ '--wi': i }} />
            ))}
          </div>
          {[...Array(12)].map((_, i) => (
            <div key={i} className="rp-particle" style={{
              '--px': `${5 + i * 8}%`,
              '--pd': `${i * 0.4}s`,
              '--pf': `${4 + (i % 4)}s`,
            }} />
          ))}
        </div>

        <div className="rp-loading-inner">
          <div className="rp-loading-wave-bars">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="rp-loading-bar" style={{ animationDelay: `${i * 0.1}s` }} />
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

  const currentKmls = kmlOutputs.filter(o => forecastDate && o.filename?.includes(forecastDate))
  const currentKmlsFinal = currentKmls.length > 0
    ? currentKmls
    : kmlOutputs.filter(o => o.filename?.toLowerCase().includes('wow') || o.filename?.toLowerCase().includes('forecast'))
  const recentKmls = kmlOutputs.filter(o => !currentKmlsFinal.includes(o))

  const wowKml = currentKmlsFinal.find(o =>
    o.filename?.toLowerCase().includes('wow') || o.filename?.toLowerCase().includes('risk')
  ) || currentKmlsFinal[0]

  const forecastOnlyKml = currentKmlsFinal.find(o =>
    o.filename?.toLowerCase().includes('forecast') && !o.filename?.toLowerCase().includes('wow')
  )

  const TABLE_NAMES = [
    { title: 'Train / Test Split Metrics', desc: 'R², MAE and RMSE for the gradient boosting model' },
    { title: 'Predicted Environmental Conditions', desc: 'Seasonal window mean for wave, wind, pressure and precipitation' },
    { title: 'Forecast Change Summary', desc: 'Per-transect mean shoreline change, max retreat and max advance' },
  ]
  const filteredHtmlOutputs = htmlOutputs.filter((_, i) => i < TABLE_NAMES.length)

  const DATASET_FILES = [
    { name: 'predicted_30days.csv',                label: '30-Day Env Forecast',   desc: 'Full 30-day predicted environmental conditions + event scores' },
    { name: 'spike_summary.csv',                   label: 'Risk Spike Summary',     desc: 'High-risk event days with wave height, wind speed and drivers' },
    { name: 'env_conditions.json',                 label: 'Env Conditions (JSON)',  desc: 'Seasonal mean environmental conditions for the forecast date' },
    { name: 'final_training_dataset.csv',          label: 'Training Dataset',       desc: 'Merged ERA5 + CMEMS + shoreline dataset' },
    { name: 'final_era5_cmems_daily_features.csv', label: 'ERA5 + CMEMS Features', desc: 'Full historical daily environmental features' },
  ]

  const tabs = [
    { id: 'charts',   label: 'Visualizations',  icon: <BarChart2 size={15} />,    count: chartOutputs.length },
    { id: 'kml',      label: 'KML Maps',         icon: <Map size={15} />,          count: kmlOutputs.length },
    { id: 'metrics',  label: 'Model Metrics',    icon: <CheckCircle size={15} />,  count: null },
    { id: 'details',  label: 'Analysis Tables',  icon: <FileText size={15} />,     count: filteredHtmlOutputs.length },
    { id: 'datasets', label: 'Data Downloads',   icon: <Download size={15} />,     count: DATASET_FILES.length },
  ]

  return (
    <div className="rp-root">
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}

      {/* ── Results wave banner ── */}
      <div className="rp-results-banner">
        <ResultsWaveCanvas />
        <div className="rp-results-banner-content">
          <div className="rp-results-banner-tag">
            <CheckCircle size={14} /> ANALYSIS COMPLETE
          </div>
          <h1 className="rp-results-banner-title">Shoreline Forecast Results</h1>
          <p className="rp-results-banner-sub">
            Target: <strong>{forecastDate || '—'}</strong> &nbsp;·&nbsp; Generated {new Date(data.generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="rp-results-banner-actions">
          <button className="pp-back rp-back-btn" onClick={onBack}>← Dashboard</button>
          <button className="rp-run-again" onClick={onBack}>
            <RefreshCw size={16} /> New Forecast
          </button>
        </div>
      </div>

      {/* Metric strip */}
      <div className="rp-header">
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
              : (
                <div className="rp-charts-grid-2x2">
                  {/* Row 1: Shoreline Forecast Summary + Transect History */}
                  {chartOutputs[2] && (
                    <ChartCard output={chartOutputs[2]} idx={2} onExpand={setLightbox} />
                  )}
                  <TransectHistoryCard onExpand={setLightbox} />

                  {/* Row 2: Correlation Matrix + Diagnostic Plots */}
                  {chartOutputs[0] && (
                    <ChartCard output={chartOutputs[0]} idx={0} onExpand={setLightbox} />
                  )}
                  {chartOutputs[1] && (
                    <ChartCard output={chartOutputs[1]} idx={1} onExpand={setLightbox} />
                  )}

                  {/* Any extra charts beyond index 2 */}
                  {chartOutputs.slice(3).map((output, i) => (
                    <ChartCard key={i + 3} output={output} idx={i + 3} onExpand={setLightbox} />
                  ))}
                </div>
              )
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
                    The interactive preview below uses live satellite imagery.
                    Download any file and open in <strong>Google Earth Pro</strong> for full 3D terrain.
                  </p>

                  {currentKmlsFinal.length > 0 && (
                    <>
                      <div className="rp-kml-section-label">
                        <span className="rp-kml-section-dot current" /> This Forecast Run — {forecastDate}
                      </div>

                      {wowKml && (
                        <KmlViewer file={wowKml} onDownload={downloadFile} />
                      )}

                      {forecastOnlyKml && (
                        <div className="rp-kml-grid" style={{ marginTop: 16 }}>
                          <KmlViewer file={forecastOnlyKml} onDownload={downloadFile} />
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
              <p>The gradient boosting model is evaluated on a chronological 80/20 train-test split across all 100 shoreline transects.</p>
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
              Download the raw datasets used and produced during this forecast run.
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

// ── MAIN DASHBOARD ──
export default function STDashboard() {
  const [page, setPage]             = useState(PAGES.LANDING)
  const [results, setResults]       = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [riskData, setRiskData]     = useState(null)
  const [forecastDate, setForecastDate] = useState('')
  const [runMode, setRunMode]       = useState('full')

  useEffect(() => {
    const loadRiskData = async () => {
      try {
        // ✅ Preserved: shortterm API path
        const res = await fetch(`${API_BASE}/api/shortterm/latest-risk-data`)
        if (res.ok) setRiskData(await res.json())
      } catch (_) { /* ignore */ }
    }
    loadRiskData()
  }, [])

  const handleNavigateToParams = (e) => { e?.preventDefault?.(); setPage(PAGES.PARAMETERS) }
  const handleBackToLanding = () => { setPage(PAGES.LANDING); setResults(null); setError('') }

  const handleGenerateForecast = useCallback(async ({ forecastDate: fd, mode }) => {
    setLoading(true); setError(''); setResults(null)
    setForecastDate(fd)
    setRunMode(mode || 'full')
    setPage(PAGES.RESULTS)
    try {
      // ✅ Preserved: shortterm API path
      const res = await fetch(`${API_BASE}/api/shortterm/run`, {
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
        // ✅ Preserved: shortterm API path
        const r = await fetch(`${API_BASE}/api/shortterm/latest-risk-data`)
        if (r.ok) setRiskData(await r.json())
      } catch (_) { /* ignore */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Forecast failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleDownloadFile = useCallback((filename) => {
    // ✅ Preserved: shortterm download path
    window.open(`${API_BASE}/api/shortterm/download/${encodeURIComponent(filename)}`, '_blank')
  }, [])

  return (
    <main className="dashboard-main">
      {page === PAGES.LANDING && (
        <STLandingPage apiBase={API_BASE} onNavigateToParams={handleNavigateToParams} loading={loading} riskData={riskData} />
      )}
      {page === PAGES.PARAMETERS && (
        <STParametersPage onBack={handleBackToLanding} onGenerateForecast={handleGenerateForecast} loading={loading} />
      )}
      {page === PAGES.RESULTS && (
        <ResultsPage data={results} onBack={handleBackToLanding} loading={loading} error={error} downloadFile={handleDownloadFile} forecastDate={forecastDate} runMode={runMode} />
      )}
    </main>
  )
}