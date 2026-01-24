import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'

const REGIME_COLORS = {
  'Low-Energy': '#22c55e',
  'Wind-Dominated': '#3b82f6',
  'Wave-Dominated': '#f97316',
  'Wave-Wind-Current Combined': '#ef4444',
  'Wave-Current Combined': '#8b5cf6',
  'Wind-Current Combined': '#06b6d4',
  'Current-Dominated': '#ec4899',
}

const ErosionTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="font-medium text-coastal-900 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-medium">{entry.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function ForcingRegimeChart({
  data,
  title = 'Forcing Regime Distribution',
  className = '',
}) {
  const chartData = data?.map(item => ({
    ...item,
    color: REGIME_COLORS[item.regime] || '#94a3b8',
  })) || []

  // Prepare erosion breakdown data for stacked bar chart
  const erosionBreakdownData = chartData.map(item => {
    const erosionCount = Math.round((item.erosionRate / 100) * item.count)
    const stableCount = item.count - erosionCount
    return {
      regime: item.regime,
      Stable: stableCount,
      Erosion: erosionCount,
      total: item.count,
    }
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-6 ${className}`}
    >
      <h3 className="font-display font-semibold text-coastal-900 mb-2">{title}</h3>
      <p className="text-sm text-coastal-600 mb-6">
        Classification of monsoon years by dominant environmental forcing mechanism.
      </p>

      {/* Erosion by Forcing Regime - Stacked Bar Chart */}
      <div>
        <h4 className="text-sm font-medium text-coastal-700 mb-4 text-center">
          Erosion by Forcing Regime
        </h4>
        <p className="text-xs text-coastal-500 mb-4 text-center">
          Distribution of stable vs erosion years within each forcing regime
        </p>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={erosionBreakdownData}
            margin={{ top: 10, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="regime" 
              stroke="#94a3b8" 
              fontSize={10}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12}
              label={{ value: 'Count', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#94a3b8' }}
            />
            <Tooltip content={<ErosionTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: 10 }}
              iconType="rect"
            />
            <Bar 
              dataKey="Stable" 
              stackId="a" 
              fill="#86efac" 
              name="Stable"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="Erosion" 
              stackId="a" 
              fill="#fca5a5" 
              name="Erosion"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {chartData.slice(0, 4).map((item) => (
          <motion.div
            key={item.regime}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl text-center"
            style={{ backgroundColor: `${item.color}15` }}
          >
            <div className="text-2xl font-bold" style={{ color: item.color }}>
              {item.count}
            </div>
            <div className="text-xs text-coastal-600 mt-1 truncate">
              {item.regime}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
