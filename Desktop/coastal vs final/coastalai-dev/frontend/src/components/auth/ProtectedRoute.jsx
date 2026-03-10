import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Loader2 } from 'lucide-react'

/**
 * ProtectedRoute — wraps routes that require authentication.
 * @param {string[]} allowedRoles  If provided, only those roles can access the route.
 * @param {string}   permission    If provided, checks a specific permission flag.
 */
export default function ProtectedRoute({ children, allowedRoles, permission }) {
  const { currentUser, userRole, userProfile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  // Not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Authenticated but no role yet (pending approval)
  if (!userRole) {
    return <Navigate to="/login" replace />
  }

  // Role-based restriction
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
