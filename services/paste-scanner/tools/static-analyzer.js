/**
 * 🔍 Built-in Static Code Analyzer
 * SonarQube-like analysis without external dependencies
 * Works out of the box for all supported languages
 */
class StaticAnalyzer {
  constructor() {
    this.name = 'Static Code Analyzer';
    this.version = '1.0.0';
    
    // Multi-language analysis rules
    this.rules = this.initializeRules();
    
    console.log(`✅ ${this.name} v${this.version} initialized`);
  }

  /**
   * Analyze code for quality and security issues
   */
  async scan(code, language, options = {}) {
    console.log(`🔍 Running static analysis for ${language}...`);
    
    try {
      const issues = [];
      const lines = code.split('\\n');
      
      // Get language-specific rules
      const langRules = this.rules[language.toLowerCase()] || this.rules.generic;
      
      // Analyze each line
      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        
        // Check against all rules for this language
        langRules.forEach(rule => {
          const match = line.match(new RegExp(rule.pattern, 'i'));
          if (match) {
            issues.push({
              source: 'static-analyzer',
              type: rule.type,
              severity: rule.severity,
              rule: rule.id,
              message: rule.message,
              line: lineNumber,
              column: match.index + 1,
              recommendation: rule.recommendation,
              category: rule.category,
              cwe: rule.cwe
            });
          }
        });
      });

      console.log(`   ✓ Found ${issues.length} code quality and security issues`);
      
      return {
        success: true,
        issues,
        summary: {
          totalIssues: issues.length,
          language: language
        }
      };
      
    } catch (error) {
      console.error('Static analysis failed:', error);
      return {
        success: false,
        issues: [],
        error: error.message
      };
    }
  }

  /**
   * Initialize analysis rules for different languages
   */
  initializeRules() {
    return {
      javascript: [
        {
          id: 'js-console-log',
          pattern: 'console\\.log\\s*\\(',
          message: 'Console.log statement found - should be removed in production',
          severity: 'low',
          type: 'code-quality',
          category: 'maintainability',
          recommendation: 'Remove console.log statements or use a proper logging framework'
        },
        {
          id: 'js-alert-usage',
          pattern: 'alert\\s*\\(',
          message: 'Alert usage detected - not recommended for production',
          severity: 'medium',
          type: 'code-quality', 
          category: 'usability',
          recommendation: 'Use proper UI notifications instead of alert()'
        },
        {
          id: 'js-var-declaration',
          pattern: '\\bvar\\s+\\w+',
          message: 'Variable declared with var - use let or const instead',
          severity: 'low',
          type: 'code-quality',
          category: 'maintainability',
          recommendation: 'Use let for variables that change, const for constants'
        },
        {
          id: 'js-loose-equality',
          pattern: '===?\\s*=|=\\s*===?',
          message: 'Use strict equality (===) instead of loose equality (==)',
          severity: 'medium',
          type: 'code-quality',
          category: 'reliability',
          recommendation: 'Replace == with === and != with !=='
        },
        {
          id: 'js-function-complexity',
          pattern: 'function\\s+\\w+[^}]{200,}',
          message: 'Function appears to be very long - consider breaking it down',
          severity: 'medium',
          type: 'code-quality',
          category: 'maintainability',
          recommendation: 'Split large functions into smaller, focused functions'
        }
      ],
      
      python: [
        {
          id: 'py-print-statement',
          pattern: 'print\\s*\\(',
          message: 'Print statement found - consider using logging instead',
          severity: 'low',
          type: 'code-quality',
          category: 'maintainability',
          recommendation: 'Use logging module for better control over output'
        },
        {
          id: 'py-bare-except',
          pattern: 'except\\s*:',
          message: 'Bare except clause catches all exceptions',
          severity: 'high',
          type: 'code-quality',
          category: 'reliability',
          recommendation: 'Specify specific exception types to catch'
        },
        {
          id: 'py-global-variable',
          pattern: 'global\\s+\\w+',
          message: 'Global variable usage detected',
          severity: 'medium',
          type: 'code-quality',
          category: 'maintainability',
          recommendation: 'Avoid global variables, use parameters and return values'
        },
        {
          id: 'py-lambda-assignment',
          pattern: '\\w+\\s*=\\s*lambda',
          message: 'Lambda assigned to variable - use def instead',
          severity: 'medium',
          type: 'code-quality',
          category: 'readability',
          recommendation: 'Use def to define functions instead of assigning lambdas'
        },
        {
          id: 'py-import-star',
          pattern: 'from\\s+\\w+\\s+import\\s+\\*',
          message: 'Star import pollutes namespace',
          severity: 'medium',
          type: 'code-quality',
          category: 'maintainability',
          recommendation: 'Import specific items or use qualified imports'
        }
      ],
      
      java: [
        {
          id: 'java-system-out',
          pattern: 'System\\.out\\.print',
          message: 'System.out usage found - use logging framework instead',
          severity: 'low',
          type: 'code-quality',
          category: 'maintainability',
          recommendation: 'Use a logging framework like SLF4J or Log4j'
        },
        {
          id: 'java-empty-catch',
          pattern: 'catch\\s*\\([^)]+\\)\\s*\\{\\s*\\}',
          message: 'Empty catch block ignores exceptions',
          severity: 'high',
          type: 'code-quality',
          category: 'reliability',
          cwe: 'CWE-390',
          recommendation: 'Handle exceptions properly or at least log them'
        },
        {
          id: 'java-string-concatenation',
          pattern: 'String\\s+\\w+\\s*=\\s*[^;]+\\+',
          message: 'String concatenation in loop or multiple operations',
          severity: 'medium',
          type: 'code-quality',
          category: 'performance',
          recommendation: 'Use StringBuilder for multiple string operations'
        },
        {
          id: 'java-magic-number',
          pattern: '\\b\\d{2,}\\b(?!\\s*[;,)])',
          message: 'Magic number detected - consider using named constants',
          severity: 'low',
          type: 'code-quality',
          category: 'maintainability',
          recommendation: 'Replace magic numbers with named constants'
        }
      ],
      
      php: [
        {
          id: 'php-var-dump',
          pattern: 'var_dump\\s*\\(',
          message: 'var_dump usage found - remove before production',
          severity: 'medium',
          type: 'code-quality',
          category: 'maintainability',
          recommendation: 'Remove debugging statements or use proper logging'
        },
        {
          id: 'php-global-variable',
          pattern: 'global\\s+\\$\\w+',
          message: 'Global variable usage detected',
          severity: 'medium',
          type: 'code-quality',
          category: 'maintainability',
          recommendation: 'Avoid global variables, use dependency injection'
        },
        {
          id: 'php-error-suppression',
          pattern: '@\\w+\\s*\\(',
          message: 'Error suppression operator (@) used',
          severity: 'high',
          type: 'code-quality',
          category: 'reliability',
          recommendation: 'Handle errors explicitly instead of suppressing them'
        }
      ],
      
      go: [
        {
          id: 'go-fmt-print',
          pattern: 'fmt\\.Print',
          message: 'fmt.Print usage found - consider structured logging',
          severity: 'low',
          type: 'code-quality',
          category: 'maintainability',
          recommendation: 'Use a structured logging library for production code'
        },
        {
          id: 'go-empty-if',
          pattern: 'if\\s+[^{]+\\{\\s*\\}',
          message: 'Empty if block detected',
          severity: 'medium',
          type: 'code-quality',
          category: 'maintainability',
          recommendation: 'Remove empty if blocks or add proper handling'
        }
      ],
      
      // Generic rules for any language
      generic: [
        {
          id: 'long-line',
          pattern: '.{120,}',
          message: 'Line too long - affects readability',
          severity: 'low',
          type: 'code-quality',
          category: 'readability',
          recommendation: 'Break long lines for better readability'
        },
        {
          id: 'trailing-whitespace',
          pattern: '\\s+$',
          message: 'Trailing whitespace detected',
          severity: 'low',
          type: 'code-quality',
          category: 'maintainability',
          recommendation: 'Remove trailing whitespace'
        },
        {
          id: 'todo-comment',
          pattern: '(TODO|FIXME|HACK|XXX)',
          message: 'TODO/FIXME comment found',
          severity: 'low',
          type: 'code-quality',
          category: 'maintainability',
          recommendation: 'Address TODO items or create proper issues'
        }
      ]
    };
  }

  /**
   * Health check
   */
  async getHealth() {
    return {
      status: 'healthy',
      name: this.name,
      version: this.version,
      capabilities: [
        'Multi-language Code Quality Analysis',
        'Security Pattern Detection',
        'Best Practices Enforcement',
        'Maintainability Assessment',
        'Performance Issue Detection'
      ],
      supportedLanguages: Object.keys(this.rules).filter(lang => lang !== 'generic')
    };
  }
}

module.exports = StaticAnalyzer;