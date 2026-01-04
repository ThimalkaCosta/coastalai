import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { motion } from 'framer-motion'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="font-medium text-coastal-900 mb-2">Year: {label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(3) : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function TimeSeriesChart({
  data,
  title = 'Time Series',
  lines = [],
  xDataKey = 'year',
  threshold,
  thresholdLabel,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-6 ${className}`}
    >
      <h3 className="font-display font-semibold text-coastal-900 mb-6">{title}</h3>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey={xDataKey} 
            stroke="#94a3b8" 
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: 20 }}
            iconType="circle"
          />
          
          {threshold && (
            <ReferenceLine 
              y={threshold} 
              stroke="#ef4444" 
              strokeDasharray="5 5"
              label={{ 
                value: thresholdLabel || `Threshold: ${threshold}`, 
                position: 'right',
                fill: '#ef4444',
                fontSize: 12,
              }}
            />
          )}

          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name || line.dataKey}
              stroke={line.color || `hsl(${index * 60}, 70%, 50%)`}
              strokeWidth={2}
              dot={{ r: 4, fill: line.color || `hsl(${index * 60}, 70%, 50%)` }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
