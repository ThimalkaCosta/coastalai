import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  BarChart3,
  GitBranch,
  Layers,
  Zap,
  ChevronDown,
  Target,
  LayoutDashboard,
  LogOut,
  Users,
  PanelLeft,
  X,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const ROLE_BADGE = {
  Officer: 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20',
  Manager: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20',
  'Head Office': 'bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20',
}

function getSidebarNavigation(role) {
  const base = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Data', href: '/upload', icon: Upload },
    { name: 'Analysis', href: '/analysis', icon: BarChart3 },
    { name: 'Threshold', href: '/threshold', icon: Target },
    { name: 'Forecast', href: '/forecast-thresholds', icon: TrendingUp },
    {
      name: 'Models',
      icon: Layers,
      children: [
        { name: 'Random Forest', href: '/models/random-forest', icon: GitBranch },
        { name: 'HMM', href: '/models/hmm', icon: Layers },
        { name: 'XGBoost', href: '/models/xgboost', icon: Zap },
      ],
    },
  ]
  if (role === 'Manager' || role === 'Head Office') {
    base.push({ name: 'Users', href: '/admin/users', icon: Users })
  }
  return base
}

export default function Sidebar() {
  const [modelsOpen, setModelsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { currentUser, userRole, logout } = useAuth()

  const navigation = getSidebarNavigation(userRole)

  const isActive = (href) => location.pathname === href
  const isModelsActive = () => location.pathname.startsWith('/models')

  // Auto-expand models menu if on a model page
  useEffect(() => {
    if (isModelsActive()) setModelsOpen(true)
  }, [location.pathname])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ocean-500 to-primary-600 flex items-center justify-center shadow-lg shadow-ocean-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="font-display font-extrabold text-lg text-coastal-900">Coastal</span>
            <span className="font-display font-extrabold text-lg text-ocean-500">AI</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-coastal-200 to-transparent" />

      {/* Navigation Items */}
      <nav className="flex-1 px-3 pt-4 pb-2 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-coastal-400">
          Menu
        </p>
        {navigation.map((item) =>
          item.children ? (
            <div key={item.name}>
              <button
                onClick={() => setModelsOpen(!modelsOpen)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isModelsActive()
                    ? 'bg-gradient-to-r from-ocean-50 to-primary-50 text-ocean-700'
                    : 'text-coastal-600 hover:bg-coastal-50 hover:text-coastal-800'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  isModelsActive()
                    ? 'bg-ocean-500/10 text-ocean-600'
                    : 'bg-coastal-100 text-coastal-500 group-hover:bg-coastal-200 group-hover:text-coastal-700'
                }`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left">{item.name}</span>
                <ChevronDown
                  className={`w-4 h-4 text-coastal-400 transition-transform duration-200 ${
                    modelsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {modelsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 mt-1 space-y-0.5 overflow-hidden"
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                          isActive(child.href)
                            ? 'bg-ocean-50 text-ocean-700 font-semibold'
                            : 'text-coastal-500 hover:bg-coastal-50 hover:text-coastal-700'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          isActive(child.href) ? 'bg-ocean-500' : 'bg-coastal-300'
                        }`} />
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive(item.href)
                  ? 'bg-gradient-to-r from-ocean-50 to-primary-50 text-ocean-700'
                  : 'text-coastal-600 hover:bg-coastal-50 hover:text-coastal-800'
              }`}
            >
              {isActive(item.href) && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-ocean-500 to-primary-500 rounded-r-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                isActive(item.href)
                  ? 'bg-ocean-500/10 text-ocean-600'
                  : 'bg-coastal-100 text-coastal-500 group-hover:bg-coastal-200 group-hover:text-coastal-700'
              }`}>
                <item.icon className="w-4 h-4" />
              </div>
              <span>{item.name}</span>
            </Link>
          )
        )}
      </nav>

      {/* User Account Section at Bottom */}
      {currentUser && (
        <div className="p-3">
          <div className="divider-gradient mb-3" />
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-coastal-50 to-coastal-100/50">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt=""
                className="w-9 h-9 rounded-xl flex-shrink-0 ring-2 ring-white shadow-sm object-cover"
              />
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-ocean-400 to-primary-500 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm">
                {(currentUser.displayName || currentUser.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-coastal-900 truncate">
                {currentUser.displayName || 'User'}
              </div>
              {userRole && (
                <span
                  className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold mt-0.5 ${
                    ROLE_BADGE[userRole] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {userRole}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-coastal-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-5 left-5 z-50 w-12 h-12 bg-gradient-to-br from-ocean-500 to-ocean-600 text-white rounded-2xl shadow-lg shadow-ocean-500/30 flex items-center justify-center hover:shadow-xl hover:shadow-ocean-500/40 transition-all duration-200 active:scale-95"
        aria-label="Open navigation"
      >
        <PanelLeft className="w-5 h-5" />
      </button>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-coastal-900/20 backdrop-blur-sm z-[60]"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[272px] z-[70] bg-white shadow-2xl border-r border-coastal-100 flex flex-col"
            >
              {/* Mobile drawer close button */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-coastal-100 transition-colors z-10"
              >
                <X className="w-5 h-5 text-coastal-400" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-3 top-[84px] bottom-3 w-64 z-40">
        <div className="w-full h-full bg-white backdrop-blur-xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] border border-white flex flex-col overflow-hidden">
          {sidebarContent}
        </div>
      </aside>
    </>
  )
}
