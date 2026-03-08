import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="custom-tooltip">
        <p className="font-medium text-coastal-900 mb-1">{data.feature}</p>
        <p className="text-sm text-coastal-600">
          Mean |SHAP|: <span className="font-medium">{data.shap.toFixed(3)}</span>
        </p>
        <p className="text-sm text-coastal-600">
          Direction: <span className={`font-medium ${data.direction === 'positive' ? 'text-red-600' : 'text-blue-600'}`}>
            {data.direction === 'positive' ? '↑ Increases risk' : '↓ Decreases risk'}
          </span>
        </p>
        <p className="text-xs text-coastal-500 mt-2">{data.impact}</p>
      </div>
    )
  }
  return null
}

export default function SHAPChart({
  data,
  title = 'SHAP Feature Contributions',
  className = '',
}) {
  const sortedData = [...(data || [])].sort((a, b) => b.shap - a.shap)
  const maxShap = Math.max(...(sortedData.map(d => d.shap) || [1]))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-6 ${className}`}
    >
      <h3 className="font-display font-semibold text-coastal-900 mb-2">{title}</h3>
      <p className="text-sm text-coastal-600 mb-6">
        SHAP (SHapley Additive exPlanations) values show how each feature contributes to model predictions.
        Higher values indicate stronger influence on erosion prediction.
      </p>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(v) => v.toFixed(2)}
              />
              <YAxis
                type="category"
                dataKey="feature"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="shap" radius={[0, 4, 4, 0]} barSize={24}>
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.direction === 'positive' ? '#f97316' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Feature Cards */}
        <div className="space-y-3">
          <h4 className="font-medium text-coastal-900 mb-3">Feature Impact Details</h4>
          {sortedData.slice(0, 6).map((item, index) => (
            <motion.div
              key={item.feature}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 rounded-xl border border-coastal-200 hover:border-coastal-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-coastal-900">{item.feature}</span>
                    {item.direction === 'positive' ? (
                      <ArrowUpRight className="w-4 h-4 text-red-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <p className="text-xs text-coastal-500">{item.impact}</p>
                </div>
                <div className="text-right">
                  <div 
                    className="text-lg font-bold"
                    style={{ color: item.direction === 'positive' ? '#f97316' : '#3b82f6' }}
                  >
                    {item.shap.toFixed(3)}
                  </div>
                  <div className="text-xs text-coastal-500">SHAP</div>
                </div>
              </div>
              
              {/* Impact bar */}
              <div className="mt-2 h-1.5 bg-coastal-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.shap / maxShap) * 100}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.direction === 'positive' ? '#f97316' : '#3b82f6' }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Interpretation */}
      <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
        <h4 className="text-sm font-medium text-amber-900 mb-2">Understanding SHAP Values</h4>
        <div className="grid md:grid-cols-2 gap-4 text-xs text-amber-700">
          <div>
            <p className="font-medium mb-1">What SHAP measures:</p>
            <ul className="space-y-1">
              <li>• Average contribution to prediction output</li>
              <li>• Direction of feature influence (positive/negative)</li>
              <li>• Relative importance across all predictions</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Key insights:</p>
            <ul className="space-y-1">
              <li>• Hm0_max has the largest impact on predictions</li>
              <li>• Current features (UcurrMax, UcurrMean) are highly influential</li>
              <li>• All top features push towards erosion when elevated</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
