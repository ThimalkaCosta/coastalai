import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Mountain,
  TrendingUp,
  LogOut,
  PanelLeft,
  X,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const ROLE_BADGE = {
  Officer: 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20',
  Manager: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20',
  'Head Office': 'bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20',
}

function getMorphNavigation() {
  return [
    { name: 'Upload Data', href: '/morph/upload', icon: Upload },
    { name: 'Threshold Analysis', href: '/morph/threshold', icon: Mountain },
    { name: 'Forecast', href: '/morph/forecast', icon: TrendingUp },
  ]
}

export default function MorphSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { currentUser, userRole, logout } = useAuth()

  const navigation = getMorphNavigation()
  const isActive = (href) => location.pathname === href

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Mountain className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="font-display font-extrabold text-lg text-coastal-900">Morph</span>
            <span className="font-display font-extrabold text-lg text-emerald-500">AI</span>
          </div>
        </div>
      </div>

      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-coastal-200 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4 pb-2 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-coastal-400">
          Morphological
        </p>
        {navigation.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
              isActive(item.href)
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700'
                : 'text-coastal-600 hover:bg-coastal-50 hover:text-coastal-800'
            }`}
          >
            {isActive(item.href) && (
              <motion.div
                layoutId="morph-sidebar-active"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-r-full"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
              isActive(item.href)
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-coastal-100 text-coastal-500 group-hover:bg-coastal-200 group-hover:text-coastal-700'
            }`}>
              <item.icon className="w-4 h-4" />
            </div>
            <span>{item.name}</span>
          </Link>
        ))}

        {/* Back to Meteorological */}
        <div className="mx-4 my-3 h-px bg-gradient-to-r from-transparent via-coastal-200 to-transparent" />
        <Link
          to="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-coastal-500 hover:bg-coastal-50 hover:text-coastal-700 transition-all duration-200 group"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-coastal-100 text-coastal-500 group-hover:bg-coastal-200 group-hover:text-coastal-700 transition-all duration-200">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>Meteorological</span>
        </Link>
      </nav>

      {/* User Account */}
      {currentUser && (
        <div className="p-3">
          <div className="mx-1 mb-3 h-px bg-gradient-to-r from-transparent via-coastal-200 to-transparent" />
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-coastal-50 to-coastal-100/50">
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="" className="w-9 h-9 rounded-xl flex-shrink-0 ring-2 ring-white shadow-sm object-cover" />
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm">
                {(currentUser.displayName || currentUser.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-coastal-900 truncate">
                {currentUser.displayName || 'User'}
              </div>
              {userRole && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${ROLE_BADGE[userRole] || ''}`}>
                  {userRole}
                </span>
              )}
            </div>
            <button onClick={logout} className="p-2 rounded-lg text-coastal-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 left-4 z-40 p-3 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-500/30 hover:bg-emerald-600 transition-all"
      >
        <PanelLeft className="w-5 h-5" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-white/95 backdrop-blur-xl z-50 flex flex-col border-r border-coastal-200/60 shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg text-coastal-400 hover:text-coastal-600 hover:bg-coastal-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:top-[80px] lg:left-0 lg:bottom-0 lg:w-[272px] bg-white/80 backdrop-blur-xl border-r border-coastal-200/60 z-30 shadow-sm">
        {sidebarContent}
      </aside>
    </>
  )
}
