import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Mountain,
  Activity,
  Table,
  TrendingUp,
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
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'

// Threshold comparison data (from notebook: comparison DataFrame)
const thresholdData = [
  { variable: 'Meridional wind speed', currentValue: -1.23, thresholdValue: -0.85, gap: 0.38 },
  { variable: 'Precipitation rate', currentValue: 0.00012, thresholdValue: 0.00015, gap: 0.00003 },
  { variable: 'Relative humidity', currentValue: 78.5, thresholdValue: 82.3, gap: 3.8 },
  { variable: 'Sea surface temperature', currentValue: 28.9, thresholdValue: 29.5, gap: 0.6 },
  { variable: 'Surface soil moisture', currentValue: 0.32, thresholdValue: 0.38, gap: 0.06 },
  { variable: 'Volumetric soil water layer 1', currentValue: 0.28, thresholdValue: 0.34, gap: 0.06 },
  { variable: '2 metre temperature', currentValue: 299.2, thresholdValue: 300.5, gap: 1.3 },
  { variable: 'Air temperature', currentValue: 26.8, thresholdValue: 27.5, gap: 0.7 },
  { variable: 'Zonal wind speed', currentValue: 2.45, thresholdValue: 3.12, gap: 0.67 },
]

// HMM State means (from notebook: state_means DataFrame)
const stateMeansData = [
  { 
    state: 'State_0', 
    meridionalWind: -0.45, 
    precipitation: 0.00008, 
    humidity: 75.2, 
    sst: 28.1, 
    soilMoisture: 0.28,
    soilWater: 0.24,
    temp2m: 298.5,
    airTemp: 25.8,
    zonalWind: 1.85
  },
  { 
    state: 'State_1', 
    meridionalWind: -1.12, 
    precipitation: 0.00018, 
    humidity: 85.6, 
    sst: 29.8, 
    soilMoisture: 0.42,
    soilWater: 0.38,
    temp2m: 301.2,
    airTemp: 28.2,
    zonalWind: 3.45
  },
  { 
    state: 'State_2', 
    meridionalWind: 0.35, 
    precipitation: 0.00005, 
    humidity: 68.4, 
    sst: 27.2, 
    soilMoisture: 0.22,
    soilWater: 0.18,
    temp2m: 297.8,
    airTemp: 24.5,
    zonalWind: 0.95
  },
  { 
    state: 'State_3', 
    meridionalWind: -0.85, 
    precipitation: 0.00015, 
    humidity: 82.3, 
    sst: 29.5, 
    soilMoisture: 0.38,
    soilWater: 0.34,
    temp2m: 300.5,
    airTemp: 27.5,
    zonalWind: 3.12
  },
]

// Seasonal alignment data (from notebook: crosstab of Month vs State)
const seasonalData = [
  { month: 'Apr', state0: 8, state1: 2, state2: 5, state3: 3 },
  { month: 'May', state0: 6, state1: 4, state2: 4, state3: 4 },
  { month: 'Jun', state0: 3, state1: 8, state2: 2, state3: 5 },
  { month: 'Jul', state0: 2, state1: 10, state2: 1, state3: 5 },
  { month: 'Aug', state0: 2, state1: 9, state2: 2, state3: 5 },
  { month: 'Sep', state0: 4, state1: 6, state2: 3, state3: 5 },
  { month: 'Oct', state0: 5, state1: 5, state2: 4, state3: 4 },
  { month: 'Nov', state0: 7, state1: 3, state2: 5, state3: 3 },
  { month: 'Dec', state0: 8, state1: 2, state2: 6, state3: 2 },
  { month: 'Jan', state0: 9, state1: 1, state2: 6, state3: 2 },
  { month: 'Feb', state0: 8, state1: 2, state2: 5, state3: 3 },
  { month: 'Mar', state0: 7, state1: 3, state2: 5, state3: 3 },
]

// HMM Transition matrix
const transitionMatrix = [
  { from: 'S0', S0: 0.72, S1: 0.08, S2: 0.12, S3: 0.08 },
  { from: 'S1', S0: 0.05, S1: 0.78, S2: 0.05, S3: 0.12 },
  { from: 'S2', S0: 0.15, S1: 0.05, S2: 0.70, S3: 0.10 },
  { from: 'S3', S0: 0.10, S1: 0.15, S2: 0.08, S3: 0.67 },
]

// Regime stability data
const regimeStability = {
  count: 18,
  mean: 3.2,
  std: 1.8,
  min: 0,
  q25: 2,
  q50: 3,
  q75: 4,
  max: 8
}

// CVI (Coastal Vulnerability Index) data from notebook
const cviData = {
  year: 2025,
  vulnerabilityLevel: 'Very low',
  upperBound: 4.0,
  lowerBound: 1.0,
  cviValue: 1.34,
  metrics: {
    elevationMinM: 0.000,
    elevationMaxM: 14.480,
    elevationAvgM: 6.400,
    distanceMeters: 1359.895,
    elevationGainM: 65.075,
    elevationLossM: -54.710,
    avgSlopeUpward: 7.750,
    avgSlopeDownward: -6.800,
  },
  // Quantile ranges for each metric
  quantiles: {
    elevationAvgM: { q25: 5.82, q50: 6.22, q75: 6.72, min: 4.92, max: 7.62 },
    elevationGainM: { q25: 55.44, q50: 62.10, q75: 69.87, min: 45.71, max: 82.69 },
    elevationLossM: { q25: -62.46, q50: -55.84, q75: -47.18, min: -77.69, max: -36.69 },
    avgSlopeUpward: { q25: 6.90, q50: 7.59, q75: 8.49, min: 5.99, max: 9.88 },
    avgSlopeDownward: { q25: -7.72, q50: -6.89, q75: -5.87, min: -9.29, max: -4.61 },
  },
  // Vulnerability level thresholds
  vulnerabilityRanges: [
    { level: 'Very low', min: 1.0, max: 1.75, color: 'emerald' },
    { level: 'Low', min: 1.75, max: 2.5, color: 'green' },
    { level: 'Moderate', min: 2.5, max: 3.25, color: 'amber' },
    { level: 'High', min: 3.25, max: 4.0, color: 'red' },
  ]
}

export default function MorphologicalThresholdPage() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('threshold')

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
                <div className="text-xl sm:text-2xl font-bold text-white">4</div>
                <div className="text-xs sm:text-sm text-white/80">HMM States</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 sm:px-5 py-2 sm:py-3 border border-white/30">
                <div className="text-xl sm:text-2xl font-bold text-white">9</div>
                <div className="text-xs sm:text-sm text-white/80">Variables</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 sm:px-5 py-2 sm:py-3 border border-white/30">
                <div className="text-xl sm:text-2xl font-bold text-emerald-400">67.8%</div>
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
                    <div className="text-3xl font-display font-bold text-coastal-900">67.8%</div>
                    <p className="text-sm text-coastal-500 mt-1">Next month transition</p>
                  </div>
                  <div className="card p-6 w-full sm:w-auto sm:min-w-[280px]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-sm text-coastal-500">Erosion State</span>
                    </div>
                    <div className="text-3xl font-display font-bold text-coastal-900">State 3</div>
                    <p className="text-sm text-coastal-500 mt-1">Dominant erosion regime</p>
                  </div>
                  <div className="card p-6 w-full sm:w-auto sm:min-w-[280px]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-ocean-100 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-ocean-600" />
                      </div>
                      <span className="text-sm text-coastal-500">Variables Tracked</span>
                    </div>
                    <div className="text-3xl font-display font-bold text-coastal-900">9</div>
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
                        {thresholdData.map((row, index) => (
                          <tr key={index} className="hover:bg-coastal-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-coastal-900">{row.variable}</td>
                            <td className="px-6 py-4 text-sm text-right font-mono text-coastal-700">
                              {row.currentValue.toFixed(4)}
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-mono text-emerald-600 font-semibold">
                              {row.thresholdValue.toFixed(4)}
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-mono">
                              <span className={row.gap > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                                {row.gap > 0 ? '+' : ''}{row.gap.toFixed(4)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {row.gap > 0 ? (
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
                        ))}
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
                      const intensity = Math.min(Math.abs(row.gap) * 10, 1)
                      const color = row.gap > 0 
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
                            {row.gap > 0 ? '+' : ''}{row.gap.toFixed(2)}
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
                          <th className="px-4 py-3 text-center text-sm font-semibold text-coastal-700">S0</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-coastal-700">S1</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-coastal-700">S2</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-emerald-600">S3 (Erosion)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transitionMatrix.map((row, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm font-semibold text-coastal-700">{row.from}</td>
                            {['S0', 'S1', 'S2', 'S3'].map((col) => (
                              <td key={col} className="px-4 py-3 text-center">
                                <span 
                                  className={`inline-block px-3 py-1 rounded-lg font-mono text-sm ${
                                    row[col] > 0.5 
                                      ? 'bg-emerald-100 text-emerald-700 font-semibold' 
                                      : row[col] > 0.1 
                                        ? 'bg-coastal-100 text-coastal-700'
                                        : 'bg-coastal-50 text-coastal-400'
                                  }`}
                                >
                                  {row[col].toFixed(2)}
                                </span>
                              </td>
                            ))}
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
                      <div className="text-2xl font-bold text-coastal-900">{regimeStability.mean}</div>
                    </div>
                    <div className="p-4 bg-coastal-50 rounded-xl">
                      <div className="text-sm text-coastal-500">Std Dev</div>
                      <div className="text-2xl font-bold text-coastal-900">{regimeStability.std}</div>
                    </div>
                    <div className="p-4 bg-coastal-50 rounded-xl">
                      <div className="text-sm text-coastal-500">Min</div>
                      <div className="text-2xl font-bold text-coastal-900">{regimeStability.min}</div>
                    </div>
                    <div className="p-4 bg-coastal-50 rounded-xl">
                      <div className="text-sm text-coastal-500">Max</div>
                      <div className="text-2xl font-bold text-coastal-900">{regimeStability.max}</div>
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
                    {[
                      { state: 'State 0', value: 0.12, color: 'bg-blue-500' },
                      { state: 'State 1', value: 0.18, color: 'bg-purple-500' },
                      { state: 'State 2', value: 0.15, color: 'bg-amber-500' },
                      { state: 'State 3', value: 0.55, color: 'bg-emerald-500' },
                    ].map((item) => (
                      <div key={item.state} className="flex-1">
                        <div className="text-sm text-coastal-600 mb-2">{item.state}</div>
                        <div className="h-32 bg-coastal-100 rounded-lg relative overflow-hidden">
                          <div 
                            className={`absolute bottom-0 left-0 right-0 ${item.color} rounded-lg transition-all`}
                            style={{ height: `${item.value * 100}%` }}
                          />
                        </div>
                        <div className="text-lg font-bold text-coastal-900 mt-2">
                          {(item.value * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Regime Profiles */}
            {activeTab === 'regime' && (
              <div id="regime" className="space-y-6 scroll-mt-24">
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
                          <th className="px-4 py-3 text-right text-sm font-semibold text-coastal-700">Meridional Wind</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-coastal-700">Precipitation</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-coastal-700">Humidity</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-coastal-700">SST</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-coastal-700">Soil Moisture</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-coastal-700">Zonal Wind</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-coastal-100">
                        {stateMeansData.map((row, index) => (
                          <tr 
                            key={index} 
                            className={`hover:bg-coastal-50 transition-colors ${
                              row.state === 'State_3' ? 'bg-emerald-50' : ''
                            }`}
                          >
                            <td className="px-4 py-3 text-sm font-semibold text-coastal-900">
                              <span className={`inline-flex items-center gap-2 ${
                                row.state === 'State_3' ? 'text-emerald-700' : ''
                              }`}>
                                {row.state}
                                {row.state === 'State_3' && (
                                  <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
                                    Erosion
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-mono text-coastal-700">
                              {row.meridionalWind.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-mono text-coastal-700">
                              {row.precipitation.toFixed(5)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-mono text-coastal-700">
                              {row.humidity.toFixed(1)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-mono text-coastal-700">
                              {row.sst.toFixed(1)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-mono text-coastal-700">
                              {row.soilMoisture.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-mono text-coastal-700">
                              {row.zonalWind.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* State Characteristics */}
                <div className="grid md:grid-cols-2 gap-6">
                  {stateMeansData.map((state, index) => (
                    <div 
                      key={index}
                      className={`card p-6 ${state.state === 'State_3' ? 'ring-2 ring-emerald-500' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-display font-bold text-coastal-900">
                          {state.state}
                        </h3>
                        {state.state === 'State_3' && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
                            Erosion Dominant
                          </span>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-coastal-500">Temperature</span>
                          <span className="text-sm font-medium text-coastal-900">{state.airTemp}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-coastal-500">Humidity</span>
                          <span className="text-sm font-medium text-coastal-900">{state.humidity}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-coastal-500">SST</span>
                          <span className="text-sm font-medium text-coastal-900">{state.sst}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-coastal-500">Wind (Zonal)</span>
                          <span className="text-sm font-medium text-coastal-900">{state.zonalWind} m/s</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seasonal Analysis */}
            {activeTab === 'seasonal' && (
              <div id="seasonal" className="space-y-6 scroll-mt-24">
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
                          <th className="px-4 py-3 text-center text-sm font-semibold text-blue-600">State 0</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-purple-600">State 1</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-amber-600">State 2</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-emerald-600">State 3 (Erosion)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-coastal-100">
                        {seasonalData.map((row, index) => {
                          const max = Math.max(row.state0, row.state1, row.state2, row.state3)
                          return (
                            <tr key={index} className="hover:bg-coastal-50 transition-colors">
                              <td className="px-4 py-3 text-sm font-semibold text-coastal-900">{row.month}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block w-10 py-1 rounded ${
                                  row.state0 === max ? 'bg-blue-500 text-white font-bold' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {row.state0}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block w-10 py-1 rounded ${
                                  row.state1 === max ? 'bg-purple-500 text-white font-bold' : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {row.state1}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block w-10 py-1 rounded ${
                                  row.state2 === max ? 'bg-amber-500 text-white font-bold' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {row.state2}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block w-10 py-1 rounded ${
                                  row.state3 === max ? 'bg-emerald-500 text-white font-bold' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {row.state3}
                                </span>
                              </td>
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
                      Months with highest State 3 (Erosion) occurrence
                    </p>
                    <div className="space-y-3">
                      {['Jun', 'Jul', 'Aug', 'Sep'].map((month) => {
                        const data = seasonalData.find(s => s.month === month)
                        const percentage = (data.state3 / (data.state0 + data.state1 + data.state2 + data.state3)) * 100
                        return (
                          <div key={month} className="flex items-center gap-3">
                            <span className="w-12 text-sm font-medium text-coastal-900">{month}</span>
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
              </div>
            )}

            {/* Coastal Vulnerability Index (CVI) */}
            {activeTab === 'cvi' && (
              <div id="cvi" className="space-y-6 scroll-mt-24">
                {/* CVI Summary Cards */}
                <div className="flex flex-wrap gap-6">
                  <div className="card p-6 w-full sm:w-auto sm:min-w-[280px]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-sm text-coastal-500">Vulnerability Level</span>
                    </div>
                    <div className="text-3xl font-display font-bold text-emerald-600">{cviData.vulnerabilityLevel}</div>
                    <p className="text-sm text-coastal-500 mt-1">Current assessment ({cviData.year})</p>
                  </div>
                  <div className="card p-6 w-full sm:w-auto sm:min-w-[280px]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-ocean-100 flex items-center justify-center">
                        <Gauge className="w-5 h-5 text-ocean-600" />
                      </div>
                      <span className="text-sm text-coastal-500">CVI Score</span>
                    </div>
                    <div className="text-3xl font-display font-bold text-coastal-900">{cviData.cviValue.toFixed(2)}</div>
                    <p className="text-sm text-coastal-500 mt-1">Range: {cviData.lowerBound} - {cviData.upperBound}</p>
                  </div>
                  <div className="card p-6 w-full sm:w-auto sm:min-w-[280px]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm text-coastal-500">Assessment Year</span>
                    </div>
                    <div className="text-3xl font-display font-bold text-coastal-900">{cviData.year}</div>
                    <p className="text-sm text-coastal-500 mt-1">Latest evaluation data</p>
                  </div>
                </div>

                {/* Vulnerability Scale */}
                <div className="card p-6">
                  <h3 className="text-lg font-display font-bold text-coastal-900 mb-4">
                    Coastal Vulnerability Scale
                  </h3>
                  <div className="relative">
                    <div className="flex h-8 rounded-lg overflow-hidden">
                      {cviData.vulnerabilityRanges.map((range, index) => (
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
                    {/* Current position indicator */}
                    <div 
                      className="absolute top-10 transform -translate-x-1/2"
                      style={{ 
                        left: `${((cviData.cviValue - cviData.lowerBound) / (cviData.upperBound - cviData.lowerBound)) * 100}%` 
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-coastal-800" />
                        <span className="text-sm font-bold text-coastal-800 bg-white px-2 py-1 rounded shadow">
                          {cviData.cviValue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-coastal-500 mt-12">
                    <span>Low Risk ({cviData.lowerBound})</span>
                    <span>High Risk ({cviData.upperBound})</span>
                  </div>
                </div>

                {/* Beach Profile Metrics Table */}
                <div className="card overflow-hidden">
                  <div className="p-6 border-b border-coastal-100">
                    <h2 className="text-xl font-display font-bold text-coastal-900">
                      Beach Profile Metrics ({cviData.year})
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
                        <tr className="hover:bg-coastal-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-coastal-900">Year</td>
                          <td className="px-6 py-4 text-sm text-right font-mono text-coastal-700">{cviData.year}</td>
                          <td className="px-6 py-4 text-sm text-right text-coastal-500">-</td>
                        </tr>
                        <tr className="hover:bg-coastal-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-coastal-900">Elevation Min</td>
                          <td className="px-6 py-4 text-sm text-right font-mono text-coastal-700">{cviData.metrics.elevationMinM.toFixed(3)}</td>
                          <td className="px-6 py-4 text-sm text-right text-coastal-500">m</td>
                        </tr>
                        <tr className="hover:bg-coastal-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-coastal-900">Elevation Max</td>
                          <td className="px-6 py-4 text-sm text-right font-mono text-coastal-700">{cviData.metrics.elevationMaxM.toFixed(3)}</td>
                          <td className="px-6 py-4 text-sm text-right text-coastal-500">m</td>
                        </tr>
                        <tr className="hover:bg-coastal-50 transition-colors bg-emerald-50">
                          <td className="px-6 py-4 text-sm font-medium text-emerald-800">Elevation AVG</td>
                          <td className="px-6 py-4 text-sm text-right font-mono font-semibold text-emerald-700">{cviData.metrics.elevationAvgM.toFixed(3)}</td>
                          <td className="px-6 py-4 text-sm text-right text-emerald-600">m</td>
                        </tr>
                        <tr className="hover:bg-coastal-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-coastal-900">Distance</td>
                          <td className="px-6 py-4 text-sm text-right font-mono text-coastal-700">{cviData.metrics.distanceMeters.toFixed(3)}</td>
                          <td className="px-6 py-4 text-sm text-right text-coastal-500">m</td>
                        </tr>
                        <tr className="hover:bg-coastal-50 transition-colors bg-emerald-50">
                          <td className="px-6 py-4 text-sm font-medium text-emerald-800">Elevation Gain</td>
                          <td className="px-6 py-4 text-sm text-right font-mono font-semibold text-emerald-700">{cviData.metrics.elevationGainM.toFixed(3)}</td>
                          <td className="px-6 py-4 text-sm text-right text-emerald-600">m</td>
                        </tr>
                        <tr className="hover:bg-coastal-50 transition-colors bg-emerald-50">
                          <td className="px-6 py-4 text-sm font-medium text-emerald-800">Elevation Loss</td>
                          <td className="px-6 py-4 text-sm text-right font-mono font-semibold text-emerald-700">{cviData.metrics.elevationLossM.toFixed(3)}</td>
                          <td className="px-6 py-4 text-sm text-right text-emerald-600">m</td>
                        </tr>
                        <tr className="hover:bg-coastal-50 transition-colors bg-emerald-50">
                          <td className="px-6 py-4 text-sm font-medium text-emerald-800">AVG Slope Steepest Upward</td>
                          <td className="px-6 py-4 text-sm text-right font-mono font-semibold text-emerald-700">{cviData.metrics.avgSlopeUpward.toFixed(3)}</td>
                          <td className="px-6 py-4 text-sm text-right text-emerald-600">%</td>
                        </tr>
                        <tr className="hover:bg-coastal-50 transition-colors bg-emerald-50">
                          <td className="px-6 py-4 text-sm font-medium text-emerald-800">AVG Slope Steepest Downward</td>
                          <td className="px-6 py-4 text-sm text-right font-mono font-semibold text-emerald-700">{cviData.metrics.avgSlopeDownward.toFixed(3)}</td>
                          <td className="px-6 py-4 text-sm text-right text-emerald-600">%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* CVI Component Rankings */}
                <div className="card p-6">
                  <h3 className="text-lg font-display font-bold text-coastal-900 mb-4">
                    CVI Component Analysis
                  </h3>
                  <p className="text-sm text-coastal-500 mb-6">
                    Ranking of each metric based on quartile thresholds (1 = Low vulnerability, 4 = High vulnerability)
                  </p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: 'Elevation AVG', value: cviData.metrics.elevationAvgM, rank: 1, unit: 'm' },
                      { name: 'Elevation Gain', value: cviData.metrics.elevationGainM, rank: 1, unit: 'm' },
                      { name: 'Elevation Loss', value: cviData.metrics.elevationLossM, rank: 1, unit: 'm' },
                      { name: 'Slope Upward', value: cviData.metrics.avgSlopeUpward, rank: 1, unit: '%' },
                      { name: 'Slope Downward', value: cviData.metrics.avgSlopeDownward, rank: 1, unit: '%' },
                    ].map((metric, index) => (
                      <div key={index} className="p-4 bg-coastal-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-coastal-700">{metric.name}</span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            metric.rank === 1 ? 'bg-emerald-100 text-emerald-700' :
                            metric.rank === 2 ? 'bg-green-100 text-green-700' :
                            metric.rank === 3 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            Rank {metric.rank}
                          </span>
                        </div>
                        <div className="text-xl font-bold text-coastal-900">
                          {metric.value.toFixed(2)} {metric.unit}
                        </div>
                        <div className="mt-2 h-2 bg-coastal-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              metric.rank === 1 ? 'bg-emerald-500' :
                              metric.rank === 2 ? 'bg-green-500' :
                              metric.rank === 3 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${(metric.rank / 4) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CVI Interpretation */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="card p-6">
                    <h3 className="text-lg font-display font-bold text-coastal-900 mb-4">
                      Interpretation
                    </h3>
                    <div className="p-5 bg-emerald-50/80 rounded-xl border border-emerald-200/60 ring-1 ring-emerald-100/50">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-emerald-800">Very Low Vulnerability</div>
                          <div className="text-sm text-emerald-700 mt-1">
                            The beach profile shows strong morphological stability with favorable elevation 
                            and slope characteristics. Current conditions indicate minimal erosion susceptibility.
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
                        CVI = √(R₁ × R₂ × R₃ × R₄ × R₅ / n)
                      </div>
                      <div className="text-sm text-coastal-500 mt-3">
                        Where R₁-R₅ are quartile-based ranks for each metric, and n = 5 (number of variables).
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-coastal-600">
                      <strong>Vulnerability Thresholds:</strong>
                      <ul className="mt-2 space-y-1">
                        <li>• Very Low: 1.00 - 1.75</li>
                        <li>• Low: 1.75 - 2.50</li>
                        <li>• Moderate: 2.50 - 3.25</li>
                        <li>• High: 3.25 - 4.00</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}
