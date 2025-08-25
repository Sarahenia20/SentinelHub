"use client"

import { useState, useEffect } from "react"
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ClockIcon,
  CpuChipIcon,
  XMarkIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline"

interface ScanSession {
  id: string
  timestamp: string
  source: 'repository' | 's3' | 'container' | 'code'
  sourceDetails: string
  score: number
  vulnerabilities: {
    critical: number
    high: number
    medium: number
    low: number
  }
  engines: string[]
  status: 'completed' | 'running' | 'failed'
  duration: string
  compliance: {
    owasp: number
    nist: number
    iso27001: number
  }
}

export function SecurityReports() {
  const [selectedSession, setSelectedSession] = useState<ScanSession | null>(null)
  const [expandedGrafana, setExpandedGrafana] = useState(false)
  const [filter, setFilter] = useState('all')
  const [dateRange, setDateRange] = useState('7d')
  const [savedSessions, setSavedSessions] = useState<ScanSession[]>([])

  // Load saved scan reports on component mount
  useEffect(() => {
    const loadSavedReports = () => {
      try {
        const savedReports = JSON.parse(localStorage.getItem('sentinelHub_scanReports') || '[]')
        const formattedSessions = savedReports.map((report: any) => ({
          id: report.id,
          timestamp: report.timestamp,
          source: report.source as 'repository' | 's3' | 'container' | 'code',
          sourceDetails: report.sourceDetails,
          score: Math.max(20, 100 - (report.vulnerabilities.critical * 25 + report.vulnerabilities.high * 15 + report.vulnerabilities.medium * 8 + report.vulnerabilities.low * 3)),
          vulnerabilities: report.vulnerabilities,
          engines: report.engines,
          status: report.status,
          duration: report.duration,
          compliance: {
            owasp: Math.floor(Math.random() * 30) + 70,
            nist: Math.floor(Math.random() * 30) + 65, 
            iso27001: Math.floor(Math.random() * 30) + 72
          }
        }))
        setSavedSessions(formattedSessions)
      } catch (error) {
        console.error('Error loading saved reports:', error)
        setSavedSessions([])
      }
    }

    loadSavedReports()
    
    // Listen for storage changes to update in real-time
    const handleStorageChange = () => loadSavedReports()
    window.addEventListener('storage', handleStorageChange)
    
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const mockSessions: ScanSession[] = [
    {
      id: "scan-001",
      timestamp: "2025-01-20T14:30:00Z",
      source: "repository",
      sourceDetails: "github.com/user/webapp",
      score: 85,
      vulnerabilities: { critical: 0, high: 2, medium: 5, low: 8 },
      engines: ["ESLint", "Semgrep", "Trivy", "SonarQube"],
      status: "completed",
      duration: "4m 32s",
      compliance: { owasp: 92, nist: 87, iso27001: 89 }
    },
    {
      id: "scan-002", 
      timestamp: "2025-01-20T12:15:00Z",
      source: "s3",
      sourceDetails: "my-security-bucket",
      score: 72,
      vulnerabilities: { critical: 1, high: 3, medium: 2, low: 4 },
      engines: ["AWS Config", "Trivy", "Semgrep"],
      status: "completed",
      duration: "2m 18s",
      compliance: { owasp: 78, nist: 74, iso27001: 81 }
    },
    {
      id: "scan-003",
      timestamp: "2025-01-20T10:45:00Z",
      source: "container",
      sourceDetails: "nginx:1.21-alpine",
      score: 94,
      vulnerabilities: { critical: 0, high: 0, medium: 1, low: 2 },
      engines: ["Trivy", "Hadolint", "Grype"],
      status: "completed",
      duration: "1m 45s",
      compliance: { owasp: 96, nist: 92, iso27001: 94 }
    },
    {
      id: "scan-004",
      timestamp: "2025-01-20T09:20:00Z",
      source: "code",
      sourceDetails: "User submitted code",
      score: 68,
      vulnerabilities: { critical: 2, high: 4, medium: 6, low: 3 },
      engines: ["ESLint", "Semgrep", "CodeQL"],
      status: "completed", 
      duration: "3m 12s",
      compliance: { owasp: 71, nist: 65, iso27001: 72 }
    }
  ]

  // Combine saved sessions with mock sessions, prioritizing saved sessions
  const allSessions = [...savedSessions, ...mockSessions]
  
  const filteredSessions = allSessions.filter(session => {
    if (filter === 'all') return true
    return session.source === filter
  })

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    if (score >= 50) return 'text-orange-400'
    return 'text-red-400'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-900/20'
      case 'running': return 'text-blue-400 bg-blue-900/20'
      case 'failed': return 'text-red-400 bg-red-900/20'
      default: return 'text-gray-400 bg-gray-900/20'
    }
  }

  const getSeverityColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-red-400'
      case 'high': return 'text-orange-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const totalVulnerabilities = filteredSessions.reduce((acc, session) => {
    acc.critical += session.vulnerabilities.critical
    acc.high += session.vulnerabilities.high
    acc.medium += session.vulnerabilities.medium
    acc.low += session.vulnerabilities.low
    return acc
  }, { critical: 0, high: 0, medium: 0, low: 0 })

  const averageScore = Math.round(
    filteredSessions.reduce((acc, session) => acc + session.score, 0) / 
    (filteredSessions.length || 1)
  )

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto px-6 py-8">


        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-gray-800/50 border border-gray-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="all">All Sources</option>
                <option value="repository">Repository</option>
                <option value="s3">S3 Bucket</option>
                <option value="container">Container</option>
                <option value="code">Code</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-gray-800/50 border border-gray-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
          </div>

          <button className="flex items-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-medium transition-all duration-200">
            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
            Export Report
          </button>
        </div>

        {/* Vulnerability Breakdown Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Vulnerability Breakdown</h3>
            <div className="space-y-4">
              {['critical', 'high', 'medium', 'low'].map((severity) => {
                const count = totalVulnerabilities[severity as keyof typeof totalVulnerabilities]
                const total = Object.values(totalVulnerabilities).reduce((a, b) => a + b, 0)
                const percentage = total > 0 ? (count / total) * 100 : 0
                
                return (
                  <div key={severity} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`capitalize font-medium ${getSeverityColor(severity)}`}>
                        {severity}
                      </span>
                      <span className="text-gray-400">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          severity === 'critical' ? 'bg-red-500' :
                          severity === 'high' ? 'bg-orange-500' :
                          severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Security Trends</h3>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-2">↑ 15%</div>
                <div className="text-sm text-gray-400">Security Score Improvement</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400 mb-2">↓ 23%</div>
                <div className="text-sm text-gray-400">Critical Issues Reduction</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-2">+12</div>
                <div className="text-sm text-gray-400">New Scans This Week</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scan History Table */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-12">
          <h3 className="text-xl font-semibold text-white mb-6">Scan History</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Timestamp</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Source</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Score</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Vulnerabilities</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Duration</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session) => {
                  const isFromScanner = savedSessions.some(s => s.id === session.id)
                  return (
                    <tr key={session.id} className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                      <td className="py-4 px-4 text-white">
                        <div className="flex items-center space-x-2">
                          <span>{new Date(session.timestamp).toLocaleString()}</span>
                          {isFromScanner && (
                            <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded-full border border-green-500/30">
                              New
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-white font-medium">{session.sourceDetails}</div>
                        <div className="text-sm text-gray-400 capitalize">{session.source}</div>
                      </td>
                    <td className="py-4 px-4">
                      <span className={`text-lg font-bold ${getScoreColor(session.score)}`}>
                        {session.score}/100
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        {session.vulnerabilities.critical > 0 && (
                          <span className="text-red-400 text-sm">{session.vulnerabilities.critical}C</span>
                        )}
                        {session.vulnerabilities.high > 0 && (
                          <span className="text-orange-400 text-sm">{session.vulnerabilities.high}H</span>
                        )}
                        {session.vulnerabilities.medium > 0 && (
                          <span className="text-yellow-400 text-sm">{session.vulnerabilities.medium}M</span>
                        )}
                        {session.vulnerabilities.low > 0 && (
                          <span className="text-blue-400 text-sm">{session.vulnerabilities.low}L</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-300">{session.duration}</td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => setSelectedSession(session)}
                        className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="w-4 h-4 text-cyan-400" />
                      </button>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grafana Dashboard Preview */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Real-time Monitoring</h3>
            <button
              onClick={() => setExpandedGrafana(!expandedGrafana)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 rounded-xl font-medium transition-all duration-200"
            >
              {expandedGrafana ? 'Collapse' : 'Expand'} Dashboard
            </button>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-300 ${
            expandedGrafana ? 'mb-8' : ''
          }`}>
            <div className="bg-black/20 border border-cyan-500/20 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-sm text-cyan-400 mb-2">Security Alerts</div>
              <div className="text-2xl font-bold text-cyan-400">3</div>
              <div className="text-xs text-gray-400">Last 24h</div>
            </div>
            
            <div className="bg-black/20 border border-green-500/20 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-sm text-green-400 mb-2">Scan Queue</div>
              <div className="text-2xl font-bold text-green-400">0</div>
              <div className="text-xs text-gray-400">Pending scans</div>
            </div>
            
            <div className="bg-black/20 border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-sm text-blue-400 mb-2">API Calls/min</div>
              <div className="text-2xl font-bold text-blue-400">127</div>
              <div className="text-xs text-gray-400">Current rate</div>
            </div>
            
            <div className="bg-black/20 border border-purple-500/20 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-sm text-purple-400 mb-2">Uptime</div>
              <div className="text-2xl font-bold text-purple-400">99.9%</div>
              <div className="text-xs text-gray-400">Last 30 days</div>
            </div>
          </div>

          {expandedGrafana && (
            <div className="bg-black/20 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-center text-gray-400 py-12">
                <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <div className="text-lg mb-2">Grafana Dashboard Integration</div>
                <div className="text-sm">Real-time security metrics and alerts would be displayed here</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
              <h3 className="text-2xl font-bold text-white">Scan Details</h3>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Scan Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Scan ID:</span>
                      <span className="text-white font-mono">{selectedSession.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Source:</span>
                      <span className="text-white">{selectedSession.sourceDetails}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white capitalize">{selectedSession.source}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white">{selectedSession.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`font-medium ${getStatusColor(selectedSession.status)} px-2 py-1 rounded`}>
                        {selectedSession.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Security Score</h4>
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${getScoreColor(selectedSession.score)}`}>
                      {selectedSession.score}/100
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${
                          selectedSession.score >= 90 ? 'bg-green-500' :
                          selectedSession.score >= 70 ? 'bg-yellow-500' :
                          selectedSession.score >= 50 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${selectedSession.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Vulnerabilities</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-red-400">Critical</span>
                      <span className="text-red-400 font-bold">{selectedSession.vulnerabilities.critical}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-400">High</span>
                      <span className="text-orange-400 font-bold">{selectedSession.vulnerabilities.high}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-400">Medium</span>
                      <span className="text-yellow-400 font-bold">{selectedSession.vulnerabilities.medium}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-400">Low</span>
                      <span className="text-blue-400 font-bold">{selectedSession.vulnerabilities.low}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Compliance</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">OWASP Top 10</span>
                      <span className="text-cyan-400 font-bold">{selectedSession.compliance.owasp}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">NIST Framework</span>
                      <span className="text-cyan-400 font-bold">{selectedSession.compliance.nist}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">ISO 27001</span>
                      <span className="text-cyan-400 font-bold">{selectedSession.compliance.iso27001}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Security Engines Used</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSession.engines.map((engine) => (
                    <span
                      key={engine}
                      className="px-3 py-1 bg-gray-700/50 border border-gray-600/50 rounded-lg text-sm text-gray-300"
                    >
                      {engine}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}