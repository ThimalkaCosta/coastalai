import { Activity, Loader2, TrendingUp } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { useMorphData } from '../../context/MorphDataContext'
import './morphological.css'

const ENV_CHART_COLORS = [
  '#2563eb', '#16a34a', '#dc2626', '#9333ea',
  '#ea580c', '#0891b2', '#d946ef', '#ca8a04', '#64748b',
]

const fmt = (v, digits = 4) => {
  if (v == null) return '—'
  const n = Number(v)
  if (n === 0) return '0'
  if (Math.abs(n) < 1e-3) return n.toExponential(digits - 1)
  return n.toFixed(digits)
}

export default function MorphErosionPage() {
  const { results, initialLoad, pct } = useMorphData()

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
        <div className="mt-empty"><Activity size={48} strokeWidth={1.2} />
          <h2>No Data</h2><p>Run the analysis from the <strong>Run Analysis</strong> page first.</p></div>
      </div></div>
    )
  }

  const { hmm } = results

  return (
    <div className="mt-forecast-wrapper"><div className="mt-root">
      <header className="mt-header">
        <h1 className="mt-title">Erosion Analysis</h1>
        <p className="mt-subtitle">HMM regime detection, transition matrices, and threshold comparison</p>
      </header>

      <div className="mt-section">
        {/* Threshold comparison */}
        <div className="mt-panel">
          <h3 className="mt-panel-title">Current vs Erosion Threshold</h3>
          <div className="mt-table-wrap">
            <table className="mt-table">
              <thead>
                <tr><th>Variable</th><th>Current</th><th>Threshold</th><th>Gap</th></tr>
              </thead>
              <tbody>
                {hmm.thresholdComparison.map((r, i) => (
                  <tr key={i}>
                    <td>{r.variable}</td>
                    <td>{fmt(r.currentValue)}</td>
                    <td>{fmt(r.thresholdValue)}</td>
                    <td className={r.gap >= 0 ? 'mt-text-green' : 'mt-text-red'}>{fmt(r.gap)}</td>
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
                  {results.environmentalVariables.map(v => <th key={v}>{v}</th>)}
                </tr>
              </thead>
              <tbody>
                {hmm.stateMeans.map((s, i) => (
                  <tr key={i} className={s.isErosion ? 'mt-row-erosion' : ''}>
                    <td className="mt-bold">
                      {s.state}
                      {s.isErosion && <span className="mt-badge mt-badge-red" style={{ marginLeft: 6 }}>erosion</span>}
                    </td>
                    {results.environmentalVariables.map(v => (
                      <td key={v}>{fmt(s[v], 3)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Environmental variable time-series charts */}
        {results.environmentalTimeSeries && results.environmentalTimeSeries.length > 0 && (
          <div className="mt-panel">
            <h3 className="mt-panel-title"><TrendingUp size={16} /> Environmental Variables Over Time</h3>
            <div className="mt-charts-grid">
              {results.environmentalVariables.map((varName, idx) => (
                <div key={varName} className="mt-chart-card">
                  <h4 className="mt-chart-title">{varName}</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={results.environmentalTimeSeries} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="Date" stroke="#94a3b8" fontSize={11} tickLine={false}
                        interval={23} angle={-30} textAnchor="end" height={50} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false}
                        tickFormatter={v => Math.abs(v) < 1e-3 && v !== 0 ? Number(v).toExponential(1) : Number(v).toPrecision(3)} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                        formatter={v => [fmt(Number(v), 4), varName]}
                        labelFormatter={d => `Date: ${d}`}
                      />
                      <Line type="monotone" dataKey={varName}
                        stroke={ENV_CHART_COLORS[idx % ENV_CHART_COLORS.length]}
                        strokeWidth={1.5} dot={false} name={varName} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div></div>
  )
}
