const express = require('express');
const axios = require('axios');
const GitHubScanner = require('../../services/github-scanner');
const router = express.Router();

// Initialize GitHub Scanner
const githubScanner = new GitHubScanner();

class GitHubService {
  constructor(accessToken) {
    this.token = accessToken;
    this.api = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
  }

  async getUserRepositories() {
    try {
      const response = await this.api.get('/user/repos', {
        params: { sort: 'updated', per_page: 100 }
      });
      return response.data;
    } catch (error) {
      throw new Error(`GitHub API error: ${error.message}`);
    }
  }

  async getRepositoryFiles(owner, repo, path = '') {
    try {
      const response = await this.api.get(`/repos/${owner}/${repo}/contents/${path}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch files: ${error.message}`);
    }
  }

  async getFileContent(owner, repo, path) {
    try {
      const response = await this.api.get(`/repos/${owner}/${repo}/contents/${path}`);
      const content = Buffer.from(response.data.content, 'base64').toString();
      return { content, sha: response.data.sha };
    } catch (error) {
      throw new Error(`Failed to fetch file content: ${error.message}`);
    }
  }
}

// GET /api/github/repositories - List user repositories
router.get('/repositories', async (req, res) => {
  try {
    const authHeader = req.headers['github-token'];
    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'GitHub access token required'
      });
    }

    const githubService = new GitHubService(authHeader);
    const repositories = await githubService.getUserRepositories();

    res.json({
      success: true,
      data: repositories.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        owner: {
          login: repo.owner.login,
          avatar_url: repo.owner.avatar_url
        },
        description: repo.description,
        updated_at: repo.updated_at,
        language: repo.language,
        size: repo.size,
        stargazers_count: repo.stargazers_count,
        watchers_count: repo.watchers_count,
        forks_count: repo.forks_count,
        default_branch: repo.default_branch
      }))
    });
  } catch (error) {
    console.error('GitHub repositories error:', error);
    res.status(500).json({
      error: 'Failed to fetch repositories',
      message: error.message
    });
  }
});

// GET /api/github/repository/:owner/:repo/files - Get repository file tree
router.get('/repository/:owner/:repo/files', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { path = '' } = req.query;
    const authHeader = req.headers['github-token'];

    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'GitHub access token required'
      });
    }

    const githubService = new GitHubService(authHeader);
    const files = await githubService.getRepositoryFiles(owner, repo, path);

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('GitHub files error:', error);
    res.status(500).json({
      error: 'Failed to fetch repository files',
      message: error.message
    });
  }
});

// GET /api/github/repository/:owner/:repo/content - Get file content
router.get('/repository/:owner/:repo/content', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { path } = req.query;
    const authHeader = req.headers['github-token'];

    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'GitHub access token required'
      });
    }

    if (!path) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'File path is required'
      });
    }

    const githubService = new GitHubService(authHeader);
    const fileData = await githubService.getFileContent(owner, repo, path);

    res.json({
      success: true,
      data: fileData
    });
  } catch (error) {
    console.error('GitHub file content error:', error);
    res.status(500).json({
      error: 'Failed to fetch file content',
      message: error.message
    });
  }
});

// POST /api/github/scan/:owner/:repo - Comprehensive repository security scan
router.post('/scan/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { enableCodeRabbit = false } = req.body;
    const authHeader = req.headers['github-token'];
    const coderabbitToken = req.headers['coderabbit-token'];

    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'GitHub access token required'
      });
    }

    console.log(`🐙 Starting comprehensive security scan for ${owner}/${repo}`);

    // Run the comprehensive GitHub repository scan
    const scanResults = await githubScanner.scanRepository(owner, repo, {
      githubToken: authHeader,
      enableCodeRabbit,
      coderabbitToken
    });

    // Format response similar to paste scanner
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      scanId: scanResults.scanId,
      
      // Repository info
      repository: {
        owner,
        repo,
        fullName: `${owner}/${repo}`,
        ...scanResults.results.repositoryInsights
      },

      // Executive Summary
      summary: {
        totalFiles: scanResults.files.total,
        filesScanned: scanResults.files.scanned,
        filesSkipped: scanResults.files.skipped,
        languages: scanResults.files.languages,
        linesOfCode: scanResults.metrics.linesOfCode,
        totalIssues: Object.values(scanResults.summary).reduce((a, b) => a + b, 0),
        riskLevel: scanResults.report?.executive?.overallRisk || 'medium',
        securityScore: scanResults.report?.security?.securityScore || 75,
        status: scanResults.report?.executive?.status || 'review',
        recommendation: scanResults.report?.executive?.recommendation || 'Review findings and address critical issues'
      },

      // Detailed findings
      findings: {
        critical: scanResults.summary.critical,
        high: scanResults.summary.high,
        medium: scanResults.summary.medium,
        low: scanResults.summary.low,
        info: scanResults.summary.info,
        
        // Top issues by severity
        topIssues: [
          ...scanResults.results.vulnerabilities,
          ...scanResults.results.secrets.map(s => ({
            type: 'secret',
            severity: s.severity || 'high',
            message: s.type || 'Secret detected',
            file: s.file,
            line: s.line,
            recommendation: s.recommendation
          }))
        ]
        .filter(issue => ['critical', 'high'].includes(issue.severity))
        .sort((a, b) => {
          const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
          return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
        })
        .slice(0, 10)
      },

      // Security details
      security: {
        vulnerabilities: scanResults.results.vulnerabilities.map(vuln => ({
          id: vuln.ruleId || 'pattern',
          type: vuln.type || vuln.category,
          severity: vuln.severity,
          message: vuln.message,
          file: vuln.file,
          line: vuln.line,
          column: vuln.column,
          source: vuln.source,
          recommendation: vuln.recommendation,
          cwe: vuln.cwe,
          owasp: vuln.owasp
        })),
        
        secrets: scanResults.results.secrets.map(secret => ({
          type: secret.type,
          severity: secret.severity || 'high',
          file: secret.file,
          line: secret.line,
          maskedValue: secret.value || '[REDACTED]',
          confidence: secret.confidence || 85,
          recommendation: secret.recommendation || 'Remove secret and use environment variables'
        })),
        
        codeQuality: scanResults.results.codeQuality.map(quality => ({
          rule: quality.ruleId,
          message: quality.message,
          severity: quality.severity,
          file: quality.file,
          line: quality.line,
          category: quality.category
        }))
      },

      // Dependencies
      dependencies: {
        files: scanResults.results.dependencies,
        totalPackages: scanResults.results.dependencies.reduce((sum, dep) => sum + dep.count, 0),
        vulnerablePackages: [] // Would be populated by dependency checking
      },

      // Intelligence context
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

      // Metrics
      metrics: {
        scanDuration: scanResults.metrics.scanDuration,
        filesAnalyzed: scanResults.metrics.filesAnalyzed || scanResults.files.scanned,
        linesOfCode: scanResults.metrics.linesOfCode,
        toolsUsed: [
          'GitHub API',
          'ESLint Security',
          'Semgrep SAST',
          'TruffleHog Secrets',
          'GitLeaks Scanner',
          'Pattern Matcher', 
          'CVE Intelligence',
          'GitHub Advisory',
          ...(enableCodeRabbit ? ['CodeRabbit AI'] : []),
          'Repository Insights'
        ],
        
        // Chart data
        severityDistribution: scanResults.summary,
        languageDistribution: scanResults.files.languages
      },

      // Recommendations
      recommendations: {
        immediate: scanResults.report?.recommendations?.immediate || [
          'Address critical vulnerabilities',
          'Remove exposed secrets',
          'Review high-severity findings'
        ],
        shortTerm: scanResults.report?.recommendations?.shortTerm || [
          'Implement dependency scanning',
          'Add pre-commit hooks for security',
          'Enable branch protection rules'
        ],
        preventive: [
          'Set up GitHub security alerts',
          'Enable Dependabot security updates',
          'Add security scanning to CI/CD pipeline',
          'Implement secret scanning policies'
        ]
      },

      // Next steps
      nextSteps: scanResults.report?.nextSteps?.actionPlan || [
        {
          priority: 1,
          action: 'Fix critical vulnerabilities and remove secrets',
          timeframe: 'immediate'
        },
        {
          priority: 2,
          action: 'Review and address high-severity findings',
          timeframe: '1 week'
        },
        {
          priority: 3,
          action: 'Implement continuous security monitoring',
          timeframe: '2-4 weeks'
        }
      ]
    };

    // Save scan results to database for intelligence and reports
    try {
      if (req.services && req.services.database) {
        await req.services.database.storePipelineResults({
          pipelineId: response.scanId,
          scanType: 'github-repository',
          timestamp: response.timestamp,
          scanResults: response,
          summary: response.summary,
          findings: response.findings,
          status: 'completed'
        });
        console.log(`✅ Saved GitHub scan ${response.scanId} to database`);
      }
    } catch (dbError) {
      console.error('Failed to save to database (non-fatal):', dbError.message);
    }

    res.json(response);

  } catch (error) {
    console.error('GitHub repository scan error:', error);
    res.status(500).json({
      error: 'Repository scan failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/github/scanner/health - GitHub scanner health check
router.get('/scanner/health', async (req, res) => {
  try {
    const health = await githubScanner.getHealth();
    
    res.json({
      success: true,
      service: 'GitHub Repository Scanner',
      timestamp: new Date().toISOString(),
      ...health
    });
    
  } catch (error) {
    console.error('GitHub scanner health check failed:', error);
    
    res.status(503).json({
      success: false,
      service: 'GitHub Repository Scanner',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;