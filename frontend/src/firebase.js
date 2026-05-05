import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyBzl7OZREfiDBTPP7RSe2JoOS614Ybc6F0',
  authDomain: 'coastaisrilanka.firebaseapp.com',
  projectId: 'coastaisrilanka',
  storageBucket: 'coastaisrilanka.firebasestorage.app',
  messagingSenderId: '1044326245648',
  appId: '1:1044326245648:web:69ac85950b72d50e13f195',
  measurementId: 'G-M51LXH7LK9',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()

export const analytics = getAnalytics(app)
export default app
