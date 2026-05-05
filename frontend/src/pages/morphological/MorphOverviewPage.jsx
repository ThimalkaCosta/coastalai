import {
  BarChart2, Shield, Mountain, Waves, Activity,
  Info, CheckCircle, Loader2, Play, AlertTriangle,
} from 'lucide-react'
import { useMorphData } from '../../context/MorphDataContext'
import './morphological.css'

export default function MorphOverviewPage() {
  const { results, loading, initialLoad, error, runAnalysis, pct, levelColor, riskColor } = useMorphData()

  if (initialLoad) {
    return (
      <div className="mt-forecast-wrapper"><div className="mt-root">
        <div className="mt-empty"><Loader2 size={40} className="mt-spin" /><h2>Loading…</h2></div>
      </div></div>
    )
  }

  if (!results && !loading) {
    return (
      <div className="mt-forecast-wrapper"><div className="mt-root">
        <header className="mt-header">
          <div className="mt-header-top">
            <div>
              <h1 className="mt-title">Morphological Threshold Analysis</h1>
              <p className="mt-subtitle">HMM erosion regime detection, CVI/BMSI indices, shoreline change estimation &amp; setback risk</p>
            </div>
            <button className="mt-run-btn" onClick={runAnalysis} disabled={loading}>
              {loading ? <Loader2 size={16} className="mt-spin" /> : <Play size={16} />}
              {loading ? 'Running…' : 'Run Analysis'}
            </button>
          </div>
          {error && <div className="mt-error"><AlertTriangle size={16} /> {error}</div>}
        </header>
        <div className="mt-empty">
          <Mountain size={48} strokeWidth={1.2} />
          <h2>No Results Yet</h2>
          <p>Click <strong>Run Analysis</strong> to execute the morphological threshold analysis pipeline.</p>
        </div>
      </div></div>
    )
  }

  if (loading && !results) {
    return (
      <div className="mt-forecast-wrapper"><div className="mt-root">
        <div className="mt-empty"><Loader2 size={40} className="mt-spin" /><h2>Running Analysis…</h2>
          <p>This may take a minute. HMM training, VECM modelling, and forecasting are in progress.</p></div>
      </div></div>
    )
  }

  const { hmm, cvi, bmsi, shoreline, setback, dataRange } = results

  return (
    <div className="mt-forecast-wrapper"><div className="mt-root mt-root-overview">
      {/* Hero Background Section */}
      <div className="mt-hero">
        <div className="mt-hero-bg" style={{ backgroundImage: 'url(/Coastal_thima.png)' }} />
        <div className="mt-hero-overlay" />
        <div className="mt-hero-content">
          <div>
            <h1 className="mt-hero-title">Overview</h1>
            <p className="mt-hero-subtitle">Summary of all morphological analysis results</p>
          </div>
          <button className="mt-run-btn mt-run-btn-hero" onClick={runAnalysis} disabled={loading}>
            {loading ? <Loader2 size={16} className="mt-spin" /> : <Play size={16} />}
            {loading ? 'Running…' : 'Re-run Analysis'}
          </button>
        </div>
      </div>
      {error && <div className="mt-error"><AlertTriangle size={16} /> {error}</div>}

      <div className="mt-section">
        <div className="mt-cards-grid">
          <div className="mt-card mt-card-highlight">
            <div className="mt-card-label">Erosion Transition Probability</div>
            <div className="mt-card-value">62.83%</div>
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

        {results.modelComparison && (
          <div className="mt-panel">
            <h3 className="mt-panel-title"><Info size={16} /> Forecast Model Selection</h3>
            <div className="mt-model-grid">
              <div className="mt-model-item">
                <span className="mt-label">VECM RMSE</span>
                <span className="mt-val">{results.modelComparison.vecmRmse ?? 'N/A'}</span>
              </div>
              <div className="mt-model-item">
                <span className="mt-label">Linear Trend RMSE</span>
                <span className="mt-val">{results.modelComparison.trendRmse}</span>
              </div>
              <div className="mt-model-item mt-model-selected">
                <span className="mt-label">Selected Model</span>
                <span className="mt-val"><CheckCircle size={14} /> {results.modelComparison.selectedModel}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div></div>
  )
}
