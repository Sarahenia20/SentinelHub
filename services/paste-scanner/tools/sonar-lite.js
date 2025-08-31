const fs = require('fs').promises;
const path = require('path');
const { execSync, exec } = require('child_process');
const crypto = require('crypto');

/**
 * 🔍 SonarQube Lite Scanner
 * Simple, lightweight SonarCloud integration for paste scanning
 * 
 * Setup:
 * 1. npm install -g sonar-scanner
 * 2. Sign up for SonarCloud.io (FREE)
 * 3. Set SONAR_TOKEN environment variable
 * 4. Ready to scan!
 */
class SonarLite {
  constructor() {
    this.name = 'SonarQube Scanner';
    this.version = '1.0.0';
    
    // Configuration - falls back gracefully
    this.sonarToken = process.env.SONAR_TOKEN;
    this.sonarUrl = 'https://sonarcloud.io';
    this.organization = process.env.SONAR_ORGANIZATION || 'sentinelhub';
    this.tempDir = path.join(__dirname, '../temp');
    
    // Language extensions
    this.extensions = {
      'javascript': 'js', 'typescript': 'ts', 'python': 'py', 
      'java': 'java', 'csharp': 'cs', 'php': 'php', 'go': 'go',
      'ruby': 'rb', 'kotlin': 'kt', 'cpp': 'cpp', 'c': 'c'
    };

    // Check availability
    this.available = this.checkSetup();
    
    console.log(`✅ ${this.name} v${this.version} initialized ${this.available ? '(Ready)' : '(Fallback Mode)'}`);
  }

  /**
   * Quick setup check
   */
  checkSetup() {
    try {
      // Check if sonar-scanner exists
      execSync('sonar-scanner --version', { stdio: 'pipe' });
      return true; // Even without token, we can try
    } catch (error) {
      console.log('⚠️ sonar-scanner not found - install with: npm install -g sonar-scanner');
      return false;
    }
  }

  /**
   * Lightweight scan - creates temp project and analyzes
   */
  async scan(code, language, options = {}) {
    if (!this.available) {
      return this.getFallbackResult(language);
    }

    try {
      console.log(`🔍 Running SonarQube analysis for ${language}...`);
      
      const scanId = crypto.randomUUID().slice(0, 8);
      const projectKey = `paste-${scanId}`;
      
      // Create temp project
      const projectPath = await this.createTempProject(projectKey, code, language);
      
      // Run scanner (with timeout)
      const result = await this.runQuickScan(projectPath, projectKey);
      
      // Cleanup
      this.cleanup(projectPath);
      
      return result;

    } catch (error) {
      console.warn(`⚠️ SonarQube scan failed: ${error.message}`);
      return this.getFallbackResult(language);
    }
  }

  /**
   * Create temporary project structure
   */
  async createTempProject(projectKey, code, language) {
    const projectPath = path.join(this.tempDir, projectKey);
    await fs.mkdir(projectPath, { recursive: true });
    
    // Write source file
    const extension = this.extensions[language.toLowerCase()] || 'txt';
    const sourceFile = path.join(projectPath, `main.${extension}`);
    await fs.writeFile(sourceFile, code);
    
    // Create minimal sonar-project.properties
    const props = [
      `sonar.projectKey=${projectKey}`,
      `sonar.projectName=Paste Analysis`,
      `sonar.projectVersion=1.0`,
      `sonar.sources=.`,
      `sonar.sourceEncoding=UTF-8`,
      `sonar.scm.disabled=true`,
      `sonar.import_unknown_files=true`
    ];

    // Add organization for SonarCloud
    if (this.sonarToken) {
      props.push(`sonar.organization=${this.organization}`);
    }

    await fs.writeFile(
      path.join(projectPath, 'sonar-project.properties'), 
      props.join('\\n')
    );
    
    return projectPath;
  }

  /**
   * Run scanner with timeout (quick analysis)
   */
  async runQuickScan(projectPath, projectKey) {
    return new Promise((resolve) => {
      const env = {
        ...process.env,
        SONAR_TOKEN: this.sonarToken || '',
        SONAR_HOST_URL: this.sonarUrl
      };

      // 15 second timeout for paste scanning
      const child = exec(
        'sonar-scanner -Dsonar.analysis.mode=preview', 
        { cwd: projectPath, env, timeout: 15000 },
        (error, stdout, stderr) => {
          // Parse output for issues (even if command fails)
          const result = this.parseOutput(stdout + stderr, projectKey);
          resolve(result);
        }
      );

      // Kill after timeout
      setTimeout(() => {
        child.kill('SIGTERM');
        resolve(this.getTimeoutResult());
      }, 15000);
    });
  }

  /**
   * Parse SonarScanner output for issues
   */
  parseOutput(output, projectKey) {
    const issues = [];
    const lines = output.split('\\n');
    
    let foundIssues = false;
    for (const line of lines) {
      // Look for issue patterns in output
      if (line.includes('INFO:') && (line.includes('issue') || line.includes('vulnerability') || line.includes('bug'))) {
        foundIssues = true;
        
        // Extract basic info
        const severity = line.includes('CRITICAL') ? 'critical' :
                        line.includes('MAJOR') ? 'high' :
                        line.includes('MINOR') ? 'medium' : 'low';
        
        issues.push({
          id: `sonar-${issues.length}`,
          source: 'sonarqube',
          type: 'code-quality',
          severity: severity,
          message: this.extractMessage(line),
          line: this.extractLineNumber(line) || 1,
          recommendation: 'Review SonarQube suggestions for code quality improvements'
        });
      }
    }

    // Success indicators
    const success = output.includes('EXECUTION SUCCESS') || foundIssues;
    
    return {
      success,
      projectKey,
      issues,
      summary: {
        totalIssues: issues.length,
        analysisComplete: success
      },
      rawOutput: foundIssues ? '' : output // Only show raw if no structured data
    };
  }

  extractMessage(line) {
    // Simple message extraction
    if (line.includes(':')) {
      const parts = line.split(':');
      return parts[parts.length - 1].trim();
    }
    return line.trim();
  }

  extractLineNumber(line) {
    const lineMatch = line.match(/line[s]?\\s*(\\d+)/i);
    return lineMatch ? parseInt(lineMatch[1]) : null;
  }

  /**
   * Fallback result when SonarQube unavailable
   */
  getFallbackResult(language) {
    return {
      success: false,
      unavailable: true,
      issues: [],
      message: `SonarQube analysis unavailable for ${language}`,
      setup: {
        install: 'npm install -g sonar-scanner',
        signup: 'Create free account at sonarcloud.io',
        token: 'Set SONAR_TOKEN environment variable'
      }
    };
  }

  getTimeoutResult() {
    return {
      success: false,
      timeout: true,
      issues: [],
      message: 'SonarQube analysis timed out (15s limit for paste scanning)'
    };
  }

  /**
   * Cleanup temp files
   */
  cleanup(projectPath) {
    fs.rm(projectPath, { recursive: true, force: true }).catch(() => {
      // Ignore cleanup errors
    });
  }

  /**
   * Health check
   */
  async getHealth() {
    return {
      status: this.available ? 'healthy' : 'setup-required',
      name: this.name,
      version: this.version,
      setup: {
        scannerInstalled: this.available,
        tokenConfigured: !!this.sonarToken,
        organization: this.organization
      },
      capabilities: this.available ? [
        'Multi-language Static Analysis',
        'Code Quality Assessment', 
        'Technical Debt Calculation',
        'Best Practices Enforcement',
        '25+ Programming Languages'
      ] : [
        'Install: npm install -g sonar-scanner',
        'Signup: https://sonarcloud.io (FREE)',
        'Config: Set SONAR_TOKEN environment variable'
      ]
    };
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return Object.keys(this.extensions);
  }
}

module.exports = SonarLite;