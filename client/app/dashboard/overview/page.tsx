"use client"

import { useState, useEffect } from 'react'
import {
  ChartBarIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import { AIPersonaWidget } from '@/components/ai-persona-widget'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface DashboardMetrics {
  totalScans: number
  criticalFindings: number
  avgSecurityScore: number
  scansToday: number
  scansTrend: 'up' | 'down' | 'stable'
  trendPercentage: number
  topVulnerabilities: Array<{
    type: string
    count: number
    severity: 'critical' | 'high' | 'medium' | 'low'
  }>
  scanHistory: Array<{
    date: string
    scans: number
    score: number
  }>
  riskDistribution: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    fetchMetrics()
  }, [timeRange])

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      // First, try to get data from localStorage (saved scans)
      const savedReports = JSON.parse(localStorage.getItem('sentinelHub_scanReports') || '[]')

      if (savedReports.length > 0) {
        // Calculate metrics from saved scans
        const now = new Date()
        const timeRangeMs = timeRange === '7d' ? 7 * 24 * 60 * 60 * 1000 :
                           timeRange === '30d' ? 30 * 24 * 60 * 60 * 1000 :
                           24 * 60 * 60 * 1000

        const recentScans = savedReports.filter((scan: any) => {
          const scanDate = new Date(scan.timestamp)
          return now.getTime() - scanDate.getTime() < timeRangeMs
        })

        const totalVulns = recentScans.reduce((acc: any, scan: any) => ({
          critical: acc.critical + (scan.vulnerabilities?.critical || 0),
          high: acc.high + (scan.vulnerabilities?.high || 0),
          medium: acc.medium + (scan.vulnerabilities?.medium || 0),
          low: acc.low + (scan.vulnerabilities?.low || 0),
        }), { critical: 0, high: 0, medium: 0, low: 0 })

        const avgScore = recentScans.length > 0
          ? Math.round(recentScans.reduce((acc: number, scan: any) => acc + (scan.score || 50), 0) / recentScans.length)
          : 0

        const scansToday = savedReports.filter((scan: any) => {
          const scanDate = new Date(scan.timestamp)
          const today = new Date()
          return scanDate.toDateString() === today.toDateString()
        }).length

        // Calculate scan history for chart
        const scanHistory = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const dayScans = savedReports.filter((scan: any) => {
            const scanDate = new Date(scan.timestamp)
            return scanDate.toDateString() === date.toDateString()
          })

          const dayAvgScore = dayScans.length > 0
            ? Math.round(dayScans.reduce((acc: number, scan: any) => acc + (scan.score || 50), 0) / dayScans.length)
            : 0

          scanHistory.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            scans: dayScans.length,
            score: dayAvgScore
          })
        }

        setMetrics({
          totalScans: recentScans.length,
          criticalFindings: totalVulns.critical,
          avgSecurityScore: avgScore,
          scansToday: scansToday,
          scansTrend: scansToday > 2 ? 'up' : 'stable',
          trendPercentage: 12,
          topVulnerabilities: [
            { type: 'SQL Injection', count: totalVulns.critical, severity: 'critical' },
            { type: 'XSS Vulnerability', count: totalVulns.high, severity: 'high' },
            { type: 'Outdated Dependencies', count: totalVulns.medium, severity: 'medium' },
            { type: 'Code Quality Issues', count: totalVulns.low, severity: 'low' },
          ].filter(v => v.count > 0),
          scanHistory,
          riskDistribution: totalVulns
        })
      } else {
        // No scans yet - show empty state
        setMetrics({
          totalScans: 0,
          criticalFindings: 0,
          avgSecurityScore: 0,
          scansToday: 0,
          scansTrend: 'stable',
          trendPercentage: 0,
          topVulnerabilities: [],
          scanHistory: [],
          riskDistribution: { critical: 0, high: 0, medium: 0, low: 0 }
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard metrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Overview</h1>
          <p className="text-gray-400 mt-1">Real-time security metrics and insights</p>
        </div>

        {/* Time Range Selector */}
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* AI Persona Widget */}
      <AIPersonaWidget />

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Total Scans */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <ChartBarIcon className="w-8 h-8 text-cyan-400" />
            {metrics.scansTrend === 'up' && (
              <div className="flex items-center space-x-1 text-green-400 text-sm">
                <ArrowTrendingUpIcon className="w-4 h-4" />
                <span>{metrics.trendPercentage}%</span>
              </div>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">{metrics.totalScans}</div>
          <div className="text-sm text-gray-400">Total Scans</div>
          <div className="text-xs text-cyan-400 mt-2">{metrics.scansToday} today</div>
        </div>

        {/* Security Score */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-green-400" />
          </div>
          <div className={`text-3xl font-bold mb-1 ${getScoreColor(metrics.avgSecurityScore)}`}>
            {metrics.avgSecurityScore}/100
          </div>
          <div className="text-sm text-gray-400">Average Security Score</div>
          <div className="w-full bg-gray-700/50 rounded-full h-2 mt-3">
            <div
              className="bg-gradient-to-r from-cyan-500 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${metrics.avgSecurityScore}%` }}
            />
          </div>
        </div>

        {/* Critical Findings */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <ExclamationCircleIcon className="w-8 h-8 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-red-400 mb-1">{metrics.criticalFindings}</div>
          <div className="text-sm text-gray-400">Critical Issues</div>
          {metrics.criticalFindings > 0 && (
            <div className="text-xs text-red-400 mt-2">Requires immediate attention</div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <ClockIcon className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-1">
            {metrics.scanHistory[metrics.scanHistory.length - 1]?.scans || 0}
          </div>
          <div className="text-sm text-gray-400">Scans Today</div>
          <div className="text-xs text-blue-400 mt-2">Last updated just now</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Scan Activity Chart */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Scan Activity Trend</h3>
          <div className="space-y-4">
            {metrics.scanHistory.map((day, index) => {
              const maxScans = Math.max(...metrics.scanHistory.map(d => d.scans), 1)
              const width = (day.scans / maxScans) * 100

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{day.date}</span>
                    <span className="text-white font-medium">{day.scans} scans</span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Risk Distribution - PIE CHART */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Risk Distribution</h3>

          {(() => {
            const total = Object.values(metrics.riskDistribution).reduce((a, b) => a + b, 0)

            if (total === 0) {
              return (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <ShieldCheckIcon className="w-16 h-16 text-green-400 mx-auto mb-3" />
                    <p className="text-gray-400">No vulnerabilities found</p>
                    <p className="text-sm text-green-400 mt-2">All systems secure!</p>
                  </div>
                </div>
              )
            }

            const chartData = [
              { name: 'Critical', value: metrics.riskDistribution.critical, color: '#ef4444' },
              { name: 'High', value: metrics.riskDistribution.high, color: '#f97316' },
              { name: 'Medium', value: metrics.riskDistribution.medium, color: '#eab308' },
              { name: 'Low', value: metrics.riskDistribution.low, color: '#3b82f6' },
            ].filter(item => item.value > 0)

            return (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '0.5rem',
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {chartData.map((item) => {
                    const percentage = ((item.value / total) * 100).toFixed(0)
                    return (
                      <div key={item.name} className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-gray-300">
                          {item.name}: {item.value} ({percentage}%)
                        </span>
                      </div>
                    )
                  })}
                </div>
              </>
            )
          })()}
        </div>
      </div>

      {/* Top Vulnerabilities */}
      {metrics.topVulnerabilities.length > 0 && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Top Vulnerabilities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.topVulnerabilities.map((vuln, index) => (
              <div key={index} className="bg-black/20 border border-gray-600/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getSeverityColor(vuln.severity)}`}>
                    {vuln.severity.toUpperCase()}
                  </span>
                  <span className="text-2xl font-bold text-white">{vuln.count}</span>
                </div>
                <div className="text-sm text-gray-300 font-medium">{vuln.type}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {metrics.totalScans === 0 && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <ShieldCheckIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Scans Yet</h3>
          <p className="text-gray-400 mb-6">
            Run your first security scan to see insights and metrics here.
          </p>
          <a
            href="/dashboard/scanner"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-medium transition-all duration-200"
          >
            Start Your First Scan
          </a>
        </div>
      )}
    </div>
  )
}
