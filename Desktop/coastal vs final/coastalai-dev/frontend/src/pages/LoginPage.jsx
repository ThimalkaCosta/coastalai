import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Waves,
  Shield,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  User,
  Briefcase,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useAuth, ROLES, ROLE_PERMISSIONS } from '../context/AuthContext'

const ROLE_CONFIG = [
  {
    value: ROLES.OFFICER,
    label: 'Officer',
    icon: User,
    gradient: 'from-blue-500 to-blue-600',
    border: 'border-blue-500',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    desc: 'Full app access — upload, update & operational tasks',
  },
  {
    value: ROLES.MANAGER,
    label: 'Manager',
    icon: Briefcase,
    gradient: 'from-green-500 to-emerald-600',
    border: 'border-green-500',
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    desc: 'Full access + approve & manage Officers',
  },
  {
    value: ROLES.HEAD_OFFICE,
    label: 'Head Office',
    icon: Building2,
    gradient: 'from-purple-500 to-violet-600',
    border: 'border-purple-500',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    desc: 'Full access + manage all users & roles',
  },
]

export default function LoginPage() {
  const {
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    authError,
    currentUser,
    userRole,
    userProfile,
    logout,
  } = useAuth()

  const [step, setStep] = useState('role') // 'role' | 'auth'
  const [selectedRole, setSelectedRole] = useState(null)
  const [authMode, setAuthMode] = useState('signin') // 'signin' | 'signup'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const navigate = useNavigate()

  const selectedRoleConfig = ROLE_CONFIG.find((r) => r.value === selectedRole)

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle(selectedRole)
    } catch (err) {
      setError(err.message || 'Google sign-in failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignUp = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) return setError('Please enter your full name.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    setError(null)
    try {
      await signUpWithEmail(email, password, displayName, selectedRole)
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'This email is already registered. Try signing in.'
        : err.message || 'Sign-up failed.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signInWithEmail(email, password)
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : err.message || 'Sign-in failed.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Already signed in but pending approval
  if (currentUser && userProfile && !userRole) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 border border-yellow-500/30 rounded-2xl p-8 w-full max-w-md text-center"
        >
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Access Pending</h2>
          <p className="text-gray-400 text-sm mb-2">
            Your account (<span className="text-yellow-400">{currentUser.email}</span>) is awaiting approval.
          </p>
          {userProfile?.requestedRole && (
            <p className="text-gray-500 text-xs mb-4">
              Requested role: <span className="text-gray-300 font-medium">{userProfile.requestedRole}</span>
            </p>
          )}
          <p className="text-gray-500 text-xs">
            A Manager or Head Office administrator will approve your access.
          </p>
          <button
            onClick={() => logout()}
            className="mt-6 text-sm text-gray-500 hover:text-gray-300 underline"
          >
            Sign out
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-white">CoastAI</h1>
              <p className="text-xs text-gray-400">Sri Lanka Coastal Research</p>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ===== STEP 1: Role Selection ===== */}
          {step === 'role' && (
            <motion.div
              key="role-step"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">Select Your Role</h2>
                <p className="text-gray-400 text-sm">Choose your role to continue</p>
              </div>

              <div className="space-y-3 mb-6">
                {ROLE_CONFIG.map((role) => {
                  const Icon = role.icon
                  const isSelected = selectedRole === role.value
                  return (
                    <motion.button
                      key={role.value}
                      onClick={() => setSelectedRole(role.value)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? `${role.border} ${role.bg}`
                          : 'border-gray-700/50 bg-gray-900/60 hover:border-gray-600'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? `bg-gradient-to-br ${role.gradient} shadow-lg`
                            : 'bg-gray-800'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-semibold ${isSelected ? role.text : 'text-gray-200'}`}>
                          {role.label}
                        </div>
                        <div className="text-xs text-gray-500 leading-tight mt-0.5">{role.desc}</div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                          isSelected ? `${role.border} ${role.bg}` : 'border-gray-600'
                        }`}
                      >
                        {isSelected && (
                          <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${role.gradient}`} />
                        )}
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              <button
                onClick={() => { if (selectedRole) { setStep('auth'); setError(null) } }}
                disabled={!selectedRole}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-700 disabled:to-gray-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:text-gray-400"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ===== STEP 2: Authentication ===== */}
          {step === 'auth' && (
            <motion.div
              key="auth-step"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.3 }}
            >
              {/* Back + role badge */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => { setStep('role'); setError(null); setAuthMode('signin') }}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change Role
                </button>
                {selectedRoleConfig && (
                  <span className={`text-xs px-3 py-1 rounded-full border font-medium ${selectedRoleConfig.bg} ${selectedRoleConfig.text} ${selectedRoleConfig.border}`}>
                    {selectedRoleConfig.label}
                  </span>
                )}
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </h2>
                <p className="text-gray-400 text-sm">
                  {authMode === 'signin' ? 'Sign in to your existing account' : `Register as ${selectedRoleConfig?.label}`}
                </p>
              </div>

              <div className="bg-gray-900/80 backdrop-blur border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
                {/* Error */}
                {(error || authError) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-300">{error || authError}</p>
                  </motion.div>
                )}

                {/* Google */}
                <button
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed mb-4"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  {loading ? 'Please wait…' : 'Continue with Google'}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-gray-700" />
                  <span className="text-xs text-gray-500">or</span>
                  <div className="flex-1 h-px bg-gray-700" />
                </div>

                {/* Email/Password */}
                <form onSubmit={authMode === 'signup' ? handleEmailSignUp : handleEmailSignIn}>
                  {authMode === 'signup' && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-400 mb-1.5">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Enter your full name" className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors" required />
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="block text-xs text-gray-400 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors" required />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={authMode === 'signup' ? 'Min 6 characters' : 'Enter password'} className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors" required minLength={authMode === 'signup' ? 6 : undefined} />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 shadow-md disabled:cursor-not-allowed">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {authMode === 'signup' ? 'Create Account' : 'Sign In'}
                  </button>
                </form>

                {/* Toggle sign-in / sign-up */}
                <p className="text-center text-xs text-gray-500 mt-4">
                  {authMode === 'signin' ? (
                    <>
                      Don't have an account?{' '}
                      <button onClick={() => { setAuthMode('signup'); setError(null) }} className="text-blue-400 hover:text-blue-300 font-medium underline">Sign Up</button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button onClick={() => { setAuthMode('signin'); setError(null) }} className="text-blue-400 hover:text-blue-300 font-medium underline">Sign In</button>
                    </>
                  )}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-gray-600 mt-6">
          CoastAI — Coastal Erosion Research Platform &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
