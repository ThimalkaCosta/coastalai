import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Cloud,
  Mountain,
  TrendingUp,
  Zap,
  Menu,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { name: 'Metrological Threshold', href: '/dashboard', icon: Cloud },
  { name: 'Morphological Threshold', href: '/morphological-threshold', icon: Mountain },
  { name: 'Long Term Forecasting', href: '/long-term-forecasting', icon: TrendingUp },
  { name: 'Short Term Forecasting', href: '/short-term-forecasting', icon: Zap },
]

export default function MainHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 z-50">
      <nav className="max-w-[1500px] mx-auto bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] border border-white/60">
        <div className="px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-4 group">
              <img 
                src="/logo_coastal.png" 
                alt="Coast Conservation & Coastal Resource Management Department" 
                className="h-10 sm:h-14 max-w-[180px] sm:max-w-[260px] lg:max-w-[340px] object-contain transition-all duration-300"
              />
            </Link>

            {/* Desktop Navigation Items */}
            <div className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="inline-flex items-center gap-2 px-3 xl:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 text-coastal-600 hover:bg-coastal-100 hover:text-coastal-900 whitespace-nowrap"
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden xl:inline">{item.name}</span>
                  <span className="xl:hidden">{item.name.split(' ')[0]}</span>
                </Link>
              ))}
            </div>

            {/* CoastalAI Branding - Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-coastal-300 to-transparent"></div>
              <div className="flex flex-col pl-3">
                <div className="flex items-baseline gap-1">
                  <span className="font-display font-black text-2xl xl:text-3xl text-ocean-600 drop-shadow-[2px_2px_0px_rgba(6,182,212,0.3)] [text-shadow:_1px_1px_0_rgb(255_255_255),_2px_2px_4px_rgba(0,0,0,0.1)]">Coastal</span>
                  <span className="font-display font-black text-2xl xl:text-3xl text-cyan-500 drop-shadow-[2px_2px_0px_rgba(14,116,144,0.3)] [text-shadow:_1px_1px_0_rgb(255_255_255),_2px_2px_4px_rgba(0,0,0,0.1)]">AI</span>
                </div>
                <span className="text-xs font-semibold text-coastal-500 tracking-[0.15em] uppercase">
                  Threshold Detection
                </span>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-coastal-600 hover:bg-coastal-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-coastal-100 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-coastal-700 hover:bg-coastal-50 transition-colors"
                  >
                    <item.icon className="w-5 h-5 text-ocean-500" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
                {/* Mobile Branding */}
                <div className="pt-4 mt-4 border-t border-coastal-100 flex items-center justify-center gap-1">
                  <span className="font-display font-black text-xl text-ocean-600">Coastal</span>
                  <span className="font-display font-black text-xl text-cyan-500">AI</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}
