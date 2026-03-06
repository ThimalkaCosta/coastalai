import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Mountain,
  Activity,
  Table,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  ArrowDown,
  Shield,
  Gauge,
  Loader2,
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import { useMorphData } from '../context/MorphDataContext'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function MorphologicalThresholdPage() {
  const location = useLocation()
  const { data, dataLoaded, loading } = useMorphData()
  const [activeTab, setActiveTab] = useState('threshold')

  // Derive display data from context
  const thresholdData = data.thresholdComparison || []
  const transitionMatrix = data.transitionMatrix || []
  const stateMeans = data.stateMeans || {}
  const erosionState = data.erosionState || {}
  const regimeStability = data.regimeStability || {}
  const seasonalAlignment = data.seasonalAlignment || []
  const finalStateDominance = data.finalStateDominance || []
  const cvi = data.cvi || {}

  const erosionStateIdx = erosionState.stateIndex ?? 3
  const erosionTransitionProb = erosionState.transitionProb ?? 0
  const nStates = transitionMatrix.length || 4
  const nVariables = thresholdData.length || 0

  const tabs = [
    { id: 'threshold', name: 'Threshold Table', icon: Table },
    { id: 'hmm', name: 'HMM Analysis', icon: Activity },
    { id: 'regime', name: 'Regime Profiles', icon: BarChart3 },
    { id: 'seasonal', name: 'Seasonal Analysis', icon: Calendar },
    { id: 'cvi', name: 'Coastal Vulnerability Index', icon: Shield },
  ]

  // Handle hash navigation on mount and hash change
  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (hash && ['threshold', 'hmm', 'regime', 'seasonal', 'cvi'].includes(hash)) {
      setActiveTab(hash)
      // Scroll to section with offset for header
      setTimeout(() => {
        const element = document.getElementById(hash)
        if (element) {
          const headerOffset = 100
          const elementPosition = element.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          })
        }
      }, 100)
    }
  }, [location.hash])

  // Sync activeTab when clicking tab buttons
  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
    // Scroll to the section
    setTimeout(() => {
      const element = document.getElementById(tabId)
      if (element) {
        const headerOffset = 120
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }, 100)
  }

  return (
    <PageTransition>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] sm:min-h-[70vh] flex items-center overflow-hidden pt-20 sm:pt-28">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: 'url(/morpho_background.png)',
              imageRendering: '-webkit-optimize-contrast',
              filter: 'contrast(1.05) saturate(1.08) brightness(1.01)',
              transform: 'scale(1.01)',
            }}
          />
          {/* Subtle gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl lg:max-w-2xl"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-emerald-700 rounded-full text-sm font-semibold mb-6 shadow-lg"
            >
              <Mountain className="w-4 h-4" />
              HMM-Based Analysis
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-white mb-4 sm:mb-6 drop-shadow-lg"
            >
              Morphological{' '}
              <span className="text-emerald-400">Threshold</span>{' '}
              Analysis
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-sm sm:text-base lg:text-lg text-white/90 mb-6 sm:mb-8 drop-shadow-md"
            >
              Advanced Hidden Markov Model analysis for detecting erosion regimes 
              and identifying adaptive environmental thresholds based on coastal morphology changes.
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-3 sm:gap-6"
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 sm:px-5 py-2 sm:py-3 border border-white/30">
                <div className="text-xl sm:text-2xl font-bold text-white">{nStates}</div>
                <div className="text-xs sm:text-sm text-white/80">HMM States</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 sm:px-5 py-2 sm:py-3 border border-white/30">
                <div className="text-xl sm:text-2xl font-bold text-white">{nVariables}</div>
                <div className="text-xs sm:text-sm text-white/80">Variables</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 sm:px-5 py-2 sm:py-3 border border-white/30">
                <div className="text-xl sm:text-2xl font-bold text-emerald-400">{(erosionTransitionProb * 100).toFixed(1)}%</div>
                <div className="text-xs sm:text-sm text-white/80">Erosion Risk</div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-white/60"
          >
            <span className="text-sm font-medium">Explore Analysis</span>
            <ArrowDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* Analysis Content */}
      <div className="min-h-screen bg-gradient-to-br from-coastal-50 via-white to-emerald-50">
        <div className="max-w-7xl px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-12">
          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap gap-2 mb-6 sm:mb-8"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-white text-coastal-600 hover:bg-coastal-50 border border-coastal-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
              </button>
            ))}
          </motion.div>

          {/* Tab Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-coastal-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-lg font-medium">Loading analysis results...</p>
            </div>
          ) : !dataLoaded ? (
            <div className="flex flex-col items-center justify-center py-20 text-coastal-500">
              <Mountain className="w-12 h-12 mb-4 opacity-40" />
              <p className="text-lg font-medium mb-2">No Analysis Data Available</p>
              <p className="text-sm">Upload files and run the morphological analysis first.</p>
              <Link to="/morph/upload" className="mt-4 px-5 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition">
                Go to Upload
              </Link>
            </div>
          ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Threshold Table */}
            {activeTab === 'threshold' && (
              <div id="threshold" className="space-y-6 scroll-mt-24">
                {/* Summary Cards */}
                <div className="flex flex-wrap gap-6">
                  <div className="card p-6 w-full sm:w-auto sm:min-w-[280px]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      </div>
                      <span className="text-sm text-coastal-500">Erosion Probability</span>
                    </div>
                    <div className="text-3xl font-display font-bold text-coastal-900">{(erosionTransitionProb * 100).toFixed(1)}%</div>
                    <p className="text-sm text-coastal-500 mt-1">Next month transition</p>
                  </div>
                  <div className="card p-6 w-full sm:w-auto sm:min-w-[280px]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-sm text-coastal-500">Erosion State</span>
                    </div>
                    <div className="text-3xl font-display font-bold text-coastal-900">State {erosionStateIdx}</div>
                    <p className="text-sm text-coastal-500 mt-1">Dominant erosion regime</p>
                  </div>
                  <div className="card p-6 w-full sm:w-auto sm:min-w-[280px]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-ocean-100 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-ocean-600" />
                      </div>
                      <span className="text-sm text-coastal-500">Variables Tracked</span>
                    </div>
                    <div className="text-3xl font-display font-bold text-coastal-900">{nVariables}</div>
                    <p className="text-sm text-coastal-500 mt-1">Environmental drivers</p>
                  </div>
                </div>

                {/* Threshold Comparison Table */}
                <div className="card overflow-hidden">
                  <div className="p-6 border-b border-coastal-100">
                    <h2 className="text-xl font-display font-bold text-coastal-900">
                      Current vs Threshold Values
                    </h2>
                    <p className="text-sm text-coastal-500 mt-1">
                      Comparison of latest observations with erosion threshold values
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-coastal-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-coastal-700">Variable</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-coastal-700">Current Value</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-coastal-700">Threshold Value</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-coastal-700">Gap</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-coastal-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-coastal-100">
                        {thresholdData.map((row, index) => {
                          const current = Number(row.currentValue) || 0
                          const threshold = Number(row.thresholdValue) || 0
                          const gap = Number(row.gap) || 0
                          return (
                          <tr key={index} className="hover:bg-coastal-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-coastal-900">{row.variable}</td>
                            <td className="px-6 py-4 text-sm text-right font-mono text-coastal-700">
                              {current.toFixed(4)}
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-mono text-emerald-600 font-semibold">
                              {threshold.toFixed(4)}
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-mono">
                              <span className={gap > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                                {gap > 0 ? '+' : ''}{gap.toFixed(4)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {gap > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                  <ArrowUpRight className="w-3 h-3" />
                                  Below
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  <ArrowDownRight className="w-3 h-3" />
                                  Above
                                </span>
                              )}
                            </td>
                          </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Gap Heatmap Visual */}
                <div className="card p-6">
                  <h3 className="text-lg font-display font-bold text-coastal-900 mb-4">
                    Distance to Erosion Threshold (Visual)
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {thresholdData.map((row, index) => {
                      const gap = Number(row.gap) || 0
                      const intensity = Math.min(Math.abs(gap) * 10, 1)
                      const color = gap > 0 
                        ? `rgba(245, 158, 11, ${intensity})` 
                        : `rgba(239, 68, 68, ${intensity})`
                      return (
                        <div
                          key={index}
                          className="flex flex-col items-center p-3 rounded-xl border border-coastal-200"
                          style={{ backgroundColor: color }}
                        >
                          <span className="text-xs text-coastal-600 text-center max-w-[100px] truncate">
                            {row.variable.split(' ').slice(0, 2).join(' ')}
                          </span>
                          <span className="text-lg font-bold text-coastal-900 mt-1">
                            {gap > 0 ? '+' : ''}{gap.toFixed(2)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* HMM Analysis */}
            {activeTab === 'hmm' && (
              <div id="hmm" className="space-y-6 scroll-mt-24">
                {/* Transition Matrix */}
                <div className="card overflow-hidden">
                  <div className="p-6 border-b border-coastal-100">
                    <h2 className="text-xl font-display font-bold text-coastal-900">
                      HMM Transition Matrix
                    </h2>
                    <p className="text-sm text-coastal-500 mt-1">
                      Probability of transitioning between hidden states
                    </p>
                  </div>
                  <div className="overflow-x-auto p-6">
                    <table className="w-full max-w-2xl">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-sm font-semibold text-coastal-700"></th>
                          {Array.from({ length: nStates }, (_, i) => (
                            <th key={i} className={`px-4 py-3 text-center text-sm font-semibold ${i === erosionStateIdx ? 'text-emerald-600' : 'text-coastal-700'}`}>
                              S{i}{i === erosionStateIdx ? ' (Erosion)' : ''}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {transitionMatrix.map((row, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm font-semibold text-coastal-700">{row.from}</td>
                            {Array.from({ length: nStates }, (_, i) => {
                              const val = Number(row[`S${i}`]) || 0
                              return (
                              <td key={i} className="px-4 py-3 text-center">
                                <span 
                                  className={`inline-block px-3 py-1 rounded-lg font-mono text-sm ${
                                    val > 0.5 
                                      ? 'bg-emerald-100 text-emerald-700 font-semibold' 
                                      : val > 0.1 
                                        ? 'bg-coastal-100 text-coastal-700'
                                        : 'bg-coastal-50 text-coastal-400'
                                  }`}
                                >
                                  {val.toFixed(2)}
                                </span>
                              </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Regime Stability */}
                <div className="card p-6">
                  <h2 className="text-xl font-display font-bold text-coastal-900 mb-4">
                    Regime Stability Check
                  </h2>
                  <p className="text-sm text-coastal-500 mb-6">
                    Number of state switches per cycle (lower = more stable)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-coastal-50 rounded-xl">
                      <div className="text-sm text-coastal-500">Mean Switches</div>
                      <div className="text-2xl font-bold text-coastal-900">{regimeStability.mean ?? '—'}</div>
                    </div>
                    <div className="p-4 bg-coastal-50 rounded-xl">
                      <div className="text-sm text-coastal-500">Std Dev</div>
                      <div className="text-2xl font-bold text-coastal-900">{regimeStability.std ?? '—'}</div>
                    </div>
                    <div className="p-4 bg-coastal-50 rounded-xl">
                      <div className="text-sm text-coastal-500">Min</div>
                      <div className="text-2xl font-bold text-coastal-900">{regimeStability.min ?? '—'}</div>
                    </div>
                    <div className="p-4 bg-coastal-50 rounded-xl">
                      <div className="text-sm text-coastal-500">Max</div>
                      <div className="text-2xl font-bold text-coastal-900">{regimeStability.max ?? '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Final State Dominance */}
                <div className="card p-6">
                  <h2 className="text-xl font-display font-bold text-coastal-900 mb-4">
                    Final-State Dominance Test
                  </h2>
                  <p className="text-sm text-coastal-500 mb-6">
                    Distribution of final states in erosion-labeled cycles
                  </p>
                  <div className="flex gap-4">
                    {(finalStateDominance.length > 0 ? finalStateDominance : Array.from({ length: nStates }, (_, i) => ({ state: `State ${i}`, percentage: 0 }))).map((item, idx) => {
                      const colors = ['bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-emerald-500']
                      const pct = Number(item.percentage) || 0
                      return (
                      <div key={idx} className="flex-1">
                        <div className="text-sm text-coastal-600 mb-2">{item.state}</div>
                        <div className="h-32 bg-coastal-100 rounded-lg relative overflow-hidden">
                          <div 
                            className={`absolute bottom-0 left-0 right-0 ${colors[idx % colors.length]} rounded-lg transition-all`}
                            style={{ height: `${pct}%` }}
                          />
                        </div>
                        <div className="text-lg font-bold text-coastal-900 mt-2">
                          {pct.toFixed(0)}%
                        </div>
                      </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Regime Profiles */}
            {activeTab === 'regime' && (
              <div id="regime" className="space-y-6 scroll-mt-24">
                {(() => {
                  // Convert stateMeans object into rows
                  const stateKeys = Object.keys(stateMeans).sort()
                  const varNames = stateKeys.length > 0 ? Object.keys(stateMeans[stateKeys[0]]) : []
                  return (
                  <>
                <div className="card overflow-hidden">
                  <div className="p-6 border-b border-coastal-100">
                    <h2 className="text-xl font-display font-bold text-coastal-900">
                      Regime-wise Variable Profiles
                    </h2>
                    <p className="text-sm text-coastal-500 mt-1">
                      Mean values of environmental variables for each HMM state
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-coastal-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-coastal-700">State</th>
                          {varNames.map(v => (
                            <th key={v} className="px-4 py-3 text-right text-sm font-semibold text-coastal-700">{v}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-coastal-100">
                        {stateKeys.map((stateKey) => {
                          const isErosion = stateKey === `State_${erosionStateIdx}`
                          return (
                          <tr 
                            key={stateKey} 
                            className={`hover:bg-coastal-50 transition-colors ${isErosion ? 'bg-emerald-50' : ''}`}
                          >
                            <td className="px-4 py-3 text-sm font-semibold text-coastal-900">
                              <span className={`inline-flex items-center gap-2 ${isErosion ? 'text-emerald-700' : ''}`}>
                                {stateKey}
                                {isErosion && (
                                  <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
                                    Erosion
                                  </span>
                                )}
                              </span>
                            </td>
                            {varNames.map(v => {
                              const val = Number(stateMeans[stateKey][v]) || 0
                              return (
                              <td key={v} className="px-4 py-3 text-sm text-right font-mono text-coastal-700">
                                {Math.abs(val) < 0.01 ? val.toFixed(5) : val.toFixed(2)}
                              </td>
                              )
                            })}
                          </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* State Characteristics Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                  {stateKeys.map((stateKey) => {
                    const isErosion = stateKey === `State_${erosionStateIdx}`
                    const vals = stateMeans[stateKey] || {}
                    const topVars = varNames.slice(0, 4)
                    return (
                    <div 
                      key={stateKey}
                      className={`card p-6 ${isErosion ? 'ring-2 ring-emerald-500' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-display font-bold text-coastal-900">
                          {stateKey}
                        </h3>
                        {isErosion && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
                            Erosion Dominant
                          </span>
                        )}
                      </div>
                      <div className="space-y-3">
                        {topVars.map(v => (
                          <div key={v} className="flex justify-between">
                            <span className="text-sm text-coastal-500">{v}</span>
                            <span className="text-sm font-medium text-coastal-900">
                              {(Number(vals[v]) || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    )
                  })}
                </div>
                  </>
                  )
                })()}
              </div>
            )}

            {/* Seasonal Analysis */}
            {activeTab === 'seasonal' && (
              <div id="seasonal" className="space-y-6 scroll-mt-24">
                {(() => {
                  const stateColors = ['blue', 'purple', 'amber', 'emerald']
                  const stateKeys = Array.from({ length: nStates }, (_, i) => `State_${i}`)
                  return (
                  <>
                <div className="card overflow-hidden">
                  <div className="p-6 border-b border-coastal-100">
                    <h2 className="text-xl font-display font-bold text-coastal-900">
                      Seasonal Alignment Test
                    </h2>
                    <p className="text-sm text-coastal-500 mt-1">
                      Crosstab of Month vs HMM State - shows which states are dominant in each month
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-coastal-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-coastal-700">Month</th>
                          {stateKeys.map((sk, i) => (
                            <th key={sk} className={`px-4 py-3 text-center text-sm font-semibold text-${stateColors[i % stateColors.length]}-600`}>
                              State {i}{i === erosionStateIdx ? ' (Erosion)' : ''}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-coastal-100">
                        {seasonalAlignment.map((row, index) => {
                          const vals = stateKeys.map(sk => Number(row[sk]) || 0)
                          const maxVal = Math.max(...vals)
                          return (
                            <tr key={index} className="hover:bg-coastal-50 transition-colors">
                              <td className="px-4 py-3 text-sm font-semibold text-coastal-900">{row.month}</td>
                              {stateKeys.map((sk, i) => {
                                const v = Number(row[sk]) || 0
                                const col = stateColors[i % stateColors.length]
                                return (
                                <td key={sk} className="px-4 py-3 text-center">
                                  <span className={`inline-block w-10 py-1 rounded ${
                                    v === maxVal ? `bg-${col}-500 text-white font-bold` : `bg-${col}-100 text-${col}-700`
                                  }`}>
                                    {v}
                                  </span>
                                </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Seasonal Insights */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="card p-6">
                    <h3 className="text-lg font-display font-bold text-coastal-900 mb-4">
                      Peak Erosion Months
                    </h3>
                    <p className="text-sm text-coastal-500 mb-4">
                      Months with highest State {erosionStateIdx} (Erosion) occurrence
                    </p>
                    <div className="space-y-3">
                      {[...seasonalAlignment]
                        .sort((a, b) => (Number(b[`State_${erosionStateIdx}`]) || 0) - (Number(a[`State_${erosionStateIdx}`]) || 0))
                        .slice(0, 4)
                        .map((row) => {
                          const total = stateKeys.reduce((s, sk) => s + (Number(row[sk]) || 0), 0)
                          const erosionVal = Number(row[`State_${erosionStateIdx}`]) || 0
                          const percentage = total > 0 ? (erosionVal / total) * 100 : 0
                          return (
                          <div key={row.month} className="flex items-center gap-3">
                            <span className="w-12 text-sm font-medium text-coastal-900">{row.month}</span>
                            <div className="flex-1 h-4 bg-coastal-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-coastal-700">{percentage.toFixed(0)}%</span>
                          </div>
                          )
                        })}
                    </div>
                  </div>
                  <div className="card p-6">
                    <h3 className="text-lg font-display font-bold text-coastal-900 mb-4">
                      Monsoon Impact
                    </h3>
                    <p className="text-sm text-coastal-500 mb-4">
                      Southwest monsoon (Jun-Sep) shows elevated erosion risk
                    </p>
                    <div className="p-5 bg-amber-50/80 rounded-xl border border-amber-200/60 ring-1 ring-amber-100/50">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-amber-800">High Risk Period</div>
                          <div className="text-sm text-amber-700 mt-1">
                            June through September shows significantly higher erosion state transitions. 
                            Monitor environmental variables closely during this period.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                  </>
                  )
                })()}
              </div>
            )}

            {/* Coastal Vulnerability Index (CVI) */}
            {activeTab === 'cvi' && (
              <div id="cvi" className="space-y-6 scroll-mt-24">
                {(() => {
                  const cviScore = Number(cvi.score) || 0
                  const vulnLevel = cvi.vulnerability || 'N/A'
                  const cviYear = cvi.year || '—'
                  const ranges = cvi.ranges || []
                  const components = cvi.components || []
                  const metrics = cvi.metrics || {}
                  const lowerBound = ranges.length > 0 ? ranges[0].min : 1.0
                  const upperBound = ranges.length > 0 ? ranges[ranges.length - 1].max : 4.0
                  const vulnColor = vulnLevel.toLowerCase().includes('very low') ? 'emerald'
                    : vulnLevel.toLowerCase().includes('low') ? 'green'
                    : vulnLevel.toLowerCase().includes('moderate') ? 'amber' : 'red'
                  return (
                  <>
                {/* CVI Summary Cards */}
                <div className="flex flex-wrap gap-6">
                  <div className="card p-6 w-full sm:w-auto sm:min-w-[280px]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-sm text-coastal-500">Vulnerability Level</span>
                    </div>
                    <div className={`text-3xl font-display font-bold text-${vulnColor}-600`}>{vulnLevel}</div>
                    <p className="text-sm text-coastal-500 mt-1">Current assessment ({cviYear})</p>
                  </div>
                  <div className="card p-6 w-full sm:w-auto sm:min-w-[280px]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-ocean-100 flex items-center justify-center">
                        <Gauge className="w-5 h-5 text-ocean-600" />
                      </div>
                      <span className="text-sm text-coastal-500">CVI Score</span>
                    </div>
                    <div className="text-3xl font-display font-bold text-coastal-900">{cviScore.toFixed(2)}</div>
                    <p className="text-sm text-coastal-500 mt-1">Range: {lowerBound} - {upperBound}</p>
                  </div>
                  <div className="card p-6 w-full sm:w-auto sm:min-w-[280px]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm text-coastal-500">Assessment Year</span>
                    </div>
                    <div className="text-3xl font-display font-bold text-coastal-900">{cviYear}</div>
                    <p className="text-sm text-coastal-500 mt-1">Latest evaluation data</p>
                  </div>
                </div>

                {/* Vulnerability Scale */}
                {ranges.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-lg font-display font-bold text-coastal-900 mb-4">
                    Coastal Vulnerability Scale
                  </h3>
                  <div className="relative">
                    <div className="flex h-8 rounded-lg overflow-hidden">
                      {ranges.map((range, index) => (
                        <div
                          key={index}
                          className={`flex-1 flex items-center justify-center text-sm font-medium ${
                            range.color === 'emerald' ? 'bg-emerald-500 text-white' :
                            range.color === 'green' ? 'bg-green-500 text-white' :
                            range.color === 'amber' ? 'bg-amber-500 text-white' :
                            'bg-red-500 text-white'
                          }`}
                        >
                          {range.level}
                        </div>
                      ))}
                    </div>
                    <div 
                      className="absolute top-10 transform -translate-x-1/2"
                      style={{ 
                        left: `${((cviScore - lowerBound) / (upperBound - lowerBound)) * 100}%` 
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-coastal-800" />
                        <span className="text-sm font-bold text-coastal-800 bg-white px-2 py-1 rounded shadow">
                          {cviScore.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-coastal-500 mt-12">
                    <span>Low Risk ({lowerBound})</span>
                    <span>High Risk ({upperBound})</span>
                  </div>
                </div>
                )}

                {/* Beach Profile Metrics Table */}
                {Object.keys(metrics).length > 0 && (
                <div className="card overflow-hidden">
                  <div className="p-6 border-b border-coastal-100">
                    <h2 className="text-xl font-display font-bold text-coastal-900">
                      Beach Profile Metrics ({cviYear})
                    </h2>
                    <p className="text-sm text-coastal-500 mt-1">
                      Elevation and slope measurements used for CVI calculation
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-coastal-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-coastal-700">Metric</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-coastal-700">Value</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-coastal-700">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-coastal-100">
                        {Object.entries(metrics).map(([key, val]) => {
                          const isHighlight = key.toLowerCase().includes('avg') || key.toLowerCase().includes('gain') || key.toLowerCase().includes('loss') || key.toLowerCase().includes('slope')
                          const unit = key.toLowerCase().includes('slope') ? '%' : key.toLowerCase().includes('year') ? '-' : 'm'
                          return (
                          <tr key={key} className={`hover:bg-coastal-50 transition-colors ${isHighlight ? 'bg-emerald-50' : ''}`}>
                            <td className={`px-6 py-4 text-sm font-medium ${isHighlight ? 'text-emerald-800' : 'text-coastal-900'}`}>{key}</td>
                            <td className={`px-6 py-4 text-sm text-right font-mono ${isHighlight ? 'font-semibold text-emerald-700' : 'text-coastal-700'}`}>{Number(val).toFixed(3)}</td>
                            <td className={`px-6 py-4 text-sm text-right ${isHighlight ? 'text-emerald-600' : 'text-coastal-500'}`}>{unit}</td>
                          </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                )}

                {/* CVI Component Rankings */}
                {components.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-lg font-display font-bold text-coastal-900 mb-4">
                    CVI Component Analysis
                  </h3>
                  <p className="text-sm text-coastal-500 mb-6">
                    Ranking of each metric based on quartile thresholds (1 = Low vulnerability, 4 = High vulnerability)
                  </p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {components.map((metric, index) => {
                      const rank = Number(metric.rank) || 1
                      return (
                      <div key={index} className="p-4 bg-coastal-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-coastal-700">{metric.name}</span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            rank === 1 ? 'bg-emerald-100 text-emerald-700' :
                            rank === 2 ? 'bg-green-100 text-green-700' :
                            rank === 3 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            Rank {rank}
                          </span>
                        </div>
                        <div className="text-xl font-bold text-coastal-900">
                          {Number(metric.value).toFixed(2)} {metric.unit || ''}
                        </div>
                        <div className="mt-2 h-2 bg-coastal-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              rank === 1 ? 'bg-emerald-500' :
                              rank === 2 ? 'bg-green-500' :
                              rank === 3 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${(rank / 4) * 100}%` }}
                          />
                        </div>
                      </div>
                      )
                    })}
                  </div>
                </div>
                )}

                {/* CVI Interpretation */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="card p-6">
                    <h3 className="text-lg font-display font-bold text-coastal-900 mb-4">
                      Interpretation
                    </h3>
                    <div className={`p-5 bg-${vulnColor}-50/80 rounded-xl border border-${vulnColor}-200/60 ring-1 ring-${vulnColor}-100/50`}>
                      <div className="flex items-start gap-3">
                        <CheckCircle className={`w-5 h-5 text-${vulnColor}-600 flex-shrink-0 mt-0.5`} />
                        <div>
                          <div className={`font-medium text-${vulnColor}-800`}>{vulnLevel} Vulnerability</div>
                          <div className={`text-sm text-${vulnColor}-700 mt-1`}>
                            The beach profile shows morphological characteristics consistent with a 
                            {' '}{vulnLevel.toLowerCase()} vulnerability classification based on CVI analysis
                            (score: {cviScore.toFixed(2)}).
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="card p-6">
                    <h3 className="text-lg font-display font-bold text-coastal-900 mb-4">
                      CVI Formula
                    </h3>
                    <div className="p-4 bg-coastal-50 rounded-xl">
                      <div className="font-mono text-sm text-coastal-700 mb-2">
                        CVI = &radic;(R&#x2081; &times; R&#x2082; &times; R&#x2083; &times; R&#x2084; &times; R&#x2085; / n)
                      </div>
                      <div className="text-sm text-coastal-500 mt-3">
                        Where R&#x2081;-R&#x2085; are quartile-based ranks for each metric, and n = 5 (number of variables).
                      </div>
                    </div>
                    {ranges.length > 0 && (
                    <div className="mt-4 text-sm text-coastal-600">
                      <strong>Vulnerability Thresholds:</strong>
                      <ul className="mt-2 space-y-1">
                        {ranges.map((r, i) => (
                          <li key={i}>&bull; {r.level}: {r.min.toFixed(2)} - {r.max.toFixed(2)}</li>
                        ))}
                      </ul>
                    </div>
                    )}
                  </div>
                </div>
                  </>
                  )
                })()}
              </div>
            )}
          </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
