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

// Complete threshold data from notebook analysis
const thresholdData = [
  {
    id: 0,
    Driver: 'Hm0_max',
    Unit: 'm',
    GMM_Threshold: 2.926,
    RF_Threshold: 2.735,
    Erosion_Threshold_Lower: 2.735,
    Erosion_Threshold_Upper: 2.926,
    Model_Consensus: 'High',
    Physical_Interpretation: 'Wave energy exceeds sediment resistance'
  },
  {
    id: 1,
    Driver: 'UcurrMax',
    Unit: 'm/s',
    GMM_Threshold: 0.505,
    RF_Threshold: 0.435,
    Erosion_Threshold_Lower: 0.435,
    Erosion_Threshold_Upper: 0.505,
    Model_Consensus: 'Low',
    Physical_Interpretation: 'Offshore sediment transport intensifies'
  },
  {
    id: 2,
    Driver: 'WindMax',
    Unit: 'm/s',
    GMM_Threshold: 6.568,
    RF_Threshold: 6.485,
    Erosion_Threshold_Lower: 6.485,
    Erosion_Threshold_Upper: 6.568,
    Model_Consensus: 'Medium',
    Physical_Interpretation: 'Wave generation and surge enhancement'
  },
  {
    id: 3,
    Driver: 'CumCurrent',
    Unit: 'm/day',
    GMM_Threshold: 55.107,
    RF_Threshold: 54.130,
    Erosion_Threshold_Lower: 54.130,
    Erosion_Threshold_Upper: 55.107,
    Model_Consensus: 'Low',
    Physical_Interpretation: 'Sustained sediment flux offshore'
  },
  {
    id: 4,
    Driver: 'StormDays_wave',
    Unit: 'days',
    GMM_Threshold: 165.786,
    RF_Threshold: 174.000,
    Erosion_Threshold_Lower: 165.786,
    Erosion_Threshold_Upper: 174.000,
    Model_Consensus: 'Medium',
    Physical_Interpretation: 'Prolonged high-energy exposure'
  }
]

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
  // Calculate statistics
  const stats = {
    totalDrivers: thresholdData.length,
    highConsensus: thresholdData.filter(t => t.Model_Consensus === 'High').length,
    mediumConsensus: thresholdData.filter(t => t.Model_Consensus === 'Medium').length,
    lowConsensus: thresholdData.filter(t => t.Model_Consensus === 'Low').length,
  }

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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
                <Target className="w-4 h-4" />
                Final Summary Analysis
              </div>
              <h1 className="section-title mb-4">
                Final Erosion Threshold Summary
              </h1>
              <p className="section-subtitle">
                Comprehensive threshold values derived from GMM clustering and Random Forest analysis
                for identifying coastal erosion-triggering conditions.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h3 className="font-display font-semibold text-white text-xl flex items-center gap-2">
                  <Target className="w-6 h-6" />
                  Final Threshold Summary Table
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  Comparison of erosion thresholds with physical interpretation
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="py-4 px-4 text-left font-bold text-gray-600 uppercase tracking-wider text-xs">
                        #
                      </th>
                      <th className="py-4 px-4 text-left font-bold text-gray-600 uppercase tracking-wider text-xs">
                        Driver
                      </th>
                      <th className="py-4 px-4 text-center font-bold text-gray-600 uppercase tracking-wider text-xs">
                        Unit
                      </th>
                      <th className="py-4 px-4 text-center font-bold text-gray-600 uppercase tracking-wider text-xs">
                        Erosion_Threshold_Lower
                      </th>
                      <th className="py-4 px-4 text-center font-bold text-gray-600 uppercase tracking-wider text-xs">
                        Erosion_Threshold_Upper
                      </th>
                      <th className="py-4 px-4 text-center font-bold text-gray-600 uppercase tracking-wider text-xs">
                        Model_Consensus
                      </th>
                      <th className="py-4 px-4 text-left font-bold text-gray-600 uppercase tracking-wider text-xs">
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
                          <td className="py-4 px-4">
                            <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                              {item.id}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Icon className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="font-semibold text-gray-900">{item.Driver}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex px-2 py-1 rounded bg-gray-100 text-gray-600 text-sm font-mono">
                              {item.Unit}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex px-3 py-1.5 rounded-lg bg-cyan-100 text-cyan-700 font-semibold font-mono text-sm">
                              {item.Erosion_Threshold_Lower.toFixed(3)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex px-3 py-1.5 rounded-lg bg-teal-100 text-teal-700 font-semibold font-mono text-sm">
                              {item.Erosion_Threshold_Upper.toFixed(3)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold border ${getConsensusColor(item.Model_Consensus)}`}>
                              {item.Model_Consensus}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-gray-700 text-sm">
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
                className="card p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Info className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-3">
                      Column Descriptions
                    </h3>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p><strong>GMM_Threshold:</strong> Derived from Gaussian Mixture Model clustering</p>
                      <p><strong>RF_Threshold:</strong> Derived from Random Forest feature splits</p>
                      <p><strong>Lower/Upper Bound:</strong> Range between RF and GMM thresholds</p>
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
                className="card p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Model Consensus Levels
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-300">High</span>
                        <span className="text-gray-600">Strong agreement between GMM and RF thresholds</span>
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
      </div>
    </PageTransition>
  )
}
