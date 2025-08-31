const express = require('express');
const PasteScanner = require('../../services/paste-scanner');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Initialize paste scanner
const pasteScanner = new PasteScanner();

/**
 * 🎯 Rate Limiting Configuration
 * Prevents abuse while allowing legitimate usage
 */
const scanRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    success: false,
    error: 'Too many scan requests. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 🔍 POST /api/paste/scan
 * Main endpoint for scanning pasted code
 * 
 * Body Parameters:
 * - code: string (required) - The code to scan
 * - language: string (optional) - Programming language (default: javascript)
 * - options: object (optional) - Additional scanning options
 */
router.post('/scan', 
  scanRateLimit,
  [
    body('code')
      .notEmpty()
      .withMessage('Code is required')
      .isLength({ min: 10, max: 50000 })
      .withMessage('Code must be between 10 and 50,000 characters'),
    body('language')
      .optional()
      .isIn(['javascript', 'typescript', 'python', 'java', 'php', 'go', 'ruby', 'c', 'cpp', 'csharp'])
      .withMessage('Invalid programming language'),
    body('options')
      .optional()
      .isObject()
      .withMessage('Options must be an object')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
      }

      const { code, language = 'javascript', options = {} } = req.body;
      
      // Log scan request (without exposing sensitive code)
      console.log(`🔍 New paste scan request: ${language} code (${code.length} chars)`);

      // Perform security scan
      const scanResults = await pasteScanner.scanCode(code, language, {
        ...options,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      });

      // Format beautiful response
      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        scanId: scanResults.scanId,
        
        // 📊 Executive Summary
        summary: {
          language: scanResults.language,
          totalIssues: Object.values(scanResults.summary).reduce((a, b) => a + b, 0),
          riskLevel: scanResults.report.executive.overallRisk,
          securityScore: scanResults.report.security.securityScore,
          status: scanResults.report.executive.status,
          recommendation: scanResults.report.executive.recommendation
        },

        // 🎯 Key Findings
        findings: {
          critical: scanResults.summary.critical,
          high: scanResults.summary.high,
          medium: scanResults.summary.medium,
          low: scanResults.summary.low,
          
          // Top 5 most critical issues
          topIssues: [
            ...scanResults.results.vulnerabilities,
            ...scanResults.results.secrets
          ]
          .filter(issue => ['critical', 'high'].includes(issue.severity))
          .sort((a, b) => {
            const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
            return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
          })
          .slice(0, 5)
          .map(issue => ({
            type: issue.type || 'vulnerability',
            severity: issue.severity,
            message: issue.message || issue.type,
            line: issue.line,
            recommendation: issue.recommendation
          }))
        },

        // 🚨 Security Details
        security: {
          vulnerabilities: scanResults.results.vulnerabilities.map(vuln => ({
            id: vuln.ruleId || 'custom',
            type: vuln.category || vuln.type,
            severity: vuln.severity,
            message: vuln.message,
            line: vuln.line,
            column: vuln.column,
            source: vuln.source,
            recommendation: vuln.recommendation,
            cwe: vuln.cwe,
            owasp: vuln.owasp
          })),
          
          secrets: scanResults.results.secrets.map(secret => ({
            type: secret.type,
            severity: secret.severity,
            line: secret.line,
            maskedValue: secret.value,
            confidence: secret.confidence,
            recommendation: secret.recommendation
          })),
          
          codeQuality: (scanResults.results.codeQuality || []).map(quality => ({
            rule: quality.ruleId,
            message: quality.message,
            severity: quality.severity,
            line: quality.line,
            category: quality.category
          }))
        },

        // 🌐 Intelligence Context
        intelligence: {
          cveMatches: (scanResults.results.cveMatches || []).slice(0, 5).map(cve => ({
            id: cve.id,
            summary: cve.summary,
            cvssScore: cve.cvss,
            severity: cve.severity,
            published: cve.published,
            url: `https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cve.id}`
          })),
          
          advisories: (scanResults.results.advisories || []).slice(0, 3).map(advisory => ({
            id: advisory.id,
            title: advisory.title,
            severity: advisory.severity,
            affectedPackages: advisory.affected_packages,
            url: advisory.url
          }))
        },

        // 📈 Metrics for Visualization
        metrics: {
          scanDuration: scanResults.metrics.scanDuration,
          linesOfCode: scanResults.metrics.linesOfCode,
          toolsUsed: scanResults.report.metrics.scanMetrics.toolsUsed,
          
          // Chart data
          severityDistribution: scanResults.report.metrics.severityDistribution,
          categoryDistribution: scanResults.report.metrics.categoryDistribution
        },

        // 🔧 Actionable Recommendations
        recommendations: {
          immediate: scanResults.report.recommendations.immediate.slice(0, 3),
          shortTerm: scanResults.report.recommendations.shortTerm.slice(0, 3),
          preventive: [
            'Set up automated security scanning in your CI/CD pipeline',
            'Use environment variables for secrets and API keys',
            'Regular security training for your development team',
            'Implement code review processes focusing on security'
          ]
        },

        // 🚀 Next Steps
        nextSteps: scanResults.report.nextSteps.actionPlan.slice(0, 3),

        // 📊 Full Report Access
        fullReport: {
          available: true,
          endpoint: `/api/paste/report/${scanResults.scanId}`,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }
      };

      // Set cache headers for static data
      res.set('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour

      res.status(200).json(response);

    } catch (error) {
      console.error('❌ Paste scan failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error during security scan',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later',
        timestamp: new Date().toISOString(),
        scanId: null
      });
    }
  }
);

/**
 * 📄 GET /api/paste/report/:scanId
 * Get detailed scan report
 */
router.get('/report/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;
    
    // For now, return a placeholder since we'd need to implement report storage
    // In production, you'd retrieve the full report from Redis/database
    
    res.status(200).json({
      success: true,
      message: 'Full report retrieval not yet implemented',
      scanId,
      note: 'This would return the complete detailed report stored during the scan'
    });
    
  } catch (error) {
    console.error('❌ Report retrieval failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve report',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 🏥 GET /api/paste/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const health = await pasteScanner.getHealth();
    
    res.status(200).json({
      success: true,
      service: 'Paste Scanner',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      ...health
    });
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    res.status(503).json({
      success: false,
      service: 'Paste Scanner',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 📊 GET /api/paste/stats
 * Get scanning statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // In production, this would return real statistics from database
    const mockStats = {
      totalScans: 1543,
      scansToday: 89,
      averageScanTime: 2.3, // seconds
      topVulnerabilities: [
        { type: 'SQL Injection', count: 234 },
        { type: 'XSS', count: 189 },
        { type: 'Hardcoded Secrets', count: 167 },
        { type: 'Code Injection', count: 145 },
        { type: 'Path Traversal', count: 98 }
      ],
      languageDistribution: {
        javascript: 45,
        python: 23,
        java: 12,
        php: 8,
        other: 12
      }
    };
    
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: mockStats
    });
    
  } catch (error) {
    console.error('❌ Stats retrieval failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 🧪 POST /api/paste/test
 * Test endpoint with sample vulnerable code
 */
router.post('/test', scanRateLimit, async (req, res) => {
  try {
    const sampleCode = `
// Sample vulnerable JavaScript code for testing
const express = require('express');
const app = express();

// 🚨 SQL Injection vulnerability
app.get('/user/:id', (req, res) => {
  const query = "SELECT * FROM users WHERE id = " + req.params.id;
  db.query(query, (err, results) => {
    res.json(results);
  });
});

// 🔑 Hardcoded API key
const apiKey = "sk_live_1234567890abcdef1234567890abcdef";

// 🚨 XSS vulnerability
app.get('/search', (req, res) => {
  const searchTerm = req.query.q;
  res.send('<h1>Results for: ' + searchTerm + '</h1>');
});

// 🚨 Code injection
app.post('/eval', (req, res) => {
  const result = eval(req.body.expression);
  res.json({ result });
});
`;

    const scanResults = await pasteScanner.scanCode(sampleCode, 'javascript');
    
    res.status(200).json({
      success: true,
      message: 'Test scan completed successfully',
      testCode: {
        description: 'Sample vulnerable JavaScript code with multiple security issues',
        vulnerabilities: ['SQL Injection', 'Hardcoded API Key', 'XSS', 'Code Injection']
      },
      results: {
        totalIssues: Object.values(scanResults.summary).reduce((a, b) => a + b, 0),
        riskLevel: scanResults.report.executive.overallRisk,
        findings: scanResults.summary
      }
    });
    
  } catch (error) {
    console.error('❌ Test scan failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Test scan failed',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;