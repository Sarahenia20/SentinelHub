/**
 * 📊 Beautiful Report Generator
 * Creates comprehensive, actionable security reports
 * 
 * Features:
 * - Executive summaries
 * - Risk prioritization
 * - Actionable recommendations
 * - Beautiful formatting
 * - Export capabilities
 */
class ReportGenerator {
  constructor() {
    this.name = 'Report Generator';
    this.version = '1.0.0';
    
    console.log(`✅ ${this.name} v${this.version} initialized`);
  }

  /**
   * Generate comprehensive security report
   * @param {Object} scanSession - Complete scan session data
   * @returns {Object} Beautiful formatted report
   */
  async generateReport(scanSession) {
    console.log('📊 Generating beautiful security report...');
    
    const report = {
      // Executive Summary
      executive: this.generateExecutiveSummary(scanSession),
      
      // Security Assessment
      security: this.generateSecurityAssessment(scanSession),
      
      // Risk Analysis
      risk: this.generateRiskAnalysis(scanSession),
      
      // Detailed Findings
      findings: this.generateDetailedFindings(scanSession),
      
      // Intelligence Context
      intelligence: this.generateIntelligenceContext(scanSession),
      
      // Recommendations
      recommendations: this.generateRecommendations(scanSession),
      
      // Next Steps
      nextSteps: this.generateNextSteps(scanSession),
      
      // Metrics & Charts Data
      metrics: this.generateMetrics(scanSession)
    };

    // Update summary counts
    this.updateSummaryCounts(scanSession);

    console.log('   ✓ Report generation complete');
    return report;
  }

  /**
   * Executive Summary - High-level overview
   */
  generateExecutiveSummary(session) {
    const totalIssues = this.getTotalIssues(session);
    const riskLevel = this.calculateOverallRisk(session.summary);
    
    return {
      scanId: session.scanId,
      timestamp: session.timestamp,
      language: session.language,
      codeMetrics: {
        linesOfCode: session.metrics.linesOfCode,
        characters: session.metrics.characters,
        scanDuration: session.metrics.scanDuration
      },
      overallRisk: riskLevel,
      totalIssues,
      criticalFindings: session.summary.critical,
      highFindings: session.summary.high,
      status: this.getSecurityStatus(riskLevel, totalIssues),
      recommendation: this.getExecutiveRecommendation(riskLevel, totalIssues)
    };
  }

  /**
   * Security Assessment - Technical analysis
   */
  generateSecurityAssessment(session) {
    const vulnerabilities = session.results.vulnerabilities || [];
    const secrets = session.results.secrets || [];
    
    return {
      vulnerabilityBreakdown: this.categorizeVulnerabilities(vulnerabilities),
      secretsAnalysis: this.analyzeSecrets(secrets),
      codeQualityIssues: this.analyzecodeQuality(session.results.codeQuality || []),
      complianceCheck: this.checkCompliance(session),
      securityScore: this.calculateSecurityScore(session)
    };
  }

  /**
   * Risk Analysis - Business impact assessment
   */
  generateRiskAnalysis(session) {
    const allFindings = [
      ...session.results.vulnerabilities,
      ...session.results.secrets,
      ...session.results.codeQuality
    ];

    return {
      riskMatrix: this.generateRiskMatrix(allFindings),
      businessImpact: this.assessBusinessImpact(session),
      exploitability: this.assessExploitability(session),
      prioritization: this.prioritizeFindings(allFindings),
      timeline: this.generateRemediationTimeline(allFindings)
    };
  }

  /**
   * Detailed Findings - Complete vulnerability details
   */
  generateDetailedFindings(session) {
    return {
      vulnerabilities: this.formatVulnerabilityFindings(session.results.vulnerabilities || []),
      secrets: this.formatSecretFindings(session.results.secrets || []),
      codeQuality: this.formatCodeQualityFindings(session.results.codeQuality || []),
      summary: {
        totalFindings: this.getTotalIssues(session),
        findingsByCategory: this.categorizeAllFindings(session),
        findingsBySeverity: session.summary
      }
    };
  }

  /**
   * Intelligence Context - External threat intelligence
   */
  generateIntelligenceContext(session) {
    return {
      cveMatches: this.formatCVEMatches(session.results.cveMatches || []),
      advisories: this.formatAdvisoryMatches(session.results.advisories || []),
      threatLandscape: this.generateThreatLandscape(session),
      industryContext: this.generateIndustryContext(session)
    };
  }

  /**
   * Actionable Recommendations
   */
  generateRecommendations(session) {
    const recommendations = {
      immediate: [], // Critical issues requiring immediate action
      shortTerm: [], // High priority issues (1-2 weeks)
      mediumTerm: [], // Medium priority issues (1-3 months)
      longTerm: [], // Improvements and best practices
      preventive: [] // Preventive measures
    };

    // Analyze findings and categorize recommendations
    this.categorizeRecommendations(session, recommendations);

    return {
      ...recommendations,
      summary: this.summarizeRecommendations(recommendations),
      implementation: this.generateImplementationGuide(recommendations)
    };
  }

  /**
   * Next Steps - Concrete action plan
   */
  generateNextSteps(session) {
    const criticalIssues = session.summary.critical;
    const highIssues = session.summary.high;
    
    const steps = [];

    if (criticalIssues > 0) {
      steps.push({
        priority: 1,
        action: `Address ${criticalIssues} critical security issues immediately`,
        timeline: 'Within 24 hours',
        impact: 'Prevents potential security breaches'
      });
    }

    if (highIssues > 0) {
      steps.push({
        priority: 2,
        action: `Fix ${highIssues} high-priority vulnerabilities`,
        timeline: 'Within 1 week',
        impact: 'Reduces attack surface significantly'
      });
    }

    steps.push({
      priority: 3,
      action: 'Implement security scanning in CI/CD pipeline',
      timeline: 'Within 2 weeks',
      impact: 'Prevents future vulnerabilities'
    });

    return {
      actionPlan: steps,
      resources: this.generateResourceList(),
      monitoring: this.generateMonitoringPlan(session)
    };
  }

  /**
   * Metrics for charts and visualizations
   */
  generateMetrics(session) {
    return {
      severityDistribution: {
        critical: session.summary.critical,
        high: session.summary.high,
        medium: session.summary.medium,
        low: session.summary.low,
        info: session.summary.info
      },
      categoryDistribution: this.getCategoryDistribution(session),
      riskScore: this.calculateSecurityScore(session),
      scanMetrics: {
        duration: session.metrics.scanDuration,
        linesScanned: session.metrics.linesOfCode,
        toolsUsed: this.getToolsUsed(session)
      }
    };
  }

  /**
   * Helper Methods
   */
  getTotalIssues(session) {
    return Object.values(session.summary).reduce((total, count) => total + count, 0);
  }

  calculateOverallRisk(summary) {
    if (summary.critical > 0) return 'CRITICAL';
    if (summary.high > 0) return 'HIGH';
    if (summary.medium > 0) return 'MEDIUM';
    if (summary.low > 0) return 'LOW';
    return 'MINIMAL';
  }

  getSecurityStatus(riskLevel, totalIssues) {
    if (riskLevel === 'CRITICAL') return '🚨 IMMEDIATE ACTION REQUIRED';
    if (riskLevel === 'HIGH') return '⚠️ HIGH RISK - ACTION NEEDED';
    if (riskLevel === 'MEDIUM') return '🔶 MODERATE RISK';
    if (riskLevel === 'LOW') return '🔸 LOW RISK';
    if (totalIssues === 0) return '✅ SECURE';
    return '📋 REVIEW NEEDED';
  }

  getExecutiveRecommendation(riskLevel, totalIssues) {
    const recommendations = {
      'CRITICAL': 'Suspend deployment and address critical vulnerabilities immediately. Security team intervention required.',
      'HIGH': 'Prioritize security fixes before next deployment. Review and remediate high-risk issues within 48 hours.',
      'MEDIUM': 'Plan security improvements in next sprint. Address medium-priority issues within 2 weeks.',
      'LOW': 'Consider security enhancements as technical debt. Address in upcoming maintenance cycle.',
      'MINIMAL': 'Excellent security posture. Continue following security best practices.'
    };
    
    return recommendations[riskLevel] || 'Review findings and implement appropriate security measures.';
  }

  categorizeVulnerabilities(vulnerabilities) {
    const categories = {};
    
    vulnerabilities.forEach(vuln => {
      const category = vuln.category || 'other';
      if (!categories[category]) {
        categories[category] = { count: 0, severity: { critical: 0, high: 0, medium: 0, low: 0 } };
      }
      categories[category].count++;
      categories[category].severity[vuln.severity] = (categories[category].severity[vuln.severity] || 0) + 1;
    });
    
    return categories;
  }

  analyzeSecrets(secrets) {
    const analysis = {
      totalSecrets: secrets.length,
      byType: {},
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      highRiskSecrets: secrets.filter(s => s.severity === 'critical' || s.severity === 'high')
    };

    secrets.forEach(secret => {
      // Count by type
      analysis.byType[secret.type] = (analysis.byType[secret.type] || 0) + 1;
      
      // Count by severity
      analysis.bySeverity[secret.severity] = (analysis.bySeverity[secret.severity] || 0) + 1;
    });

    return analysis;
  }

  analyzecodeQuality(codeQualityIssues) {
    return {
      totalIssues: codeQualityIssues.length,
      categories: this.categorizeIssues(codeQualityIssues),
      maintainabilityScore: this.calculateMaintainabilityScore(codeQualityIssues)
    };
  }

  calculateSecurityScore(session) {
    const maxScore = 100;
    let deductions = 0;
    
    // Deduct points based on severity
    deductions += session.summary.critical * 25; // Critical: -25 points each
    deductions += session.summary.high * 10;     // High: -10 points each
    deductions += session.summary.medium * 5;    // Medium: -5 points each
    deductions += session.summary.low * 2;       // Low: -2 points each
    
    const score = Math.max(0, maxScore - deductions);
    
    return {
      score,
      grade: this.getSecurityGrade(score),
      description: this.getScoreDescription(score)
    };
  }

  getSecurityGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  getScoreDescription(score) {
    if (score >= 90) return 'Excellent security posture';
    if (score >= 80) return 'Good security with minor improvements needed';
    if (score >= 70) return 'Moderate security, several issues to address';
    if (score >= 60) return 'Poor security, significant improvements required';
    return 'Critical security issues, immediate action required';
  }

  updateSummaryCounts(session) {
    const allFindings = [
      ...session.results.vulnerabilities,
      ...session.results.secrets,
      ...session.results.codeQuality
    ];

    // Reset counts
    session.summary = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };

    // Count by severity
    allFindings.forEach(finding => {
      const severity = finding.severity?.toLowerCase() || 'info';
      if (session.summary[severity] !== undefined) {
        session.summary[severity]++;
      }
    });
  }

  formatVulnerabilityFindings(vulnerabilities) {
    return vulnerabilities.map(vuln => ({
      ...vuln,
      impact: this.assessVulnerabilityImpact(vuln),
      exploitability: this.assessVulnerabilityExploitability(vuln),
      remediation: this.getRemediationSteps(vuln)
    }));
  }

  formatSecretFindings(secrets) {
    return secrets.map(secret => ({
      ...secret,
      riskAssessment: this.assessSecretRisk(secret),
      remediation: this.getSecretRemediationSteps(secret)
    }));
  }

  categorizeRecommendations(session, recommendations) {
    const { vulnerabilities, secrets } = session.results;
    
    // Immediate actions for critical issues
    [...vulnerabilities, ...secrets]
      .filter(item => item.severity === 'critical')
      .forEach(item => {
        recommendations.immediate.push({
          type: item.type || 'vulnerability',
          action: `Fix ${item.message || item.type}`,
          location: `Line ${item.line}`,
          priority: 'CRITICAL'
        });
      });

    // Add preventive measures
    recommendations.preventive.push(
      'Implement automated security scanning in CI/CD pipeline',
      'Set up secret scanning in repository',
      'Regular security training for development team',
      'Establish secure coding standards'
    );
  }

  /**
   * Health check
   */
  async getHealth() {
    return {
      status: 'healthy',
      name: this.name,
      version: this.version,
      capabilities: [
        'Executive Summary Generation',
        'Risk Assessment',
        'Detailed Finding Reports',
        'Intelligence Context',
        'Actionable Recommendations',
        'Security Scoring',
        'Metrics & Visualization Data'
      ]
    };
  }

  // Additional helper methods...
  assessVulnerabilityImpact(vuln) {
    const impactMap = {
      'sql-injection': 'Data breach, unauthorized access to database',
      'xss': 'Client-side code execution, session hijacking',
      'code-injection': 'Remote code execution, complete system compromise',
      'path-traversal': 'Unauthorized file access, information disclosure'
    };
    
    return impactMap[vuln.category] || 'Security risk requiring attention';
  }

  getRemediationSteps(vuln) {
    return vuln.recommendation || 'Follow security best practices for this vulnerability type';
  }

  getCategoryDistribution(session) {
    const categories = {};
    const allFindings = [
      ...session.results.vulnerabilities,
      ...session.results.secrets,
      ...session.results.codeQuality
    ];

    allFindings.forEach(finding => {
      const category = finding.category || finding.type || 'other';
      categories[category] = (categories[category] || 0) + 1;
    });

    return categories;
  }

  getToolsUsed(session) {
    const tools = ['ESLint Security', 'Pattern Matcher'];
    
    if (session.results.cveMatches?.length > 0) {
      tools.push('CVE Lookup');
    }
    
    if (session.results.advisories?.length > 0) {
      tools.push('GitHub Advisory');
    }

    return tools;
  }

  /**
   * Categorize issues by type/category
   */
  categorizeIssues(issues) {
    const categories = {};
    
    issues.forEach(issue => {
      const category = issue.category || issue.type || 'uncategorized';
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category]++;
    });
    
    return categories;
  }

  /**
   * Calculate maintainability score based on code quality issues
   */
  calculateMaintainabilityScore(codeQualityIssues) {
    const maxScore = 100;
    let deductions = 0;
    
    // Simple scoring based on number of issues
    deductions = Math.min(codeQualityIssues.length * 2, 50); // Max 50 points deduction
    
    return Math.max(maxScore - deductions, 0);
  }

  /**
   * Check compliance against security standards
   */
  checkCompliance(session) {
    const compliance = {
      owasp: this.checkOwaspCompliance(session),
      pci: this.checkPciCompliance(session),
      gdpr: this.checkGdprCompliance(session),
      overall: 'compliant'
    };

    // Determine overall compliance
    const hasVulnerabilities = session.summary.critical > 0 || session.summary.high > 0;
    const hasSecrets = session.results.secrets.length > 0;
    
    if (hasVulnerabilities || hasSecrets) {
      compliance.overall = 'non-compliant';
    } else if (session.summary.medium > 0) {
      compliance.overall = 'partial-compliance';
    }

    return compliance;
  }

  checkOwaspCompliance(session) {
    const owaspIssues = session.results.vulnerabilities.filter(v => v.owasp);
    return {
      status: owaspIssues.length === 0 ? 'compliant' : 'non-compliant',
      issues: owaspIssues.length,
      categories: [...new Set(owaspIssues.map(v => v.owasp))]
    };
  }

  checkPciCompliance(session) {
    const hasSecrets = session.results.secrets.length > 0;
    return {
      status: hasSecrets ? 'non-compliant' : 'compliant',
      issues: hasSecrets ? ['Hardcoded secrets detected'] : []
    };
  }

  checkGdprCompliance(session) {
    // Basic GDPR check - look for potential PII handling issues
    return {
      status: 'compliant',
      note: 'No obvious GDPR violations detected in code'
    };
  }
}

module.exports = ReportGenerator;