'use client'

import { useState } from 'react'
import { 
  MagnifyingGlassIcon, 
  LinkIcon, 
  ShieldCheckIcon,
  PlayIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  color: string
  action: () => void
}

export function QuickActions() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (actionId: string, action: () => void) => {
    setLoading(actionId)
    try {
      await action()
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1500))
    } finally {
      setLoading(null)
    }
  }

  const actions: QuickAction[] = [
    {
      id: 'scan',
      title: 'Scan New Code',
      description: 'Run security analysis on latest commits',
      icon: MagnifyingGlassIcon,
      color: 'from-blue-500 to-cyan-500',
      action: () => {
        console.log('Starting code scan...')
      }
    },
    {
      id: 'connect',
      title: 'Connect Repository',
      description: 'Add a new repository for monitoring',
      icon: LinkIcon,
      color: 'from-green-500 to-emerald-500',
      action: () => {
        console.log('Connecting repository...')
      }
    },
    {
      id: 'audit',
      title: 'Run Security Audit',
      description: 'Comprehensive security assessment',
      icon: ShieldCheckIcon,
      color: 'from-purple-500 to-indigo-500',
      action: () => {
        console.log('Running security audit...')
      }
    }
  ]

  return (
    <div className="backdrop-blur-xl bg-gray-900/40 border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300 shadow-xl hover:shadow-cyan-500/10 hover:shadow-2xl h-[400px]">
      <h3 className="text-gray-300 text-lg font-semibold mb-6">Quick Actions</h3>
        
        <div className="space-y-4">
          {actions.map((action, index) => {
            const Icon = action.icon
            const isLoading = loading === action.id
            
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action.id, action.action)}
                disabled={isLoading}
                className="group/action w-full p-4 rounded-xl border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300 text-left hover:shadow-lg hover:shadow-cyan-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  animationDelay: `${index * 150}ms`,
                  animation: 'slideInLeft 0.6s ease-out forwards'
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className={`relative p-3 rounded-xl bg-gradient-to-r ${action.color} bg-opacity-20 border border-white/10`}>
                    {isLoading ? (
                      <ArrowPathIcon className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Icon className="w-6 h-6 text-white group-hover/action:scale-110 transition-transform duration-200" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-white font-medium group-hover/action:text-cyan-300 transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-gray-400 text-sm mt-1">
                      {action.description}
                    </p>
                  </div>
                  
                  <div className="text-cyan-400 group-hover/action:translate-x-1 transition-transform duration-200">
                    <PlayIcon className="w-5 h-5" />
                  </div>
                </div>
                
                {isLoading && (
                  <div className="mt-3 pt-3 border-t border-gray-700/50">
                    <div className="flex items-center space-x-2 text-cyan-400 text-sm">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                      <span>Processing...</span>
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-700/50">
          <div className="text-center">
            <button className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors font-medium">
              View all tools →
            </button>
          </div>
        </div>
      
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}