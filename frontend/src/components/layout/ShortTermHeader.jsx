import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Menu, X, Home } from 'lucide-react'

export default function ShortTermHeader() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path) => location.pathname === path

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
            <div className="hidden lg:flex items-center gap-1 xl:gap-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-3 xl:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap text-coastal-600 hover:bg-coastal-100 hover:text-coastal-900"
              >
                <Home className="w-4 h-4 flex-shrink-0" />
                <span>Home</span>
              </Link>
              <Link
                to="/short-term-forecasting"
                className={`inline-flex items-center gap-2 px-3 xl:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                  isActive('/short-term-forecasting')
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-coastal-600 hover:bg-amber-50 hover:text-coastal-900'
                }`}
              >
                <span>Forecast Analysis</span>
              </Link>
              <Link
                to="/long-term-forecasting"
                className="inline-flex items-center gap-2 px-3 xl:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap text-coastal-600 hover:bg-amber-50 hover:text-coastal-900"
              >
                <span>Long-Term Forecasting</span>
              </Link>
            </div>

            {/* Branding - Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-coastal-300 to-transparent"></div>
              <div className="flex flex-col pl-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 xl:w-6 h-5 xl:h-6 text-amber-600" />
                  <span className="font-display font-bold text-lg xl:text-xl text-coastal-800">Short-Term</span>
                </div>
                <span className="text-xs font-semibold text-coastal-500 tracking-[0.1em] uppercase">
                  Forecasting
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
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-coastal-700 hover:bg-coastal-50"
                >
                  <Home className="w-5 h-5 text-coastal-600" />
                  <span className="font-medium">Home</span>
                </Link>
                <Link
                  to="/short-term-forecasting"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive('/short-term-forecasting')
                      ? 'bg-amber-500 text-white'
                      : 'text-coastal-700 hover:bg-coastal-50'
                  }`}
                >
                  <span className="font-medium">Forecast Analysis</span>
                </Link>
                <Link
                  to="/long-term-forecasting"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-coastal-700 hover:bg-coastal-50"
                >
                  <span className="font-medium">Long-Term Forecasting</span>
                </Link>
                {/* Mobile Branding */}
                <div className="pt-4 mt-4 border-t border-coastal-100 flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5 text-amber-600" />
                  <span className="font-display font-bold text-coastal-800">Short-Term Forecasting</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}
