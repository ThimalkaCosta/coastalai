import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Waves, 
  Menu, 
  X, 
  Upload, 
  BarChart3, 
  GitBranch, 
  Layers, 
  Zap,
  ChevronDown,
  Target
} from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Upload Data', href: '/upload', icon: Upload },
  { name: 'Analysis', href: '/analysis', icon: BarChart3 },
  { name: 'Threshold', href: '/threshold', icon: Target },
  {
    name: 'Models',
    icon: Layers,
    children: [
      { name: 'Random Forest', href: '/models/random-forest', icon: GitBranch },
      { name: 'GMM', href: '/models/gmm', icon: Layers },
      { name: 'XGBoost', href: '/models/xgboost', icon: Zap },
    ],
  },
]

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [modelsOpen, setModelsOpen] = useState(false)
  const location = useLocation()

  const isActive = (href) => location.pathname === href
  const isModelsActive = () => location.pathname.startsWith('/models')

  return (
    <nav className="fixed top-3 left-3 right-3 z-50">
      <div className="max-w-[1500px] mx-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] border border-white/60">
        <div className="px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-4 group">
            <img 
              src="/logo_coastal.png" 
              alt="Coast Conservation & Coastal Resource Management Department" 
              className="h-14 max-w-[260px] sm:max-w-[340px] object-contain transition-all duration-300"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) =>
              item.children ? (
                <div key={item.name} className="relative">
                  <button
                    onClick={() => setModelsOpen(!modelsOpen)}
                    className={`btn-ghost flex items-center gap-1 ${
                      isModelsActive() ? 'text-ocean-600 bg-ocean-50' : ''
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                    <ChevronDown className={`w-4 h-4 transition-transform ${modelsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {modelsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-coastal-100 py-2 overflow-hidden"
                        onMouseLeave={() => setModelsOpen(false)}
                      >
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            to={child.href}
                            onClick={() => setModelsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              isActive(child.href)
                                ? 'bg-ocean-50 text-ocean-600'
                                : 'text-coastal-600 hover:bg-coastal-50 hover:text-coastal-900'
                            }`}
                          >
                            <child.icon className="w-4 h-4" />
                            {child.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`btn-ghost ${isActive(item.href) ? 'text-ocean-600 bg-ocean-50' : ''}`}
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.name}
                </Link>
              )
            )}
          </div>

          {/* CoastalAI Branding */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-coastal-300 to-transparent"></div>
            <div className="flex flex-col pl-3">
              <div className="flex items-baseline gap-1">
                <span className="font-display font-black text-3xl text-ocean-600 drop-shadow-[2px_2px_0px_rgba(6,182,212,0.3)] [text-shadow:_1px_1px_0_rgb(255_255_255),_2px_2px_4px_rgba(0,0,0,0.1)]">Coastal</span>
                <span className="font-display font-black text-3xl text-cyan-500 drop-shadow-[2px_2px_0px_rgba(14,116,144,0.3)] [text-shadow:_1px_1px_0_rgb(255_255_255),_2px_2px_4px_rgba(0,0,0,0.1)]">AI</span>
              </div>
              <span className="text-xs font-semibold text-coastal-500 tracking-[0.15em] uppercase">
                Threshold Detection
              </span>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden btn-ghost p-2"
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
            className="md:hidden bg-white border-t border-coastal-100"
          >
            <div className="px-4 py-4 space-y-1">
              {navigation.map((item) =>
                item.children ? (
                  <div key={item.name} className="space-y-1">
                    <div className="px-4 py-2 text-sm font-medium text-coastal-400">
                      {item.name}
                    </div>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${
                          isActive(child.href)
                            ? 'bg-ocean-50 text-ocean-600'
                            : 'text-coastal-600 hover:bg-coastal-50'
                        }`}
                      >
                        <child.icon className="w-4 h-4" />
                        {child.name}
                      </Link>
                    ))}
                  </div>
                ) : (
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
                    {item.icon && <item.icon className="w-4 h-4" />}
                    {item.name}
                  </Link>
                )
              )}
              <div className="pt-4 flex flex-col items-center">
                <div className="flex items-baseline gap-1">
                  <span className="font-display font-black text-2xl text-ocean-600 drop-shadow-[2px_2px_0px_rgba(6,182,212,0.3)] [text-shadow:_1px_1px_0_rgb(255_255_255),_2px_2px_4px_rgba(0,0,0,0.1)]">Coastal</span>
                  <span className="font-display font-black text-2xl text-cyan-500 drop-shadow-[2px_2px_0px_rgba(14,116,144,0.3)] [text-shadow:_1px_1px_0_rgb(255_255_255),_2px_2px_4px_rgba(0,0,0,0.1)]">AI</span>
                </div>
                <span className="text-xs font-semibold text-coastal-500 tracking-[0.15em] uppercase">
                  Threshold Detection
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
