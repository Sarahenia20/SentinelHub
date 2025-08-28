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
  const [scanType, setScanType] = useState<'code' | 'github' | 'aws' | 'docker'>('code')
  const [codeInput, setCodeInput] = useState(`function authenticateUser(username, password) {
  const query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'";
  const apiKey = "sk-1234567890abcdef";
  return db.query(query);
}`)
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [s3BucketUrl, setS3BucketUrl] = useState('')
  const [dockerImageUrl, setDockerImageUrl] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [resultsPerPage] = useState(5)
  const [savedReports, setSavedReports] = useState<ScanResult[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'ai',
      content: "Hi! Ready to help with your security analysis. Run a scan to get started.",
      timestamp: new Date()
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const engines = [
    { name: 'ESLint Security' },
    { name: 'Semgrep' },
    { name: 'Secret Scanner' },
    { name: 'Trivy' },
    { name: 'SonarQube' }
  ]

  const getEnginesForScanType = (type: string) => {
    switch (type) {
      case 'code':
        return [
          { name: 'Semgrep', icon: BugAntIcon, status: 'analyzing' },
          { name: 'ESLint Security', icon: CodeBracketIcon, status: 'analyzing' },
          { name: 'SonarQube', icon: ShieldCheckIcon, status: 'analyzing' },
          { name: 'CodeRabbit AI', icon: CpuChipIcon, status: 'analyzing' }
        ]
      case 'github':
        return [
          { name: 'Semgrep', icon: BugAntIcon, status: 'analyzing' },
          { name: 'CodeRabbit AI', icon: CpuChipIcon, status: 'analyzing' },
          { name: 'ESLint Security', icon: CodeBracketIcon, status: 'analyzing' },
          { name: 'SonarQube', icon: ShieldCheckIcon, status: 'analyzing' },
          { name: 'Secret Scanner', icon: KeyIcon, status: 'analyzing' }
        ]
      case 'aws':
        return [
          { name: 'AWS Config', icon: CloudIcon, status: 'analyzing' },
          { name: 'S3 Security', icon: ServerIcon, status: 'analyzing' },
          { name: 'IAM Analyzer', icon: ShieldCheckIcon, status: 'analyzing' },
          { name: 'CloudTrail', icon: EyeIcon, status: 'analyzing' }
        ]
      case 'docker':
        return [
          { name: 'Docker Bench', icon: ServerIcon, status: 'analyzing' },
          { name: 'Trivy Scanner', icon: ExclamationTriangleIcon, status: 'analyzing' },
          { name: 'Container Security', icon: ShieldCheckIcon, status: 'analyzing' },
          { name: 'Image Analyzer', icon: CpuChipIcon, status: 'analyzing' }
        ]
      default:
        return []
    }
  }

  const getInputValue = () => {
    switch (scanType) {
      case 'code': return codeInput
      case 'github': return repositoryUrl
      case 'aws': return s3BucketUrl
      case 'docker': return dockerImageUrl
      default: return ''
    }
  }

  const startScan = () => {
    const inputValue = getInputValue()
    if (!inputValue.trim()) return
    setIsScanning(true)
    setScanResults([])
    
    setTimeout(() => {
      const results: ScanResult[] = generateScanResults(scanType, inputValue)
      setScanResults(results)
      setIsScanning(false)
      
      setTimeout(() => {
        const analysis: ChatMessage = {
          id: Date.now().toString(),
          role: 'ai',
          content: `Analysis complete for ${scanType.toUpperCase()} scan.\n\nTarget: ${inputValue}\nFound ${results.length} security issues:\n\n${results.map(r => `- ${r.type.toUpperCase()}: ${r.title}`).join('\n')}\n\nWould you like specific remediation steps for any of these vulnerabilities?`,
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, analysis])
      }, 1000)
    }, 3000)
  }

  const generateScanResults = (type: string, target: string): ScanResult[] => {
    switch (type) {
      case 'code':
        return [
          {
            id: '1',
            type: 'critical',
            title: 'SQL Injection Vulnerability',
            description: 'User input directly concatenated into SQL query without parameterization',
            file: 'user_code.js',
            line: 2,
            engine: 'Semgrep'
          },
          {
            id: '2',
            type: 'high',
            title: 'Hardcoded API Key',
            description: 'API key detected in source code',
            file: 'user_code.js',
            line: 3,
            engine: 'GitGuardian'
          }
        ]
      case 'github':
        return [
          {
            id: '3',
            type: 'critical',
            title: 'Exposed Secret in Repository',
            description: 'API key found in repository history',
            file: 'config.js',
            line: 12,
            engine: 'GitGuardian'
          },
          {
            id: '4',
            type: 'high',
            title: 'Vulnerable Dependency',
            description: 'Package with known security vulnerability detected',
            file: 'package.json',
            line: 15,
            engine: 'Semgrep'
          }
        ]
      case 'docker':
        return [
          {
            id: '5',
            type: 'high',
            title: 'Vulnerable Base Image',
            description: 'Base image contains known security vulnerabilities',
            file: 'Dockerfile',
            line: 1,
            engine: 'Docker Bench'
          },
          {
            id: '6',
            type: 'medium',
            title: 'Running as Root User',
            description: 'Container runs with root privileges',
            file: 'Dockerfile',
            line: 15,
            engine: 'Docker Bench'
          }
        ]
      case 'aws':
        return [
          {
            id: '7',
            type: 'critical',
            title: 'Public S3 Bucket',
            description: 'S3 bucket allows public read access',
            engine: 'AWS Config'
          },
          {
            id: '8',
            type: 'high',
            title: 'Unencrypted S3 Bucket',
            description: 'S3 bucket does not have encryption enabled',
            engine: 'AWS Config'
          }
        ]
      default:
        return []
    }
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
    { type: 'code' as const, name: 'Code Analysis', icon: CodeBracketIcon, description: 'Paste code for analysis' },
    { type: 'github' as const, name: 'GitHub Repository', icon: CommandLineIcon, description: 'Scan GitHub repositories' },
    { type: 'aws' as const, name: 'AWS/S3 Scan', icon: CloudIcon, description: 'AWS services & S3 security scan' },
    { type: 'docker' as const, name: 'Docker Container', icon: ServerIcon, description: 'Container security analysis' }
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

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 space-y-6">
            {activeTab === 'scanner' && (
              <>
                {/* Scan Type Tabs */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-1.5 mb-6">
                  <div className="flex space-x-1">
                    {scanTypeOptions.map((option) => {
                      const IconComponent = option.icon
                      return (
                        <button
                          key={option.type}
                          onClick={() => setScanType(option.type)}
                          className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                            scanType === option.type
                              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/30'
                              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                          }`}
                        >
                          <IconComponent className="w-5 h-5 mr-2" />
                          <span>{option.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Code Analysis Tab */}
                {scanType === 'code' && (
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
                              Analyzing Code...
                            </>
                          ) : (
                            <>
                              <PlayIcon className="w-5 h-5 mr-2" />
                              Analyze Code
                            </>
                          )}
                        </button>
                        {isScanning && (
                          <button
                            onClick={() => setIsScanning(false)}
                            className="flex items-center px-6 py-3 bg-red-600/80 hover:bg-red-500/80 rounded-xl font-medium transition-all duration-200 border border-red-500/30 backdrop-blur-sm"
                          >
                            <StopIcon className="w-5 h-5 mr-2" />
                            Cancel
                          </button>
                        )}
                      </div>
                      {scanResults.length > 0 && (
                        <button
                          onClick={saveReport}
                          className="flex items-center px-4 py-3 bg-blue-600/80 hover:bg-blue-500/80 rounded-xl font-medium transition-all duration-200 border border-blue-500/30 backdrop-blur-sm"
                        >
                          <DocumentTextIcon className="w-4 h-4 mr-2" />
                          Save Report
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* GitHub Repository Tab */}
                {scanType === 'github' && (
                  <div className="backdrop-blur-xl bg-white/5 border border-green-500/20 rounded-2xl p-6 hover:border-green-400/40 transition-all duration-300">
                    <div className="flex items-center mb-6">
                      <CommandLineIcon className="w-6 h-6 text-green-400 mr-3" />
                      <h3 className="text-xl font-semibold text-white">GitHub Repository Scanner</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Repository URL
                        </label>
                        <input
                          type="url"
                          value={repositoryUrl}
                          onChange={(e) => setRepositoryUrl(e.target.value)}
                          placeholder="https://github.com/username/repository"
                          className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                        />
                      </div>
                      <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                        <h4 className="text-green-400 font-medium mb-2">Security Analysis Includes:</h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Source code vulnerabilities</li>
                          <li>• Dependency security issues</li>
                          <li>• Secret detection in history</li>
                          <li>• Configuration security</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={startScan}
                        disabled={isScanning || !repositoryUrl.trim()}
                        className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-500/80 hover:to-emerald-500/80 disabled:from-gray-600/50 disabled:to-gray-700/50 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 border border-green-500/30 backdrop-blur-sm"
                      >
                        {isScanning ? (
                          <>
                            <div className="w-5 h-5 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Scanning Repository...
                          </>
                        ) : (
                          <>
                            <PlayIcon className="w-5 h-5 mr-2" />
                            Scan Repository
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* AWS/S3 Tab */}
                {scanType === 'aws' && (
                  <div className="backdrop-blur-xl bg-white/5 border border-orange-500/20 rounded-2xl p-6 hover:border-orange-400/40 transition-all duration-300">
                    <div className="flex items-center mb-6">
                      <CloudIcon className="w-6 h-6 text-orange-400 mr-3" />
                      <h3 className="text-xl font-semibold text-white">AWS Services Scanner</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          AWS Resource (S3 Bucket, EC2 Instance, etc.)
                        </label>
                        <input
                          type="text"
                          value={s3BucketUrl}
                          onChange={(e) => setS3BucketUrl(e.target.value)}
                          placeholder="my-bucket-name or i-1234567890abcdef0"
                          className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
                        />
                        <p className="text-xs text-gray-500 mt-2">Enter S3 bucket name, EC2 instance ID, or other AWS resource identifier</p>
                      </div>
                      <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
                        <h4 className="text-orange-400 font-medium mb-2">AWS Security Checks Include:</h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• S3 bucket permissions & encryption</li>
                          <li>• EC2 security groups & patches</li>
                          <li>• IAM roles & policies</li>
                          <li>• Lambda function security</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={startScan}
                        disabled={isScanning || !s3BucketUrl.trim()}
                        className="flex items-center px-6 py-3 bg-gradient-to-r from-orange-600/80 to-red-600/80 hover:from-orange-500/80 hover:to-red-500/80 disabled:from-gray-600/50 disabled:to-gray-700/50 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 border border-orange-500/30 backdrop-blur-sm"
                      >
                        {isScanning ? (
                          <>
                            <div className="w-5 h-5 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Scanning AWS Resource...
                          </>
                        ) : (
                          <>
                            <PlayIcon className="w-5 h-5 mr-2" />
                            Scan AWS Resource
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Docker Container Tab */}
                {scanType === 'docker' && (
                  <div className="backdrop-blur-xl bg-white/5 border border-purple-500/20 rounded-2xl p-6 hover:border-purple-400/40 transition-all duration-300">
                    <div className="flex items-center mb-6">
                      <ServerIcon className="w-6 h-6 text-purple-400 mr-3" />
                      <h3 className="text-xl font-semibold text-white">Docker Container Scanner</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Docker Image
                        </label>
                        <input
                          type="text"
                          value={dockerImageUrl}
                          onChange={(e) => setDockerImageUrl(e.target.value)}
                          placeholder="nginx:latest or docker.io/username/image:tag"
                          className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                        />
                        <p className="text-xs text-gray-500 mt-2">Support for Docker Hub, private registries, and local images</p>
                      </div>
                      <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
                        <h4 className="text-purple-400 font-medium mb-2">Container Security Analysis:</h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Base image vulnerabilities</li>
                          <li>• Configuration security</li>
                          <li>• Package vulnerabilities</li>
                          <li>• Runtime security issues</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={startScan}
                        disabled={isScanning || !dockerImageUrl.trim()}
                        className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-500/80 hover:to-indigo-500/80 disabled:from-gray-600/50 disabled:to-gray-700/50 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 border border-purple-500/30 backdrop-blur-sm"
                      >
                        {isScanning ? (
                          <>
                            <div className="w-5 h-5 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Scanning Container...
                          </>
                        ) : (
                          <>
                            <PlayIcon className="w-5 h-5 mr-2" />
                            Scan Container
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Security Engines Status */}
            {isScanning && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Security Engines</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getEnginesForScanType(scanType).map((engine, index) => {
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

          {/* AI Assistant Sidebar - Larger and Better Structured */}
          <div className="xl:col-span-2 space-y-6">
            {/* Security Score - Compact */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShieldCheckIcon className="w-5 h-5 mr-2 text-green-400" />
                  <span className="text-white font-medium">Security Score</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-cyan-400">
                    {scanResults.length === 0 ? '--' : securityScore}
                  </div>
                  <div className="text-xs text-gray-400">
                    {scanResults.length === 0 ? 'No scan data' : `${scanResults.length} issues`}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced AI Assistant */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CpuChipIcon className="w-6 h-6 mr-3 text-blue-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">SentinelHub AI</h3>
                      <p className="text-xs text-gray-400">Live Security Recommendations</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 font-medium">Online</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                {/* Chat Area - Much Larger */}
                <div className="h-96 bg-black/20 border border-blue-400/20 rounded-xl p-4 overflow-y-auto mb-4 space-y-4 scrollbar-thin scrollbar-thumb-blue-600/50 scrollbar-track-gray-800/30">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] ${msg.role === 'user' ? 'ml-4' : 'mr-4'}`}>
                        <div className={`p-4 rounded-2xl backdrop-blur-sm ${
                          msg.role === 'user' 
                            ? 'bg-gradient-to-br from-blue-600/30 to-cyan-600/30 border border-blue-500/40 text-blue-100' 
                            : 'bg-gradient-to-br from-gray-800/60 to-gray-700/60 border border-gray-600/40 text-gray-100'
                        }`}>
                          <div className="flex items-center mb-2">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              msg.role === 'user' ? 'bg-blue-400' : 'bg-green-400'
                            }`}></div>
                            <span className="font-semibold text-sm">
                              {msg.role === 'user' ? 'You' : 'SentinelHub AI'}
                            </span>
                            <span className="text-xs text-gray-400 ml-auto">
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="mr-4 max-w-[85%]">
                        <div className="bg-gradient-to-br from-gray-800/60 to-gray-700/60 border border-gray-600/40 text-gray-100 p-4 rounded-2xl backdrop-blur-sm">
                          <div className="flex items-center mb-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                            <span className="font-semibold text-sm">SentinelHub AI</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-xs text-gray-400">Analyzing...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Input Area */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                      <span>Context: {scanType.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                      <span>Tab: {activeTab.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                      <span>Issues: {scanResults.length}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Ask about vulnerabilities, get remediation steps, or request analysis..."
                      className="flex-1 bg-black/30 border border-blue-400/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!chatInput.trim() || isTyping}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 rounded-xl transition-all duration-200 border border-blue-500/30 backdrop-blur-sm group"
                    >
                      <PaperAirplaneIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                  
                  {/* Quick Action Suggestions */}
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setChatInput('explain vulnerabilities')}
                      className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-full text-xs text-blue-300 transition-colors"
                    >
                      Explain Issues
                    </button>
                    <button 
                      onClick={() => setChatInput('how to fix')}
                      className="px-3 py-1 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-full text-xs text-green-300 transition-colors"
                    >
                      Get Fixes
                    </button>
                    <button 
                      onClick={() => setChatInput('report summary')}
                      className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-full text-xs text-purple-300 transition-colors"
                    >
                      Summary
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}