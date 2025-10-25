/**
 * AI-Powered Persona System
 * Analyzes user's scan patterns and assigns an IT security role
 * Uses Google Gemini AI
 */

export interface SecurityPersona {
  id: string
  name: string
  title: string
  description: string
  badge: string
  color: string
  icon: string
  traits: string[]
  recommendations: string[]
}

export const AVAILABLE_PERSONAS: SecurityPersona[] = [
  {
    id: 'guardian',
    name: 'The Guardian',
    title: 'Security Guardian',
    description: 'You are a vigilant protector who prioritizes prevention and continuous monitoring. Your scans are thorough and regular.',
    badge: '🛡️',
    color: 'from-blue-500 to-cyan-600',
    icon: 'shield',
    traits: ['Preventive', 'Vigilant', 'Methodical', 'Defensive'],
    recommendations: [
      'Focus on preventive measures',
      'Implement continuous monitoring',
      'Regular security audits'
    ]
  },
  {
    id: 'pentester',
    name: 'The Penetration Tester',
    title: 'Offensive Security Expert',
    description: 'You think like an attacker. Your approach is aggressive, testing every possible vulnerability to find weaknesses before the bad guys do.',
    badge: '🕵️',
    color: 'from-red-500 to-orange-600',
    icon: 'bug',
    traits: ['Offensive', 'Aggressive', 'Creative', 'Exploit-focused'],
    recommendations: [
      'Conduct regular penetration tests',
      'Think like an attacker',
      'Test all possible attack vectors'
    ]
  },
  {
    id: 'architect',
    name: 'The Security Architect',
    title: 'Infrastructure Security Expert',
    description: 'You focus on the big picture, designing secure systems from the ground up. You prioritize AWS, Docker, and infrastructure security.',
    badge: '🏗️',
    color: 'from-purple-500 to-pink-600',
    icon: 'building',
    traits: ['Strategic', 'Systematic', 'Infrastructure-focused', 'Planner'],
    recommendations: [
      'Design secure architectures',
      'Focus on infrastructure hardening',
      'Implement security by design'
    ]
  },
  {
    id: 'code_ninja',
    name: 'The Code Ninja',
    title: 'Application Security Specialist',
    description: 'Your expertise lies in code-level security. You hunt for SQL injection, XSS, and other application vulnerabilities with precision.',
    badge: '🥷',
    color: 'from-green-500 to-teal-600',
    icon: 'code',
    traits: ['Detail-oriented', 'Code-focused', 'OWASP expert', 'Precise'],
    recommendations: [
      'Deep dive into code security',
      'Master OWASP Top 10',
      'Implement secure coding practices'
    ]
  },
  {
    id: 'wizard',
    name: 'The Security Wizard',
    title: 'All-Rounder Security Expert',
    description: 'You master all aspects of security. Your scans are comprehensive, covering everything from code to infrastructure to cloud.',
    badge: '🧙',
    color: 'from-yellow-500 to-amber-600',
    icon: 'sparkles',
    traits: ['Versatile', 'Comprehensive', 'Experienced', 'Holistic'],
    recommendations: [
      'Maintain broad security knowledge',
      'Balance all security domains',
      'Stay updated on all threats'
    ]
  },
  {
    id: 'hunter',
    name: 'The Threat Hunter',
    title: 'Threat Intelligence Specialist',
    description: 'You actively hunt for threats using intelligence feeds. Your focus is on detecting and responding to real-world attacks.',
    badge: '🎯',
    color: 'from-indigo-500 to-blue-600',
    icon: 'fire',
    traits: ['Proactive', 'Intelligence-driven', 'Threat-focused', 'Responsive'],
    recommendations: [
      'Use threat intelligence feeds',
      'Proactive threat hunting',
      'Real-time attack detection'
    ]
  }
]

export interface ScanPattern {
  totalScans: number
  scanTypes: {
    code: number
    repository: number
    container: number
    s3: number
  }
  securityFocus: {
    vulnerabilities: number
    compliance: number
    secrets: number
    dependencies: number
  }
  avgSecurityScore: number
  criticalFindings: number
  scanFrequency: 'high' | 'medium' | 'low'
  lastScanTime?: Date
}

/**
 * Analyze scan patterns using Gemini AI and suggest a persona
 */
export async function analyzePersona(pattern: ScanPattern): Promise<SecurityPersona> {
  try {
    // For now, use rule-based analysis
    // In production, you can call Gemini API for more sophisticated analysis

    const { totalScans, scanTypes, securityFocus, avgSecurityScore, criticalFindings, scanFrequency } = pattern

    // Rule-based persona selection

    // The Wizard - All-rounder with diverse scans
    if (totalScans > 20 &&
        Object.values(scanTypes).filter(v => v > 0).length >= 3 &&
        avgSecurityScore > 70) {
      return AVAILABLE_PERSONAS.find(p => p.id === 'wizard') || AVAILABLE_PERSONAS[0]
    }

    // The Pentester - Focused on finding vulnerabilities
    if (securityFocus.vulnerabilities > securityFocus.compliance * 2 &&
        criticalFindings > 5) {
      return AVAILABLE_PERSONAS.find(p => p.id === 'pentester') || AVAILABLE_PERSONAS[0]
    }

    // The Architect - Focuses on infrastructure
    if (scanTypes.container + scanTypes.s3 > scanTypes.code + scanTypes.repository) {
      return AVAILABLE_PERSONAS.find(p => p.id === 'architect') || AVAILABLE_PERSONAS[0]
    }

    // The Code Ninja - Code-focused
    if (scanTypes.code + scanTypes.repository > scanTypes.container + scanTypes.s3 * 2) {
      return AVAILABLE_PERSONAS.find(p => p.id === 'code_ninja') || AVAILABLE_PERSONAS[0]
    }

    // The Threat Hunter - Uses threat intelligence
    if (securityFocus.dependencies > 10 || securityFocus.secrets > 5) {
      return AVAILABLE_PERSONAS.find(p => p.id === 'hunter') || AVAILABLE_PERSONAS[0]
    }

    // The Guardian - Regular, thorough scans
    if (scanFrequency === 'high' && avgSecurityScore > 80) {
      return AVAILABLE_PERSONAS.find(p => p.id === 'guardian') || AVAILABLE_PERSONAS[0]
    }

    // Default to Guardian for new users
    return AVAILABLE_PERSONAS.find(p => p.id === 'guardian') || AVAILABLE_PERSONAS[0]

  } catch (error) {
    console.error('Error analyzing persona:', error)
    return AVAILABLE_PERSONAS[0] // Default to Guardian
  }
}

/**
 * Calculate scan pattern from saved reports
 */
export function calculateScanPattern(savedReports: any[]): ScanPattern {
  const scanTypes = {
    code: 0,
    repository: 0,
    container: 0,
    s3: 0
  }

  const securityFocus = {
    vulnerabilities: 0,
    compliance: 0,
    secrets: 0,
    dependencies: 0
  }

  let totalScore = 0
  let criticalFindings = 0

  savedReports.forEach(report => {
    // Count scan types
    const source = report.source?.toLowerCase() || 'code'
    if (source in scanTypes) {
      scanTypes[source as keyof typeof scanTypes]++
    }

    // Count security focus
    const vulns = report.vulnerabilities || {}
    securityFocus.vulnerabilities += Object.values(vulns).reduce((a: number, b: any) => a + (b || 0), 0)
    securityFocus.secrets += report.secretsFound || 0
    securityFocus.dependencies += report.outdatedDeps || 0

    // Calculate scores
    totalScore += report.score || 50
    criticalFindings += vulns.critical || 0
  })

  const avgSecurityScore = savedReports.length > 0
    ? Math.round(totalScore / savedReports.length)
    : 0

  // Determine scan frequency
  let scanFrequency: 'high' | 'medium' | 'low' = 'low'
  if (savedReports.length > 10) scanFrequency = 'high'
  else if (savedReports.length > 5) scanFrequency = 'medium'

  return {
    totalScans: savedReports.length,
    scanTypes,
    securityFocus,
    avgSecurityScore,
    criticalFindings,
    scanFrequency,
    lastScanTime: savedReports.length > 0
      ? new Date(savedReports[savedReports.length - 1].timestamp)
      : undefined
  }
}

/**
 * Generate persona insights using Gemini AI (optional enhancement)
 */
export async function generatePersonaInsights(persona: SecurityPersona, pattern: ScanPattern): Promise<string[]> {
  // In production, call Gemini API here
  // For now, return static insights based on persona

  const insights: Record<string, string[]> = {
    guardian: [
      `You've completed ${pattern.totalScans} scans with an average score of ${pattern.avgSecurityScore}/100`,
      'Your preventive approach is commendable',
      'Consider implementing automated weekly scans'
    ],
    pentester: [
      `You've identified ${pattern.criticalFindings} critical vulnerabilities`,
      'Your offensive approach is finding real weaknesses',
      'Document your findings for the development team'
    ],
    architect: [
      'Your infrastructure focus is strengthening your security posture',
      'Consider implementing Infrastructure as Code security',
      'Review cloud security best practices regularly'
    ],
    code_ninja: [
      'Your code-level expertise is catching vulnerabilities early',
      'Implement pre-commit hooks for security checks',
      'Share secure coding guidelines with your team'
    ],
    wizard: [
      'Your comprehensive approach covers all security aspects',
      'Maintain your balanced security strategy',
      'Consider mentoring others in security practices'
    ],
    hunter: [
      'Your threat intelligence usage is proactive',
      'Stay updated on the latest threat feeds',
      'Implement automated threat detection rules'
    ]
  }

  return insights[persona.id] || insights.guardian
}
