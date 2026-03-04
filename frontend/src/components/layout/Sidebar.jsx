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
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const ROLE_BADGE = {
  Officer: 'bg-blue-100 text-blue-700 border-blue-200',
  Manager: 'bg-green-100 text-green-700 border-green-200',
  'Head Office': 'bg-purple-100 text-purple-700 border-purple-200',
}

function getSidebarNavigation(role) {
  const base = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
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

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const sidebarContent = (
    <>
      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item) =>
          item.children ? (
            <div key={item.name}>
              <button
                onClick={() => setModelsOpen(!modelsOpen)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isModelsActive()
                    ? 'bg-ocean-50 text-ocean-600'
                    : 'text-coastal-600 hover:bg-coastal-50 hover:text-coastal-900'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1 text-left">{item.name}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
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
                    className="ml-4 mt-1 space-y-0.5 overflow-hidden"
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive(child.href)
                            ? 'bg-ocean-50 text-ocean-600 font-medium'
                            : 'text-coastal-500 hover:bg-coastal-50 hover:text-coastal-900'
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(item.href)
                  ? 'bg-ocean-50 text-ocean-600 shadow-sm'
                  : 'text-coastal-600 hover:bg-coastal-50 hover:text-coastal-900'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          )
        )}
      </nav>

      {/* User Account Section at Bottom */}
      {currentUser && (
        <div className="p-3 border-t border-coastal-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-coastal-50/80">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt=""
                className="w-9 h-9 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 bg-ocean-100 rounded-full flex items-center justify-center text-sm font-semibold text-ocean-700 flex-shrink-0 ring-2 ring-white shadow-sm">
                {(currentUser.displayName || currentUser.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-coastal-900 truncate">
                {currentUser.displayName || 'User'}
              </div>
              {userRole && (
                <span
                  className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium mt-0.5 ${
                    ROLE_BADGE[userRole] || 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  {userRole}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
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
        className="lg:hidden fixed bottom-4 left-4 z-50 w-12 h-12 bg-ocean-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-ocean-700 transition-colors active:scale-95"
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
              className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[272px] z-[70] bg-white/95 backdrop-blur-xl shadow-2xl border-r border-white/60 flex flex-col"
            >
              {/* Mobile drawer header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-coastal-100">
                <div className="flex items-baseline gap-1">
                  <span className="font-display font-black text-xl text-ocean-600">Coastal</span>
                  <span className="font-display font-black text-xl text-cyan-500">AI</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-coastal-100 transition-colors"
                >
                  <X className="w-5 h-5 text-coastal-500" />
                </button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-3 top-[84px] bottom-3 w-64 z-40">
        <div className="w-full h-full bg-white/70 backdrop-blur-xl rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] border border-white/60 flex flex-col overflow-hidden">
          {sidebarContent}
        </div>
      </aside>
    </>
  )
}
