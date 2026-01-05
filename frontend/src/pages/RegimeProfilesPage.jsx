// thimalka

import { motion } from 'framer-motion'
import PageTransition from '../components/common/PageTransition'
import MorphoHeader from '../components/layout/MorphoHeader'

// HMM State means (from notebook: state_means DataFrame)
const stateMeansData = [
  { 
    state: 'State_0', 
    meridionalWind: -0.45, 
    precipitation: 0.00008, 
    humidity: 75.2, 
    sst: 28.1, 
    soilMoisture: 0.28,
    soilWater: 0.24,
    temp2m: 298.5,
    airTemp: 25.8,
    zonalWind: 1.85
  },
  { 
    state: 'State_1', 
    meridionalWind: -1.12, 
    precipitation: 0.00018, 
    humidity: 85.6, 
    sst: 29.8, 
    soilMoisture: 0.42,
    soilWater: 0.38,
    temp2m: 301.2,
    airTemp: 28.2,
    zonalWind: 3.45
  },
  { 
    state: 'State_2', 
    meridionalWind: 0.35, 
    precipitation: 0.00005, 
    humidity: 68.4, 
    sst: 27.2, 
    soilMoisture: 0.22,
    soilWater: 0.18,
    temp2m: 297.8,
    airTemp: 24.5,
    zonalWind: 0.95
  },
  { 
    state: 'State_3', 
    meridionalWind: -0.85, 
    precipitation: 0.00015, 
    humidity: 82.3, 
    sst: 29.5, 
    soilMoisture: 0.38,
    soilWater: 0.34,
    temp2m: 300.5,
    airTemp: 27.5,
    zonalWind: 3.12
  },
]

export default function RegimeProfilesPage() {
  return (
    <PageTransition>
      <MorphoHeader />

      {/* Content Section */}
      <div className="min-h-screen bg-gradient-to-br from-coastal-50 via-white to-emerald-50 pt-24 sm:pt-28">
        <div className="max-w-7xl px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-12">
          <div className="space-y-6">
            <div className="card overflow-hidden">
              <div className="p-6 border-b border-coastal-100">
                <h2 className="text-xl font-display font-semibold text-coastal-900">
                  Regime-wise Variable Profiles
                </h2>
                <p className="text-sm text-coastal-500 mt-1">
                  Mean values of environmental variables for each HMM state
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-coastal-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-coastal-700">State</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-coastal-700">Meridional Wind</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-coastal-700">Precipitation</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-coastal-700">Humidity</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-coastal-700">SST</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-coastal-700">Soil Moisture</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-coastal-700">Zonal Wind</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-coastal-100">
                    {stateMeansData.map((row, index) => (
                      <tr 
                        key={index} 
                        className={`hover:bg-coastal-50 transition-colors ${
                          row.state === 'State_3' ? 'bg-emerald-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-coastal-900">
                          <span className={`inline-flex items-center gap-2 ${
                            row.state === 'State_3' ? 'text-emerald-700' : ''
                          }`}>
                            {row.state}
                            {row.state === 'State_3' && (
                              <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
                                Erosion
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-coastal-700">
                          {row.meridionalWind.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-coastal-700">
                          {row.precipitation.toFixed(5)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-coastal-700">
                          {row.humidity.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-coastal-700">
                          {row.sst.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-coastal-700">
                          {row.soilMoisture.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-coastal-700">
                          {row.zonalWind.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* State Characteristics */}
            <div className="grid md:grid-cols-2 gap-6">
              {stateMeansData.map((state, index) => (
                <div 
                  key={index}
                  className={`card p-6 ${state.state === 'State_3' ? 'ring-2 ring-emerald-500' : ''}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-display font-semibold text-coastal-900">
                      {state.state}
                    </h3>
                    {state.state === 'State_3' && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
                        Erosion Dominant
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-coastal-500">Temperature</span>
                      <span className="text-sm font-medium text-coastal-900">{state.airTemp}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-coastal-500">Humidity</span>
                      <span className="text-sm font-medium text-coastal-900">{state.humidity}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-coastal-500">SST</span>
                      <span className="text-sm font-medium text-coastal-900">{state.sst}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-coastal-500">Wind (Zonal)</span>
                      <span className="text-sm font-medium text-coastal-900">{state.zonalWind} m/s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
