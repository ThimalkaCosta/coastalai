import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/layout/Layout'
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

function App() {
  const location = useLocation()
  const isStandalonePage = location.pathname === '/' || 
    location.pathname === '/morphological-threshold' ||
    location.pathname === '/hmm-analysis' ||
    location.pathname === '/regime-profiles' ||
    location.pathname === '/seasonal-analysis' ||
    location.pathname === '/long-term-forecasting' ||
    location.pathname === '/short-term-forecasting'

  return isStandalonePage ? (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/morphological-threshold" element={<MorphologicalThresholdPage />} />
        <Route path="/hmm-analysis" element={<HMMAnalysisPage />} />
        <Route path="/regime-profiles" element={<RegimeProfilesPage />} />
        <Route path="/seasonal-analysis" element={<SeasonalAnalysisPage />} />
        <Route path="/long-term-forecasting" element={<LongTermForecastingPage />} />
        <Route path="/short-term-forecasting" element={<ShortTermForecastingPage />} />
      </Routes>
    </AnimatePresence>
  ) : (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/dashboard" element={<LandingPage />} />
          <Route path="/upload" element={<DataUploadPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/threshold" element={<ThresholdPage />} />
          <Route path="/models/random-forest" element={<RandomForestPage />} />
          <Route path="/models/gmm" element={<GMMPage />} />
          <Route path="/models/xgboost" element={<XGBoostPage />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  )
}

export default App
