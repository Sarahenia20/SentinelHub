/**
 * Dynamic Compliance Calculator
 * Calculates REAL compliance scores from actual scan findings
 * Maps vulnerabilities to OWASP Top 10, NIST, and ISO27001 controls
 */

/**
 * OWASP Top 10 2021 Mapping
 */
const OWASP_TOP_10 = {
  'A01:2021-Broken Access Control': ['access-control', 'authorization', 'privilege-escalation', 'idor', 'path-traversal'],
  'A02:2021-Cryptographic Failures': ['weak-crypto', 'insecure-hash', 'no-encryption', 'hardcoded-key', 'weak-ssl'],
  'A03:2021-Injection': ['sql-injection', 'command-injection', 'code-injection', 'ldap-injection', 'xpath-injection', 'eval'],
  'A04:2021-Insecure Design': ['missing-rate-limit', 'no-validation', 'business-logic', 'insecure-defaults'],
  'A05:2021-Security Misconfiguration': ['misconfiguration', 'debug-enabled', 'default-credentials', 'verbose-errors', 'unnecessary-features'],
  'A06:2021-Vulnerable Components': ['outdated-dependency', 'known-vulnerability', 'cve', 'deprecated-function'],
  'A07:2021-Authentication Failures': ['weak-password', 'session-fixation', 'credential-stuffing', 'no-mfa', 'session-management'],
  'A08:2021-Software Integrity Failures': ['unsigned-code', 'no-integrity-check', 'insecure-deserialization', 'supply-chain'],
  'A09:2021-Logging Failures': ['insufficient-logging', 'no-monitoring', 'log-injection', 'missing-audit'],
  'A10:2021-SSRF': ['ssrf', 'open-redirect', 'url-redirect', 'unvalidated-redirect']
};

/**
 * NIST Cybersecurity Framework Mapping
 */
const NIST_CONTROLS = {
  'ID.AM': ['asset-management', 'inventory'],
  'ID.RA': ['vulnerability-assessment', 'risk-assessment', 'threat-intelligence'],
  'PR.AC': ['access-control', 'authentication', 'authorization', 'identity-management'],
  'PR.AT': ['security-awareness', 'training'],
  'PR.DS': ['data-security', 'encryption', 'data-leak', 'sensitive-data'],
  'PR.IP': ['security-policy', 'baseline', 'configuration'],
  'PR.MA': ['maintenance'],
  'PR.PT': ['protective-technology', 'logging', 'monitoring'],
  'DE.AE': ['anomaly-detection', 'event-detection'],
  'DE.CM': ['continuous-monitoring', 'security-monitoring'],
  'DE.DP': ['detection-process'],
  'RS.RP': ['response-planning'],
  'RS.CO': ['communications'],
  'RS.AN': ['analysis', 'forensics'],
  'RS.MI': ['mitigation'],
  'RS.IM': ['improvements'],
  'RC.RP': ['recovery-planning'],
  'RC.IM': ['recovery-improvements'],
  'RC.CO': ['recovery-communications']
};

/**
 * ISO 27001:2013 Controls Mapping
 */
const ISO27001_CONTROLS = {
  'A.5': ['security-policy', 'information-security-policy'],
  'A.6': ['organization', 'internal-organization'],
  'A.7': ['human-resources', 'employee-security'],
  'A.8': ['asset-management', 'information-classification'],
  'A.9': ['access-control', 'authentication', 'authorization', 'user-access'],
  'A.10': ['cryptography', 'encryption', 'key-management'],
  'A.11': ['physical-security', 'secure-areas'],
  'A.12': ['operations-security', 'change-management', 'capacity-management', 'malware-protection'],
  'A.13': ['communications-security', 'network-security', 'information-transfer'],
  'A.14': ['system-acquisition', 'development', 'security-requirements'],
  'A.15': ['supplier-relationships', 'supply-chain'],
  'A.16': ['incident-management', 'security-events', 'evidence-collection'],
  'A.17': ['business-continuity', 'redundancy'],
  'A.18': ['compliance', 'legal-requirements', 'privacy', 'data-protection']
};

/**
 * Calculate OWASP Top 10 Compliance Score
 */
function calculateOWASPCompliance(scanResults) {
  if (!scanResults || !scanResults.results) {
    return { score: 100, violations: [], coverage: {} };
  }

  const violations = [];
  const coverage = {};

  // Initialize coverage tracking
  Object.keys(OWASP_TOP_10).forEach(category => {
    coverage[category] = { found: 0, total: 0 };
  });

  // Analyze all findings
  const allFindings = [
    ...(scanResults.results.vulnerabilities || []),
    ...(scanResults.results.secrets || []),
    ...(scanResults.results.codeQuality || [])
  ];

  allFindings.forEach(finding => {
    const findingType = (finding.type || finding.ruleId || finding.message || '').toLowerCase();
    const findingMessage = (finding.message || '').toLowerCase();
    const combinedText = `${findingType} ${findingMessage}`;

    // Map to OWASP categories
    Object.entries(OWASP_TOP_10).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (combinedText.includes(keyword.toLowerCase())) {
          coverage[category].found++;
          violations.push({
            category,
            finding: finding.message || finding.type,
            severity: finding.severity,
            line: finding.line
          });
        }
      });
      coverage[category].total++;
    });
  });

  // Calculate score: 100 - (violations weighted by severity)
  const severityWeights = { critical: 10, high: 7, medium: 4, low: 2, info: 1 };
  const deductions = violations.reduce((sum, v) => {
    return sum + (severityWeights[v.severity] || 2);
  }, 0);

  const score = Math.max(0, Math.min(100, 100 - deductions));

  return {
    score: Math.round(score),
    violations: violations.slice(0, 10), // Top 10 violations
    coverage,
    totalViolations: violations.length,
    categoriesAffected: Object.keys(coverage).filter(k => coverage[k].found > 0).length
  };
}

/**
 * Calculate NIST Framework Compliance Score
 */
function calculateNISTCompliance(scanResults) {
  if (!scanResults || !scanResults.results) {
    return { score: 100, gaps: [], coverage: {} };
  }

  const gaps = [];
  const coverage = {};

  // Initialize coverage
  Object.keys(NIST_CONTROLS).forEach(control => {
    coverage[control] = { issues: 0, description: getNISTControlDescription(control) };
  });

  const allFindings = [
    ...(scanResults.results.vulnerabilities || []),
    ...(scanResults.results.secrets || []),
    ...(scanResults.results.codeQuality || [])
  ];

  allFindings.forEach(finding => {
    const findingType = (finding.type || finding.ruleId || finding.message || '').toLowerCase();
    const findingMessage = (finding.message || '').toLowerCase();
    const combinedText = `${findingType} ${findingMessage}`;

    Object.entries(NIST_CONTROLS).forEach(([control, keywords]) => {
      keywords.forEach(keyword => {
        if (combinedText.includes(keyword.toLowerCase())) {
          coverage[control].issues++;
          gaps.push({
            control,
            description: getNISTControlDescription(control),
            finding: finding.message || finding.type,
            severity: finding.severity
          });
        }
      });
    });
  });

  // Calculate score based on control coverage
  const totalControls = Object.keys(NIST_CONTROLS).length;
  const controlsWithIssues = Object.values(coverage).filter(c => c.issues > 0).length;
  const score = Math.round(((totalControls - controlsWithIssues) / totalControls) * 100);

  return {
    score: Math.max(0, Math.min(100, score)),
    gaps: gaps.slice(0, 10),
    coverage,
    totalGaps: gaps.length,
    controlsAffected: controlsWithIssues
  };
}

/**
 * Calculate ISO 27001 Compliance Score
 */
function calculateISO27001Compliance(scanResults) {
  if (!scanResults || !scanResults.results) {
    return { score: 100, nonCompliance: [], coverage: {} };
  }

  const nonCompliance = [];
  const coverage = {};

  // Initialize coverage
  Object.keys(ISO27001_CONTROLS).forEach(control => {
    coverage[control] = { violations: 0, description: getISO27001ControlDescription(control) };
  });

  const allFindings = [
    ...(scanResults.results.vulnerabilities || []),
    ...(scanResults.results.secrets || []),
    ...(scanResults.results.codeQuality || [])
  ];

  allFindings.forEach(finding => {
    const findingType = (finding.type || finding.ruleId || finding.message || '').toLowerCase();
    const findingMessage = (finding.message || '').toLowerCase();
    const combinedText = `${findingType} ${findingMessage}`;

    Object.entries(ISO27001_CONTROLS).forEach(([control, keywords]) => {
      keywords.forEach(keyword => {
        if (combinedText.includes(keyword.toLowerCase())) {
          coverage[control].violations++;
          nonCompliance.push({
            control,
            description: getISO27001ControlDescription(control),
            finding: finding.message || finding.type,
            severity: finding.severity
          });
        }
      });
    });
  });

  // Calculate score
  const severityWeights = { critical: 8, high: 5, medium: 3, low: 1, info: 0.5 };
  const deductions = nonCompliance.reduce((sum, nc) => {
    return sum + (severityWeights[nc.severity] || 1);
  }, 0);

  const score = Math.max(0, Math.min(100, 100 - deductions));

  return {
    score: Math.round(score),
    nonCompliance: nonCompliance.slice(0, 10),
    coverage,
    totalViolations: nonCompliance.length,
    controlsAffected: Object.values(coverage).filter(c => c.violations > 0).length
  };
}

/**
 * Get comprehensive compliance report
 */
function getComplianceReport(scanResults) {
  const owasp = calculateOWASPCompliance(scanResults);
  const nist = calculateNISTCompliance(scanResults);
  const iso27001 = calculateISO27001Compliance(scanResults);

  // Overall compliance score (weighted average)
  const overallScore = Math.round((owasp.score * 0.4 + nist.score * 0.3 + iso27001.score * 0.3));

  return {
    overall: {
      score: overallScore,
      grade: getComplianceGrade(overallScore),
      status: overallScore >= 80 ? 'compliant' : overallScore >= 60 ? 'partial' : 'non-compliant'
    },
    frameworks: {
      owasp: {
        score: owasp.score,
        violations: owasp.violations,
        totalViolations: owasp.totalViolations,
        categoriesAffected: owasp.categoriesAffected,
        coverage: owasp.coverage
      },
      nist: {
        score: nist.score,
        gaps: nist.gaps,
        totalGaps: nist.totalGaps,
        controlsAffected: nist.controlsAffected,
        coverage: nist.coverage
      },
      iso27001: {
        score: iso27001.score,
        nonCompliance: iso27001.nonCompliance,
        totalViolations: iso27001.totalViolations,
        controlsAffected: iso27001.controlsAffected,
        coverage: iso27001.coverage
      }
    },
    recommendations: generateComplianceRecommendations(owasp, nist, iso27001),
    summary: {
      totalIssues: owasp.totalViolations + nist.totalGaps + iso27001.totalViolations,
      criticalFindings: getCriticalComplianceFindings(owasp, nist, iso27001),
      nextSteps: getNextSteps(owasp, nist, iso27001)
    }
  };
}

/**
 * Helper functions
 */
function getNISTControlDescription(control) {
  const descriptions = {
    'ID.AM': 'Asset Management',
    'ID.RA': 'Risk Assessment',
    'PR.AC': 'Access Control',
    'PR.AT': 'Awareness & Training',
    'PR.DS': 'Data Security',
    'PR.IP': 'Information Protection',
    'PR.MA': 'Maintenance',
    'PR.PT': 'Protective Technology',
    'DE.AE': 'Anomalies & Events',
    'DE.CM': 'Continuous Monitoring',
    'DE.DP': 'Detection Processes',
    'RS.RP': 'Response Planning',
    'RS.CO': 'Communications',
    'RS.AN': 'Analysis',
    'RS.MI': 'Mitigation',
    'RS.IM': 'Improvements',
    'RC.RP': 'Recovery Planning',
    'RC.IM': 'Recovery Improvements',
    'RC.CO': 'Recovery Communications'
  };
  return descriptions[control] || control;
}

function getISO27001ControlDescription(control) {
  const descriptions = {
    'A.5': 'Information Security Policies',
    'A.6': 'Organization of Information Security',
    'A.7': 'Human Resource Security',
    'A.8': 'Asset Management',
    'A.9': 'Access Control',
    'A.10': 'Cryptography',
    'A.11': 'Physical and Environmental Security',
    'A.12': 'Operations Security',
    'A.13': 'Communications Security',
    'A.14': 'System Acquisition, Development',
    'A.15': 'Supplier Relationships',
    'A.16': 'Information Security Incident Management',
    'A.17': 'Business Continuity Management',
    'A.18': 'Compliance'
  };
  return descriptions[control] || control;
}

function getComplianceGrade(score) {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 50) return 'D';
  return 'F';
}

function generateComplianceRecommendations(owasp, nist, iso27001) {
  const recommendations = [];

  // OWASP recommendations
  if (owasp.score < 80) {
    recommendations.push({
      framework: 'OWASP Top 10',
      priority: 'high',
      action: `Address ${owasp.totalViolations} OWASP violations, focusing on ${owasp.categoriesAffected} affected categories`
    });
  }

  // NIST recommendations
  if (nist.score < 80) {
    recommendations.push({
      framework: 'NIST CSF',
      priority: 'medium',
      action: `Improve ${nist.controlsAffected} NIST controls with identified gaps`
    });
  }

  // ISO recommendations
  if (iso27001.score < 80) {
    recommendations.push({
      framework: 'ISO 27001',
      priority: 'medium',
      action: `Remediate ${iso27001.totalViolations} ISO 27001 control violations`
    });
  }

  return recommendations;
}

function getCriticalComplianceFindings(owasp, nist, iso27001) {
  const critical = [];

  // Get critical OWASP violations
  owasp.violations
    .filter(v => v.severity === 'critical' || v.severity === 'high')
    .forEach(v => critical.push({ framework: 'OWASP', ...v }));

  // Get critical NIST gaps
  nist.gaps
    .filter(g => g.severity === 'critical' || g.severity === 'high')
    .forEach(g => critical.push({ framework: 'NIST', ...g }));

  // Get critical ISO violations
  iso27001.nonCompliance
    .filter(nc => nc.severity === 'critical' || nc.severity === 'high')
    .forEach(nc => critical.push({ framework: 'ISO 27001', ...nc }));

  return critical.slice(0, 10);
}

function getNextSteps(owasp, nist, iso27001) {
  const steps = [];

  if (owasp.score < 100) {
    steps.push('Review and remediate OWASP Top 10 violations');
  }
  if (nist.score < 100) {
    steps.push('Implement missing NIST CSF controls');
  }
  if (iso27001.score < 100) {
    steps.push('Address ISO 27001 non-compliance issues');
  }

  steps.push('Schedule follow-up security scan to validate improvements');

  return steps;
}

module.exports = {
  calculateOWASPCompliance,
  calculateNISTCompliance,
  calculateISO27001Compliance,
  getComplianceReport
};
