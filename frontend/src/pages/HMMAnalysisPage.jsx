// thimalka

import { motion } from 'framer-motion'
import PageTransition from '../components/common/PageTransition'
import MorphoHeader from '../components/layout/MorphoHeader'

// HMM Transition matrix
const transitionMatrix = [
  { from: 'S0', S0: 0.72, S1: 0.08, S2: 0.12, S3: 0.08 },
  { from: 'S1', S0: 0.05, S1: 0.78, S2: 0.05, S3: 0.12 },
  { from: 'S2', S0: 0.15, S1: 0.05, S2: 0.70, S3: 0.10 },
  { from: 'S3', S0: 0.10, S1: 0.15, S2: 0.08, S3: 0.67 },
]

// Regime stability data
const regimeStability = {
  count: 18,
  mean: 3.2,
  std: 1.8,
  min: 0,
  q25: 2,
  q50: 3,
  q75: 4,
  max: 8
}

export default function HMMAnalysisPage() {
  return (
    <PageTransition>
      <MorphoHeader />

      {/* Content Section */}
      <div className="min-h-screen bg-gradient-to-br from-coastal-50 via-white to-emerald-50 pt-24 sm:pt-28">
        <div className="max-w-7xl px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-12">
          <div className="space-y-6">
            {/* Transition Matrix */}
            <div className="card overflow-hidden">
              <div className="p-6 border-b border-coastal-100">
                <h2 className="text-xl font-display font-semibold text-coastal-900">
                  HMM Transition Matrix
                </h2>
                <p className="text-sm text-coastal-500 mt-1">
                  Probability of transitioning between hidden states
                </p>
              </div>
              <div className="overflow-x-auto p-6">
                <table className="w-full max-w-2xl">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-sm font-semibold text-coastal-700"></th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-coastal-700">S0</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-coastal-700">S1</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-coastal-700">S2</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-emerald-600">S3 (Erosion)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transitionMatrix.map((row, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-semibold text-coastal-700">{row.from}</td>
                        {['S0', 'S1', 'S2', 'S3'].map((col) => (
                          <td key={col} className="px-4 py-3 text-center">
                            <span 
                              className={`inline-block px-3 py-1 rounded-lg font-mono text-sm ${
                                row[col] > 0.5 
                                  ? 'bg-emerald-100 text-emerald-700 font-semibold' 
                                  : row[col] > 0.1 
                                    ? 'bg-coastal-100 text-coastal-700'
                                    : 'bg-coastal-50 text-coastal-400'
                              }`}
                            >
                              {row[col].toFixed(2)}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Regime Stability */}
            <div className="card p-6">
              <h2 className="text-xl font-display font-semibold text-coastal-900 mb-4">
                Regime Stability Check
              </h2>
              <p className="text-sm text-coastal-500 mb-6">
                Number of state switches per cycle (lower = more stable)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-coastal-50 rounded-xl">
                  <div className="text-sm text-coastal-500">Mean Switches</div>
                  <div className="text-2xl font-bold text-coastal-900">{regimeStability.mean}</div>
                </div>
                <div className="p-4 bg-coastal-50 rounded-xl">
                  <div className="text-sm text-coastal-500">Std Dev</div>
                  <div className="text-2xl font-bold text-coastal-900">{regimeStability.std}</div>
                </div>
                <div className="p-4 bg-coastal-50 rounded-xl">
                  <div className="text-sm text-coastal-500">Min</div>
                  <div className="text-2xl font-bold text-coastal-900">{regimeStability.min}</div>
                </div>
                <div className="p-4 bg-coastal-50 rounded-xl">
                  <div className="text-sm text-coastal-500">Max</div>
                  <div className="text-2xl font-bold text-coastal-900">{regimeStability.max}</div>
                </div>
              </div>
            </div>

            {/* Final State Dominance */}
            <div className="card p-6">
              <h2 className="text-xl font-display font-semibold text-coastal-900 mb-4">
                Final-State Dominance Test
              </h2>
              <p className="text-sm text-coastal-500 mb-6">
                Distribution of final states in erosion-labeled cycles
              </p>
              <div className="flex gap-4">
                {[
                  { state: 'State 0', value: 0.12, color: 'bg-blue-500' },
                  { state: 'State 1', value: 0.18, color: 'bg-purple-500' },
                  { state: 'State 2', value: 0.15, color: 'bg-amber-500' },
                  { state: 'State 3', value: 0.55, color: 'bg-emerald-500' },
                ].map((item) => (
                  <div key={item.state} className="flex-1">
                    <div className="text-sm text-coastal-600 mb-2">{item.state}</div>
                    <div className="h-32 bg-coastal-100 rounded-lg relative overflow-hidden">
                      <div 
                        className={`absolute bottom-0 left-0 right-0 ${item.color} rounded-lg transition-all`}
                        style={{ height: `${item.value * 100}%` }}
                      />
                    </div>
                    <div className="text-lg font-bold text-coastal-900 mt-2">
                      {(item.value * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
