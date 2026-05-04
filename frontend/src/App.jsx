import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/layout/Layout'
import MorphLayout from './components/layout/MorphLayout'
import LTLayout from './components/layout/LTLayout'
import Navbar from './components/layout/Navbar'
import ChatWidget from './components/chat/ChatWidget'
import HomePage from './pages/HomePage'
import LandingPage from './pages/LandingPage'
import AnalysisPage from './pages/AnalysisPage'
import RandomForestPage from './pages/RandomForestPage'
import HMMPage from './pages/HMMPage'
import XGBoostPage from './pages/XGBoostPage'
import ThresholdPage from './pages/ThresholdPage'
import ForecastThresholdPage from './pages/ForecastThresholdPage'
import HMMAnalysisPage from './pages/HMMAnalysisPage'
import RegimeProfilesPage from './pages/RegimeProfilesPage'
import SeasonalAnalysisPage from './pages/SeasonalAnalysisPage'
import LongTermForecastPage from './pages/LongTermForecastPage'
import LoginPage from './pages/LoginPage'
import UserManagementPage from './pages/UserManagementPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import ShortTermForecastPage from './pages/ShortTermForecastPage'
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

/* Paths that only show the top header (no sidebar) */
const HEADER_ONLY_PATHS = [
  '/',
  '/hmm-analysis',
  '/regime-profiles',
  '/seasonal-analysis',
]

function App() {
  const location = useLocation()
  const { currentUser, userRole } = useAuth()

  if (location.pathname === '/login' && currentUser && userRole) {
    return <Navigate to="/" replace />
  }

  const isPublicPage =
    location.pathname === '/login' || location.pathname === '/unauthorized'

  const isHeaderOnlyPage = HEADER_ONLY_PATHS.includes(location.pathname)
  const isMorphPage = location.pathname.startsWith('/morphological')
  const isLTPage = location.pathname.startsWith('/long-term')

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

  if (isHeaderOnlyPage) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/hmm-analysis" element={<ProtectedRoute><HMMAnalysisPage /></ProtectedRoute>} />
              <Route path="/regime-profiles" element={<ProtectedRoute><RegimeProfilesPage /></ProtectedRoute>} />
              <Route path="/seasonal-analysis" element={<ProtectedRoute><SeasonalAnalysisPage /></ProtectedRoute>} />
            </Routes>
          </AnimatePresence>
        </main>
        <ChatWidget />
      </div>
    )
  }

  /* ── Long-Term Forecasting pages (navbar + LT sidebar) ── */
  if (isLTPage) {
    const pathParts = location.pathname.split('/')
    let ltTab = pathParts[2] || 'overview'
    if (!['overview', 'visualizations', 'segments', 'downloads', 'coastal'].includes(ltTab)) {
      ltTab = 'overview'
    }

    return (
      <>
        <LTLayout>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/long-term" element={<ProtectedRoute><LongTermForecastPage activeTab={ltTab} /></ProtectedRoute>} />
              <Route path="/long-term/*" element={<ProtectedRoute><LongTermForecastPage activeTab={ltTab} /></ProtectedRoute>} />
            </Routes>
          </AnimatePresence>
        </LTLayout>
        <ChatWidget />
      </>
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

  return (
    <>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/dashboard" element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
            <Route path="/analysis" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
            <Route path="/threshold" element={<ProtectedRoute><ThresholdPage /></ProtectedRoute>} />
            <Route path="/short-term" element={<ProtectedRoute><ShortTermForecastPage /></ProtectedRoute>} />
            <Route path="/models/random-forest" element={<ProtectedRoute><RandomForestPage /></ProtectedRoute>} />
            <Route path="/models/hmm" element={<ProtectedRoute><HMMPage /></ProtectedRoute>} />
            <Route path="/models/xgboost" element={<ProtectedRoute><XGBoostPage /></ProtectedRoute>} />
            <Route path="/forecast-thresholds" element={<ProtectedRoute><ForecastThresholdPage /></ProtectedRoute>} />
            <Route path="/upload" element={<Navigate to="/analysis" replace />} />
            <Route path="/threshold/shoreline" element={<Navigate to="/threshold" replace />} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Manager', 'Head Office']}><UserManagementPage /></ProtectedRoute>} />
          </Routes>
        </AnimatePresence>
      </Layout>
      <ChatWidget />
    </>
  )
}

export default App
