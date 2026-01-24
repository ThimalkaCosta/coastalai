import { useMemo } from 'react'
import { motion } from 'framer-motion'

const COLORS = {
  erosion: '#fca5a5',
  erosionBorder: '#ef4444',
  stable: '#86efac',
  stableBorder: '#22c55e',
  median: '#f97316',
  whisker: '#64748b',
}

function BoxPlot({ data, label, maxValue, minValue }) {
  if (!data || !data.stable || !data.erosion) return null
  
  const chartHeight = 180
  const range = maxValue - minValue || 1
  
  // Scale function: converts data value to pixel position from bottom
  const scale = (value) => ((value - minValue) / range) * chartHeight

  const renderBoxplot = (stats, color, borderColor, labelText) => {
    if (!stats.min && stats.min !== 0) return null
    
    const boxBottom = scale(stats.q1)
    const boxHeight = scale(stats.q3) - scale(stats.q1)
    const medianPos = scale(stats.median)
    const minPos = scale(stats.min)
    const maxPos = scale(stats.max)
    
    return (
      <div className="flex flex-col items-center" style={{ width: '60px' }}>
        <div className="relative" style={{ height: `${chartHeight}px`, width: '40px' }}>
          {/* Upper whisker line */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: `${scale(stats.q3)}px`,
              height: `${maxPos - scale(stats.q3)}px`,
              width: '1px',
              backgroundColor: COLORS.whisker,
            }}
          />
          {/* Upper whisker cap */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: `${maxPos}px`,
              width: '20px',
              height: '1px',
              backgroundColor: COLORS.whisker,
            }}
          />
          
          {/* Box (IQR) */}
          <div
            className="absolute left-0 right-0"
            style={{
              bottom: `${boxBottom}px`,
              height: `${Math.max(boxHeight, 2)}px`,
              backgroundColor: color,
              border: `2px solid ${borderColor}`,
              borderRadius: '2px',
            }}
          />
          
          {/* Median line */}
          <div
            className="absolute left-0 right-0"
            style={{
              bottom: `${medianPos}px`,
              height: '3px',
              backgroundColor: COLORS.median,
            }}
          />
          
          {/* Lower whisker line */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: `${minPos}px`,
              height: `${boxBottom - minPos}px`,
              width: '1px',
              backgroundColor: COLORS.whisker,
            }}
          />
          {/* Lower whisker cap */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: `${minPos}px`,
              width: '20px',
              height: '1px',
              backgroundColor: COLORS.whisker,
            }}
          />
        </div>
        <span className="text-xs text-coastal-600 mt-2">{labelText}</span>
      </div>
    )
  }

  return (
    <div className="bg-white border border-coastal-200 rounded-lg p-4 shadow-sm">
      <div className="text-center mb-4">
        <span className="text-sm font-semibold text-coastal-900">{label}</span>
      </div>
      
      <div className="flex items-end">
        {/* Y-axis */}
        <div className="flex flex-col justify-between text-xs text-coastal-500 pr-2" style={{ height: `${chartHeight}px` }}>
          <span>{maxValue?.toFixed(2)}</span>
          <span>{((maxValue + minValue) / 2)?.toFixed(2)}</span>
          <span>{minValue?.toFixed(2)}</span>
        </div>
        
        {/* Boxplots container */}
        <div className="flex-1 flex justify-center gap-4 border-l border-b border-coastal-200 pl-2" style={{ height: `${chartHeight + 10}px` }}>
          {renderBoxplot(data.stable, COLORS.stable, COLORS.stableBorder, 'Stable')}
          {renderBoxplot(data.erosion, COLORS.erosion, COLORS.erosionBorder, 'Erosion')}
        </div>
      </div>
    </div>
  )
}

export default function BoxplotComparisonChart({ data, className = '' }) {
  if (!data || data.length === 0) {
    return (
      <div className={`card p-6 ${className}`}>
        <p className="text-coastal-500 text-center">No boxplot data available</p>
      </div>
    )
  }

  // Calculate global min and max for consistent scaling
  const { globalMin, globalMax } = useMemo(() => {
    let min = Infinity
    let max = -Infinity
    
    data.forEach(driver => {
      const stableMin = driver.comparison.find(c => c.category === 'Stable')?.min || 0
      const stableMax = driver.comparison.find(c => c.category === 'Stable')?.max || 0
      const erosionMin = driver.comparison.find(c => c.category === 'Erosion')?.min || 0
      const erosionMax = driver.comparison.find(c => c.category === 'Erosion')?.max || 0
      
      min = Math.min(min, stableMin, erosionMin)
      max = Math.max(max, stableMax, erosionMax)
    })
    
    return { globalMin: min, globalMax: max }
  }, [data])

  // Prepare data for each driver
  const driversData = useMemo(() => {
    return data.map(driver => {
      const stable = driver.comparison.find(c => c.category === 'Stable')
      const erosion = driver.comparison.find(c => c.category === 'Erosion')
      
      return {
        name: driver.name,
        stable: stable || {},
        erosion: erosion || {},
        stableMean: driver.stableMean,
        erosionMean: driver.erosionMean,
        diffPct: driver.diffPct,
      }
    })
  }, [data])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-6 ${className}`}
    >
      <h3 className="font-display font-semibold text-coastal-900 mb-2">
        Environmental Drivers: Erosion vs Stable Years
      </h3>
      <p className="text-sm text-coastal-600 mb-6">
        Box plot comparison showing distribution of environmental drivers between erosion and stable years.
      </p>

      {/* Boxplot Grid - 2x4 layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {driversData.map((driver, idx) => (
          <BoxPlot
            key={idx}
            data={driver}
            label={driver.name}
            maxValue={driver.erosion.max > driver.stable.max ? driver.erosion.max : driver.stable.max}
            minValue={driver.erosion.min < driver.stable.min ? driver.erosion.min : driver.stable.min}
          />
        ))}
      </div>

      {/* Summary Table */}
      <div className="mt-8 overflow-x-auto">
        <h4 className="text-sm font-medium text-coastal-700 mb-3">
          Statistical Comparison: Erosion vs Stable Years
        </h4>
        <table className="w-full text-sm">
          <thead className="bg-coastal-50">
            <tr>
              <th className="px-4 py-2 text-left text-coastal-700 font-semibold">Driver</th>
              <th className="px-4 py-2 text-right text-coastal-700 font-semibold">Erosion</th>
              <th className="px-4 py-2 text-right text-coastal-700 font-semibold">Stable</th>
              <th className="px-4 py-2 text-right text-coastal-700 font-semibold">Diff %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coastal-100">
            {driversData.map((driver, idx) => (
              <tr key={idx} className="hover:bg-coastal-50">
                <td className="px-4 py-2 font-medium text-coastal-900">{driver.name}</td>
                <td className="px-4 py-2 text-right text-red-700 font-medium">{driver.erosionMean?.toFixed(3)}</td>
                <td className="px-4 py-2 text-right text-emerald-700 font-medium">{driver.stableMean?.toFixed(3)}</td>
                <td className={`px-4 py-2 text-right font-semibold ${
                  driver.diffPct > 0 ? 'text-red-700' : 'text-emerald-700'
                }`}>
                  {driver.diffPct > 0 ? '+' : ''}{driver.diffPct?.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
