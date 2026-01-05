import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, TrendingUp, TrendingDown, Activity, ChevronRight, Download, Zap, ChevronDown } from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import ShortTermHeader from '../components/layout/ShortTermHeader'
import StatCard from '../components/common/StatCard'

// ============================================
// DEMO DATA - REPLACE WITH BACKEND API CALL
// ============================================
const DEMO_MONSOON_DATA = {
  2025: {
    swMonsoon: {
      name: 'Southwest Monsoon (May - Sep)',
      maxAccretion: 3.2,
      maxErosion: -5.1,
      avgShift: -1.8,
      imageUrl: '/demo-images/2025-sw-monsoon.png', // Replace with actual backend URL
    },
    neMonsoon: {
      name: 'Northeast Monsoon (Oct - Feb)',
      maxAccretion: 4.5,
      maxErosion: -3.8,
      avgShift: 0.7,
      imageUrl: '/demo-images/2025-ne-monsoon.png', // Replace with actual backend URL
    },
    interMonsoon1: {
      name: 'Inter Monsoon 1 (Mar - Apr)',
      maxAccretion: 2.1,
      maxErosion: -2.3,
      avgShift: -0.2,
      imageUrl: '/demo-images/2025-im1-monsoon.png',
    },
  },
  2026: {
    swMonsoon: {
      name: 'Southwest Monsoon (May - Sep)',
      maxAccretion: 3.5,
      maxErosion: -5.4,
      avgShift: -2.0,
      imageUrl: '/demo-images/2026-sw-monsoon.png',
    },
    neMonsoon: {
      name: 'Northeast Monsoon (Oct - Feb)',
      maxAccretion: 4.8,
      maxErosion: -4.1,
      avgShift: 0.5,
      imageUrl: '/demo-images/2026-ne-monsoon.png',
    },
    interMonsoon1: {
      name: 'Inter Monsoon 1 (Mar - Apr)',
      maxAccretion: 2.3,
      maxErosion: -2.5,
      avgShift: -0.3,
      imageUrl: '/demo-images/2026-im1-monsoon.png',
    },
  },
}

const AVAILABLE_YEARS = [2025, 2026, 2027, 2028, 2029, 2030]

// Interpretation helper
const getInterpretation = (avgShift) => {
  if (avgShift < 0) {
    return {
      type: 'erosion',
      description: `Average ${Math.abs(avgShift)}m landward shift (erosion expected)`,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    }
  } else if (avgShift > 0) {
    return {
      type: 'accretion',
      description: `Average ${avgShift}m seaward shift (accretion expected)`,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    }
  } else {
    return {
      type: 'stable',
      description: 'Relatively stable shoreline expected',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    }
  }
}
// ============================================

export default function ShortTermForecastingPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [forecastGenerated, setForecastGenerated] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeMonsoon, setActiveMonsoon] = useState('swMonsoon')
  
  // Calculate date range (1 year from today)
  const today = new Date()
  const minDate = today.toISOString().split('T')[0]
  const maxDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0]
  
  // Extract year from selected date for demo data
  const selectedYear = new Date(selectedDate).getFullYear()

  const handleGenerateForecast = async () => {
    setIsGenerating(true)
    
    // ============================================
    // TODO: Replace with actual backend API call
    // Example:
    // const response = await fetch(`/api/generate-short-term-forecast?year=${selectedYear}`)
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

  // Use demo data or show placeholder for years without data
  const yearData = DEMO_MONSOON_DATA[selectedYear] || {
    swMonsoon: { name: 'Southwest Monsoon (May - Sep)', maxAccretion: 0, maxErosion: 0, avgShift: 0, imageUrl: null },
    neMonsoon: { name: 'Northeast Monsoon (Oct - Feb)', maxAccretion: 0, maxErosion: 0, avgShift: 0, imageUrl: null },
    interMonsoon1: { name: 'Inter Monsoon 1 (Mar - Apr)', maxAccretion: 0, maxErosion: 0, avgShift: 0, imageUrl: null },
  }

  const currentMonsoonData = yearData[activeMonsoon]
  const interpretation = getInterpretation(currentMonsoonData.avgShift)

  return (
    <PageTransition>
      <ShortTermHeader />
      
      {/* Hero Section */}
      <section className="relative text-white overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: 'url(/shorterm.png)',
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
              <Zap className="w-4 h-4" />
              Monsoon-Wise Prediction
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4">
              Short-Term Monsoon Forecasting
            </h1>
            
            <p className="text-lg sm:text-xl text-blue-100 mb-8">
              Predicting shoreline changes during upcoming monsoonal periods with seasonal precision
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-blue-100">Monsoon Periods</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">6Y</div>
                <div className="text-sm text-blue-100">Forecast Range</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl font-bold">Seasonal</div>
                <div className="text-sm text-blue-100">Resolution</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-12">

          {/* Date Selection */}
          <div className="card p-6 mb-6">
            <label className="block text-sm font-medium text-coastal-700 mb-3">
              <Calendar className="inline h-5 w-5 mr-2" />
              Select Forecast Date
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <input
                type="date"
                value={selectedDate}
                min={minDate}
                max={maxDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setForecastGenerated(false)
                }}
                className="px-4 py-3 bg-white border-2 border-amber-300 rounded-xl font-semibold text-coastal-900 shadow-md hover:border-amber-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-300 outline-none cursor-pointer"
              />
              <div className="text-xs text-coastal-600 bg-amber-50 px-3 py-2 rounded-lg">
                <span className="font-semibold">Date Range:</span> {new Date(minDate).toLocaleDateString()} - {new Date(maxDate).toLocaleDateString()} (1 year period)
              </div>
            </div>
          </div>

          {/* Generate Forecast Button */}
          {!forecastGenerated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 mb-6 text-center"
            >
              <Calendar className="h-10 w-10 text-amber-500 mx-auto mb-3" />
              <h2 className="text-xl font-display font-semibold text-coastal-900 mb-2">
                Generate Forecast for {new Date(selectedDate).toLocaleDateString()}
              </h2>
              <p className="text-sm text-coastal-600 mb-4 max-w-2xl mx-auto">
                Click the button below to generate monsoon-wise shoreline forecasts for the selected date.
              </p>
              <button
                onClick={handleGenerateForecast}
                disabled={isGenerating}
                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed bg-amber-500 hover:bg-amber-600"
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
            </motion.div>
          )}

          {/* Forecast Results */}
          {forecastGenerated && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Monsoon Period Tabs */}
              <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setActiveMonsoon('swMonsoon')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      activeMonsoon === 'swMonsoon'
                        ? 'bg-amber-500 text-white shadow-lg'
                        : 'bg-coastal-50 text-coastal-700 hover:bg-amber-100'
                    }`}
                  >
                    Southwest Monsoon
                  </button>
                  <button
                    onClick={() => setActiveMonsoon('neMonsoon')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      activeMonsoon === 'neMonsoon'
                        ? 'bg-amber-500 text-white shadow-lg'
                        : 'bg-coastal-50 text-coastal-700 hover:bg-amber-100'
                    }`}
                  >
                    Northeast Monsoon
                  </button>
                  <button
                    onClick={() => setActiveMonsoon('interMonsoon1')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      activeMonsoon === 'interMonsoon1'
                        ? 'bg-amber-500 text-white shadow-lg'
                        : 'bg-coastal-50 text-coastal-700 hover:bg-amber-100'
                    }`}
                  >
                    Inter Monsoon 1
                  </button>
                </div>
              </div>

              {/* Monsoon Statistics */}
              <div>
                <h3 className="text-lg font-display font-semibold text-coastal-900 mb-3">
                  {currentMonsoonData.name} - {new Date(selectedDate).toLocaleDateString()}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <StatCard
                    icon={TrendingUp}
                    title="Maximum Accretion"
                    value={`+${currentMonsoonData.maxAccretion}m`}
                    subtitle="Seaward shift"
                    trend="up"
                  />
                  <StatCard
                    icon={TrendingDown}
                    title="Maximum Erosion"
                    value={`${currentMonsoonData.maxErosion}m`}
                    subtitle="Landward shift"
                    trend="down"
                  />
                  <StatCard
                    icon={Activity}
                    title="Average Shift"
                    value={`${currentMonsoonData.avgShift}m`}
                    subtitle={interpretation.type}
                    trend={currentMonsoonData.avgShift < 0 ? 'down' : 'up'}
                  />
                </div>
              </div>

              {/* Forecast Visualizations */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card p-4">
                  <h3 className="text-lg font-display font-semibold text-coastal-900 mb-3">
                    Shoreline Forecast Map 1
                  </h3>
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src="/output.png" 
                      alt="Shoreline Forecast Visualization 1"
                      className="w-full h-auto"
                    />
                  </div>
                </div>

                <div className="card p-4">
                  <h3 className="text-lg font-display font-semibold text-coastal-900 mb-3">
                    Shoreline Forecast Map 2
                  </h3>
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src="/output2.png" 
                      alt="Shoreline Forecast Visualization 2"
                      className="w-full h-auto"
                    />
                  </div>
                </div>

                <div className="card p-4">
                  <h3 className="text-lg font-display font-semibold text-coastal-900 mb-3">
                    Shoreline Forecast Map 3
                  </h3>
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src="/output3.png" 
                      alt="Shoreline Forecast Visualization 3"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>

              {/* KML Download Section */}
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Download className="h-5 w-5 text-amber-600" />
                  <h3 className="text-lg font-display font-semibold text-coastal-900">
                    Forecasted Shoreline Change Visualization
                  </h3>
                </div>
                <p className="text-sm text-coastal-600 mb-4">
                  Download the forecasted {new Date(selectedDate).toLocaleDateString()} {currentMonsoonData.name.toLowerCase()} shoreline as a KML file for use in GIS software and mapping applications.
                </p>
                <button
                  onClick={handleDownloadKML}
                  className="btn-primary inline-flex items-center gap-2 text-sm px-4 py-2 bg-amber-500 hover:bg-amber-600"
                >
                  <Download className="h-4 w-4" />
                  Download Forecast KML
                </button>
              </div>

              {/* Forecast Interpretation */}
              <div className={`card p-4 border-l-4 ${
                interpretation.type === 'erosion' ? 'border-red-500' : 
                interpretation.type === 'accretion' ? 'border-emerald-500' : 
                'border-amber-500'
              }`}>
                <h3 className="text-lg font-display font-semibold text-coastal-900 mb-3">
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

                  <div className="bg-amber-50 p-3 rounded-lg mt-3">
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
                        <span className="text-amber-600 font-bold">•</span>
                        <span>The <strong>average shift</strong> represents the mean change across all transects, indicating the overall coastal trend</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Shoreline Change Analysis */}
              <div className="card p-4">
                <h3 className="text-lg font-display font-semibold text-coastal-900 mb-3">
                  Shoreline Change Analysis
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-coastal-200">
                        <th className="text-left py-2 px-3 font-semibold text-coastal-700">Metric</th>
                        <th className="text-left py-2 px-3 font-semibold text-coastal-700">Value</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      <tr className="border-b border-coastal-100">
                        <td className="py-2 px-3 text-coastal-600">Mean Change (degrees)</td>
                        <td className="py-2 px-3 font-mono text-coastal-900">0.00001127</td>
                      </tr>
                      <tr className="border-b border-coastal-100">
                        <td className="py-2 px-3 text-coastal-600">Min Change (degrees)</td>
                        <td className="py-2 px-3 font-mono text-coastal-900">-0.00005332</td>
                      </tr>
                      <tr className="border-b border-coastal-100">
                        <td className="py-2 px-3 text-coastal-600">Max Change (degrees)</td>
                        <td className="py-2 px-3 font-mono text-coastal-900">0.00016540</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-coastal-600">Overall Trend</td>
                        <td className="py-2 px-3 font-semibold text-emerald-600">ACCRETION (Advance)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Storm Analysis */}
              <div className="card p-4 bg-blue-50 border-l-4 border-blue-500">
                <h3 className="text-lg font-display font-semibold text-coastal-900 mb-2">
                  Storm Analysis (Sri Lanka Thresholds)
                </h3>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">No significant storms predicted.</span>
                </div>
              </div>

              {/* Predicted Environmental Conditions */}
              <div className="card p-4">
                <h3 className="text-lg font-display font-semibold text-coastal-900 mb-3">
                  Predicted Environmental Conditions
                </h3>
                <p className="text-xs text-coastal-500 mb-3">Forecast Date: {selectedDate}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Wind Conditions */}
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-coastal-900 mb-2 text-sm">Wind Conditions</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-coastal-600">Gust Max (10m):</span>
                        <span className="font-mono text-coastal-900">8.98 m/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-coastal-600">Gust Max (30d avg):</span>
                        <span className="font-mono text-coastal-900">6.27 m/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-coastal-600">Gust Max (90d avg):</span>
                        <span className="font-mono text-coastal-900">7.08 m/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-coastal-600">Wind Speed Max:</span>
                        <span className="font-mono text-coastal-900">3.06 m/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-coastal-600">Wind Speed Mean:</span>
                        <span className="font-mono text-coastal-900">1.64 m/s</span>
                      </div>
                    </div>
                  </div>

                  {/* Pressure & Wind Components */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-coastal-900 mb-2 text-sm">Pressure & Wind Components</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-coastal-600">MSL Mean:</span>
                        <span className="font-mono text-coastal-900">101027.51 Pa</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-coastal-600">MSL Mean (30d avg):</span>
                        <span className="font-mono text-coastal-900">101099.81 Pa</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-coastal-600">U10 Mean:</span>
                        <span className="font-mono text-coastal-900">0.84 m/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-coastal-600">V10 Mean:</span>
                        <span className="font-mono text-coastal-900">0.61 m/s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monsoon Characteristics */}
              <div className="card p-4 bg-gradient-to-r from-amber-50 to-orange-50">
                <h3 className="text-base font-display font-semibold text-coastal-900 mb-2">
                  Monsoon Impact on Coastal Dynamics
                </h3>
                <div className="text-xs text-coastal-600 space-y-1.5">
                  <p>
                    <strong>Southwest Monsoon (May-Sep):</strong> Typically brings high-energy waves from the southwest, 
                    often resulting in increased erosion along southwest-facing coastlines.
                  </p>
                  <p>
                    <strong>Northeast Monsoon (Oct-Feb):</strong> Characterized by waves from the northeast direction, 
                    which may cause accretion on some beaches and erosion on others depending on coastal orientation.
                  </p>
                  <p>
                    <strong>Inter Monsoon Periods:</strong> Transitional periods with relatively calmer wave conditions, 
                    allowing for beach recovery and sediment redistribution.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
