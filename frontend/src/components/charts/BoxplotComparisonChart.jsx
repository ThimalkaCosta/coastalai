import { useMemo } from 'react'
import { motion } from 'framer-motion'

const COLORS = {
  erosion: '#ef4444',
  stable: '#22c55e',
  median: '#3b82f6',
  whisker: '#94a3b8',
}

function BoxPlot({ data, label, unit, maxValue }) {
  if (!data) return null
  
  const scale = (value) => ((value - 0) / maxValue) * 100

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-coastal-700">{label}</span>
        <span className="text-xs text-coastal-500">{unit}</span>
      </div>
      
      <div className="relative h-16">
        {/* Background scale */}
        <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-px bg-coastal-200" />
        
        {/* Erosion Boxplot */}
        <div className="absolute top-1 left-0 right-0 h-6">
          {/* Whisker line */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 h-px"
            style={{
              left: `${scale(data.erosion.min)}%`,
              width: `${scale(data.erosion.max) - scale(data.erosion.min)}%`,
              backgroundColor: COLORS.erosion,
            }}
          />
          {/* Min whisker */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 w-px h-3"
            style={{
              left: `${scale(data.erosion.min)}%`,
              backgroundColor: COLORS.erosion,
            }}
          />
          {/* Max whisker */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 w-px h-3"
            style={{
              left: `${scale(data.erosion.max)}%`,
              backgroundColor: COLORS.erosion,
            }}
          />
          {/* Box */}
          <div
            className="absolute top-0 h-full rounded opacity-60"
            style={{
              left: `${scale(data.erosion.q1)}%`,
              width: `${scale(data.erosion.q3) - scale(data.erosion.q1)}%`,
              backgroundColor: COLORS.erosion,
            }}
          />
          {/* Median line */}
          <div
            className="absolute top-0 h-full w-0.5"
            style={{
              left: `${scale(data.erosion.median)}%`,
              backgroundColor: '#991b1b',
            }}
          />
        </div>

        {/* Stable Boxplot */}
        <div className="absolute bottom-1 left-0 right-0 h-6">
          {/* Whisker line */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 h-px"
            style={{
              left: `${scale(data.stable.min)}%`,
              width: `${scale(data.stable.max) - scale(data.stable.min)}%`,
              backgroundColor: COLORS.stable,
            }}
          />
          {/* Min whisker */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 w-px h-3"
            style={{
              left: `${scale(data.stable.min)}%`,
              backgroundColor: COLORS.stable,
            }}
          />
          {/* Max whisker */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 w-px h-3"
            style={{
              left: `${scale(data.stable.max)}%`,
              backgroundColor: COLORS.stable,
            }}
          />
          {/* Box */}
          <div
            className="absolute top-0 h-full rounded opacity-60"
            style={{
              left: `${scale(data.stable.q1)}%`,
              width: `${scale(data.stable.q3) - scale(data.stable.q1)}%`,
              backgroundColor: COLORS.stable,
            }}
          />
          {/* Median line */}
          <div
            className="absolute top-0 h-full w-0.5"
            style={{
              left: `${scale(data.stable.median)}%`,
              backgroundColor: '#166534',
            }}
          />
        </div>
      </div>

      {/* Values */}
      <div className="flex justify-between text-xs mt-1">
        <span className="text-coastal-500">0</span>
        <div className="flex gap-4">
          <span className="text-red-600">
            Erosion: {data.erosion.median.toFixed(2)}
          </span>
          <span className="text-green-600">
            Stable: {data.stable.median.toFixed(2)}
          </span>
        </div>
        <span className="text-coastal-500">{maxValue}</span>
      </div>
    </div>
  )
}

export default function BoxplotComparisonChart({
  data,
  title = 'Erosion vs Stable Years Comparison',
  className = '',
}) {
  const boxplotConfigs = useMemo(() => {
    if (!data) return []
    
    return [
      { 
        key: 'Hm0_max', 
        label: 'Maximum Wave Height (Hm0_max)', 
        unit: 'm',
        maxValue: 4,
      },
      { 
        key: 'UcurrMax', 
        label: 'Maximum Current Speed (UcurrMax)', 
        unit: 'm/s',
        maxValue: 0.8,
      },
      { 
        key: 'WindMax', 
        label: 'Maximum Wind Speed (WindMax)', 
        unit: 'm/s',
        maxValue: 8,
      },
      { 
        key: 'CumWaveEnergy', 
        label: 'Cumulative Wave Energy', 
        unit: 'J/m²',
        maxValue: 70000,
      },
      { 
        key: 'StormDays_wave', 
        label: 'Storm Days', 
        unit: 'days',
        maxValue: 220,
      },
    ]
  }, [data])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-6 ${className}`}
    >
      <h3 className="font-display font-semibold text-coastal-900 mb-2">{title}</h3>
      <p className="text-sm text-coastal-600 mb-4">
        Statistical comparison of environmental drivers between erosion and stable years. 
        Boxes show interquartile range (Q1-Q3), lines show median, whiskers show min-max.
      </p>

      {/* Legend */}
      <div className="flex justify-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 rounded bg-red-500 opacity-60" />
          <span className="text-sm text-coastal-600">Erosion Years</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 rounded bg-green-500 opacity-60" />
          <span className="text-sm text-coastal-600">Stable Years</span>
        </div>
      </div>

      <div className="space-y-2">
        {boxplotConfigs.map((config) => (
          <BoxPlot
            key={config.key}
            data={data ? { erosion: data.erosion[config.key], stable: data.stable[config.key] } : null}
            label={config.label}
            unit={config.unit}
            maxValue={config.maxValue}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-amber-50 rounded-xl">
        <h4 className="text-sm font-medium text-amber-900 mb-2">Key Observations</h4>
        <ul className="text-xs text-amber-700 space-y-1">
          <li>• Erosion years show consistently higher values across all drivers</li>
          <li>• Wave height (Hm0_max) shows clear separation between states</li>
          <li>• Current speed (UcurrMax) is a strong discriminating factor</li>
          <li>• Storm days significantly higher during erosion periods</li>
        </ul>
      </div>
    </motion.div>
  )
}
