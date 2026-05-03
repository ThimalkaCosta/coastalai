import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveContainer } from 'recharts'

const CORRELATION_COLORS = [
  { threshold: -1.0, color: '#1e40af' },
  { threshold: -0.75, color: '#2563eb' },
  { threshold: -0.5, color: '#3b82f6' },
  { threshold: -0.25, color: '#93c5fd' },
  { threshold: 0, color: '#f5f5f5' },
  { threshold: 0.25, color: '#fca5a5' },
  { threshold: 0.5, color: '#ef4444' },
  { threshold: 0.75, color: '#dc2626' },
  { threshold: 1.0, color: '#991b1b' },
]

function getCorrelationColor(value) {
  if (value === 1) return '#991b1b'
  if (value === -1) return '#1e40af'
  
  for (let i = CORRELATION_COLORS.length - 1; i >= 0; i--) {
    if (value >= CORRELATION_COLORS[i].threshold) {
      return CORRELATION_COLORS[i].color
    }
  }
  return '#f5f5f5'
}

function getTextColor(value) {
  return Math.abs(value) > 0.5 ? '#ffffff' : '#1f2937'
}

export default function CorrelationMatrixChart({
  data,
  title = 'Correlation Matrix',
  className = '',
}) {
  const { features, matrix } = useMemo(() => {
    if (!data) return { features: [], matrix: [] }
    
    const features = Object.keys(data)
    const matrix = features.map(row => 
      features.map(col => data[row]?.[col] ?? 0)
    )
    
    return { features, matrix }
  }, [data])

  const featureLabels = {
    'Hm0_max': 'Wave Height (max)',
    'Hm0_mean': 'Wave Height (mean)',
    'CumWaveEnergy': 'Cum. Wave Energy',
    'StormDays_wave': 'Storm Days',
    'WindMax': 'Wind Speed (max)',
    'WindMean': 'Wind Speed (mean)',
    'WindStressMean': 'Wind Stress',
    'UcurrMax': 'Current (max)',
    'UcurrMean': 'Current (mean)',
    'CumCurrent': 'Cum. Current',
    'Erosion_Label': 'Erosion'
  }

  const cellSize = 48
  const labelWidth = 120
  const totalWidth = labelWidth + features.length * cellSize + 80

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-6 ${className}`}
    >
      <h3 className="font-display font-semibold text-coastal-900 mb-2">{title}</h3>
      <p className="text-sm text-coastal-600 mb-6">
        Correlation coefficients between environmental drivers and erosion. Values range from -1 (negative correlation) to +1 (positive correlation).
      </p>

      <div className="overflow-x-auto">
        <div className="min-w-fit">
          {/* Header Row */}
          <div className="flex items-end mb-2" style={{ marginLeft: labelWidth }}>
            {features.map((feature, i) => (
              <div
                key={feature}
                className="text-xs text-coastal-600 font-medium transform -rotate-45 origin-bottom-left"
                style={{ 
                  width: cellSize,
                  height: 80,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                }}
              >
                <span className="truncate max-w-[100px]">
                  {featureLabels[feature] || feature}
                </span>
              </div>
            ))}
          </div>

          {/* Matrix Rows */}
          {features.map((rowFeature, rowIndex) => (
            <div key={rowFeature} className="flex items-center">
              {/* Row Label */}
              <div 
                className="text-xs text-coastal-700 font-medium text-right pr-3 truncate"
                style={{ width: labelWidth }}
              >
                {featureLabels[rowFeature] || rowFeature}
              </div>
              
              {/* Cells */}
              {features.map((colFeature, colIndex) => {
                const value = matrix[rowIndex][colIndex]
                const isLowerTriangle = rowIndex > colIndex
                const isDiagonal = rowIndex === colIndex
                
                return (
                  <motion.div
                    key={`${rowFeature}-${colFeature}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (rowIndex * features.length + colIndex) * 0.01 }}
                    className="relative group cursor-pointer"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: isLowerTriangle || isDiagonal 
                        ? getCorrelationColor(value) 
                        : 'transparent',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    {(isLowerTriangle || isDiagonal) && (
                      <>
                        <span
                          className="absolute inset-0 flex items-center justify-center text-xs font-medium"
                          style={{ color: getTextColor(value) }}
                        >
                          {value.toFixed(2)}
                        </span>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-coastal-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          <div className="font-medium">{featureLabels[rowFeature] || rowFeature}</div>
                          <div className="text-coastal-300">vs {featureLabels[colFeature] || colFeature}</div>
                          <div className="mt-1 font-bold">r = {value.toFixed(3)}</div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="text-xs text-coastal-600">-1.0</span>
          <div className="flex">
            {CORRELATION_COLORS.map((item, i) => (
              <div
                key={i}
                className="w-8 h-4"
                style={{ backgroundColor: item.color }}
              />
            ))}
          </div>
          <span className="text-xs text-coastal-600">+1.0</span>
        </div>
        <div className="text-center text-xs text-coastal-500 mt-1">
          Correlation Coefficient
        </div>
      </div>
    </motion.div>
  )
}
