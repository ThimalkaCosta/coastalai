import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Waves,
  ArrowRight,
  Shield,
  Activity,
  Database,
  BarChart3,
  Sparkles,
  Globe,
  Anchor,
  Cloud,
  Mountain,
  Users,
  TrendingUp,
  Cpu,
  Eye,
  Calendar,
  Map,
  Wind,
  Thermometer,
  GitBranch,
  Layers,
  Zap,
  Upload,
  Target,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import PageTransition from '../components/common/PageTransition'

const dashboardOptions = [
  { name: 'Meteorological Threshold', href: '/dashboard', icon: Cloud },
  { name: 'Morphological Threshold', href: '/morphological', icon: Mountain },
]

/* ─── Feature cards data ─── */
const coreFeatures = [
  {
    icon: Cloud,
    title: 'Meteorological Threshold Analysis',
    description: 'Identify critical weather thresholds — wave height, wind speed, sea surface temperature — that trigger coastal erosion events using AI-driven analysis.',
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    href: '/dashboard',
  },
  {
    icon: Mountain,
    title: 'Morphological Threshold Analysis',
    description: 'Analyze shoreline shape changes, sediment transport patterns, and beach profile dynamics to understand physical erosion vulnerability.',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    href: '/morphological',
  },
  {
    icon: TrendingUp,
    title: 'Short-Term Forecasting',
    description: 'Predict coastal erosion risk days to weeks ahead using real-time meteorological data and machine learning models for rapid response planning.',
    color: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    href: '/short-term',
  },
  {
    icon: Calendar,
    title: 'Long-Term Forecasting',
    description: 'Generate multi-year coastal change projections to support infrastructure planning, policy decisions, and climate adaptation strategies.',
    color: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    href: '/long-term',
  },
]

const mlModels = [
  {
    icon: GitBranch,
    name: 'Random Forest',
    description: 'Ensemble decision-tree model for robust erosion threshold classification across multiple transects.',
  },
  {
    icon: Layers,
    name: 'Hidden Markov Model',
    description: 'Sequential state-based model that captures temporal erosion regime transitions and seasonal patterns.',
  },
  {
    icon: Zap,
    name: 'XGBoost',
    description: 'Gradient boosting framework delivering high-accuracy predictions with feature importance ranking.',
  },
]

const systemCapabilities = [
  { icon: Upload, label: 'Multi-format Data Upload', desc: 'CSV, NetCDF, KML support' },
  { icon: Cpu, label: 'Automated Analysis Pipeline', desc: 'End-to-end notebook execution' },
  { icon: Eye, label: 'Interactive Visualizations', desc: 'Charts, maps & heatmaps' },
  { icon: Target, label: 'Threshold Detection', desc: 'AI-powered early warnings' },
  { icon: Map, label: '109 Coastal Transects', desc: 'Full Sri Lanka coverage' },
  { icon: MessageSquare, label: 'AI Chat Assistant', desc: 'Ask questions about results' },
  { icon: Users, label: 'Role-Based Access', desc: 'Officer, Manager & Head Office' },
  { icon: Shield, label: 'Secure & Reliable', desc: 'Firebase authentication' },
]

const stats = [
  { value: '109', label: 'Coastal Transects', icon: Anchor },
  { value: '25+', label: 'Years of Data', icon: Calendar },
  { value: '3', label: 'ML Models', icon: Cpu },
  { value: '2000–2025', label: 'Data Coverage', icon: Database },
]

export default function HomePage() {
  const [showDashboardMenu, setShowDashboardMenu] = useState(false)
  const { userRole } = useAuth()
  const showUsersButton = userRole === 'Manager' || userRole === 'Head Office'

  return (
    <PageTransition>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION – Full Screen with Background Image
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-visible pt-20 sm:pt-28">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/Main_home.png)',
              imageRendering: '-webkit-optimize-contrast',
              filter: 'contrast(1.05) saturate(1.1) brightness(1.02)',
              transform: 'scale(1.01)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-12 sm:pb-20 text-center">
          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-[40vh] sm:mt-[50vh]"
          >
            {/* Enter Dashboard Button with Popup */}
            <div className="relative">
              <button
                onClick={() => setShowDashboardMenu(!showDashboardMenu)}
                className="group inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-white text-ocean-700 font-bold rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base active:scale-[0.98]"
              >
                <BarChart3 className="w-5 h-5" />
                Enter Dashboard
                <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${showDashboardMenu ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
              </button>

              {/* Popup Menu */}
              <AnimatePresence>
                {showDashboardMenu && (
                  <>
                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowDashboardMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-elevation-3 border border-coastal-100/50 z-50"
                    >
                      <div className="p-3 space-y-1">
                        {dashboardOptions.map((option) => (
                          <Link
                            key={option.name}
                            to={option.href}
                            onClick={() => setShowDashboardMenu(false)}
                            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-coastal-700 hover:bg-ocean-50 hover:text-ocean-700 transition-all duration-200"
                          >
                            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-ocean-500 to-primary-600 flex items-center justify-center shadow-md flex-shrink-0">
                              <option.icon className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-medium text-sm">{option.name}</span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Users button (Manager/Head Office) or Explore Features for others */}
            {showUsersButton ? (
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 border-2 border-white/40 text-white font-bold rounded-xl sm:rounded-2xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300 text-sm sm:text-base active:scale-[0.98]"
              >
                <Users className="w-5 h-5" />
                Manage Users
              </Link>
            ) : (
              <a
                href="#overview"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 border-2 border-white/40 text-white font-bold rounded-xl sm:rounded-2xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300 text-sm sm:text-base active:scale-[0.98]"
              >
                <Eye className="w-5 h-5" />
                Explore Features
              </a>
            )}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative -mt-16 z-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-6 sm:p-8"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-ocean-50 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-ocean-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-display font-bold text-coastal-900">{stat.value}</div>
                  <div className="text-sm text-coastal-500 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SYSTEM OVERVIEW
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="overview" className="py-16 sm:py-20 lg:py-28 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 bg-ocean-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-primary-500 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-ocean-50 text-ocean-600 rounded-full text-sm font-semibold mb-6 border border-ocean-100">
              <Globe className="w-3.5 h-3.5" />
              System Overview
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-coastal-900 mb-6">
              A Complete AI Framework for{' '}
              <span className="text-ocean-500">Coastal Protection</span>
            </h2>
            <p className="text-lg text-coastal-600 leading-relaxed">
              CoastalAI is developed in collaboration with the Coast Conservation & Coastal Resource
              Management Department of Sri Lanka. It fuses 25+ years of oceanographic, meteorological,
              and morphological data with state-of-the-art machine learning to deliver actionable insights
              for coastal erosion management.
            </p>
          </motion.div>

          {/* Two-column about */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-coastal-900 mb-6">
                How It Works
              </h3>
              <div className="space-y-5">
                {[
                  { step: '01', title: 'Data Collection', desc: 'Upload shoreline survey data (CSV), wave reanalysis, wind speed, and ocean current datasets (NetCDF) spanning 2000–2025.' },
                  { step: '02', title: 'AI Analysis', desc: 'Our automated pipeline runs Random Forest, HMM, and XGBoost models to classify erosion risk, detect temporal regimes, and identify critical thresholds.' },
                  { step: '03', title: 'Threshold Detection', desc: 'The system identifies meteorological and morphological conditions that trigger significant shoreline retreat across 109 coastal transects.' },
                  { step: '04', title: 'Forecasting & Action', desc: 'Generate short-term (days/weeks) and long-term (years) erosion forecasts to enable proactive coastal management and policy decisions.' },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-500 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-coastal-900 mb-1">{item.title}</h4>
                      <p className="text-sm text-coastal-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative aspect-square max-w-md mx-auto">
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-ocean-100 to-primary-100 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-ocean-500 to-primary-600 flex items-center justify-center shadow-2xl">
                    <Waves className="w-16 h-16 text-white" />
                  </div>
                </div>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="absolute inset-0">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                    <Wind className="w-7 h-7 text-ocean-600" />
                  </div>
                </motion.div>
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }} className="absolute inset-4">
                  <div className="absolute bottom-0 right-0 w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                    <Thermometer className="w-7 h-7 text-primary-600" />
                  </div>
                </motion.div>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} className="absolute inset-2">
                  <div className="absolute top-1/4 left-0 w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                    <Activity className="w-7 h-7 text-emerald-600" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CORE FEATURES
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-coastal-50/50 to-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 text-primary-600 rounded-full text-sm font-semibold mb-6 border border-primary-100">
              <Sparkles className="w-3.5 h-3.5" />
              Key Features
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-coastal-900 mb-6">
              Four Pillars of{' '}
              <span className="text-ocean-500">Coastal Intelligence</span>
            </h2>
            <p className="text-lg text-coastal-600">
              Each module addresses a critical dimension of coastal erosion analysis —
              from real-time meteorological triggers to long-range shoreline projections.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
            {coreFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={feature.href}
                  className="block h-full p-6 sm:p-8 bg-white rounded-2xl shadow-sm border border-coastal-100/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} mb-5 shadow-lg`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-coastal-900 mb-3 group-hover:text-ocean-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-coastal-600 leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ocean-600 group-hover:gap-2.5 transition-all">
                    Explore <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          ML MODELS SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-50 text-violet-600 rounded-full text-sm font-semibold mb-6 border border-violet-100">
              <Cpu className="w-3.5 h-3.5" />
              Machine Learning Models
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-coastal-900 mb-6">
              Powered by <span className="text-ocean-500">Three AI Engines</span>
            </h2>
            <p className="text-lg text-coastal-600">
              Each model brings unique strengths to the analysis — ensemble learning, temporal modelling,
              and gradient boosting — delivering comprehensive erosion classification and forecasting.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {mlModels.map((model, i) => (
              <motion.div
                key={model.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative p-6 sm:p-8 bg-gradient-to-br from-coastal-50 to-white rounded-2xl border border-coastal-100/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-coastal-800 to-ocean-700 flex items-center justify-center mb-5 shadow-lg">
                  <model.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold text-coastal-900 mb-3">{model.name}</h3>
                <p className="text-coastal-600 leading-relaxed">{model.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CAPABILITIES GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-coastal-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-sm font-semibold mb-6 border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5" />
              System Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-coastal-900 mb-6">
              Everything You Need in{' '}
              <span className="text-ocean-500">One Platform</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {systemCapabilities.map((cap, i) => (
              <motion.div
                key={cap.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-coastal-100/50 hover:shadow-md transition-all duration-200 text-center"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-ocean-50 flex items-center justify-center">
                  <cap.icon className="w-6 h-6 text-ocean-600" />
                </div>
                <h4 className="font-semibold text-coastal-900 text-sm mb-1">{cap.label}</h4>
                <p className="text-xs text-coastal-500">{cap.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-coastal-900 via-ocean-900 to-coastal-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center"
            >
              <Shield className="w-10 h-10 text-white" />
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Ready to Protect the Coast?
            </h2>
            <p className="text-xl text-ocean-100 mb-10 max-w-2xl mx-auto">
              Open the dashboard to review erosion indicators,
              run model insights, and explore threshold detection results across Sri Lanka's coastline.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/dashboard"
                className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-ocean-700 font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 text-lg active:scale-[0.98]"
              >
                <BarChart3 className="w-6 h-6" />
                Go to Dashboard
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/morphological"
                className="inline-flex items-center justify-center gap-2 px-10 py-5 border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white/10 transition-all duration-300 text-lg active:scale-[0.98]"
              >
                <Upload className="w-5 h-5" />
                Open Morphology
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  )
}
