'use client'

import { useState, useEffect } from 'react'
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface Activity {
  id: string
  type: 'scan' | 'fix' | 'security' | 'alert'
  title: string
  description: string
  timestamp: string
  status: 'success' | 'warning' | 'error' | 'info'
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'scan',
    title: 'Scanned react-app',
    description: '3 issues',
    timestamp: '2m',
    status: 'warning'
  },
  {
    id: '2',
    type: 'fix',
    title: 'Fixed SQL injection',
    description: 'Critical resolved',
    timestamp: '15m',
    status: 'success'
  },
  {
    id: '3',
    type: 'security',
    title: 'AWS S3 secured',
    description: 'Permissions updated',
    timestamp: '1h',
    status: 'success'
  },
  {
    id: '4',
    type: 'scan',
    title: 'Weekly scan completed',
    description: '0 new issues',
    timestamp: '3h',
    status: 'success'
  }
]

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Simulate loading activities
    const timer = setTimeout(() => {
      setActivities(mockActivities)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'scan':
        return ShieldCheckIcon
      case 'fix':
        return CheckCircleIcon
      case 'security':
        return ShieldCheckIcon
      case 'alert':
        return ExclamationTriangleIcon
      default:
        return ClockIcon
    }
  }

  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-400'
      case 'warning':
        return 'text-yellow-400'
      case 'error':
        return 'text-red-400'
      default:
        return 'text-cyan-400'
    }
  }

  const getBorderColor = (status: Activity['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-500/20'
      case 'warning':
        return 'border-yellow-500/20'
      case 'error':
        return 'border-red-500/20'
      default:
        return 'border-cyan-500/20'
    }
  }

  if (!mounted) {
    return (
      <div className="relative group h-[400px]">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-sm"></div>
        <div className="relative backdrop-blur-xl bg-gray-900/40 border border-cyan-500/30 rounded-2xl p-6 h-full">
          <h3 className="text-gray-300 text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="backdrop-blur-xl bg-gray-900/40 border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300 shadow-xl hover:shadow-cyan-500/10 hover:shadow-2xl h-[400px]">
      <h3 className="text-gray-300 text-lg font-semibold mb-6">Recent Activity</h3>
        
        <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-cyan-500/30">
          {activities.map((activity, index) => {
            const Icon = getIcon(activity.type)
            return (
              <div
                key={activity.id}
                className={`flex items-center space-x-3 p-2 rounded-lg border ${getBorderColor(activity.status)} hover:bg-white/5 transition-all duration-200`}
              >
                <div className={`p-1.5 rounded-lg bg-gray-800/50 border ${getBorderColor(activity.status)}`}>
                  <Icon className={`w-4 h-4 ${getStatusColor(activity.status)}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium text-xs">
                        {activity.title}
                      </h4>
                      <p className="text-gray-400 text-xs">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-gray-500 text-xs">
                      {activity.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <button className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors font-medium">
            View all activities →
          </button>
        </div>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}