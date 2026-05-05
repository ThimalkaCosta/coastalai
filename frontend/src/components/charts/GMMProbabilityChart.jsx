import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload
    const stateLabels = ['Normal', 'Transitional', 'Erosion']
    
    return (
      <div className="custom-tooltip">
        <p className="font-medium text-coastal-900 mb-2">Year: {label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <p key={index} className="text-sm flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }} 
              />
              {entry.name}: {(entry.value * 100).toFixed(1)}%
            </p>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-coastal-200">
          <p className="text-xs text-coastal-600">
            Current State: <span className="font-medium">{stateLabels[data?.state] || 'Unknown'}</span>
          </p>
        </div>
      </div>
    )
  }
  return null
}

export default function GMMProbabilityChart({
  data,
  title = 'GMM State Probabilities Over Time',
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
        Probability of each environmental state over time. Higher erosion state probability indicates 
        increased erosion risk.
      </p>

      <ResponsiveContainer width="100%" height={350}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="year"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            domain={[0, 1]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: 20 }}
            iconType="circle"
          />
          
          <Area
            type="monotone"
            dataKey="state0Prob"
            name="Normal State"
            stackId="1"
            stroke="#22c55e"
            fill="#22c55e"
            fillOpacity={0.7}
          />
          <Area
            type="monotone"
            dataKey="state1Prob"
            name="Transitional State"
            stackId="1"
            stroke="#f97316"
            fill="#f97316"
            fillOpacity={0.7}
          />
          <Area
            type="monotone"
            dataKey="state2Prob"
            name="Erosion State"
            stackId="1"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.7}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* State Legend with descriptions */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          { 
            name: 'Normal', 
            color: '#22c55e', 
            desc: 'Low energy conditions, minimal erosion risk',
            prob: 'state0Prob'
          },
          { 
            name: 'Transitional', 
            color: '#f97316', 
            desc: 'Elevated forcing, moderate erosion potential',
            prob: 'state1Prob'
          },
          { 
            name: 'Erosion', 
            color: '#ef4444', 
            desc: 'High energy forcing, significant erosion likely',
            prob: 'state2Prob'
          },
        ].map((state) => (
          <div
            key={state.name}
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${state.color}10` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: state.color }}
              />
              <span className="font-medium text-coastal-900">{state.name}</span>
            </div>
            <p className="text-xs text-coastal-600">{state.desc}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
