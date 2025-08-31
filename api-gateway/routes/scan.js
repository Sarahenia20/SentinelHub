const express = require('express');
const { ESLint } = require('eslint');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

class ESLintSecurityScanner {
  constructor() {
    this.eslint = new ESLint({
      baseConfig: {
        extends: [
          'eslint:recommended'
        ],
        plugins: ['security', 'sonarjs'],
        rules: {
          // Security rules
          'security/detect-object-injection': 'error',
          'security/detect-non-literal-fs-filename': 'warn',
          'security/detect-unsafe-regex': 'error',
          'security/detect-eval-with-expression': 'error',
          'security/detect-non-literal-require': 'warn',
          'security/detect-possible-timing-attacks': 'warn',
          'security/detect-pseudoRandomBytes': 'warn',
          
          // SonarJS security rules
          'sonarjs/cognitive-complexity': ['error', 15],
          'sonarjs/no-duplicate-string': 'error',
          'sonarjs/no-identical-functions': 'error',
          
          // General security-focused rules
          'no-eval': 'error',
          'no-implied-eval': 'error',
          'no-new-func': 'error',
          'no-script-url': 'error',
          'no-alert': 'warn',
          'no-console': 'warn'
        },
        env: {
          node: true,
          browser: true,
          es2021: true
        },
        parserOptions: {
          ecmaVersion: 12,
          sourceType: 'module'
        }
      },
      useEslintrc: false
    });
  }

  async scanCode(code, filename = 'temp.js') {
    try {
      const results = await this.eslint.lintText(code, { filePath: filename });
      const issues = results[0]?.messages || [];
      
      const securityIssues = issues.filter(issue => 
        issue.ruleId && (
          issue.ruleId.includes('security/') ||
          issue.ruleId.includes('sonarjs/') ||
          ['no-eval', 'no-implied-eval', 'no-new-func', 'no-script-url'].includes(issue.ruleId)
        )
      );

      return {
        filename,
        issues: issues.map(issue => ({
          line: issue.line,
          column: issue.column,
          severity: issue.severity === 2 ? 'error' : 'warning',
          message: issue.message,
          rule: issue.ruleId,
          type: securityIssues.some(si => si.ruleId === issue.ruleId) ? 'security' : 'quality'
        })),
        summary: {
          total: issues.length,
          errors: issues.filter(i => i.severity === 2).length,
          warnings: issues.filter(i => i.severity === 1).length,
          security: securityIssues.length
        }
      };
    } catch (error) {
      throw new Error(`ESLint scanning failed: ${error.message}`);
    }
  }

  async scanRepository(owner, repo, githubToken, broadcastCallback) {
    const scanId = uuidv4();
    const results = [];
    
    try {
      // Get repository file tree
      const githubApi = axios.create({
        baseURL: 'https://api.github.com',
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });

      broadcastCallback(scanId, {
        status: 'starting',
        message: 'Fetching repository structure...',
        progress: 0
      });

      const { data: tree } = await githubApi.get(`/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`);
      const jsFiles = tree.tree.filter(file => 
        file.type === 'blob' && 
        (file.path.endsWith('.js') || file.path.endsWith('.ts') || file.path.endsWith('.jsx') || file.path.endsWith('.tsx'))
      );

      broadcastCallback(scanId, {
        status: 'scanning',
        message: `Found ${jsFiles.length} JavaScript/TypeScript files to scan`,
        progress: 10
      });

      for (let i = 0; i < jsFiles.length; i++) {
        const file = jsFiles[i];
        const progress = 10 + (i / jsFiles.length) * 80;

        try {
          broadcastCallback(scanId, {
            status: 'scanning',
            message: `Scanning ${file.path}...`,
            progress: Math.round(progress)
          });

          // Get file content
          const { data: fileData } = await githubApi.get(`/repos/${owner}/${repo}/contents/${file.path}`);
          const content = Buffer.from(fileData.content, 'base64').toString();

          // Scan the file
          const scanResult = await this.scanCode(content, file.path);
          if (scanResult.issues.length > 0) {
            results.push(scanResult);
          }

          // Small delay to prevent rate limiting
          if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (fileError) {
          console.warn(`Failed to scan ${file.path}:`, fileError.message);
        }
      }

      broadcastCallback(scanId, {
        status: 'completed',
        message: 'Security scan completed successfully',
        progress: 100,
        results: {
          scannedFiles: jsFiles.length,
          filesWithIssues: results.length,
          totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
          securityIssues: results.reduce((sum, r) => sum + r.summary.security, 0)
        }
      });

      return {
        scanId,
        repository: `${owner}/${repo}`,
        timestamp: new Date().toISOString(),
        scannedFiles: jsFiles.length,
        results,
        summary: {
          filesWithIssues: results.length,
          totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
          totalErrors: results.reduce((sum, r) => sum + r.summary.errors, 0),
          totalWarnings: results.reduce((sum, r) => sum + r.summary.warnings, 0),
          securityIssues: results.reduce((sum, r) => sum + r.summary.security, 0)
        }
      };

    } catch (error) {
      broadcastCallback(scanId, {
        status: 'failed',
        message: `Scan failed: ${error.message}`,
        progress: 0
      });
      throw error;
    }
  }
}

// POST /api/scan/repository - Start repository security scan
router.post('/repository', async (req, res) => {
  try {
    const { owner, repo } = req.body;
    const githubToken = req.headers['github-token'];

    if (!owner || !repo) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Repository owner and name are required'
      });
    }

    if (!githubToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'GitHub access token required'
      });
    }

    const scanner = new ESLintSecurityScanner();
    
    // Import broadcast function from server
    const { broadcastScanUpdate } = require('../server');
    
    // Start scan asynchronously
    scanner.scanRepository(owner, repo, githubToken, broadcastScanUpdate)
      .then(async (results) => {
        // Store results in Redis for later retrieval
        const redisKey = `scan:${results.scanId}`;
        // Note: Redis client should be passed or imported properly
        console.log('Scan completed:', results.summary);
      })
      .catch((error) => {
        console.error('Scan failed:', error);
      });

    res.json({
      success: true,
      message: 'Security scan started',
      data: {
        repository: `${owner}/${repo}`,
        status: 'started'
      }
    });

  } catch (error) {
    console.error('Scan initiation error:', error);
    res.status(500).json({
      error: 'Failed to start scan',
      message: error.message
    });
  }
});

// POST /api/scan/code - Scan code snippet
router.post('/code', async (req, res) => {
  try {
    const { code, filename } = req.body;

    if (!code) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Code content is required'
      });
    }

    const scanner = new ESLintSecurityScanner();
    const result = await scanner.scanCode(code, filename);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Code scan error:', error);
    res.status(500).json({
      error: 'Failed to scan code',
      message: error.message
    });
  }
});

// GET /api/scan/history - Get scan history
router.get('/history', async (req, res) => {
  try {
    // This would typically fetch from Redis or database
    // For now, return empty array
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Scan history error:', error);
    res.status(500).json({
      error: 'Failed to fetch scan history',
      message: error.message
    });
  }
});

module.exports = router;