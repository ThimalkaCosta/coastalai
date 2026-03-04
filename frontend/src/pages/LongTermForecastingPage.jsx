import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, TrendingUp, TrendingDown, Activity, ChevronRight } from 'lucide-react'
import PageTransition from '../components/common/PageTransition'

import StatCard from '../components/common/StatCard'

// ============================================
// DEMO DATA - REPLACE WITH BACKEND API CALL
// ============================================
const DEMO_FORECAST_DATA = {
  maxAccretion: 12.5, // meters - positive value indicates accretion
  maxErosion: -8.3, // meters - negative value indicates erosion
  avgShorelineShift: -2.1, // meters - negative = overall erosion, positive = overall accretion
  forecastYear: 2030,
  lastHistoricalYear: 2024,
  totalTransects: 150,
  accretionTransects: 45,
  erosionTransects: 105,
  kmlFileUrl: '/demo-data/2030-forecast.kml', // Replace with actual backend URL
}

// Interpretation helper
const getInterpretation = (avgShift) => {
  if (avgShift < 0) {
    return {
      type: 'erosion',
      description: `The average shoreline shift is ${Math.abs(avgShift)}m landward, indicating overall coastal erosion.`,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    }
  } else if (avgShift > 0) {
    return {
      type: 'accretion',
      description: `The average shoreline shift is ${avgShift}m seaward, indicating overall coastal accretion.`,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    }
  } else {
    return {
      type: 'stable',
      description: 'The shoreline is predicted to remain relatively stable.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    }
  }
}
// ============================================

export default function LongTermForecastingPage() {
  const [forecastGenerated, setForecastGenerated] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedYear, setSelectedYear] = useState(2030)

  const AVAILABLE_YEARS = [2025, 2026, 2027, 2028, 2029, 2030]

  const interpretation = getInterpretation(DEMO_FORECAST_DATA.avgShorelineShift)

  const handleGenerateForecast = async () => {
    setIsGenerating(true)
    
    // ============================================
    // TODO: Replace with actual backend API call
    // Example:
    // const response = await fetch(`/api/generate-long-term-forecast?year=${selectedYear}`)
    // const data = await response.json()
    // ============================================
    
    // Simulate API call
    setTimeout(() => {
      setForecastGenerated(true)
      setIsGenerating(false)
    }, 2000)
  }

  const handleDownloadKML = () => {
    // ============================================
    // TODO: Replace with actual backend download URL
    // Example:
    // window.open(backendData.kmlFileUrl, '_blank')
    // ============================================
    
    alert('KML download will be connected to backend')
  }

  return (
    <PageTransition>
      {/* Hero Section */}
      <section className="relative text-white overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: 'url(/longterm.png)',
              imageRendering: '-webkit-optimize-contrast',
              filter: 'contrast(1.05) saturate(1.1) brightness(1.0)',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 pt-28 sm:pt-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              <TrendingUp className="w-4 h-4" />
              {selectedYear} Shoreline Prediction
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4">
              Long-Term Shoreline Forecasting
            </h1>
            
            <p className="text-lg sm:text-xl text-blue-100 mb-8">
              Comparing historical shoreline ({DEMO_FORECAST_DATA.lastHistoricalYear}) with forecasted {selectedYear} shoreline using advanced coastal dynamics models
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">{selectedYear}</div>
                <div className="text-sm text-blue-100">Target Year</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">{DEMO_FORECAST_DATA.totalTransects}</div>
                <div className="text-sm text-blue-100">Transects</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">1Y</div>
                <div className="text-sm text-blue-100">Forecast Period</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-12">

          {/* Generate Forecast Section */}
          {!forecastGenerated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 mb-6"
            >
              <div className="text-center mb-6">
                <TrendingUp className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                <h2 className="text-xl font-display font-bold text-coastal-900 mb-2">
                  Generate {selectedYear} Forecast
                </h2>
                <p className="text-sm text-coastal-600 max-w-2xl mx-auto">
                  Select a target year and generate the long-term shoreline forecast using advanced coastal dynamics models.
                </p>
              </div>

              {/* Year Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-coastal-700 mb-3 text-center">
                  Select Target Year
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-w-3xl mx-auto">
                  {AVAILABLE_YEARS.map((year) => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                        selectedYear === year
                          ? 'bg-blue-600 text-white shadow-lg scale-105'
                          : 'bg-coastal-50 text-coastal-700 hover:bg-blue-100'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="text-center">
                <button
                  onClick={handleGenerateForecast}
                  disabled={isGenerating}
                  className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Forecast
                      <ChevronRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Forecast Results */}
          {forecastGenerated && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Key Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <StatCard
                  icon={TrendingUp}
                  title="Maximum Accretion"
                  value={`+${DEMO_FORECAST_DATA.maxAccretion}m`}
                  subtitle="Seaward shift"
                  trend="up"
                />
                <StatCard
                  icon={TrendingDown}
                  title="Maximum Erosion"
                  value={`${DEMO_FORECAST_DATA.maxErosion}m`}
                  subtitle="Landward shift"
                  trend="down"
                />
                <StatCard
                  icon={Activity}
                  title="Average Shift"
                  value={`${DEMO_FORECAST_DATA.avgShorelineShift}m`}
                  subtitle={interpretation.type}
                  trend={DEMO_FORECAST_DATA.avgShorelineShift < 0 ? 'down' : 'up'}
                />
              </div>

              {/* Forecast Images */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-4">
                  <h3 className="text-lg font-display font-bold text-coastal-900 mb-3">
                    Shoreline Change Map
                  </h3>
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src="/image.png" 
                      alt="Shoreline Change Analysis"
                      className="w-full h-auto"
                    />
                  </div>
                </div>

                <div className="card p-4">
                  <h3 className="text-lg font-display font-bold text-coastal-900 mb-3">
                    Forecast Visualization
                  </h3>
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src="/image2.jpeg" 
                      alt="Forecast Visualization"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>

              {/* Download Section */}
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Download className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-display font-bold text-coastal-900">
                    Forecasted Shoreline Change Visualization
                  </h3>
                </div>
                <p className="text-sm text-coastal-600 mb-4">
                  Download the forecasted {selectedYear} shoreline as a KML file for use in GIS software and mapping applications.
                </p>
                <button
                  onClick={handleDownloadKML}
                  className="btn-primary inline-flex items-center gap-2 text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  Download {selectedYear} Forecast KML
                </button>
              </div>

              {/* Interpretation Section */}
              <div className={`card p-4 border-l-4 ${
                interpretation.type === 'erosion' ? 'border-red-500' : 
                interpretation.type === 'accretion' ? 'border-emerald-500' : 
                'border-blue-500'
              }`}>
                <h3 className="text-lg font-display font-bold text-coastal-900 mb-3">
                  Forecast Interpretation
                </h3>
                
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${interpretation.bgColor}`}>
                    <p className={`${interpretation.color} font-medium text-sm mb-1`}>
                      Overall Trend: {interpretation.type.charAt(0).toUpperCase() + interpretation.type.slice(1)}
                    </p>
                    <p className="text-sm text-coastal-700">
                      {interpretation.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div className="bg-emerald-50 p-3 rounded-lg">
                      <p className="text-xs text-coastal-600 mb-1">Accretion Zones</p>
                      <p className="text-xl font-bold text-emerald-600">
                        {DEMO_FORECAST_DATA.accretionTransects}
                      </p>
                      <p className="text-xs text-coastal-500">
                        transects showing seaward movement
                      </p>
                    </div>
                    
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-xs text-coastal-600 mb-1">Erosion Zones</p>
                      <p className="text-xl font-bold text-red-600">
                        {DEMO_FORECAST_DATA.erosionTransects}
                      </p>
                      <p className="text-xs text-coastal-500">
                        transects showing landward movement
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg mt-3">
                    <h4 className="font-semibold text-coastal-900 mb-2 text-sm">Understanding the Values:</h4>
                    <ul className="space-y-1.5 text-xs text-coastal-700">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span><strong>Positive values (+)</strong> indicate accretion - the shoreline is moving seaward (beach is growing)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">•</span>
                        <span><strong>Negative values (-)</strong> indicate erosion - the shoreline is moving landward (beach is retreating)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>The <strong>average shift</strong> represents the mean change across all transects, indicating the overall coastal trend</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Methodology Note */}
              <div className="card p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 ring-1 ring-blue-100/50">
                <h3 className="text-base font-display font-bold text-coastal-900 mb-2">
                  Forecast Methodology
                </h3>
                <p className="text-xs text-coastal-600">
                  This long-term forecast is generated using advanced coastal dynamics models that consider historical shoreline trends, 
                  wave climate patterns, sea level rise projections, and sediment transport dynamics. The model extrapolates current 
                  trends to predict the {DEMO_FORECAST_DATA.forecastYear} shoreline position.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
