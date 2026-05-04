import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/layout/Layout'
import MorphLayout from './components/layout/MorphLayout'
import Navbar from './components/layout/Navbar'
import ChatWidget from './components/chat/ChatWidget'
import HomePage from './pages/HomePage'
import LandingPage from './pages/LandingPage'
import AnalysisPage from './pages/AnalysisPage'
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

const HEADER_ONLY_PATHS = new Set(['/'])

function App() {
  const location = useLocation()
  const { currentUser, userRole } = useAuth()

  if (location.pathname === '/login' && currentUser && userRole) {
    return <Navigate to="/" replace />
  }

  const isPublicPage =
    location.pathname === '/login' || location.pathname === '/unauthorized'

  const isHeaderOnlyPage = HEADER_ONLY_PATHS.has(location.pathname)
  const isMorphPage = location.pathname.startsWith('/morphological')

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
            </Routes>
          </AnimatePresence>
        </main>
        <ChatWidget />
      </div>
    )
  }

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
            <Route path="/short-term" element={<ProtectedRoute><ShortTermForecastPage /></ProtectedRoute>} />
            <Route path="/upload" element={<Navigate to="/analysis" replace />} />
            <Route path="/threshold" element={<Navigate to="/analysis" replace />} />
            <Route path="/threshold/shoreline" element={<Navigate to="/analysis" replace />} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Manager', 'Head Office']}><UserManagementPage /></ProtectedRoute>} />
          </Routes>
        </AnimatePresence>
      </Layout>
      <ChatWidget />
    </>
  )
}

export default App
