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
  Area,
  AreaChart,
} from 'recharts'
import { motion } from 'framer-motion'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="font-medium text-coastal-900 mb-2">
          False Positive Rate: {(label * 100).toFixed(1)}%
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: {(entry.value * 100).toFixed(1)}%
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function ROCCurveChart({
  data,
  title = 'ROC Curve Comparison',
  className = '',
}) {
  // Combine ROC data for all models
  const chartData = []
  
  if (data?.gmm?.fpr && data?.rf?.fpr && data?.xgb?.fpr) {
    const maxLength = Math.max(
      data.gmm.fpr.length,
      data.rf.fpr.length,
      data.xgb.fpr.length
    )
    
    for (let i = 0; i < maxLength; i++) {
      chartData.push({
        fpr: data.gmm.fpr[i] ?? data.rf.fpr[i] ?? data.xgb.fpr[i],
        gmm: data.gmm.tpr[i] ?? null,
        rf: data.rf.tpr[i] ?? null,
        xgb: data.xgb.tpr[i] ?? null,
      })
    }
  }

  const models = [
    { key: 'gmm', name: 'GMM', color: '#8b5cf6', auc: data?.gmm?.auc || 0.790 },
    { key: 'rf', name: 'Random Forest', color: '#10b981', auc: data?.rf?.auc || 0.912 },
    { key: 'xgb', name: 'XGBoost', color: '#f97316', auc: data?.xgb?.auc || 0.997 },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-6 ${className}`}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ROC Curve */}
        <div className="flex-1">
          <h3 className="font-display font-semibold text-coastal-900 mb-2">{title}</h3>
          <p className="text-sm text-coastal-600 mb-4">
            Receiver Operating Characteristic curves comparing model performance. 
            Higher AUC indicates better classification ability.
          </p>

          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                dataKey="fpr"
                domain={[0, 1]}
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                label={{
                  value: 'False Positive Rate',
                  position: 'bottom',
                  offset: 20,
                  fontSize: 12,
                  fill: '#64748b',
                }}
              />
              <YAxis
                type="number"
                domain={[0, 1]}
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                label={{
                  value: 'True Positive Rate',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10,
                  fontSize: 12,
                  fill: '#64748b',
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Diagonal reference line (random classifier) */}
              <ReferenceLine
                segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
                stroke="#94a3b8"
                strokeDasharray="5 5"
                label={{
                  value: 'Random',
                  position: 'center',
                  fill: '#94a3b8',
                  fontSize: 10,
                }}
              />

              {models.map((model) => (
                <Line
                  key={model.key}
                  type="monotone"
                  dataKey={model.key}
                  name={`${model.name} (AUC: ${model.auc.toFixed(3)})`}
                  stroke={model.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6, fill: model.color }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* AUC Comparison */}
        <div className="lg:w-72">
          <h4 className="font-medium text-coastal-900 mb-4">Model Performance</h4>
          
          <div className="space-y-4">
            {models
              .sort((a, b) => b.auc - a.auc)
              .map((model, index) => (
                <motion.div
                  key={model.key}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl"
                  style={{ 
                    backgroundColor: `${model.color}10`,
                    borderLeft: `4px solid ${model.color}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-coastal-900">{model.name}</span>
                    {index === 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Best
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-bold" style={{ color: model.color }}>
                    {model.auc.toFixed(3)}
                  </div>
                  <div className="text-xs text-coastal-500 mt-1">
                    Area Under Curve
                  </div>
                  
                  {/* AUC bar */}
                  <div className="mt-3 h-2 bg-coastal-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${model.auc * 100}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: model.color }}
                    />
                  </div>
                </motion.div>
              ))}
          </div>

          {/* Interpretation */}
          <div className="mt-6 p-4 bg-coastal-50 rounded-xl">
            <h5 className="text-sm font-medium text-coastal-900 mb-2">AUC Guidelines</h5>
            <ul className="text-xs text-coastal-600 space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                0.5-0.6: Poor
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                0.6-0.7: Fair
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                0.7-0.8: Good
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                0.8-0.9: Very Good
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                0.9-1.0: Excellent
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
