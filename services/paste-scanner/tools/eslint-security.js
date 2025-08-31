const { ESLint } = require('eslint');

/**
 * 🔧 ESLint Security Tool
 * Advanced ESLint configuration for security scanning
 * 
 * References:
 * - ESLint: https://github.com/eslint/eslint
 * - eslint-plugin-security: https://github.com/eslint-community/eslint-plugin-security
 * - eslint-plugin-sonarjs: https://github.com/SonarSource/eslint-plugin-sonarjs
 */
class ESLintSecurityTool {
  constructor() {
    this.name = 'ESLint Security Scanner';
    this.version = '1.0.0';
    
    // Security-focused ESLint configuration
    this.securityConfig = {
      env: {
        browser: true,
        node: true,
        es2021: true
      },
      plugins: ['security', 'sonarjs'],
      rules: {
        // 🚨 Critical Security Rules
        'security/detect-object-injection': 'error',
        'security/detect-unsafe-regex': 'error',
        'security/detect-buffer-noassert': 'error',
        'security/detect-child-process': 'error',
        'security/detect-eval-with-expression': 'error',
        'security/detect-pseudoRandomBytes': 'error',
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        
        // ⚠️ High Priority Security Rules
        'security/detect-non-literal-regexp': 'warn',
        'security/detect-disable-mustache-escape': 'error',
        'security/detect-no-csrf-before-method-override': 'error',
        'security/detect-non-literal-fs-filename': 'warn',
        'security/detect-non-literal-require': 'warn',
        'security/detect-possible-timing-attacks': 'warn',
        
        // 🔍 Code Quality & Security (SonarJS)
        'sonarjs/no-identical-functions': 'warn',
        'sonarjs/cognitive-complexity': ['warn', 15],
        'sonarjs/no-duplicate-string': 'warn',
        'sonarjs/no-duplicated-branches': 'error',
        'sonarjs/no-all-duplicated-branches': 'error',
        'sonarjs/no-element-overwrite': 'error',
        'sonarjs/no-empty-collection': 'error',
        'sonarjs/no-extra-arguments': 'error',
        'sonarjs/no-identical-conditions': 'error',
        'sonarjs/no-identical-expressions': 'error',
        'sonarjs/no-ignored-return': 'error',
        'sonarjs/no-one-iteration-loop': 'error',
        'sonarjs/no-use-of-empty-return-value': 'error',
        'sonarjs/non-existent-operator': 'error',
        
        // 📝 Additional Security Best Practices
        'no-script-url': 'error',
        'no-alert': 'warn',
        'no-console': 'warn',
        'strict': 'error'
      }
    };

    console.log(`✅ ${this.name} v${this.version} initialized`);
  }

  /**
   * Scan code for security vulnerabilities and code quality issues
   * @param {string} code - Code to scan
   * @param {Object} options - Scanning options
   * @returns {Object} Scan results
   */
  async scan(code, options = {}) {
    try {
      console.log(`🔧 Running ${this.name}...`);
      
      // Create a simplified config without plugins for now
      const config = {
        env: {
          browser: true,
          node: true,
          es2021: true
        },
        rules: {
          // Core security rules that don't require plugins
          'no-eval': 'error',
          'no-implied-eval': 'error',
          'no-new-func': 'error',
          'no-script-url': 'error',
          'no-alert': 'warn',
          'no-console': 'warn',
          'strict': 'error'
        }
      };
      
      const eslint = new ESLint({
        useEslintrc: false,
        overrideConfig: config
      });

      const results = await eslint.lintText(code, {
        filePath: `temp.${this.getFileExtension(options.language)}`
      });

      const messages = results[0]?.messages || [];
      
      return this.processResults(messages);
      
    } catch (error) {
      console.error(`❌ ${this.name} failed:`, error);
      return {
        vulnerabilities: [],
        codeQuality: [],
        error: error.message
      };
    }
  }

  /**
   * Process ESLint results into categorized findings
   */
  processResults(messages) {
    const vulnerabilities = [];
    const codeQuality = [];

    messages.forEach(msg => {
      const finding = {
        source: 'eslint',
        line: msg.line,
        column: msg.column,
        message: msg.message,
        ruleId: msg.ruleId,
        severity: this.mapSeverity(msg.severity),
        category: this.categorizeRule(msg.ruleId)
      };

      // Separate security vulnerabilities from code quality issues
      if (this.isSecurityRule(msg.ruleId)) {
        vulnerabilities.push({
          ...finding,
          type: 'security-vulnerability',
          recommendation: this.getSecurityRecommendation(msg.ruleId)
        });
      } else {
        codeQuality.push({
          ...finding,
          type: 'code-quality',
          recommendation: this.getQualityRecommendation(msg.ruleId)
        });
      }
    });

    console.log(`   ✓ Processed ${vulnerabilities.length} security findings`);
    console.log(`   ✓ Processed ${codeQuality.length} quality findings`);

    return {
      vulnerabilities,
      codeQuality,
      summary: {
        totalIssues: messages.length,
        securityIssues: vulnerabilities.length,
        qualityIssues: codeQuality.length
      }
    };
  }

  /**
   * Map ESLint severity to our severity levels
   */
  mapSeverity(eslintSeverity) {
    switch (eslintSeverity) {
      case 2: return 'high';
      case 1: return 'medium';
      default: return 'info';
    }
  }

  /**
   * Determine if a rule is security-related
   */
  isSecurityRule(ruleId) {
    const securityRules = [
      'security/', 'no-eval', 'no-implied-eval', 'no-new-func', 
      'no-script-url', 'sonarjs/no-duplicated-branches',
      'sonarjs/no-element-overwrite', 'sonarjs/non-existent-operator'
    ];
    
    return securityRules.some(rule => ruleId?.startsWith(rule));
  }

  /**
   * Categorize rules by type
   */
  categorizeRule(ruleId) {
    if (!ruleId) return 'unknown';
    
    if (ruleId.startsWith('security/')) return 'security';
    if (ruleId.startsWith('sonarjs/')) return 'code-quality';
    if (['no-eval', 'no-implied-eval', 'no-new-func'].includes(ruleId)) return 'security';
    
    return 'general';
  }

  /**
   * Get security-specific recommendations
   */
  getSecurityRecommendation(ruleId) {
    const recommendations = {
      'security/detect-object-injection': 'Validate object keys to prevent prototype pollution',
      'security/detect-unsafe-regex': 'Review regex patterns for ReDoS vulnerabilities',
      'security/detect-eval-with-expression': 'Replace eval() with safer alternatives like JSON.parse()',
      'security/detect-child-process': 'Validate and sanitize all inputs to child processes',
      'security/detect-non-literal-fs-filename': 'Use path.resolve() and validate file paths',
      'no-eval': 'Replace eval() with JSON.parse() or Function constructor alternatives',
      'no-implied-eval': 'Avoid setTimeout/setInterval with string arguments',
      'no-new-func': 'Use regular functions instead of Function constructor'
    };
    
    return recommendations[ruleId] || 'Follow security best practices for this rule';
  }

  /**
   * Get code quality recommendations
   */
  getQualityRecommendation(ruleId) {
    const recommendations = {
      'sonarjs/cognitive-complexity': 'Break down complex functions into smaller, more manageable pieces',
      'sonarjs/no-duplicate-string': 'Extract repeated strings into constants',
      'sonarjs/no-identical-functions': 'Extract common logic into shared functions',
      'sonarjs/no-duplicated-branches': 'Merge identical conditional branches'
    };
    
    return recommendations[ruleId] || 'Improve code quality according to best practices';
  }

  /**
   * Get file extension based on language
   */
  getFileExtension(language) {
    const extensions = {
      'javascript': 'js',
      'typescript': 'ts',
      'jsx': 'jsx',
      'tsx': 'tsx'
    };
    
    return extensions[language?.toLowerCase()] || 'js';
  }

  /**
   * Health check for the tool
   */
  async getHealth() {
    try {
      const eslint = new ESLint({ useEslintrc: false });
      await eslint.lintText('const test = 1;');
      
      return {
        status: 'healthy',
        name: this.name,
        version: this.version,
        capabilities: [
          'JavaScript/TypeScript Security Scanning',
          'Code Quality Analysis',
          'Best Practice Enforcement',
          'Security Rule Detection'
        ]
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = ESLintSecurityTool;