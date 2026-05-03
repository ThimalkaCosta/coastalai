import { Shield, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { useMorphData } from '../../context/MorphDataContext'
import './morphological.css'

export default function MorphRiskPage() {
  const { results, initialLoad, riskColor } = useMorphData()

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
        <div className="mt-empty"><Shield size={48} strokeWidth={1.2} />
          <h2>No Data</h2><p>Run the analysis from the <strong>Run Analysis</strong> page first.</p></div>
      </div></div>
    )
  }

  const { setback } = results

  const ZONE_TABLE = [
    { level: 'very low', reservation: 15, restricted: 30 },
    { level: 'low', reservation: 20, restricted: 30 },
    { level: 'moderate', reservation: 20, restricted: 35 },
    { level: 'high', reservation: 25, restricted: 35 },
  ]

  return (
    <div className="mt-forecast-wrapper"><div className="mt-root">
      <header className="mt-header">
        <h1 className="mt-title">Risk Assessment</h1>
        <p className="mt-subtitle">Setback distance evaluation and zone classification</p>
      </header>

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
    </div></div>
  )
}
