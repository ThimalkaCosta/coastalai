import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ZAxis,
  ReferenceLine,
} from 'recharts'
import { motion } from 'framer-motion'

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="custom-tooltip">
        <p className="font-medium text-coastal-900 mb-2">Year: {data.year}</p>
        {Object.entries(data).map(([key, value]) => {
          if (key === 'year' || key === 'fill') return null
          return (
            <p key={key} className="text-sm text-coastal-600">
              {key}: {typeof value === 'number' ? value.toFixed(3) : value}
            </p>
          )
        })}
      </div>
    )
  }
  return null
}

export default function ThresholdScatterChart({
  data,
  title = 'Threshold Visualization',
  xDataKey = 'x',
  yDataKey = 'y',
  xLabel,
  yLabel,
  xThreshold,
  yThreshold,
  threshold, // Alias for xThreshold
  colorKey,
  className = '',
}) {
  // Use threshold as alias for xThreshold if provided
  const effectiveXThreshold = xThreshold || threshold
  
  // Add color to data points based on erosion label (support multiple key formats)
  const coloredData = data.map((item) => {
    const erosionValue = item[colorKey] ?? item.erosionLabel ?? item.Erosion_Label ?? item.state ?? 0
    return {
      ...item,
      fill: erosionValue === 1 || erosionValue > 0 ? '#ef4444' : '#22c55e',
    }
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-6 ${className}`}
    >
      <h3 className="font-display font-semibold text-coastal-900 mb-2">{title}</h3>
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-coastal-600">Erosion</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-coastal-600">Stable</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            dataKey={xDataKey}
            name={xLabel || xDataKey}
            stroke="#94a3b8"
            fontSize={12}
            label={{ value: xLabel || xDataKey, position: 'bottom', offset: 0 }}
          />
          <YAxis
            type="number"
            dataKey={yDataKey}
            name={yLabel || yDataKey}
            stroke="#94a3b8"
            fontSize={12}
            label={{ value: yLabel || yDataKey, angle: -90, position: 'insideLeft' }}
          />
          <ZAxis range={[100, 100]} />
          <Tooltip content={<CustomTooltip />} />

          {effectiveXThreshold && (
            <ReferenceLine
              x={effectiveXThreshold}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{
                value: `Threshold: ${effectiveXThreshold}`,
                position: 'top',
                fill: '#ef4444',
                fontSize: 11,
              }}
            />
          )}

          {yThreshold && (
            <ReferenceLine
              y={yThreshold}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{
                value: `${yDataKey} ≥ ${yThreshold}`,
                position: 'right',
                fill: '#ef4444',
                fontSize: 11,
              }}
            />
          )}

          <Scatter
            name="Years"
            data={coloredData}
            fill="#8884d8"
            shape="circle"
          >
            {coloredData.map((entry, index) => (
              <circle key={index} fill={entry.fill} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
