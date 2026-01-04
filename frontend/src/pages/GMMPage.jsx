import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  Layers,
  PieChart,
  BarChart3,
  Waves,
  Wind,
  Droplets,
  Info,
  Circle,
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import StatCard from '../components/common/StatCard'
import Tabs from '../components/common/Tabs'
import StateDistributionChart from '../components/charts/StateDistributionChart'
import StateProbabilityChart from '../components/charts/StateProbabilityChart'
import DataTable from '../components/common/DataTable'
import { useData } from '../context/DataContext'

export default function GMMPage() {
  const { data, dataLoaded } = useData()
  const [activeTab, setActiveTab] = useState('distribution')

  // State distribution data from actual results
  const stateDistribution = useMemo(() => {
    if (data.models?.gmm?.stateDistribution?.length) {
      return data.models.gmm.stateDistribution
    }
    return []
  }, [data])

  // State means from actual results
  const stateMeans = useMemo(() => {
    if (data.models?.gmm?.stateMeans) {
      return data.models.gmm.stateMeans
    }
    return {
      normal: { Hm0_max: 0, UcurrMax: 0, WindMax: 0 },
      highRisk: { Hm0_max: 0, UcurrMax: 0, WindMax: 0 },
    }
  }, [data])

  // Threshold values from actual GMM results
  const thresholds = useMemo(() => {
    if (data.models?.gmm?.thresholds) {
      return data.models.gmm.thresholds
    }
    return {}
  }, [data])

  // All thresholds as array for table display
  const thresholdsArray = useMemo(() => {
    if (!thresholds || Object.keys(thresholds).length === 0) return []
    
    const descriptions = {
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
    }
    
    return Object.entries(thresholds).map(([key, val]) => ({
      feature: key,
      value: val.value,
      unit: val.unit,
      condition: val.condition,
      description: descriptions[key] || key,
    }))
  }, [thresholds])

  // Model metrics from actual results
  const metrics = useMemo(() => {
    const gmmMetrics = data.models?.gmm?.metrics || {}
    return {
      silhouetteScore: gmmMetrics.silhouetteScore || gmmMetrics.accuracy || 0,
      logLikelihood: gmmMetrics.logLikelihood || 0,
      bic: gmmMetrics.bic || 0,
      aic: gmmMetrics.aic || 0,
      nComponents: gmmMetrics.nStates || gmmMetrics.nComponents || stateDistribution.length || 0,
      convergenceIter: gmmMetrics.convergenceIter || 0,
      accuracy: gmmMetrics.accuracy || 0,
    }
  }, [data, stateDistribution])

  // Probability data from actual results - transform for display
  const probabilityData = useMemo(() => {
    if (data.models?.gmm?.probabilityData?.length) {
      return data.models.gmm.probabilityData.map(item => ({
        year: item.year,
        normalProb: item.state0 || 0,
        highRiskProb: item.state1 || 0,
        extremeProb: item.state2 || 0,
        state: item.state0 > item.state1 && item.state0 > (item.state2 || 0) ? 0 : 
               item.state1 > (item.state2 || 0) ? 1 : 2,
        assignedState: item.state0 > item.state1 && item.state0 > (item.state2 || 0) ? 'Normal' : 
                       item.state1 > (item.state2 || 0) ? 'High Risk' : 'Extreme',
      }))
    }
    return []
  }, [data])

  const tabs = [
    { id: 'distribution', label: 'State Distribution' },
    { id: 'thresholds', label: 'Thresholds' },
    { id: 'probability', label: 'Probability Analysis' },
    { id: 'metrics', label: 'Model Metrics' },
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-4">
                <Layers className="w-4 h-4" />
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

        {/* Stats Grid */}
        <section className="pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Components"
                value={metrics.nComponents}
                subtitle="hidden states"
                icon={Layers}
                delay={0.1}
              />
              <StatCard
                title="Model Accuracy"
                value={`${(metrics.accuracy * 100).toFixed(1)}%`}
                icon={Target}
                delay={0.15}
              />
              <StatCard
                title="Normal State"
                value={`${stateDistribution[0]?.percentage || 0}%`}
                subtitle="of observations"
                icon={Circle}
                delay={0.2}
              />
              <StatCard
                title="High Risk State"
                value={`${stateDistribution[1]?.percentage || 0}%`}
                subtitle="of observations"
                icon={PieChart}
                delay={0.25}
              />
            </div>
          </div>
        </section>

        {/* Model Info */}
        <section className="pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-6 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-violet-600" />
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

              <div className="card p-6 mt-6">
                {activeTab === 'distribution' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="font-display font-semibold text-coastal-900 mb-2">
                        State Distribution
                      </h3>
                      <p className="text-sm text-coastal-600">
                        Distribution of observations across identified environmental states.
                      </p>
                    </div>
                    
                    <div className="grid lg:grid-cols-2 gap-8">
                      <StateDistributionChart data={stateDistribution} />
                      
                      <div className="space-y-4">
                        {/* Normal State */}
                        {stateDistribution[0] && (
                          <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-4 h-4 rounded-full bg-blue-500" />
                              <h4 className="font-semibold text-blue-900">{stateDistribution[0].state} State</h4>
                              <span className="ml-auto text-lg font-bold text-blue-700">{stateDistribution[0].percentage}%</span>
                            </div>
                            <p className="text-sm text-blue-700 mb-4">
                              Environmental conditions within typical ranges. Lower erosion risk.
                            </p>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-blue-600">Wave Height (Hm0_max)</span>
                                <span className="font-medium text-blue-900">{stateMeans.normal?.Hm0_max?.toFixed(2) || '-'}m</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-600">Current Speed (UcurrMax)</span>
                                <span className="font-medium text-blue-900">{stateMeans.normal?.UcurrMax?.toFixed(3) || '-'}m/s</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-600">Wind Speed (WindMax)</span>
                                <span className="font-medium text-blue-900">{stateMeans.normal?.WindMax?.toFixed(2) || '-'}m/s</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* High Risk State */}
                        {stateDistribution[1] && (
                          <div className="p-6 bg-red-50 rounded-xl border border-red-200">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-4 h-4 rounded-full bg-red-500" />
                              <h4 className="font-semibold text-red-900">{stateDistribution[1].state} State</h4>
                              <span className="ml-auto text-lg font-bold text-red-700">{stateDistribution[1].percentage}%</span>
                            </div>
                            <p className="text-sm text-red-700 mb-4">
                              Elevated environmental conditions associated with erosion events.
                            </p>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-red-600">Wave Height (Hm0_max)</span>
                                <span className="font-medium text-red-900">{stateMeans.highRisk?.Hm0_max?.toFixed(2) || '-'}m</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-red-600">Current Speed (UcurrMax)</span>
                                <span className="font-medium text-red-900">{stateMeans.highRisk?.UcurrMax?.toFixed(3) || '-'}m/s</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-red-600">Wind Speed (WindMax)</span>
                                <span className="font-medium text-red-900">{stateMeans.highRisk?.WindMax?.toFixed(2) || '-'}m/s</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Extreme State (if exists) */}
                        {stateDistribution[2] && (
                          <div className="p-6 bg-orange-50 rounded-xl border border-orange-200">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-4 h-4 rounded-full bg-orange-600" />
                              <h4 className="font-semibold text-orange-900">{stateDistribution[2].state} State</h4>
                              <span className="ml-auto text-lg font-bold text-orange-700">{stateDistribution[2].percentage}%</span>
                            </div>
                            <p className="text-sm text-orange-700 mb-4">
                              Extreme conditions with highest erosion risk.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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
                    {thresholds.Hm0_max && thresholds.UcurrMax && thresholds.WindMax && (
                      <div className="grid sm:grid-cols-3 gap-6 mb-8">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 }}
                          className="p-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl text-white shadow-lg"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <Waves className="w-8 h-8 opacity-80" />
                            <span className="font-medium opacity-90">Wave Height</span>
                          </div>
                          <p className="text-4xl font-display font-bold mb-1">
                            {thresholds.Hm0_max.condition} {thresholds.Hm0_max.value?.toFixed(2)}{thresholds.Hm0_max.unit}
                          </p>
                          <p className="text-sm opacity-75">State transition boundary</p>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.15 }}
                          className="p-6 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl text-white shadow-lg"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <Droplets className="w-8 h-8 opacity-80" />
                            <span className="font-medium opacity-90">Current Speed</span>
                          </div>
                          <p className="text-4xl font-display font-bold mb-1">
                            {thresholds.UcurrMax.condition} {thresholds.UcurrMax.value?.toFixed(2)}{thresholds.UcurrMax.unit}
                          </p>
                          <p className="text-sm opacity-75">State transition boundary</p>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="p-6 bg-gradient-to-br from-sky-500 to-teal-500 rounded-2xl text-white shadow-lg"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <Wind className="w-8 h-8 opacity-80" />
                            <span className="font-medium opacity-90">Wind Speed</span>
                          </div>
                          <p className="text-4xl font-display font-bold mb-1">
                            {thresholds.WindMax.condition} {thresholds.WindMax.value?.toFixed(2)}{thresholds.WindMax.unit}
                          </p>
                          <p className="text-sm opacity-75">State transition boundary</p>
                        </motion.div>
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
                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                                      index === 0 ? 'bg-blue-500' :
                                      index === 1 ? 'bg-indigo-500' :
                                      index === 2 ? 'bg-sky-500' : 'bg-coastal-400'
                                    }`}>
                                      {index + 1}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-medium text-coastal-900">{thresh.feature}</td>
                                  <td className="py-3 px-4 text-coastal-600">{thresh.description}</td>
                                  <td className="py-3 px-4 text-right">
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md font-mono font-medium">
                                      {thresh.condition} {typeof thresh.value === 'number' ? thresh.value.toFixed(2) : thresh.value}
                                    </span>
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
                            Thresholds are calculated as the weighted average of the cluster
                            centroids, adjusted by their respective covariances. This provides
                            an optimal decision boundary for classifying new observations into
                            normal or high-risk states.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'probability' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="font-display font-semibold text-coastal-900 mb-2">
                        State Probability Over Time
                      </h3>
                      <p className="text-sm text-coastal-600">
                        Posterior probability of each state assignment for each monsoon year.
                      </p>
                    </div>
                    <StateProbabilityChart 
                      data={probabilityData} 
                      title="State Probability Over Time"
                      areas={[
                        { dataKey: 'normalProb', name: 'Normal', color: '#3b82f6' },
                        { dataKey: 'highRiskProb', name: 'High Risk', color: '#ef4444' },
                        { dataKey: 'extremeProb', name: 'Extreme', color: '#f97316' },
                      ]}
                    />
                    
                    <div className="mt-8">
                      <h4 className="font-medium text-coastal-900 mb-4">State Assignments by Year</h4>
                      {probabilityData.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-coastal-200 bg-coastal-50">
                                <th className="text-left py-3 px-4 font-medium text-coastal-600">Year</th>
                                <th className="text-right py-3 px-4 font-medium text-coastal-600">P(Normal)</th>
                                <th className="text-right py-3 px-4 font-medium text-coastal-600">P(High Risk)</th>
                                <th className="text-right py-3 px-4 font-medium text-coastal-600">P(Extreme)</th>
                                <th className="text-center py-3 px-4 font-medium text-coastal-600">Assigned State</th>
                              </tr>
                            </thead>
                            <tbody>
                              {probabilityData.map((item, index) => (
                                <motion.tr
                                  key={item.year}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.02 }}
                                  className="border-b border-coastal-100 hover:bg-coastal-50"
                                >
                                  <td className="py-3 px-4 font-medium text-coastal-900">{item.year}</td>
                                  <td className="py-3 px-4 text-right">
                                    <span className={`px-2 py-1 rounded ${item.normalProb > 0.5 ? 'bg-blue-100 text-blue-700 font-medium' : 'text-coastal-600'}`}>
                                      {(item.normalProb * 100).toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <span className={`px-2 py-1 rounded ${item.highRiskProb > 0.5 ? 'bg-red-100 text-red-700 font-medium' : 'text-coastal-600'}`}>
                                      {(item.highRiskProb * 100).toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <span className={`px-2 py-1 rounded ${item.extremeProb > 0.5 ? 'bg-orange-100 text-orange-700 font-medium' : 'text-coastal-600'}`}>
                                      {(item.extremeProb * 100).toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                      item.assignedState === 'Normal' ? 'bg-blue-100 text-blue-700' :
                                      item.assignedState === 'High Risk' ? 'bg-red-100 text-red-700' :
                                      'bg-orange-100 text-orange-700'
                                    }`}>
                                      {item.assignedState}
                                    </span>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-coastal-50 rounded-xl">
                          <p className="text-coastal-600">No probability data available. Run the notebook analysis first.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'metrics' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="font-display font-semibold text-coastal-900 mb-2">
                        Model Quality Metrics
                      </h3>
                      <p className="text-sm text-coastal-600">
                        Evaluation metrics for the Gaussian Mixture Model fit.
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                      <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-violet-700">Model Accuracy</span>
                          <Target className="w-5 h-5 text-violet-600" />
                        </div>
                        <p className="text-3xl font-display font-bold text-violet-900">
                          {(metrics.accuracy * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-violet-600 mt-1">State classification accuracy</p>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-700">Components</span>
                          <Layers className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-3xl font-display font-bold text-blue-900">
                          {metrics.nComponents}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">Number of Gaussian components</p>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-emerald-700">Observations</span>
                          <BarChart3 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <p className="text-3xl font-display font-bold text-emerald-900">
                          {probabilityData.length}
                        </p>
                        <p className="text-xs text-emerald-600 mt-1">Years analyzed</p>
                      </div>
                    </div>

                    {/* State Distribution Summary */}
                    <div className="mb-8">
                      <h4 className="font-medium text-coastal-900 mb-4">State Distribution Summary</h4>
                      <div className="grid sm:grid-cols-3 gap-4">
                        {stateDistribution.map((state, index) => (
                          <div 
                            key={state.state}
                            className="p-4 rounded-xl"
                            style={{ backgroundColor: `${state.color}15`, borderColor: state.color, borderWidth: 1 }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: state.color }}
                              />
                              <span className="font-medium" style={{ color: state.color }}>
                                {state.state}
                              </span>
                            </div>
                            <p className="text-2xl font-bold text-coastal-900">
                              {state.count} years
                            </p>
                            <p className="text-sm text-coastal-600">
                              {state.percentage.toFixed(1)}% of observations
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-coastal-50 rounded-xl">
                      <h4 className="font-medium text-coastal-900 mb-4">Model Configuration</h4>
                      <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-coastal-600">Covariance Type</span>
                          <span className="font-medium text-coastal-900">Full</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-coastal-600">Initialization</span>
                          <span className="font-medium text-coastal-900">k-means++</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-coastal-600">Max Iterations</span>
                          <span className="font-medium text-coastal-900">100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-coastal-600">Tolerance</span>
                          <span className="font-medium text-coastal-900">1e-4</span>
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
