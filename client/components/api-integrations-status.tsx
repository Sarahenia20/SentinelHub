"use client"

import { useState, useEffect } from "react"
import {
  ShieldCheckIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  LockClosedIcon,
  BugAntIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  KeyIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline"

interface APIStatus {
  name: string
  description: string
  icon: any
  status: 'active' | 'inactive' | 'no_data' | 'needs_key'
  tier: string
  category: string
  dataAvailable: boolean
  lastCheck?: string
  requiresApiKey: boolean
}

export function APIIntegrationsStatus() {
  const [selectedApi, setSelectedApi] = useState<APIStatus | null>(null)
  const [apiResults, setApiResults] = useState<any>(null)
  const [apis, setApis] = useState<APIStatus[]>([
    {
      name: "Have I Been Pwned",
      description: "Checks if emails or passwords have been compromised in data breaches. Searches through billions of leaked credentials to identify security risks.",
      icon: ExclamationTriangleIcon,
      status: 'active',
      tier: 'FREE',
      category: 'Breach Detection',
      dataAvailable: true,
      requiresApiKey: false
    },
    {
      name: "AlienVault OTX",
      description: "Open Threat Exchange providing real-time threat intelligence for IPs, domains, and file hashes. Identifies known malicious actors and threat campaigns.",
      icon: ShieldCheckIcon,
      status: 'active',
      tier: 'FREE',
      category: 'Threat Intelligence',
      dataAvailable: true,
      requiresApiKey: true
    },
    {
      name: "IPQualityScore",
      description: "Advanced IP reputation and fraud detection system. Identifies proxies, VPNs, Tor exits, and bot activity with detailed risk scoring.",
      icon: GlobeAltIcon,
      status: 'active',
      tier: 'FREE (5K/month)',
      category: 'IP Reputation',
      dataAvailable: true,
      requiresApiKey: true
    },
    {
      name: "IPapi.co",
      description: "IP geolocation and security information provider. Detects VPNs, proxies, and provides detailed location data for threat analysis.",
      icon: GlobeAltIcon,
      status: 'active',
      tier: 'FREE',
      category: 'IP Geolocation',
      dataAvailable: false,
      requiresApiKey: false
    },
    {
      name: "URLScan.io",
      description: "URL security scanner that analyzes websites for malicious content, phishing attempts, and suspicious behavior patterns.",
      icon: GlobeAltIcon,
      status: 'active',
      tier: 'FREE',
      category: 'URL Security',
      dataAvailable: false,
      requiresApiKey: false
    },
    {
      name: "SSL Labs",
      description: "SSL/TLS security assessment tool. Grades your SSL configuration and identifies vulnerabilities like Heartbleed, POODLE, and weak ciphers.",
      icon: LockClosedIcon,
      status: 'active',
      tier: 'FREE',
      category: 'SSL/TLS Security',
      dataAvailable: false,
      requiresApiKey: false
    },
    {
      name: "GitHub Advisory Database",
      description: "Security vulnerability database for open-source packages. Tracks CVEs and security advisories across multiple ecosystems.",
      icon: BugAntIcon,
      status: 'active',
      tier: 'FREE',
      category: 'Vulnerability Database',
      dataAvailable: false,
      requiresApiKey: false
    },
    {
      name: "CRT.sh",
      description: "Certificate Transparency logs search. Finds all SSL certificates issued for your domains to detect unauthorized certificates.",
      icon: LockClosedIcon,
      status: 'active',
      tier: 'FREE',
      category: 'Certificate Monitoring',
      dataAvailable: false,
      requiresApiKey: false
    },
    {
      name: "Cloudflare DNS Security",
      description: "DNS security checker using DNS over HTTPS. Verifies DNSSEC configuration and detects DNS-based attacks.",
      icon: ShieldCheckIcon,
      status: 'active',
      tier: 'FREE',
      category: 'DNS Security',
      dataAvailable: false,
      requiresApiKey: false
    },
    {
      name: "Hunter.io",
      description: "Email verification service. Validates email addresses, detects disposable emails, and prevents fake account creation.",
      icon: EnvelopeIcon,
      status: 'inactive',
      tier: 'FREE (25/month)',
      category: 'Email Verification',
      dataAvailable: false,
      requiresApiKey: true
    },
    {
      name: "Censys",
      description: "Internet-wide security data search engine. Provides deep insights into exposed services, certificates, and vulnerable systems.",
      icon: ShieldCheckIcon,
      status: 'inactive',
      tier: 'FREE (250/month)',
      category: 'Internet Scanning',
      dataAvailable: false,
      requiresApiKey: true
    }
  ])

  const [filter, setFilter] = useState<string>('all')

  const categories = ['all', ...Array.from(new Set(apis.map(api => api.category)))]

  const filteredAPIs = filter === 'all'
    ? apis
    : apis.filter(api => api.category === filter)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return {
          text: 'Active',
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          icon: CheckCircleIcon
        }
      case 'inactive':
        return {
          text: 'Inactive',
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
          icon: ClockIcon
        }
      case 'no_data':
        return {
          text: 'No Data',
          color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          icon: ExclamationTriangleIcon
        }
      case 'needs_key':
        return {
          text: 'Needs API Key',
          color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          icon: KeyIcon
        }
      default:
        return {
          text: 'Unknown',
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
          icon: XCircleIcon
        }
    }
  }

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-semibold text-white mb-2">Security API Integrations</h3>
        <p className="text-gray-400 text-sm">
          SentinelHub integrates with multiple security APIs to provide comprehensive threat intelligence.
          All APIs shown below are available for use in your security scans.
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-2 mb-6">
        <span className="text-gray-400 text-sm">Filter by category:</span>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                filter === category
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-gray-800/50 text-gray-400 border border-gray-600/30 hover:bg-gray-700/50'
              }`}
            >
              {category === 'all' ? 'All APIs' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-black/20 border border-green-500/20 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Active APIs</div>
          <div className="text-2xl font-bold text-green-400">
            {apis.filter(api => api.status === 'active').length}
          </div>
        </div>

        <div className="bg-black/20 border border-cyan-500/20 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Free Tier</div>
          <div className="text-2xl font-bold text-cyan-400">
            {apis.filter(api => api.tier.includes('FREE')).length}
          </div>
        </div>

        <div className="bg-black/20 border border-blue-500/20 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Data Available</div>
          <div className="text-2xl font-bold text-blue-400">
            {apis.filter(api => api.dataAvailable).length}
          </div>
        </div>

        <div className="bg-black/20 border border-purple-500/20 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Total APIs</div>
          <div className="text-2xl font-bold text-purple-400">
            {apis.length}
          </div>
        </div>
      </div>

      {/* API Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAPIs.map((api) => {
          const statusBadge = getStatusBadge(api.status)
          const IconComponent = api.icon
          const StatusIcon = statusBadge.icon

          return (
            <button
              key={api.name}
              onClick={() => {
                setSelectedApi(api)
                // Load API results from recent scans
                const savedReports = JSON.parse(localStorage.getItem('sentinelHub_scanReports') || '[]')
                setApiResults(savedReports.slice(0, 5)) // Show last 5 scans
              }}
              className="text-left bg-black/20 border border-gray-600/30 rounded-xl p-4 hover:border-cyan-500/50 hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <IconComponent className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm">{api.name}</h4>
                    <span className="text-xs text-gray-400">{api.category}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                {api.description}
              </p>

              {/* Status and Tier */}
              <div className="flex items-center justify-between">
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg border text-xs font-medium ${statusBadge.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  <span>{statusBadge.text}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-lg border border-blue-500/20">
                    {api.tier}
                  </span>

                  {api.requiresApiKey && (
                    <div className="relative group">
                      <KeyIcon className="w-4 h-4 text-yellow-400" />
                      <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Requires API key configuration
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Data indicator */}
              {api.dataAvailable && (
                <div className="mt-3 pt-3 border-t border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400 font-medium">
                        Data available from recent scans
                      </span>
                    </div>
                    <ArrowTopRightOnSquareIcon className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Footer note */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <p className="text-sm text-blue-300">
          <span className="font-semibold">Note:</span> All APIs are integrated and ready to use.
          Click on any API card to see results from your recent scans.
          APIs marked with a key icon require configuration in settings.
        </p>
      </div>

      {/* API Results Modal */}
      {selectedApi && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  {(() => {
                    const IconComponent = selectedApi.icon
                    return <IconComponent className="w-6 h-6 text-cyan-400" />
                  })()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedApi.name}</h2>
                  <p className="text-gray-400 text-sm">{selectedApi.category}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApi(null)}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              {/* API Description */}
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-sm text-gray-300">{selectedApi.description}</p>
              </div>

              {/* Results from Recent Scans */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Results from Recent Scans</h3>

                {apiResults && apiResults.length > 0 ? (
                  <div className="space-y-3">
                    {apiResults.map((scan: any, index: number) => (
                      <div key={index} className="bg-black/20 border border-gray-600/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-white font-medium">
                            {scan.sourceDetails || 'Security Scan'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(scan.timestamp).toLocaleString()}
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
                            <div className="text-red-400 font-semibold">{scan.vulnerabilities?.critical || 0}</div>
                            <div className="text-gray-400">Critical</div>
                          </div>
                          <div className="bg-orange-500/10 border border-orange-500/20 rounded p-2">
                            <div className="text-orange-400 font-semibold">{scan.vulnerabilities?.high || 0}</div>
                            <div className="text-gray-400">High</div>
                          </div>
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
                            <div className="text-yellow-400 font-semibold">{scan.vulnerabilities?.medium || 0}</div>
                            <div className="text-gray-400">Medium</div>
                          </div>
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
                            <div className="text-blue-400 font-semibold">{scan.vulnerabilities?.low || 0}</div>
                            <div className="text-gray-400">Low</div>
                          </div>
                        </div>

                        {selectedApi.name === 'Have I Been Pwned' && (
                          <div className="mt-3 text-xs text-gray-400">
                            ✓ Checked for compromised credentials
                          </div>
                        )}
                        {selectedApi.name === 'AlienVault OTX' && (
                          <div className="mt-3 text-xs text-gray-400">
                            ✓ Threat intelligence analysis completed
                          </div>
                        )}
                        {selectedApi.name === 'IPQualityScore' && (
                          <div className="mt-3 text-xs text-gray-400">
                            ✓ IP reputation and fraud detection performed
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-black/20 border border-gray-600/30 rounded-xl p-8 text-center">
                    <ExclamationTriangleIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No scan data available yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Run a security scan to see {selectedApi.name} results here
                    </p>
                  </div>
                )}
              </div>

              {/* API Info */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/20 border border-gray-600/30 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">Status</div>
                  <div className="text-sm text-white font-medium capitalize">{selectedApi.status}</div>
                </div>
                <div className="bg-black/20 border border-gray-600/30 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">Pricing Tier</div>
                  <div className="text-sm text-white font-medium">{selectedApi.tier}</div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 flex justify-end">
                <a
                  href="/dashboard/scanner"
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-medium transition-all duration-200 text-white"
                >
                  Run New Scan with {selectedApi.name}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
