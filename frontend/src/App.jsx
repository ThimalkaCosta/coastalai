import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/layout/Layout'
import LandingPage from './pages/LandingPage'
import DataUploadPage from './pages/DataUploadPage'
import AnalysisPage from './pages/AnalysisPage'
import RandomForestPage from './pages/RandomForestPage'
import GMMPage from './pages/GMMPage'
import XGBoostPage from './pages/XGBoostPage'
import ThresholdPage from './pages/ThresholdPage'

function App() {
  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<LandingPage />} />
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
