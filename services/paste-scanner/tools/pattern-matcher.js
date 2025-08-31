const fs = require('fs').promises;
const path = require('path');

/**
 * 🔍 Advanced Pattern Matcher
 * Sophisticated pattern matching for secrets, vulnerabilities, and security issues
 * 
 * Features:
 * - Advanced secret detection with entropy analysis
 * - Multi-language vulnerability patterns
 * - Context-aware pattern matching
 * - False positive reduction
 */
class PatternMatcher {
  constructor() {
    this.name = 'Advanced Pattern Matcher';
    this.version = '1.0.0';
    this.patternsPath = path.join(__dirname, '../patterns');
    
    // Load pattern databases
    this.secretPatterns = [];
    this.vulnerabilityPatterns = {};
    this.patternsLoaded = false;
    
    console.log(`✅ ${this.name} v${this.version} initialized`);
  }

  /**
   * Load all pattern databases
   */
  async loadPatterns() {
    try {
      // Load secret patterns
      const secretPatternsPath = path.join(this.patternsPath, 'secrets.json');
      this.secretPatterns = await this.loadJSONFile(secretPatternsPath, this.getDefaultSecretPatterns());
      
      // Load vulnerability patterns for different languages
      const languagePatterns = ['javascript', 'python', 'java', 'php', 'go'];
      for (const lang of languagePatterns) {
        const langPath = path.join(this.patternsPath, 'languages', `${lang}.json`);
        this.vulnerabilityPatterns[lang] = await this.loadJSONFile(langPath, this.getDefaultVulnPatterns(lang));
      }
      
      console.log(`   ✓ Loaded ${this.secretPatterns.length} secret patterns`);
      console.log(`   ✓ Loaded patterns for ${Object.keys(this.vulnerabilityPatterns).length} languages`);
      this.patternsLoaded = true;
      
    } catch (error) {
      console.warn('⚠️ Failed to load some patterns, using defaults:', error.message);
      this.patternsLoaded = true; // Set to true even on error so methods don't hang
    }
  }

  /**
   * Load JSON file with fallback to default
   */
  async loadJSONFile(filePath, defaultValue) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      // Create directory and file if it doesn't exist
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
  }

  /**
   * 🔐 Advanced Secret Detection
   * Uses entropy analysis and contextual patterns
   */
  async detectSecrets(code) {
    console.log('🔐 Running advanced secret detection...');
    
    // Ensure patterns are loaded
    await this.ensurePatternsLoaded();
    
    const secrets = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Skip common false positive patterns
      if (this.isLikelyFalsePositive(line)) {
        continue;
      }

      // Check each secret pattern
      for (const pattern of this.secretPatterns) {
        const matches = this.findPatternMatches(line, pattern);
        
        for (const match of matches) {
          // Additional context validation for secrets
          if (this.validateSecretInContext(match.value, pattern, lines, i)) {
            secrets.push({
              type: pattern.name,
              value: this.maskSecret(match.value),
              severity: pattern.severity,
              line: lineNumber,
              column: match.index,
              confidence: this.calculateConfidence(match.value, pattern, line),
              context: this.extractContext(lines, i, 2),
              recommendation: pattern.recommendation || 'Remove secret and use environment variables'
            });
          }
        }
      }
    }

    // Remove duplicates and sort by confidence
    const uniqueSecrets = this.deduplicateSecrets(secrets);
    console.log(`   ✓ Found ${uniqueSecrets.length} unique secrets`);
    
    return uniqueSecrets.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Ensure patterns are loaded before proceeding
   */
  async ensurePatternsLoaded() {
    if (!this.patternsLoaded) {
      await this.loadPatterns();
    }
  }

  /**
   * 🚨 Vulnerability Pattern Detection
   * Language-specific vulnerability patterns
   */
  async detectVulnerabilities(code, language) {
    console.log(`🚨 Running vulnerability detection for ${language}...`);
    
    // Ensure patterns are loaded
    await this.ensurePatternsLoaded();
    
    const vulnerabilities = [];
    const lines = code.split('\n');
    const patterns = this.vulnerabilityPatterns[language.toLowerCase()] || [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      for (const pattern of patterns) {
        const matches = this.findPatternMatches(line, pattern);
        
        for (const match of matches) {
          // Context-aware validation
          if (this.validateVulnerabilityInContext(match, pattern, lines, i)) {
            vulnerabilities.push({
              source: 'pattern-matcher',
              type: 'security-vulnerability',
              severity: pattern.severity,
              category: pattern.category,
              message: pattern.message,
              line: lineNumber,
              column: match.index,
              ruleId: pattern.id,
              confidence: this.calculateVulnConfidence(match.value, pattern, line),
              context: this.extractContext(lines, i, 2),
              recommendation: pattern.recommendation,
              cwe: pattern.cwe || null,
              owasp: pattern.owasp || null
            });
          }
        }
      }
    }

    console.log(`   ✓ Found ${vulnerabilities.length} vulnerability patterns`);
    return vulnerabilities.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Find pattern matches in text
   */
  findPatternMatches(text, pattern) {
    const matches = [];
    const regex = new RegExp(pattern.pattern, pattern.flags || 'gi');
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        value: match[0],
        groups: match.slice(1),
        index: match.index
      });
      
      // Prevent infinite loop with global regex
      if (!regex.global) break;
    }

    return matches;
  }

  /**
   * Check if line is likely a false positive
   */
  isLikelyFalsePositive(line) {
    // Skip package-lock.json hash entries
    if (line.includes('"integrity":') || line.includes('"shasum":') || 
        line.includes('"resolved":') || line.includes('"tarball":')) {
      return true;
    }
    
    // Skip common hash patterns
    if (/^[a-f0-9]{32,}$/i.test(line.trim()) || // MD5, SHA hashes
        /^[A-Za-z0-9+/=]{32,}$/.test(line.trim())) { // Base64 hashes without context
      return true;
    }
    
    // Skip minified/bundled code lines (very long with no spaces)
    if (line.length > 500 && (line.split(' ').length < 3)) {
      return true;
    }
    
    // Skip test data or mock data
    if (line.toLowerCase().includes('test') || 
        line.toLowerCase().includes('mock') ||
        line.toLowerCase().includes('example') ||
        line.toLowerCase().includes('sample')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Validate secret in context (enhanced validation)
   */
  validateSecretInContext(value, pattern, lines, lineIndex) {
    // Standard entropy check
    if (!this.validateSecretWithEntropy(value, pattern)) {
      return false;
    }
    
    const line = lines[lineIndex];
    const contextLines = this.extractContext(lines, lineIndex, 3);
    const fullContext = contextLines.join('\n').toLowerCase();
    
    // Context must suggest this is actually a secret
    const secretContextKeywords = [
      'key', 'secret', 'token', 'password', 'credential', 'auth',
      'api', 'bearer', 'access', 'jwt', 'oauth', 'session'
    ];
    
    const hasSecretContext = secretContextKeywords.some(keyword => 
      fullContext.includes(keyword)
    );
    
    // For patterns that require context, ensure it exists
    if (pattern.requiresContext && !hasSecretContext) {
      return false;
    }
    
    // Skip if it looks like package metadata
    if (fullContext.includes('package-lock.json') || 
        fullContext.includes('node_modules') ||
        fullContext.includes('integrity') ||
        fullContext.includes('dependencies')) {
      return false;
    }
    
    // Additional validation for AWS secret keys (high false positive rate)
    if (pattern.id === 'aws-secret-key') {
      // Must have surrounding context indicating it's an AWS key
      if (!hasSecretContext && !fullContext.includes('aws')) {
        return false;
      }
      
      // Skip if it looks like a hash or checksum
      if (/^[a-f0-9]+$/i.test(value) || // Hex hash
          fullContext.includes('hash') || 
          fullContext.includes('checksum') ||
          fullContext.includes('digest')) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Validate secret using entropy analysis
   */
  validateSecretWithEntropy(value, pattern) {
    // Skip entropy check for patterns that don't need it
    if (!pattern.requiresEntropy) return true;
    
    const entropy = this.calculateEntropy(value);
    const minEntropy = pattern.minEntropy || 3.0;
    
    return entropy >= minEntropy;
  }

  /**
   * Calculate Shannon entropy of a string
   */
  calculateEntropy(str) {
    const frequency = {};
    for (const char of str) {
      frequency[char] = (frequency[char] || 0) + 1;
    }

    let entropy = 0;
    const length = str.length;
    
    for (const count of Object.values(frequency)) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }

  /**
   * Validate vulnerability in context
   */
  validateVulnerabilityInContext(match, pattern, lines, lineIndex) {
    // Check for exclusion patterns (false positive reduction)
    if (pattern.excludePatterns) {
      const context = this.extractContext(lines, lineIndex, 2).join('\n');
      for (const excludePattern of pattern.excludePatterns) {
        if (new RegExp(excludePattern, 'i').test(context)) {
          return false;
        }
      }
    }

    // Check for required context patterns
    if (pattern.requirePatterns) {
      const context = this.extractContext(lines, lineIndex, 3).join('\n');
      for (const requirePattern of pattern.requirePatterns) {
        if (!new RegExp(requirePattern, 'i').test(context)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Calculate confidence score for secrets
   */
  calculateConfidence(value, pattern, context) {
    let confidence = pattern.baseConfidence || 0.7;

    // Entropy bonus
    if (pattern.requiresEntropy) {
      const entropy = this.calculateEntropy(value);
      confidence += Math.min(entropy / 6, 0.2); // Max 0.2 bonus
    }

    // Length considerations
    if (value.length >= (pattern.optimalLength || 20)) {
      confidence += 0.1;
    }

    // Context clues
    const contextLower = context.toLowerCase();
    if (['api', 'key', 'token', 'secret', 'password'].some(word => contextLower.includes(word))) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate confidence score for vulnerabilities
   */
  calculateVulnConfidence(value, pattern, context) {
    let confidence = pattern.baseConfidence || 0.8;

    // Pattern specificity bonus
    if (pattern.highSpecificity) {
      confidence += 0.1;
    }

    // Context validation bonus
    if (pattern.contextValidation) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Extract surrounding context lines
   */
  extractContext(lines, index, radius) {
    const start = Math.max(0, index - radius);
    const end = Math.min(lines.length, index + radius + 1);
    return lines.slice(start, end);
  }

  /**
   * Mask sensitive values
   */
  maskSecret(secret) {
    if (secret.length <= 8) {
      return '*'.repeat(secret.length);
    }
    
    const start = secret.substring(0, 3);
    const end = secret.substring(secret.length - 3);
    const middle = '*'.repeat(secret.length - 6);
    
    return start + middle + end;
  }

  /**
   * Remove duplicate secrets
   */
  deduplicateSecrets(secrets) {
    const seen = new Set();
    return secrets.filter(secret => {
      const key = `${secret.type}-${secret.line}-${secret.column}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Default secret patterns
   */
  getDefaultSecretPatterns() {
    return [
      {
        id: 'aws-access-key',
        name: 'AWS Access Key ID',
        pattern: 'AKIA[0-9A-Z]{16}',
        severity: 'critical',
        requiresEntropy: false,
        baseConfidence: 0.95,
        recommendation: 'Use AWS IAM roles or AWS Secrets Manager'
      },
      {
        id: 'aws-secret-key',
        name: 'AWS Secret Access Key',
        pattern: '[A-Za-z0-9/+=]{40}',
        severity: 'critical',
        requiresEntropy: true,
        minEntropy: 4.5,
        baseConfidence: 0.8,
        recommendation: 'Use AWS IAM roles or AWS Secrets Manager'
      },
      {
        id: 'github-token',
        name: 'GitHub Token',
        pattern: 'gh[ps]_[A-Za-z0-9_]{36,255}',
        severity: 'high',
        requiresEntropy: false,
        baseConfidence: 0.95,
        recommendation: 'Use GitHub Apps or environment variables'
      },
      {
        id: 'google-api-key',
        name: 'Google API Key',
        pattern: 'AIza[0-9A-Za-z\\-_]{35}',
        severity: 'high',
        requiresEntropy: false,
        baseConfidence: 0.9,
        recommendation: 'Use Google Cloud Secret Manager'
      },
      {
        id: 'slack-token',
        name: 'Slack Token',
        pattern: 'xox[baprs]-([0-9a-zA-Z]{10,48})',
        severity: 'high',
        requiresEntropy: false,
        baseConfidence: 0.9,
        recommendation: 'Use Slack App configuration or environment variables'
      },
      {
        id: 'jwt-token',
        name: 'JWT Token',
        pattern: 'eyJ[A-Za-z0-9_-]*\\.[A-Za-z0-9_-]*\\.[A-Za-z0-9_-]*',
        severity: 'medium',
        requiresEntropy: false,
        baseConfidence: 0.7,
        recommendation: 'Store JWT tokens securely and set appropriate expiration'
      },
      {
        id: 'private-key',
        name: 'Private Key',
        pattern: '-----BEGIN [A-Z ]*PRIVATE KEY-----[\\s\\S]*?-----END [A-Z ]*PRIVATE KEY-----',
        severity: 'critical',
        requiresEntropy: false,
        baseConfidence: 0.95,
        recommendation: 'Use secure key management systems'
      },
      {
        id: 'password-field',
        name: 'Password in Code',
        pattern: '(?:password|pwd|pass)[\'":=\\s]*[\'"][^\'",;\\s]{8,}[\'"]',
        severity: 'high',
        requiresEntropy: false,
        baseConfidence: 0.8,
        recommendation: 'Use environment variables or secure vaults'
      }
    ];
  }

  /**
   * Default vulnerability patterns by language
   */
  getDefaultVulnPatterns(language) {
    const patterns = {
      javascript: [
        {
          id: 'js-eval-injection',
          pattern: 'eval\\s*\\([^)]*(?:req\\.|request\\.|params\\.|query\\.)[^)]*\\)',
          message: 'Potential code injection via eval() with user input',
          severity: 'critical',
          category: 'code-injection',
          cwe: 'CWE-94',
          owasp: 'A03-Injection',
          baseConfidence: 0.9,
          recommendation: 'Never use eval() with user input. Use JSON.parse() for JSON data.'
        },
        {
          id: 'js-sql-injection',
          pattern: '(?:SELECT|INSERT|UPDATE|DELETE).*(?:\\+|\\$\\{).*(?:req\\.|request\\.|params\\.|query\\.)',
          message: 'Potential SQL injection vulnerability',
          severity: 'critical',
          category: 'sql-injection',
          cwe: 'CWE-89',
          owasp: 'A03-Injection',
          baseConfidence: 0.85,
          recommendation: 'Use parameterized queries or prepared statements'
        },
        {
          id: 'js-xss-innerHTML',
          pattern: '\\.innerHTML\\s*=.*(?:req\\.|request\\.|params\\.|query\\.)',
          message: 'Potential XSS vulnerability via innerHTML',
          severity: 'high',
          category: 'xss',
          cwe: 'CWE-79',
          owasp: 'A03-Injection',
          baseConfidence: 0.8,
          recommendation: 'Use textContent or sanitize HTML input'
        }
      ],
      python: [
        {
          id: 'py-exec-injection',
          pattern: 'exec\\s*\\([^)]*(?:request\\.|flask\\.request\\.|django\\.request\\.)[^)]*\\)',
          message: 'Potential code injection via exec() with user input',
          severity: 'critical',
          category: 'code-injection',
          cwe: 'CWE-94',
          baseConfidence: 0.9,
          recommendation: 'Never use exec() with user input'
        },
        {
          id: 'py-sql-injection',
          pattern: '(?:SELECT|INSERT|UPDATE|DELETE).*%.*(?:request\\.|flask\\.request\\.|django\\.request\\.)',
          message: 'Potential SQL injection with string formatting',
          severity: 'critical',
          category: 'sql-injection',
          cwe: 'CWE-89',
          baseConfidence: 0.85,
          recommendation: 'Use parameterized queries with your database library'
        }
      ]
    };

    return patterns[language] || [];
  }

  /**
   * Health check
   */
  async getHealth() {
    const secretCount = this.secretPatterns.length;
    const vulnCount = Object.values(this.vulnerabilityPatterns)
      .reduce((total, patterns) => total + patterns.length, 0);

    return {
      status: 'healthy',
      name: this.name,
      version: this.version,
      patterns: {
        secrets: secretCount,
        vulnerabilities: vulnCount,
        languages: Object.keys(this.vulnerabilityPatterns)
      },
      capabilities: [
        'Advanced Secret Detection',
        'Entropy Analysis',
        'Multi-language Vulnerability Detection',
        'Context-aware Pattern Matching',
        'False Positive Reduction'
      ]
    };
  }
}

module.exports = PatternMatcher;