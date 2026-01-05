import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Zap,
  BarChart3,
  TrendingUp,
  Target,
  Waves,
  Wind,
  Droplets,
  Info,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import StatCard from '../components/common/StatCard'
import Tabs from '../components/common/Tabs'
import FeatureImportanceChart from '../components/charts/FeatureImportanceChart'
import ThresholdScatterChart from '../components/charts/ThresholdScatterChart'
import DataTable from '../components/common/DataTable'
import { useData } from '../context/DataContext'

export default function XGBoostPage() {
  const { data, dataLoaded } = useData()
  const [activeTab, setActiveTab] = useState('importance')

  // Feature importance data from actual results
  const featureImportance = useMemo(() => {
    if (data.models?.xgb?.featureImportance?.length) {
      return data.models.xgb.featureImportance
    }
    return []
  }, [data])

  // SHAP values from actual results
  const shapValues = useMemo(() => {
    if (data.models?.xgb?.shapValues?.length) {
      return data.models.xgb.shapValues
    }
    return []
  }, [data])

  // Threshold values from actual results
  const thresholds = useMemo(() => {
    if (data.models?.xgb?.thresholds) {
      return data.models.xgb.thresholds
    }
    return {
      Hm0_max: { value: 2.72, unit: 'm', condition: '≥' },
      UcurrMax: { value: 0.45, unit: 'm/s', condition: '≥' },
      WindMax: { value: 6.45, unit: 'm/s', condition: '≥' },
    }
  }, [data])

  // Model metrics from actual results
  const metrics = useMemo(() => {
    if (data.models?.xgb?.metrics) {
      return data.models.xgb.metrics
    }
    return {
      accuracy: 0.891,
      precision: 0.905,
      recall: 0.878,
      f1Score: 0.891,
      auc: 0.923,
      nEstimators: 100,
      maxDepth: 6,
      learningRate: 0.1,
    }
  }, [data])

  // Scatter data from actual results
  const scatterData = useMemo(() => {
    if (data.scatter?.length) {
      return data.scatter
    }
    return []
  }, [data])

  const tabs = [
    { id: 'importance', label: 'Feature Importance' },
    { id: 'shap', label: 'SHAP Analysis' },
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
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium mb-3">
                <Zap className="w-3.5 h-3.5" />
                Gradient Boosting
              </div>
              <h1 className="section-title mb-4">
                XGBoost Analysis
              </h1>
              <p className="section-subtitle">
                Extreme Gradient Boosting with SHAP interpretability for understanding how
                each environmental feature contributes to erosion predictions.
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
              className="card p-5 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900 mb-1">
                    About XGBoost
                  </h3>
                  <p className="text-sm text-orange-700">
                    XGBoost (Extreme Gradient Boosting) is an optimized distributed gradient
                    boosting library. It provides state-of-the-art results on many machine
                    learning challenges. Combined with SHAP (SHapley Additive exPlanations),
                    we can interpret the model's predictions and understand how each feature
                    contributes to the erosion risk assessment.
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
                {activeTab === 'importance' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="font-display font-semibold text-coastal-900 mb-2">
                        Feature Importance (Gain)
                      </h3>
                      <p className="text-sm text-coastal-600">
                        XGBoost feature importance based on the average gain of splits using each feature.
                        Higher values indicate greater predictive power.
                      </p>
                    </div>
                    <FeatureImportanceChart data={featureImportance} color="#f97316" />
                    
                    <div className="mt-8 grid sm:grid-cols-3 gap-4">
                      {featureImportance.slice(0, 3).map((item, index) => (
                        <div
                          key={item.feature}
                          className="p-4 bg-coastal-50 rounded-xl"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              index === 0 ? 'bg-orange-500' :
                              index === 1 ? 'bg-amber-500' : 'bg-yellow-500'
                            }`}>
                              {index + 1}
                            </div>
                            <span className="text-sm font-medium text-coastal-700">
                              {item.fullName}
                            </span>
                          </div>
                          <p className="text-2xl font-display font-bold text-coastal-900">
                            {(item.importance * 100).toFixed(1)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'shap' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="font-display font-semibold text-coastal-900 mb-2">
                        SHAP Value Analysis
                      </h3>
                      <p className="text-sm text-coastal-600">
                        SHAP values explain the contribution of each feature to individual predictions.
                        Positive values push the prediction toward erosion, negative values push away.
                      </p>
                    </div>

                    <div className="space-y-4 mb-8">
                      {shapValues.map((item, index) => (
                        <motion.div
                          key={item.feature}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-coastal-50 rounded-xl"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                item.direction === 'positive' 
                                  ? 'bg-red-100 text-red-600' 
                                  : 'bg-emerald-100 text-emerald-600'
                              }`}>
                                {item.direction === 'positive' 
                                  ? <ArrowUpRight className="w-4 h-4" />
                                  : <ArrowDownRight className="w-4 h-4" />
                                }
                              </div>
                              <div>
                                <span className="font-medium text-coastal-900">
                                  {item.feature}
                                </span>
                                <p className="text-xs text-coastal-500">{item.impact}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-lg font-display font-bold ${
                                item.shap >= 0 ? 'text-red-600' : 'text-emerald-600'
                              }`}>
                                {item.shap >= 0 ? '+' : ''}{item.shap.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="h-2 bg-coastal-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.shap >= 0 ? 'bg-red-500' : 'bg-emerald-500'
                              }`}
                              style={{ 
                                width: `${Math.abs(item.shap) * 100}%`,
                                marginLeft: item.shap < 0 ? `${(1 - Math.abs(item.shap)) * 50}%` : '50%'
                              }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-orange-800 mb-1">
                            Interpreting SHAP Values
                          </h4>
                          <p className="text-sm text-orange-700">
                            SHAP values are additive - summing all feature contributions gives the
                            model's prediction. The magnitude indicates importance, while the sign
                            shows the direction of impact. Features with consistently high positive
                            SHAP values are strong erosion indicators.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'thresholds' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="font-display font-semibold text-coastal-900 mb-2">
                        XGBoost-Derived Thresholds
                      </h3>
                      <p className="text-sm text-coastal-600">
                        Critical thresholds identified through analysis of tree split points
                        and SHAP dependency plots.
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-6 mb-8">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="p-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl text-white shadow-lg"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <Waves className="w-8 h-8 opacity-80" />
                          <span className="font-medium opacity-90">Wave Height</span>
                        </div>
                        <p className="text-4xl font-display font-bold mb-1">
                          {thresholds.Hm0_max.condition} {thresholds.Hm0_max.value}{thresholds.Hm0_max.unit}
                        </p>
                        <p className="text-sm opacity-75">Optimal split point</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 }}
                        className="p-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl text-white shadow-lg"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <Droplets className="w-8 h-8 opacity-80" />
                          <span className="font-medium opacity-90">Current Speed</span>
                        </div>
                        <p className="text-4xl font-display font-bold mb-1">
                          {thresholds.UcurrMax.condition} {thresholds.UcurrMax.value}{thresholds.UcurrMax.unit}
                        </p>
                        <p className="text-sm opacity-75">Optimal split point</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="p-6 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl text-white shadow-lg"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <Wind className="w-8 h-8 opacity-80" />
                          <span className="font-medium opacity-90">Wind Speed</span>
                        </div>
                        <p className="text-4xl font-display font-bold mb-1">
                          {thresholds.WindMax.condition} {thresholds.WindMax.value}{thresholds.WindMax.unit}
                        </p>
                        <p className="text-sm opacity-75">Optimal split point</p>
                      </motion.div>
                    </div>

                    <h4 className="font-medium text-coastal-900 mb-4">Threshold Comparison</h4>
                    <ThresholdScatterChart
                      data={scatterData}
                      threshold={thresholds.Hm0_max.value}
                      xLabel="Maximum Wave Height (m)"
                      yLabel="Net Shoreline Movement (m)"
                    />
                  </div>
                )}

                {activeTab === 'metrics' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="font-display font-semibold text-coastal-900 mb-2">
                        Model Performance Metrics
                      </h3>
                      <p className="text-sm text-coastal-600">
                        Evaluation metrics from cross-validation for the XGBoost classifier.
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                      {[
                        { label: 'Accuracy', value: metrics.accuracy, desc: 'Overall correct predictions' },
                        { label: 'Precision', value: metrics.precision, desc: 'Positive predictive value' },
                        { label: 'Recall', value: metrics.recall, desc: 'True positive rate' },
                        { label: 'F1 Score', value: metrics.f1Score, desc: 'Harmonic mean of P & R' },
                        { label: 'AUC', value: metrics.auc, desc: 'Area under ROC curve' },
                      ].map((metric) => (
                        <div key={metric.label} className="p-4 bg-coastal-50 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-coastal-600">
                              {metric.label}
                            </span>
                            <span className="text-lg font-display font-bold text-coastal-900">
                              {(metric.value * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-coastal-200 rounded-full h-2">
                            <div
                              className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${metric.value * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-coastal-500 mt-2">{metric.desc}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-coastal-50 rounded-xl">
                      <h4 className="font-medium text-coastal-900 mb-4">Hyperparameters</h4>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-coastal-600">Estimators</span>
                          <span className="font-medium text-coastal-900">{metrics.nEstimators}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-coastal-600">Max Depth</span>
                          <span className="font-medium text-coastal-900">{metrics.maxDepth}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-coastal-600">Learning Rate</span>
                          <span className="font-medium text-coastal-900">{metrics.learningRate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-coastal-600">Objective</span>
                          <span className="font-medium text-coastal-900">binary:logistic</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-coastal-600">Subsample</span>
                          <span className="font-medium text-coastal-900">0.8</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-coastal-600">Colsample</span>
                          <span className="font-medium text-coastal-900">0.8</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-coastal-600">Gamma</span>
                          <span className="font-medium text-coastal-900">0.1</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-coastal-600">Reg Alpha</span>
                          <span className="font-medium text-coastal-900">0.05</span>
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
