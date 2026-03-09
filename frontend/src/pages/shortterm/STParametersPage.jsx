// STParametersPage.jsx — Integrated + UI improvements merged
import { useState } from 'react'
import { ChevronLeft, Calendar, Info, Target, Zap, RefreshCw } from 'lucide-react'

export default function STParametersPage({ onBack, onGenerateForecast, loading }) {
  // ✅ NEW: Default to TODAY (was +30 days in integrated version)
  const todayIso = new Date().toISOString().split('T')[0]
  const [forecastDate, setForecastDate] = useState(todayIso)
  const [error, setError] = useState('')

  // ✅ NEW: min date is today (was tomorrow in integrated version)
  const minDate = todayIso
  const maxDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const validate = () => {
    setError('')
    if (!forecastDate) { setError('Please select a forecast date'); return false }
    const selected = new Date(forecastDate)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    // ✅ NEW: allow today (>= not just >)
    if (selected < today) { setError('Forecast date must be today or in the future'); return false }
    const daysAhead = Math.floor((selected - today) / 86400000)
    if (daysAhead > 365) { setError('Forecast date must be within 1 year from today'); return false }
    return true
  }

  const handleQuickForecast = () => { if (!validate()) return; onGenerateForecast({ forecastDate, mode: 'quick' }) }
  const handleFullRerun = () => { if (!validate()) return; onGenerateForecast({ forecastDate, mode: 'full' }) }

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const daysAhead = forecastDate
    ? Math.max(0, Math.floor((new Date(forecastDate) - today) / 86400000))
    : 0

  // ✅ NEW: Added "Today" preset (0 days)
  const presets = [
    { label: 'Today',    days: 0   },
    { label: '30 Days',  days: 30  },
    { label: '3 Months', days: 90  },
    { label: '6 Months', days: 180 },
    { label: '1 Year',   days: 365 },
  ]

  // ✅ NEW: confidence includes today = 97
  const confidence = daysAhead === 0 ? 97 : daysAhead < 30 ? 92 : daysAhead < 90 ? 75 : daysAhead < 180 ? 58 : 40
  const riskLevel  = daysAhead < 45 ? 'HIGH' : daysAhead < 120 ? 'MEDIUM' : 'LOW'

  // ✅ NEW: Ocean-tone ring colours (cyan for high, amber for medium, red for low)
  const ringColor = confidence >= 80 ? '#099f4f' : confidence >= 55 ? '#c0831a' : '#e93d3d'
  const ringGlow  = confidence >= 80 ? 'rgba(34,211,238,0.6)' : confidence >= 55 ? 'rgba(245,158,11,0.5)' : 'rgba(248,113,113,0.5)'
  const tier      = confidence >= 80 ? 'EXCELLENT' : confidence >= 55 ? 'MODERATE' : 'LOW'
  const tierColor = confidence >= 80 ? '#059818' : confidence >= 55 ? '#a4810c' : '#e83030'
  const riskColor = { HIGH: '#0ec05e', MEDIUM: '#ae8212', LOW: '#cb1515' }[riskLevel]

  return (
    <div className="pp-root">
      <div className="pp-bg" />

      <div className="pp-inner">
        <button className="pp-back" onClick={onBack}>
          <ChevronLeft size={16} /> Back to Dashboard
        </button>

        <div className="pp-header">
          <div className="pp-header-tag"><Target size={13} /> FORECAST CONFIGURATION</div>
          <h1 className="pp-title">Set Forecast Parameters</h1>
          <p className="pp-subtitle">Configure your shoreline erosion prediction target</p>
        </div>

        <div className="pp-cols">

          {/* Left: Date picker */}
          <div className="pp-card">
            <div className="pp-card-hdr">
              <Calendar size={20} className="pp-card-icon" />
              <div>
                <h2>Target Forecast Date</h2>
                {/* ✅ NEW: updated description */}
                <p>Select today or any date up to 1 year ahead</p>
              </div>
            </div>

            <div className="pp-date-group">
              <label htmlFor="forecastDate">Forecast Date</label>
              <div className="pp-date-wrap">
                <input
                  id="forecastDate"
                  type="date"
                  value={forecastDate}
                  onChange={e => setForecastDate(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  required
                  className="pp-date-input"
                />
              </div>
              <div className="pp-days-badge">
                <span className="pp-days-num">{daysAhead}</span>
                {/* ✅ NEW: shows "days (today)" when 0 */}
                <span>{daysAhead === 0 ? 'days (today)' : `day${daysAhead !== 1 ? 's' : ''} from today`}</span>
              </div>
            </div>

            {/* Quick presets — ✅ NEW: includes Today preset */}
            <div className="pp-presets-group">
              <label>Quick Select</label>
              <div className="pp-presets">
                {presets.map(p => {
                  const d = new Date(); d.setDate(d.getDate() + p.days)
                  const iso = d.toISOString().split('T')[0]
                  return (
                    <button
                      key={p.days}
                      type="button"
                      className={`pp-preset ${forecastDate === iso ? 'active' : ''}`}
                      onClick={() => setForecastDate(iso)}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Progress bar */}
            <div className="pp-timeline-bar">
              <div className="pp-timeline-track">
                <div className="pp-timeline-fill" style={{ width: `${Math.min(100, (daysAhead / 365) * 100)}%` }} />
                <div className="pp-timeline-thumb" style={{ left: `${Math.min(100, (daysAhead / 365) * 100)}%` }} />
              </div>
              <div className="pp-timeline-labels">
                <span>Today</span><span>3 Mo</span><span>6 Mo</span><span>1 Year</span>
              </div>
            </div>
          </div>

          {/* Right col */}
          <div className="pp-right-col">

            {/* ── FORECAST QUALITY CARD — ✅ NEW: deep ocean redesign ── */}
            <div className="pp-metric-card pp-metric-card-ocean">
              <div className="pp-metric-card-ocean-bg" />

              <div className="pp-fq-header">
                <span className="pp-fq-label">FORECAST QUALITY</span>
                <span className="pp-fq-tier" style={{ color: tierColor, borderColor: tierColor, background: `${tierColor}14` }}>
                  {tier}
                </span>
              </div>

              {/* ✅ NEW: Larger ring (140×140 viewBox) with ocean tones */}
              <div className="pp-confidence-ring-wrap">
                <svg viewBox="0 0 140 140" className="pp-conf-ring">
                  <defs>
                    <filter id="stRingGlow">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <radialGradient id="stRingBg" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(29,101,212,0.06)" />
                      <stop offset="100%" stopColor="rgba(7,24,48,0)" />
                    </radialGradient>
                  </defs>
                  <circle cx="70" cy="70" r="65" fill="url(#stRingBg)" />
                  <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(7,24,48,0.12)" strokeWidth="12" />
                  <circle cx="70" cy="70" r="54" fill="none"
                    stroke={ringColor} strokeWidth="12"
                    strokeDasharray={`${(confidence / 100) * 339} 339`}
                    strokeLinecap="round"
                    transform="rotate(-90 70 70)"
                    filter="url(#stRingGlow)"
                    style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease' }}
                  />
                  <circle cx="70" cy="70" r="42" fill="none" stroke={`${ringColor}30`} strokeWidth="1" />
                  <text x="70" y="62" textAnchor="middle" fontSize="34" fontWeight="900"
                    fill="var(--navy)" fontFamily="'IBM Plex Mono', monospace">
                    {confidence}
                  </text>
                  <text x="70" y="76" textAnchor="middle" fontSize="11" fill="rgba(7,24,48,0.45)"
                    fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.14em">
                    PERCENT
                  </text>
                  <text x="70" y="92" textAnchor="middle" fontSize="9.5" fill="rgba(7,24,48,0.6)"
                    fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.1em" fontWeight="700">
                    CONFIDENCE
                  </text>
                </svg>

                {/* ✅ NEW: Floating stat badges */}
                <div className="pp-ring-stats">
                  <div className="pp-ring-stat" style={{ '--sc': ringColor }}>
                    <span className="pp-ring-stat-val">{daysAhead}d</span>
                    <span className="pp-ring-stat-lbl">Horizon</span>
                  </div>
                  <div className="pp-ring-stat">
                    <span className="pp-ring-stat-val" style={{ color: riskColor }}>{riskLevel}</span>
                    <span className="pp-ring-stat-lbl">Accuracy</span>
                  </div>
                </div>
              </div>

              {/* ✅ NEW: pp-fq-rows / pp-fq-row styling */}
              <div className="pp-fq-rows">
                {[
                  { k: 'Forecast horizon', v: `${daysAhead} days` },
                  { k: 'Accuracy tier',    v: riskLevel, color: riskColor },
                  { k: 'Method',           v: 'Gradient Boosting' },
                  { k: 'Transects',        v: '100 cross-shore' },
                ].map(({ k, v, color }, i) => (
                  <div className="pp-fq-row" key={i}>
                    <span className="pp-fq-key">{k}</span>
                    <span className="pp-fq-val" style={color ? { color, fontWeight: 700 } : {}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pp-info-card">
              <div className="pp-info-hdr"><Info size={16} /> How It Works</div>
              <ul className="pp-info-list">
                <li><strong>Environmental Analysis</strong> — wave energy, wind, sea level pressure, precipitation</li>
                <li><strong>Seasonal Analogues</strong> — ±15-day window over past 3 years</li>
                <li><strong>ML Prediction</strong> — Gradient Boosting across 100 transects</li>
                <li><strong>Risk Assessment</strong> — LOW (&lt;3m), MEDIUM (3–8m), HIGH (&gt;8m)</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="pp-error">
            <span>⚠</span> {error}
          </div>
        )}

        {/* ── Two run mode cards ── */}
        <div className="pp-run-modes">

          {/* ✅ NEW: Quick Forecast uses quick-outline class (white bg, blue border → fills blue on hover) */}
          <div className="pp-run-mode-card quick">
            <div className="pp-run-mode-header">
              <Zap size={22} className="pp-run-mode-icon quick" />
              <div>
                <div className="pp-run-mode-title">Quick Forecast</div>
                <div className="pp-run-mode-subtitle">~30 seconds</div>
              </div>
            </div>
            <p className="pp-run-mode-desc">
              Uses the <strong>already trained model</strong> and <strong>cached datasets</strong>.
              Skips data downloading and model retraining — runs only the prediction
              and KML generation steps for the selected date.
            </p>
            <div className="pp-run-mode-tags">
              <span className="pp-run-tag green">✓ Cached data</span>
              <span className="pp-run-tag green">✓ Pre-trained model</span>
              <span className="pp-run-tag green">✓ Fast</span>
            </div>
            <button
              className="pp-run-btn quick-outline"
              onClick={handleQuickForecast}
              disabled={loading || !forecastDate}
            >
              {loading
                ? <><span className="lp-spinner lp-spinner-blue" /> Running…</>
                : <><Zap size={17} /> Quick Forecast</>}
            </button>
          </div>

          <div className="pp-run-mode-divider">or</div>

          <div className="pp-run-mode-card full">
            <div className="pp-run-mode-header">
              <RefreshCw size={22} className="pp-run-mode-icon full" />
              <div>
                <div className="pp-run-mode-title">Full Rerun</div>
                <div className="pp-run-mode-subtitle">2–5 minutes</div>
              </div>
            </div>
            <p className="pp-run-mode-desc">
              Downloads the <strong>latest ERA5 &amp; CMEMS data</strong>, retrains the
              gradient boosting model from scratch, then runs the full forecast pipeline.
              Use this when new data has become available or you want to refresh the model.
            </p>
            <div className="pp-run-mode-tags">
              <span className="pp-run-tag orange">⟳ Fresh data download</span>
              <span className="pp-run-tag orange">⟳ Model retraining</span>
              <span className="pp-run-tag orange">⟳ Full pipeline</span>
            </div>
            <button
              className="pp-run-btn full"
              onClick={handleFullRerun}
              disabled={loading || !forecastDate}
            >
              {loading
                ? <><span className="lp-spinner" /> Running…</>
                : <><RefreshCw size={17} /> Full Rerun</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}