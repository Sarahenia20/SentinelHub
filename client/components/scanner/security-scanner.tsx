"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  PlayIcon, 
  StopIcon, 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CommandLineIcon,
  BugAntIcon,
  KeyIcon,
  ServerIcon,
  CloudIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CodeBracketIcon,
  BeakerIcon,
  DocumentMagnifyingGlassIcon,
  CpuChipIcon
} from "@heroicons/react/24/outline"

interface ScanResult {
  id: string
  type: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  file?: string
  line?: number
  engine: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}

export function SecurityScanner() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'scanner' | 'results'>('scanner')
  const [scanType, setScanType] = useState<'code' | 'docker' | 'cloud' | 'secrets'>('code')
  const [codeInput, setCodeInput] = useState(`function authenticateUser(username, password) {
  const query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'";
  const apiKey = "sk-1234567890abcdef";
  return db.query(query);
}`)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [resultsPerPage] = useState(5)
  const [savedReports, setSavedReports] = useState<ScanResult[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'ai',
      content: "SentinelHub Terminal v2.1.0\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nSecurity analysis initialized. Ready to scan your code, containers, cloud configs, and secrets.\n\nType 'help' for commands or paste code to begin analysis.",
      timestamp: new Date()
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const engines = [
    { name: 'Semgrep', icon: BugAntIcon, status: 'idle' },
    { name: 'GitGuardian', icon: KeyIcon, status: 'idle' },
    { name: 'CodeRabbit', icon: CommandLineIcon, status: 'idle' },
    { name: 'Docker Bench', icon: ServerIcon, status: 'idle' },
    { name: 'Grafana Security', icon: CloudIcon, status: 'idle' }
  ]

  const startScan = () => {
    if (!codeInput.trim()) return
    setIsScanning(true)
    setScanResults([])
    
    setTimeout(() => {
      const results: ScanResult[] = [
        {
          id: '1',
          type: 'critical',
          title: 'SQL Injection Vulnerability',
          description: 'User input directly concatenated into SQL query without parameterization',
          file: 'auth.js',
          line: 2,
          engine: 'Semgrep'
        },
        {
          id: '2',
          type: 'high',
          title: 'Hardcoded API Key',
          description: 'API key detected in source code',
          file: 'auth.js',
          line: 3,
          engine: 'GitGuardian'
        }
      ]
      setScanResults(results)
      setIsScanning(false)
      
      setTimeout(() => {
        const analysis: ChatMessage = {
          id: Date.now().toString(),
          role: 'ai',
          content: `Analysis complete. Found ${results.length} security issues:\n\n- Critical SQL injection on line 2\n- High-risk hardcoded secret on line 3\n\nWould you like specific remediation steps for any of these vulnerabilities?`,
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, analysis])
      }, 1000)
    }, 3000)
  }

  const sendMessage = () => {
    if (!chatInput.trim()) return
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    }
    
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsTyping(true)
    
    setTimeout(() => {
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: generateResponse(chatInput),
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, response])
      setIsTyping(false)
    }, 1500)
  }

  const generateResponse = (input: string): string => {
    const lower = input.toLowerCase()
    const contextInfo = `\n\nCONTEXT_DATA\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nScan Type: ${scanType.toUpperCase()}\nActive Tab: ${activeTab.toUpperCase()}\nVulnerabilities Found: ${scanResults.length}\nSecurity Score: ${securityScore}/100`
    
    if (lower.includes('help')) {
      return `SENTINELHUB_AI HELP SYSTEM\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nAvailable Commands:\n• explain <vulnerability> - Get detailed explanations\n• fix <issue> - Receive remediation steps\n• analyze <code> - Security code review\n• report - Generate security summary\n• context - View current scan context\n\nExample Queries:\n> explain sql injection\n> fix hardcoded secrets\n> analyze authentication flow${contextInfo}`
    }
    
    if (lower.includes('context')) {
      return `SCAN_CONTEXT_ANALYSIS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nCurrent Configuration:\n• Scan Type: ${scanType.toUpperCase()}\n• Active Tab: ${activeTab.toUpperCase()}\n• Results: ${scanResults.length} vulnerabilities\n• Security Score: ${securityScore}/100\n• Engines: ${engines.map(e => e.name).join(', ')}\n\n${scanResults.length > 0 ? 'Threats Detected:\n' + scanResults.map(r => `• ${r.type.toUpperCase()}: ${r.title}`).join('\n') : 'No active threats detected.'}`
    }
    
    if (lower.includes('fix') || lower.includes('how')) {
      if (scanResults.length > 0) {
        const critical = scanResults.find(r => r.type === 'critical')
        if (critical) {
          return `REMEDIATION_PROTOCOL\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nCRITICAL: ${critical.title}\n\nFix for SQL Injection:\n1. Replace string concatenation with parameterized queries\n2. Use prepared statements\n3. Implement input validation\n4. Apply principle of least privilege\n\nSecure Code Example:\nconst query = "SELECT * FROM users WHERE username=$1 AND password=$2"\nconst result = await db.query(query, [username, hashedPassword])\n\nStatus: IMMEDIATE_ACTION_REQUIRED${contextInfo}`
        }
      }
      return `GENERAL_REMEDIATION_GUIDE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nSecurity Best Practices:\n• Use parameterized queries for SQL\n• Never hardcode secrets in code\n• Implement proper authentication\n• Validate all user inputs\n• Use HTTPS for data transmission\n• Regular security audits\n\nRun a scan first to get specific fixes.${contextInfo}`
    }
    
    if (lower.includes('explain')) {
      if (scanResults.length > 0) {
        const vuln = scanResults[0]
        return `VULNERABILITY_ANALYSIS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${vuln.title.toUpperCase()}\nSeverity: ${vuln.type.toUpperCase()}\nEngine: ${vuln.engine}\n\nThreat Vector:\nSQL injection occurs when untrusted user input is directly inserted into SQL queries without proper sanitization.\n\nExploit Example:\nInput: admin' OR '1'='1' --\nResult: Bypasses authentication entirely\n\nImpact Assessment:\n• Data breach potential: HIGH\n• System compromise: POSSIBLE\n• Compliance violations: LIKELY${contextInfo}`
      }
      return `GENERAL_SECURITY_EXPLANATION\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nCommon Vulnerabilities:\n• SQL Injection - Database manipulation\n• XSS - Client-side code execution\n• CSRF - Unauthorized actions\n• Secrets Exposure - Credential leaks\n• Buffer Overflow - Memory corruption\n\nRun a scan to get specific explanations.${contextInfo}`
    }
    
    if (lower.includes('report')) {
      return `SECURITY_ASSESSMENT_REPORT\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nScan Summary:\n• Total Issues: ${scanResults.length}\n• Critical: ${scanResults.filter(r => r.type === 'critical').length}\n• High: ${scanResults.filter(r => r.type === 'high').length}\n• Medium: ${scanResults.filter(r => r.type === 'medium').length}\n• Low: ${scanResults.filter(r => r.type === 'low').length}\n\nSecurity Posture: ${securityScore >= 80 ? 'GOOD' : securityScore >= 60 ? 'MODERATE' : 'CRITICAL'}\nRecommendation: ${scanResults.length === 0 ? 'Continue monitoring' : 'Address critical issues first'}${contextInfo}`
    }
    
    return `SENTINELHUB_AI READY\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nI'm your security analysis assistant. I can:\n• Explain vulnerabilities in detail\n• Provide specific remediation steps\n• Analyze code for security issues\n• Generate security reports\n\nTry: 'help' | 'explain <topic>' | 'fix <issue>' | 'context'${contextInfo}`
  }

  const getSeverityColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-red-400 bg-red-900/20 border-red-500/30'
      case 'high': return 'text-orange-400 bg-orange-900/20 border-orange-500/30'
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30'
      case 'low': return 'text-blue-400 bg-blue-900/20 border-blue-500/30'
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30'
    }
  }

  const criticalCount = scanResults.filter(r => r.type === 'critical').length
  const highCount = scanResults.filter(r => r.type === 'high').length
  const securityScore = scanResults.length === 0 ? 0 : Math.max(20, 100 - (criticalCount * 30 + highCount * 20))

  const scanTypeOptions = [
    { type: 'code' as const, name: 'Code Analysis', icon: CodeBracketIcon, description: 'Scan source code for vulnerabilities' },
    { type: 'docker' as const, name: 'Container Scan', icon: ServerIcon, description: 'Docker security analysis' },
    { type: 'cloud' as const, name: 'Cloud Config', icon: CloudIcon, description: 'Infrastructure as Code security' },
    { type: 'secrets' as const, name: 'Secret Detection', icon: KeyIcon, description: 'Find exposed credentials' }
  ]

  const tabs = [
    { id: 'scanner' as const, name: 'Scanner', icon: DocumentMagnifyingGlassIcon },
    { id: 'results' as const, name: 'Live Results', icon: BeakerIcon }
  ]

  // Pagination logic
  const indexOfLastResult = currentPage * resultsPerPage
  const indexOfFirstResult = indexOfLastResult - resultsPerPage
  const currentResults = scanResults.slice(indexOfFirstResult, indexOfLastResult)
  const totalPages = Math.ceil(scanResults.length / resultsPerPage)

  const saveReport = () => {
    if (scanResults.length > 0) {
      // Save to localStorage for SecurityReports page
      const savedReports = JSON.parse(localStorage.getItem('sentinelHub_scanReports') || '[]')
      const newReport = {
        id: `scan-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: scanType,
        sourceDetails: scanType === 'code' ? 'User submitted code' : `${scanType} scan`,
        vulnerabilities: {
          critical: scanResults.filter(r => r.type === 'critical').length,
          high: scanResults.filter(r => r.type === 'high').length,
          medium: scanResults.filter(r => r.type === 'medium').length,
          low: scanResults.filter(r => r.type === 'low').length
        },
        engines: engines.map(e => e.name),
        status: 'completed',
        duration: '2m 15s'
      }
      savedReports.unshift(newReport)
      localStorage.setItem('sentinelHub_scanReports', JSON.stringify(savedReports))
      
      // Navigate to SecurityReports
      router.push('/dashboard/reports')
      
      // Add success message to chat
      const successMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'ai',
        content: "REPORT_SAVED\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nScan results have been saved to reports archive.\nRedirecting to Security Reports dashboard.\n\n> report_id: " + newReport.id,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, successMsg])
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-1.5">
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/30'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mr-2" />
                    {tab.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'scanner' && (
              <>
                {/* Scan Type Selection */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-cyan-400/30 transition-all duration-300">
                  <h3 className="text-lg font-medium text-white mb-4">Select Scan Type</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {scanTypeOptions.map((option) => {
                      const IconComponent = option.icon
                      return (
                        <button
                          key={option.type}
                          onClick={() => setScanType(option.type)}
                          className={`p-4 rounded-xl border transition-all duration-200 ${
                            scanType === option.type
                              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                              : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          <IconComponent className="w-6 h-6 mx-auto mb-2" />
                          <div className="text-sm font-medium">{option.name}</div>
                          <div className="text-xs text-gray-400 mt-1">{option.description}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Code Input - Terminal Style */}
                <div className="backdrop-blur-xl bg-white/5 border border-blue-500/20 rounded-2xl p-6 hover:border-blue-400/40 transition-all duration-300 font-mono">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="flex space-x-2 mr-4">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      </div>
                      <span className="text-blue-400 text-sm">root@sentinelhub:~$ </span>
                      <span className="text-white text-sm">nano security_analysis.{scanType}</span>
                    </div>
                  </div>
                  <textarea
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="# Paste your code here for security analysis...
# Terminal ready for input
# Available engines: Semgrep, GitGuardian, CodeRabbit, Docker Bench, Grafana Security"
                    className="w-full h-80 bg-black/20 border border-blue-400/20 rounded-xl px-4 py-3 text-blue-300 placeholder-blue-700/60 focus:outline-none font-mono text-sm resize-none"
                    spellCheck={false}
                  />
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex gap-3">
                      <button
                        onClick={startScan}
                        disabled={isScanning || !codeInput.trim()}
                        className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600/80 to-cyan-600/80 hover:from-blue-500/80 hover:to-cyan-500/80 disabled:from-gray-600/50 disabled:to-gray-700/50 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 border border-blue-500/30 backdrop-blur-sm"
                      >
                        {isScanning ? (
                          <>
                            <div className="w-5 h-5 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <PlayIcon className="w-5 h-5 mr-2" />
                            Execute Scan
                          </>
                        )}
                      </button>
                      {isScanning && (
                        <button
                          onClick={() => setIsScanning(false)}
                          className="flex items-center px-6 py-3 bg-red-600/80 hover:bg-red-500/80 rounded-xl font-medium transition-all duration-200 border border-red-500/30 backdrop-blur-sm"
                        >
                          <StopIcon className="w-5 h-5 mr-2" />
                          Kill Process
                        </button>
                      )}
                    </div>
                    {scanResults.length > 0 && (
                      <button
                        onClick={saveReport}
                        className="flex items-center px-4 py-3 bg-blue-600/80 hover:bg-blue-500/80 rounded-xl font-medium transition-all duration-200 border border-blue-500/30 backdrop-blur-sm"
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        Save Report
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Security Engines Status */}
            {isScanning && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Security Engines</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {engines.map((engine, index) => {
                    const IconComponent = engine.icon
                    return (
                      <div key={engine.name} className="flex items-center space-x-3 p-3 bg-black/20 border border-cyan-500/20 rounded-xl">
                        <IconComponent className="w-5 h-5 text-cyan-400" />
                        <div className="flex-1">
                          <div className="text-white font-medium text-sm">{engine.name}</div>
                          <div className="text-cyan-400 text-xs">Analyzing...</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Live Results Tab */}
            {activeTab === 'results' && scanResults.length > 0 && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <ExclamationTriangleIcon className="w-6 h-6 mr-2 text-yellow-400" />
                    Live Vulnerabilities ({scanResults.length})
                  </h3>
                  <button
                    onClick={saveReport}
                    className="flex items-center px-4 py-2 bg-blue-600/80 hover:bg-blue-500/80 rounded-xl font-medium transition-all duration-200 border border-blue-500/30 backdrop-blur-sm"
                  >
                    <EyeIcon className="w-4 h-4 mr-2" />
                    Save All
                  </button>
                </div>
                
                {/* Results with Pagination */}
                <div className="space-y-4 mb-6">
                  {currentResults.map((result) => (
                    <div key={result.id} className={`border rounded-2xl p-6 transition-all duration-200 backdrop-blur-sm ${getSeverityColor(result.type)}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg">{result.title}</h4>
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${getSeverityColor(result.type)}`}>
                          {result.type}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-4">{result.description}</p>
                      <div className="grid grid-cols-3 gap-4 text-sm bg-black/20 rounded-xl p-4">
                        <div>
                          <span className="text-gray-400">Engine:</span>
                          <span className="ml-2 text-white font-mono">{result.engine}</span>
                        </div>
                        {result.file && (
                          <div>
                            <span className="text-gray-400">File:</span>
                            <span className="ml-2 text-white font-mono">{result.file}</span>
                          </div>
                        )}
                        {result.line && (
                          <div>
                            <span className="text-gray-400">Line:</span>
                            <span className="ml-2 text-white font-mono">{result.line}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-4">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-gray-600/20 disabled:opacity-50 rounded-xl transition-all duration-200 border border-white/10"
                    >
                      <ChevronLeftIcon className="w-4 h-4 mr-1" />
                      Previous
                    </button>
                    
                    <div className="flex space-x-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-xl transition-all duration-200 ${
                            currentPage === page
                              ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300'
                              : 'bg-white/10 border border-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-gray-600/20 disabled:opacity-50 rounded-xl transition-all duration-200 border border-white/10"
                    >
                      Next
                      <ChevronRightIcon className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            )}


            {activeTab === 'results' && scanResults.length === 0 && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <BeakerIcon className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">No Live Results</h3>
                <p className="text-gray-400">Run a scan to see live vulnerability detection results here.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Security Score */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <ShieldCheckIcon className="w-6 h-6 mr-2 text-green-400" />
                Security Score
              </h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-400 mb-2">
                  {scanResults.length === 0 ? '--' : securityScore}
                </div>
                <div className="text-gray-400 text-sm">
                  {scanResults.length === 0 ? 'Run scan to calculate' : `Based on ${scanResults.length} findings`}
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-3 mt-4">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500" 
                    style={{ width: scanResults.length === 0 ? '0%' : `${securityScore}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* AI Assistant */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <CpuChipIcon className="w-6 h-6 mr-2 text-blue-400" />
                AI Assistant
              </h3>
              
              <div className="h-80 bg-black/20 border border-blue-400/20 rounded-xl p-4 overflow-y-auto mb-4 space-y-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`${msg.role === 'user' ? 'ml-4' : 'mr-4'}`}>
                    <div className={`p-3 rounded-xl backdrop-blur-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100' 
                        : 'bg-white/10 border border-white/20 text-gray-100'
                    }`}>
                      <div className="flex items-center mb-1">
                        <span className="font-medium text-xs">
                          {msg.role === 'user' ? 'You' : 'AI Assistant'}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="mr-4">
                    <div className="bg-white/10 border border-white/20 text-gray-100 p-3 rounded-xl backdrop-blur-sm">
                      <div className="flex items-center">
                        <span className="font-medium text-xs">AI Assistant</span>
                        <div className="flex space-x-1 ml-2">
                          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about vulnerabilities..."
                  className="flex-1 bg-black/20 border border-blue-400/20 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!chatInput.trim() || isTyping}
                  className="px-4 py-2 bg-blue-600/80 hover:bg-blue-700/80 disabled:bg-gray-600/50 disabled:opacity-50 rounded-xl transition-colors border border-blue-500/30 backdrop-blur-sm"
                >
                  <PaperAirplaneIcon className="w-4 h-4 text-white" />
                </button>
              </div>
              
              <div className="mt-3 text-xs text-blue-400 opacity-60 text-center">
                Context: {scanType.toUpperCase()} | Active Tab: {activeTab.toUpperCase()} | Results: {scanResults.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}