import { motion } from 'framer-motion'

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} border-2 border-coastal-200 border-t-ocean-500 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

export function LoadingSkeleton({ className = '', lines = 1 }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-coastal-200 rounded-lg"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  )
}

export function ChartSkeleton({ className = '' }) {
  return (
    <div className={`bg-coastal-100 rounded-xl animate-pulse ${className}`}>
      <div className="p-6">
        <div className="h-4 bg-coastal-200 rounded w-1/3 mb-4" />
        <div className="flex items-end gap-2 h-48">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-coastal-200 rounded-t"
              style={{ height: `${Math.random() * 60 + 40}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-coastal-100 overflow-hidden ${className}`}>
      <div className="p-4 border-b border-coastal-100">
        <div className="h-4 bg-coastal-200 rounded w-1/4 animate-pulse" />
      </div>
      <div className="divide-y divide-coastal-100">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="p-4 flex gap-4">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <div
                key={colIdx}
                className="h-4 bg-coastal-100 rounded flex-1 animate-pulse"
                style={{ animationDelay: `${(rowIdx + colIdx) * 0.1}s` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardSkeleton({ className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-coastal-100 p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="h-4 bg-coastal-200 rounded w-1/2 mb-4" />
        <div className="h-8 bg-coastal-100 rounded w-1/3 mb-2" />
        <div className="h-3 bg-coastal-100 rounded w-2/3" />
      </div>
    </div>
  )
}
