/**
 * Client-side Compliance Calculator
 * Calculates compliance scores from scan results for Reports page
 */

interface Finding {
  type?: string;
  ruleId?: string;
  message?: string;
  severity?: string;
  line?: number;
}

interface ScanResults {
  vulnerabilities: Finding[];
  secrets: Finding[];
  codeQuality: Finding[];
}

// OWASP Top 10 2021 keywords
const OWASP_KEYWORDS = [
  'access-control', 'authorization', 'crypto', 'injection', 'sql', 'command',
  'xss', 'csrf', 'deserialization', 'logging', 'monitoring', 'ssrf'
];

// NIST keywords
const NIST_KEYWORDS = [
  'authentication', 'encryption', 'access', 'audit', 'monitoring',
  'incident', 'configuration', 'vulnerability'
];

// ISO 27001 keywords
const ISO27001_KEYWORDS = [
  'policy', 'asset', 'access', 'crypto', 'physical', 'operations',
  'communications', 'development', 'compliance', 'incident'
];

export function calculateOWASPScore(results: ScanResults): number {
  const allFindings = [
    ...(results.vulnerabilities || []),
    ...(results.secrets || []),
    ...(results.codeQuality || [])
  ];

  let violations = 0;
  const severityWeights = { critical: 10, high: 7, medium: 4, low: 2, info: 1 };

  allFindings.forEach(finding => {
    const text = `${finding.type || ''} ${finding.message || ''}`.toLowerCase();
    const matchesOWASP = OWASP_KEYWORDS.some(keyword => text.includes(keyword));

    if (matchesOWASP) {
      const weight = severityWeights[finding.severity as keyof typeof severityWeights] || 2;
      violations += weight;
    }
  });

  return Math.max(0, Math.min(100, 100 - violations));
}

export function calculateNISTScore(results: ScanResults): number {
  const allFindings = [
    ...(results.vulnerabilities || []),
    ...(results.secrets || []),
    ...(results.codeQuality || [])
  ];

  let gaps = 0;

  allFindings.forEach(finding => {
    const text = `${finding.type || ''} ${finding.message || ''}`.toLowerCase();
    const matchesNIST = NIST_KEYWORDS.some(keyword => text.includes(keyword));

    if (matchesNIST) {
      gaps += finding.severity === 'critical' ? 8 : finding.severity === 'high' ? 5 : 3;
    }
  });

  return Math.max(0, Math.min(100, 100 - gaps));
}

export function calculateISO27001Score(results: ScanResults): number {
  const allFindings = [
    ...(results.vulnerabilities || []),
    ...(results.secrets || []),
    ...(results.codeQuality || [])
  ];

  let violations = 0;

  allFindings.forEach(finding => {
    const text = `${finding.type || ''} ${finding.message || ''}`.toLowerCase();
    const matchesISO = ISO27001_KEYWORDS.some(keyword => text.includes(keyword));

    if (matchesISO) {
      violations += finding.severity === 'critical' ? 8 : finding.severity === 'high' ? 5 : 3;
    }
  });

  return Math.max(0, Math.min(100, 100 - violations));
}

export function getComplianceScores(scanResults: any) {
  // Handle both formats: scanResults.results and direct scanResults
  const results = scanResults?.results || scanResults;

  if (!results || (!results.vulnerabilities && !results.secrets && !results.codeQuality)) {
    // Return low scores when no data (NOT 100% - that's unrealistic!)
    return { owasp: 0, nist: 0, iso27001: 0 };
  }

  return {
    owasp: Math.round(calculateOWASPScore(results)),
    nist: Math.round(calculateNISTScore(results)),
    iso27001: Math.round(calculateISO27001Score(results))
  };
}
