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
  Activity,
  Sparkles,
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import { useData } from '../context/DataContext'

const features = [
  {
    icon: Upload,
    title: 'Data Upload',
    description: 'Upload QGIS analysis reports and environmental datasets with drag-and-drop simplicity.',
    color: 'from-blue-500 to-cyan-500',
    bgLight: 'from-blue-50 to-cyan-50',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analysis',
    description: 'Visualize shoreline changes, environmental drivers, and threshold detection results.',
    color: 'from-violet-500 to-purple-500',
    bgLight: 'from-violet-50 to-purple-50',
  },
  {
    icon: Target,
    title: 'Threshold Detection',
    description: 'AI-powered detection of erosion thresholds using multiple machine learning models.',
    color: 'from-orange-500 to-red-500',
    bgLight: 'from-orange-50 to-red-50',
  },
]

const models = [
  {
    icon: GitBranch,
    name: 'Random Forest',
    description: 'Feature importance ranking and decision tree-based threshold extraction.',
    href: '/models/random-forest',
    color: 'from-emerald-500 to-teal-500',
    metric: 'Feature Importance',
  },
  {
    icon: Layers,
    name: 'Hidden Markov Model',
    description: 'Sequential state detection with transition probabilities.',
    href: '/models/hmm',
    color: 'from-violet-500 to-purple-500',
    metric: 'Regime Detection',
  },
  {
    icon: Zap,
    name: 'XGBoost',
    description: 'High-accuracy classification with SHAP value interpretation.',
    href: '/models/xgboost',
    color: 'from-amber-500 to-orange-500',
    metric: 'SHAP Analysis',
  },
]

export default function LandingPage() {
  const { data, dataLoaded } = useData()

  // ── Shoreline-derived stats ───────────────────────────────────────────────
  const shoreline = data.shoreline || []
  const nsmVals   = shoreline.map(r => r.NSM).filter(v => v != null && !isNaN(v))
  const meanNSM   = nsmVals.length ? (nsmVals.reduce((a, b) => a + b, 0) / nsmVals.length).toFixed(2) : null
  const erosionPct = shoreline.length
    ? ((shoreline.filter(r => r.erosion_flag).length / shoreline.length) * 100).toFixed(1)
    : null

  // ── Time series year range ────────────────────────────────────────────────
  const ts = data.timeSeries || []
  const years = ts.map(r => r.monsoon_year).filter(Boolean)
  const yearRange = years.length
    ? years.length === 1 ? String(years[0]) : `${Math.min(...years)}–${Math.max(...years)}`
    : null

  // ── Model accuracy from three-class recognition ───────────────────────────
  const tcr = data.threeClassRecognition || {}
  const modelAccuracy = tcr.balancedAccuracy != null
    ? `${(tcr.balancedAccuracy * 100).toFixed(1)}%`
    : '--'

  // ── Mean NSM display ──────────────────────────────────────────────────────
  const erosionNSM = meanNSM ? `${meanNSM} m` : '--'

  // ── Stats bar ─────────────────────────────────────────────────────────────
  const stats = [
    { value: erosionPct ? `${erosionPct}%` : '--', label: 'Erosion Rate' },
    { value: yearRange || '--',                     label: 'Years of Data' },
    { value: shoreline.length ? shoreline.length.toLocaleString() : '--', label: 'Transects Analysed' },
    { value: '10',                                  label: 'ML Models' },
  ]

  // ── Threshold card values from driverThresholds ───────────────────────────
  const driverThr = data.driverThresholds || []
  const getThr = (key) => {
    const row = driverThr.find(r => r.driver?.toLowerCase() === key.toLowerCase())
    return row ? Number(row.erosionOnsetThreshold).toFixed(3) : '--'
  }

  return (
    <PageTransition>
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-80px)] flex items-center overflow-hidden">
        {/* Background Image with Dark Cinematic Overlay */}
        <div className="fixed inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
            style={{ 
              backgroundImage: 'url(/background_coastal.png)',
              imageRendering: '-webkit-optimize-contrast',
              filter: 'contrast(1.05) saturate(1.1) brightness(1.0)',
            }}
          />
          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/15 via-slate-900/8 to-ocean-900/5" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>
        
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/15 backdrop-blur-md text-blue-300 rounded-full text-xs font-bold mb-6 ring-1 ring-blue-400/30 tracking-wider uppercase"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Coastal Research
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-white leading-[1.06] mb-6 tracking-tight"
                style={{ textShadow: '0 2px 30px rgba(0,0,0,0.4)' }}
              >
                Coastal Erosion{' '}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">Threshold Detection</span>{' '}
                Framework
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-white/70 mb-8 max-w-xl leading-relaxed"
                style={{ textShadow: '0 1px 8px rgba(0,0,0,0.25)' }}
              >
                Advanced machine learning framework for detecting and analyzing coastal erosion
                thresholds using environmental drivers including waves, winds, and currents.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-3"
              >
                <Link to="/dashboard" className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all duration-200 text-sm">
                  Open Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/morphological" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/8 backdrop-blur-md text-white/90 font-semibold rounded-xl ring-1 ring-white/20 hover:bg-white/15 hover:ring-white/35 hover:-translate-y-0.5 transition-all duration-200 text-sm">
                  Open Morphology
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-12"
              >
                {stats.map((stat, index) => (
                  <div key={index} className="group px-5 py-4 bg-white/8 backdrop-blur-md rounded-2xl ring-1 ring-white/12 hover:bg-white/14 hover:ring-white/22 transition-all duration-200">
                    <div className="text-2xl font-display font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {stat.value}
                    </div>
                    <div className="text-xs text-white/50 font-medium mt-0.5">{stat.label}</div>
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
                  <div className="bg-white/10 backdrop-blur-xl ring-1 ring-white/15 rounded-2xl shadow-2xl shadow-black/20 p-8 w-80">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ocean-500 to-primary-600 flex items-center justify-center shadow-lg shadow-ocean-500/30">
                        <Target className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-white">Threshold</h3>
                        <p className="text-sm text-white/50">Detection Results</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white/8 rounded-xl ring-1 ring-white/5">
                        <span className="text-sm text-white/60">VHM0 mean</span>
                        <span className="font-mono font-semibold text-cyan-300">{getThr('VHM0_mean')} m</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/8 rounded-xl ring-1 ring-white/5">
                        <span className="text-sm text-white/60">uo mean</span>
                        <span className="font-mono font-semibold text-cyan-300">{getThr('uo_mean')} m/s</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/8 rounded-xl ring-1 ring-white/5">
                        <span className="text-sm text-white/60">Wind Speed</span>
                        <span className="font-mono font-semibold text-cyan-300">{getThr('eastward_wind_mean')} m/s</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute top-10 left-0 bg-white/10 backdrop-blur-xl ring-1 ring-white/15 rounded-2xl shadow-xl shadow-black/15 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/30 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs text-white/50 font-medium">Model Accuracy</div>
                      <div className="font-semibold text-white">{modelAccuracy}</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                  className="absolute bottom-20 right-0 bg-white/10 backdrop-blur-xl ring-1 ring-white/15 rounded-2xl shadow-xl shadow-black/15 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-ocean-500/20 ring-1 ring-ocean-400/30 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-xs text-white/50 font-medium">Mean NSM</div>
                      <div className="font-semibold text-white">{erosionNSM}</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-ocean-50 text-ocean-600 rounded-full text-xs font-semibold mb-4 ring-1 ring-ocean-100">
              <Activity className="w-3.5 h-3.5" />
              Analysis Pipeline
            </div>
            <h2 className="section-title mb-4">
              Comprehensive Analysis Pipeline
            </h2>
            <p className="section-subtitle mx-auto">
              From data upload to threshold detection, our framework provides end-to-end
              analysis capabilities for coastal erosion research.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-interactive p-6 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-display font-bold text-coastal-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-coastal-500 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-coastal-50 to-white bg-mesh-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-50 text-violet-600 rounded-full text-xs font-semibold mb-4 ring-1 ring-violet-100">
              <Sparkles className="w-3.5 h-3.5" />
              Machine Learning
            </div>
            <h2 className="section-title mb-4">
              Three-Model Detection Strategy
            </h2>
            <p className="section-subtitle mx-auto">
              Multiple machine learning models working together to provide robust and
              interpretable erosion threshold detection.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {models.map((model, index) => (
              <motion.div
                key={model.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={model.href} className="card-interactive p-6 h-full flex flex-col group">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${model.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <model.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-semibold text-coastal-400 uppercase tracking-wider bg-coastal-50 px-2.5 py-1 rounded-full">
                      {model.metric}
                    </span>
                  </div>
                  <h3 className="text-lg font-display font-bold text-coastal-900 mb-2 group-hover:text-ocean-600 transition-colors">
                    {model.name}
                  </h3>
                  <p className="text-sm text-coastal-500 flex-1 leading-relaxed">{model.description}</p>
                  <div className="flex items-center gap-2 text-ocean-600 font-semibold text-sm mt-5 pt-4 border-t border-coastal-100">
                    View Results <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 bg-gradient-to-br from-coastal-900 via-ocean-900 to-coastal-900 text-white overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-ocean-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-400 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 leading-tight">
              Ready to Analyze Your Coastal Data?
            </h2>
            <p className="text-lg text-ocean-200 mb-10 max-w-2xl mx-auto leading-relaxed">
              Open the dashboard to review coastal conditions and model outputs
              from the latest processed datasets.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-ocean-700 font-bold rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200"
              >
                Open Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/morphological"
                className="inline-flex items-center gap-2 px-8 py-4 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-200"
              >
                Open Morphology
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  )
}
