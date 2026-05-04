import { useState, useEffect, useCallback } from 'react'
import {
  Activity, BarChart2, Shield, TrendingDown,
  Play, Loader2, AlertTriangle, CheckCircle,
  Waves, Mountain, ArrowRight, Info,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || ''

const TABS = [
  { id: 'overview', label: 'Overview', icon: <BarChart2 size={15} /> },
  { id: 'erosion', label: 'Erosion Analysis', icon: <Activity size={15} /> },
  { id: 'vulnerability', label: 'Vulnerability', icon: <Mountain size={15} /> },
  { id: 'shoreline', label: 'Shoreline', icon: <Waves size={15} /> },
  { id: 'risk', label: 'Risk Assessment', icon: <Shield size={15} /> },
]

export default function MorphDashboard() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  // Try loading latest results on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/morphological/results/latest`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setResults(d) })
      .catch(() => { })
      .finally(() => setInitialLoad(false))
  }, [])

  const runAnalysis = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/morphological/run`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `${res.status} ${res.statusText}`)
      }
      setResults(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  /* ── Helpers ── */
  const riskColor = (safety) => {
    if (safety === 'Safe') return 'mt-badge-green'
    if (safety === 'Caution') return 'mt-badge-orange'
    return 'mt-badge-red'
  }

  const levelColor = (level) => {
    const l = (level || '').toLowerCase()
    if (l === 'very low' || l === 'low') return 'mt-badge-green'
    if (l === 'moderate') return 'mt-badge-orange'
    return 'mt-badge-red'
  }

  const pct = (v) => `${(v * 100).toFixed(1)}%`

  /* ── Render ── */
  return (
    <div className="mt-root">
      {/* Header */}
      <header className="mt-header">
        <div className="mt-header-top">
          <div>
            <h1 className="mt-title">Morphological Threshold Analysis</h1>
            <p className="mt-subtitle">
              HMM erosion regime detection, CVI/BMSI indices, shoreline change estimation &amp; setback risk
            </p>
          </div>
          <button
            className="mt-run-btn"
            onClick={runAnalysis}
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="mt-spin" /> : <Play size={16} />}
            {loading ? 'Running Analysis…' : 'Run Analysis'}
          </button>
        </div>

        {error && (
          <div className="mt-error">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* Tabs */}
        {results && (
          <nav className="mt-tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`mt-tab ${activeTab === t.id ? 'mt-tab-active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* Empty state */}
      {!results && !loading && !initialLoad && (
        <div className="mt-empty">
          <Mountain size={48} strokeWidth={1.2} />
          <h2>No Results Yet</h2>
          <p>Click <strong>Run Analysis</strong> to execute the morphological threshold analysis pipeline on the research dataset.</p>
        </div>
      )}

      {/* Loading */}
      {loading && !results && (
        <div className="mt-empty">
          <Loader2 size={40} className="mt-spin" />
          <h2>Running Analysis…</h2>
          <p>This may take a minute. HMM training, VECM modelling, and forecasting are in progress.</p>
        </div>
      )}

      {/* ═══════════════ RESULTS ═══════════════ */}
      {results && (
        <div className="mt-content">
          {activeTab === 'overview' && <OverviewTab data={results} pct={pct} levelColor={levelColor} riskColor={riskColor} />}
          {activeTab === 'erosion' && <ErosionTab data={results} pct={pct} />}
          {activeTab === 'vulnerability' && <VulnerabilityTab data={results} levelColor={levelColor} />}
          {activeTab === 'shoreline' && <ShorelineTab data={results} />}
          {activeTab === 'risk' && <RiskTab data={results} riskColor={riskColor} />}
        </div>
      )}
    </div>
  )
}


/* ── Overview Tab ────────────────────────────────────────────── */
function OverviewTab({ data, pct, levelColor, riskColor }) {
  const { hmm, cvi, bmsi, shoreline, setback, dataRange } = data
  return (
    <div className="mt-section">
      {/* Summary cards */}
      <div className="mt-cards-grid">
        <div className="mt-card mt-card-highlight">
          <div className="mt-card-label">Erosion Transition Probability</div>
          <div className="mt-card-value">{pct(hmm.erosionTransitionProb)}</div>
          <div className="mt-card-note">Next-month probability of entering erosion regime</div>
        </div>
        <div className="mt-card">
          <div className="mt-card-label">CVI — Current</div>
          <div className="mt-card-value">{cvi.currentValue.toFixed(2)}</div>
          <span className={`mt-badge ${levelColor(cvi.currentLevel)}`}>{cvi.currentLevel}</span>
        </div>
        <div className="mt-card">
          <div className="mt-card-label">BMSI — Current</div>
          <div className="mt-card-value">{bmsi.currentValue.toFixed(2)}</div>
          <span className={`mt-badge ${levelColor(bmsi.currentStability)}`}>{bmsi.currentStability}</span>
        </div>
        <div className="mt-card">
          <div className="mt-card-label">Shoreline Shift (2026)</div>
          <div className="mt-card-value">{shoreline.predictedShift2026.toFixed(2)} m</div>
          <div className="mt-card-note">Rate: {shoreline.erosionRate.toFixed(4)} m/yr</div>
        </div>
        <div className="mt-card">
          <div className="mt-card-label">Setback Risk</div>
          <div className="mt-card-value">{setback.safety}</div>
          <span className={`mt-badge ${riskColor(setback.safety)}`}>{setback.zone}</span>
        </div>
        <div className="mt-card">
          <div className="mt-card-label">Data Coverage</div>
          <div className="mt-card-value">{dataRange.totalRows} records</div>
          <div className="mt-card-note">{dataRange.start} — {dataRange.end}</div>
        </div>
      </div>

      {/* Model comparison */}
      {data.modelComparison && (
        <div className="mt-panel">
          <h3 className="mt-panel-title">
            <Info size={16} /> Forecast Model Selection
          </h3>
          <div className="mt-model-grid">
            <div className="mt-model-item">
              <span className="mt-label">VECM RMSE</span>
              <span className="mt-val">{data.modelComparison.vecmRmse ?? 'N/A'}</span>
            </div>
            <div className="mt-model-item">
              <span className="mt-label">Linear Trend RMSE</span>
              <span className="mt-val">{data.modelComparison.trendRmse}</span>
            </div>
            <div className="mt-model-item mt-model-selected">
              <span className="mt-label">Selected Model</span>
              <span className="mt-val">
                <CheckCircle size={14} /> {data.modelComparison.selectedModel}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


/* ── Erosion Analysis Tab ────────────────────────────────────── */
function ErosionTab({ data, pct }) {
  const { hmm } = data
  return (
    <div className="mt-section">
      {/* Stats row */}
      <div className="mt-cards-grid mt-cards-3">
        <div className="mt-card mt-card-highlight">
          <div className="mt-card-label">Erosion Transition Prob.</div>
          <div className="mt-card-value">{pct(hmm.erosionTransitionProb)}</div>
        </div>
        <div className="mt-card">
          <div className="mt-card-label">Erosion-Dominant State</div>
          <div className="mt-card-value">State {hmm.erosionState}</div>
        </div>
        <div className="mt-card">
          <div className="mt-card-label">Cycles Analysed</div>
          <div className="mt-card-value">{hmm.totalCycles} <span className="mt-dim">({hmm.erosionCycles} erosion)</span></div>
        </div>
      </div>

      {/* Threshold comparison */}
      <div className="mt-panel">
        <h3 className="mt-panel-title">Current vs Erosion Threshold</h3>
        <div className="mt-table-wrap">
          <table className="mt-table">
            <thead>
              <tr>
                <th>Variable</th>
                <th>Current</th>
                <th>Threshold</th>
                <th>Gap</th>
              </tr>
            </thead>
            <tbody>
              {hmm.thresholdComparison.map((r, i) => (
                <tr key={i}>
                  <td>{r.variable}</td>
                  <td>{r.currentValue.toFixed(4)}</td>
                  <td>{r.thresholdValue.toFixed(4)}</td>
                  <td className={r.gap >= 0 ? 'mt-text-green' : 'mt-text-red'}>{r.gap.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transition matrix */}
      <div className="mt-panel">
        <h3 className="mt-panel-title">HMM Transition Matrix</h3>
        <div className="mt-table-wrap">
          <table className="mt-table mt-table-matrix">
            <thead>
              <tr>
                <th></th>
                {hmm.transitionMatrix.map((_, i) => (
                  <th key={i}>S{i}{i === hmm.erosionState ? ' ⚠' : ''}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hmm.transitionMatrix.map((row, i) => (
                <tr key={i}>
                  <td className="mt-bold">S{i}{i === hmm.erosionState ? ' ⚠' : ''}</td>
                  {row.map((v, j) => (
                    <td key={j} className={j === hmm.erosionState ? 'mt-cell-highlight' : ''}>
                      {v.toFixed(3)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* State means */}
      <div className="mt-panel">
        <h3 className="mt-panel-title">Regime-wise Variable Profiles (Real Scale)</h3>
        <div className="mt-table-wrap">
          <table className="mt-table">
            <thead>
              <tr>
                <th>State</th>
                {data.environmentalVariables.map(v => <th key={v}>{v}</th>)}
              </tr>
            </thead>
            <tbody>
              {hmm.stateMeans.map((s, i) => (
                <tr key={i} className={s.isErosion ? 'mt-row-erosion' : ''}>
                  <td className="mt-bold">
                    {s.state}
                    {s.isErosion && <span className="mt-badge mt-badge-red" style={{ marginLeft: 6 }}>erosion</span>}
                  </td>
                  {data.environmentalVariables.map(v => (
                    <td key={v}>{s[v]?.toFixed(3)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


/* ── Vulnerability Tab (CVI + BMSI) ─────────────────────────── */
function VulnerabilityTab({ data, levelColor }) {
  const { cvi, bmsi } = data
  return (
    <div className="mt-section">
      {/* CVI */}
      <div className="mt-panel">
        <h3 className="mt-panel-title"><Mountain size={16} /> Coastal Vulnerability Index (CVI)</h3>
        <div className="mt-idx-grid">
          <div className="mt-idx-card">
            <div className="mt-idx-header">Current ({cvi.latestYear})</div>
            <div className="mt-idx-value">{cvi.currentValue.toFixed(3)}</div>
            <span className={`mt-badge ${levelColor(cvi.currentLevel)}`}>{cvi.currentLevel}</span>
          </div>
          <div className="mt-idx-arrow"><ArrowRight size={24} /></div>
          <div className="mt-idx-card mt-idx-forecast">
            <div className="mt-idx-header">Forecast ({cvi.forecastYear})</div>
            <div className="mt-idx-value">{cvi.forecastValue.toFixed(3)}</div>
            <span className={`mt-badge ${levelColor(cvi.forecastLevel)}`}>{cvi.forecastLevel}</span>
          </div>
        </div>
        <div className="mt-idx-bounds">
          Bounds: {cvi.lowerBound.toFixed(3)} — {cvi.upperBound.toFixed(3)}
          <span className="mt-dim"> (lower = less vulnerable)</span>
        </div>
        <p className="mt-hint">CVI ranking: lower metric values receive higher vulnerability ranks (4,3,2,1). Index = √(∏ranks / n).</p>
      </div>

      {/* BMSI */}
      <div className="mt-panel">
        <h3 className="mt-panel-title"><Waves size={16} /> Beach Morphological Stability Index (BMSI)</h3>
        <div className="mt-idx-grid">
          <div className="mt-idx-card">
            <div className="mt-idx-header">Current ({cvi.latestYear})</div>
            <div className="mt-idx-value">{bmsi.currentValue.toFixed(3)}</div>
            <span className={`mt-badge ${levelColor(bmsi.currentStability)}`}>{bmsi.currentStability}</span>
          </div>
          <div className="mt-idx-arrow"><ArrowRight size={24} /></div>
          <div className="mt-idx-card mt-idx-forecast">
            <div className="mt-idx-header">Forecast ({cvi.forecastYear})</div>
            <div className="mt-idx-value">{bmsi.forecastValue.toFixed(3)}</div>
            <span className={`mt-badge ${levelColor(bmsi.forecastStability)}`}>{bmsi.forecastStability}</span>
          </div>
        </div>
        <div className="mt-idx-bounds">
          Bounds: {bmsi.lowerBound.toFixed(3)} — {bmsi.upperBound.toFixed(3)}
        </div>
        <p className="mt-hint">BMSI uses mixed ranking: Elevation AVG/Gain &amp; Slope Up are ascending (1→4), Elevation Loss &amp; Slope Down are inverted (4→1).</p>
      </div>

      {/* ADF stationarity results */}
      {data.modelComparison?.adfResults && (
        <div className="mt-panel">
          <h3 className="mt-panel-title">ADF Stationarity Tests</h3>
          <div className="mt-table-wrap">
            <table className="mt-table">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>ADF Statistic</th>
                  <th>p-value</th>
                  <th>Stationary?</th>
                </tr>
              </thead>
              <tbody>
                {data.modelComparison.adfResults.map((r, i) => (
                  <tr key={i}>
                    <td>{r.variable}</td>
                    <td>{r.adfStatistic.toFixed(4)}</td>
                    <td>{r.pValue.toFixed(4)}</td>
                    <td>
                      {r.stationary
                        ? <span className="mt-text-green"><CheckCircle size={14} /> Yes</span>
                        : <span className="mt-text-red"><AlertTriangle size={14} /> No</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}


/* ── Shoreline Tab ───────────────────────────────────────────── */
function ShorelineTab({ data }) {
  const { shoreline } = data
  const shifts = shoreline.historicalShifts || []

  // Simple SVG chart
  const chartW = 700, chartH = 280, padL = 60, padR = 30, padT = 20, padB = 40
  const plotW = chartW - padL - padR
  const plotH = chartH - padT - padB

  const yVals = shifts.map(s => s.shift)
  const yMin = Math.min(0, ...yVals, shoreline.predictedShift2026) * 1.15
  const yMax = Math.max(0, ...yVals, shoreline.predictedShift2026) * 1.15
  const xMin = shifts.length ? shifts[0].year : 2015
  const xMax = 2026

  const scaleX = (yr) => padL + ((yr - xMin) / (xMax - xMin)) * plotW
  const scaleY = (v) => padT + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH

  const linePath = shifts.map((s, i) =>
    `${i === 0 ? 'M' : 'L'}${scaleX(s.year).toFixed(1)},${scaleY(s.shift).toFixed(1)}`
  ).join(' ')

  return (
    <div className="mt-section">
      <div className="mt-cards-grid mt-cards-3">
        <div className="mt-card mt-card-highlight">
          <div className="mt-card-label">Predicted Shift (2026)</div>
          <div className="mt-card-value">{shoreline.predictedShift2026.toFixed(3)} m</div>
        </div>
        <div className="mt-card">
          <div className="mt-card-label">Erosion Rate</div>
          <div className="mt-card-value">{shoreline.erosionRate.toFixed(4)} m/yr</div>
        </div>
        <div className="mt-card">
          <div className="mt-card-label">Historical Data Points</div>
          <div className="mt-card-value">{shifts.length} years</div>
        </div>
      </div>

      {/* SVG chart */}
      <div className="mt-panel">
        <h3 className="mt-panel-title"><TrendingDown size={16} /> Shoreline Change Over Time</h3>
        <div className="mt-chart-wrap">
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="mt-chart">
            {/* zero line */}
            <line x1={padL} y1={scaleY(0)} x2={chartW - padR} y2={scaleY(0)}
              stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="1" />
            {/* y-axis labels */}
            {[yMin, yMin + (yMax - yMin) / 2, yMax].map((v, i) => (
              <text key={i} x={padL - 8} y={scaleY(v) + 4} textAnchor="end" className="mt-chart-label">
                {v.toFixed(1)}
              </text>
            ))}
            {/* x-axis labels */}
            {shifts.map(s => (
              <text key={s.year} x={scaleX(s.year)} y={chartH - 8} textAnchor="middle" className="mt-chart-label">
                {s.year}
              </text>
            ))}
            <text x={scaleX(2026)} y={chartH - 8} textAnchor="middle" className="mt-chart-label mt-chart-label-fc">
              2026
            </text>
            {/* historical line */}
            <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.5" />
            {/* dots */}
            {shifts.map(s => (
              <circle key={s.year} cx={scaleX(s.year)} cy={scaleY(s.shift)} r="4" fill="#2563eb" />
            ))}
            {/* forecast point */}
            <circle cx={scaleX(2026)} cy={scaleY(shoreline.predictedShift2026)} r="6"
              fill="#dc2626" stroke="#fff" strokeWidth="2" />
            {/* dashed line to forecast */}
            {shifts.length > 0 && (
              <line
                x1={scaleX(shifts[shifts.length - 1].year)}
                y1={scaleY(shifts[shifts.length - 1].shift)}
                x2={scaleX(2026)}
                y2={scaleY(shoreline.predictedShift2026)}
                stroke="#dc2626" strokeDasharray="6 3" strokeWidth="1.5"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Table */}
      <div className="mt-panel">
        <h3 className="mt-panel-title">Historical Shoreline Shifts</h3>
        <div className="mt-table-wrap">
          <table className="mt-table">
            <thead>
              <tr><th>Year</th><th>Net Elev. Change (m)</th><th>Mean Slope</th><th>Estimated Shift (m)</th></tr>
            </thead>
            <tbody>
              {shifts.map((s, i) => (
                <tr key={i}>
                  <td>{s.year}</td>
                  <td>{s.netElevationChange.toFixed(4)}</td>
                  <td>{s.meanSlope.toFixed(4)}</td>
                  <td className={s.shift < 0 ? 'mt-text-red' : 'mt-text-green'}>{s.shift.toFixed(4)}</td>
                </tr>
              ))}
              <tr className="mt-row-forecast">
                <td className="mt-bold">2026 (forecast)</td>
                <td>—</td>
                <td>—</td>
                <td className={shoreline.predictedShift2026 < 0 ? 'mt-text-red' : 'mt-text-green'}>
                  {shoreline.predictedShift2026.toFixed(4)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


/* ── Risk Assessment Tab ─────────────────────────────────────── */
function RiskTab({ data, riskColor }) {
  const { setback, cvi, shoreline } = data

  const ZONE_TABLE = [
    { level: 'very low', reservation: 15, restricted: 30 },
    { level: 'low', reservation: 20, restricted: 30 },
    { level: 'moderate', reservation: 20, restricted: 35 },
    { level: 'high', reservation: 25, restricted: 35 },
  ]

  return (
    <div className="mt-section">
      {/* Main risk card */}
      <div className="mt-risk-hero">
        <div className={`mt-risk-status ${riskColor(setback.safety)}`}>
          <Shield size={32} />
          <div>
            <div className="mt-risk-safety">{setback.safety}</div>
            <div className="mt-risk-zone">{setback.zone}</div>
          </div>
        </div>
      </div>

      <div className="mt-cards-grid mt-cards-4">
        <div className="mt-card">
          <div className="mt-card-label">CVI Level Used</div>
          <div className="mt-card-value">{setback.cviLevel}</div>
        </div>
        <div className="mt-card">
          <div className="mt-card-label">Predicted Retreat</div>
          <div className="mt-card-value">{setback.predictedRetreat.toFixed(2)} m</div>
        </div>
        <div className="mt-card">
          <div className="mt-card-label">Reservation Distance</div>
          <div className="mt-card-value">{setback.reservationDistance} m</div>
        </div>
        <div className="mt-card">
          <div className="mt-card-label">Restricted Distance</div>
          <div className="mt-card-value">{setback.restrictedDistance} m</div>
        </div>
      </div>

      {/* Setback reference table */}
      <div className="mt-panel">
        <h3 className="mt-panel-title">Setback Distance Reference</h3>
        <div className="mt-table-wrap">
          <table className="mt-table">
            <thead>
              <tr><th>CVI Level</th><th>Reservation (m)</th><th>Restricted (m)</th></tr>
            </thead>
            <tbody>
              {ZONE_TABLE.map((r, i) => (
                <tr key={i} className={r.level === setback.cviLevel ? 'mt-row-active' : ''}>
                  <td>{r.level}</td>
                  <td>{r.reservation}</td>
                  <td>{r.restricted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision logic */}
      <div className="mt-panel">
        <h3 className="mt-panel-title">Zone Classification Logic</h3>
        <ul className="mt-logic-list">
          <li className={setback.safety === 'Safe' ? 'mt-logic-active' : ''}>
            <CheckCircle size={14} /> If predicted retreat ≤ reservation distance → <strong>Safe</strong> (No Build Zone)
          </li>
          <li className={setback.safety === 'Caution' ? 'mt-logic-active' : ''}>
            <AlertTriangle size={14} /> If predicted retreat ≤ restricted distance → <strong>Caution</strong> (Soft Development Zone)
          </li>
          <li className={setback.safety === 'High Risk' ? 'mt-logic-active' : ''}>
            <AlertTriangle size={14} /> If predicted retreat &gt; restricted distance → <strong>High Risk</strong> (Beyond Restricted Area)
          </li>
        </ul>
      </div>
    </div>
  )
}
