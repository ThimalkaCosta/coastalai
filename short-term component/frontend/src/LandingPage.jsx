//LandingPage.jsx — Maritime Intelligence redesign (Enhanced)
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, AlertTriangle, TrendingDown, Wind, Waves, MapPin, Database, Clock, Activity } from 'lucide-react'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '')

export default function LandingPage({ onNavigateToParams, loading, riskData }) {
  const [scrollY, setScrollY] = useState(0)
  const [stats, setStats] = useState(null)
  const [hoveredRow, setHoveredRow] = useState(null)
  const heroRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, t = 0
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)

    const waveConfigs = [
      { amp: 26, freq: 0.007, speed: 0.018, yFrac: 0.50, color0: 'rgba(14,100,200,0.32)', color1: 'rgba(6,60,140,0.20)' },
      { amp: 19, freq: 0.010, speed: 0.026, yFrac: 0.61, color0: 'rgba(37,120,220,0.26)', color1: 'rgba(14,100,200,0.14)' },
      { amp: 13, freq: 0.013, speed: 0.034, yFrac: 0.70, color0: 'rgba(6,182,212,0.22)',  color1: 'rgba(37,120,220,0.09)' },
      { amp:  8, freq: 0.018, speed: 0.044, yFrac: 0.80, color0: 'rgba(96,165,250,0.16)', color1: 'rgba(6,182,212,0.06)' },
      { amp:  5, freq: 0.024, speed: 0.058, yFrac: 0.88, color0: 'rgba(147,197,253,0.12)', color1: 'rgba(96,165,250,0.04)' },
    ]

    const draw = () => {
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)
      waveConfigs.forEach(({ amp, freq, speed, yFrac, color0, color1 }) => {
        const yBase = height * yFrac
        ctx.beginPath()
        ctx.moveTo(0, yBase)
        for (let x = 0; x <= width; x += 2) {
          const y = yBase
            + Math.sin(x * freq + t * speed) * amp
            + Math.sin(x * freq * 1.7 + t * speed * 0.6) * (amp * 0.38)
            + Math.sin(x * freq * 0.4 + t * speed * 1.4) * (amp * 0.2)
          ctx.lineTo(x, y)
        }
        ctx.lineTo(width, height)
        ctx.lineTo(0, height)
        ctx.closePath()
        const grad = ctx.createLinearGradient(0, yBase - amp, 0, height)
        grad.addColorStop(0, color0)
        grad.addColorStop(1, color1)
        ctx.fillStyle = grad
        ctx.fill()
      })
      t += 1
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/latest-stats`)
        if (res.ok) setStats(await res.json())
      } catch (e) {}
    }
    fetchStats()
  }, [])

  const parallaxY = scrollY * 0.35
  const chartDays     = riskData?.eventDays    || []
  const spikes        = riskData?.spikeSummary || riskData?.eventDays?.filter(d => d.isSpike) || []
  const envConditions = riskData?.envConditions || []

  const ENV_ICONS = {
    wind_speed: '💨', fg10: '🌬️', msl: '🌡️', tp: '🌧️',
    vhm0: '🌊', vtpk: '⏱️', vmdr: '🧭', wave_energy: '⚡',
    'Wind Speed': '💨', 'Wind Gust': '🌬️', 'Sea Level Pressure': '🌡️',
    'Total Precipitation': '🌧️', 'Sig. Wave Height': '🌊',
    'Wave Peak Period': '⏱️', 'Wave Direction': '🧭', 'Wave Energy': '⚡',
  }

  return (
    <div className="lp-root">

      {/* ── HERO ── */}
      <section className="lp-hero" ref={heroRef}>
        <div className="lp-hero-bg" style={{
          backgroundImage: `url("/front_image.png")`,
          transform: `translateY(${parallaxY}px) scale(1.12)`,
        }} />
        <div className="lp-hero-vignette" />
        <canvas ref={canvasRef} className="lp-hero-canvas" />

        {/* Nav */}
        <nav className="lp-nav">
          <div className="lp-nav-brand">
            <span className="lp-nav-dot" />
            <span>SL Coastal Forecasting</span>
          </div>
          <button className="lp-nav-btn" onClick={onNavigateToParams} disabled={loading}>
            {loading
              ? <><span className="lp-spinner" /> Running…</>
              : <>Set Forecast Parameters <span className="lp-nav-arrow">→</span></>}
          </button>
        </nav>

        {/* Hero copy */}
        <div className="lp-hero-content">
          <div className="lp-hero-eyebrow">
            <span className="lp-live-dot" />
            LIVE COASTAL INTELLIGENCE
          </div>
          <h1 className="lp-hero-title">
            Short Term<br /><em>Forecasting</em>
          </h1>
          <p className="lp-hero-sub">
            AI-powered shoreline erosion &amp; risk prediction<br />
            up to 1 year ahead — wave energy, wind &amp; sediment transport
          </p>
          <div className="lp-hero-cta-row">
            <button className="lp-cta-primary" onClick={onNavigateToParams} disabled={loading}>
              {loading ? 'Generating…' : 'Generate Forecast'}
            </button>
            <div className="lp-hero-scroll-hint">scroll to explore <ChevronDown size={14} /></div>
          </div>
        </div>

        {/* Metric pills */}
        <div className="lp-hero-metrics">
          <div className="lp-metric-pill">
            <Waves size={14} />
            <span>{stats?.avgWaveHeight != null ? Number(stats.avgWaveHeight).toFixed(1) : '—'} m</span>
            <small>Wave Ht</small>
          </div>
          <div className="lp-metric-pill">
            <Wind size={14} />
            <span>{stats?.avgWindSpeed != null ? Number(stats.avgWindSpeed).toFixed(1) : '—'} m/s</span>
            <small>Wind</small>
          </div>
          <div className="lp-metric-pill alert">
            <AlertTriangle size={14} />
            <span>{stats?.highRiskZones ?? '—'}</span>
            <small>Spikes</small>
          </div>
        </div>
      </section>

      {/* ── RISK ANALYSIS ── */}
      <section className="lp-risk">
        <div className="lp-risk-inner">

          <div className="lp-section-hdr">
            <div className="lp-section-tag"><Activity size={13} /> RISK ANALYSIS</div>
            <h2 className="lp-section-title">30-Day Environmental Forecast</h2>
            <p className="lp-section-desc">
              Predicted conditions from ERA5 reanalysis &amp; CMEMS wave modelling
            </p>
          </div>

          {/* Chart */}
          <div className="lp-chart-card">
            <div className="lp-chart-header">
              <div>
                <h3>30-Day Outlook: Projected Shoreline Change &amp; Events</h3>
                {chartDays.length === 0 && (
                  <p className="lp-chart-note">Run the notebook once to populate this chart.</p>
                )}
              </div>
              <div className="lp-chart-legend">
                <span><i className="lp-legend-line blue" /> Wave Height (m)</span>
                <span><i className="lp-legend-line teal" /> Wind Speed (m/s)</span>
                <span><i className="lp-legend-line orange" /> Event Score</span>
                <span><i className="lp-legend-dot red" /> Spike</span>
              </div>
            </div>
            <SpikeChart days={chartDays} />
          </div>

          {/* Env cards */}
          {envConditions.length > 0 && (
            <div className="lp-env-section">
              <h3 className="lp-subsection-title">Predicted Environmental Conditions</h3>
              <div className="lp-env-grid">
                {envConditions.map((row, i) => {
                  const key   = row.variable || ''
                  const label = row.label || key
                  const icon  = ENV_ICONS[key] || ENV_ICONS[label] || '📊'
                  const mean  = row.mean  ?? row.predicted_mean
                  const std   = row.std   ?? row.std_dev
                  return (
                    <div className="lp-env-card" key={i}>
                      <div className="lp-env-card-icon">{icon}</div>
                      <div className="lp-env-card-body">
                        <div className="lp-env-card-label">{label}</div>
                        <div className="lp-env-card-val">
                          {mean != null ? Number(mean).toFixed(2) : '—'}
                          <span className="lp-env-card-unit">{row.unit}</span>
                        </div>
                        {std != null && (
                          <div className="lp-env-card-std">± {Number(std).toFixed(2)} uncertainty</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Spikes table */}
          <div className="lp-spikes-section">
            <h3 className="lp-subsection-title">
              <AlertTriangle size={16} className="lp-spike-icon" />
              Top Risk Spikes — Next 30 Days
            </h3>
            {spikes.length > 0 ? (
              <div className="lp-table-wrap">
                <table className="lp-spikes-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Day</th>
                      <th>Wave Ht (m)</th>
                      <th>Wind (m/s)</th>
                      <th>Event Score</th>
                      <th>Primary Driver</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spikes.map((s, i) => (
                      <tr key={i}
                        className={hoveredRow === i ? 'hovered' : ''}
                        onMouseEnter={() => setHoveredRow(i)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <td className="lp-td-date">{s.date || '—'}</td>
                        <td className="lp-td-day">Day {s.day ?? i + 1}</td>
                        <td className="lp-td-wave">{s.waveHeight != null ? Number(s.waveHeight).toFixed(2) : '—'}</td>
                        <td>{s.windSpeed != null ? Number(s.windSpeed).toFixed(2) : '—'}</td>
                        <td className="lp-td-score">{s.eventScore != null ? Number(s.eventScore).toFixed(2) : '—'}</td>
                        <td className="lp-td-driver">{s.mainDrivers || '—'}</td>
                        <td>
                          <span className={`lp-badge lp-badge-${(s.riskLevel || 'spike').toLowerCase()}`}>
                            <AlertTriangle size={11} /> {s.riskLevel || 'SPIKE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="lp-no-events">
                <div className="lp-no-events-icon">{riskData ? '✅' : '⏳'}</div>
                <p>{riskData
                  ? 'No critical spike events detected in the next 30 days.'
                  : 'Run the notebook to generate risk data. It will appear here automatically.'}</p>
              </div>
            )}
          </div>

          {/* Downloads */}
          <div className="lp-download-section">
            <div className="lp-download-card">
              <div className="lp-download-card-left">
                <div className="lp-download-card-icon">📊</div>
                <div>
                  <div className="lp-download-card-title">30-Day Forecast Data</div>
                  <div className="lp-download-card-desc">
                    Download the full predicted_30days.csv — daily wave height, wind speed, event scores and spike flags for the next 30 days
                  </div>
                </div>
              </div>
              <a href={`${API_BASE}/api/download/predicted_30days.csv`} download="predicted_30days.csv" className="lp-download-btn">
                ↓ Download CSV
              </a>
            </div>
            <div className="lp-download-card">
              <div className="lp-download-card-left">
                <div className="lp-download-card-icon">⚡</div>
                <div>
                  <div className="lp-download-card-title">Risk Spike Summary</div>
                  <div className="lp-download-card-desc">
                    Download spike_summary.csv — high-risk event days with drivers, wave height and wind speed
                  </div>
                </div>
              </div>
              <a href={`${API_BASE}/api/download/spike_summary.csv`} download="spike_summary.csv" className="lp-download-btn">
                ↓ Download CSV
              </a>
            </div>
          </div>

          {/* Data status */}
          <div className="lp-status-section">
            <h3 className="lp-subsection-title"><Database size={15} /> Data Sources &amp; Coverage</h3>
            <div className="lp-status-grid">
              <StatusCard icon={<Clock size={18} />} title="Weather Data (ERA5)" rows={[
                ['Last Updated', stats?.era5Updated || 'N/A'],
                ['Coverage', 'Global 1990–Present'],
                ['Resolution', '0.25° × 0.25° grid'],
              ]} />
              <StatusCard icon={<Waves size={18} />} title="Wave Data (CMEMS)" rows={[
                ['Last Updated', stats?.cmemsUpdated || 'N/A'],
                ['Coverage', 'Global waves/currents'],
                ['Resolution', '0.1° × 0.1° grid'],
              ]} />
              <StatusCard icon={<MapPin size={18} />} title="Study Area" rows={[
                ['Latitude',  stats?.latitude  || '6.35°N – 6.42°N'],
                ['Longitude', stats?.longitude || '79.97°E – 80.02°E'],
                ['Region',    stats?.region    || 'SW Sri Lanka Coast'],
              ]} />
              <StatusCard icon={<TrendingDown size={18} />} title="Shoreline Data" rows={[
                ['KML Records', stats?.kmlFilesCount ?? '0'],
                ['Time Span',   '2010–Present'],
                ['Transects',   stats?.transectCount ?? '100'],
              ]} />
            </div>
          </div>

        </div>
      </section>

      <div className="lp-footer-cta">
        <p>Ready to generate a shoreline forecast?</p>
        <button className="lp-cta-primary" onClick={onNavigateToParams} disabled={loading}>
          Set Forecast Parameters →
        </button>
      </div>
    </div>
  )
}

function StatusCard({ icon, title, rows }) {
  return (
    <div className="lp-status-card">
      <div className="lp-status-card-hdr">{icon}<span>{title}</span></div>
      {rows.map(([k, v], i) => (
        <div className="lp-status-row" key={i}>
          <span className="lp-status-key">{k}</span>
          <span className="lp-status-val">{v}</span>
        </div>
      ))}
    </div>
  )
}

// ── SpikeChart — deep ocean blue background, glowing lines ──
function SpikeChart({ days }) {
  const [tooltip, setTooltip] = useState(null)
  const W = 960, H = 320
  const PAD = { l: 58, r: 62, t: 32, b: 46 }
  const CW = W - PAD.l - PAD.r
  const CH = H - PAD.t - PAD.b

  if (!days || days.length === 0) {
    return (
      <div className="lp-chart-empty">
        <p>No 30-day forecast data yet — run the notebook to populate this chart.</p>
      </div>
    )
  }

  const n = days.length
  const xScale = i => PAD.l + (i / Math.max(n - 1, 1)) * CW

  const waves  = days.map(d => Number(d.waveHeight  ?? 0))
  const winds  = days.map(d => Number(d.windSpeed   ?? 0))
  const scores = days.map(d => Number(d.eventScore  ?? 0))

  const allLeft = [...waves, ...winds]
  const minL = Math.min(...allLeft), maxL = Math.max(...allLeft)
  const rangeL = maxL - minL || 1
  const minR = Math.min(...scores), maxR = Math.max(...scores)
  const rangeR = maxR - minR || 1

  const yL = v => PAD.t + CH - ((v - minL) / rangeL) * CH
  const yR = v => PAD.t + CH - ((v - minR) / rangeR) * CH
  const polyline = (arr, yFn) => arr.map((v, i) => `${xScale(i)},${yFn(v)}`).join(' ')

  const leftTicks  = [0, 0.25, 0.5, 0.75, 1].map(f => minL + f * rangeL)
  const rightTicks = [0, 0.25, 0.5, 0.75, 1].map(f => minR + f * rangeR)

  // Deep ocean dark palette — vivid neon glow
  const BLUE     = '#38bdf8'
  const TEAL     = '#2dd4bf'
  const ORANGE   = '#fb923c'
  const RED      = '#f87171'
  const GRID     = 'rgba(96,165,250,0.12)'
  const AXIS     = '#7dd3fc'
  const AXIS_R   = '#fcd34d'

  // Build wave area path for fill
  const waveAreaPoints = `${PAD.l},${PAD.t + CH} ${polyline(waves, yL)} ${xScale(n - 1)},${PAD.t + CH}`

  return (
    <div className="lp-chart-svg-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="lp-chart-svg lp-chart-dark" onMouseLeave={() => setTooltip(null)}>
        <defs>
          <linearGradient id="chartBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#061428" />
            <stop offset="100%" stopColor="#0a1e3d" />
          </linearGradient>
          <linearGradient id="waveGradDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#1d4ed8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="windGradDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.03" />
          </linearGradient>
          <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="chartClip">
            <rect x={PAD.l} y={PAD.t} width={CW} height={CH} />
          </clipPath>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width={W} height={H} rx="12" fill="url(#chartBg)" />

        {/* Subtle grid lines */}
        {leftTicks.map((v, i) => (
          <line key={i} x1={PAD.l} y1={yL(v)} x2={W - PAD.r} y2={yL(v)}
            stroke={GRID} strokeWidth="1" />
        ))}

        {/* Vertical subtle lines for each day tick */}
        {days.map((d, i) => (
          (i === 0 || (i + 1) % 5 === 0 || i === n - 1) ? (
            <line key={i} x1={xScale(i)} y1={PAD.t} x2={xScale(i)} y2={PAD.t + CH}
              stroke="rgba(96,165,250,0.07)" strokeWidth="1" />
          ) : null
        ))}

        {/* Left axis ticks */}
        {leftTicks.map((v, i) => (
          <text key={i} x={PAD.l - 8} y={yL(v) + 4} fontSize="10" fill={AXIS} textAnchor="end" fontFamily="'IBM Plex Mono', monospace">
            {v.toFixed(1)}
          </text>
        ))}

        {/* Right axis ticks */}
        {rightTicks.map((v, i) => (
          <text key={i} x={W - PAD.r + 8} y={yR(v) + 4} fontSize="10" fill={AXIS_R} textAnchor="start" fontFamily="'IBM Plex Mono', monospace">
            {v.toFixed(1)}
          </text>
        ))}

        {/* Axis labels */}
        <text x={14} y={PAD.t + CH / 2} fontSize="9" fill={AXIS} textAnchor="middle"
          transform={`rotate(-90, 14, ${PAD.t + CH / 2})`} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.08em">Wave / Wind</text>
        <text x={W - 12} y={PAD.t + CH / 2} fontSize="9" fill={AXIS_R} textAnchor="middle"
          transform={`rotate(90, ${W - 12}, ${PAD.t + CH / 2})`} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.08em">Event Score</text>

        {/* X labels */}
        {days.map((d, i) => (
          (i === 0 || (i + 1) % 5 === 0 || i === n - 1) ? (
            <text key={i} x={xScale(i)} y={H - 8} fontSize="10" fill={AXIS} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace">
              Day {d.day ?? i + 1}
            </text>
          ) : null
        ))}

        {/* Clipped chart area */}
        <g clipPath="url(#chartClip)">
          {/* Wave area fill */}
          <polygon points={waveAreaPoints} fill="url(#waveGradDark)" />

          {/* Wind dashed area hint */}
          <polyline points={polyline(winds, yL)}
            fill="none" stroke={TEAL} strokeWidth="2" strokeDasharray="6 4" strokeOpacity="0.75"
            filter="url(#glowBlue)" />

          {/* Wave line — glowing */}
          <polyline points={polyline(waves, yL)}
            fill="none" stroke={BLUE} strokeWidth="2.5"
            filter="url(#glowBlue)" />

          {/* Wave dots */}
          {days.map((d, i) => (
            <circle key={i} cx={xScale(i)} cy={yL(waves[i])} r="3.5"
              fill={BLUE} stroke="rgba(6,20,60,0.9)" strokeWidth="1.5"
              filter="url(#glowBlue)" />
          ))}

          {/* Event score line */}
          <polyline points={polyline(scores, yR)}
            fill="none" stroke={ORANGE} strokeWidth="2.2" strokeDasharray="8 4"
            filter="url(#glowBlue)" />

          {/* Spike markers */}
          {days.map((d, i) => {
            const isSpike = d.isSpike === true || d.isSpike === 'true' || d.isSpike === 1
            if (!isSpike) return null
            return (
              <g key={i} filter="url(#glowRed)">
                <circle cx={xScale(i)} cy={yR(scores[i])} r="14"
                  fill="rgba(248,113,113,0.08)" stroke="rgba(248,113,113,0.35)" strokeWidth="1.5" />
                <circle cx={xScale(i)} cy={yR(scores[i])} r="5.5" fill={RED}
                  stroke="rgba(6,20,60,0.95)" strokeWidth="2" />
                <line x1={xScale(i)} y1={PAD.t + 4} x2={xScale(i)} y2={yR(scores[i]) - 16}
                  stroke="rgba(248,113,113,0.3)" strokeWidth="1" strokeDasharray="3 2" />
                <text x={xScale(i)} y={yR(scores[i]) - 20} fontSize="9" fill={RED}
                  textAnchor="middle" fontWeight="bold" fontFamily="'IBM Plex Mono', monospace">
                  ⚡ Day {d.day ?? i + 1}
                </text>
              </g>
            )
          })}

          {/* Hover strips */}
          {days.map((d, i) => (
            <rect key={i}
              x={xScale(i) - (CW / n) * 0.5} y={PAD.t}
              width={CW / n} height={CH}
              fill="transparent"
              onMouseEnter={() => setTooltip({ d, i })}
            />
          ))}
        </g>

        {/* Border rect */}
        <rect x={PAD.l} y={PAD.t} width={CW} height={CH}
          fill="none" stroke="rgba(96,165,250,0.15)" strokeWidth="1" rx="2" />

        {/* Tooltip */}
        {tooltip && (() => {
          const { d, i } = tooltip
          const tx = Math.min(Math.max(xScale(i), 90), W - 90)
          const ty = Math.max(yL(waves[i]) - 76, PAD.t + 4)
          return (
            <g>
              <line x1={xScale(i)} y1={PAD.t} x2={xScale(i)} y2={PAD.t + CH}
                stroke="rgba(56,189,248,0.3)" strokeWidth="1.5" strokeDasharray="4 3" />
              <rect x={tx - 80} y={ty} width="160" height="68" rx="10"
                fill="rgba(6,20,60,0.97)" stroke="rgba(56,189,248,0.4)" strokeWidth="1.5"
                style={{ filter: 'drop-shadow(0 6px 20px rgba(6,20,60,0.6))' }} />
              <text x={tx} y={ty + 18} fontSize="11" fill={BLUE} textAnchor="middle" fontWeight="bold" fontFamily="'IBM Plex Mono', monospace">
                Day {d.day ?? i + 1}{d.date ? ` · ${d.date}` : ''}
              </text>
              <text x={tx} y={ty + 36} fontSize="10.5" fill="#93c5fd" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace">
                Wave: {Number(d.waveHeight ?? 0).toFixed(2)}m  Wind: {Number(d.windSpeed ?? 0).toFixed(2)}m/s
              </text>
              <text x={tx} y={ty + 54} fontSize="10.5" fill={ORANGE} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace">
                Score: {Number(d.eventScore ?? 0).toFixed(2)}{d.isSpike ? '  ⚡ SPIKE' : ''}
              </text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}
