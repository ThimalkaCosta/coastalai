import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/layout/Layout'
import Navbar from './components/layout/Navbar'
import HomePage from './pages/HomePage'
import LandingPage from './pages/LandingPage'
import DataUploadPage from './pages/DataUploadPage'
import AnalysisPage from './pages/AnalysisPage'
import RandomForestPage from './pages/RandomForestPage'
import GMMPage from './pages/GMMPage'
import XGBoostPage from './pages/XGBoostPage'
import ThresholdPage from './pages/ThresholdPage'
import MorphologicalThresholdPage from './pages/MorphologicalThresholdPage'
import HMMAnalysisPage from './pages/HMMAnalysisPage'
import RegimeProfilesPage from './pages/RegimeProfilesPage'
import SeasonalAnalysisPage from './pages/SeasonalAnalysisPage'
import LongTermForecastingPage from './pages/LongTermForecastingPage'
import ShortTermForecastingPage from './pages/ShortTermForecastingPage'
import LoginPage from './pages/LoginPage'
import UserManagementPage from './pages/UserManagementPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { useAuth } from './context/AuthContext'

/* Pages that only show the top header (no sidebar) */
const HEADER_ONLY_PATHS = [
  '/',
  '/morphological-threshold',
  '/hmm-analysis',
  '/regime-profiles',
  '/seasonal-analysis',
  '/long-term-forecasting',
  '/short-term-forecasting',
]

function App() {
  const location = useLocation()
  const { currentUser, userRole } = useAuth()

  // Redirect authenticated users away from /login
  if (location.pathname === '/login' && currentUser && userRole) {
    return <Navigate to="/" replace />
  }

  const isPublicPage =
    location.pathname === '/login' || location.pathname === '/unauthorized'

  const isHeaderOnlyPage = HEADER_ONLY_PATHS.includes(location.pathname)

  /* ── Public pages (no navbar, no sidebar) ── */
  if (isPublicPage) {
    return (
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Routes>
      </AnimatePresence>
    )
  }

  /* ── Header-only pages (navbar at top, no sidebar) ── */
  if (isHeaderOnlyPage) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/morphological-threshold"
                element={
                  <ProtectedRoute>
                    <MorphologicalThresholdPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hmm-analysis"
                element={
                  <ProtectedRoute>
                    <HMMAnalysisPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/regime-profiles"
                element={
                  <ProtectedRoute>
                    <RegimeProfilesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seasonal-analysis"
                element={
                  <ProtectedRoute>
                    <SeasonalAnalysisPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/long-term-forecasting"
                element={
                  <ProtectedRoute>
                    <LongTermForecastingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/short-term-forecasting"
                element={
                  <ProtectedRoute>
                    <ShortTermForecastingPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    )
  }

  /* ── Full-layout pages (navbar + sidebar) ── */
  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <LandingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <DataUploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analysis"
            element={
              <ProtectedRoute>
                <AnalysisPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/threshold"
            element={
              <ProtectedRoute>
                <ThresholdPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/models/random-forest"
            element={
              <ProtectedRoute>
                <RandomForestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/models/gmm"
            element={
              <ProtectedRoute>
                <GMMPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/models/xgboost"
            element={
              <ProtectedRoute>
                <XGBoostPage />
              </ProtectedRoute>
            }
          />
          {/* Manager + Head Office */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['Manager', 'Head Office']}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AnimatePresence>
    </Layout>
  )
}

export default App
