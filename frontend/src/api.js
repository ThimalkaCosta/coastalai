/**
 * API configuration for CoastalAI backend.
 */
const API_BASE_URL =
  import.meta.env.VITE_API_URL || '/api'
const FALLBACK_API_BASE_URL =
  import.meta.env.VITE_API_FALLBACK_URL || 'http://127.0.0.1:8015/api'

let runtimeApiBaseUrl = API_BASE_URL

function buildUrl(baseUrl, path) {
  return `${baseUrl}${path}`
}

function isLegacyAnalyzeValidation(detail) {
  if (!Array.isArray(detail)) return false
  const missing = new Set(
    detail
      .filter(item => item?.type === 'missing')
      .map(item => item?.loc?.[1])
  )
  return (
    missing.has('shoreline') &&
    missing.has('wave') &&
    missing.has('wind') &&
    missing.has('current')
  )
}

function formatApiError(detail, fallbackMessage) {
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const msgs = detail
      .map(item => item?.msg)
      .filter(Boolean)
    if (msgs.length > 0) return msgs.join('; ')
  }
  return fallbackMessage
}

async function fetchJson(path, options = {}) {
  const response = await fetch(buildUrl(runtimeApiBaseUrl, path), options)
  const payload = await response.json().catch(() => ({}))
  return { response, payload }
}

async function fetchJsonWithLegacyFallback(path, options = {}) {
  let primary
  try {
    primary = await fetchJson(path, options)
  } catch {
    primary = null
  }

  if (primary?.response?.ok) {
    return primary
  }

  const canRetryOnFallback =
    FALLBACK_API_BASE_URL &&
    FALLBACK_API_BASE_URL !== runtimeApiBaseUrl &&
    (
      !primary ||
      primary.response.status === 422 && isLegacyAnalyzeValidation(primary.payload?.detail)
    )

  if (!canRetryOnFallback) {
    if (primary) return primary
    throw new Error('Unable to reach backend API')
  }

  const fallbackResponse = await fetch(buildUrl(FALLBACK_API_BASE_URL, path), options)
  const fallbackPayload = await fallbackResponse.json().catch(() => ({}))
  if (fallbackResponse.ok) {
    runtimeApiBaseUrl = FALLBACK_API_BASE_URL
  }
  return { response: fallbackResponse, payload: fallbackPayload }
}

const api = {
  baseUrl: runtimeApiBaseUrl,

  /** POST /api/analyze – Execute notebook using backend notebook_data files */
  async analyze() {
    const { response, payload } = await fetchJsonWithLegacyFallback('/analyze', {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(formatApiError(payload?.detail, 'Analysis failed'))
    }

    return payload
  },

  /** GET /api/results – Fetch latest analysis results */
  async getResults() {
    const { response, payload } = await fetchJsonWithLegacyFallback('/results')
    if (!response.ok) {
      throw new Error('No analysis results available')
    }
    return payload
  },

  /** GET /api/health – Check backend availability */
  async health() {
    try {
      const res = await fetch(buildUrl(runtimeApiBaseUrl, '/health'), { signal: AbortSignal.timeout(3000) })
      if (res.ok) return true
      if (FALLBACK_API_BASE_URL && FALLBACK_API_BASE_URL !== runtimeApiBaseUrl) {
        const fallbackRes = await fetch(buildUrl(FALLBACK_API_BASE_URL, '/health'), { signal: AbortSignal.timeout(3000) })
        if (fallbackRes.ok) {
          runtimeApiBaseUrl = FALLBACK_API_BASE_URL
          return true
        }
      }
      return false
    } catch {
      return false
    }
  },

  /** GET /api/analyze/status – Check analysis status */
  async status() {
    const { response, payload } = await fetchJsonWithLegacyFallback('/analyze/status')
    if (!response.ok) throw new Error('Status check failed')
    return payload
  },

  /** DELETE /api/results – Clear all analysis results from server */
  async clearResults() {
    const { response, payload } = await fetchJsonWithLegacyFallback('/results', { method: 'DELETE' })
    if (!response.ok) throw new Error('Failed to clear results')
    return payload
  },

  /** GET /api/figures – List available notebook figures */
  async listFigures() {
    const { response, payload } = await fetchJsonWithLegacyFallback('/figures')
    if (!response.ok) return { figures: [] }
    return payload
  },

  /** GET /api/figures/{filename} – Get figure URL */
  getFigureUrl(filename) {
    return `${runtimeApiBaseUrl}/figures/${encodeURIComponent(filename)}`
  },

  /** GET /api/outputs – List available output CSV files */
  async listOutputs() {
    const { response, payload } = await fetchJsonWithLegacyFallback('/outputs')
    if (!response.ok) return { outputs: [] }
    return payload
  },

  /** GET /api/outputs/{filename} – Get output CSV as JSON */
  async getOutputCsv(filename) {
    const { response, payload } = await fetchJsonWithLegacyFallback(`/outputs/${encodeURIComponent(filename)}`)
    if (!response.ok) throw new Error(`Failed to fetch ${filename}`)
    return payload
  },

  // ── Morphological Module API ──

  /** POST /api/morphological/analyze – Upload files and execute morphological notebook */
  async morphAnalyze(files) {
    const formData = new FormData()
    if (files.events) formData.append('events', files.events)
    if (files.evaluation) formData.append('evaluation', files.evaluation)
    if (files.envFiles) {
      for (const f of files.envFiles) {
        formData.append('env_files', f)
      }
    }

    const res = await fetch(`${runtimeApiBaseUrl}/morphological/analyze`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || 'Morphological analysis failed')
    }

    return res.json()
  },

  /** GET /api/morphological/results – Fetch latest morphological results */
  async morphGetResults() {
    const res = await fetch(`${runtimeApiBaseUrl}/morphological/results`)
    if (!res.ok) {
      throw new Error('No morphological analysis results available')
    }
    return res.json()
  },

  /** GET /api/morphological/analyze/status */
  async morphStatus() {
    const res = await fetch(`${runtimeApiBaseUrl}/morphological/analyze/status`)
    if (!res.ok) throw new Error('Status check failed')
    return res.json()
  },

  /** DELETE /api/morphological/results – Clear morphological results */
  async morphClearResults() {
    const res = await fetch(`${runtimeApiBaseUrl}/morphological/results`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to clear morphological results')
    return res.json()
  },
}

export default api
