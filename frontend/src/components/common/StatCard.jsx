import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  trend,
  trendValue,
  className = '',
  delay = 0 
}) {
  const getTrendIcon = () => {
    if (!trend) return null
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />
    return <Minus className="w-4 h-4" />
  }

  const getTrendColor = () => {
    if (!trend) return ''
    if (trend === 'up') return 'text-emerald-600 bg-emerald-50'
    if (trend === 'down') return 'text-red-600 bg-red-50'
    return 'text-coastal-600 bg-coastal-100'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`stat-card ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-500/10 to-primary-500/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-ocean-600" />
            </div>
          )}
          <span className="text-sm font-medium text-coastal-500">{title}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            {trendValue}
          </div>
        )}
      </div>
      
      <div className="stat-value">{value}</div>
      {subtitle && <div className="stat-label">{subtitle}</div>}
    </motion.div>
  )
}

export function StatCardGrid({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 ${className}`}>
      {children}
    </div>
  )
}
