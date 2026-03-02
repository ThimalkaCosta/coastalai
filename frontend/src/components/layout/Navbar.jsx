import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  Home,
  Cloud,
  Mountain,
  TrendingUp,
  Zap,
} from 'lucide-react'

const headerNavigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Meteorological-Based Threshold Detection', href: '/dashboard', icon: Cloud },
  { name: 'Morphological-Based Threshold Prediction', href: '/morphological-threshold', icon: Mountain },
  { name: 'Long-Term Forecasting', href: '/long-term-forecasting', icon: TrendingUp },
  { name: 'Short-Term Forecasting', href: '/short-term-forecasting', icon: Zap },
]

/* Paths belonging to each top-level section (for active-tab highlighting) */
const METEOROLOGICAL_PATHS = ['/dashboard', '/upload', '/analysis', '/threshold', '/models', '/admin']
const MORPHOLOGICAL_PATHS = ['/morphological-threshold', '/hmm-analysis', '/regime-profiles', '/seasonal-analysis']

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/'
    if (href === '/dashboard') return METEOROLOGICAL_PATHS.some((p) => location.pathname.startsWith(p))
    if (href === '/morphological-threshold') return MORPHOLOGICAL_PATHS.some((p) => location.pathname.startsWith(p))
    return location.pathname === href
  }

  return (
    <nav className="fixed top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 z-50">
      <div className="max-w-[1500px] mx-auto bg-white/70 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] border border-white/60">
        <div className="px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-4 group flex-shrink-0">
              <img
                src="/logo_coastal.png"
                alt="Coast Conservation & Coastal Resource Management Department"
                className="h-9 sm:h-12 max-w-[160px] sm:max-w-[220px] lg:max-w-[280px] object-contain transition-all duration-300"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
              {headerNavigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-2 text-xs xl:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                    isActive(item.href)
                      ? 'text-ocean-600 bg-ocean-50'
                      : 'text-coastal-600 hover:bg-coastal-100 hover:text-coastal-900'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {item.name}
                </Link>
              ))}
            </div>

            {/* CoastalAI Branding */}
            <div className="hidden xl:flex items-center gap-2">
              <div className="w-px h-10 bg-gradient-to-b from-transparent via-coastal-300 to-transparent"></div>
              <div className="flex items-baseline gap-1 pl-2">
                <span className="font-display font-black text-xl text-ocean-600">Coastal</span>
                <span className="font-display font-black text-xl text-cyan-500">AI</span>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden btn-ghost p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-coastal-100 rounded-b-xl sm:rounded-b-2xl overflow-hidden mt-1"
          >
            <div className="px-4 py-4 space-y-1">
              {headerNavigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${
                    isActive(item.href)
                      ? 'bg-ocean-50 text-ocean-600'
                      : 'text-coastal-600 hover:bg-coastal-50'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 flex flex-col items-center">
                <div className="flex items-baseline gap-1">
                  <span className="font-display font-black text-2xl text-ocean-600">Coastal</span>
                  <span className="font-display font-black text-2xl text-cyan-500">AI</span>
                </div>
                <span className="text-xs font-semibold text-coastal-500 tracking-[0.15em] uppercase">
                  SRILANKA
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
