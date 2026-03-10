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
  Officer: 'bg-blue-50 text-blue-600 border-blue-200 ring-1 ring-blue-100',
  Manager: 'bg-emerald-50 text-emerald-600 border-emerald-200 ring-1 ring-emerald-100',
  'Head Office': 'bg-violet-50 text-violet-600 border-violet-200 ring-1 ring-violet-100',
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
      <div className="min-h-screen bg-gradient-to-b from-coastal-50 to-white bg-mesh-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center ring-1 ring-violet-200/50">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-coastal-900">User Management</h1>
              <p className="text-sm text-coastal-500">{subtitle}</p>
            </div>
            <div className="ml-auto">
              <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${ROLE_COLORS[userRole] || ''}`}>
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
                className={`flex items-center gap-2 p-3 rounded-xl mb-6 text-sm ${
                  message.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 ring-1 ring-emerald-100'
                    : 'bg-red-50 border border-red-200 text-red-700 ring-1 ring-red-100'
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
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-white border border-red-200 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-elevation-3"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center ring-1 ring-red-100">
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-coastal-900">Delete User</h3>
                      <p className="text-xs text-coastal-500">This action cannot be undone.</p>
                    </div>
                  </div>
                  <p className="text-sm text-coastal-600 mb-5">
                    Are you sure you want to remove{' '}
                    <span className="text-coastal-900 font-medium">
                      {users.find((u) => u.id === deleteConfirm)?.email || 'this user'}
                    </span>
                    ?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 px-4 py-2 text-sm bg-coastal-100 hover:bg-coastal-200 text-coastal-700 rounded-xl transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => removeUser(deleteConfirm)}
                      className="flex-1 px-4 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl transition-colors font-medium"
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
                <Clock className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wider">
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
              <Shield className="w-4 h-4 text-coastal-500" />
              <h2 className="text-sm font-semibold text-coastal-600 uppercase tracking-wider">
                Active Users ({activeUsers.length})
              </h2>
            </div>
            {loading ? (
              <div className="text-center py-12 text-coastal-400">Loading users…</div>
            ) : activeUsers.length === 0 ? (
              <div className="text-center py-12 text-coastal-400">No active users yet.</div>
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
    <div className="card p-4 flex items-center justify-between gap-4 hover:shadow-card-hover transition-all duration-300">
      <div className="flex items-center gap-3 min-w-0">
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full ring-2 ring-coastal-100" />
        ) : (
          <div className="w-9 h-9 bg-gradient-to-br from-ocean-100 to-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-ocean-700">
            {(user.displayName || user.email || '?')[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-sm font-semibold text-coastal-900 truncate">
            {user.displayName || 'Unknown'}
          </div>
          <div className="text-xs text-coastal-500 truncate">{user.email}</div>
          {user.requestedRole && !user.role && (
            <div className="text-xs text-coastal-400 mt-0.5">
              Requested: <span className="text-coastal-700 font-medium">{user.requestedRole}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Current role badge */}
        {user.role ? (
          <span
            className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
              ROLE_COLORS[user.role] || 'bg-coastal-50 text-coastal-500 border-coastal-200'
            }`}
          >
            {user.role}
          </span>
        ) : (
          <span className="text-xs px-2.5 py-1 rounded-full border bg-amber-50 text-amber-600 border-amber-200 ring-1 ring-amber-100 font-semibold">
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
                className="flex items-center gap-1 text-xs bg-coastal-50 hover:bg-coastal-100 border border-coastal-200 text-coastal-700 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 font-medium"
              >
                {updating ? 'Saving…' : 'Assign Role'}
                <ChevronDown className="w-3 h-3" />
              </button>
              {open && (
                <div className="absolute right-0 mt-1 bg-white border border-coastal-200 rounded-xl shadow-elevation-2 z-10 min-w-[140px] overflow-hidden">
                  {allowableRoles.map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        onAssign(user.id, role)
                        setOpen(false)
                      }}
                      className="w-full text-left text-xs px-4 py-2.5 hover:bg-coastal-50 text-coastal-700 transition-colors font-medium"
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
              className="p-1.5 text-coastal-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Remove user"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {!manageable && (
          <span className="text-xs text-coastal-400 italic">No access</span>
        )}
      </div>
    </div>
  )
}
