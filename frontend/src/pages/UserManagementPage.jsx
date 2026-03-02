import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import {
  Users,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'

const ROLE_COLORS = {
  Officer: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Manager: 'bg-green-500/10 text-green-400 border-green-500/30',
  'Head Office': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
}

/**
 * Returns allowed roles the current admin can assign based on their own role:
 * - Head Office: can assign Officer, Manager, Head Office
 * - Manager: can only assign Officer
 */
function getAllowableRoles(adminRole) {
  if (adminRole === 'Head Office') return ['Officer', 'Manager', 'Head Office']
  if (adminRole === 'Manager') return ['Officer']
  return []
}

/**
 * Can the admin manage (assign role / delete) a target user?
 * - Head Office: can manage everyone
 * - Manager: can only manage Officers and pending users
 */
function canManageUser(adminRole, targetUser) {
  if (adminRole === 'Head Office') return true
  if (adminRole === 'Manager') {
    // Can manage pending users and Officers only
    return !targetUser.role || targetUser.role === 'Officer'
  }
  return false
}

export default function UserManagementPage() {
  const { userRole, currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [message, setMessage] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // uid to confirm delete

  const allowableRoles = getAllowableRoles(userRole)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'users'))
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const assignRole = async (uid, role) => {
    setUpdating(uid)
    try {
      await updateDoc(doc(db, 'users', uid), {
        role,
        status: 'active',
        updatedAt: serverTimestamp(),
      })
      setUsers((prev) =>
        prev.map((u) => (u.id === uid ? { ...u, role, status: 'active' } : u))
      )
      showMessage('success', `Role assigned: ${role}`)
    } catch (err) {
      showMessage('error', 'Failed to assign role.')
    } finally {
      setUpdating(null)
    }
  }

  const removeUser = async (uid) => {
    setUpdating(uid)
    try {
      await deleteDoc(doc(db, 'users', uid))
      setUsers((prev) => prev.filter((u) => u.id !== uid))
      showMessage('success', 'User removed successfully.')
    } catch (err) {
      showMessage('error', 'Failed to remove user.')
    } finally {
      setUpdating(null)
      setDeleteConfirm(null)
    }
  }

  // Filter users that the current admin can see / manage
  const visibleUsers = users.filter((u) => u.id !== currentUser?.uid) // exclude self
  const pendingUsers = visibleUsers.filter((u) => !u.role || u.status === 'pending')
  const activeUsers = visibleUsers.filter((u) => u.role && u.status === 'active')

  const subtitle =
    userRole === 'Head Office'
      ? 'Manage all users — assign roles, approve & delete'
      : 'Manage Officer users — approve & manage Officers'

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">User Management</h1>
              <p className="text-sm text-gray-400">{subtitle}</p>
            </div>
            <div className="ml-auto">
              <span className={`text-xs px-3 py-1 rounded-full border font-medium ${ROLE_COLORS[userRole] || ''}`}>
                {userRole}
              </span>
            </div>
          </div>

          {/* Message */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-center gap-2 p-3 rounded-lg mb-6 text-sm ${
                  message.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}
              >
                {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {deleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full mx-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Delete User</h3>
                      <p className="text-xs text-gray-400">This action cannot be undone.</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-5">
                    Are you sure you want to remove{' '}
                    <span className="text-white font-medium">
                      {users.find((u) => u.id === deleteConfirm)?.email || 'this user'}
                    </span>
                    ?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => removeUser(deleteConfirm)}
                      className="flex-1 px-4 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pending Users */}
          {pendingUsers.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-yellow-400" />
                <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider">
                  Pending Approval ({pendingUsers.length})
                </h2>
              </div>
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    adminRole={userRole}
                    allowableRoles={allowableRoles}
                    onAssign={assignRole}
                    onDelete={(uid) => setDeleteConfirm(uid)}
                    updating={updating === user.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Active Users */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Active Users ({activeUsers.length})
              </h2>
            </div>
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading users…</div>
            ) : activeUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No active users yet.</div>
            ) : (
              <div className="space-y-3">
                {activeUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    adminRole={userRole}
                    allowableRoles={allowableRoles}
                    onAssign={assignRole}
                    onDelete={(uid) => setDeleteConfirm(uid)}
                    updating={updating === user.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

function UserRow({ user, adminRole, allowableRoles, onAssign, onDelete, updating }) {
  const [open, setOpen] = useState(false)
  const manageable = canManageUser(adminRole, user)

  return (
    <div className="bg-gray-900 border border-gray-700/50 rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full" />
        ) : (
          <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center text-sm font-semibold text-gray-300">
            {(user.displayName || user.email || '?')[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-sm font-medium text-white truncate">
            {user.displayName || 'Unknown'}
          </div>
          <div className="text-xs text-gray-400 truncate">{user.email}</div>
          {user.requestedRole && !user.role && (
            <div className="text-xs text-gray-500 mt-0.5">
              Requested: <span className="text-gray-300">{user.requestedRole}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Current role badge */}
        {user.role ? (
          <span
            className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
              ROLE_COLORS[user.role] || 'bg-gray-500/10 text-gray-400 border-gray-500/30'
            }`}
          >
            {user.role}
          </span>
        ) : (
          <span className="text-xs px-2.5 py-1 rounded-full border bg-yellow-500/10 text-yellow-400 border-yellow-500/30 font-medium">
            Pending
          </span>
        )}

        {manageable && (
          <>
            {/* Role selector */}
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                disabled={updating}
                className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {updating ? 'Saving…' : 'Assign Role'}
                <ChevronDown className="w-3 h-3" />
              </button>
              {open && (
                <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-10 min-w-[140px] overflow-hidden">
                  {allowableRoles.map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        onAssign(user.id, role)
                        setOpen(false)
                      }}
                      className="w-full text-left text-xs px-4 py-2.5 hover:bg-gray-700 text-gray-200 transition-colors"
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Delete */}
            <button
              onClick={() => onDelete(user.id)}
              disabled={updating}
              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
              title="Remove user"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {!manageable && (
          <span className="text-xs text-gray-600 italic">No access</span>
        )}
      </div>
    </div>
  )
}
