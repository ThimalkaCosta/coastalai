import { Activity, Loader2 } from 'lucide-react'
import { useMorphData } from '../../context/MorphDataContext'
import './morphological.css'

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
        {/* Stats row */}
        <div className="mt-cards-grid mt-cards-3">
          <div className="mt-card mt-card-highlight">
            <div className="mt-card-label">Erosion Transition Prob.</div>
            <div className="mt-card-value">62.83%</div>
          </div>
          <div className="mt-card">
            <div className="mt-card-label">Erosion-Dominant State</div>
            <div className="mt-card-value">State 4</div>
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
                <tr><th>Variable</th><th>Current</th><th>Threshold</th><th>Gap</th></tr>
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
                      <td key={v}>{s[v]?.toFixed(3)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div></div>
  )
}
