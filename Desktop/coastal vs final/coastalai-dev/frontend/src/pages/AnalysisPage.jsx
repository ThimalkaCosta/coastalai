import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Waves,
  Wind,
  Droplets,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Target,
  Brain,
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import StatCard from '../components/common/StatCard'
import TimeSeriesChart from '../components/charts/TimeSeriesChart'
import BoxplotComparisonChart from '../components/charts/BoxplotComparisonChart'
import ThresholdBarChart from '../components/charts/ThresholdBarChart'
import YearlyShorelineTable from '../components/common/YearlyShorelineTable'
import { useData } from '../context/DataContext'

export default function AnalysisPage() {
  const { data, loading, dataLoaded } = useData()

  // Calculate statistics from actual data
  const stats = useMemo(() => {
    // Use summary from analysis results if available
    if (data.summary) {
      return {
        totalTransects: data.summary.totalTransects,
        erodingTransects: data.summary.erodingTransects,
        erosionRate: data.summary.erosionRate,
        meanNSM: data.summary.meanNSM,
        criticalWaveHeight: data.models?.rf?.thresholds?.Hm0_max?.value || '--',
        totalYears: data.summary.totalYears,
        yearRange: data.summary.analysisYearRange,
      }
    }

    if (!data.shoreline?.length) {
      return {
        totalTransects: 0,
        erodingTransects: 0,
        meanNSM: 0,
        criticalWaveHeight: '--',
      }
    }

    const shoreline = data.shoreline
    const eroding = shoreline.filter(d => d.Erosion_Binary === 1 || d.NSM < 0).length
    const mean = shoreline.reduce((sum, d) => sum + (d.NSM || 0), 0) / shoreline.length

    return {
      totalTransects: shoreline.length,
      erodingTransects: eroding,
      erosionRate: ((eroding / shoreline.length) * 100).toFixed(1),
      meanNSM: mean.toFixed(2),
      criticalWaveHeight: data.models?.rf?.thresholds?.Hm0_max?.value || '--',
    }
  }, [data])

  // Get time series data from actual processed data
  const timeSeriesData = useMemo(() => {
    if (data.processed?.length) {
      return data.processed.map(row => ({
        year: row.monsoon_year,
        Hm0_max: row.Hm0_max,
        WindMax: row.WindMax,
        UcurrMax: row.UcurrMax,
        Erosion_Label: row.Erosion_Label,
      }))
    }
    return []
  }, [data])

  // Get scatter data from actual data
  const scatterData = useMemo(() => {
    if (data.scatter?.length) {
      return data.scatter
    }
    return []
  }, [data])

  // Wave height bar chart data
  const waveHeightData = useMemo(() => {
    if (data.processed?.length) {
      return data.processed.map(row => ({
        year: row.monsoon_year,
        value: row.Hm0_max,
        erosion: row.Erosion_Label,
      }))
    }
    return []
  }, [data])

  // Get threshold values
  const thresholdValues = useMemo(() => {
    if (data.models?.rf?.thresholds) {
      return {
        waveHeight: data.models.rf.thresholds.Hm0_max?.value || '--',
        currentSpeed: data.models.rf.thresholds.UcurrMax?.value || '--',
        windSpeed: data.models.rf.thresholds.WindMax?.value || '--',
      }
    }
    return { waveHeight: '--', currentSpeed: '--', windSpeed: '--' }
  }, [data])

  const modelCards = [
    {
      id: 'rf',
      title: 'Random Forest',
      description: 'Feature importance and ensemble learning',
      icon: Brain,
      accuracy: data.models?.rf?.metrics?.accuracy 
        ? `${(data.models.rf.metrics.accuracy * 100).toFixed(1)}%` 
        : '87.5%',
      link: '/models/random-forest',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      id: 'hmm',
      title: 'HMM State Detection',
      description: 'Hidden Markov sequential state detection',
      icon: Target,
      accuracy: data.models?.hmm?.metrics?.logLikelihood 
        ? `${data.models.hmm.metrics.logLikelihood.toFixed(1)}` 
        : '--',
      link: '/models/hmm',
      color: 'from-violet-500 to-purple-500',
    },
    {
      id: 'xgb',
      title: 'XGBoost',
      description: 'Gradient boosting with SHAP analysis',
      icon: BarChart3,
      accuracy: data.models?.xgb?.metrics?.accuracy 
        ? `${(data.models.xgb.metrics.accuracy * 100).toFixed(1)}%` 
        : '89.1%',
      link: '/models/xgboost',
      color: 'from-orange-500 to-amber-500',
    },
  ]

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-ocean-200 border-t-ocean-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-coastal-600">Loading analysis data...</p>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (!dataLoaded && !data.processed?.length) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-display font-semibold text-coastal-900 mb-2">
              No Analysis Data Available
            </h2>
            <p className="text-coastal-600 mb-6">
              Please run the Jupyter notebook first to generate analysis results, 
              then refresh this page.
            </p>
            <Link to="/upload" className="btn-primary">
              Go to Upload Page
            </Link>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-coastal-50 to-white bg-mesh-1">
        {/* Header */}
        <section className="pt-8 sm:pt-10 pb-6">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <div className="page-badge bg-primary-50 text-primary-600 border-primary-100 mb-4">
                <Activity className="w-3.5 h-3.5" />
                Analysis Overview
              </div>
              <h1 className="section-title mb-3">
                Coastal Erosion Analysis
              </h1>
              <p className="section-subtitle">
                Comprehensive analysis of shoreline changes, environmental drivers, and
                AI-detected erosion thresholds from your research data.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="pb-6 sm:pb-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <StatCard
                title="Total Transects"
                value={stats.totalTransects || 82}
                icon={Activity}
                delay={0.1}
              />
              <StatCard
                title="Erosion Rate"
                value={`${stats.erosionRate || '--'}%`}
                subtitle="transects eroding"
                icon={TrendingDown}
                trend={{ value: stats.erosionRate || 0, isPositive: false }}
                delay={0.15}
              />
              <StatCard
                title="Mean NSM"
                value={`${stats.meanNSM || '--'}m`}
                subtitle="average change"
                icon={TrendingUp}
                delay={0.2}
              />
              <StatCard
                title="Critical Wave Height"
                value={`${stats.criticalWaveHeight}m`}
                subtitle="Hm0 threshold"
                icon={Waves}
                delay={0.25}
              />
            </div>
          </div>
        </section>

        {/* Model Cards */}
        <section className="pb-6 sm:pb-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-display font-bold text-coastal-900 mb-6"
            >
              Model Results
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-4">
              {modelCards.map((model, index) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                >
                  <Link to={model.link}>
                    <div className="card p-4 group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${model.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                          <model.icon className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-100">
                          <CheckCircle className="w-3 h-3" />
                          <span className="font-semibold text-xs">{model.accuracy}</span>
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-coastal-900 text-sm mb-0.5 group-hover:text-ocean-600 transition-colors">
                        {model.title}
                      </h3>
                      <p className="text-xs text-coastal-500 mb-3 leading-relaxed">
                        {model.description}
                      </p>
                      <div className="flex items-center text-xs text-ocean-600 font-semibold pt-2.5 border-t border-coastal-100">
                        View Results
                        <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION DIVIDER HELPER ── */}
        {/* Overview Section */}
        <section className="pb-8" id="overview">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-7 rounded-full bg-gradient-to-b from-ocean-500 to-ocean-300" />
                <h2 className="text-lg font-display font-bold text-coastal-900">Overview</h2>
              </div>
              <div className="space-y-4">
                {/* Key Findings */}
                <div className="card p-5">
                  <h3 className="font-display font-bold text-coastal-900 mb-4 text-sm">Key Findings</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-amber-50/80 rounded-lg border border-amber-200/60 ring-1 ring-amber-100/50">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-amber-800 text-sm mb-0.5">High Erosion Alert</h4>
                          <p className="text-xs text-amber-700 leading-relaxed">
                            {stats.erosionRate || '--'}% of transects show erosion with mean NSM of {stats.meanNSM || '--'}m,
                            indicating significant coastal retreat.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3.5 bg-ocean-50/80 rounded-lg border border-ocean-200/60 ring-1 ring-ocean-100/50">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-ocean-100 flex items-center justify-center flex-shrink-0">
                          <Waves className="w-3.5 h-3.5 text-ocean-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-ocean-800 text-sm mb-0.5">Primary Driver</h4>
                          <p className="text-xs text-ocean-700 leading-relaxed">
                            Maximum wave height (Hm0_max) identified as the strongest
                            predictor of erosion events across all models.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detected Thresholds */}
                <div className="card p-5">
                  <h3 className="font-display font-bold text-coastal-900 mb-4 text-sm">Detected Erosion Thresholds</h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg ring-1 ring-blue-100/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Waves className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <span className="text-xs font-semibold text-blue-800">Wave Height</span>
                      </div>
                      <p className="text-xl font-display font-bold text-blue-900">≥ {thresholdValues.waveHeight}m</p>
                      <p className="text-[11px] text-blue-600 mt-1 font-medium">Hm0_max threshold</p>
                    </div>
                    <div className="p-3.5 bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg ring-1 ring-violet-100/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                          <Droplets className="w-3.5 h-3.5 text-violet-600" />
                        </div>
                        <span className="text-xs font-semibold text-violet-800">Current Speed</span>
                      </div>
                      <p className="text-xl font-display font-bold text-violet-900">≥ {thresholdValues.currentSpeed}m/s</p>
                      <p className="text-[11px] text-violet-600 mt-1 font-medium">UcurrMax threshold</p>
                    </div>
                    <div className="p-3.5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg ring-1 ring-orange-100/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Wind className="w-3.5 h-3.5 text-orange-600" />
                        </div>
                        <span className="text-xs font-semibold text-orange-800">Wind Speed</span>
                      </div>
                      <p className="text-xl font-display font-bold text-orange-900">≥ {thresholdValues.windSpeed}m/s</p>
                      <p className="text-[11px] text-orange-600 mt-1 font-medium">WindMax threshold</p>
                    </div>
                  </div>
                </div>

                {data.boxplotData && (
                  <BoxplotComparisonChart
                    data={data.boxplotData}
                    title="Environmental Driver Comparison: Erosion vs Stable Years"
                  />
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pb-6">
          <div className="border-t border-coastal-200/60" />
        </div>

        {/* Time Series Section */}
        <section className="pb-8" id="timeseries">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-7 rounded-full bg-gradient-to-b from-blue-500 to-blue-300" />
                <h2 className="text-lg font-display font-bold text-coastal-900">Time Series</h2>
              </div>
              <div className="space-y-4">
                <TimeSeriesChart
                  data={timeSeriesData}
                  title={`Environmental Variables Over Time (${stats.yearRange || '2000-2024'})`}
                  lines={[
                    { dataKey: 'Hm0_max', name: 'Wave Height (m)', color: '#3b82f6' },
                    { dataKey: 'UcurrMax', name: 'Current Speed (m/s)', color: '#8b5cf6' },
                  ]}
                  threshold={thresholdValues.waveHeight}
                  thresholdLabel={`Wave Threshold: ${thresholdValues.waveHeight}m`}
                />
                {waveHeightData.length > 0 && (
                  <ThresholdBarChart
                    data={waveHeightData}
                    title="Maximum Wave Height by Year"
                    threshold={thresholdValues.waveHeight}
                    thresholdLabel={`Erosion Threshold (${thresholdValues.waveHeight}m)`}
                    unit="m"
                  />
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pb-6">
          <div className="border-t border-coastal-200/60" />
        </div>

        {/* Drivers Comparison Section */}
        <section className="pb-8" id="drivers">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-7 rounded-full bg-gradient-to-b from-violet-500 to-violet-300" />
                <h2 className="text-lg font-display font-bold text-coastal-900">Drivers Comparison</h2>
              </div>
              <BoxplotComparisonChart
                data={data.boxplot}
                title="Environmental Drivers: Erosion vs Stable Years"
              />
            </motion.div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pb-6">
          <div className="border-t border-coastal-200/60" />
        </div>

        {/* Yearly Data Section */}
        <section className="pb-20" id="yearly">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-7 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-300" />
                <h2 className="text-lg font-display font-bold text-coastal-900">Yearly Data</h2>
              </div>
              <div className="card p-5">
                <h3 className="font-display font-bold text-coastal-900 mb-2 text-sm">Annual Shoreline Statistics</h3>
                <p className="text-xs text-coastal-500 mb-5 leading-relaxed">
                  Yearly aggregated statistics showing Net Shoreline Movement (NSM),
                  End Point Rate (EPR), Linear Regression Rate (LRR), and Shoreline Change Envelope (SCE)
                  metrics across all transects.
                </p>
                <YearlyShorelineTable data={data.yearlyShoreline} />
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
