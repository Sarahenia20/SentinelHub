const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * GitLeaks Secret Scanner Integration
 * Uses the actual GitLeaks Docker container for Git-focused secret detection
 */
class GitLeaksScanner {
  constructor() {
    this.name = 'GitLeaks Scanner';
    this.version = '1.0.0';
    this.dockerImage = 'zricethezav/gitleaks:latest';
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
   * Scan Git repository using GitLeaks
   */
  async scanRepository(repoPath, options = {}) {
    const scanId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      const results = await this.runGitLeaksScan(repoPath, options);
      const scanDuration = Date.now() - startTime;
      
      return {
        success: true,
        scanId,
        timestamp: new Date().toISOString(),
        scanDuration,
        tool: 'gitleaks',
        repository: repoPath,
        results: this.parseResults(results),
        summary: this.generateSummary(results)
      };
      
    } catch (error) {
      console.error('GitLeaks scan failed:', error);
      return {
        success: false,
        error: error.message,
        scanId,
        tool: 'gitleaks',
        repository: repoPath,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Scan files for secrets using GitLeaks
   */
  async scanFiles(files, options = {}) {
    const scanId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      // Create temporary git repo with files
      const tempRepo = await this.createTempGitRepo(files, scanId);
      
      // Run GitLeaks scan
      const results = await this.runGitLeaksScan(tempRepo, options);
      
      // Clean up temp repo
      await this.cleanupTempRepo(tempRepo);
      
      const scanDuration = Date.now() - startTime;
      
      return {
        success: true,
        scanId,
        timestamp: new Date().toISOString(),
        scanDuration,
        tool: 'gitleaks',
        filesScanned: files.length,
        results: this.parseResults(results),
        summary: this.generateSummary(results)
      };
      
    } catch (error) {
      console.error('GitLeaks file scan failed:', error);
      return {
        success: false,
        error: error.message,
        scanId,
        tool: 'gitleaks',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Create temporary git repository from files
   */
  async createTempGitRepo(files, scanId) {
    const tempRepoDir = path.join(this.tempDir, `gitleaks_repo_${scanId}`);
    
    // Create directory
    await fs.mkdir(tempRepoDir, { recursive: true });
    
    // Write files
    for (const file of files) {
      const filePath = path.join(tempRepoDir, file.name || `file_${files.indexOf(file)}.txt`);
      const dirPath = path.dirname(filePath);
      
      // Ensure directory exists
      await fs.mkdir(dirPath, { recursive: true });
      
      // Write file content
      await fs.writeFile(filePath, file.content || file, 'utf8');
    }
    
    // Initialize git repo
    await this.execCommand('git', ['init'], { cwd: tempRepoDir });
    await this.execCommand('git', ['add', '.'], { cwd: tempRepoDir });
    await this.execCommand('git', ['commit', '-m', 'Initial commit'], { cwd: tempRepoDir });
    
    return tempRepoDir;
  }

  /**
   * Execute GitLeaks scan via Docker
   */
  async runGitLeaksScan(repoPath, options = {}) {
    return new Promise((resolve, reject) => {
      const dockerArgs = [
        'run',
        '--rm',
        '--volume', `${repoPath}:/scan`,
        '--workdir', '/scan',
        this.dockerImage
      ];

      // Add GitLeaks command and options
      if (options.detectMode === 'protect') {
        dockerArgs.push('protect');
        dockerArgs.push('--staged');
      } else {
        dockerArgs.push('detect');
      }

      // Always output JSON
      dockerArgs.push('--report-format', 'json');
      dockerArgs.push('--report-path', '/dev/stdout');

      // Add verbosity for better output
      if (options.verbose) {
        dockerArgs.push('--verbose');
      }

      // Add custom config if provided
      if (options.configPath) {
        dockerArgs.push('--config-path', options.configPath);
      }

      // Add source specification
      dockerArgs.push('--source', '/scan');

      const docker = spawn('docker', dockerArgs, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      docker.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      docker.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      docker.on('close', (code) => {
        // GitLeaks returns 1 when secrets are found, which is expected
        if (code === 0 || code === 1) {
          try {
            if (stdout.trim()) {
              const results = JSON.parse(stdout);
              resolve(Array.isArray(results) ? results : [results]);
            } else {
              resolve([]); // No secrets found
            }
          } catch (parseError) {
            console.warn('GitLeaks output parsing failed:', parseError);
            resolve([]);
          }
        } else {
          reject(new Error(`GitLeaks failed with code ${code}: ${stderr}`));
        }
      });

      docker.on('error', (error) => {
        if (error.code === 'ENOENT') {
          reject(new Error('Docker not found. Please install Docker to use GitLeaks'));
        } else {
          reject(error);
        }
      });
    });
  }

  /**
   * Execute shell command
   */
  async execCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        stdio: 'pipe',
        ...options
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed: ${stderr}`));
        }
      });

      process.on('error', reject);
    });
  }

  /**
   * Parse GitLeaks results into standardized format
   */
  parseResults(gitLeaksFindings) {
    const secrets = [];
    
    gitLeaksFindings.forEach(finding => {
      const secret = {
        type: this.getSecretType(finding.RuleID),
        ruleId: finding.RuleID,
        severity: this.getSeverity(finding.RuleID),
        line: finding.StartLine || 1,
        column: finding.StartColumn || 1,
        endLine: finding.EndLine || finding.StartLine || 1,
        endColumn: finding.EndColumn || finding.StartColumn || 1,
        file: finding.File || 'unknown',
        commit: finding.Commit || 'unknown',
        author: finding.Author || 'unknown',
        email: finding.Email || 'unknown',
        date: finding.Date || new Date().toISOString(),
        message: finding.Message || 'Secret detected',
        maskedValue: this.maskSecret(finding.Secret),
        confidence: this.getConfidence(finding.RuleID),
        source: 'gitleaks',
        recommendation: this.generateRecommendation(finding.RuleID),
        rawData: {
          ruleId: finding.RuleID,
          entropy: finding.Entropy,
          secretHash: finding.Fingerprint,
          tags: finding.Tags || []
        }
      };

      secrets.push(secret);
    });

    return {
      secrets,
      totalFindings: secrets.length,
      commitsCovered: [...new Set(secrets.map(s => s.commit))].length,
      filesCovered: [...new Set(secrets.map(s => s.file))].length
    };
  }

  /**
   * Generate scan summary
   */
  generateSummary(gitLeaksFindings) {
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    const ruleCounts = {};
    const commitsCovered = new Set();
    const authorsCovered = new Set();

    gitLeaksFindings.forEach(finding => {
      const severity = this.getSeverity(finding.RuleID);
      severityCounts[severity]++;
      
      const rule = finding.RuleID;
      ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;
      
      if (finding.Commit) commitsCovered.add(finding.Commit);
      if (finding.Author) authorsCovered.add(finding.Author);
    });

    return {
      totalSecrets: gitLeaksFindings.length,
      severityBreakdown: severityCounts,
      ruleBreakdown: ruleCounts,
      commitsAffected: commitsCovered.size,
      authorsInvolved: authorsCovered.size,
      riskLevel: this.calculateRiskLevel(severityCounts),
      recommendation: this.getOverallRecommendation(gitLeaksFindings.length, severityCounts)
    };
  }

  /**
   * Helper methods
   */
  getSecretType(ruleId) {
    const typeMap = {
      'aws-access-token': 'AWS Access Token',
      'aws-secret-key': 'AWS Secret Key',
      'github-pat': 'GitHub Personal Access Token',
      'github-oauth': 'GitHub OAuth Token',
      'gitlab-pat': 'GitLab Personal Access Token',
      'slack-access-token': 'Slack Access Token',
      'discord-api-token': 'Discord API Token',
      'stripe-access-token': 'Stripe API Key',
      'twilio-api-key': 'Twilio API Key',
      'sendgrid-api-token': 'SendGrid API Token',
      'generic-api-key': 'Generic API Key',
      'rsa-private-key': 'RSA Private Key',
      'ssh-private-key': 'SSH Private Key',
      'jwt': 'JSON Web Token',
      'postgres': 'PostgreSQL Connection String',
      'mysql': 'MySQL Connection String'
    };
    
    return typeMap[ruleId] || ruleId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getSeverity(ruleId) {
    // High severity secrets
    const highSeverity = [
      'aws-access-token', 'aws-secret-key',
      'github-pat', 'gitlab-pat',
      'stripe-access-token', 'rsa-private-key',
      'ssh-private-key'
    ];
    
    // Medium severity secrets
    const mediumSeverity = [
      'github-oauth', 'slack-access-token',
      'discord-api-token', 'twilio-api-key',
      'sendgrid-api-token', 'jwt'
    ];
    
    if (highSeverity.includes(ruleId)) return 'high';
    if (mediumSeverity.includes(ruleId)) return 'medium';
    return 'low';
  }

  getConfidence(ruleId) {
    // High confidence rules
    const highConfidence = [
      'aws-access-token', 'github-pat',
      'stripe-access-token', 'rsa-private-key'
    ];
    
    return highConfidence.includes(ruleId) ? 95 : 80;
  }

  maskSecret(secret) {
    if (!secret || secret.length < 8) {
      return '[REDACTED]';
    }
    
    const start = secret.substring(0, 4);
    const end = secret.substring(secret.length - 4);
    const middle = '*'.repeat(Math.max(4, secret.length - 8));
    
    return `${start}${middle}${end}`;
  }

  generateRecommendation(ruleId) {
    const recommendations = {
      'aws-access-token': 'Rotate AWS access keys immediately via IAM console',
      'aws-secret-key': 'Rotate AWS secret keys and review CloudTrail logs',
      'github-pat': 'Revoke GitHub personal access token and create new one with minimal scopes',
      'gitlab-pat': 'Revoke GitLab personal access token in user settings',
      'slack-access-token': 'Regenerate Slack app token and review app permissions',
      'stripe-access-token': 'Rotate Stripe API key and review recent transactions',
      'rsa-private-key': 'Generate new RSA key pair and update all systems',
      'ssh-private-key': 'Generate new SSH key pair and update authorized_keys',
      'jwt': 'Invalidate JWT tokens and regenerate with shorter expiration'
    };
    
    return recommendations[ruleId] || 
           'Remove secret from repository, rotate if possible, and use secure storage';
  }

  calculateRiskLevel(severityCounts) {
    if (severityCounts.critical > 0) return 'critical';
    if (severityCounts.high > 0) return 'high';
    if (severityCounts.medium > 2) return 'high';
    if (severityCounts.medium > 0) return 'medium';
    return 'low';
  }

  getOverallRecommendation(totalSecrets, severityCounts) {
    if (totalSecrets === 0) {
      return 'No secrets detected in git history.';
    }
    
    if (severityCounts.high > 0) {
      return 'HIGH RISK: Sensitive secrets found in git history. Clean repository history and rotate all secrets.';
    }
    
    if (severityCounts.medium > 0) {
      return 'MEDIUM RISK: Secrets found in git history. Review findings and clean up repository.';
    }
    
    return 'LOW RISK: Minor secrets detected. Review and clean up as needed.';
  }

  async cleanupTempRepo(repoPath) {
    try {
      await fs.rm(repoPath, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to cleanup temp repo ${repoPath}:`, error.message);
    }
  }

  /**
   * Health check
   */
  async getHealth() {
    return new Promise((resolve) => {
      // Check if Docker is available
      const docker = spawn('docker', ['--version'], { stdio: 'pipe' });
      
      let dockerVersion = 'unknown';
      docker.stdout.on('data', (data) => {
        dockerVersion = data.toString().trim();
      });
      
      docker.on('close', (code) => {
        const isDockerAvailable = code === 0;
        
        resolve({
          name: this.name,
          version: this.version,
          dockerImage: this.dockerImage,
          dockerVersion,
          status: isDockerAvailable ? 'healthy' : 'docker-not-available',
          available: isDockerAvailable,
          capabilities: [
            'Git history secret scanning',
            'Pre-commit protection',
            'Custom rule configuration',
            'Entropy-based detection',
            'Commit-level tracking',
            'Author identification'
          ]
        });
      });
      
      docker.on('error', () => {
        resolve({
          name: this.name,
          version: this.version,
          status: 'docker-not-installed',
          available: false,
          error: 'Docker not found'
        });
      });
    });
  }
}

module.exports = GitLeaksScanner;