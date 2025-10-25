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
  BugAntIcon,
  GlobeAltIcon,
  FireIcon,
} from "@heroicons/react/24/outline"
import { getComplianceScores } from "@/utils/compliance"
import { generateSecurityReportPDF } from "@/utils/pdf-export"
import { APIIntegrationsStatus } from "@/components/api-integrations-status"

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
  aiAdvice?: string
  emailSent?: boolean
  riskLevel?: string
}

export function SecurityReports() {
  const [selectedSession, setSelectedSession] = useState<ScanSession | null>(null)
  const [expandedIntelligence, setExpandedIntelligence] = useState(false)
  const [filter, setFilter] = useState('all')
  const [dateRange, setDateRange] = useState('7d')
  const [savedSessions, setSavedSessions] = useState<ScanSession[]>([])
  const [intelligence, setIntelligence] = useState<any>(null)
  const [loadingIntelligence, setLoadingIntelligence] = useState(false)

  // Load saved scan reports on component mount
  useEffect(() => {
    const loadSavedReports = () => {
      try {
        const savedReports = JSON.parse(localStorage.getItem('sentinelHub_scanReports') || '[]')
        const formattedSessions = savedReports.map((report: any) => {
          // Calculate REAL compliance scores from scan results (no longer defaults to 100%)
          const complianceScores = report.scanResults ? getComplianceScores(report.scanResults) : { owasp: 0, nist: 0, iso27001: 0 }

          return {
            id: report.id,
            timestamp: report.timestamp,
            source: report.source as 'repository' | 's3' | 'container' | 'code',
            sourceDetails: report.sourceDetails,
            score: Math.max(20, 100 - (report.vulnerabilities.critical * 25 + report.vulnerabilities.high * 15 + report.vulnerabilities.medium * 8 + report.vulnerabilities.low * 3)),
            vulnerabilities: report.vulnerabilities,
            engines: report.engines,
            status: report.status,
            duration: report.duration,
            compliance: complianceScores,
            scanResults: report.scanResults // Keep scan results for detailed view
          }
        })
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

  // Load security intelligence when reports are available
  useEffect(() => {
    const loadIntelligence = async () => {
      if (savedSessions.length === 0) return;

      setLoadingIntelligence(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/reports/intelligence/latest`);
        const data = await response.json();

        if (data.success && data.intelligence) {
          setIntelligence(data.intelligence);
          console.log('Intelligence loaded:', data.intelligence);
        } else {
          console.warn('No intelligence data returned from API');
        }
      } catch (error) {
        console.error('Failed to load intelligence:', error);
        // Set fallback demo data on error
        setIntelligence({
          breaches: [],
          cves: [],
          threats: [],
          recommendations: ['Run a security scan to generate intelligence data'],
          context: {}
        });
      } finally {
        setLoadingIntelligence(false);
      }
    };

    loadIntelligence();
  }, [savedSessions.length, savedSessions])

  // Only use real saved sessions - no more mock data
  const allSessions = savedSessions
  
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

        {/* API Integrations Status */}
        <APIIntegrationsStatus />

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

          <button
            onClick={async () => {
              const exportData = {
                generatedAt: new Date().toISOString(),
                summary: {
                  totalScans: filteredSessions.length,
                  averageScore,
                  totalVulnerabilities,
                  criticalIssues: totalVulnerabilities.critical
                },
                scans: filteredSessions,
                intelligence,
                filters: { source: filter, dateRange }
              };

              try {
                await generateSecurityReportPDF(exportData);
              } catch (error) {
                console.error('PDF generation failed:', error);
                alert('Failed to generate PDF. Please try again.');
              }
            }}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-medium transition-all duration-200"
          >
            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
            Export PDF Report
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
                <div className="text-2xl font-bold text-green-400 mb-2">{averageScore}/100</div>
                <div className="text-sm text-gray-400">Average Security Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400 mb-2">{totalVulnerabilities.critical}</div>
                <div className="text-sm text-gray-400">Critical Issues Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-2">{allSessions.length}</div>
                <div className="text-sm text-gray-400">Total Security Scans</div>
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

        {/* Security Intelligence Panel */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FireIcon className="w-6 h-6 text-orange-400" />
              <h3 className="text-xl font-semibold text-white">Security Intelligence</h3>
              {loadingIntelligence && (
                <span className="text-xs text-gray-400 animate-pulse">Loading...</span>
              )}
            </div>
            <button
              onClick={() => setExpandedIntelligence(!expandedIntelligence)}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-xl font-medium transition-all duration-200"
            >
              {expandedIntelligence ? 'Collapse' : 'Expand'} Intelligence
            </button>
          </div>

          {/* Intelligence Explanation */}
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-sm text-gray-300 mb-2">
              <span className="font-semibold text-blue-400">Powered by AlienVault OTX & IPQualityScore:</span> This section provides real-time threat intelligence by analyzing your scan results against global threat databases.
            </p>
            <ul className="text-xs text-gray-400 space-y-1 ml-4">
              <li>• <strong className="text-white">Data Breaches:</strong> Checks if any credentials found in your code have been compromised</li>
              <li>• <strong className="text-white">CVE Matches:</strong> Identifies known vulnerabilities (CVEs) in your dependencies</li>
              <li>• <strong className="text-white">Threat Indicators:</strong> Detects malicious IPs, domains, or suspicious patterns</li>
              <li>• <strong className="text-white">Recommendations:</strong> AI-generated security advice based on findings</li>
            </ul>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-300 ${
            expandedIntelligence ? 'mb-8' : ''
          }`}>
            <div className="bg-black/20 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm hover:border-red-500/40 transition-all cursor-pointer">
              <div className="text-sm text-red-400 mb-2 flex items-center justify-between">
                <span>Data Breaches</span>
                {intelligence?.breaches?.length === 0 && <span className="text-xs text-green-400">✓ Clean</span>}
              </div>
              <div className="text-2xl font-bold text-red-400">
                {intelligence?.breaches?.length || 0}
              </div>
              <div className="text-xs text-gray-400">
                {intelligence?.breaches?.length > 0 ? 'Compromised credentials found' : 'No breaches detected'}
              </div>
            </div>

            <div className="bg-black/20 border border-orange-500/20 rounded-xl p-4 backdrop-blur-sm hover:border-orange-500/40 transition-all cursor-pointer">
              <div className="text-sm text-orange-400 mb-2 flex items-center justify-between">
                <span>CVE Matches</span>
                {intelligence?.cves?.length === 0 && <span className="text-xs text-green-400">✓ Clean</span>}
              </div>
              <div className="text-2xl font-bold text-orange-400">
                {intelligence?.cves?.length || 0}
              </div>
              <div className="text-xs text-gray-400">
                {intelligence?.cves?.length > 0 ? 'Known vulnerabilities found' : 'No known CVEs detected'}
              </div>
            </div>

            <div className="bg-black/20 border border-yellow-500/20 rounded-xl p-4 backdrop-blur-sm hover:border-yellow-500/40 transition-all cursor-pointer">
              <div className="text-sm text-yellow-400 mb-2 flex items-center justify-between">
                <span>Threat Indicators</span>
                {intelligence?.threats?.length === 0 && <span className="text-xs text-green-400">✓ Clean</span>}
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                {intelligence?.threats?.length || 0}
              </div>
              <div className="text-xs text-gray-400">
                {intelligence?.threats?.length > 0 ? 'Suspicious IPs/domains found' : 'No threats detected'}
              </div>
            </div>

            <div className="bg-black/20 border border-purple-500/20 rounded-xl p-4 backdrop-blur-sm hover:border-purple-500/40 transition-all cursor-pointer">
              <div className="text-sm text-purple-400 mb-2 flex items-center justify-between">
                <span>AI Recommendations</span>
                {intelligence?.recommendations?.length > 0 && <span className="text-xs text-purple-300">New</span>}
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {intelligence?.recommendations?.length || 0}
              </div>
              <div className="text-xs text-gray-400">
                {intelligence?.recommendations?.length > 0 ? 'Security actions available' : 'No actions needed'}
              </div>
            </div>
          </div>

          {expandedIntelligence && intelligence && (
            <div className="space-y-6">
              {/* Breach Data */}
              {intelligence.breaches && intelligence.breaches.length > 0 && (
                <div className="bg-black/20 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                    <h4 className="text-lg font-semibold text-white">Data Breaches Found</h4>
                  </div>
                  <div className="space-y-3">
                    {intelligence.breaches.map((breach: any, idx: number) => (
                      <div key={idx} className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-red-400 font-medium">{breach.email}</span>
                          <span className="text-xs text-red-300 bg-red-900/30 px-2 py-1 rounded">{breach.breachCount} breaches</span>
                        </div>
                        <p className="text-xs text-gray-300">{breach.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CVE Matches */}
              {intelligence.cves && intelligence.cves.length > 0 && (
                <div className="bg-black/20 border border-orange-500/20 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <BugAntIcon className="w-5 h-5 text-orange-400" />
                    <h4 className="text-lg font-semibold text-white">Known Vulnerabilities (CVEs)</h4>
                  </div>
                  <div className="space-y-3">
                    {intelligence.cves.slice(0, 5).map((cve: any, idx: number) => (
                      <div key={idx} className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-orange-400 font-mono text-sm">{cve.cveId}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            cve.severity === 'critical' ? 'bg-red-900/30 text-red-300' :
                            cve.severity === 'high' ? 'bg-orange-900/30 text-orange-300' :
                            'bg-yellow-900/30 text-yellow-300'
                          }`}>{cve.severity}</span>
                        </div>
                        <p className="text-xs text-gray-300 mb-2">{cve.summary}</p>
                        <p className="text-xs text-gray-400">Technology: {cve.technology}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Threat Indicators */}
              {intelligence.threats && intelligence.threats.length > 0 && (
                <div className="bg-black/20 border border-yellow-500/20 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <GlobeAltIcon className="w-5 h-5 text-yellow-400" />
                    <h4 className="text-lg font-semibold text-white">Threat Indicators</h4>
                  </div>
                  <div className="space-y-4">
                    {intelligence.threats.map((threat: any, idx: number) => {
                      const severityColor = threat.severity === 'critical' ? 'red' :
                                          threat.severity === 'high' ? 'orange' :
                                          threat.severity === 'medium' ? 'yellow' : 'blue';

                      return (
                        <div key={idx} className={`bg-${severityColor}-900/20 border border-${severityColor}-500/30 rounded-lg p-4`}>
                          {/* IP Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-mono text-base">{threat.value}</span>
                              {threat.type === 'ip-address' && (
                                <span className="text-xs text-gray-400">({threat.location})</span>
                              )}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded capitalize bg-${severityColor}-900/30 text-${severityColor}-300`}>
                              {threat.severity}
                            </span>
                          </div>

                          {/* IP Intelligence Grid */}
                          {threat.type === 'ip-address' && (
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              {/* AlienVault Data */}
                              {threat.alienVault && (
                                <div className="bg-black/30 rounded-lg p-3">
                                  <div className="text-xs text-gray-400 mb-2 font-semibold">🛡️ AlienVault OTX</div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-400">Status:</span>
                                      <span className={threat.alienVault.isMalicious ? 'text-red-400 font-bold' : 'text-green-400'}>
                                        {threat.alienVault.isMalicious ? 'MALICIOUS' : 'Clean'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-400">Threat Pulses:</span>
                                      <span className="text-white">{threat.alienVault.pulseCount}</span>
                                    </div>
                                    {threat.alienVault.pulses && threat.alienVault.pulses.length > 0 && (
                                      <div className="mt-2 text-xs">
                                        <span className="text-gray-400">Recent threats:</span>
                                        <div className="mt-1 space-y-1">
                                          {threat.alienVault.pulses.slice(0, 2).map((pulse: any, pIdx: number) => (
                                            <div key={pIdx} className="text-orange-400 truncate">• {pulse.name}</div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* IPQualityScore Data */}
                              {threat.ipQuality && (
                                <div className="bg-black/30 rounded-lg p-3">
                                  <div className="text-xs text-gray-400 mb-2 font-semibold">🔍 IP Quality Score</div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-400">Fraud Score:</span>
                                      <span className={`font-bold ${
                                        threat.ipQuality.fraudScore >= 75 ? 'text-red-400' :
                                        threat.ipQuality.fraudScore >= 50 ? 'text-yellow-400' : 'text-green-400'
                                      }`}>{threat.ipQuality.fraudScore}/100</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-400">Threat Level:</span>
                                      <span className="text-white capitalize">{threat.ipQuality.threatLevel}</span>
                                    </div>
                                    <div className="mt-2 space-y-1">
                                      {threat.ipQuality.isProxy && <div className="text-xs text-yellow-300">⚠️ Proxy Detected</div>}
                                      {threat.ipQuality.isVpn && <div className="text-xs text-yellow-300">🔒 VPN Detected</div>}
                                      {threat.ipQuality.isTor && <div className="text-xs text-red-300">🧅 Tor Exit Node</div>}
                                      {threat.ipQuality.isBot && <div className="text-xs text-orange-300">🤖 Bot Activity</div>}
                                      {threat.ipQuality.isRecentAbuse && <div className="text-xs text-red-300">📛 Recent Abuse</div>}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Recommendation */}
                          <div className="bg-black/20 rounded-lg p-3 mt-3">
                            <div className="text-xs text-gray-400 mb-1 font-semibold">Recommendation:</div>
                            <p className="text-xs text-gray-300 whitespace-pre-line">{threat.recommendation}</p>
                          </div>

                          {/* Domain-specific info */}
                          {threat.type === 'domain' && threat.certificates !== undefined && (
                            <div className="text-xs text-gray-400 mt-2">
                              Certificates: {threat.certificates} active
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No Intelligence Data */}
              {(!intelligence.breaches || intelligence.breaches.length === 0) &&
               (!intelligence.cves || intelligence.cves.length === 0) &&
               (!intelligence.threats || intelligence.threats.length === 0) && (
                <div className="bg-black/20 border border-green-500/20 rounded-xl p-6 backdrop-blur-sm text-center">
                  <ShieldCheckIcon className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <h4 className="text-lg font-semibold text-white mb-2">No Threats Detected</h4>
                  <p className="text-sm text-gray-400">External threat intelligence didn't find any breaches, known CVEs, or threat indicators in your latest scan.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
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
              {/* Name and Description Section */}
              {((selectedSession as any).name || (selectedSession as any).description) && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  {(selectedSession as any).name && (
                    <h4 className="text-xl font-bold text-white mb-2">{(selectedSession as any).name}</h4>
                  )}
                  {(selectedSession as any).description && (
                    <p className="text-sm text-gray-300 leading-relaxed">{(selectedSession as any).description}</p>
                  )}
                </div>
              )}

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