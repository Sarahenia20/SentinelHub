"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import LightCodeEditor from "../LightCodeEditor"
import {
  PlayIcon,
  DocumentTextIcon,
  FolderIcon,
  CloudIcon,
  CubeIcon,
  ClockIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  StopIcon,
  ArrowPathIcon,
  CodeBracketIcon,
  CommandLineIcon,
  CogIcon,
} from "@heroicons/react/24/outline"

// Lazy load Monaco only when requested
const MonacoClient = dynamic(() => import("../MonacoClient"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[300px] bg-gray-900/80 rounded-lg border border-gray-600/30">
      <div className="flex items-center space-x-3 text-gray-400">
        <ArrowPathIcon className="w-6 h-6 animate-spin" />
        <span>Loading Advanced Editor...</span>
      </div>
    </div>
  )
});

interface ScanResult {
  id: string
  type: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  file?: string
  line?: number
  engine: string
}

interface ScanProgress {
  engine: string
  status: 'pending' | 'running' | 'complete'
  progress: number
}

export function CodeScanner() {
  const [activeTab, setActiveTab] = useState('code')
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState<ScanProgress[]>([])
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [codeInput, setCodeInput] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'ai', content: string}>>([])
  const [useAdvancedEditor, setUseAdvancedEditor] = useState(false)

  const securityEngines = [
    'ESLint Security',
    'Semgrep',
    'Secret Scanner',
    'Trivy',
    'SonarQube',
    'CodeRabbit AI',
    'Hadolint'
  ]

  const tabs = [
    { id: 'code', name: 'Code Analysis', icon: CodeBracketIcon },
    { id: 'repository', name: 'Repository', icon: FolderIcon },
    { id: 's3', name: 'S3 Bucket', icon: CloudIcon },
    { id: 'container', name: 'Container', icon: CubeIcon },
  ]

  const startScan = async () => {
    setIsScanning(true)
    setScanResults([])
    
    const initialProgress = securityEngines.map(engine => ({
      engine,
      status: 'pending' as const,
      progress: 0
    }))
    setScanProgress(initialProgress)

    try {
      // Temporarily disabled backend API integration
      // Connect to WebSocket for real-time updates - DISABLED
      // if (typeof window !== 'undefined') {
      //   const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
      //   const ws = new WebSocket(wsUrl);
      //   
      //   ws.onmessage = (event) => {
      //     const data = JSON.parse(event.data);
      //     if (data.type === 'scanUpdate') {
      //       // Update progress bars in real-time
      //       setScanProgress(prev => prev.map(p => 
      //         p.engine === data.currentEngine 
      //           ? { ...p, status: 'running', progress: data.progress }
      //           : p
      //       ));
      //     }
      //   };
      // }

      // Call backend API - DISABLED FOR NOW
      // const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      // let endpoint = '';
      // let payload = {};

      // switch (activeTab) {
      //   case 'code':
      //     endpoint = '/scan/code';
      //     payload = { 
      //       code: codeInput, 
      //       language: 'javascript',
      //       filename: 'input.js'
      //     };
      //     break;
      //   case 'repository':
      //     endpoint = '/scan/github';
      //     payload = { 
      //       repository: 'example/repo',
      //       branch: 'main'
      //     };
      //     break;
      //   case 's3':
      //     endpoint = '/scan/s3';
      //     payload = {
      //       bucketName: 'example-bucket',
      //       region: 'us-east-1'
      //     };
      //     break;
      //   case 'container':
      //     endpoint = '/scan/container';
      //     payload = {
      //       image: 'nginx:latest'
      //     };
      //     break;
      // }

      // const response = await fetch(`${apiUrl}${endpoint}`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${window.localStorage.getItem('clerk-session')}`
      //   },
      //   body: JSON.stringify(payload)
      // });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      // const results = await response.json();
      
      // Update UI with real results
      // setScanResults(results.vulnerabilities || []);
      // setScanProgress(results.engines?.map((engine: any) => ({
      //   engine: engine.name,
      //   status: 'complete' as const,
      //   progress: 100
      // })) || []);

      // Use mock data for now
      console.log('Using mock scan data - backend temporarily disabled');
      const mockResults = await runMockScan();
      setScanResults(mockResults);
    } finally {
      setIsScanning(false);
    }
  };

  const runMockScan = async () => {

    // Simulate scanning process
    securityEngines.forEach((engine, index) => {
      setTimeout(() => {
        setScanProgress(prev => prev.map(p => 
          p.engine === engine ? { ...p, status: 'running' } : p
        ))

        // Simulate progress
        const progressInterval = setInterval(() => {
          setScanProgress(prev => {
            const updated = prev.map(p => {
              if (p.engine === engine && p.progress < 100) {
                return { ...p, progress: Math.min(p.progress + 10, 100) }
              }
              return p
            })
            
            const currentEngine = updated.find(p => p.engine === engine)
            if (currentEngine && currentEngine.progress >= 100) {
              clearInterval(progressInterval)
              setScanProgress(prev => prev.map(p => 
                p.engine === engine ? { ...p, status: 'complete' } : p
              ))

              // Add some mock findings
              const mockFindings: ScanResult[] = [
                {
                  id: `${engine}-1`,
                  type: 'high',
                  title: `Potential SQL Injection detected by ${engine}`,
                  description: 'User input is directly concatenated into SQL query without sanitization',
                  file: 'database.js',
                  line: 42,
                  engine
                },
                {
                  id: `${engine}-2`,
                  type: 'medium',
                  title: `Hardcoded secret found by ${engine}`,
                  description: 'API key or password appears to be hardcoded in source',
                  file: 'config.js',
                  line: 15,
                  engine
                }
              ]

              setScanResults(prev => [...prev, ...mockFindings])
            }

            return updated
          })
        }, 300)

      }, index * 1000)
    })

    // Complete scan after all engines finish
    setTimeout(() => {
      setIsScanning(false)
    }, securityEngines.length * 1000 + 3000)
  }

  const stopScan = () => {
    setIsScanning(false)
    setScanProgress([])
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

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4">
            Security Scanner
          </h1>
          <p className="text-gray-400 text-lg">
            Comprehensive security analysis across multiple engines
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center px-6 py-3 rounded-xl transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                    : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700/50'
                  }
                `}
              >
                <IconComponent className="w-5 h-5 mr-2" />
                {tab.name}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Scanner Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Input Section */}
            <div className="backdrop-blur-xl bg-gray-900/10 border border-cyan-500/15 rounded-2xl hover:border-cyan-400/50 transition-all duration-300 shadow-xl hover:shadow-cyan-500/10 hover:shadow-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <DocumentTextIcon className="w-6 h-6 mr-2 text-cyan-400" />
                {activeTab === 'code' && 'Code Input'}
                {activeTab === 'repository' && 'Repository URL'}
                {activeTab === 's3' && 'S3 Bucket Configuration'}
                {activeTab === 'container' && 'Container Image'}
              </h3>

              {activeTab === 'code' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">Editor Mode:</span>
                      <button
                        onClick={() => setUseAdvancedEditor(!useAdvancedEditor)}
                        className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-xs text-cyan-400 border border-cyan-500/30 transition-colors"
                      >
                        <CogIcon className="w-3 h-3" />
                        <span>{useAdvancedEditor ? 'Advanced' : 'Fast'}</span>
                      </button>
                    </div>
                    {useAdvancedEditor && (
                      <div className="text-xs text-gray-500">
                        Advanced editor with syntax highlighting
                      </div>
                    )}
                  </div>
                  
                  {useAdvancedEditor ? (
                    <div className="relative bg-gray-900/80 border border-cyan-500/30 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/10">
                      <div className="flex items-center justify-between bg-gray-800/90 px-4 py-2 border-b border-cyan-500/20">
                        <div className="flex items-center space-x-2">
                          <CommandLineIcon className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm font-mono text-cyan-400">SentinelHub Terminal - Advanced</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                      </div>
                      <div className="h-[300px] overflow-hidden">
                        <MonacoClient
                          language="javascript"
                          value={codeInput}
                          onChange={(value) => setCodeInput(value || '')}
                          height="100%"
                          theme="cyberpunk"
                          placeholder={`// Paste your code here for security analysis...
function example() {
  const apiKey = 'sk-1234567890abcdef';
  return fetch('/api/data', {
    headers: { 'Authorization': 'Bearer ' + apiKey }
  });
}`}
                        />
                      </div>
                    </div>
                  ) : (
                    <LightCodeEditor
                      language="javascript"
                      value={codeInput}
                      onChange={(value) => setCodeInput(value)}
                      height="300px"
                      placeholder={`// Paste your code here for security analysis...
function example() {
  const apiKey = 'sk-1234567890abcdef';
  return fetch('/api/data', {
    headers: { 'Authorization': 'Bearer ' + apiKey }
  });
}`}
                    />
                  )}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={startScan}
                      disabled={isScanning || !codeInput.trim()}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                    >
                      <PlayIcon className="w-5 h-5 mr-2" />
                      Start Scan
                    </button>
                    {isScanning && (
                      <button
                        onClick={stopScan}
                        className="flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-medium transition-all duration-200"
                      >
                        <StopIcon className="w-5 h-5 mr-2" />
                        Stop Scan
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'repository' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="https://github.com/username/repository"
                    className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                  />
                  <button
                    onClick={startScan}
                    disabled={isScanning}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    <PlayIcon className="w-5 h-5 mr-2" />
                    Scan Repository
                  </button>
                </div>
              )}

              {activeTab === 's3' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="S3 Bucket Name"
                    className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                  />
                  <input
                    type="text"
                    placeholder="AWS Region"
                    className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                  />
                  <button
                    onClick={startScan}
                    disabled={isScanning}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    <PlayIcon className="w-5 h-5 mr-2" />
                    Scan S3 Bucket
                  </button>
                </div>
              )}

              {activeTab === 'container' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Container Image (e.g., nginx:latest)"
                    className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                  />
                  <button
                    onClick={startScan}
                    disabled={isScanning}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    <PlayIcon className="w-5 h-5 mr-2" />
                    Scan Container
                  </button>
                </div>
              )}
            </div>

            {/* Scan Progress */}
            {scanProgress.length > 0 && (
              <div className="backdrop-blur-xl bg-gray-900/10 border border-cyan-500/15 rounded-2xl hover:border-cyan-400/50 transition-all duration-300 shadow-xl hover:shadow-cyan-500/10 hover:shadow-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <ClockIcon className="w-6 h-6 mr-2 text-cyan-400" />
                  Scan Progress
                </h3>
                <div className="space-y-4">
                  {scanProgress.map((progress) => (
                    <div key={progress.engine} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 font-medium">{progress.engine}</span>
                        <span className={`text-sm ${
                          progress.status === 'complete' ? 'text-green-400' :
                          progress.status === 'running' ? 'text-cyan-400' : 'text-gray-500'
                        }`}>
                          {progress.status === 'complete' ? 'Complete' :
                           progress.status === 'running' ? `${progress.progress}%` : 'Pending'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            progress.status === 'complete' ? 'bg-green-500' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {scanResults.length > 0 && (
              <div className="backdrop-blur-xl bg-gray-900/10 border border-cyan-500/15 rounded-2xl hover:border-cyan-400/50 transition-all duration-300 shadow-xl hover:shadow-cyan-500/10 hover:shadow-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <ExclamationTriangleIcon className="w-6 h-6 mr-2 text-yellow-400" />
                  Security Findings ({scanResults.length})
                </h3>
                <div className="space-y-4">
                  {scanResults.map((result) => (
                    <div
                      key={result.id}
                      className={`border rounded-xl p-4 ${getSeverityColor(result.type)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-lg">{result.title}</h4>
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${getSeverityColor(result.type)}`}>
                          {result.type}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-3">{result.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Engine: {result.engine}</span>
                        {result.file && <span>File: {result.file}</span>}
                        {result.line && <span>Line: {result.line}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Assistant Sidebar */}
          <div className="space-y-6">
            <div className="backdrop-blur-xl bg-gray-900/10 border border-cyan-500/15 rounded-2xl hover:border-cyan-400/50 transition-all duration-300 shadow-xl hover:shadow-cyan-500/10 hover:shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 mr-2 text-cyan-400" />
                  AI Assistant
                </h3>
                <button
                  onClick={() => setChatOpen(!chatOpen)}
                  className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <ArrowPathIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="h-64 bg-gray-900/50 border border-gray-600/50 rounded-xl p-4 overflow-y-auto">
                  {chatMessages.length === 0 ? (
                    <div className="text-gray-500 text-center mt-8">
                      Ask me about any security findings or best practices!
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div key={idx} className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        <div className={`inline-block p-3 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-cyan-600 text-white' 
                            : 'bg-gray-700 text-gray-200'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <input
                  type="text"
                  placeholder="Ask about security vulnerabilities..."
                  className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement
                      if (input.value.trim()) {
                        setChatMessages(prev => [
                          ...prev,
                          { role: 'user', content: input.value },
                          { role: 'ai', content: 'This is a simulated AI response. In a real implementation, this would connect to an AI service to provide security guidance.' }
                        ])
                        input.value = ''
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Security Score */}
            <div className="backdrop-blur-xl bg-gray-900/10 border border-cyan-500/15 rounded-2xl hover:border-cyan-400/50 transition-all duration-300 shadow-xl hover:shadow-cyan-500/10 hover:shadow-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <ShieldCheckIcon className="w-6 h-6 mr-2 text-green-400" />
                Security Score
              </h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">85/100</div>
                <div className="text-gray-400 text-sm">Good Security Posture</div>
                <div className="w-full bg-gray-700/50 rounded-full h-3 mt-4">
                  <div className="bg-gradient-to-r from-green-500 to-cyan-500 h-3 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="backdrop-blur-xl bg-gray-900/10 border border-cyan-500/15 rounded-2xl hover:border-cyan-400/50 transition-all duration-300 shadow-xl hover:shadow-cyan-500/10 hover:shadow-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Critical Issues</span>
                  <span className="text-red-400 font-bold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">High Issues</span>
                  <span className="text-orange-400 font-bold">{scanResults.filter(r => r.type === 'high').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Medium Issues</span>
                  <span className="text-yellow-400 font-bold">{scanResults.filter(r => r.type === 'medium').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Low Issues</span>
                  <span className="text-blue-400 font-bold">{scanResults.filter(r => r.type === 'low').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}