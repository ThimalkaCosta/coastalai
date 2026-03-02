import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'

// Role definitions
export const ROLES = {
  OFFICER: 'Officer',
  MANAGER: 'Manager',
  HEAD_OFFICE: 'Head Office',
}

// Role permissions — all roles get full app features; differs only in user management
export const ROLE_PERMISSIONS = {
  [ROLES.OFFICER]: {
    canUpload: true,
    canViewAnalysis: true,
    canViewForecasting: true,
    canManageUsers: false,
    canManageOfficers: false,
    canManageAll: false,
    label: 'Officer',
    color: 'blue',
    description: 'Full app access — upload, update & operational tasks',
  },
  [ROLES.MANAGER]: {
    canUpload: true,
    canViewAnalysis: true,
    canViewForecasting: true,
    canManageUsers: true,
    canManageOfficers: true,
    canManageAll: false,
    label: 'Manager',
    color: 'green',
    description: 'Full access + approve & manage Officers',
  },
  [ROLES.HEAD_OFFICE]: {
    canUpload: true,
    canViewAnalysis: true,
    canViewForecasting: true,
    canManageUsers: true,
    canManageOfficers: true,
    canManageAll: true,
    label: 'Head Office',
    color: 'purple',
    description: 'Full access + manage all users & roles',
  },
}

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  // Fetch user role from Firestore
  const fetchUserRole = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        setUserRole(data.role || null)
        setUserProfile(data)
        return data
      }
      return null
    } catch (err) {
      console.error('Error fetching user role:', err)
      return null
    }
  }

  // Create or update user document in Firestore
  const upsertUserDoc = async (user, selectedRole) => {
    const userDocRef = doc(db, 'users', user.uid)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      // New user — create with requested role, pending approval
      const profile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || null,
        requestedRole: selectedRole,
        role: null,
        status: 'pending',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      }
      await setDoc(userDocRef, profile)
      setUserRole(null)
      setUserProfile(profile)
    } else {
      // Existing user — update last login
      await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true })
      const data = userDoc.data()
      setUserRole(data.role || null)
      setUserProfile(data)
    }
  }

  // Google Sign-In (with selected role)
  const signInWithGoogle = async (selectedRole) => {
    setAuthError(null)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      await upsertUserDoc(result.user, selectedRole)
      return result.user
    } catch (err) {
      setAuthError(err.message)
      throw err
    }
  }

  // Email/Password Sign-Up (with selected role)
  const signUpWithEmail = async (email, password, displayName, selectedRole) => {
    setAuthError(null)
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName })
      await upsertUserDoc(result.user, selectedRole)
      return result.user
    } catch (err) {
      setAuthError(err.message)
      throw err
    }
  }

  // Email/Password Sign-In
  const signInWithEmail = async (email, password) => {
    setAuthError(null)
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const userDocRef = doc(db, 'users', result.user.uid)
      const userDoc = await getDoc(userDocRef)
      if (userDoc.exists()) {
        await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true })
        const data = userDoc.data()
        setUserRole(data.role || null)
        setUserProfile(data)
      }
      return result.user
    } catch (err) {
      setAuthError(err.message)
      throw err
    }
  }

  // Sign Out
  const logout = async () => {
    await signOut(auth)
    setUserRole(null)
    setUserProfile(null)
  }

  // Permission check helper
  const hasPermission = (permission) => {
    if (!userRole || !ROLE_PERMISSIONS[userRole]) return false
    return ROLE_PERMISSIONS[userRole][permission] === true
  }

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        await fetchUserRole(user.uid)
      } else {
        setUserRole(null)
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userRole,
    userProfile,
    loading,
    authError,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    logout,
    hasPermission,
    fetchUserRole,
    ROLES,
    ROLE_PERMISSIONS,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
