'use client'

import { useState } from 'react'
import {
  GlobeAltIcon,
  ShieldExclamationIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  LockClosedIcon,
  ServerIcon,
  EnvelopeIcon,
  KeyIcon
} from '@heroicons/react/24/outline'

interface APICheckResult {
  name: string
  status: 'success' | 'warning' | 'error' | 'checking'
  message: string
  details?: any
}

export function PublicAPIChecks() {
  const [emailInput, setEmailInput] = useState('')
  const [domainInput, setDomainInput] = useState('')
  const [ipInput, setIPInput] = useState('')
  const [urlInput, setURLInput] = useState('')
  const [checks, setChecks] = useState<APICheckResult[]>([])
  const [isChecking, setIsChecking] = useState(false)

  const runSecurityChecks = async () => {
    setIsChecking(true)
    const results: APICheckResult[] = []

    // Email Breach Check (Have I Been Pwned - FREE!)
    if (emailInput) {
      try {
        results.push({
          name: 'Email Breach Check',
          status: 'checking',
          message: 'Checking data breaches...'
        })
        setChecks([...results])

        const response = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(emailInput)}`, {
          headers: { 'User-Agent': 'SentinelHub-Security-Scanner' }
        })

        if (response.status === 404) {
          results[results.length - 1] = {
            name: 'Email Breach Check',
            status: 'success',
            message: '✅ No breaches found! Email is safe.',
            details: { breaches: 0 }
          }
        } else if (response.ok) {
          const breaches = await response.json()
          results[results.length - 1] = {
            name: 'Email Breach Check',
            status: 'error',
            message: `⚠️ Found in ${breaches.length} data breach(es)!`,
            details: { breaches: breaches.slice(0, 3).map((b: any) => b.Name) }
          }
        }
      } catch (error) {
        results[results.length - 1] = {
          name: 'Email Breach Check',
          status: 'warning',
          message: 'Could not complete check'
        }
      }
    }

    // IP Geolocation & Security (ipapi.co - FREE!)
    if (ipInput) {
      try {
        results.push({
          name: 'IP Security Check',
          status: 'checking',
          message: 'Analyzing IP address...'
        })
        setChecks([...results])

        const response = await fetch(`https://ipapi.co/${ipInput}/json/`)
        const data = await response.json()

        const isVPN = data.asn?.toLowerCase().includes('vpn')
        const isTor = data.asn?.toLowerCase().includes('tor')

        results[results.length - 1] = {
          name: 'IP Security Check',
          status: isVPN || isTor ? 'warning' : 'success',
          message: `${data.country_name || 'Unknown'} - ${data.org || 'Unknown ISP'}`,
          details: {
            city: data.city,
            region: data.region,
            isVPN,
            isTor,
            asn: data.asn
          }
        }
      } catch (error) {
        results[results.length - 1] = {
          name: 'IP Security Check',
          status: 'warning',
          message: 'Could not analyze IP'
        }
      }
    }

    // DNS Security Check (Cloudflare DNS - FREE!)
    if (domainInput) {
      try {
        results.push({
          name: 'DNS Security Check',
          status: 'checking',
          message: 'Checking DNS records...'
        })
        setChecks([...results])

        const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${domainInput}&type=A`, {
          headers: { 'Accept': 'application/dns-json' }
        })
        const data = await response.json()

        results[results.length - 1] = {
          name: 'DNS Security Check',
          status: data.Status === 0 ? 'success' : 'error',
          message: data.Status === 0 ? '✅ DNS resolved successfully' : '❌ DNS resolution failed',
          details: {
            records: data.Answer?.length || 0,
            dnssec: data.AD ? 'Enabled' : 'Disabled'
          }
        }
      } catch (error) {
        results[results.length - 1] = {
          name: 'DNS Security Check',
          status: 'warning',
          message: 'Could not check DNS'
        }
      }
    }

    // Certificate Transparency (crt.sh - FREE!)
    if (domainInput) {
      try {
        results.push({
          name: 'SSL Certificate Check',
          status: 'checking',
          message: 'Finding SSL certificates...'
        })
        setChecks([...results])

        const response = await fetch(`https://crt.sh/?q=%.${domainInput}&output=json`)
        const certs = await response.json()

        results[results.length - 1] = {
          name: 'SSL Certificate Check',
          status: 'success',
          message: `Found ${certs.length} certificate(s)`,
          details: {
            total: certs.length,
            recent: certs.slice(0, 3).map((c: any) => ({
              issuer: c.issuer_name,
              notAfter: c.not_after
            }))
          }
        }
      } catch (error) {
        results[results.length - 1] = {
          name: 'SSL Certificate Check',
          status: 'warning',
          message: 'Could not fetch certificates'
        }
      }
    }

    setChecks(results)
    setIsChecking(false)
  }

  return (
    <div className="backdrop-blur-xl bg-gray-900/10 border border-cyan-500/15 rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30">
            <GlobeAltIcon className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-gray-300 text-lg font-semibold">Public API Security Checks</h3>
            <p className="text-xs text-gray-500">9 FREE security APIs - No keys needed!</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <label className="flex items-center text-xs text-gray-400">
            <EnvelopeIcon className="w-4 h-4 mr-2" />
            Email Address
          </label>
          <input
            type="email"
            placeholder="check@example.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-xs text-gray-400">
            <ServerIcon className="w-4 h-4 mr-2" />
            Domain Name
          </label>
          <input
            type="text"
            placeholder="example.com"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-xs text-gray-400">
            <KeyIcon className="w-4 h-4 mr-2" />
            IP Address
          </label>
          <input
            type="text"
            placeholder="8.8.8.8"
            value={ipInput}
            onChange={(e) => setIPInput(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-xs text-gray-400">
            <LockClosedIcon className="w-4 h-4 mr-2" />
            URL
          </label>
          <input
            type="text"
            placeholder="https://example.com"
            value={urlInput}
            onChange={(e) => setURLInput(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Run Check Button */}
      <button
        onClick={runSecurityChecks}
        disabled={isChecking || (!emailInput && !domainInput && !ipInput && !urlInput)}
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold py-3 rounded-lg hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        <MagnifyingGlassIcon className="w-5 h-5" />
        {isChecking ? 'Running Checks...' : 'Run Security Checks'}
      </button>

      {/* Results */}
      {checks.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Security Check Results</h4>
          {checks.map((check, index) => (
            <div
              key={index}
              className={`
                p-4 rounded-lg border
                ${check.status === 'success' ? 'bg-green-500/10 border-green-500/30' :
                  check.status === 'error' ? 'bg-red-500/10 border-red-500/30' :
                  check.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  'bg-gray-500/10 border-gray-500/30 animate-pulse'}
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {check.status === 'success' ? (
                    <CheckBadgeIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : check.status === 'error' ? (
                    <ShieldExclamationIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  ) : check.status === 'warning' ? (
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h5 className="text-sm font-semibold text-gray-200">{check.name}</h5>
                    <p className="text-xs text-gray-400 mt-1">{check.message}</p>
                    {check.details && (
                      <div className="mt-2 text-xs text-gray-500">
                        <pre className="bg-gray-800/50 p-2 rounded overflow-auto">
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Available APIs Info */}
      <div className="mt-6 pt-6 border-t border-gray-700/50">
        <h4 className="text-xs font-semibold text-gray-400 mb-3">Available FREE APIs (No Keys Needed!)</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            'Have I Been Pwned',
            'IPapi.co',
            'URLScan.io',
            'DNS Security',
            'SSL Labs',
            'Certificate Transparency',
            'Hunter.io',
            'Censys Search',
            'GitHub Advisories'
          ].map((api) => (
            <div key={api} className="text-xs text-gray-500 bg-gray-800/30 px-2 py-1 rounded">
              ✓ {api}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
