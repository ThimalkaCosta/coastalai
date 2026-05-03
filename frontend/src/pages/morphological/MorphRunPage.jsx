import { Play, Loader2, AlertTriangle, CheckCircle, Mountain } from 'lucide-react'
import { useMorphData } from '../../context/MorphDataContext'
import './morphological.css'

export default function MorphRunPage() {
  const { results, loading, error, runAnalysis } = useMorphData()

  return (
    <div className="mt-forecast-wrapper"><div className="mt-root">
      <header className="mt-header">
        <h1 className="mt-title">Run Analysis</h1>
        <p className="mt-subtitle">Execute the full morphological threshold analysis pipeline</p>
      </header>

      <div className="mt-section">
        <div className="mt-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Mountain size={56} strokeWidth={1.2} style={{ margin: '0 auto 16px', color: 'var(--mt-accent)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>
            Morphological Threshold Analysis
          </h2>
          <p style={{ color: 'var(--mt-text-dim)', marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>
            Runs HMM erosion regime detection, CVI/BMSI index computation, VECM/trend-based shoreline forecasting, and setback risk classification on the research dataset.
          </p>

          <button
            className="mt-run-btn"
            onClick={runAnalysis}
            disabled={loading}
            style={{ fontSize: '1rem', padding: '12px 32px' }}
          >
            {loading ? <Loader2 size={18} className="mt-spin" /> : <Play size={18} />}
            {loading ? 'Running Analysis…' : 'Run Analysis'}
          </button>

          {error && (
            <div className="mt-error" style={{ marginTop: 20 }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {loading && (
            <p style={{ color: 'var(--mt-text-dim)', marginTop: 16, fontSize: '0.875rem' }}>
              This may take a minute. HMM training, VECM modelling, and forecasting are in progress.
            </p>
          )}

          {!loading && results && (
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--mt-green)' }}>
              <CheckCircle size={18} />
              <span style={{ fontWeight: 600 }}>Analysis complete — results available across all sections.</span>
            </div>
          )}
        </div>
      </div>
    </div></div>
  )
}
