import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Brain,
  TreeDeciduous,
  BarChart3,
  Target,
  Waves,
  Wind,
  Droplets,
  Info,
  CheckCircle,
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import Tabs from '../components/common/Tabs'
import FeatureImportanceChart from '../components/charts/FeatureImportanceChart'
import { useData } from '../context/DataContext'

// Feature description mapping
const FEATURE_DESCRIPTIONS = {
  Hm0_max: 'Maximum significant wave height',
  Hm0_max_annual: 'Annual max significant wave height',
  Hm0_mean: 'Mean significant wave height',
  CumWaveEnergy: 'Cumulative wave energy',
  StormDays_wave: 'Number of storm wave days',
  WindMax: 'Maximum wind speed',
  WindMax_annual: 'Annual maximum wind speed',
  WindMean: 'Mean wind speed',
  WindStressMean: 'Mean wind stress',
  UcurrMax: 'Maximum ocean current velocity',
  UcurrMax_annual: 'Annual max ocean current velocity',
  UcurrMean: 'Mean ocean current velocity',
  CumCurrent: 'Cumulative current transport',
}

export default function RandomForestPage() {
  const { data } = useData()
  const [activeTab, setActiveTab] = useState('importance')

  // Feature importance data from actual results
  const featureImportance = useMemo(() => {
    return data.models?.rf?.featureImportance || []
  }, [data])

  // Threshold values from actual results
  const thresholds = useMemo(() => {
    return data.models?.rf?.thresholds || {}
  }, [data])

  // All thresholds as array for table display - properly ordered by importance
  const thresholdsArray = useMemo(() => {
    if (!thresholds || Object.keys(thresholds).length === 0) return []

    const importanceOrder = featureImportance.map(f => f.feature)

    const entries = Object.entries(thresholds).map(([key, val]) => ({
      feature: key,
      value: val.value,
      unit: val.unit || '',
      condition: val.condition || '≥',
      nSplits: val.nSplits,
      description: FEATURE_DESCRIPTIONS[key] || key,
      importanceRank: importanceOrder.indexOf(key),
    }))

    return entries.sort((a, b) => {
      const rankA = a.importanceRank === -1 ? 999 : a.importanceRank
      const rankB = b.importanceRank === -1 ? 999 : b.importanceRank
      return rankA - rankB
    })
  }, [thresholds, featureImportance])

  // Model metrics from actual results
  const metrics = useMemo(() => {
    return data.models?.rf?.metrics || {}
  }, [data])

  // Model configuration from actual results
  const config = useMemo(() => {
    return data.models?.rf?.config || {}
  }, [data])

  const tabs = [
    { id: 'importance', label: 'Feature Importance' },
    { id: 'thresholds', label: 'Thresholds' },
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
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium mb-3">
                <TreeDeciduous className="w-3.5 h-3.5" />
                Machine Learning Model
              </div>
              <h1 className="section-title mb-4">
                Random Forest Analysis
              </h1>
              <p className="section-subtitle">
                Ensemble learning model using decision trees to identify the most important
                environmental features driving coastal erosion and detect critical thresholds.
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
              className="card p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-900 mb-1">
                    About Random Forest
                  </h3>
                  <p className="text-sm text-emerald-700">
                    Random Forest is an ensemble learning method that constructs multiple decision
                    trees during training and outputs the mode of the classes for classification.
                    It provides robust feature importance rankings and handles non-linear relationships
                    well.
                    {metrics.nEstimators ? ` The model uses ${metrics.nEstimators} trees` : ''}
                    {metrics.oobScore ? ` with an OOB score of ${(metrics.oobScore * 100).toFixed(1)}%, indicating good generalization.` : '.'}
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
                {/* ===================== FEATURE IMPORTANCE TAB ===================== */}
                {activeTab === 'importance' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="font-display font-semibold text-coastal-900 mb-2">
                        Feature Importance Ranking
                      </h3>
                      <p className="text-sm text-coastal-600">
                        Relative importance of each environmental variable in predicting erosion events.
                        Higher values indicate stronger predictive power.
                      </p>
                    </div>

                    {featureImportance.length > 0 ? (
                      <>
                        <FeatureImportanceChart data={featureImportance} color="#10b981" />

                        <div className="mt-8 grid sm:grid-cols-3 gap-4">
                          {featureImportance.slice(0, 3).map((item, index) => (
                            <div
                              key={item.feature}
                              className="p-4 bg-coastal-50 rounded-xl"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div className={'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ' + ['bg-emerald-500', 'bg-teal-500', 'bg-cyan-500'][index]}>
                                  {index + 1}
                                </div>
                                <span className="text-sm font-medium text-coastal-700">
                                  {item.fullName || item.feature}
                                </span>
                              </div>
                              <p className="text-2xl font-display font-bold text-coastal-900">
                                {(item.importance * 100).toFixed(1)}%
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center bg-coastal-50 rounded-xl">
                        <p className="text-coastal-600">No feature importance data available. Run the notebook analysis first.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ===================== THRESHOLDS TAB ===================== */}
                {activeTab === 'thresholds' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="font-display font-semibold text-coastal-900 mb-2">
                        Detected Erosion Thresholds
                      </h3>
                      <p className="text-sm text-coastal-600">
                        Critical values identified by the Random Forest model from decision tree split points.
                        When environmental conditions exceed these thresholds, erosion events are likely to occur.
                      </p>
                    </div>

                    {/* Top 3 Key Thresholds Cards */}
                    {thresholdsArray.length > 0 && (
                      <div className="grid sm:grid-cols-3 gap-6 mb-8">
                        {thresholdsArray.slice(0, 3).map((thresh, i) => {
                          const icons = [Waves, Droplets, Wind]
                          const Icon = icons[i] || Waves
                          const gradients = [
                            'from-blue-500 to-cyan-500',
                            'from-indigo-500 to-blue-600',
                            'from-sky-500 to-teal-500',
                          ]
                          const labels = ['Wave Height', 'Current Speed', 'Wind Speed']
                          return (
                            <motion.div
                              key={thresh.feature}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.1 + i * 0.05 }}
                              className={'p-6 bg-gradient-to-br rounded-2xl text-white shadow-lg ' + gradients[i]}
                            >
                              <div className="flex items-center gap-3 mb-4">
                                <Icon className="w-8 h-8 opacity-80" />
                                <span className="font-medium opacity-90">{labels[i] || thresh.feature}</span>
                              </div>
                              <p className="text-4xl font-display font-bold mb-1">
                                {thresh.condition} {typeof thresh.value === 'number' ? thresh.value.toFixed(2) : '--'}{thresh.unit}
                              </p>
                              <p className="text-sm opacity-75">{thresh.description}</p>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}

                    {/* Full Thresholds Table */}
                    <div className="mb-8">
                      <h4 className="font-medium text-coastal-900 mb-4">All Feature Thresholds</h4>
                      {thresholdsArray.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-coastal-200 bg-coastal-50">
                                <th className="text-left py-3 px-4 font-medium text-coastal-600">Rank</th>
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
                                    <span className={'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ' + (['bg-emerald-500', 'bg-teal-500', 'bg-cyan-500'][index] || 'bg-coastal-400')}>
                                      {index + 1}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-medium text-coastal-900">{thresh.feature}</td>
                                  <td className="py-3 px-4 text-coastal-600">{thresh.description}</td>
                                  <td className="py-3 px-4 text-right">
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-md font-mono font-medium">
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

                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-amber-800 mb-1">
                            Interpretation
                          </h4>
                          <p className="text-sm text-amber-700">
                            These thresholds were extracted from the median split points of {metrics.nEstimators || 'N/A'} decision trees.
                            When any of these thresholds are exceeded during a monsoon year,
                            the probability of significant erosion increases substantially.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===================== MODEL METRICS TAB ===================== */}
                {activeTab === 'metrics' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="font-display font-semibold text-coastal-900 mb-2">
                        Model Performance Metrics
                      </h3>
                      <p className="text-sm text-coastal-600">
                        Evaluation metrics from cross-validation and out-of-bag estimation.
                      </p>
                    </div>

                    {/* Main Metrics Cards */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-emerald-700">Test Accuracy</span>
                          <Target className="w-5 h-5 text-emerald-600" />
                        </div>
                        <p className="text-3xl font-display font-bold text-emerald-900">
                          {metrics.accuracy ? (metrics.accuracy * 100).toFixed(1) + '%' : '--'}
                        </p>
                        <p className="text-xs text-emerald-600 mt-1">On held-out test set</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-700">CV Accuracy</span>
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-3xl font-display font-bold text-blue-900">
                          {metrics.cvAccuracy ? (metrics.cvAccuracy * 100).toFixed(1) + '%' : '--'}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {metrics.cvStd ? '± ' + (metrics.cvStd * 100).toFixed(1) + '% std' : 'GroupKFold cross-validation'}
                        </p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-violet-700">OOB Score</span>
                          <Brain className="w-5 h-5 text-violet-600" />
                        </div>
                        <p className="text-3xl font-display font-bold text-violet-900">
                          {metrics.oobScore ? (metrics.oobScore * 100).toFixed(1) + '%' : '--'}
                        </p>
                        <p className="text-xs text-violet-600 mt-1">Out-of-bag estimate</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-amber-700">Estimators</span>
                          <TreeDeciduous className="w-5 h-5 text-amber-600" />
                        </div>
                        <p className="text-3xl font-display font-bold text-amber-900">
                          {metrics.nEstimators || '--'}
                        </p>
                        <p className="text-xs text-amber-600 mt-1">Decision trees</p>
                      </motion.div>
                    </div>

                    {/* Detailed Metrics */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                      {[
                        { label: 'Precision', value: metrics.precision, desc: 'Positive predictive value', color: '#10b981' },
                        { label: 'Recall', value: metrics.recall, desc: 'True positive rate / Sensitivity', color: '#3b82f6' },
                        { label: 'F1 Score', value: metrics.f1Score, desc: 'Harmonic mean of Precision & Recall', color: '#8b5cf6' },
                      ].map((metric, index) => (
                        <motion.div
                          key={metric.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className="p-4 bg-coastal-50 rounded-xl"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-coastal-600">
                              {metric.label}
                            </span>
                            <span className="text-lg font-display font-bold text-coastal-900">
                              {metric.value ? (metric.value * 100).toFixed(1) + '%' : '--'}
                            </span>
                          </div>
                          <div className="w-full bg-coastal-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(metric.value || 0) * 100}%`, backgroundColor: metric.color }}
                            />
                          </div>
                          <p className="text-xs text-coastal-500 mt-2">{metric.desc}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Model Configuration - fully dynamic */}
                    <div className="p-4 bg-coastal-50 rounded-xl">
                      <h4 className="font-medium text-coastal-900 mb-4">Model Configuration</h4>
                      {Object.keys(config).length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          {[
                            { label: 'Number of Trees', value: config.nEstimators },
                            { label: 'Max Depth', value: config.maxDepth === null || config.maxDepth === 'None' ? 'None (unlimited)' : config.maxDepth },
                            { label: 'Min Samples Split', value: config.minSamplesSplit },
                            { label: 'Bootstrap', value: config.bootstrap != null ? String(config.bootstrap) : '--' },
                            { label: 'Criterion', value: config.criterion ? config.criterion.charAt(0).toUpperCase() + config.criterion.slice(1) : '--' },
                            { label: 'CV Folds', value: config.cvFolds },
                            { label: 'Random State', value: config.randomState },
                            { label: 'Class Weight', value: config.classWeight ? config.classWeight.charAt(0).toUpperCase() + config.classWeight.slice(1) : '--' },
                          ].map((item) => (
                            <div key={item.label} className="flex justify-between p-2 bg-white rounded-lg">
                              <span className="text-coastal-600">{item.label}</span>
                              <span className="font-medium text-coastal-900">{item.value != null ? String(item.value) : '--'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-coastal-500">No configuration data available. Run the notebook analysis first.</p>
                      )}
                    </div>

                    {/* Interpretation */}
                    <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-emerald-800 mb-1">
                            Performance Summary
                          </h4>
                          <p className="text-sm text-emerald-700">
                            {metrics.accuracy && metrics.cvAccuracy ? (
                              <>
                                The model achieves {(metrics.accuracy * 100).toFixed(0)}% accuracy on the test set with
                                {' '}{(metrics.cvAccuracy * 100).toFixed(0)}%{metrics.cvStd ? ' ± ' + (metrics.cvStd * 100).toFixed(0) + '%' : ''} cross-validation accuracy.
                                {metrics.accuracy > metrics.cvAccuracy && ' The higher test accuracy compared to CV suggests some overfitting, which is expected given the small dataset size.'}
                                {metrics.cvAccuracy >= 0.7 && ' The cross-validation score indicates reasonable generalization capability.'}
                              </>
                            ) : (
                              'Run the notebook analysis to see performance metrics.'
                            )}
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
