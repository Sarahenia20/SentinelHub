"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import ReactMarkdown from 'react-markdown'
import { useRouter } from "next/navigation"
import { apiService, type GitHubRepository, type DockerImage, type S3Bucket, type PasteScanRequest, type PasteScanResult } from '@/utils/api'
import {
  PlayIcon,
  StopIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  DocumentArrowDownIcon,
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
  CpuChipIcon,
  DocumentMagnifyingGlassIcon,
  CogIcon
} from "@heroicons/react/24/outline"
import { VoiceButton } from '../voice-button'

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
  const [codeInput, setCodeInput] = useState(getExampleCode('javascript'))

  function getExampleCode(language: string): string {
    switch (language) {
      case 'javascript':
        return `// Sample vulnerable JavaScript code
const express = require('express');
const app = express();

// 🚨 SQL Injection vulnerability
app.get('/user/:id', (req, res) => {
  const query = "SELECT * FROM users WHERE id = " + req.params.id;
  db.query(query, (err, results) => {
    res.json(results);
  });
});

// 🔑 Hardcoded API key (will be detected)
const apiKey = "sk_live_1234567890abcdef1234567890abcdef";

// 🚨 Code injection vulnerability
app.post('/eval', (req, res) => {
  const result = eval(req.body.expression);
  res.json({ result });
});`;
      case 'php':
        return `<?php
// Sample vulnerable PHP code

// 🚨 SQL Injection vulnerability
$user_id = $_GET['id'];
$query = "SELECT * FROM users WHERE id = " . $user_id;
$result = mysqli_query($connection, $query);

// 🔑 Hardcoded database credentials
$db_password = "admin123";
$connection = mysqli_connect("localhost", "root", $db_password, "mydb");

// 🚨 XSS vulnerability
echo "<h1>Welcome " . $_GET['name'] . "!</h1>";

// 🚨 Command injection
$filename = $_POST['file'];
exec("cat " . $filename);

// 🚨 File inclusion vulnerability
include $_GET['page'] . ".php";
?>`;
      case 'sql':
        return `-- Sample vulnerable SQL queries

-- 🚨 SQL Injection via dynamic query building
DECLARE @sql NVARCHAR(4000)
SET @sql = 'SELECT * FROM users WHERE name = ''' + @username + ''''
EXEC sp_executesql @sql

-- 🚨 Unsafe stored procedure
CREATE PROCEDURE GetUser(@UserId VARCHAR(50))
AS
BEGIN
    DECLARE @Query VARCHAR(1000)
    SET @Query = 'SELECT * FROM Users WHERE UserId = ' + @UserId
    EXEC(@Query)
END

-- 🔑 Hardcoded credentials in query
SELECT * FROM config WHERE 
  username = 'admin' AND 
  password = 'password123'

-- 🚨 Overly permissive grants
GRANT ALL PRIVILEGES ON *.* TO 'webapp'@'%' IDENTIFIED BY 'weak'`;
      case 'python':
        return `# Sample vulnerable Python code
import subprocess
import sqlite3

# 🚨 SQL Injection vulnerability
def get_user(user_id):
    conn = sqlite3.connect('users.db')
    query = f"SELECT * FROM users WHERE id = {user_id}"
    result = conn.execute(query).fetchall()
    return result

# 🔑 Hardcoded API key
API_KEY = "sk_live_1234567890abcdef1234567890abcdef"

# 🚨 Command injection
def process_file(filename):
    subprocess.call(f"cat {filename}", shell=True)

# 🚨 Unsafe deserialization
import pickle
def load_data(data):
    return pickle.loads(data)

# 🚨 Path traversal
def read_file(filename):
    with open(filename, 'r') as f:
        return f.read()`;
      default:
        return `// Enter your ${language} code here for security analysis...
// The scanner will detect vulnerabilities and security issues`;
    }
  }
  const [selectedRepository, setSelectedRepository] = useState('')
  const [repositories, setRepositories] = useState<GitHubRepository[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [selectedDockerImage, setSelectedDockerImage] = useState('')
  const [dockerImages, setDockerImages] = useState<DockerImage[]>([])
  const [loadingDockerImages, setLoadingDockerImages] = useState(false)
  const [selectedS3Bucket, setSelectedS3Bucket] = useState('')
  const [s3Buckets, setS3Buckets] = useState<S3Bucket[]>([])
  const [loadingS3Buckets, setLoadingS3Buckets] = useState(false)
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
  const [pasteScanResult, setPasteScanResult] = useState<PasteScanResult | null>(null)
  const [apiScanScore, setApiScanScore] = useState<number | null>(null) // Store security score from API scans
  const [isLiveScanning, setIsLiveScanning] = useState(false)
  const [enableLiveScanning, setEnableLiveScanning] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('javascript')
  const [showLanguageAlert, setShowLanguageAlert] = useState(false)
  const liveScanTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [scanName, setScanName] = useState('')
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [generatedDescription, setGeneratedDescription] = useState('')

  // Load repositories when GitHub scan type is selected
  useEffect(() => {
    if (scanType === 'github' && repositories.length === 0) {
      loadRepositories()
    }
    if (scanType === 'docker' && dockerImages.length === 0) {
      loadDockerImages()
    }
    if (scanType === 'aws' && s3Buckets.length === 0) {
      loadS3Buckets()
    }
  }, [scanType])

  // Language detection helper
  const detectLanguageMismatch = (code: string, selectedLang: string): boolean => {
    const jsPatterns = [/require\(/, /import\s+.*from/, /const\s+.*=/, /function\s*\(/, /=>/, /console\./, /\$\{.*\}/]
    const phpPatterns = [/<\?php/, /\$\w+/, /echo\s+/, /mysqli_/, /->/, /\$_GET/, /\$_POST/]
    const sqlPatterns = [/SELECT\s+.*FROM/i, /INSERT\s+INTO/i, /UPDATE\s+.*SET/i, /DELETE\s+FROM/i, /CREATE\s+TABLE/i]
    const pythonPatterns = [/import\s+\w+/, /def\s+\w+/, /print\(/, /if\s+__name__/, /\w+\.\w+\(/]
    
    const hasJs = jsPatterns.some(pattern => pattern.test(code))
    const hasPhp = phpPatterns.some(pattern => pattern.test(code)) 
    const hasSql = sqlPatterns.some(pattern => pattern.test(code))
    const hasPython = pythonPatterns.some(pattern => pattern.test(code))
    
    if (selectedLang === 'javascript' && !hasJs && (hasPhp || hasSql || hasPython)) return true
    if (selectedLang === 'php' && !hasPhp && (hasJs || hasSql || hasPython)) return true
    if (selectedLang === 'sql' && !hasSql && (hasJs || hasPhp || hasPython)) return true
    if (selectedLang === 'python' && !hasPython && (hasJs || hasPhp || hasSql)) return true
    
    return false
  }

  // Debounced live scanning
  const performLiveScan = useCallback(async (code: string) => {
    if (!code.trim() || !enableLiveScanning || code.length < 50) return // Minimum code length

    // Check for language mismatch
    if (detectLanguageMismatch(code, selectedLanguage)) {
      setShowLanguageAlert(true)
      setTimeout(() => setShowLanguageAlert(false), 5000)
    }

    setIsLiveScanning(true)
    
    try {
      const scanRequest: PasteScanRequest = {
        code: code,
        language: selectedLanguage,
        options: {
          enableAllChecks: true,
          userAgent: navigator.userAgent,
          ipAddress: 'client-live'
        }
      }

      const result = await apiService.scanPastedCode(scanRequest)
      
      if (result.success) {
        setPasteScanResult(result)
        
        // Convert results for UI
        const convertedResults: ScanResult[] = [
          ...result.security.vulnerabilities.map((vuln, index) => ({
            id: `live-vuln-${index}`,
            type: vuln.severity as 'critical' | 'high' | 'medium' | 'low',
            title: vuln.message,
            description: vuln.recommendation || 'Security vulnerability detected',
            file: 'live_code.js',
            line: vuln.line,
            engine: vuln.source
          })),
          ...result.security.secrets.map((secret, index) => ({
            id: `live-secret-${index}`,
            type: secret.severity as 'critical' | 'high' | 'medium' | 'low',
            title: `${secret.type} Detected`,
            description: `${secret.type} found: ${secret.maskedValue}`,
            file: 'live_code.js',
            line: secret.line,
            engine: 'Pattern Matcher'
          }))
        ]
        
        setScanResults(convertedResults)
      }
    } catch (error) {
      console.error('Live scan failed:', error)
    } finally {
      setIsLiveScanning(false)
    }
  }, [enableLiveScanning])

  // Live scanning effect
  useEffect(() => {
    if (scanType === 'code' && enableLiveScanning && codeInput.trim()) {
      if (liveScanTimeoutRef.current) {
        clearTimeout(liveScanTimeoutRef.current)
      }
      
      liveScanTimeoutRef.current = setTimeout(() => {
        performLiveScan(codeInput)
      }, 2000) // 2 second debounce
    }

    return () => {
      if (liveScanTimeoutRef.current) {
        clearTimeout(liveScanTimeoutRef.current)
      }
    }
  }, [codeInput, scanType, enableLiveScanning, performLiveScan])

  const loadRepositories = async () => {
    setLoadingRepos(true)
    try {
      const repos = await apiService.getRepositories()
      setRepositories(repos)
    } catch (error) {
      console.error('Failed to load repositories:', error)
    } finally {
      setLoadingRepos(false)
    }
  }

  const loadDockerImages = async () => {
    setLoadingDockerImages(true)
    try {
      // Try to get stored Docker credentials or use empty for local Docker only
      const username = localStorage.getItem('docker_username') || ''
      const token = localStorage.getItem('docker_token') || ''
      const images = await apiService.getDockerImages(username, token)
      setDockerImages(images)
    } catch (error) {
      console.error('Failed to load Docker images:', error)
      // Set empty array to show that we couldn't fetch images
      setDockerImages([])
    } finally {
      setLoadingDockerImages(false)
    }
  }

  const loadS3Buckets = async () => {
    setLoadingS3Buckets(true)
    try {
      const accessKey = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || ''
      const secretKey = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || ''
      const region = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
      const buckets = await apiService.getS3Buckets(accessKey, secretKey, region)
      setS3Buckets(buckets)
    } catch (error) {
      console.error('Failed to load S3 buckets:', error)
    } finally {
      setLoadingS3Buckets(false)
    }
  }

  const getEnginesForScanType = (type: string) => {
    switch (type) {
      case 'code':
        return [
          { name: 'ESLint Security', icon: CodeBracketIcon, status: 'analyzing' },
          { name: 'Pattern Matcher', icon: BugAntIcon, status: 'analyzing' },
          { name: 'Semgrep Scanner', icon: ShieldCheckIcon, status: 'analyzing' },
          { name: 'TruffleHog Secrets', icon: ExclamationTriangleIcon, status: 'analyzing' },
          { name: 'CVE Database', icon: CpuChipIcon, status: 'analyzing' },
          { name: 'SonarQube Analysis', icon: DocumentMagnifyingGlassIcon, status: 'analyzing' }
        ]
      case 'github':
        return [
          { name: 'ESLint Security', icon: CodeBracketIcon, status: 'analyzing' },
          { name: 'Pattern Matcher', icon: BugAntIcon, status: 'analyzing' },
          { name: 'Secret Detection', icon: KeyIcon, status: 'analyzing' },
          { name: 'CVE Lookup', icon: ExclamationTriangleIcon, status: 'analyzing' },
          { name: 'GitHub Advisory', icon: ShieldCheckIcon, status: 'analyzing' }
        ]
      case 'aws':
        return [
          { name: 'S3 Bucket Analysis', icon: ServerIcon, status: 'analyzing' },
          { name: 'Access Control Check', icon: ShieldCheckIcon, status: 'analyzing' },
          { name: 'Encryption Status', icon: KeyIcon, status: 'analyzing' },
          { name: 'Security Policies', icon: DocumentTextIcon, status: 'analyzing' }
        ]
      case 'docker':
        return [
          { name: 'Docker Bench Security', icon: ServerIcon, status: 'analyzing' },
          { name: 'Container Config', icon: CogIcon, status: 'analyzing' },
          { name: 'Image Vulnerability', icon: ExclamationTriangleIcon, status: 'analyzing' },
          { name: 'Runtime Security', icon: ShieldCheckIcon, status: 'analyzing' }
        ]
      default:
        return []
    }
  }

  const getInputValue = () => {
    switch (scanType) {
      case 'code': return codeInput
      case 'github': return selectedRepository
      case 'aws': return selectedS3Bucket
      case 'docker': return 'Docker Environment' // Always available for Docker Bench
      default: return ''
    }
  }

  const startScan = async () => {
    if (scanType === 'code') {
      // Real Paste Scanner Integration
      if (!codeInput.trim()) return
      setIsScanning(true)
      setScanResults([])
      setPasteScanResult(null)
      
      try {
        console.log('🔍 Starting real paste scanner...')
        
        const scanRequest: PasteScanRequest = {
          code: codeInput,
          language: selectedLanguage,
          options: {
            enableAllChecks: true,
            userAgent: navigator.userAgent,
            ipAddress: 'client'
          }
        }

        const result = await apiService.scanPastedCode(scanRequest)
        console.log('✅ Paste scanner result:', result)
        
        if (result.success) {
          setPasteScanResult(result)
          
          // Convert to legacy format for existing UI
          const convertedResults: ScanResult[] = [
            // Convert vulnerabilities
            ...result.security.vulnerabilities.map((vuln, index) => ({
              id: `vuln-${index}`,
              type: vuln.severity as 'critical' | 'high' | 'medium' | 'low',
              title: vuln.message,
              description: vuln.recommendation || 'Security vulnerability detected',
              file: 'pasted_code.js',
              line: vuln.line,
              engine: vuln.source
            })),
            // Convert secrets
            ...result.security.secrets.map((secret, index) => ({
              id: `secret-${index}`,
              type: secret.severity as 'critical' | 'high' | 'medium' | 'low',
              title: `${secret.type} Detected`,
              description: `${secret.type} found in code: ${secret.maskedValue}`,
              file: 'pasted_code.js',
              line: secret.line,
              engine: 'Pattern Matcher'
            })),
            // Convert code quality issues
            ...result.security.codeQuality.map((quality, index) => ({
              id: `quality-${index}`,
              type: quality.severity as 'critical' | 'high' | 'medium' | 'low',
              title: quality.rule,
              description: quality.message,
              file: 'pasted_code.js',
              line: quality.line,
              engine: 'ESLint'
            }))
          ]
          
          setScanResults(convertedResults)
          setIsScanning(false)
          
          // AI Analysis with real data
          setTimeout(() => {
            const analysis: ChatMessage = {
              id: Date.now().toString(),
              role: 'ai',
              content: `🔍 REAL-TIME SECURITY ANALYSIS COMPLETE\n\nScan ID: ${result.scanId}\nRisk Level: ${result.summary.riskLevel.toUpperCase()}\nSecurity Score: ${result.summary.securityScore}/100\n\nFindings:\n• Critical: ${result.findings.critical}\n• High: ${result.findings.high}\n• Medium: ${result.findings.medium}\n• Low: ${result.findings.low}\n\nTop Issues:\n${result.findings.topIssues.map(issue => `• Line ${issue.line}: ${issue.message}`).slice(0, 3).join('\n')}\n\n${result.summary.recommendation}\n\nReady for detailed remediation guidance!`,
              timestamp: new Date()
            }
            setChatMessages(prev => [...prev, analysis])
          }, 1000)
        }
        
      } catch (error) {
        console.error('❌ Paste scanner failed:', error)
        setIsScanning(false)
        
        const errorMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'ai',
          content: `❌ PASTE SCANNER ERROR\n\nFailed to connect to security scanner:\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease ensure the API gateway is running on port 3001.`,
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, errorMsg])
        
        setScanResults([])
        setIsScanning(false)
      }
      
    } else if (scanType === 'docker') {
      // Special handling for Docker Bench Security
      setIsScanning(true)
      setScanResults([])
      
      try {
        const dockerBenchResults = await apiService.runDockerBenchSecurity()
        
        if (dockerBenchResults && dockerBenchResults.success) {
          // Convert Docker Bench results to scan results format
          const results: ScanResult[] = dockerBenchResults.results.map((result: any) => ({
            id: result.id,
            type: result.type,
            title: result.title,
            description: result.description,
            cisControl: result.cisControl,
            engine: result.engine
          }))

          setScanResults(results)
          setApiScanScore(dockerBenchResults.benchmark.securityScore) // Store the security score from API

          setTimeout(() => {
            const analysis: ChatMessage = {
              id: Date.now().toString(),
              role: 'ai',
              content: `DOCKER SECURITY ANALYSIS COMPLETE\n\nCIS Docker Benchmark v1.6.0 Results:\n\nSecurity Score: ${dockerBenchResults.benchmark.securityScore}%\nTotal Checks: ${dockerBenchResults.benchmark.totalChecks}\nPassed: ${dockerBenchResults.benchmark.passedChecks}\nFailed: ${dockerBenchResults.benchmark.failedChecks}\nWarnings: ${dockerBenchResults.benchmark.warningChecks}\n\nSeverity Breakdown:\nCritical: ${dockerBenchResults.summary.critical}\nHigh: ${dockerBenchResults.summary.high}\nMedium: ${dockerBenchResults.summary.medium}\nLow: ${dockerBenchResults.summary.low}\n\nDocker Environment:\nVersion: ${dockerBenchResults.dockerInfo.version}\nContainers: ${dockerBenchResults.dockerInfo.containers}\nImages: ${dockerBenchResults.dockerInfo.images}\nStorage: ${dockerBenchResults.dockerInfo.storageDriver}\n\nReady for detailed remediation guidance.`,
              timestamp: new Date()
            }
            setChatMessages(prev => [...prev, analysis])
          }, 1000)
        }
        
        setIsScanning(false)
      } catch (error) {
        console.error('Docker Bench scan failed:', error)
        setIsScanning(false)
        
        const errorMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'ai',
          content: "DOCKER SECURITY SCAN ERROR\n\nDocker security scan failed. Please check:\n\n• Docker daemon is running\n• Sufficient permissions for Docker commands\n• Network connectivity",
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, errorMsg])
        
        setScanResults([])
      }
    } else if (scanType === 'github') {
      // Real GitHub Repository Scanner Integration
      if (!selectedRepository.trim()) return
      setIsScanning(true)
      setScanResults([])
      
      try {
        console.log('🐙 Starting real GitHub repository scan...')
        
        const [owner, repo] = selectedRepository.split('/')
        const result = await apiService.scanGitHubRepository(owner, repo, {
          enableCodeRabbit: false // Can be made configurable
        })
        
        console.log('✅ GitHub scanner result:', result)
        
        if (result.success) {
          // Convert to UI format
          const convertedResults: ScanResult[] = [
            // Convert vulnerabilities
            ...result.security.vulnerabilities.map((vuln, index) => ({
              id: `gh-vuln-${index}`,
              type: vuln.severity as 'critical' | 'high' | 'medium' | 'low',
              title: vuln.message,
              description: vuln.recommendation || 'Security vulnerability detected',
              file: vuln.file,
              line: vuln.line,
              engine: vuln.source
            })),
            // Convert secrets
            ...result.security.secrets.map((secret, index) => ({
              id: `gh-secret-${index}`,
              type: secret.severity as 'critical' | 'high' | 'medium' | 'low',
              title: `${secret.type} in Repository`,
              description: `Secret detected in ${secret.file}: ${secret.maskedValue}`,
              file: secret.file,
              line: secret.line,
              engine: 'Pattern Matcher'
            })),
            // Convert code quality issues
            ...result.security.codeQuality.map((quality, index) => ({
              id: `gh-quality-${index}`,
              type: quality.severity as 'critical' | 'high' | 'medium' | 'low',
              title: quality.rule,
              description: quality.message,
              file: quality.file,
              line: quality.line,
              engine: 'ESLint'
            }))
          ]

          setScanResults(convertedResults)
          setApiScanScore(result.summary.securityScore) // Store the security score from API
          setIsScanning(false)

          // AI Analysis with real repository data
          setTimeout(() => {
            const analysis: ChatMessage = {
              id: Date.now().toString(),
              role: 'ai',
              content: `🐙 GITHUB REPOSITORY ANALYSIS COMPLETE\n\nRepository: ${result.repository.fullName}\nScan ID: ${result.scanId}\nFiles Analyzed: ${result.summary.filesScanned}/${result.summary.totalFiles}\nLanguages: ${Object.keys(result.summary.languages).join(', ')}\n\nSecurity Summary:\n• Risk Level: ${result.summary.riskLevel.toUpperCase()}\n• Security Score: ${result.summary.securityScore}/100\n• Total Issues: ${result.summary.totalIssues}\n\nBreakdown:\n• Critical: ${result.findings.critical}\n• High: ${result.findings.high}\n• Medium: ${result.findings.medium}\n• Low: ${result.findings.low}\n\nTop Issues:\n${result.findings.topIssues.slice(0, 3).map(issue => `• ${issue.file}: ${issue.message}`).join('\n')}\n\n📊 Repository Insights:\n• Stars: ${result.repository.stars}\n• Language: ${result.repository.language}\n• Last Updated: ${new Date(result.repository.lastUpdate).toLocaleDateString()}\n\n${result.summary.recommendation}\n\nReady to provide detailed remediation guidance!`,
              timestamp: new Date()
            }
            setChatMessages(prev => [...prev, analysis])
          }, 1000)
        }
        
      } catch (error) {
        console.error('❌ GitHub scanner failed:', error)
        setIsScanning(false)
        
        const errorMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'ai',
          content: `❌ GITHUB REPOSITORY SCAN ERROR\n\nFailed to scan repository: ${selectedRepository}\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check:\n• Repository access permissions\n• GitHub token validity\n• API gateway connection`,
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, errorMsg])
        
        setScanResults([])
        setIsScanning(false)
      }
      
    } else {
      // Original logic for other scan types
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
            type: 'critical',
            title: 'Privileged containers are used',
            description: 'Containers running with --privileged flag pose security risks',
            cisControl: '5.4',
            engine: 'Docker Bench Security'
          },
          {
            id: '6',
            type: 'high',
            title: 'Docker daemon running as root',
            description: 'Docker daemon should run as non-root user when possible',
            cisControl: '2.1',
            engine: 'Docker Bench Security'
          },
          {
            id: '7',
            type: 'high',
            title: 'Container user not created',
            description: 'Containers should run with a dedicated non-root user',
            cisControl: '4.1',
            engine: 'Docker Bench Security'
          },
          {
            id: '8',
            type: 'medium',
            title: 'Docker service file permissions incorrect',
            description: 'docker.service file should have appropriate permissions',
            cisControl: '3.2',
            engine: 'Docker Bench Security'
          },
          {
            id: '9',
            type: 'medium',
            title: 'Separate partition not configured',
            description: 'Docker storage should use a separate partition',
            cisControl: '1.1.1',
            engine: 'Docker Bench Security'
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

  const sendMessage = async () => {
    if (!chatInput.trim()) return
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    }
    
    setChatMessages(prev => [...prev, userMessage])
    const currentInput = chatInput
    setChatInput('')
    setIsTyping(true)
    
    try {
      // Create context from current scan results
      const currentEngines = getEnginesForScanType(scanType);
      const scanContext = {
        scanType,
        activeTab,
        vulnerabilities: scanResults.length,
        securityScore,
        findings: scanResults.map(r => ({
          type: r.type,
          title: r.title,
          severity: r.severity,
          description: r.description
        })),
        engines: currentEngines.map(e => e.name)
      }
      
      const response = await apiService.chatWithAI({
        message: `Security scan context: ${JSON.stringify(scanContext)}\n\nUser question: ${currentInput}`,
        options: {
          maxTokens: 500,
          temperature: 0.7
        }
      })
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.message || 'I apologize, but I encountered an issue processing your request. Please try again.',
        timestamp: new Date()
      }
      
      setChatMessages(prev => [...prev, aiResponse])
      
    } catch (error) {
      console.error('Chat API error:', error)
      
      // Fallback to generateResponse if API fails
      const fallbackResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: generateResponse(currentInput),
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, fallbackResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const generateResponse = (input: string): string => {
    const lower = input.toLowerCase()
    const contextInfo = `\n\nCONTEXT_DATA\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nScan Type: ${scanType.toUpperCase()}\nActive Tab: ${activeTab.toUpperCase()}\nVulnerabilities Found: ${scanResults.length}\nSecurity Score: ${securityScore !== null ? `${securityScore}/100` : 'Not analyzed yet'}`
    
    if (lower.includes('help')) {
      return `SENTINELHUB_AI HELP SYSTEM\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nAvailable Commands:\n• explain <vulnerability> - Get detailed explanations\n• fix <issue> - Receive remediation steps\n• analyze <code> - Security code review\n• report - Generate security summary\n• context - View current scan context\n\nExample Queries:\n> explain sql injection\n> fix hardcoded secrets\n> analyze authentication flow${contextInfo}`
    }
    
    if (lower.includes('context')) {
      const currentEngines = getEnginesForScanType(scanType);
      return `SCAN_CONTEXT_ANALYSIS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nCurrent Configuration:\n• Scan Type: ${scanType.toUpperCase()}\n• Active Tab: ${activeTab.toUpperCase()}\n• Results: ${scanResults.length} vulnerabilities\n• Security Score: ${securityScore !== null ? `${securityScore}/100` : 'Not analyzed yet'}\n• Engines: ${currentEngines.map(e => e.name).join(', ')}\n\n${scanResults.length > 0 ? 'Threats Detected:\n' + scanResults.map(r => `• ${r.type.toUpperCase()}: ${r.title}`).join('\n') : 'No active threats detected.'}`
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
      const posture = securityScore !== null ? (securityScore >= 80 ? 'GOOD' : securityScore >= 60 ? 'MODERATE' : 'CRITICAL') : 'PENDING ANALYSIS'
      return `SECURITY_ASSESSMENT_REPORT\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nScan Summary:\n• Total Issues: ${scanResults.length}\n• Critical: ${scanResults.filter(r => r.type === 'critical').length}\n• High: ${scanResults.filter(r => r.type === 'high').length}\n• Medium: ${scanResults.filter(r => r.type === 'medium').length}\n• Low: ${scanResults.filter(r => r.type === 'low').length}\n\nSecurity Posture: ${posture}\nRecommendation: ${scanResults.length === 0 ? 'Continue monitoring' : 'Address critical issues first'}${contextInfo}`
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
  const mediumCount = scanResults.filter(r => r.type === 'medium').length

  // Calculate security score (100 = perfect, 0 = critical issues)
  const calculateScore = (): number | null => {
    // Priority 1: Use API scan score from GitHub/AWS/Docker scans
    if (apiScanScore !== null) {
      return apiScanScore
    }
    // Priority 2: Use paste scan results
    if (pasteScanResult?.summary?.securityScore !== undefined) {
      return pasteScanResult.summary.securityScore
    }
    // If no scan has been run yet (no results and no paste scan), return null
    if (scanResults.length === 0 && !pasteScanResult) {
      return null // No score yet - scan hasn't been run
    }
    // If we have scan results but no pasteScanResult, calculate score
    if (scanResults.length === 0) {
      return 100 // Perfect score when scan completed with no issues
    }
    // Deduct points: Critical=-25, High=-10, Medium=-5
    const deductions = (criticalCount * 25) + (highCount * 10) + (mediumCount * 5)
    return Math.max(0, 100 - deductions)
  }

  const securityScore = calculateScore()

  const scanTypeOptions = [
    { type: 'code' as const, name: 'Code Analysis', icon: CodeBracketIcon, description: 'Paste code for analysis' },
    { type: 'github' as const, name: 'GitHub Repository', icon: CommandLineIcon, description: 'Scan GitHub repositories' },
    { type: 'aws' as const, name: 'AWS/S3 Scan', icon: CloudIcon, description: 'AWS services & S3 security scan' },
    { type: 'docker' as const, name: 'Docker Bench Security', icon: ServerIcon, description: 'CIS Docker security benchmarks' }
  ]

  const tabs = [
    { id: 'scanner' as const, name: 'Security Scanner', icon: ShieldCheckIcon },
    { id: 'results' as const, name: 'Live Results', icon: ExclamationTriangleIcon }
  ]

  // Pagination logic
  const indexOfLastResult = currentPage * resultsPerPage
  const indexOfFirstResult = indexOfLastResult - resultsPerPage
  const currentResults = scanResults.slice(indexOfFirstResult, indexOfLastResult)
  const totalPages = Math.ceil(scanResults.length / resultsPerPage)

  // Generate AI description for scan
  const generateAIDescription = async () => {
    setIsGeneratingDescription(true)
    try {
      const critical = scanResults.filter(r => r.type === 'critical').length
      const high = scanResults.filter(r => r.type === 'high').length
      const medium = scanResults.filter(r => r.type === 'medium').length
      const low = scanResults.filter(r => r.type === 'low').length

      // Get unique engines used
      const engines = Array.from(new Set(scanResults.map(r => r.engine))).filter(Boolean)

      // Generate description using Gemini AI
      const response = await fetch('http://localhost:4000/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate a professional, concise security scan summary (2-3 sentences) for a scan that found: ${critical} critical, ${high} high, ${medium} medium, ${low} low severity issues using ${engines.join(', ')}. Focus on the risk level and key findings.`
        })
      })

      const data = await response.json()
      const description = data.response || `Security scan identified ${scanResults.length} issues across ${engines.length} security engines. ${critical > 0 ? `Found ${critical} critical vulnerabilities requiring immediate attention.` : 'No critical issues detected.'}`

      setGeneratedDescription(description)
    } catch (error) {
      console.error('Failed to generate description:', error)
      const total = scanResults.length
      setGeneratedDescription(`Automated security scan completed, analyzing ${total} potential security issues.`)
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  const saveReport = () => {
    if (scanResults.length > 0) {
      // Open save modal
      setShowSaveModal(true)

      // Auto-generate name based on scan type
      const defaultName = `${scanType.toUpperCase()} Security Scan - ${new Date().toLocaleDateString()}`
      setScanName(defaultName)

      // Generate AI description
      generateAIDescription()
    }
  }

  const confirmSaveReport = () => {
    if (scanResults.length > 0) {
      // Extract REAL engines from scan results
      const uniqueEngines = Array.from(new Set(scanResults.map(r => r.engine))).filter(Boolean)

      // Get actual engines from pasteScanResult if available
      let actualEngines = uniqueEngines
      if ((pasteScanResult as any)?.metadata?.enginesUsed) {
        actualEngines = (pasteScanResult as any).metadata.enginesUsed
      }

      // Save to localStorage for SecurityReports page
      const savedReports = JSON.parse(localStorage.getItem('sentinelHub_scanReports') || '[]')
      const newReport = {
        id: `scan-${Date.now()}`,
        timestamp: new Date().toISOString(),
        name: scanName || `${scanType} Security Scan`,
        description: generatedDescription,
        source: scanType,
        sourceDetails: scanType === 'code' ? 'User submitted code' : `${scanType} scan`,
        vulnerabilities: {
          critical: scanResults.filter(r => r.type === 'critical').length,
          high: scanResults.filter(r => r.type === 'high').length,
          medium: scanResults.filter(r => r.type === 'medium').length,
          low: scanResults.filter(r => r.type === 'low').length
        },
        engines: actualEngines,
        status: 'completed',
        duration: (pasteScanResult as any)?.metadata?.duration || '2m 15s',
        scanResults: pasteScanResult // Store actual scan data for intelligence
      }
      savedReports.unshift(newReport)
      localStorage.setItem('sentinelHub_scanReports', JSON.stringify(savedReports))

      // Close modal
      setShowSaveModal(false)

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
          <div className="backdrop-blur-xl bg-gray-900/40 border border-blue-500/20 rounded-2xl p-2 shadow-xl">
            <div className="flex space-x-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                      activeTab === tab.id
                        ? 'bg-blue-700 text-white shadow-lg scale-105 border border-blue-500/40'
                        : 'text-blue-200 hover:text-white hover:bg-gray-800/30'
                    }`}
                  >
                    <IconComponent className="w-6 h-6 mr-3" />
                    <span className="text-lg">{tab.name}</span>
                    {tab.id === 'results' && scanResults.length > 0 && (
                      <span className="ml-2 bg-red-500/80 text-white text-xs px-2 py-1 rounded-full font-bold">
                        {scanResults.length}
                      </span>
                    )}
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
                              ? 'bg-blue-900/50 text-blue-300 border border-blue-400/30'
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
                    <div className="mb-6 space-y-4">
                      <div className="flex flex-col space-y-2">
                        <label className="text-sm text-gray-400 font-medium">Language</label>
                        <div className="relative">
                          <select
                            value={selectedLanguage}
                            onChange={(e) => {
                              const newLanguage = e.target.value;
                              setSelectedLanguage(newLanguage);
                              setCodeInput(getExampleCode(newLanguage));
                            }}
                            className="w-full bg-black/40 border border-gray-600/50 rounded-lg px-4 py-2 text-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 appearance-none cursor-pointer transition-all duration-200 hover:border-gray-500/70"
                          >
                            <option value="javascript" className="bg-gray-900 text-gray-300">JavaScript/TypeScript</option>
                            <option value="python" className="bg-gray-900 text-gray-300">Python</option>
                            <option value="java" className="bg-gray-900 text-gray-300">Java</option>
                            <option value="php" className="bg-gray-900 text-gray-300">PHP</option>
                            <option value="go" className="bg-gray-900 text-gray-300">Go</option>
                            <option value="sql" className="bg-gray-900 text-gray-300">SQL</option>
                            <option value="rust" className="bg-gray-900 text-gray-300">Rust</option>
                            <option value="csharp" className="bg-gray-900 text-gray-300">C#</option>
                            <option value="cpp" className="bg-gray-900 text-gray-300">C++</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <ChevronRightIcon className="w-4 h-4 text-gray-500 rotate-90" />
                          </div>
                        </div>
                      </div>
                      
                    </div>
                    
                    {/* Language Mismatch Alert */}
                    {showLanguageAlert && (
                      <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg flex items-center space-x-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                        <div>
                          <div className="text-yellow-200 font-medium text-sm">Language Mismatch Detected</div>
                          <div className="text-yellow-300/80 text-xs">The code doesn't match the selected language. Results may be less accurate.</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="relative">
                      <textarea
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value)}
                        placeholder={`Paste your ${selectedLanguage} code here for security analysis...`}
                        className="w-full h-80 bg-black/20 border border-gray-600/30 rounded-lg px-4 py-3 text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 font-mono text-sm resize-none transition-all duration-200"
                        spellCheck={false}
                      />
                      {enableLiveScanning && isLiveScanning && (
                        <div className="absolute top-3 right-3 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-500 font-medium">Live Scanning...</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex gap-3">
                        <button
                          onClick={startScan}
                          disabled={isScanning || !codeInput.trim()}
                          className="flex items-center px-6 py-3 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-800 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 border border-blue-500/30 backdrop-blur-sm"
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
                        <button
                          onClick={() => setEnableLiveScanning(!enableLiveScanning)}
                          className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 border backdrop-blur-sm ${
                            enableLiveScanning 
                              ? 'bg-green-700 hover:bg-green-600 border-green-500/30 text-green-100'
                              : 'bg-gray-600/80 hover:bg-gray-500/80 border-gray-500/30 text-gray-300'
                          }`}
                        >
                          {isLiveScanning ? (
                            <div className="w-5 h-5 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                            <EyeIcon className="w-5 h-5 mr-2" />
                          )}
                          Live Scan {enableLiveScanning ? 'ON' : 'OFF'}
                        </button>
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
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <CommandLineIcon className="w-6 h-6 text-green-400 mr-3" />
                        <h3 className="text-xl font-semibold text-white">GitHub Repository Scanner</h3>
                      </div>
                      {repositories.length > 0 && (
                        <div className="text-sm text-green-400 bg-green-900/20 px-3 py-1 rounded-full">
                          {repositories.length} repositories
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Select Repository
                        </label>
                        {loadingRepos ? (
                          <div className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-gray-400 flex items-center">
                            <div className="w-5 h-5 mr-3 border-2 border-gray-400/20 border-t-gray-400 rounded-full animate-spin" />
                            Loading repositories...
                          </div>
                        ) : repositories.length === 0 ? (
                          <div className="w-full bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 flex items-center">
                            <ExclamationTriangleIcon className="w-5 h-5 mr-3" />
                            No repositories found. Check GitHub connection in Settings.
                          </div>
                        ) : (
                          <select
                            value={selectedRepository}
                            onChange={(e) => setSelectedRepository(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 appearance-none cursor-pointer"
                            style={{
                              backgroundImage: "url('data:image/svg+xml,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3e%3cpath stroke=%22%236b7280%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3e%3c/svg%3e')",
                              backgroundPosition: 'right 0.5rem center',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: '1.5em 1.5em',
                              paddingRight: '2.5rem'
                            }}
                          >
                            <option value="">Choose a repository...</option>
                            {repositories.map((repo) => (
                              <option key={repo.id} value={repo.full_name} className="bg-gray-800 text-white">
                                {repo.full_name} {repo.private ? '[Private]' : '[Public]'} • {repo.language || 'Unknown'} • Stars: {repo.stargazers_count}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {/* Selected Repository Preview */}
                        {selectedRepository && (
                          <div className="mt-3 bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                            {(() => {
                              const repo = repositories.find(r => r.full_name === selectedRepository)
                              return repo ? (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-3">
                                    <img src={repo.owner.avatar_url} alt={repo.owner.login} className="w-8 h-8 rounded-full" />
                                    <div>
                                      <h4 className="text-green-400 font-medium">{repo.name}</h4>
                                      <p className="text-sm text-gray-400">{repo.description || 'No description'}</p>
                                    </div>
                                    <div className="ml-auto flex items-center space-x-2 text-sm text-gray-400">
                                      <span>{repo.private ? 'Private' : 'Public'}</span>
                                      <span>•</span>
                                      <span>{repo.language}</span>
                                      <span>•</span>
                                      <span>Stars: {repo.stargazers_count}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : null
                            })()}
                          </div>
                        )}

                        {repositories.length > 0 && (
                          <button
                            onClick={loadRepositories}
                            className="mt-2 text-sm text-green-400 hover:text-green-300 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh repositories
                          </button>
                        )}
                      </div>
                      {/* Demo Notice */}
                      <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-xl p-4 mb-4">
                        <div className="flex items-center mb-2">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></div>
                          <h4 className="text-cyan-400 font-medium text-sm">Development Environment</h4>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          Currently displaying repositories from configured development account. In production deployment, each user would authenticate with their own GitHub account to access their personal repositories and organizations.
                        </p>
                      </div>

                      <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                        <h4 className="text-green-400 font-medium mb-2">Security Analysis Includes:</h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Source code vulnerabilities (ESLint Security)</li>
                          <li>• Dependency security issues</li>
                          <li>• Secret detection in history</li>
                          <li>• Configuration security</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={startScan}
                        disabled={isScanning || !selectedRepository.trim()}
                        className="flex items-center px-6 py-3 bg-green-700 hover:bg-green-600 disabled:bg-gray-800 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 border border-green-500/30 backdrop-blur-sm"
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
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <CloudIcon className="w-6 h-6 text-orange-400 mr-3" />
                        <h3 className="text-xl font-semibold text-white">AWS S3 Security Scanner</h3>
                      </div>
                      {s3Buckets.length > 0 && (
                        <div className="text-sm text-orange-400 bg-orange-900/20 px-3 py-1 rounded-full">
                          {s3Buckets.length} buckets
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Select S3 Bucket
                        </label>
                        {loadingS3Buckets ? (
                          <div className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-gray-400 flex items-center">
                            <div className="w-5 h-5 mr-3 border-2 border-gray-400/20 border-t-gray-400 rounded-full animate-spin" />
                            Loading S3 buckets...
                          </div>
                        ) : s3Buckets.length === 0 ? (
                          <div className="w-full bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 flex items-center">
                            <ExclamationTriangleIcon className="w-5 h-5 mr-3" />
                            No S3 buckets found. Check AWS connection in Settings.
                          </div>
                        ) : (
                          <select
                            value={selectedS3Bucket}
                            onChange={(e) => setSelectedS3Bucket(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 appearance-none cursor-pointer"
                            style={{
                              backgroundImage: "url('data:image/svg+xml,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3e%3cpath stroke=%22%236b7280%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3e%3c/svg%3e')",
                              backgroundPosition: 'right 0.5rem center',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: '1.5em 1.5em',
                              paddingRight: '2.5rem'
                            }}
                          >
                            <option value="">Choose an S3 bucket...</option>
                            {s3Buckets.map((bucket, index) => (
                              <option key={index} value={bucket.Name} className="bg-gray-800 text-white">
                                {bucket.Name} • Created: {new Date(bucket.CreationDate).toLocaleDateString()}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {/* Selected S3 Bucket Preview */}
                        {selectedS3Bucket && (
                          <div className="mt-3 bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
                            {(() => {
                              const bucket = s3Buckets.find(b => b.Name === selectedS3Bucket)
                              return bucket ? (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                                      <CloudIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <h4 className="text-orange-400 font-medium">{bucket.Name}</h4>
                                      <p className="text-sm text-gray-400">Created: {new Date(bucket.CreationDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="ml-auto flex items-center space-x-2 text-sm text-gray-400">
                                      <span>S3 Bucket</span>
                                      <span>•</span>
                                      <span>Region: us-east-1</span>
                                    </div>
                                  </div>
                                </div>
                              ) : null
                            })()}
                          </div>
                        )}

                        {s3Buckets.length > 0 && (
                          <button
                            onClick={loadS3Buckets}
                            className="mt-2 text-sm text-orange-400 hover:text-orange-300 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh S3 buckets
                          </button>
                        )}
                      </div>
                      
                      {/* Development Environment Notice */}
                      <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-xl p-4 mb-4">
                        <div className="flex items-center mb-2">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></div>
                          <h4 className="text-cyan-400 font-medium text-sm">Development Environment</h4>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          Currently displaying S3 buckets from configured development AWS account with automatic fallback to comprehensive mock data for reliable demonstration.
                        </p>
                      </div>

                      <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
                        <h4 className="text-orange-400 font-medium mb-2">AWS S3 Security Analysis:</h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• S3 bucket permissions & public access</li>
                          <li>• Server-side encryption configuration</li>
                          <li>• Versioning and backup policies</li>
                          <li>• Access logging and monitoring</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={startScan}
                        disabled={isScanning || !selectedS3Bucket.trim()}
                        className="flex items-center px-6 py-3 bg-orange-700 hover:bg-orange-600 disabled:bg-gray-800 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 border border-orange-500/30 backdrop-blur-sm"
                      >
                        {isScanning ? (
                          <>
                            <div className="w-5 h-5 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Scanning S3 Bucket...
                          </>
                        ) : (
                          <>
                            <PlayIcon className="w-5 h-5 mr-2" />
                            Scan S3 Bucket
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Docker Container Tab */}
                {scanType === 'docker' && (
                  <div className="backdrop-blur-xl bg-white/5 border border-purple-500/20 rounded-2xl p-6 hover:border-purple-400/40 transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <ServerIcon className="w-6 h-6 text-purple-400 mr-3" />
                        <h3 className="text-xl font-semibold text-white">Docker Container Scanner</h3>
                      </div>
                      {dockerImages.length > 0 && (
                        <div className="text-sm text-purple-400 bg-purple-900/20 px-3 py-1 rounded-full">
                          {dockerImages.length} images
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Select Docker Image
                        </label>
                        {loadingDockerImages ? (
                          <div className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-gray-400 flex items-center">
                            <div className="w-5 h-5 mr-3 border-2 border-gray-400/20 border-t-gray-400 rounded-full animate-spin" />
                            Loading Docker images...
                          </div>
                        ) : (
                          <select
                            value={selectedDockerImage}
                            onChange={(e) => setSelectedDockerImage(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 appearance-none cursor-pointer"
                            style={{
                              backgroundImage: "url('data:image/svg+xml,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3e%3cpath stroke=%22%236b7280%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3e%3c/svg%3e')",
                              backgroundPosition: 'right 0.5rem center',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: '1.5em 1.5em',
                              paddingRight: '2.5rem'
                            }}
                          >
                            <option value="">Choose a Docker image...</option>
                            {dockerImages.map((image, index) => (
                              <option key={index} value={image.full_name} className="bg-gray-800 text-white">
                                {image.full_name} {image.is_private ? '[Private]' : '[Public]'} • Stars: {image.star_count} • Pulls: {image.pull_count}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {/* Selected Docker Image Preview */}
                        {selectedDockerImage && (
                          <div className="mt-3 bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
                            {(() => {
                              const image = dockerImages.find(img => img.full_name === selectedDockerImage)
                              return image ? (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                      <CpuChipIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <h4 className="text-purple-400 font-medium">{image.name}</h4>
                                      <p className="text-sm text-gray-400">{image.description}</p>
                                    </div>
                                    <div className="ml-auto flex items-center space-x-2 text-sm text-gray-400">
                                      <span>{image.is_private ? 'Private' : 'Public'}</span>
                                      <span>•</span>
                                      <span>Stars: {image.star_count}</span>
                                      <span>•</span>
                                      <span>Pulls: {image.pull_count}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : null
                            })()}
                          </div>
                        )}

                        {dockerImages.length > 0 && (
                          <button
                            onClick={loadDockerImages}
                            className="mt-2 text-sm text-purple-400 hover:text-purple-300 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh Docker images
                          </button>
                        )}
                      </div>
                      
                      {/* Development Environment Notice */}
                      <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-xl p-4 mb-4">
                        <div className="flex items-center mb-2">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></div>
                          <h4 className="text-cyan-400 font-medium text-sm">Development Environment</h4>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          Currently displaying Docker images from configured development account with automatic fallback to comprehensive mock data for reliable demonstration.
                        </p>
                      </div>

                      <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
                        <h4 className="text-purple-400 font-medium mb-2">Container Security Analysis:</h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Base image vulnerabilities (Docker Bench)</li>
                          <li>• Configuration security issues</li>
                          <li>• Package vulnerabilities (Trivy Scanner)</li>
                          <li>• Runtime security compliance</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={startScan}
                        disabled={isScanning || !selectedDockerImage.trim()}
                        className="flex items-center px-6 py-3 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-800 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 border border-purple-500/30 backdrop-blur-sm"
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
                    <DocumentTextIcon className="w-4 h-4 mr-2" />
                    Save & Refresh
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
                
                {/* Save & Export Buttons at Bottom */}
                <div className="mt-8 flex justify-center gap-4">
                  <button
                    onClick={saveReport}
                    className="flex items-center px-8 py-3 bg-blue-700 hover:bg-blue-600 rounded-xl font-semibold transition-all duration-300 border border-blue-500/40 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105 group"
                  >
                    <DocumentTextIcon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                    <span>Save Report</span>
                  </button>
                  <button
                    onClick={() => {
                      const exportData = {
                        timestamp: new Date().toISOString(),
                        scanType: scanType,
                        results: scanResults,
                        summary: {
                          total: scanResults.length,
                          critical: scanResults.filter(r => r.type === 'critical').length,
                          high: scanResults.filter(r => r.type === 'high').length,
                          medium: scanResults.filter(r => r.type === 'medium').length,
                          low: scanResults.filter(r => r.type === 'low').length
                        },
                        fullScanData: pasteScanResult
                      }
                      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `security-scan-${Date.now()}.json`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="flex items-center px-8 py-3 bg-purple-700 hover:bg-purple-600 rounded-xl font-semibold transition-all duration-300 border border-purple-500/40 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105 group"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                    <span>Export JSON</span>
                  </button>
                </div>
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
                  <div className={`text-2xl font-bold ${securityScore === null ? 'text-gray-600' : securityScore >= 80 ? 'text-green-400' : securityScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {securityScore === null ? '---' : securityScore}
                  </div>
                  <div className="text-xs text-gray-400">
                    {securityScore === null ? 'Run scan to analyze' : scanResults.length === 0 ? 'Perfect score' : `${scanResults.length} issues`}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced AI Assistant */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="bg-gray-900/60 border-b border-blue-500/20 p-4">
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
                            ? 'bg-blue-800/50 border border-blue-500/40 text-blue-100' 
                            : 'bg-gray-800/50 border border-gray-600/40 text-gray-100'
                        }`}>
                          <div className="flex items-center mb-2">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              msg.role === 'user' ? 'bg-blue-400' : 'bg-green-400'
                            }`}></div>
                            <span className="font-semibold text-sm">
                              {msg.role === 'user' ? 'You' : 'SentinelHub AI'}
                            </span>
                            <span className="text-xs text-gray-400 ml-auto flex items-center gap-2">
                              {msg.role === 'ai' && <VoiceButton text={msg.content} size="sm" />}
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown
                              components={{
                                h1: ({children}) => <h1 className="text-lg font-bold text-gray-100 mb-2">{children}</h1>,
                                h2: ({children}) => <h2 className="text-md font-bold text-gray-200 mb-2">{children}</h2>,
                                h3: ({children}) => <h3 className="text-sm font-bold text-gray-300 mb-1">{children}</h3>,
                                p: ({children}) => <p className="text-gray-100 mb-2">{children}</p>,
                                ul: ({children}) => <ul className="list-disc list-inside text-gray-100 ml-2 mb-2">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-inside text-gray-100 ml-2 mb-2">{children}</ol>,
                                li: ({children}) => <li className="mb-1">{children}</li>,
                                strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
                                code: ({children}) => <code className="bg-gray-700 px-1 py-0.5 rounded text-orange-300 text-xs">{children}</code>,
                                pre: ({children}) => <pre className="bg-gray-800 p-2 rounded text-gray-200 text-xs overflow-x-auto">{children}</pre>
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="mr-4 max-w-[85%]">
                        <div className="bg-gray-800/50 border border-gray-600/40 text-gray-100 p-4 rounded-2xl backdrop-blur-sm">
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
                      className="px-6 py-3 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-800 disabled:opacity-50 rounded-xl transition-all duration-200 border border-blue-500/50 backdrop-blur-sm group"
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

      {/* Save Report Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-blue-500/30 rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <DocumentTextIcon className="w-7 h-7 mr-3 text-blue-400" />
                  Save Security Scan Report
                </h2>
                <p className="text-sm text-gray-400 mt-1">Configure report details before saving</p>
              </div>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Report Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Report Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={scanName}
                onChange={(e) => setScanName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="e.g., Production API Security Audit"
              />
            </div>

            {/* AI Generated Description */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-300">
                  Description
                </label>
                {isGeneratingDescription && (
                  <div className="flex items-center text-xs text-blue-400">
                    <CpuChipIcon className="w-4 h-4 mr-1 animate-spin" />
                    AI Generating...
                  </div>
                )}
              </div>
              <textarea
                value={generatedDescription}
                onChange={(e) => setGeneratedDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                placeholder="AI will generate a description based on scan results..."
              />
              <p className="text-xs text-gray-500 mt-2">
                <CpuChipIcon className="w-3 h-3 inline mr-1" />
                AI-generated summary • You can edit this
              </p>
            </div>

            {/* Scan Summary */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-semibold text-blue-300 mb-3">Scan Summary</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {scanResults.filter(r => r.type === 'critical').length}
                  </div>
                  <div className="text-xs text-gray-400">Critical</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {scanResults.filter(r => r.type === 'high').length}
                  </div>
                  <div className="text-xs text-gray-400">High</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {scanResults.filter(r => r.type === 'medium').length}
                  </div>
                  <div className="text-xs text-gray-400">Medium</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {scanResults.filter(r => r.type === 'low').length}
                  </div>
                  <div className="text-xs text-gray-400">Low</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-6 py-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-600/50 rounded-xl text-white font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmSaveReport}
                disabled={!scanName.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl text-white font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}