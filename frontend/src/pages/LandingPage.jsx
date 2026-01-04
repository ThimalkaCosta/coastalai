import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Waves,
  Upload,
  BarChart3,
  GitBranch,
  Layers,
  Zap,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Shield,
  Target,
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import { useData } from '../context/DataContext'

const features = [
  {
    icon: Upload,
    title: 'Data Upload',
    description: 'Upload QGIS analysis reports and environmental datasets with drag-and-drop simplicity.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analysis',
    description: 'Visualize shoreline changes, environmental drivers, and threshold detection results.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Target,
    title: 'Threshold Detection',
    description: 'AI-powered detection of erosion thresholds using multiple machine learning models.',
    color: 'from-orange-500 to-red-500',
  },
]

const models = [
  {
    icon: GitBranch,
    name: 'Random Forest',
    description: 'Feature importance ranking and decision tree-based threshold extraction.',
    href: '/models/random-forest',
    color: 'bg-emerald-500',
  },
  {
    icon: Layers,
    name: 'Gaussian Mixture Model',
    description: 'State-based erosion detection with probability distributions.',
    href: '/models/gmm',
    color: 'bg-violet-500',
  },
  {
    icon: Zap,
    name: 'XGBoost',
    description: 'High-accuracy classification with SHAP value interpretation.',
    href: '/models/xgboost',
    color: 'bg-amber-500',
  },
]

export default function LandingPage() {
  const { data, dataLoaded } = useData()
  
  // Get dynamic stats from loaded data
  const stats = [
    { value: data.summary?.erosionRate ? `${data.summary.erosionRate}%` : '--', label: 'Erosion Rate' },
    { value: data.summary?.analysisYearRange || '--', label: 'Years of Data' },
    { value: data.summary?.totalTransects?.toString() || '--', label: 'Transects Analyzed' },
    { value: '3', label: 'ML Models' },
  ]
  
  // Get threshold values from data
  const thresholdData = data.thresholds || []
  const getThresholdValue = (featurePrefix) => {
    const item = thresholdData.find(t => t.Driver?.toLowerCase().includes(featurePrefix.toLowerCase()))
    if (item) {
      // Return RF_Threshold or GMM_Threshold value
      return item.RF_Threshold || item.GMM_Threshold || '--'
    }
    return '--'
  }
  
  // Get model accuracy
  const modelAccuracy = data.models?.rf?.metrics?.accuracy 
    ? `${(data.models.rf.metrics.accuracy * 100).toFixed(1)}%` 
    : (data.models?.xgb?.metrics?.accuracy 
      ? `${(data.models.xgb.metrics.accuracy * 100).toFixed(1)}%`
      : '--')
  
  // Get erosion rate/NSM
  const erosionNSM = data.summary?.meanNSM 
    ? `${data.summary.meanNSM}m` 
    : '--'

  return (
    <PageTransition>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden -mt-28 pt-28">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: 'url(/background_coastal.png)',
              imageRendering: '-webkit-optimize-contrast',
              filter: 'contrast(1.05) saturate(1.1) brightness(1.02)',
              transform: 'scale(1.01)',
            }}
          />
          {/* Subtle overlay for enhanced visual quality */}
          <div className="absolute inset-0 bg-gradient-to-br from-ocean-900/5 via-transparent to-coastal-900/5" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-ocean-600 rounded-full text-sm font-medium mb-6 shadow-sm"
              >
                <Waves className="w-4 h-4" />
                AI-Powered Coastal Research
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-coastal-900 leading-tight mb-6"
              >
                Coastal Erosion{' '}
                <span className="text-ocean-500">Threshold Detection</span>{' '}
                Framework
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-coastal-600 mb-8 max-w-xl"
              >
                Advanced machine learning framework for detecting and analyzing coastal erosion
                thresholds using environmental drivers including waves, winds, and currents.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-4"
              >
                <Link to="/upload" className="btn-primary">
                  Upload Data
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/analysis" className="btn-secondary">
                  View Analysis
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12 pt-8 border-t border-coastal-200"
              >
                {stats.map((stat, index) => (
                  <div key={index}>
                    <div className="text-2xl font-display font-bold text-coastal-900">
                      {stat.value}
                    </div>
                    <div className="text-sm text-coastal-500">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right Content - Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="relative w-full aspect-square">
                {/* Central Card */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="card p-8 w-80 shadow-2xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ocean-500 to-primary-600 flex items-center justify-center shadow-lg">
                        <Target className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-coastal-900">Threshold</h3>
                        <p className="text-sm text-coastal-500">Detection Results</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-coastal-50 rounded-xl">
                        <span className="text-sm text-coastal-600">Hm0_max</span>
                        <span className="font-mono font-semibold text-ocean-600">{getThresholdValue('hm0_max')}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-coastal-50 rounded-xl">
                        <span className="text-sm text-coastal-600">UcurrMax</span>
                        <span className="font-mono font-semibold text-ocean-600">{getThresholdValue('ucurrmax')}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-coastal-50 rounded-xl">
                        <span className="text-sm text-coastal-600">WindMax</span>
                        <span className="font-mono font-semibold text-ocean-600">{getThresholdValue('windmax')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute top-10 left-0 card p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-xs text-coastal-500">Model Accuracy</div>
                      <div className="font-semibold text-coastal-900">{modelAccuracy}</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                  className="absolute bottom-20 right-0 card p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-ocean-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-ocean-600" />
                    </div>
                    <div>
                      <div className="text-xs text-coastal-500">Mean NSM</div>
                      <div className="font-semibold text-coastal-900">{erosionNSM}</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="section-title mb-4">
              Comprehensive Analysis Pipeline
            </h2>
            <p className="section-subtitle mx-auto">
              From data upload to threshold detection, our framework provides end-to-end
              analysis capabilities for coastal erosion research.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-interactive p-8"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg mb-6`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-display font-semibold text-coastal-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-coastal-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section className="py-20 bg-coastal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="section-title mb-4">
              Three-Model Detection Strategy
            </h2>
            <p className="section-subtitle mx-auto">
              Multiple machine learning models working together to provide robust and
              interpretable erosion threshold detection.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {models.map((model, index) => (
              <motion.div
                key={model.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={model.href} className="card-interactive p-8 h-full flex flex-col">
                  <div className={`w-12 h-12 rounded-xl ${model.color} flex items-center justify-center shadow-lg mb-6`}>
                    <model.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-display font-semibold text-coastal-900 mb-3">
                    {model.name}
                  </h3>
                  <p className="text-coastal-600 flex-1">{model.description}</p>
                  <div className="flex items-center gap-2 text-ocean-600 font-medium mt-4 group-hover:gap-3 transition-all">
                    View Results <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-ocean-600 to-primary-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Shield className="w-16 h-16 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Ready to Analyze Your Coastal Data?
            </h2>
            <p className="text-lg text-ocean-100 mb-8 max-w-2xl mx-auto">
              Upload your QGIS reports and environmental datasets to get started with
              AI-powered threshold detection.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-ocean-700 font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/analysis"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300"
              >
                View Demo Analysis
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  )
}
