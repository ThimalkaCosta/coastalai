/**
 * API configuration for CoastalAI backend.
 */
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = {
  baseUrl: API_BASE_URL,

  /** POST /api/analyze – Upload files and execute notebook */
  async analyze(files) {
    const formData = new FormData()
    if (files.qgisReport) formData.append('shoreline', files.qgisReport)
    if (files.waveData) formData.append('wave', files.waveData)
    if (files.windData) formData.append('wind', files.windData)
    if (files.currentData) formData.append('current', files.currentData)

    const res = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || 'Analysis failed')
    }

    return res.json()
  },

  /** GET /api/results – Fetch latest analysis results */
  async getResults() {
    const res = await fetch(`${API_BASE_URL}/results`)
    if (!res.ok) {
      throw new Error('No analysis results available')
    }
    return res.json()
  },

  /** GET /api/health – Check backend availability */
  async health() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(3000) })
      return res.ok
    } catch {
      return false
    }
  },

  /** GET /api/analyze/status – Check analysis status */
  async status() {
    const res = await fetch(`${API_BASE_URL}/analyze/status`)
    if (!res.ok) throw new Error('Status check failed')
    return res.json()
  },

  /** DELETE /api/results – Clear all analysis results from server */
  async clearResults() {
    const res = await fetch(`${API_BASE_URL}/results`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to clear results')
    return res.json()
  },
}

export default api
