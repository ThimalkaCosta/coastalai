import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { motion } from 'framer-motion'

const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6']

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="custom-tooltip">
        <p className="font-medium text-coastal-900">{data.name}</p>
        <p className="text-sm text-coastal-600">
          Count: {data.value} years
        </p>
        <p className="text-sm text-coastal-600">
          {data.percentage?.toFixed(1) || (payload[0].percent * 100).toFixed(1)}%
        </p>
      </div>
    )
  }
  return null
}

export default function StateDistributionChart({
  data,
  title = 'State Distribution',
  dataKey = 'count',
  nameKey = 'state',
  className = '',
}) {
  // Transform data if needed - support both formats
  const chartData = data?.map(item => ({
    name: item.state || item.name,
    value: item.count || item.value || 0,
    percentage: item.percentage || 0,
    color: item.color,
  })) || []

  if (chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`card p-6 ${className}`}
      >
        <h3 className="font-display font-semibold text-coastal-900 mb-6">{title}</h3>
        <div className="h-[300px] flex items-center justify-center text-coastal-500">
          No state distribution data available
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-6 ${className}`}
    >
      <h3 className="font-display font-semibold text-coastal-900 mb-6">{title}</h3>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
            nameKey="name"
            label={({ name, value, percentage }) => `${name}: ${percentage?.toFixed(0) || value}%`}
            labelLine={true}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            iconType="circle"
            wrapperStyle={{ paddingTop: 20 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
