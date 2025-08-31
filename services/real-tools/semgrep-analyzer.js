const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;
const path = require('path');

/**
 * 🔍 Real Semgrep Integration
 * Uses actual Semgrep CLI for advanced static analysis
 * 
 * Features:
 * - Language-specific rulesets
 * - OWASP Top 10 detection
 * - CWE classification
 * - Confidence scoring
 */
class SemgrepAnalyzer {
  constructor() {
    this.name = 'Semgrep Security Analyzer';
    this.version = '1.0.0';
    this.tempDir = path.join(__dirname, '../../temp/semgrep');
    
    console.log(`✅ ${this.name} v${this.version} initialized`);
  }
  
  /**
   * Run Semgrep analysis on files
   */
  async analyzeFiles(files, options = {}) {
    console.log(`🔍 Running Semgrep analysis on ${files.length} files...`);
    
    try {
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });
      
      // Write files to temp directory
      const tempFiles = [];
      for (const file of files) {
        const tempPath = path.join(this.tempDir, file.path);
        await fs.mkdir(path.dirname(tempPath), { recursive: true });
        await fs.writeFile(tempPath, file.content);
        tempFiles.push(tempPath);
      }
      
      // Run Semgrep with appropriate rulesets
      const rulesets = this.selectRulesets(files);
      const semgrepCommand = `semgrep --config=${rulesets.join(',')} --json --no-git-ignore ${this.tempDir}`;
      
      const { stdout, stderr } = await execAsync(semgrepCommand, { 
        timeout: 60000,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      if (stderr && !stderr.includes('INFO')) {
        console.warn(`   ⚠️ Semgrep warnings: ${stderr}`);
      }
      
      const results = JSON.parse(stdout);
      const processedResults = this.processResults(results, files);
      
      // Cleanup temp files
      await this.cleanup();
      
      console.log(`   ✓ Found ${processedResults.length} Semgrep findings`);
      return processedResults;
      
    } catch (error) {
      await this.cleanup();
      
      if (error.code === 'ENOENT') {
        throw new Error('Semgrep CLI not installed. Install with: pip install semgrep');\n      }
      
      throw new Error(`Semgrep analysis failed: ${error.message}`);
    }
  }
  
  /**
   * Select appropriate Semgrep rulesets based on languages
   */
  selectRulesets(files) {
    const languages = [...new Set(files.map(f => f.language))];
    const rulesets = ['auto']; // Default ruleset
    
    // Add language-specific rulesets
    if (languages.includes('javascript') || languages.includes('typescript')) {
      rulesets.push('p/javascript', 'p/react', 'p/nodejs');
    }
    
    if (languages.includes('python')) {
      rulesets.push('p/python', 'p/flask', 'p/django');
    }
    
    if (languages.includes('java')) {
      rulesets.push('p/java', 'p/spring');
    }
    
    if (languages.includes('go')) {
      rulesets.push('p/golang');
    }
    
    if (languages.includes('php')) {
      rulesets.push('p/php');
    }
    
    // Add security-focused rulesets
    rulesets.push('p/owasp-top-10', 'p/cwe-top-25', 'p/security-audit');
    
    return rulesets;
  }
  
  /**
   * Process raw Semgrep results into standardized format
   */
  processResults(semgrepResults, originalFiles) {
    const findings = [];
    
    if (!semgrepResults.results) {
      return findings;
    }
    
    for (const result of semgrepResults.results) {
      const originalFile = originalFiles.find(f => 
        result.path.includes(f.path) || f.path.includes(path.basename(result.path))
      );
      
      const finding = {
        source: 'semgrep',
        tool: 'semgrep-cli',
        id: result.check_id,
        type: this.categorizeVulnerability(result.check_id),\n        severity: this.mapSeverity(result.extra.severity),
        category: this.extractCategory(result.check_id),
        message: result.extra.message,
        description: result.extra.shortlink ? `See: ${result.extra.shortlink}` : '',
        file: originalFile ? originalFile.path : result.path,
        line: result.start.line,
        column: result.start.col,
        endLine: result.end.line,\n        endColumn: result.end.col,
        code: result.extra.lines,
        confidence: this.calculateConfidence(result),
        cwe: this.extractCWE(result.extra.metadata),
        owasp: this.extractOWASP(result.extra.metadata),
        recommendation: this.generateRecommendation(result),
        references: result.extra.references || []
      };
      
      findings.push(finding);
    }
    
    return findings;
  }
  
  /**
   * Map Semgrep severity to standardized levels
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
   * Calculate confidence score based on rule quality
   */
  calculateConfidence(result) {
    let confidence = 0.7; // Base confidence
    
    // Higher confidence for specific patterns
    if (result.check_id.includes('owasp') || result.check_id.includes('cwe')) {
      confidence += 0.2;
    }
    
    // Higher confidence for direct security rules
    if (result.check_id.includes('security') || result.check_id.includes('vuln')) {
      confidence += 0.1;
    }
    
    // Lower confidence for generic rules
    if (result.check_id.includes('generic') || result.check_id.includes('best-practice')) {
      confidence -= 0.2;
    }
    
    return Math.min(Math.max(confidence, 0.1), 1.0);
  }
  
  /**
   * Categorize vulnerability type
   */
  categorizeVulnerability(checkId) {
    const lower = checkId.toLowerCase();
    
    if (lower.includes('sql') || lower.includes('injection')) return 'sql-injection';
    if (lower.includes('xss') || lower.includes('cross-site')) return 'xss';
    if (lower.includes('csrf')) return 'csrf';
    if (lower.includes('auth') || lower.includes('session')) return 'authentication';
    if (lower.includes('crypto') || lower.includes('hash')) return 'cryptography';
    if (lower.includes('path') || lower.includes('traversal')) return 'path-traversal';
    if (lower.includes('deserial')) return 'deserialization';
    if (lower.includes('command')) return 'command-injection';
    if (lower.includes('file') || lower.includes('upload')) return 'file-upload';
    if (lower.includes('redirect')) return 'open-redirect';
    
    return 'security-misconfiguration';
  }
  
  /**
   * Extract category from check ID
   */
  extractCategory(checkId) {
    const parts = checkId.split('.');
    return parts[parts.length - 2] || 'security';
  }
  
  /**
   * Extract CWE from metadata
   */
  extractCWE(metadata) {
    if (!metadata) return null;
    
    const cweMatch = JSON.stringify(metadata).match(/CWE-(\d+)/i);
    return cweMatch ? `CWE-${cweMatch[1]}` : null;
  }
  
  /**
   * Extract OWASP category from metadata
   */
  extractOWASP(metadata) {
    if (!metadata) return null;
    
    const owaspMatch = JSON.stringify(metadata).match(/A\d{2}:\d{4}/);
    return owaspMatch ? owaspMatch[0] : null;
  }
  
  /**
   * Generate actionable recommendation
   */
  generateRecommendation(result) {
    const checkId = result.check_id.toLowerCase();
    
    if (checkId.includes('sql-injection')) {
      return 'Use parameterized queries or prepared statements to prevent SQL injection';
    }
    if (checkId.includes('xss')) {
      return 'Sanitize and encode user input before displaying in HTML';
    }
    if (checkId.includes('command-injection')) {
      return 'Avoid executing system commands with user input, use safe alternatives';
    }
    if (checkId.includes('path-traversal')) {
      return 'Validate and sanitize file paths, use Path.normalize()';
    }
    
    return result.extra.message || 'Review and address this security finding';
  }
  
  /**
   * Check if Semgrep is available
   */
  async isAvailable() {
    try {
      await execAsync('semgrep --version');
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Get Semgrep version info
   */
  async getVersion() {
    try {
      const { stdout } = await execAsync('semgrep --version');
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }
  
  /**
   * Cleanup temporary files
   */
  async cleanup() {
    try {
      await execAsync(`rm -rf "${this.tempDir}"`);
    } catch (error) {
      // Ignore cleanup errors
      console.warn(`   ⚠️ Cleanup warning: ${error.message}`);
    }
  }
  
  /**
   * Health check
   */
  async getHealth() {
    const available = await this.isAvailable();
    const version = available ? await this.getVersion() : 'Not installed';
    
    return {
      status: available ? 'healthy' : 'unavailable',
      tool: 'semgrep',
      version: version,
      capabilities: available ? [
        'Multi-language Static Analysis',
        'OWASP Top 10 Detection', 
        'CWE Classification',
        'Custom Rule Support',
        'High Confidence Scoring'
      ] : [],
      installation: available ? 'Ready' : 'pip install semgrep'
    };
  }
}

module.exports = SemgrepAnalyzer;