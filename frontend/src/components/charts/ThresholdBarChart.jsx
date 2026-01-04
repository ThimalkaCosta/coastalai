import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { motion } from 'framer-motion'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="font-medium text-coastal-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: {entry.value.toFixed(2)} {entry.payload?.unit || ''}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function ThresholdBarChart({
  data,
  title = 'Threshold Comparison Across Years',
  threshold,
  thresholdLabel,
  dataKey = 'value',
  xDataKey = 'year',
  unit = '',
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-6 ${className}`}
    >
      <h3 className="font-display font-semibold text-coastal-900 mb-2">{title}</h3>
      <p className="text-sm text-coastal-600 mb-6">
        Values by year with erosion threshold reference line. Red bars indicate years above threshold (erosion years).
      </p>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey={xDataKey}
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            label={{
              value: unit,
              angle: -90,
              position: 'insideLeft',
              fontSize: 12,
              fill: '#64748b',
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {threshold && (
            <ReferenceLine
              y={threshold}
              stroke="#ef4444"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: thresholdLabel || `Threshold: ${threshold}`,
                position: 'right',
                fill: '#ef4444',
                fontSize: 11,
              }}
            />
          )}

          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} barSize={20}>
            {data?.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry[dataKey] >= threshold ? '#ef4444' : '#22c55e'}
                opacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500 opacity-80" />
          <span className="text-sm text-coastal-600">Below Threshold (Stable)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500 opacity-80" />
          <span className="text-sm text-coastal-600">Above Threshold (Erosion)</span>
        </div>
      </div>
    </motion.div>
  )
}
