//ParametersPage.jsx — Enhanced with blue buttons & improved Forecast Quality card
import { useState } from 'react'
import { ChevronLeft, Calendar, Play, Info, Target, Zap, RefreshCw } from 'lucide-react'

export default function STParametersPage({ onBack, onGenerateForecast, loading }) {
  const [forecastDate, setForecastDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [error, setError] = useState('')

  const minDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const maxDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const validate = () => {
    setError('')
    if (!forecastDate) { setError('Please select a forecast date'); return false }
    const selected = new Date(forecastDate)
    const today = new Date(); today.setHours(0,0,0,0)
    if (selected <= today) { setError('Forecast date must be in the future'); return false }
    const daysAhead = Math.floor((selected - today) / 86400000)
    if (daysAhead > 365) { setError('Forecast date must be within 1 year from today'); return false }
    return true
  }

  const handleQuickForecast = () => {
    if (!validate()) return
    onGenerateForecast({ forecastDate, mode: 'quick' })
  }

  const handleFullRerun = () => {
    if (!validate()) return
    onGenerateForecast({ forecastDate, mode: 'full' })
  }

  const today = new Date(); today.setHours(0,0,0,0)
  const daysAhead = forecastDate
    ? Math.max(0, Math.floor((new Date(forecastDate) - today) / 86400000))
    : 0

  const presets = [
    { label: '30 Days', days: 30 },
    { label: '60 Days', days: 60 },
    { label: '3 Months', days: 90 },
    { label: '6 Months', days: 180 },
    { label: '1 Year', days: 365 },
  ]

  const riskLevel = daysAhead < 45 ? 'HIGH' : daysAhead < 120 ? 'MEDIUM' : 'LOW'
  const confidence = daysAhead < 30 ? 92 : daysAhead < 90 ? 75 : daysAhead < 180 ? 58 : 40

  // Color scheme: green=high confidence, yellow=medium, red=low
  const confidenceColor = confidence >= 75 ? '#22d3a0' : confidence >= 50 ? '#fbbf24' : '#f87171'
  const confidenceBg = confidence >= 75
    ? 'rgba(34,211,160,0.15)'
    : confidence >= 50
    ? 'rgba(251,191,36,0.15)'
    : 'rgba(248,113,113,0.15)'
  const confidenceBorder = confidence >= 75
    ? 'rgba(34,211,160,0.4)'
    : confidence >= 50
    ? 'rgba(251,191,36,0.4)'
    : 'rgba(248,113,113,0.4)'
  const confidenceLabel = confidence >= 75 ? 'HIGH ACCURACY' : confidence >= 50 ? 'MODERATE' : 'LOW ACCURACY'
  const riskColor = { HIGH: '#f87171', MEDIUM: '#fbbf24', LOW: '#22d3a0' }[riskLevel]

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
                <p>Select a date 1–365 days from today</p>
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
              {daysAhead > 0 && (
                <div className="pp-days-badge">
                  <span className="pp-days-num">{daysAhead}</span>
                  <span>day{daysAhead !== 1 ? 's' : ''} from today</span>
                </div>
              )}
            </div>

            {/* Quick presets */}
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

          {/* Right: Forecast metrics */}
          <div className="pp-right-col">
            {/* ── Forecast Quality Card — deep ocean blue ── */}
            <div className="pp-metric-card pp-metric-card-ocean">
              <div className="pp-metric-card-ocean-bg" />
              <h3>Forecast Quality</h3>

              <div className="pp-confidence-ring-wrap">
                <svg viewBox="0 0 120 120" className="pp-conf-ring">
                  {/* Background glow circle */}
                  <circle cx="60" cy="60" r="50" fill="none"
                    stroke="rgba(56,189,248,0.08)" strokeWidth="10" />
                  {/* Track */}
                  <circle cx="60" cy="60" r="50" fill="none"
                    stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                  {/* Progress arc */}
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={confidenceColor} strokeWidth="10"
                    strokeDasharray={`${(confidence / 100) * 314} 314`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{
                      transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease',
                      filter: `drop-shadow(0 0 8px ${confidenceColor})`
                    }}
                  />
                  {/* Center percentage */}
                  <text x="60" y="54" textAnchor="middle" fontSize="28" fontWeight="900"
                    fill={confidenceColor} fontFamily="'IBM Plex Mono', monospace"
                    style={{ filter: `drop-shadow(0 0 6px ${confidenceColor})` }}>
                    {confidence}%
                  </text>
                  <text x="60" y="70" textAnchor="middle" fontSize="9" fill="rgba(186,230,253,0.7)"
                    fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.1em">
                    confidence
                  </text>
                  {/* Accuracy label */}
                  <text x="60" y="84" textAnchor="middle" fontSize="8" fill={confidenceColor}
                    fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.08em" fontWeight="700">
                    {confidenceLabel}
                  </text>
                </svg>
              </div>

              <div className="pp-metric-rows pp-metric-rows-ocean">
                <div className="pp-metric-row">
                  <span>Forecast horizon</span>
                  <span className="pp-metric-val-ocean">{daysAhead} days</span>
                </div>
                <div className="pp-metric-row">
                  <span>Accuracy tier</span>
                  <span style={{ color: riskColor, fontWeight: 700 }}>{riskLevel}</span>
                </div>
                <div className="pp-metric-row">
                  <span>Method</span>
                  <span className="pp-metric-val-ocean">Gradient Boosting</span>
                </div>
                <div className="pp-metric-row">
                  <span>Transects</span>
                  <span className="pp-metric-val-ocean">100 cross-shore</span>
                </div>
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
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* ── Two run mode buttons ── */}
        <div className="pp-run-modes">
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
              className="pp-run-btn quick"
              onClick={handleQuickForecast}
              disabled={loading || !forecastDate}
            >
              {loading
                ? <><span className="lp-spinner" /> Running…</>
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

function AlertTriangle({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}
