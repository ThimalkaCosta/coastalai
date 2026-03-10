import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || ''

const MorphDataContext = createContext(null)

export function useMorphData() {
  return useContext(MorphDataContext)
}

export function MorphDataProvider({ children }) {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <MorphDataContext.Provider value={{
      results, loading, initialLoad, error,
      runAnalysis, riskColor, levelColor, pct,
    }}>
      {children}
    </MorphDataContext.Provider>
  )
}
