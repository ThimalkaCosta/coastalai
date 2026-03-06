import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  Waves,
  Wind,
  Droplets,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Activity,
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import StatCard from '../components/common/StatCard'
import { useData } from '../context/DataContext'

// Get icon for driver
const getDriverIcon = (driver) => {
  if (driver.includes('Hm0') || driver.includes('Wave')) return Waves
  if (driver.includes('Wind')) return Wind
  if (driver.includes('curr') || driver.includes('Curr')) return Droplets
  if (driver.includes('Storm')) return AlertTriangle
  return Activity
}

// Get consensus badge color
const getConsensusColor = (consensus) => {
  switch (consensus) {
    case 'High':
      return 'bg-green-100 text-green-700 border-green-300'
    case 'Medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    case 'Low':
      return 'bg-red-100 text-red-700 border-red-300'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300'
  }
}

export default function ThresholdPage() {
  const { data, loading: ctxLoading } = useData()
  const [thresholdData, setThresholdData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Prefer dynamic data from DataContext (analysis_results.json via API)
    if (data?.thresholds && Array.isArray(data.thresholds) && data.thresholds.length > 0) {
      const dataWithIds = data.thresholds.map((item, index) => ({ ...item, id: index }))
      setThresholdData(dataWithIds)
      setLoading(false)
      return
    }

    // Fallback: load from static erosion_thresholds.json
    if (!ctxLoading) {
      fetch('/data/erosion_thresholds.json')
        .then(response => response.json())
        .then(jsonData => {
          const dataWithIds = jsonData.map((item, index) => ({ ...item, id: index }))
          setThresholdData(dataWithIds)
          setLoading(false)
        })
        .catch(error => {
          console.error('Error loading threshold data:', error)
          setLoading(false)
        })
    }
  }, [data?.thresholds, ctxLoading])

  // Calculate statistics
  const stats = {
    totalDrivers: thresholdData.length,
    highConsensus: thresholdData.filter(t => t.Model_Consensus === 'High').length,
    mediumConsensus: thresholdData.filter(t => t.Model_Consensus === 'Medium').length,
    lowConsensus: thresholdData.filter(t => t.Model_Consensus === 'Low').length,
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-coastal-50 to-white bg-mesh-1">
        {/* Header */}
        <section className="pt-8 sm:pt-10 pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <div className="page-badge bg-blue-50 text-blue-600 border-blue-100 mb-4">
                <Target className="w-3.5 h-3.5" />
                Final Summary Analysis
              </div>
              <h1 className="section-title mb-3">
                Final Erosion Threshold Summary
              </h1>
              <p className="section-subtitle">
                Comprehensive threshold values derived from HMM state detection and Random Forest analysis
                for identifying coastal erosion-triggering conditions.
              </p>
            </motion.div>
          </div>
        </section>

        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-coastal-600">Loading threshold data...</p>
          </div>
        ) : thresholdData.length === 0 ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-coastal-900 mb-2">No Threshold Data Available</h3>
            <p className="text-coastal-600">Please run the notebook analysis to generate threshold data.</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <section className="pb-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total Drivers"
                    value={stats.totalDrivers}
                    subtitle="identified factors"
                    icon={Target}
                    delay={0.1}
                  />
                  <StatCard
                    title="High Consensus"
                    value={stats.highConsensus}
                    subtitle="strong agreement"
                    icon={CheckCircle}
                    delay={0.15}
                  />
                  <StatCard
                    title="Medium Consensus"
                    value={stats.mediumConsensus}
                    subtitle="moderate agreement"
                    icon={AlertTriangle}
                    delay={0.2}
                  />
                  <StatCard
                    title="Low Consensus"
                value={stats.lowConsensus}
                subtitle="larger variation"
                icon={TrendingUp}
                delay={0.25}
              />
            </div>
          </div>
        </section>

        {/* Main Threshold Summary Table */}
        <section className="pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3">
                <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Final Threshold Summary Table
                </h3>
                <p className="text-blue-100 text-xs mt-0.5">
                  Comparison of erosion thresholds with physical interpretation
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-coastal-50/80 border-b-2 border-coastal-200">
                      <th className="py-3.5 px-3 text-left font-semibold text-coastal-600 uppercase tracking-wider text-xs">
                        #
                      </th>
                      <th className="py-3.5 px-3 text-left font-semibold text-coastal-600 uppercase tracking-wider text-xs">
                        Driver
                      </th>
                      <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">
                        Unit
                      </th>
                      <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">
                        HMM_Threshold
                      </th>
                      <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">
                        RF_Threshold
                      </th>
                      <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">
                        Erosion_Threshold_Lower
                      </th>
                      <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">
                        Erosion_Threshold_Upper
                      </th>
                      <th className="py-3.5 px-3 text-center font-semibold text-coastal-600 uppercase tracking-wider text-xs">
                        Model_Consensus
                      </th>
                      <th className="py-3.5 px-3 text-left font-semibold text-coastal-600 uppercase tracking-wider text-xs">
                        Physical_Interpretation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {thresholdData.map((item, index) => {
                      const Icon = getDriverIcon(item.Driver)
                      return (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          className={`hover:bg-blue-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                              {item.id}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Icon className="w-3.5 h-3.5 text-blue-600" />
                              </div>
                              <span className="font-semibold text-xs text-gray-900">{item.Driver}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-flex px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-mono">
                              {item.Unit}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 font-semibold font-mono text-xs">
                              {item.HMM_Threshold != null ? item.HMM_Threshold.toFixed(3) : '--'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-700 font-semibold font-mono text-xs">
                              {item.RF_Threshold != null ? item.RF_Threshold.toFixed(3) : '--'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex px-2.5 py-1 rounded-lg bg-cyan-100 text-cyan-700 font-semibold font-mono text-xs">
                              {item.Erosion_Threshold_Lower != null ? item.Erosion_Threshold_Lower.toFixed(3) : '--'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex px-2.5 py-1 rounded-lg bg-teal-100 text-teal-700 font-semibold font-mono text-xs">
                              {item.Erosion_Threshold_Upper != null ? item.Erosion_Threshold_Upper.toFixed(3) : '--'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${getConsensusColor(item.Model_Consensus)}`}>
                              {item.Model_Consensus}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-gray-700 text-xs">
                              {item.Physical_Interpretation}
                            </span>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Info Box */}
        <section className="pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Column Descriptions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="card p-4 bg-gradient-to-br from-blue-50/80 to-cyan-50/80 border-blue-200/60 ring-1 ring-blue-100/50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 text-sm mb-2">
                      Column Descriptions
                    </h3>
                    <div className="space-y-1.5 text-xs text-blue-800">
                      <p><strong>HMM_Threshold:</strong> Derived from Hidden Markov Model state detection</p>
                      <p><strong>RF_Threshold:</strong> Derived from Random Forest feature splits</p>
                      <p><strong>Lower/Upper Bound:</strong> Range between RF and HMM thresholds</p>
                      <p><strong>Model_Consensus:</strong> Agreement level between models</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Consensus Legend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="card p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-2">
                      Model Consensus Levels
                    </h3>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-300">High</span>
                        <span className="text-gray-600">Strong agreement between HMM and RF thresholds</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold border border-yellow-300">Medium</span>
                        <span className="text-gray-600">Moderate agreement with some variation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-300">Low</span>
                        <span className="text-gray-600">Larger difference between model thresholds</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
          </>
        )}
      </div>
    </PageTransition>
  )
}
