'use client'

import { useState, useEffect } from 'react'
import { 
  FolderIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline'

interface Repository {
  id: string
  name: string
  description: string
  language: string
  securityScore: number
  lastScan: string
  issues: {
    critical: number
    high: number
    medium: number
  }
  status: 'secure' | 'warning' | 'critical'
}

const mockRepositories: Repository[] = [
  {
    id: '1',
    name: 'frontend-app',
    description: 'React TypeScript application',
    language: 'TypeScript',
    securityScore: 92,
    lastScan: '2 hours ago',
    issues: { critical: 0, high: 1, medium: 2 },
    status: 'secure'
  },
  {
    id: '2',
    name: 'api-gateway',
    description: 'Node.js API service',
    language: 'JavaScript',
    securityScore: 78,
    lastScan: '4 hours ago',
    issues: { critical: 1, high: 3, medium: 5 },
    status: 'warning'
  },
  {
    id: '3',
    name: 'user-service',
    description: 'Authentication microservice',
    language: 'Python',
    securityScore: 65,
    lastScan: '1 day ago',
    issues: { critical: 2, high: 4, medium: 8 },
    status: 'critical'
  },
  {
    id: '4',
    name: 'data-pipeline',
    description: 'ETL processing service',
    language: 'Go',
    securityScore: 88,
    lastScan: '6 hours ago',
    issues: { critical: 0, high: 2, medium: 3 },
    status: 'secure'
  },
  {
    id: '5',
    name: 'mobile-app',
    description: 'React Native application',
    language: 'TypeScript',
    securityScore: 84,
    lastScan: '12 hours ago',
    issues: { critical: 0, high: 1, medium: 4 },
    status: 'secure'
  }
]

export function RecentRepositories() {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => {
      setRepositories(mockRepositories)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      TypeScript: 'bg-blue-500',
      JavaScript: 'bg-yellow-500',
      Python: 'bg-green-500',
      Go: 'bg-cyan-500',
      Java: 'bg-orange-500',
      Rust: 'bg-red-500'
    }
    return colors[language] || 'bg-gray-500'
  }

  const getStatusIcon = (status: Repository['status']) => {
    switch (status) {
      case 'secure':
        return ShieldCheckIcon
      case 'warning':
        return ExclamationTriangleIcon
      case 'critical':
        return ExclamationTriangleIcon
      default:
        return ShieldCheckIcon
    }
  }

  const getStatusColor = (status: Repository['status']) => {
    switch (status) {
      case 'secure':
        return 'text-green-400'
      case 'warning':
        return 'text-yellow-400'
      case 'critical':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  if (!mounted) {
    return (
      <div className="relative group h-[400px]">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-sm"></div>
        <div className="relative backdrop-blur-xl bg-gray-900/10 border border-cyan-500/15 rounded-2xl p-6 h-full">
          <h3 className="text-gray-300 text-lg font-semibold mb-4">Recent Repositories</h3>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-3 rounded-xl border border-gray-700/50">
                  <div className="w-10 h-10 bg-gray-700 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                  <div className="w-16 h-8 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="backdrop-blur-xl bg-gray-900/10 border border-cyan-500/15 rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300 shadow-xl hover:shadow-cyan-500/10 hover:shadow-2xl h-[400px]">
      <h3 className="text-gray-300 text-lg font-semibold mb-6">Recent Repositories</h3>
        
        <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-cyan-500/30">
          {repositories.map((repo, index) => {
            const StatusIcon = getStatusIcon(repo.status)
            return (
              <div
                key={repo.id}
                className="group/repo flex items-center space-x-4 p-3 rounded-xl border border-gray-700/50 hover:border-cyan-500/30 hover:bg-white/5 transition-all duration-200 cursor-pointer"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'slideInRight 0.5s ease-out forwards'
                }}
              >
                <div className="relative">
                  <div className="p-2 bg-gray-800/50 rounded-xl border border-gray-600/30">
                    <FolderIcon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className={`absolute -top-1 -right-1 w-3 h-3 ${getLanguageColor(repo.language)} rounded-full border-2 border-gray-900`}></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-white font-medium text-sm group-hover/repo:text-cyan-300 transition-colors">
                        {repo.name}
                      </h4>
                      <p className="text-gray-400 text-xs mt-1 truncate">
                        {repo.description}
                      </p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="text-xs text-gray-500">
                          {repo.language}
                        </span>
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-500">{repo.lastScan}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className={`text-lg font-bold ${getScoreColor(repo.securityScore)}`}>
                        {repo.securityScore}%
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        <StatusIcon className={`w-4 h-4 ${getStatusColor(repo.status)}`} />
                        <span className={`text-xs ${getStatusColor(repo.status)} capitalize`}>
                          {repo.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {(repo.issues.critical > 0 || repo.issues.high > 0 || repo.issues.medium > 0) && (
                    <div className="flex items-center space-x-3 mt-2 pt-2 border-t border-gray-700/30">
                      {repo.issues.critical > 0 && (
                        <span className="text-xs text-red-400">
                          {repo.issues.critical} critical
                        </span>
                      )}
                      {repo.issues.high > 0 && (
                        <span className="text-xs text-orange-400">
                          {repo.issues.high} high
                        </span>
                      )}
                      {repo.issues.medium > 0 && (
                        <span className="text-xs text-yellow-400">
                          {repo.issues.medium} medium
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <button className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors font-medium">
            View all repositories →
          </button>
        </div>
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
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