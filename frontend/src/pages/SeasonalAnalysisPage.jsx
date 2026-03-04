// thimalka


import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import PageTransition from '../components/common/PageTransition'

// Seasonal alignment data (from notebook: crosstab of Month vs State)
const seasonalData = [
  { month: 'Apr', state0: 8, state1: 2, state2: 5, state3: 3 },
  { month: 'May', state0: 6, state1: 4, state2: 4, state3: 4 },
  { month: 'Jun', state0: 3, state1: 8, state2: 2, state3: 5 },
  { month: 'Jul', state0: 2, state1: 10, state2: 1, state3: 5 },
  { month: 'Aug', state0: 2, state1: 9, state2: 2, state3: 5 },
  { month: 'Sep', state0: 4, state1: 6, state2: 3, state3: 5 },
  { month: 'Oct', state0: 5, state1: 5, state2: 4, state3: 4 },
  { month: 'Nov', state0: 7, state1: 3, state2: 5, state3: 3 },
  { month: 'Dec', state0: 8, state1: 2, state2: 6, state3: 2 },
  { month: 'Jan', state0: 9, state1: 1, state2: 6, state3: 2 },
  { month: 'Feb', state0: 8, state1: 2, state2: 5, state3: 3 },
  { month: 'Mar', state0: 7, state1: 3, state2: 5, state3: 3 },
]

export default function SeasonalAnalysisPage() {
  return (
    <PageTransition>
      {/* Content Section */}
      <div className="min-h-screen bg-gradient-to-br from-coastal-50 via-white to-emerald-50 pt-24 sm:pt-28">
        <div className="max-w-7xl px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-12">
          <div className="space-y-6">
            <div className="card overflow-hidden">
              <div className="p-6 border-b border-coastal-100">
                <h2 className="text-xl font-display font-bold text-coastal-900">
                  Seasonal Alignment Test
                </h2>
                <p className="text-sm text-coastal-500 mt-1">
                  Crosstab of Month vs HMM State - shows which states are dominant in each month
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-coastal-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-coastal-700">Month</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-blue-600">State 0</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-purple-600">State 1</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-amber-600">State 2</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-emerald-600">State 3 (Erosion)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-coastal-100">
                    {seasonalData.map((row, index) => {
                      const max = Math.max(row.state0, row.state1, row.state2, row.state3)
                      return (
                        <tr key={index} className="hover:bg-coastal-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-semibold text-coastal-900">{row.month}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block w-10 py-1 rounded ${
                              row.state0 === max ? 'bg-blue-500 text-white font-bold' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {row.state0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block w-10 py-1 rounded ${
                              row.state1 === max ? 'bg-purple-500 text-white font-bold' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {row.state1}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block w-10 py-1 rounded ${
                              row.state2 === max ? 'bg-amber-500 text-white font-bold' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {row.state2}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block w-10 py-1 rounded ${
                              row.state3 === max ? 'bg-emerald-500 text-white font-bold' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {row.state3}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Seasonal Insights */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="text-lg font-display font-bold text-coastal-900 mb-4">
                  Peak Erosion Months
                </h3>
                <p className="text-sm text-coastal-500 mb-4">
                  Months with highest State 3 (Erosion) occurrence
                </p>
                <div className="space-y-3">
                  {['Jun', 'Jul', 'Aug', 'Sep'].map((month) => {
                    const data = seasonalData.find(s => s.month === month)
                    const percentage = (data.state3 / (data.state0 + data.state1 + data.state2 + data.state3)) * 100
                    return (
                      <div key={month} className="flex items-center gap-3">
                        <span className="w-12 text-sm font-medium text-coastal-900">{month}</span>
                        <div className="flex-1 h-4 bg-coastal-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-coastal-700">{percentage.toFixed(0)}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="card p-6">
                <h3 className="text-lg font-display font-bold text-coastal-900 mb-4">
                  Monsoon Impact
                </h3>
                <p className="text-sm text-coastal-500 mb-4">
                  Southwest monsoon (Jun-Sep) shows elevated erosion risk
                </p>
                <div className="p-5 bg-amber-50/80 rounded-xl border border-amber-200/60 ring-1 ring-amber-100/50">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-amber-800">High Risk Period</div>
                      <div className="text-sm text-amber-700 mt-1">
                        June through September shows significantly higher erosion state transitions. 
                        Monitor environmental variables closely during this period.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
