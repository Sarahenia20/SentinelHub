const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;
const path = require('path');

/**
 * 🔍 REAL Semgrep Integration
 * Uses official Semgrep CLI with 1000+ community security rules
 * 
 * Reference: https://github.com/returntocorp/semgrep
 * Docs: https://semgrep.dev/docs/
 */
class SemgrepIntegration {
  constructor() {
    this.name = 'Real Semgrep Security Scanner';
    this.version = '1.0.0';
    this.tempDir = path.join(__dirname, '../../temp/semgrep-real');
    this.installed = false;
    
    console.log(`🔍 ${this.name} v${this.version} initialized`);
  }
  
  /**
   * Install Semgrep if not available
   */
  async ensureInstalled() {
    if (this.installed) return true;
    
    try {
      // Check if semgrep is installed
      await execAsync('semgrep --version');
      this.installed = true;
      console.log('   ✅ Semgrep CLI detected');
      return true;
    } catch (error) {
      console.log('   📦 Installing Semgrep...');
      
      try {
        // Try pip install
        await execAsync('pip install semgrep', { timeout: 120000 });
        await execAsync('semgrep --version');
        this.installed = true;
        console.log('   ✅ Semgrep installed successfully');
        return true;
      } catch (installError) {
        console.warn('   ⚠️ Semgrep installation failed:', installError.message);
        console.log('   💡 Install manually: pip install semgrep');
        return false;
      }
    }
  }
  
  /**
   * Scan code with REAL Semgrep community rules
   */
  async scanCode(code, language, options = {}) {
    console.log(`🔍 Running REAL Semgrep scan for ${language}...`);
    
    if (!(await this.ensureInstalled())) {
      throw new Error('Semgrep not available. Install with: pip install semgrep');
    }
    
    try {
      // Ensure temp directory
      await fs.mkdir(this.tempDir, { recursive: true });
      
      // Write code to temp file with proper extension
      const fileExt = this.getFileExtension(language);
      const tempFile = path.join(this.tempDir, `scan-${Date.now()}${fileExt}`);
      await fs.writeFile(tempFile, code, 'utf8');
      
      // Build optimized semgrep command 
      const rulesets = this.getRulesets(language, { ...options, fastScan: true });
      const semgrepCmd = [
        'semgrep',
        '--config=' + rulesets.join(','),
        '--json',
        '--no-git-ignore',
        '--timeout=15', // Reduced from 60 to 15 seconds
        '--max-memory=1024', // Reduced from 2GB to 1GB
        '--quiet', // Reduce output verbosity
        `"${tempFile}"`
      ].join(' ');
      
      console.log(`   🔧 Fast scan: ${rulesets.length} rulesets`);
      
      // Execute Semgrep with reduced timeout
      const { stdout, stderr } = await execAsync(semgrepCmd, {
        timeout: 25000, // Reduced from 90s to 25s
        maxBuffer: 1024 * 1024 * 2 // Reduced buffer
      });
      
      if (stderr && !stderr.includes('INFO') && !stderr.includes('Scanning')) {
        console.warn(`   ⚠️ Semgrep stderr: ${stderr.substring(0, 200)}...`);
      }
      
      // Parse results
      let results = [];
      if (stdout.trim()) {
        const parsed = JSON.parse(stdout);
        results = this.processResults(parsed, code, language);
      }
      
      // Cleanup
      await this.cleanup(tempFile);
      
      console.log(`   ✅ Found ${results.length} Semgrep findings`);
      return results;
      
    } catch (error) {
      await this.cleanup();
      
      if (error.message.includes('timeout')) {
        throw new Error('Semgrep scan timeout - code too large or complex');
      }
      
      throw new Error(`Semgrep scan failed: ${error.message}`);
    }
  }
  
  /**
   * Get appropriate file extension for language
   */
  getFileExtension(language) {
    const extensions = {
      'javascript': '.js',
      'typescript': '.ts',
      'python': '.py',
      'java': '.java',
      'php': '.php',
      'go': '.go',
      'ruby': '.rb',
      'csharp': '.cs',
      'cpp': '.cpp',
      'c': '.c',
      'rust': '.rs',
      'kotlin': '.kt',
      'swift': '.swift',
      'scala': '.scala'
    };
    
    return extensions[language.toLowerCase()] || '.txt';
  }
  
  /**
   * Get optimized Semgrep rulesets for faster scanning
   */
  getRulesets(language, options = {}) {
    const rulesets = [];
    
    // For code snippets, use focused rules for speed
    if (options.fastScan || !options.fullScan) {
      // Only essential security rules for fast scanning
      rulesets.push('p/owasp-top-ten');
      
      // Add one language-specific ruleset
      switch (language.toLowerCase()) {
        case 'javascript':
        case 'typescript':
          rulesets.push('p/javascript');
          break;
        case 'python':
          rulesets.push('p/python');
          break;
        case 'java':
          rulesets.push('p/java');
          break;
        default:
          rulesets.push('p/security-audit');
      }
      
      return rulesets;
    }
    
    // Full comprehensive scan (for repositories)
    rulesets.push('p/owasp-top-ten');
    rulesets.push('p/cwe-top-25');
    rulesets.push('p/security-audit');
    
    // Language-specific community rules (limited)
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        rulesets.push('p/javascript');
        rulesets.push('p/react');
        break;
        
      case 'python':
        rulesets.push('p/python');
        rulesets.push('p/bandit');
        break;
        
      case 'java':
        rulesets.push('p/java');
        break;
        
      default:
        // No extra rules for other languages to keep it fast
        break;
    }
    
    return rulesets;
  }
  
  /**
   * Process Semgrep results into standardized format
   */
  processResults(semgrepOutput, originalCode, language) {
    const findings = [];
    
    if (!semgrepOutput.results || !Array.isArray(semgrepOutput.results)) {
      return findings;
    }
    
    for (const result of semgrepOutput.results) {
      const finding = {
        source: 'semgrep-real',
        tool: 'semgrep-cli',
        scanId: result.check_id,
        ruleId: result.check_id,
        
        // Vulnerability details
        type: this.categorizeVulnerability(result.check_id),
        severity: this.mapSeverity(result.extra?.severity),
        category: this.extractCategory(result.check_id),
        
        // Message and description
        message: result.extra?.message || 'Security finding detected',
        description: result.extra?.shortlink || '',
        
        // Location information
        line: result.start?.line || 1,
        column: result.start?.col || 1,
        endLine: result.end?.line,
        endColumn: result.end?.col,
        
        // Code context
        code: this.extractCodeSnippet(originalCode, result.start?.line, 3),
        
        // Confidence and metadata
        confidence: this.calculateConfidence(result),
        impact: this.assessImpact(result.check_id, result.extra?.severity),
        
        // Security classifications
        cwe: this.extractCWE(result.extra?.metadata),
        owasp: this.extractOWASP(result.extra?.metadata),
        
        // Remediation
        recommendation: this.generateRecommendation(result),
        references: result.extra?.references || [],
        
        // Additional metadata
        language: language,
        timestamp: new Date().toISOString(),
        semgrepMetadata: {
          rulesets: result.extra?.metadata?.semgrep?.dev?.rule?.r_id,
          license: result.extra?.metadata?.license,
          source: result.extra?.metadata?.source
        }
      };
      
      findings.push(finding);
    }
    
    return findings.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    });
  }
  
  /**
   * Map Semgrep severity to our standard levels
   */
  mapSeverity(semgrepSeverity) {
    const severityMap = {
      'ERROR': 'critical',
      'WARNING': 'high', 
      'INFO': 'medium'
    };
    
    return severityMap[semgrepSeverity] || 'medium';
  }
  
  /**
   * Calculate confidence based on rule quality and context
   */
  calculateConfidence(result) {
    let confidence = 0.8; // Base confidence for Semgrep community rules
    
    // Higher confidence for OWASP/CWE rules
    if (result.check_id.includes('owasp') || result.check_id.includes('cwe')) {
      confidence += 0.15;
    }
    
    // Higher confidence for language-specific rules
    if (result.check_id.includes('javascript') || result.check_id.includes('python') || 
        result.check_id.includes('java')) {
      confidence += 0.05;
    }
    
    // Lower confidence for generic rules
    if (result.check_id.includes('generic')) {
      confidence -= 0.2;
    }
    
    return Math.min(Math.max(confidence, 0.1), 1.0);
  }
  
  /**
   * Categorize vulnerability based on rule ID
   */
  categorizeVulnerability(checkId) {
    const lower = checkId.toLowerCase();
    
    if (lower.includes('injection') || lower.includes('sqli')) return 'injection';
    if (lower.includes('xss') || lower.includes('cross-site')) return 'xss';
    if (lower.includes('csrf') || lower.includes('forgery')) return 'csrf';
    if (lower.includes('auth') || lower.includes('session')) return 'authentication';
    if (lower.includes('crypto') || lower.includes('hash')) return 'cryptography';
    if (lower.includes('path') || lower.includes('traversal')) return 'path-traversal';
    if (lower.includes('deserial')) return 'deserialization';
    if (lower.includes('command')) return 'command-injection';
    if (lower.includes('redirect')) return 'open-redirect';
    if (lower.includes('secret') || lower.includes('password')) return 'secrets';
    
    return 'security-misconfiguration';
  }
  
  /**
   * Extract CWE from metadata
   */
  extractCWE(metadata) {
    if (!metadata) return null;
    
    const metaStr = JSON.stringify(metadata);
    const cweMatch = metaStr.match(/CWE[:-]?(\d+)/i);
    return cweMatch ? `CWE-${cweMatch[1]}` : null;
  }
  
  /**
   * Extract OWASP category
   */
  extractOWASP(metadata) {
    if (!metadata) return null;
    
    const metaStr = JSON.stringify(metadata);
    const owaspMatch = metaStr.match(/A\d{2}:\d{4}/);
    return owaspMatch ? owaspMatch[0] : null;
  }
  
  /**
   * Generate actionable recommendation
   */
  generateRecommendation(result) {
    const checkId = result.check_id.toLowerCase();
    
    if (checkId.includes('sql') || checkId.includes('injection')) {
      return 'Use parameterized queries or prepared statements';
    }
    if (checkId.includes('xss')) {
      return 'Sanitize and encode user input before rendering';
    }
    if (checkId.includes('command')) {
      return 'Avoid system command execution with user input';
    }
    if (checkId.includes('path')) {
      return 'Validate file paths and use safe path operations';
    }
    if (checkId.includes('crypto')) {
      return 'Use strong cryptographic algorithms and proper key management';
    }
    
    return result.extra?.message || 'Review this security finding';
  }
  
  /**
   * Extract code snippet around the finding
   */
  extractCodeSnippet(code, lineNum, contextLines = 2) {
    if (!code || !lineNum) return '';
    
    const lines = code.split('\n');
    const start = Math.max(0, lineNum - contextLines - 1);
    const end = Math.min(lines.length, lineNum + contextLines);
    
    return lines
      .slice(start, end)
      .map((line, idx) => {
        const actualLineNum = start + idx + 1;
        const marker = actualLineNum === lineNum ? '>>> ' : '    ';
        return `${marker}${actualLineNum}: ${line}`;
      })
      .join('\n');
  }
  
  /**
   * Extract category from rule ID
   */
  extractCategory(checkId) {
    const parts = checkId.split('.');
    return parts[parts.length - 2] || 'security';
  }
  
  /**
   * Assess impact level
   */
  assessImpact(checkId, severity) {
    if (severity === 'ERROR') return 'high';
    if (severity === 'WARNING') return 'medium';
    return 'low';
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
   * Health check for Semgrep
   */
  async getHealth() {
    const available = await this.ensureInstalled();
    let version = 'Not installed';
    let ruleCount = 0;
    
    if (available) {
      try {
        const { stdout } = await execAsync('semgrep --version');
        version = stdout.trim();
        
        // Try to get rule count
        const { stdout: rulesOut } = await execAsync('semgrep --config=p/owasp-top-ten --dryrun 2>&1 || true');
        const ruleMatch = rulesOut.match(/(\d+)\s+rules/i);
        ruleCount = ruleMatch ? parseInt(ruleMatch[1]) : 0;
        
      } catch (error) {
        // Ignore errors in health check
      }
    }
    
    return {
      status: available ? 'healthy' : 'unavailable',
      tool: 'semgrep-cli',
      version: version,
      rulesAvailable: ruleCount,
      capabilities: available ? [
        '1000+ Community Security Rules',
        'OWASP Top 10 Detection',
        'CWE Classification', 
        '20+ Programming Languages',
        'Supply Chain Security',
        'Infrastructure as Code Scanning'
      ] : [],
      installation: available ? 'Ready' : 'Run: pip install semgrep',
      documentation: 'https://semgrep.dev/docs/'
    };
  }
}

module.exports = SemgrepIntegration;