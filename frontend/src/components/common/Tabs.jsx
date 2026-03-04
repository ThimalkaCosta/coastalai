import { useState } from 'react'
import { motion } from 'framer-motion'

export default function Tabs({ tabs, defaultTab, activeTab: controlledActiveTab, onChange, className = '' }) {
  // Support both controlled and uncontrolled modes
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.id)
  
  // Use controlled state if provided, otherwise use internal state
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab
  const setActiveTab = onChange || setInternalActiveTab

  const activeContent = tabs.find((tab) => tab.id === activeTab)

  return (
    <div className={className}>
      {/* Tab buttons */}
      <div className="flex gap-1 p-1 bg-coastal-100/70 backdrop-blur-sm rounded-2xl w-fit mb-6 border border-coastal-200/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button relative ${
              activeTab === tab.id ? 'text-white' : 'tab-button-inactive'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-ocean-500 to-ocean-600 rounded-xl shadow-lg shadow-ocean-500/20"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content - only render if tabs have content property */}
      {activeContent?.content && (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeContent.content}
        </motion.div>
      )}
    </div>
  )
}
