import { TrendingDown, Waves, Loader2 } from 'lucide-react'
import { useMorphData } from '../../context/MorphDataContext'
import './morphological.css'

export default function MorphShorelinePage() {
  const { results, initialLoad } = useMorphData()

  if (initialLoad) {
    return (
      <div className="mt-forecast-wrapper"><div className="mt-root">
        <div className="mt-empty"><Loader2 size={40} className="mt-spin" /><h2>Loading…</h2></div>
      </div></div>
    )
  }

  if (!results) {
    return (
      <div className="mt-forecast-wrapper"><div className="mt-root">
        <div className="mt-empty"><Waves size={48} strokeWidth={1.2} />
          <h2>No Data</h2><p>Run the analysis from the <strong>Run Analysis</strong> page first.</p></div>
      </div></div>
    )
  }

  const { shoreline } = results
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
    <div className="mt-forecast-wrapper"><div className="mt-root">
      <header className="mt-header">
        <h1 className="mt-title">Shoreline Change</h1>
        <p className="mt-subtitle">Historical shoreline shifts and 2026 forecast</p>
      </header>

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
    </div></div>
  )
}
