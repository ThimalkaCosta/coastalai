import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { motion } from 'framer-motion'

const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="font-medium text-coastal-900 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(3) : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function FeatureImportanceChart({ 
  data, 
  title = 'Feature Importance',
  dataKey = 'importance',
  nameKey = 'feature',
  color = '#0ea5e9',
  showGradient = true,
  className = '',
}) {
  const sortedData = [...data].sort((a, b) => b[dataKey] - a[dataKey])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-6 ${className}`}
    >
      <h3 className="font-display font-semibold text-coastal-900 mb-6">{title}</h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
          <XAxis 
            type="number" 
            tickFormatter={(value) => value.toFixed(2)}
            stroke="#94a3b8"
            fontSize={12}
          />
          <YAxis 
            type="category" 
            dataKey={nameKey}
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey={dataKey} 
            radius={[0, 4, 4, 0]}
            barSize={24}
          >
            {sortedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={showGradient ? COLORS[index % COLORS.length] : color}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
