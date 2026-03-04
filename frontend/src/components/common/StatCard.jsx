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
    if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5" />
    if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5" />
    return <Minus className="w-3.5 h-3.5" />
  }

  const getTrendColor = () => {
    if (!trend) return ''
    if (trend === 'up') return 'text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200'
    if (trend === 'down') return 'text-red-600 bg-red-50 ring-1 ring-red-200'
    return 'text-coastal-600 bg-coastal-100 ring-1 ring-coastal-200'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`stat-card group hover:shadow-card-hover ${className}`}
    >
      {/* Subtle gradient accent in top-left corner */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-ocean-50/50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-500/10 to-primary-500/10 flex items-center justify-center ring-1 ring-ocean-100">
              <Icon className="w-5 h-5 text-ocean-600" />
            </div>
          )}
          <span className="text-xs font-semibold text-coastal-500 uppercase tracking-wide">{title}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${getTrendColor()}`}>
            {getTrendIcon()}
            {trendValue}
          </div>
        )}
      </div>
      
      <div className="relative text-2xl sm:text-3xl font-display font-bold text-coastal-900 tracking-tight">{value}</div>
      {subtitle && <div className="relative text-xs text-coastal-400 mt-1.5 font-medium">{subtitle}</div>}
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
