'use client'

import { useState, useEffect } from 'react'

interface SecurityMetricProps {
  title: string
  value: string | number
  trend?: number
  icon: React.ComponentType<any>
  type?: 'default' | 'gauge' | 'status' | 'vulnerabilities'
  criticalCount?: number
  highCount?: number
  mediumCount?: number
  status?: 'success' | 'warning' | 'error'
}

export function SecurityMetricCard({
  title,
  value,
  trend,
  icon: Icon,
  type = 'default',
  criticalCount,
  highCount,
  mediumCount,
  status = 'success'
}: SecurityMetricProps) {
  const [mounted, setMounted] = useState(false)
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    setMounted(true)
    if (typeof value === 'number') {
      const timer = setTimeout(() => {
        setAnimatedValue(value)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [value])

  if (!mounted) {
    return (
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
        <div className="relative backdrop-blur-xl bg-gray-900/10 border border-cyan-500/15 rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300 shadow-xl">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700 rounded mb-4"></div>
            <div className="h-8 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (type) {
      case 'gauge':
        const percentage = typeof value === 'number' ? value : parseInt(value.toString())
        return (
          <div className="space-y-4">
            <div className="relative w-24 h-24 mx-auto">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgb(55 65 81)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgb(6 182 212)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - animatedValue / 100)}`}
                  className="transition-all duration-1000 ease-out"
                  style={{
                    filter: 'drop-shadow(0 0 6px rgb(6 182 212 / 0.5))'
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-cyan-400">{animatedValue}%</span>
              </div>
            </div>
          </div>
        )

      case 'vulnerabilities':
        const totalIssues = (criticalCount || 0) + (highCount || 0) + (mediumCount || 0)
        return (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{totalIssues}</div>
              <div className="text-sm text-gray-400">Total Issues</div>
            </div>
            <div className="flex justify-center space-x-3">
              {(criticalCount || 0) > 0 && (
                <div className="flex flex-col items-center">
                  <div className="text-lg font-bold text-red-400">{criticalCount}</div>
                  <div className="text-xs text-red-400">Critical</div>
                </div>
              )}
              {(highCount || 0) > 0 && (
                <div className="flex flex-col items-center">
                  <div className="text-lg font-bold text-orange-400">{highCount}</div>
                  <div className="text-xs text-orange-400">High</div>
                </div>
              )}
              {(mediumCount || 0) > 0 && (
                <div className="flex flex-col items-center">
                  <div className="text-lg font-bold text-yellow-400">{mediumCount}</div>
                  <div className="text-xs text-yellow-400">Medium</div>
                </div>
              )}
            </div>
          </div>
        )

      case 'status':
        const statusColors = {
          success: 'text-green-400',
          warning: 'text-yellow-400',
          error: 'text-red-400'
        }
        return (
          <div className="space-y-2">
            <div className={`text-2xl font-bold ${statusColors[status]}`}>{value}</div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${status === 'success' ? 'bg-green-400' : status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'} animate-pulse`}></div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">{status}</span>
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">
              {typeof value === 'number' ? animatedValue : value}
            </div>
            {trend !== undefined && (
              <div className={`flex items-center space-x-1 text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                <span className={trend >= 0 ? '↗' : '↘'}></span>
                <span>{Math.abs(trend)}%</span>
                <span className="text-gray-400">vs last week</span>
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div className="backdrop-blur-xl bg-gray-900/10 border border-cyan-500/15 rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300 shadow-xl hover:shadow-cyan-500/10 hover:shadow-2xl h-[200px]">
      <div className="flex items-start justify-between h-full">
        <div className="flex-1 flex flex-col">
          <h3 className="text-gray-300 text-sm font-medium mb-3">{title}</h3>
          <div className="flex-1 flex items-center">
            {renderContent()}
          </div>
        </div>
        <div className="ml-4">
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
            <Icon className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
      </div>
    </div>
  )
}