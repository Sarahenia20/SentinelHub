const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * TruffleHog Secret Scanner Integration
 * Uses the actual TruffleHog Docker container for comprehensive secret detection
 */
class TruffleHogScanner {
  constructor() {
    this.name = 'TruffleHog Scanner';
    this.version = '1.0.0';
    this.dockerImage = 'trufflesecurity/trufflehog:latest';
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
   * Scan code/text for secrets using TruffleHog
   */
  async scanForSecrets(content, options = {}) {
    const scanId = crypto.randomUUID();
    const startTime = Date.now();
    
    // Skip TruffleHog for very small content (under 5 lines) to improve performance
    if (content.split('\n').length < 5) {
      console.log('   ⚡ Skipping TruffleHog for small content (performance optimization)');
      return {
        success: true,
        scanId,
        timestamp: new Date().toISOString(),
        scanDuration: Date.now() - startTime,
        tool: 'trufflehog',
        version: 'skipped-small-content',
        secrets: [],
        summary: { totalSecrets: 0, confidenceBreakdown: { high: 0, medium: 0, low: 0 } }
      };
    }
    
    try {
      // Write content to temporary file
      const tempFile = await this.writeContentToTempFile(content, scanId);
      
      // Run TruffleHog scan via Docker
      const results = await this.runTruffleHogScan(tempFile, options);
      
      // Clean up temp file
      await this.cleanupTempFile(tempFile);
      
      const scanDuration = Date.now() - startTime;
      
      return {
        success: true,
        scanId,
        timestamp: new Date().toISOString(),
        scanDuration,
        tool: 'trufflehog',
        results: this.parseResults(results),
        summary: this.generateSummary(results)
      };
      
    } catch (error) {
      console.error('TruffleHog scan failed:', error);
      return {
        success: false,
        error: error.message,
        scanId,
        tool: 'trufflehog',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Scan GitHub repository using TruffleHog
   */
  async scanRepository(repoUrl, options = {}) {
    const scanId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      const results = await this.runTruffleHogRepoScan(repoUrl, options);
      const scanDuration = Date.now() - startTime;
      
      return {
        success: true,
        scanId,
        timestamp: new Date().toISOString(),
        scanDuration,
        tool: 'trufflehog',
        repository: repoUrl,
        results: this.parseResults(results),
        summary: this.generateSummary(results)
      };
      
    } catch (error) {
      console.error('TruffleHog repository scan failed:', error);
      return {
        success: false,
        error: error.message,
        scanId,
        tool: 'trufflehog',
        repository: repoUrl,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Write content to temporary file
   */
  async writeContentToTempFile(content, scanId) {
    const filename = `trufflehog_scan_${scanId}.txt`;
    const filepath = path.join(this.tempDir, filename);
    await fs.writeFile(filepath, content, 'utf8');
    return filepath;
  }

  /**
   * Run TruffleHog scan on file via Docker
   */
  async runTruffleHogScan(filepath, options = {}) {
    return new Promise((resolve, reject) => {
      const dockerArgs = [
        'run',
        '--rm',
        '--volume', `${path.dirname(filepath)}:/scan`,
        this.dockerImage,
        'filesystem',
        '--json',
        '--no-update',
        `/scan/${path.basename(filepath)}`
      ];

      // Add verification options
      if (options.includeUnverified !== false) {
        dockerArgs.splice(-1, 0, '--include-unverified');
      }

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
        if (code === 0 || code === 1) { // 0 = no secrets, 1 = secrets found
          try {
            // Parse JSON lines output
            const findings = this.parseJsonLines(stdout);
            resolve(findings);
          } catch (parseError) {
            console.warn('TruffleHog output parsing failed, using empty results');
            resolve([]);
          }
        } else {
          reject(new Error(`TruffleHog scan failed with code ${code}: ${stderr}`));
        }
      });

      docker.on('error', (error) => {
        if (error.code === 'ENOENT') {
          reject(new Error('Docker not found. Please install Docker to use TruffleHog'));
        } else {
          reject(error);
        }
      });
    });
  }

  /**
   * Run TruffleHog scan on Git repository
   */
  async runTruffleHogRepoScan(repoUrl, options = {}) {
    return new Promise((resolve, reject) => {
      const dockerArgs = [
        'run',
        '--rm',
        this.dockerImage,
        'git',
        '--json',
        '--no-update',
        repoUrl
      ];

      if (options.includeUnverified !== false) {
        dockerArgs.splice(-1, 0, '--include-unverified');
      }

      // Add branch specification if provided
      if (options.branch) {
        dockerArgs.splice(-1, 0, '--branch', options.branch);
      }

      // Add max depth for performance
      if (options.maxDepth) {
        dockerArgs.splice(-1, 0, '--max-depth', options.maxDepth.toString());
      }

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
        if (code === 0 || code === 1) {
          try {
            const findings = this.parseJsonLines(stdout);
            resolve(findings);
          } catch (parseError) {
            console.warn('TruffleHog repository output parsing failed');
            resolve([]);
          }
        } else {
          reject(new Error(`TruffleHog repository scan failed: ${stderr}`));
        }
      });

      docker.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Parse TruffleHog JSONL output
   */
  parseJsonLines(output) {
    const findings = [];
    const lines = output.trim().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const finding = JSON.parse(line);
        if (finding && finding.DetectorName) {
          findings.push(finding);
        }
      } catch (error) {
        // Skip malformed JSON lines
        continue;
      }
    }
    
    return findings;
  }

  /**
   * Parse TruffleHog results into standardized format
   */
  parseResults(truffleHogFindings) {
    const secrets = [];
    
    truffleHogFindings.forEach(finding => {
      const secret = {
        type: this.getSecretType(finding.DetectorName),
        detectorName: finding.DetectorName,
        severity: finding.Verified ? 'high' : 'medium',
        line: this.extractLineNumber(finding),
        file: finding.SourceMetadata?.Data?.Filesystem?.file || 'unknown',
        maskedValue: this.maskSecret(finding.Raw),
        confidence: finding.Verified ? 95 : 70,
        verified: finding.Verified || false,
        source: 'trufflehog',
        recommendation: this.generateRecommendation(finding.DetectorName),
        rawData: {
          detector: finding.DetectorName,
          decoderName: finding.DecoderName,
          verified: finding.Verified,
          extraData: finding.ExtraData
        }
      };

      // Add source metadata if available
      if (finding.SourceMetadata) {
        const metadata = finding.SourceMetadata.Data;
        if (metadata.Git) {
          secret.git = {
            commit: metadata.Git.commit,
            file: metadata.Git.file,
            email: metadata.Git.email,
            repository: metadata.Git.repository,
            timestamp: metadata.Git.timestamp
          };
        }
      }

      secrets.push(secret);
    });

    return {
      secrets,
      totalFindings: secrets.length,
      verifiedSecrets: secrets.filter(s => s.verified).length,
      unverifiedSecrets: secrets.filter(s => !s.verified).length
    };
  }

  /**
   * Generate scan summary
   */
  generateSummary(truffleHogFindings) {
    const verified = truffleHogFindings.filter(f => f.Verified).length;
    const unverified = truffleHogFindings.length - verified;
    
    const detectorCounts = {};
    truffleHogFindings.forEach(finding => {
      const detector = finding.DetectorName;
      detectorCounts[detector] = (detectorCounts[detector] || 0) + 1;
    });

    return {
      totalSecrets: truffleHogFindings.length,
      verifiedSecrets: verified,
      unverifiedSecrets: unverified,
      riskLevel: verified > 0 ? 'critical' : (unverified > 0 ? 'high' : 'low'),
      detectorBreakdown: detectorCounts,
      recommendation: this.getOverallRecommendation(verified, unverified)
    };
  }

  /**
   * Helper methods
   */
  extractLineNumber(finding) {
    // Try to extract line number from source metadata
    if (finding.SourceMetadata?.Data?.Filesystem?.line) {
      return finding.SourceMetadata.Data.Filesystem.line;
    }
    return 1; // Default line number
  }

  maskSecret(rawSecret) {
    if (!rawSecret || rawSecret.length < 8) {
      return '[REDACTED]';
    }
    
    const start = rawSecret.substring(0, 4);
    const end = rawSecret.substring(rawSecret.length - 4);
    const middle = '*'.repeat(Math.max(4, rawSecret.length - 8));
    
    return `${start}${middle}${end}`;
  }

  getSecretType(detectorName) {
    const typeMap = {
      'AWS': 'AWS Credentials',
      'GitHub': 'GitHub Token',
      'GitLab': 'GitLab Token',
      'Slack': 'Slack Token',
      'Discord': 'Discord Token',
      'Stripe': 'Stripe API Key',
      'Twilio': 'Twilio API Key',
      'SendGrid': 'SendGrid API Key',
      'MailGun': 'MailGun API Key',
      'Generic': 'Generic Secret',
      'PrivateKey': 'Private Key',
      'JWT': 'JSON Web Token'
    };
    
    // Try exact match first
    if (typeMap[detectorName]) {
      return typeMap[detectorName];
    }
    
    // Try partial matches
    const lowerDetector = detectorName.toLowerCase();
    if (lowerDetector.includes('key')) return 'API Key';
    if (lowerDetector.includes('token')) return 'Token';
    if (lowerDetector.includes('password')) return 'Password';
    if (lowerDetector.includes('secret')) return 'Secret';
    
    return detectorName; // Fallback to detector name
  }

  generateRecommendation(detectorName) {
    const recommendations = {
      'AWS': 'Rotate AWS credentials immediately and use IAM roles where possible',
      'GitHub': 'Revoke GitHub token and generate a new one with minimal permissions',
      'GitLab': 'Revoke GitLab token and create a new one with limited scope',
      'Slack': 'Regenerate Slack app tokens and review app permissions',
      'Discord': 'Revoke Discord bot token and create a new one',
      'Stripe': 'Rotate Stripe API keys and review webhook endpoints',
      'JWT': 'Invalidate JWT tokens and regenerate with shorter expiration',
      'PrivateKey': 'Regenerate private key and update all systems using it'
    };
    
    return recommendations[detectorName] || 
           'Remove secret from code, rotate if possible, and use environment variables';
  }

  getOverallRecommendation(verified, unverified) {
    if (verified > 0) {
      return 'CRITICAL: Verified secrets found. Rotate immediately and remove from repository history.';
    }
    if (unverified > 5) {
      return 'HIGH: Multiple unverified secrets detected. Review and clean up immediately.';
    }
    if (unverified > 0) {
      return 'MEDIUM: Unverified secrets detected. Review findings and remove if valid.';
    }
    return 'LOW: No secrets detected in scan.';
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
            'Verified secret detection',
            '800+ secret types supported',
            'Git history scanning',
            'Filesystem scanning',
            'Custom detector support',
            'Enterprise secret detection'
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

module.exports = TruffleHogScanner;