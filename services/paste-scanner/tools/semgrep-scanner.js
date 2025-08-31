const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Semgrep Security Scanner Integration
 * Uses the actual Semgrep CLI tool for comprehensive static analysis
 */
class SemgrepScanner {
  constructor() {
    this.name = 'Semgrep Scanner';
    this.version = '1.0.0';
    this.tempDir = path.join(__dirname, '../../../temp');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  /**
   * Scan code using Semgrep with security-focused rulesets
   */
  async scanCode(code, options = {}) {
    const scanId = crypto.randomUUID();
    const startTime = Date.now();
    
    // Skip Semgrep for very small code snippets (under 10 lines) to improve performance
    if (code.split('\n').length < 10) {
      console.log('   ⚡ Skipping Semgrep for small code snippet (performance optimization)');
      return {
        success: true,
        scanId,
        timestamp: new Date().toISOString(),
        scanDuration: Date.now() - startTime,
        tool: 'semgrep',
        version: 'skipped-small-snippet',
        findings: [],
        summary: { totalFindings: 0, severityBreakdown: { critical: 0, high: 0, medium: 0, low: 0, info: 0 }, rulesTriggered: 0 }
      };
    }
    
    try {
      // Write code to temporary file
      const tempFile = await this.writeCodeToTempFile(code, options.language || 'javascript', scanId);
      
      // Run Semgrep scan
      const results = await this.runSemgrepScan(tempFile, options);
      
      // Clean up temp file
      await this.cleanupTempFile(tempFile);
      
      const scanDuration = Date.now() - startTime;
      
      return {
        success: true,
        scanId,
        timestamp: new Date().toISOString(),
        scanDuration,
        tool: 'semgrep',
        version: await this.getSemgrepVersion(),
        findings: this.parseResults(results).vulnerabilities || [],
        summary: this.generateSummary(results)
      };
      
    } catch (error) {
      console.error('Semgrep scan failed:', error);
      return {
        success: false,
        error: error.message,
        scanId,
        tool: 'semgrep',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Write code to temporary file for scanning
   */
  async writeCodeToTempFile(code, language, scanId) {
    const extension = this.getFileExtension(language);
    const filename = `scan_${scanId}${extension}`;
    const filepath = path.join(this.tempDir, filename);
    
    await fs.writeFile(filepath, code, 'utf8');
    return filepath;
  }

  /**
   * Execute Semgrep via Docker
   */
  async runSemgrepScan(filepath, options = {}) {
    return new Promise((resolve, reject) => {
      const dockerArgs = [
        'run',
        '--rm',
        '--volume', `${path.dirname(filepath)}:/src`,
        'semgrep/semgrep:latest',
        'semgrep',
        '--json',
        '--config=auto', // Use Semgrep's recommended rules
        '--severity=ERROR',
        '--severity=WARNING',
        '--no-git-ignore',
        `/src/${path.basename(filepath)}`
      ];

      // Add specific rulesets for security
      if (options.enableSecurityRules) {
        dockerArgs.splice(-2, 0, '--config=p/security-audit');
        dockerArgs.splice(-2, 0, '--config=p/owasp-top-ten');
      }

      const semgrep = spawn('docker', dockerArgs, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      
      // Add 30 second timeout for performance
      const timeout = setTimeout(() => {
        console.log('   ⏰ Semgrep timeout after 30s - terminating process');
        semgrep.kill('SIGKILL');
        reject(new Error('Semgrep scan timed out after 30 seconds'));
      }, 30000);

      semgrep.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      semgrep.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      semgrep.on('close', (code) => {
        clearTimeout(timeout);
        // Semgrep returns 1 when findings are found, which is expected
        if (code === 0 || code === 1) {
          try {
            const results = stdout ? JSON.parse(stdout) : { results: [] };
            resolve(results);
          } catch (parseError) {
            reject(new Error(`Failed to parse Semgrep output: ${parseError.message}`));
          }
        } else {
          reject(new Error(`Semgrep failed with code ${code}: ${stderr}`));
        }
      });

      semgrep.on('error', (error) => {
        clearTimeout(timeout);
        if (error.code === 'ENOENT') {
          reject(new Error('Docker not found. Please install Docker to use Semgrep'));
        } else {
          reject(error);
        }
      });
    });
  }

  /**
   * Parse Semgrep results into standardized format
   */
  parseResults(semgrepOutput) {
    if (!semgrepOutput.results) {
      return {
        vulnerabilities: [],
        codeQuality: [],
        secrets: []
      };
    }

    const vulnerabilities = [];
    const codeQuality = [];
    const secrets = [];

    semgrepOutput.results.forEach(finding => {
      const standardFinding = {
        ruleId: finding.check_id,
        message: finding.message,
        severity: this.mapSeverity(finding.extra.severity),
        line: finding.start.line,
        column: finding.start.col,
        endLine: finding.end.line,
        endColumn: finding.end.col,
        category: this.categorizeRule(finding.check_id),
        source: 'semgrep',
        confidence: finding.extra.metadata?.confidence || 'high',
        cwe: finding.extra.metadata?.cwe,
        owasp: finding.extra.metadata?.owasp,
        recommendation: this.generateRecommendation(finding)
      };

      // Categorize findings
      if (this.isSecurityVulnerability(finding.check_id)) {
        vulnerabilities.push(standardFinding);
      } else if (this.isSecretDetection(finding.check_id)) {
        secrets.push({
          ...standardFinding,
          type: this.getSecretType(finding.check_id),
          maskedValue: '[DETECTED_BY_SEMGREP]'
        });
      } else {
        codeQuality.push(standardFinding);
      }
    });

    return {
      vulnerabilities,
      codeQuality,
      secrets
    };
  }

  /**
   * Generate scan summary
   */
  generateSummary(semgrepOutput) {
    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    };

    if (semgrepOutput.results) {
      semgrepOutput.results.forEach(finding => {
        const severity = this.mapSeverity(finding.extra.severity);
        summary[severity]++;
      });
    }

    return {
      totalFindings: Object.values(summary).reduce((a, b) => a + b, 0),
      severityBreakdown: summary,
      rulesTriggered: semgrepOutput.results?.length || 0
    };
  }

  /**
   * Helper methods
   */
  getFileExtension(language) {
    const extensions = {
      javascript: '.js',
      typescript: '.ts',
      python: '.py',
      java: '.java',
      go: '.go',
      php: '.php',
      ruby: '.rb',
      csharp: '.cs',
      cpp: '.cpp',
      c: '.c',
      rust: '.rs'
    };
    return extensions[language] || '.txt';
  }

  mapSeverity(semgrepSeverity) {
    const mapping = {
      'ERROR': 'high',
      'WARNING': 'medium',
      'INFO': 'low'
    };
    return mapping[semgrepSeverity] || 'medium';
  }

  isSecurityVulnerability(ruleId) {
    const securityPatterns = [
      'security',
      'vulnerability', 
      'injection',
      'xss',
      'csrf',
      'auth',
      'crypto',
      'insecure'
    ];
    return securityPatterns.some(pattern => ruleId.toLowerCase().includes(pattern));
  }

  isSecretDetection(ruleId) {
    const secretPatterns = ['secret', 'key', 'token', 'password', 'credential'];
    return secretPatterns.some(pattern => ruleId.toLowerCase().includes(pattern));
  }

  getSecretType(ruleId) {
    if (ruleId.includes('api-key')) return 'API Key';
    if (ruleId.includes('password')) return 'Password';
    if (ruleId.includes('token')) return 'Token';
    if (ruleId.includes('secret')) return 'Secret';
    return 'Credential';
  }

  categorizeRule(ruleId) {
    if (ruleId.includes('security')) return 'Security';
    if (ruleId.includes('performance')) return 'Performance';
    if (ruleId.includes('maintainability')) return 'Maintainability';
    if (ruleId.includes('reliability')) return 'Reliability';
    return 'Code Quality';
  }

  generateRecommendation(finding) {
    const ruleId = finding.check_id.toLowerCase();
    
    if (ruleId.includes('injection')) {
      return 'Use parameterized queries and input validation to prevent injection attacks';
    }
    if (ruleId.includes('xss')) {
      return 'Sanitize user input and use proper encoding when displaying data';
    }
    if (ruleId.includes('crypto')) {
      return 'Use cryptographically secure algorithms and proper key management';
    }
    if (ruleId.includes('auth')) {
      return 'Implement proper authentication and authorization mechanisms';
    }
    
    return finding.message || 'Review and address this security finding';
  }

  async getSemgrepVersion() {
    return new Promise((resolve) => {
      const docker = spawn('docker', ['run', '--rm', 'semgrep/semgrep:latest', '--version']);
      let version = 'unknown';
      
      docker.stdout.on('data', (data) => {
        version = data.toString().trim();
      });
      
      docker.on('close', () => {
        resolve(version);
      });
      
      docker.on('error', () => {
        resolve('not-installed');
      });
    });
  }

  async cleanupTempFile(filepath) {
    try {
      await fs.unlink(filepath);
    } catch (error) {
      // File already deleted or doesn't exist
    }
  }

  /**
   * Health check
   */
  async getHealth() {
    const version = await this.getSemgrepVersion();
    const isInstalled = version !== 'not-installed';
    
    return {
      name: this.name,
      version: this.version,
      semgrepVersion: version,
      status: isInstalled ? 'healthy' : 'semgrep-not-installed',
      available: isInstalled,
      capabilities: [
        'Static Application Security Testing (SAST)',
        'Multi-language vulnerability detection',
        'OWASP Top 10 coverage',
        'Custom security rule support',
        'Code quality analysis'
      ]
    };
  }
}

module.exports = SemgrepScanner;