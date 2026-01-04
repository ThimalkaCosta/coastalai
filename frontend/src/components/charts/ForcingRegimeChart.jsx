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
  PieChart,
  Pie,
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

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="custom-tooltip">
        <p className="font-medium text-coastal-900 mb-1">{data.regime}</p>
        <p className="text-sm text-coastal-600">
          Count: <span className="font-medium">{data.count}</span>
        </p>
        <p className="text-sm text-coastal-600">
          Percentage: <span className="font-medium">{data.percentage}%</span>
        </p>
      </div>
    )
  }
  return null
}

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  if (percent < 0.05) return null

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
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

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div>
          <h4 className="text-sm font-medium text-coastal-700 mb-4 text-center">
            Proportion of Forcing Regimes
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={120}
                innerRadius={60}
                dataKey="count"
                nameKey="regime"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div>
          <h4 className="text-sm font-medium text-coastal-700 mb-4 text-center">
            Year Count by Regime
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} />
              <YAxis
                type="category"
                dataKey="regime"
                stroke="#94a3b8"
                fontSize={10}
                width={100}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        {chartData.map((item) => (
          <div key={item.regime} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-coastal-600">{item.regime}</span>
          </div>
        ))}
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
