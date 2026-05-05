import { useMemo } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ZAxis,
} from 'recharts'
import { motion } from 'framer-motion'

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="custom-tooltip">
        <p className="font-medium text-coastal-900 mb-2">Year: {data.monsoon_year}</p>
        <p className="text-sm">
          PC1: <span className="font-medium">{data.PC1.toFixed(2)}</span>
        </p>
        <p className="text-sm">
          PC2: <span className="font-medium">{data.PC2.toFixed(2)}</span>
        </p>
        <p className="text-sm mt-1">
          Status: <span className={`font-medium ${data.Erosion_Label === 1 ? 'text-red-600' : 'text-green-600'}`}>
            {data.Erosion_Label === 1 ? 'Erosion' : 'Stable'}
          </span>
        </p>
      </div>
    )
  }
  return null
}

const CustomDot = (props) => {
  const { cx, cy, payload } = props
  const isErosion = payload.Erosion_Label === 1
  
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={8}
        fill={isErosion ? '#ef4444' : '#22c55e'}
        stroke="#ffffff"
        strokeWidth={2}
        opacity={0.8}
      />
      <text
        x={cx}
        y={cy + 18}
        textAnchor="middle"
        fontSize={9}
        fill="#64748b"
      >
        {payload.monsoon_year?.toString().slice(-2)}
      </text>
    </g>
  )
}

export default function PCAChart({
  data,
  variance,
  title = 'PCA Analysis',
  className = '',
}) {
  const { erosionData, stableData } = useMemo(() => {
    if (!data?.length) return { erosionData: [], stableData: [] }
    
    return {
      erosionData: data.filter(d => d.Erosion_Label === 1),
      stableData: data.filter(d => d.Erosion_Label === 0),
    }
  }, [data])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-6 ${className}`}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* PCA Scatter Plot */}
        <div className="flex-1">
          <h3 className="font-display font-semibold text-coastal-900 mb-2">{title}</h3>
          <p className="text-sm text-coastal-600 mb-4">
            Principal Component Analysis showing erosion vs stable years in reduced dimensional space.
          </p>

          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                dataKey="PC1"
                name="PC1"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                label={{
                  value: `PC1 (${variance?.pc1 || '--'}%)`,
                  position: 'bottom',
                  offset: 0,
                  fontSize: 12,
                  fill: '#64748b',
                }}
              />
              <YAxis
                type="number"
                dataKey="PC2"
                name="PC2"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                label={{
                  value: `PC2 (${variance?.pc2 || '--'}%)`,
                  angle: -90,
                  position: 'insideLeft',
                  fontSize: 12,
                  fill: '#64748b',
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
              
              <Scatter
                name="Stable Years"
                data={stableData}
                shape={<CustomDot />}
              />
              <Scatter
                name="Erosion Years"
                data={erosionData}
                shape={<CustomDot />}
              />
            </ScatterChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span className="text-sm text-coastal-600">Stable Years</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-sm text-coastal-600">Erosion Years</span>
            </div>
          </div>
        </div>

        {/* Variance Explained */}
        <div className="lg:w-64">
          <h4 className="font-medium text-coastal-900 mb-4">Variance Explained</h4>
          
          <div className="space-y-4">
            {[
              { label: 'PC1', value: variance?.pc1 || 0, color: '#3b82f6' },
              { label: 'PC2', value: variance?.pc2 || 0, color: '#f97316' },
              { label: 'PC3', value: variance?.pc3 || 0, color: '#22c55e' },
            ].map((pc) => (
              <div key={pc.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-coastal-700">{pc.label}</span>
                  <span className="font-medium text-coastal-900">{pc.value}%</span>
                </div>
                <div className="h-3 bg-coastal-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pc.value}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: pc.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-coastal-50 rounded-xl">
            <div className="text-sm text-coastal-600">Total Variance</div>
            <div className="text-2xl font-bold text-coastal-900">
              {variance?.total || '--'}%
            </div>
            <div className="text-xs text-coastal-500 mt-1">
              Explained by PC1-PC3
            </div>
          </div>

          {/* Interpretation */}
          <div className="mt-4 p-4 bg-blue-50 rounded-xl">
            <h5 className="text-sm font-medium text-blue-900 mb-2">Interpretation</h5>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• PC1: Overall forcing intensity</li>
              <li>• PC2: Wind vs Wave dominance</li>
              <li>• PC3: Current contribution</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
