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
  ArrowRightLeft,
  Activity,
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import Tabs from '../components/common/Tabs'
import StateDistributionChart from '../components/charts/StateDistributionChart'
import { useData } from '../context/DataContext'

const STATE_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#f97316',
  '#8b5cf6',
  '#06b6d4',
  '#22c55e',
  '#ec4899',
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

function getFeatureIcon(feature) {
  if (feature.toLowerCase().includes('hm0') || feature.toLowerCase().includes('wave') || feature.toLowerCase().includes('storm')) return Waves
  if (feature.toLowerCase().includes('wind')) return Wind
  if (feature.toLowerCase().includes('curr')) return Droplets
  return Layers
}

export default function HMMPage() {
  const { data } = useData()
  const [activeTab, setActiveTab] = useState('distribution')

  const stateDistribution = useMemo(() => data.models?.hmm?.stateDistribution || [], [data])
  const stateCentroids = useMemo(() => data.models?.hmm?.stateCentroids || {}, [data])
  const componentSelection = useMemo(() => data.models?.hmm?.componentSelection || [], [data])
  const transitionMatrix = useMemo(() => data.models?.hmm?.transitionMatrix || [], [data])
  const regimeStability = useMemo(() => data.models?.hmm?.regimeStability || {}, [data])
  const finalStateDominance = useMemo(() => data.models?.hmm?.finalStateDominance || [], [data])
  const erosionState = useMemo(() => data.models?.hmm?.erosionState ?? null, [data])
  const metrics = useMemo(() => data.models?.hmm?.metrics || {}, [data])
  const thresholds = useMemo(() => data.models?.hmm?.thresholds || {}, [data])

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

  const topThresholdKeys = useMemo(
    () => ['Hm0_max', 'UcurrMax', 'WindMax'].filter(k => thresholds[k]),
    [thresholds]
  )

  const centroidFeatures = useMemo(() => {
    const first = Object.values(stateCentroids)[0]
    return first ? Object.keys(first).slice(0, 6) : []
  }, [stateCentroids])

  const tmStateKeys = useMemo(() => {
    if (transitionMatrix.length === 0) return []
    return Object.keys(transitionMatrix[0]).filter(k => k !== 'from')
  }, [transitionMatrix])

  const tabs = [
    { id: 'distribution', label: 'State Distribution' },
    { id: 'transitions', label: 'Transition Matrix' },
    { id: 'thresholds', label: 'Thresholds' },
  ]

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-coastal-50 to-white bg-mesh-1">
        {/* Header */}
        <section className="pt-8 sm:pt-10 pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
              <div className="page-badge bg-emerald-50 text-emerald-600 border-emerald-100 mb-4">
                <Activity className="w-3.5 h-3.5" />
                Sequential State Detection
              </div>
              <h1 className="section-title mb-3">HMM State Detection</h1>
              <p className="section-subtitle">
                Hidden Markov Model for sequential erosion state detection. Learns transition
                probabilities between hidden states and identifies temporal patterns correlated
                with erosion events.
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
              className="card p-5 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border-emerald-200/60 ring-1 ring-emerald-100/50"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-900 mb-1">About Hidden Markov Models</h3>
                  <p className="text-sm text-emerald-700">
                    HMM assumes the system transitions through unobservable (hidden) states over time,
                    capturing <strong>temporal dependencies</strong> through a transition matrix — ideal
                    for detecting regime shifts in coastal erosion where conditions evolve sequentially.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Tabs */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

              <div className="card p-5 mt-6">
                {/* ── STATE DISTRIBUTION ── */}
                {activeTab === 'distribution' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="font-display font-bold text-coastal-900 mb-2">State Distribution</h3>
                      <p className="text-sm text-coastal-500">
                        Distribution of observations across {stateDistribution.length || 0} identified hidden states.
                      </p>
                    </div>

                    {/* Component Selection */}
                    {componentSelection.length > 0 && (
                      <div className="mb-8 p-4 bg-coastal-50 rounded-xl">
                        <h4 className="font-semibold text-coastal-900 mb-3">Optimal State Selection</h4>
                        <div className="overflow-x-auto rounded-xl ring-1 ring-coastal-200/60">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-coastal-200 bg-coastal-50/80">
                                <th className="text-left py-3 px-3 font-semibold text-coastal-600">n_states</th>
                                <th className="text-right py-3 px-3 font-semibold text-coastal-600">BIC</th>
                                <th className="text-right py-3 px-3 font-semibold text-coastal-600">AIC</th>
                              </tr>
                            </thead>
                            <tbody>
                              {componentSelection.map((row) => (
                                <tr
                                  key={row.nComponents}
                                  className={`border-b border-coastal-100 ${row.nComponents === metrics.nStates ? 'bg-emerald-50 font-medium' : ''}`}
                                >
                                  <td className="py-2 px-3">
                                    {row.nComponents}
                                    {row.nComponents === metrics.nStates && (
                                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
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

                    {/* Metrics */}
                    {metrics.nStates > 0 && (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/60">
                          <span className="text-xs font-semibold text-emerald-600">Hidden States</span>
                          <p className="text-2xl font-bold text-emerald-900">{metrics.nStates}</p>
                        </div>
                        {!!metrics.logLikelihood && (
                          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200/60">
                            <span className="text-xs font-semibold text-blue-600">Log-likelihood</span>
                            <p className="text-2xl font-bold text-blue-900">{metrics.logLikelihood?.toFixed(3)}</p>
                          </div>
                        )}
                        {!!metrics.aic && (
                          <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-200/60">
                            <span className="text-xs font-semibold text-cyan-600">AIC</span>
                            <p className="text-2xl font-bold text-cyan-900">{metrics.aic?.toFixed(3)}</p>
                          </div>
                        )}
                        {!!metrics.bic && (
                          <div className="p-4 bg-teal-50 rounded-xl border border-teal-200/60">
                            <span className="text-xs font-semibold text-teal-600">BIC</span>
                            <p className="text-2xl font-bold text-teal-900">{metrics.bic?.toFixed(3)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid lg:grid-cols-2 gap-8 mb-8">
                      <StateDistributionChart data={stateDistribution} />
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

                    {/* Centroids */}
                    {Object.keys(stateCentroids).length > 0 && centroidFeatures.length > 0 && (
                      <div className="mb-8">
                        <h4 className="font-semibold text-coastal-900 mb-4">State Centroids (first 6 features)</h4>
                        <div className="overflow-x-auto rounded-xl ring-1 ring-coastal-200/60">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-coastal-200 bg-coastal-50/80">
                                <th className="text-left py-3 px-4 font-semibold text-coastal-600">State</th>
                                {centroidFeatures.map(feat => (
                                  <th key={feat} className="text-right py-3 px-4 font-medium text-coastal-600">{feat}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(stateCentroids).map(([stateName, values], idx) => (
                                <tr key={stateName} className="border-b border-coastal-100 hover:bg-coastal-50">
                                  <td className="py-3 px-4 font-medium text-coastal-900">
                                    {stateName.replace('_', ' ')}
                                    {erosionState !== null && stateName === `State_${erosionState}` && (
                                      <span className="ml-2 text-xs text-red-600">⚠ Erosion</span>
                                    )}
                                  </td>
                                  {centroidFeatures.map(feat => (
                                    <td key={feat} className="py-3 px-4 text-right font-mono text-coastal-700">
                                      {typeof values[feat] === 'number' ? values[feat].toFixed(3) : '-'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {metrics.converged !== undefined && (
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-emerald-600 mt-0.5" />
                          <p className="text-sm text-emerald-700">
                            <span className="font-medium text-emerald-800">Convergence: </span>
                            {metrics.converged ? 'Model converged successfully ✓' : 'Model did not converge ✗'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TRANSITION MATRIX ── */}
                {activeTab === 'transitions' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="font-display font-bold text-coastal-900 mb-2">HMM Transition Matrix</h3>
                      <p className="text-sm text-coastal-500">
                        Probability of transitioning between hidden states from one time step to the next.
                      </p>
                    </div>

                    {transitionMatrix.length > 0 ? (
                      <div className="mb-8 overflow-x-auto p-4 bg-coastal-50 rounded-xl">
                        <table className="w-full max-w-2xl mx-auto">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 text-sm font-semibold text-coastal-700" />
                              {tmStateKeys.map(col => (
                                <th key={col} className={`px-4 py-3 text-center text-sm font-semibold ${erosionState !== null && col === `S${erosionState}` ? 'text-red-600' : 'text-coastal-700'}`}>
                                  {col}{erosionState !== null && col === `S${erosionState}` ? ' (Erosion)' : ''}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {transitionMatrix.map((row, index) => (
                              <tr key={index}>
                                <td className="px-4 py-3 text-sm font-semibold text-coastal-700">{row.from}</td>
                                {tmStateKeys.map(col => (
                                  <td key={col} className="px-4 py-3 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-lg font-mono text-sm ${
                                      row[col] > 0.5 ? 'bg-emerald-100 text-emerald-700 font-semibold'
                                        : row[col] > 0.1 ? 'bg-coastal-100 text-coastal-700'
                                        : 'bg-coastal-50 text-coastal-400'
                                    }`}>
                                      {typeof row[col] === 'number' ? row[col].toFixed(3) : row[col]}
                                    </span>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="mb-8 p-8 text-center bg-coastal-50 rounded-xl">
                        <p className="text-coastal-600">No transition matrix data available. Run the notebook analysis first.</p>
                      </div>
                    )}

                    {/* Regime Stability */}
                    {regimeStability.count > 0 && (
                      <div className="mb-8">
                        <h4 className="font-semibold text-coastal-900 mb-4">Regime Stability</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: 'Mean Switches', val: regimeStability.mean, bg: 'bg-emerald-50 border-emerald-200 text-emerald-600 text-emerald-900' },
                            { label: 'Std Dev', val: regimeStability.std, bg: 'bg-blue-50 border-blue-200 text-blue-600 text-blue-900' },
                            { label: 'Min', val: regimeStability.min, bg: 'bg-cyan-50 border-cyan-200 text-cyan-600 text-cyan-900' },
                            { label: 'Max', val: regimeStability.max, bg: 'bg-teal-50 border-teal-200 text-teal-600 text-teal-900' },
                          ].map(({ label, val, bg }) => (
                            <div key={label} className={`p-4 rounded-xl border ${bg.split(' ').slice(0, 2).join(' ')}`}>
                              <div className={`text-xs font-semibold ${bg.split(' ')[2]}`}>{label}</div>
                              <div className={`text-2xl font-bold ${bg.split(' ')[3]}`}>{val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Final-state dominance */}
                    {finalStateDominance.length > 0 && (
                      <div className="mb-8">
                        <h4 className="font-semibold text-coastal-900 mb-4">Final-State Dominance</h4>
                        <div className="flex gap-4">
                          {finalStateDominance.map((item, idx) => {
                            const style = STATE_BG_CLASSES[idx % STATE_BG_CLASSES.length]
                            return (
                              <div key={item.state} className="flex-1">
                                <div className="text-sm text-coastal-600 mb-2">{item.state}</div>
                                <div className="h-32 bg-coastal-100 rounded-lg relative overflow-hidden">
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${item.value * 100}%` }}
                                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                                    className={`absolute bottom-0 left-0 right-0 ${style.dot} rounded-lg`}
                                  />
                                </div>
                                <div className="text-lg font-bold text-coastal-900 mt-2">
                                  {(item.value * 100).toFixed(0)}%
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="p-5 bg-emerald-50/80 rounded-xl border border-emerald-200/60">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-emerald-800 mb-1">Interpreting the Transition Matrix</h4>
                          <p className="text-sm text-emerald-700">
                            High diagonal values indicate persistent states. Off-diagonal values show transition
                            probability to a different state. A high probability of transitioning to the erosion
                            state indicates increased coastal risk.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── THRESHOLDS ── */}
                {activeTab === 'thresholds' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="font-display font-bold text-coastal-900 mb-2">HMM-Derived Thresholds</h3>
                      <p className="text-sm text-coastal-500">
                        Threshold values computed as the midpoint between state cluster centroids.
                      </p>
                    </div>

                    {/* Top 3 cards */}
                    {topThresholdKeys.length > 0 && (
                      <div className={`grid sm:grid-cols-${Math.min(topThresholdKeys.length, 3)} gap-6 mb-8`}>
                        {topThresholdKeys.map((key, i) => {
                          const thresh = thresholds[key]
                          const Icon = getFeatureIcon(key)
                          const gradients = ['from-emerald-500 to-teal-500', 'from-blue-500 to-cyan-500', 'from-sky-500 to-indigo-500']
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

                    {/* Full table */}
                    {thresholdsArray.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl ring-1 ring-coastal-200/60 mb-8">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-coastal-200 bg-coastal-50/80">
                              <th className="text-left py-3.5 px-4 font-semibold text-coastal-600">#</th>
                              <th className="text-left py-3.5 px-4 font-semibold text-coastal-600">Feature</th>
                              <th className="text-left py-3.5 px-4 font-semibold text-coastal-600">Description</th>
                              <th className="text-right py-3.5 px-4 font-semibold text-coastal-600">Threshold</th>
                              <th className="text-right py-3.5 px-4 font-semibold text-coastal-600">Erosion</th>
                              <th className="text-right py-3.5 px-4 font-semibold text-coastal-600">Normal</th>
                              <th className="text-center py-3.5 px-4 font-semibold text-coastal-600">Unit</th>
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
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${['bg-emerald-500', 'bg-teal-500', 'bg-blue-500'][index] || 'bg-coastal-400'}`}>
                                    {index + 1}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-medium text-coastal-900">{thresh.feature}</td>
                                <td className="py-3 px-4 text-coastal-600">{thresh.description}</td>
                                <td className="py-3 px-4 text-right">
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-md font-mono font-medium">
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
                      <div className="p-8 text-center bg-coastal-50 rounded-xl mb-8">
                        <p className="text-coastal-600">No threshold data available. Run the notebook analysis first.</p>
                      </div>
                    )}

                    <div className="p-5 bg-emerald-50/80 rounded-xl border border-emerald-200/60">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Info className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-emerald-800 mb-1">Threshold Calculation Method</h4>
                          <p className="text-sm text-emerald-700">
                            Thresholds are the midpoint between the erosion state centroid and the mean of
                            all normal state centroids for each feature. The "Erosion" and "Normal" columns
                            show the respective centroid values.
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
