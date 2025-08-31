const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;
const path = require('path');

/**
 * 🔐 REAL TruffleHog Integration
 * Uses official TruffleHog binary for high-precision secret detection
 * 
 * Reference: https://github.com/trufflesecurity/trufflehog
 * Documentation: https://github.com/trufflesecurity/trufflehog#usage
 */
class TruffleHogIntegration {
  constructor() {
    this.name = 'Real TruffleHog Secret Scanner';
    this.version = '1.0.0';
    this.tempDir = path.join(__dirname, '../../temp/trufflehog-real');
    this.installed = false;
    
    console.log(`🔐 ${this.name} v${this.version} initialized`);
  }
  
  /**
   * Install TruffleHog if not available
   */
  async ensureInstalled() {
    if (this.installed) return true;
    
    try {
      // Check if trufflehog is installed
      await execAsync('trufflehog --version');
      this.installed = true;
      console.log('   ✅ TruffleHog binary detected');
      return true;
    } catch (error) {
      console.log('   📦 TruffleHog not found - attempting installation...');
      
      try {
        // Try different installation methods
        const platform = process.platform;
        
        if (platform === 'win32') {
          // Windows - try downloading binary
          console.log('   💾 Downloading TruffleHog for Windows...');
          await this.installWindows();
        } else if (platform === 'darwin') {
          // macOS - try brew
          await execAsync('brew install trufflesecurity/trufflehog/trufflehog', { timeout: 120000 });
        } else {
          // Linux - try direct download
          await this.installLinux();
        }
        
        // Verify installation
        await execAsync('trufflehog --version');
        this.installed = true;
        console.log('   ✅ TruffleHog installed successfully');
        return true;
        
      } catch (installError) {
        console.warn('   ⚠️ TruffleHog installation failed:', installError.message);
        console.log('   💡 Manual install: https://github.com/trufflesecurity/trufflehog#installation');
        return false;
      }
    }
  }
  
  /**
   * Install TruffleHog on Windows
   */
  async installWindows() {
    const downloadUrl = 'https://github.com/trufflesecurity/trufflehog/releases/latest/download/trufflehog_windows_amd64.tar.gz';
    const installDir = path.join(process.env.ProgramFiles || 'C:\\Program Files', 'TruffleHog');
    
    // Create install directory
    await fs.mkdir(installDir, { recursive: true });
    
    // Download and extract
    const downloadCmd = `curl -L "${downloadUrl}" -o "${path.join(installDir, 'trufflehog.tar.gz')}"`;
    await execAsync(downloadCmd, { timeout: 60000 });
    
    const extractCmd = `tar -xzf "${path.join(installDir, 'trufflehog.tar.gz')}" -C "${installDir}"`;
    await execAsync(extractCmd);
    
    // Add to PATH (for current process)
    process.env.PATH = `${installDir};${process.env.PATH}`;
  }
  
  /**
   * Install TruffleHog on Linux
   */
  async installLinux() {
    const downloadUrl = 'https://github.com/trufflesecurity/trufflehog/releases/latest/download/trufflehog_linux_amd64.tar.gz';
    const installDir = '/usr/local/bin';
    
    const downloadCmd = `curl -L "${downloadUrl}" | tar -xzf - -C "${installDir}"`;
    await execAsync(downloadCmd, { timeout: 60000 });
  }
  
  /**
   * Scan code for secrets with REAL TruffleHog
   */
  async scanCode(code, options = {}) {
    console.log('🔐 Running REAL TruffleHog secret scan...');
    
    if (!(await this.ensureInstalled())) {
      throw new Error('TruffleHog not available. Install from: https://github.com/trufflesecurity/trufflehog#installation');
    }
    
    try {
      // Ensure temp directory
      await fs.mkdir(this.tempDir, { recursive: true });
      
      // Write code to temp file
      const tempFile = path.join(this.tempDir, `secrets-scan-${Date.now()}.txt`);
      await fs.writeFile(tempFile, code, 'utf8');
      
      // Build TruffleHog command
      const truffleCmd = [
        'trufflehog',
        'filesystem',
        `"${tempFile}"`,
        '--json',
        '--no-verification', // Skip verification for speed in demo
        '--no-update',
        '--concurrency=10'
      ];
      
      // Add additional options
      if (options.includeEntropy !== false) {
        truffleCmd.push('--entropy-level=3'); // Medium entropy detection
      }
      
      if (options.onlyVerified) {
        truffleCmd.splice(truffleCmd.indexOf('--no-verification'), 1);
      }
      
      const command = truffleCmd.join(' ');
      console.log(`   🔧 Command: ${command}`);
      
      // Execute TruffleHog
      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000,
        maxBuffer: 1024 * 1024 * 2 // 2MB buffer
      });
      
      if (stderr && !stderr.includes('🐷')) {
        console.warn(`   ⚠️ TruffleHog stderr: ${stderr.substring(0, 200)}...`);
      }
      
      // Parse results
      const secrets = this.parseResults(stdout, code);
      
      // Cleanup
      await this.cleanup(tempFile);
      
      console.log(`   ✅ Found ${secrets.length} TruffleHog secrets`);
      return secrets;
      
    } catch (error) {
      await this.cleanup();
      
      if (error.message.includes('timeout')) {
        throw new Error('TruffleHog scan timeout - code too large');
      }
      
      throw new Error(`TruffleHog scan failed: ${error.message}`);
    }
  }
  
  /**
   * Scan GitHub repository for secrets
   */
  async scanRepository(repoUrl, options = {}) {
    console.log(`🔐 Running TruffleHog repository scan: ${repoUrl}...`);
    
    if (!(await this.ensureInstalled())) {
      throw new Error('TruffleHog not available');
    }
    
    try {
      const truffleCmd = [
        'trufflehog',
        'github',
        '--repo=' + repoUrl,
        '--json',
        '--no-update',
        '--concurrency=5'
      ];
      
      if (options.githubToken) {
        truffleCmd.push('--token=' + options.githubToken);
      }
      
      if (options.branch) {
        truffleCmd.push('--branch=' + options.branch);
      }
      
      if (options.since) {
        truffleCmd.push('--since-commit=' + options.since);
      }
      
      const command = truffleCmd.join(' ');
      console.log(`   🔧 Command: ${command.replace(/--token=\S+/, '--token=***')}`);
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 180000, // 3 minutes for repo scans
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      if (stderr && !stderr.includes('🐷')) {
        console.warn(`   ⚠️ TruffleHog warnings: ${stderr.substring(0, 200)}...`);
      }
      
      const secrets = this.parseResults(stdout);
      
      console.log(`   ✅ Repository scan complete: ${secrets.length} secrets found`);
      return secrets;
      
    } catch (error) {
      if (error.message.includes('timeout')) {
        throw new Error('Repository scan timeout - repository too large');
      }
      
      throw new Error(`Repository scan failed: ${error.message}`);
    }
  }
  
  /**
   * Parse TruffleHog JSON output
   */
  parseResults(output, originalCode = '') {
    if (!output.trim()) return [];
    
    const secrets = [];
    const lines = output.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const result = JSON.parse(line);
        
        if (result.DetectorName && result.Raw) {
          const secret = {
            source: 'trufflehog-real',
            tool: 'trufflehog-cli',
            
            // Secret details
            type: this.mapSecretType(result.DetectorName),
            detectorName: result.DetectorName,
            secretValue: result.Raw,
            redactedValue: this.redactSecret(result.Raw),
            
            // Verification status
            verified: result.Verified || false,
            verificationError: result.VerificationError || null,
            
            // Location information
            file: result.SourceMetadata?.Data?.Filesystem?.file || 'unknown',
            line: this.findLineNumber(originalCode, result.Raw),
            
            // Source metadata
            sourceType: result.SourceName,
            sourceMetadata: result.SourceMetadata,
            
            // Severity and confidence
            severity: this.calculateSeverity(result),
            confidence: this.calculateConfidence(result),
            
            // Classification
            category: 'secrets',
            impact: this.assessImpact(result),
            
            // Timestamps and IDs
            timestamp: new Date().toISOString(),
            ruleId: `trufflehog-${result.DetectorName.toLowerCase()}`,
            
            // Remediation
            recommendation: this.getRecommendation(result.DetectorName),
            
            // Additional metadata
            truffleMetadata: {
              structuredData: result.StructuredData,
              extraData: result.ExtraData,
              decoderName: result.DecoderName
            }
          };
          
          // Add commit info if available (for repo scans)
          if (result.SourceMetadata?.Data?.Git) {
            secret.gitMetadata = {
              commit: result.SourceMetadata.Data.Git.commit,
              author: result.SourceMetadata.Data.Git.author,
              email: result.SourceMetadata.Data.Git.email,
              date: result.SourceMetadata.Data.Git.date,
              repository: result.SourceMetadata.Data.Git.repository
            };
          }
          
          secrets.push(secret);
        }
        
      } catch (parseError) {
        console.warn('   ⚠️ Failed to parse TruffleHog result:', parseError.message);
      }
    }
    
    return secrets.sort((a, b) => {
      // Sort by verification status first, then severity
      if (a.verified !== b.verified) return b.verified ? 1 : -1;
      
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    });
  }
  
  /**
   * Map TruffleHog detector names to readable types
   */
  mapSecretType(detectorName) {
    const typeMap = {
      'AWS': 'AWS Access Key',
      'AWSSessionKey': 'AWS Session Token',
      'Azure': 'Azure Key',
      'GCP': 'Google Cloud Key',
      'GitHub': 'GitHub Token',
      'GitLab': 'GitLab Token',
      'Slack': 'Slack Token',
      'SlackWebhook': 'Slack Webhook',
      'Discord': 'Discord Token',
      'DiscordWebhook': 'Discord Webhook',
      'Docker': 'Docker Registry Token',
      'NPM': 'NPM Token',
      'PyPI': 'PyPI Token',
      'Stripe': 'Stripe API Key',
      'Twilio': 'Twilio API Key',
      'SendGrid': 'SendGrid API Key',
      'MailChimp': 'MailChimp API Key',
      'MongoDB': 'MongoDB Connection String',
      'PostgreSQL': 'PostgreSQL Connection String',
      'MySQL': 'MySQL Connection String',
      'Redis': 'Redis Connection String',
      'JWT': 'JSON Web Token',
      'PrivateKey': 'Private Key',
      'PublicKey': 'Public Key',
      'SSHKey': 'SSH Private Key'
    };
    
    return typeMap[detectorName] || detectorName;
  }
  
  /**
   * Redact sensitive parts of secret
   */
  redactSecret(rawSecret) {
    if (!rawSecret || rawSecret.length < 8) return '***';
    
    const start = rawSecret.substring(0, 4);
    const end = rawSecret.substring(rawSecret.length - 4);
    const middle = '*'.repeat(Math.max(4, rawSecret.length - 8));
    
    return `${start}${middle}${end}`;
  }
  
  /**
   * Calculate severity based on secret type and verification
   */
  calculateSeverity(result) {
    if (result.Verified) {
      // Verified secrets are always high risk
      if (['AWS', 'GCP', 'Azure', 'GitHub', 'GitLab'].includes(result.DetectorName)) {
        return 'critical';
      }
      return 'high';
    }
    
    // Unverified secrets
    if (['PrivateKey', 'SSHKey', 'JWT'].includes(result.DetectorName)) {
      return 'high';
    }
    
    if (['AWS', 'GCP', 'Azure'].includes(result.DetectorName)) {
      return 'medium';
    }
    
    return 'low';
  }
  
  /**
   * Calculate confidence based on verification and detector
   */
  calculateConfidence(result) {
    if (result.Verified) return 0.95;
    
    // High-confidence detectors
    const highConfidenceDetectors = ['AWS', 'GitHub', 'PrivateKey', 'SSHKey'];
    if (highConfidenceDetectors.includes(result.DetectorName)) {
      return 0.85;
    }
    
    // Medium-confidence detectors
    const mediumConfidenceDetectors = ['JWT', 'Stripe', 'Twilio'];
    if (mediumConfidenceDetectors.includes(result.DetectorName)) {
      return 0.7;
    }
    
    return 0.6;
  }
  
  /**
   * Assess potential impact of exposed secret
   */
  assessImpact(result) {
    if (result.Verified) {
      const cloudProviders = ['AWS', 'GCP', 'Azure'];
      if (cloudProviders.includes(result.DetectorName)) {
        return 'critical'; // Can lead to full cloud account compromise
      }
      
      if (['GitHub', 'GitLab'].includes(result.DetectorName)) {
        return 'high'; // Can lead to code repository compromise
      }
      
      return 'medium';
    }
    
    return 'low';
  }
  
  /**
   * Get remediation recommendation for secret type
   */
  getRecommendation(detectorName) {
    const recommendations = {
      'AWS': 'Revoke AWS credentials immediately and rotate keys. Use IAM roles instead.',
      'GitHub': 'Revoke GitHub token immediately. Use environment variables or GitHub Actions secrets.',
      'PrivateKey': 'Revoke and regenerate private key. Never commit private keys to version control.',
      'JWT': 'Invalidate JWT tokens and implement proper secret management.',
      'Stripe': 'Revoke Stripe API key and generate new one. Use environment variables.',
      'Database': 'Change database credentials and use connection pooling with environment variables.'
    };
    
    return recommendations[detectorName] || 'Revoke this credential immediately and implement proper secret management practices.';
  }
  
  /**
   * Find line number of secret in code
   */
  findLineNumber(code, secret) {
    if (!code || !secret) return 1;
    
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(secret)) {
        return i + 1;
      }
    }
    
    return 1;
  }
  
  /**
   * Cleanup temporary files
   */
  async cleanup(specificFile = null) {
    try {
      if (specificFile) {
        await fs.unlink(specificFile);
      } else {
        await execAsync(`rm -rf "${this.tempDir}"`);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
  
  /**
   * Health check for TruffleHog
   */
  async getHealth() {
    const available = await this.ensureInstalled();
    let version = 'Not installed';
    let detectorCount = 0;
    
    if (available) {
      try {
        const { stdout } = await execAsync('trufflehog --version');
        version = stdout.trim();
        
        // Get detector count (approximate)
        detectorCount = 700; // TruffleHog has 700+ detectors
        
      } catch (error) {
        // Ignore errors in health check
      }
    }
    
    return {
      status: available ? 'healthy' : 'unavailable',
      tool: 'trufflehog-cli',
      version: version,
      detectorsAvailable: detectorCount,
      capabilities: available ? [
        '700+ Secret Detectors',
        'Real-time Secret Verification',
        'Git History Scanning',
        'Enterprise Secret Types',
        'High Accuracy Detection',
        'Multiple Source Support'
      ] : [],
      installation: available ? 'Ready' : 'Install from: https://github.com/trufflesecurity/trufflehog#installation',
      documentation: 'https://github.com/trufflesecurity/trufflehog#usage'
    };
  }
}

module.exports = TruffleHogIntegration;