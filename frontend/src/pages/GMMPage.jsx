import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Layers,
  Waves,
  Wind,
  Droplets,
  Info,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import Tabs from '../components/common/Tabs'
import StateDistributionChart from '../components/charts/StateDistributionChart'
import { useData } from '../context/DataContext'

// Color palette for dynamic states
const STATE_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#f97316', // orange
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#22c55e', // green
  '#ec4899', // pink
]

const STATE_BG_CLASSES = [
  { bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-900', text: 'text-blue-700', accent: 'text-blue-600', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
  { bg: 'bg-red-50', border: 'border-red-200', title: 'text-red-900', text: 'text-red-700', accent: 'text-red-600', dot: 'bg-red-500', badge: 'bg-red-100 text-red-700' },
  { bg: 'bg-orange-50', border: 'border-orange-200', title: 'text-orange-900', text: 'text-orange-700', accent: 'text-orange-600', dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700' },
  { bg: 'bg-violet-50', border: 'border-violet-200', title: 'text-violet-900', text: 'text-violet-700', accent: 'text-violet-600', dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', title: 'text-cyan-900', text: 'text-cyan-700', accent: 'text-cyan-600', dot: 'bg-cyan-500', badge: 'bg-cyan-100 text-cyan-700' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', title: 'text-emerald-900', text: 'text-emerald-700', accent: 'text-emerald-600', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  { bg: 'bg-pink-50', border: 'border-pink-200', title: 'text-pink-900', text: 'text-pink-700', accent: 'text-pink-600', dot: 'bg-pink-500', badge: 'bg-pink-100 text-pink-700' },
]

const FEATURE_DESCRIPTIONS = {
  Hm0_max: 'Maximum significant wave height',
  Hm0_mean: 'Mean significant wave height',
  CumWaveEnergy: 'Cumulative wave energy',
  StormDays_wave: 'Number of storm wave days',
  WindMax: 'Maximum wind speed',
  WindMean: 'Mean wind speed',
  WindStressMean: 'Mean wind stress',
  UcurrMax: 'Maximum ocean current velocity',
  UcurrMean: 'Mean ocean current velocity',
  CumCurrent: 'Cumulative current transport',
  month: 'Month of year',
}

const FEATURE_UNITS = {
  Hm0_max: 'm',
  Hm0_mean: 'm',
  CumWaveEnergy: 'J/m',
  StormDays_wave: 'days',
  WindMax: 'm/s',
  WindMean: 'm/s',
  WindStressMean: 'N/m²',
  UcurrMax: 'm/s',
  UcurrMean: 'm/s',
  CumCurrent: 'm²/s',
  month: '',
}

// Get prominent icon for a feature
function getFeatureIcon(feature) {
  if (feature.toLowerCase().includes('hm0') || feature.toLowerCase().includes('wave') || feature.toLowerCase().includes('storm')) return Waves
  if (feature.toLowerCase().includes('wind')) return Wind
  if (feature.toLowerCase().includes('curr')) return Droplets
  return Layers
}

export default function GMMPage() {
  const { data } = useData()
  const [activeTab, setActiveTab] = useState('distribution')

  // ── State distribution data (dynamic) ──
  const stateDistribution = useMemo(() => {
    return data.models?.gmm?.stateDistribution || []
  }, [data])

  // ── State centroids (all states, all features) ──
  const stateCentroids = useMemo(() => {
    return data.models?.gmm?.stateCentroids || {}
  }, [data])

  // ── Component selection (BIC/AIC) ──
  const componentSelection = useMemo(() => {
    return data.models?.gmm?.componentSelection || []
  }, [data])

  // ── Erosion State index ──
  const erosionState = useMemo(() => {
    return data.models?.gmm?.erosionState ?? null
  }, [data])

  // ── Model metrics (dynamic) ──
  const metrics = useMemo(() => {
    return data.models?.gmm?.metrics || {}
  }, [data])

  // ── Thresholds (all features, dynamic) ──
  const thresholds = useMemo(() => {
    return data.models?.gmm?.thresholds || {}
  }, [data])

  // ── Threshold array for table ──
  const thresholdsArray = useMemo(() => {
    if (!thresholds || Object.keys(thresholds).length === 0) return []
    return Object.entries(thresholds).map(([key, val]) => ({
      feature: key,
      value: val.value,
      direction: val.direction,
      erosionValue: val.erosionValue,
      normalValue: val.normalValue,
      unit: FEATURE_UNITS[key] || '',
      description: FEATURE_DESCRIPTIONS[key] || key,
    }))
  }, [thresholds])

  // ── Top 3 key threshold features (wave, current, wind) ──
  const topThresholdKeys = useMemo(() => {
    return ['Hm0_max', 'UcurrMax', 'WindMax'].filter(k => thresholds[k])
  }, [thresholds])

  // ── Centroid features for Distribution tab ──
  const centroidFeatures = useMemo(() => {
    const first = Object.values(stateCentroids)[0]
    return first ? Object.keys(first).slice(0, 6) : []
  }, [stateCentroids])

  const tabs = [
    { id: 'distribution', label: 'State Distribution' },
    { id: 'thresholds', label: 'Thresholds' },
  ]

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-coastal-50 to-white">
        {/* Header */}
        <section className="pt-12 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium mb-3">
                <Layers className="w-3.5 h-3.5" />
                Unsupervised Learning
              </div>
              <h1 className="section-title mb-4">
                GMM State Detection
              </h1>
              <p className="section-subtitle">
                Gaussian Mixture Model for identifying hidden erosion states in environmental
                data. Detects clusters of similar conditions that correlate with erosion events.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Model Info */}
        <section className="pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-5 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-violet-900 mb-1">
                    About Gaussian Mixture Models
                  </h3>
                  <p className="text-sm text-violet-700">
                    GMM is a probabilistic model that assumes all data points are generated from
                    a mixture of Gaussian distributions with unknown parameters. It identifies
                    hidden clusters (states) in the data without labeled examples. In coastal
                    erosion analysis, it detects "Normal" and "High Risk" environmental states
                    based on wave, current, and wind patterns.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Tabs Section */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

              <div className="card p-5 mt-6">
                {/* ===================== STATE DISTRIBUTION TAB ===================== */}
                {activeTab === 'distribution' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="font-display font-semibold text-coastal-900 mb-2">
                        State Distribution
                      </h3>
                      <p className="text-sm text-coastal-600">
                        Distribution of observations across {stateDistribution.length || 0} identified environmental states.
                      </p>
                    </div>

                    {/* Component Selection Summary */}
                    {componentSelection.length > 0 && (
                      <div className="mb-8 p-4 bg-coastal-50 rounded-xl">
                        <h4 className="font-medium text-coastal-900 mb-3">Optimal Component Selection</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-coastal-200">
                                <th className="text-left py-2 px-3 font-medium text-coastal-600">n_components</th>
                                <th className="text-right py-2 px-3 font-medium text-coastal-600">BIC</th>
                                <th className="text-right py-2 px-3 font-medium text-coastal-600">AIC</th>
                              </tr>
                            </thead>
                            <tbody>
                              {componentSelection.map((row) => (
                                <tr
                                  key={row.nComponents}
                                  className={`border-b border-coastal-100 ${row.nComponents === metrics.nStates ? 'bg-violet-50 font-medium' : ''}`}
                                >
                                  <td className="py-2 px-3">
                                    {row.nComponents}
                                    {row.nComponents === metrics.nStates && (
                                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
                                        <CheckCircle className="w-3 h-3" /> Optimal
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono">{row.bic?.toFixed(1)}</td>
                                  <td className="py-2 px-3 text-right font-mono">{row.aic?.toFixed(1)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Model Metrics Summary */}
                    {metrics.nStates > 0 && (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="p-4 bg-violet-50 rounded-xl border border-violet-200">
                          <span className="text-xs font-medium text-violet-600">States</span>
                          <p className="text-2xl font-bold text-violet-900">{metrics.nStates}</p>
                        </div>
                        {metrics.logLikelihood !== 0 && (
                          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <span className="text-xs font-medium text-blue-600">Log-likelihood</span>
                            <p className="text-2xl font-bold text-blue-900">{metrics.logLikelihood?.toFixed(3)}</p>
                          </div>
                        )}
                        {metrics.aic !== 0 && (
                          <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-200">
                            <span className="text-xs font-medium text-cyan-600">AIC</span>
                            <p className="text-2xl font-bold text-cyan-900">{metrics.aic?.toFixed(3)}</p>
                          </div>
                        )}
                        {metrics.bic !== 0 && (
                          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                            <span className="text-xs font-medium text-emerald-600">BIC</span>
                            <p className="text-2xl font-bold text-emerald-900">{metrics.bic?.toFixed(3)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid lg:grid-cols-2 gap-8 mb-8">
                      <StateDistributionChart data={stateDistribution} />

                      {/* Dynamic state cards */}
                      <div className="space-y-4">
                        {stateDistribution.map((state, index) => {
                          const style = STATE_BG_CLASSES[index % STATE_BG_CLASSES.length]
                          const isErosion = erosionState !== null && state.state === `State ${erosionState}`
                          return (
                            <motion.div
                              key={state.state}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`p-4 ${style.bg} rounded-xl border ${style.border}`}
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`w-4 h-4 rounded-full ${style.dot}`} />
                                <h4 className={`font-semibold ${style.title}`}>{state.state}</h4>
                                {isErosion && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                    <AlertTriangle className="w-3 h-3" /> Erosion State
                                  </span>
                                )}
                                <span className={`ml-auto text-lg font-bold ${style.text}`}>{state.percentage}%</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span className={style.accent}>{state.count} months</span>
                                <span className={style.accent}>Erosion rate: {state.erosionRate}%</span>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>

                    {/* State Centroids Table */}
                    {Object.keys(stateCentroids).length > 0 && centroidFeatures.length > 0 && (
                      <div className="mb-8">
                        <h4 className="font-medium text-coastal-900 mb-4">State Centroids (first 6 features)</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-coastal-200 bg-coastal-50">
                                <th className="text-left py-3 px-4 font-medium text-coastal-600">State</th>
                                {centroidFeatures.map((feat) => (
                                  <th key={feat} className="text-right py-3 px-4 font-medium text-coastal-600">{feat}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(stateCentroids).map(([stateName, values], idx) => (
                                <motion.tr
                                  key={stateName}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className={'border-b border-coastal-100 hover:bg-coastal-50' + (erosionState !== null && stateName === 'State_' + erosionState ? ' bg-red-50' : '')}
                                >
                                  <td className="py-3 px-4 font-medium text-coastal-900">
                                    {stateName.replace('_', ' ')}
                                    {erosionState !== null && stateName === `State_${erosionState}` && (
                                      <span className="ml-2 text-xs text-red-600">⚠ Erosion</span>
                                    )}
                                  </td>
                                  {centroidFeatures.map((feat) => (
                                    <td key={feat} className="py-3 px-4 text-right font-mono text-coastal-700">
                                      {typeof values[feat] === 'number' ? values[feat].toFixed(3) : '-'}
                                    </td>
                                  ))}
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {metrics.converged !== undefined && (
                      <div className="p-4 bg-violet-50 rounded-xl border border-violet-200">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-violet-600 mt-0.5" />
                          <div className="text-sm text-violet-700">
                            <span className="font-medium text-violet-800">Convergence: </span>
                            {metrics.converged ? 'Model converged successfully ✓' : 'Model did not converge ✗'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ===================== THRESHOLDS TAB ===================== */}
                {activeTab === 'thresholds' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="font-display font-semibold text-coastal-900 mb-2">
                        GMM-Derived Thresholds
                      </h3>
                      <p className="text-sm text-coastal-600">
                        Threshold values computed as the midpoint between state cluster centroids.
                        Values above these thresholds indicate transition to the high-risk state.
                      </p>
                    </div>

                    {/* Top 3 Key Thresholds Cards */}
                    {topThresholdKeys.length > 0 && (
                      <div className={`grid sm:grid-cols-${Math.min(topThresholdKeys.length, 3)} gap-6 mb-8`}>
                        {topThresholdKeys.map((key, i) => {
                          const thresh = thresholds[key]
                          const Icon = getFeatureIcon(key)
                          const gradients = [
                            'from-blue-500 to-cyan-500',
                            'from-indigo-500 to-blue-600',
                            'from-sky-500 to-teal-500',
                          ]
                          const labels = { Hm0_max: 'Wave Height', UcurrMax: 'Current Speed', WindMax: 'Wind Speed' }
                          return (
                            <motion.div
                              key={key}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05 }}
                              className={`p-6 bg-gradient-to-br ${gradients[i]} rounded-2xl text-white shadow-lg`}
                            >
                              <div className="flex items-center gap-3 mb-4">
                                <Icon className="w-8 h-8 opacity-80" />
                                <span className="font-medium opacity-90">{labels[key] || key}</span>
                              </div>
                              <p className="text-4xl font-display font-bold mb-1">
                                {typeof thresh.value === 'number' ? thresh.value.toFixed(2) : thresh.value}
                              </p>
                              <p className="text-sm opacity-75">State transition boundary</p>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}

                    {/* Full Thresholds Table */}
                    <div className="mb-8">
                      <h4 className="font-medium text-coastal-900 mb-4">All GMM Feature Thresholds</h4>
                      {thresholdsArray.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-coastal-200 bg-coastal-50">
                                <th className="text-left py-3 px-4 font-medium text-coastal-600">#</th>
                                <th className="text-left py-3 px-4 font-medium text-coastal-600">Feature</th>
                                <th className="text-left py-3 px-4 font-medium text-coastal-600">Description</th>
                                <th className="text-right py-3 px-4 font-medium text-coastal-600">Threshold</th>
                                <th className="text-right py-3 px-4 font-medium text-coastal-600">Erosion</th>
                                <th className="text-right py-3 px-4 font-medium text-coastal-600">Normal</th>
                                <th className="text-center py-3 px-4 font-medium text-coastal-600">Unit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {thresholdsArray.map((thresh, index) => (
                                <motion.tr
                                  key={thresh.feature}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="border-b border-coastal-100 hover:bg-coastal-50"
                                >
                                  <td className="py-3 px-4">
                                    <span className={'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ' + ['bg-blue-500', 'bg-indigo-500', 'bg-sky-500'][index] || 'bg-coastal-400'}>
                                      {index + 1}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-medium text-coastal-900">{thresh.feature}</td>
                                  <td className="py-3 px-4 text-coastal-600">{thresh.description}</td>
                                  <td className="py-3 px-4 text-right">
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md font-mono font-medium">
                                      {thresh.direction} {typeof thresh.value === 'number' ? thresh.value.toFixed(3) : thresh.value}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono text-red-600">
                                    {typeof thresh.erosionValue === 'number' ? thresh.erosionValue.toFixed(3) : '-'}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono text-green-600">
                                    {typeof thresh.normalValue === 'number' ? thresh.normalValue.toFixed(3) : '-'}
                                  </td>
                                  <td className="py-3 px-4 text-center text-coastal-500">{thresh.unit}</td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-coastal-50 rounded-xl">
                          <p className="text-coastal-600">No threshold data available. Run the notebook analysis first.</p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-violet-50 rounded-xl border border-violet-200">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-violet-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-violet-800 mb-1">
                            Threshold Calculation Method
                          </h4>
                          <p className="text-sm text-violet-700">
                            Thresholds are calculated as the midpoint between the erosion state
                            centroid and the mean of all normal state centroids for each feature.
                            The "Erosion" and "Normal" columns show the respective centroid values.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
