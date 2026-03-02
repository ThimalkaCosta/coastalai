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
  Navigation,
  Cloud,
  Mountain,
  TrendingUp,
  Zap,
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'

const dashboardOptions = [
  { name: 'Metrological Threshold', href: '/dashboard', icon: Cloud },
  { name: 'Morphological Threshold', href: '/morphological-threshold', icon: Mountain },
  { name: 'Long Term Forecasting', href: '/long-term-forecasting', icon: TrendingUp },
  { name: 'Short Term Forecasting', href: '/short-term-forecasting', icon: Zap },
]

export default function HomePage() {
  const [showDashboardMenu, setShowDashboardMenu] = useState(false)

  return (
    <PageTransition>

      {/* Hero Section - Full Screen */}
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
          {/* Subtle overlay for enhanced visual quality */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-12 sm:pb-20 text-center">
          {/* CTA Buttons Only */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-[40vh] sm:mt-[50vh]"
          >
            {/* Enter Dashboard Button with Popup */}
            <div className="relative">
              <button
                onClick={() => setShowDashboardMenu(!showDashboardMenu)}
                className="group inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-white text-ocean-700 font-semibold rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base"
              >
                <BarChart3 className="w-5 h-5" />
                Enter Dashboard
                <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${showDashboardMenu ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
              </button>

              {/* Popup Menu */}
              <AnimatePresence>
                {showDashboardMenu && (
                  <>
                    {/* Backdrop to close menu */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowDashboardMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-coastal-100 z-50"
                    >
                      <div className="p-3 space-y-1">
                        {dashboardOptions.map((option, index) => (
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

            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 border-2 border-white/40 text-white font-semibold rounded-xl sm:rounded-2xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300 text-sm sm:text-base"
            >
              <Database className="w-5 h-5" />
              Upload Your Data
            </Link>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 bg-ocean-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-primary-500 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-ocean-100 text-ocean-700 rounded-full text-sm font-medium mb-6">
                <Globe className="w-4 h-4" />
                About the Framework
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-coastal-900 mb-4 sm:mb-6">
                Protecting Sri Lanka's{' '}
                <span className="text-ocean-500">Coastline</span>
              </h2>
              <p className="text-base sm:text-lg text-coastal-600 mb-4 sm:mb-6">
                Our AI-powered framework analyzes decades of environmental data to identify 
                critical thresholds that trigger coastal erosion events. By understanding these 
                patterns, we enable proactive coastal management and protection strategies.
              </p>
              <p className="text-coastal-600 mb-8">
                Developed in collaboration with the Coast Conservation & Coastal Resource 
                Management Department, this tool combines advanced machine learning with 
                comprehensive oceanographic datasets spanning from 2000 to 2025.
              </p>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-ocean-100 flex items-center justify-center">
                    <Anchor className="w-6 h-6 text-ocean-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-display font-bold text-coastal-900">109</div>
                    <div className="text-sm text-coastal-500">Transects Analyzed</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Navigation className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-display font-bold text-coastal-900">25+</div>
                    <div className="text-sm text-coastal-500">Years of Data</div>
                  </div>
                </div>
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
                {/* Central Circle */}
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-ocean-100 to-primary-100 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-ocean-500 to-primary-600 flex items-center justify-center shadow-2xl">
                    <Waves className="w-16 h-16 text-white" />
                  </div>
                </div>
                
                {/* Orbiting Elements */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                    <Activity className="w-7 h-7 text-ocean-600" />
                  </div>
                </motion.div>
                
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4"
                >
                  <div className="absolute bottom-0 right-0 w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                    <BarChart3 className="w-7 h-7 text-primary-600" />
                  </div>
                </motion.div>
                
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2"
                >
                  <div className="absolute top-1/4 left-0 w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                    <Database className="w-7 h-7 text-emerald-600" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-ocean-600 via-ocean-700 to-primary-800 text-white relative overflow-hidden">
        {/* Background Pattern */}
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
              Ready to Explore?
            </h2>
            <p className="text-xl text-ocean-100 mb-10 max-w-2xl mx-auto">
              Access the full dashboard to view detailed analysis, upload your data, 
              and explore AI-powered threshold detection results.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/dashboard"
                className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-ocean-700 font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 text-lg"
              >
                <BarChart3 className="w-6 h-6" />
                Go to Dashboard
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/analysis"
                className="inline-flex items-center justify-center gap-2 px-10 py-5 border-2 border-white/30 text-white font-semibold rounded-2xl hover:bg-white/10 transition-all duration-300 text-lg"
              >
                View Analysis
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  )
}
