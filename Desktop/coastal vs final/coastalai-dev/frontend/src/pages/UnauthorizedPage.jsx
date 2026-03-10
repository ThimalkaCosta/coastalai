import { motion } from 'framer-motion'
import { ShieldOff, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function UnauthorizedPage() {
  const { userRole, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldOff className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-gray-400 text-sm mb-2">
          Your role (<span className="text-red-400">{userRole}</span>) does not have permission to access this page.
        </p>
        <p className="text-gray-500 text-xs mb-6">
          Contact your administrator if you believe this is an error.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </motion.div>
    </div>
  )
}
