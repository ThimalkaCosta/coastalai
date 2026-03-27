import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/layout/Layout'
import MorphLayout from './components/layout/MorphLayout'
import Navbar from './components/layout/Navbar'
import ChatWidget from './components/chat/ChatWidget'
import HomePage from './pages/HomePage'
import LandingPage from './pages/LandingPage'
import DataUploadPage from './pages/DataUploadPage'
import AnalysisPage from './pages/AnalysisPage'
import RandomForestPage from './pages/RandomForestPage'
import ThresholdPage from './pages/ThresholdPage'
import DecisionSupportPage from './pages/DecisionSupportPage'
import ForecastOverviewPage from './pages/ForecastOverviewPage'
import RetreatVulnerabilityPage from './pages/RetreatVulnerabilityPage'
import HindcastValidationPage from './pages/HindcastValidationPage'
import HMMAnalysisPage from './pages/HMMAnalysisPage'
import RegimeProfilesPage from './pages/RegimeProfilesPage'
import SeasonalAnalysisPage from './pages/SeasonalAnalysisPage'
import LoginPage from './pages/LoginPage'
import UserManagementPage from './pages/UserManagementPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import ShortTermForecastPage from './pages/ShortTermForecastPage'
import LongTermForecastPage from './pages/LongTermForecastPage'
import MorphLandingPage from './pages/morphological/MorphLandingPage'
import MorphOverviewPage from './pages/morphological/MorphOverviewPage'
import MorphErosionPage from './pages/morphological/MorphErosionPage'
import MorphVulnerabilityPage from './pages/morphological/MorphVulnerabilityPage'
import MorphShorelinePage from './pages/morphological/MorphShorelinePage'
import MorphRiskPage from './pages/morphological/MorphRiskPage'
import MorphRunPage from './pages/morphological/MorphRunPage'
import { MorphDataProvider } from './context/MorphDataContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { useAuth } from './context/AuthContext'

/* Pages that only show the top header (no sidebar) */
const HEADER_ONLY_PATHS = [
  '/',
  '/hmm-analysis',
  '/regime-profiles',
  '/seasonal-analysis',
  '/short-term',
  '/long-term',
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
  const isMorphPage = location.pathname.startsWith('/morphological')

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
                path="/short-term"
                element={
                  <ProtectedRoute>
                    <ShortTermForecastPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/long-term"
                element={
                  <ProtectedRoute>
                    <LongTermForecastPage />
                  </ProtectedRoute>
                }
              />

            </Routes>
          </AnimatePresence>
        </main>
        <ChatWidget />
      </div>
    )
  }

  /* ── Morphological pages (navbar + morph sidebar) ── */
  if (isMorphPage) {
    return (
      <>
        <MorphLayout>
          <MorphDataProvider>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/morphological" element={<ProtectedRoute><MorphLandingPage /></ProtectedRoute>} />
                <Route path="/morphological/overview" element={<ProtectedRoute><MorphOverviewPage /></ProtectedRoute>} />
                <Route path="/morphological/erosion" element={<ProtectedRoute><MorphErosionPage /></ProtectedRoute>} />
                <Route path="/morphological/vulnerability" element={<ProtectedRoute><MorphVulnerabilityPage /></ProtectedRoute>} />
                <Route path="/morphological/shoreline" element={<ProtectedRoute><MorphShorelinePage /></ProtectedRoute>} />
                <Route path="/morphological/risk" element={<ProtectedRoute><MorphRiskPage /></ProtectedRoute>} />
                <Route path="/morphological/run" element={<ProtectedRoute><MorphRunPage /></ProtectedRoute>} />
              </Routes>
            </AnimatePresence>
          </MorphDataProvider>
        </MorphLayout>
        <ChatWidget />
      </>
    )
  }

  /* ── Full-layout pages (navbar + sidebar) ── */
  return (
    <>
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
              path="/decision-support"
              element={
                <ProtectedRoute>
                  <DecisionSupportPage />
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
              path="/forecast"
              element={
                <ProtectedRoute>
                  <ForecastOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forecast/retreat"
              element={
                <ProtectedRoute>
                  <RetreatVulnerabilityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forecast/hindcast"
              element={
                <ProtectedRoute>
                  <HindcastValidationPage />
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
      <ChatWidget />
    </>
  )
}

export default App
