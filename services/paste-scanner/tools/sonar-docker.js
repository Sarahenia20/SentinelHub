const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');
const crypto = require('crypto');

/**
 * 🐳 SonarQube Docker Integration
 * Works with local SonarQube running in Docker
 * Real static analysis for all languages!
 */
class SonarDocker {
  constructor() {
    this.name = 'SonarQube Docker Scanner';
    this.version = '1.0.0';
    
    // Local SonarQube configuration
    this.sonarUrl = 'http://localhost:9000';
    this.sonarToken = process.env.SONAR_TOKEN || 'admin:admin'; // Default until token is set
    this.tempDir = path.join(__dirname, '../temp/sonar-projects');
    
    // Language file extensions
    this.extensions = {
      'javascript': 'js',
      'typescript': 'ts', 
      'python': 'py',
      'java': 'java',
      'csharp': 'cs',
      'php': 'php',
      'go': 'go',
      'ruby': 'rb',
      'kotlin': 'kt',
      'scala': 'scala',
      'cpp': 'cpp',
      'c': 'c'
    };

    this.available = false;
    this.checkAvailability();
    
    console.log(`✅ ${this.name} v${this.version} initialized ${this.available ? '(Ready)' : '(Starting...)'}`);
  }

  /**
   * Check if SonarQube is available
   */
  async checkAvailability() {
    try {
      // Check if Docker SonarQube is running
      const response = await axios.get(`${this.sonarUrl}/api/system/status`, { 
        timeout: 3000,
        auth: this.getAuth()
      });
      
      this.available = response.data.status === 'UP';
      
      if (this.available) {
        console.log('   ✅ SonarQube Docker instance is running');
      }
      
    } catch (error) {
      console.log('   ⚠️ SonarQube not available - start with: npm run start:sonar');
      this.available = false;
    }
  }

  /**
   * Get authentication for API calls
   */
  getAuth() {
    if (this.sonarToken.includes(':')) {
      const [username, password] = this.sonarToken.split(':');
      return { username, password };
    } else {
      return { username: this.sonarToken, password: '' };
    }
  }

  /**
   * Analyze code with real SonarQube
   */
  async scan(code, language, options = {}) {
    if (!this.available) {
      await this.checkAvailability();
      if (!this.available) {
        return this.getUnavailableResult();
      }
    }

    try {
      console.log(`🔍 Running SonarQube Docker analysis for ${language}...`);
      
      const projectKey = `paste-scan-${crypto.randomUUID().slice(0, 8)}`;
      
      // 1. Create project in SonarQube
      await this.createProject(projectKey);
      
      // 2. Create temporary project files
      const projectPath = await this.createTempProject(projectKey, code, language);
      
      // 3. Run SonarScanner
      const scanResult = await this.runSonarScanner(projectPath, projectKey);
      
      if (scanResult.success) {
        // 4. Get analysis results via API
        const analysis = await this.fetchAnalysisResults(projectKey);
        
        // 5. Cleanup
        await this.cleanup(projectPath, projectKey);
        
        return analysis;
      } else {
        throw new Error(scanResult.error || 'SonarScanner failed');
      }

    } catch (error) {
      console.error(`❌ SonarQube analysis failed:`, error.message);
      return this.getErrorResult(error.message);
    }
  }

  /**
   * Create project in SonarQube
   */
  async createProject(projectKey) {
    try {
      await axios.post(
        `${this.sonarUrl}/api/projects/create`,
        new URLSearchParams({
          project: projectKey,
          name: `Paste Analysis ${projectKey}`,
          visibility: 'private'
        }),
        { 
          auth: this.getAuth(),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );
    } catch (error) {
      // Project might already exist, that's OK
      if (!error.response?.data?.errors?.some(e => e.msg.includes('already exists'))) {
        throw error;
      }
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
    const sourceFile = path.join(projectPath, `source.${extension}`);
    await fs.writeFile(sourceFile, code);
    
    // Create sonar-project.properties
    const props = [
      `sonar.projectKey=${projectKey}`,
      `sonar.projectName=Paste Analysis ${projectKey}`,
      `sonar.projectVersion=1.0`,
      `sonar.sources=.`,
      `sonar.sourceEncoding=UTF-8`,
      `sonar.host.url=${this.sonarUrl}`,
      `sonar.login=${this.sonarToken}`
    ];

    await fs.writeFile(
      path.join(projectPath, 'sonar-project.properties'), 
      props.join('\\n')
    );
    
    return projectPath;
  }

  /**
   * Run SonarScanner
   */
  async runSonarScanner(projectPath, projectKey) {
    try {
      // Check if sonar-scanner is available
      let scannerCommand;
      try {
        execSync('sonar-scanner --version', { stdio: 'pipe' });
        scannerCommand = 'sonar-scanner';
      } catch {
        try {
          execSync('docker run --rm -v "$(pwd):/usr/src" sonarqube/sonar-scanner-cli --version', { stdio: 'pipe' });
          scannerCommand = `docker run --rm --network host -v "${projectPath}:/usr/src" sonarqube/sonar-scanner-cli`;
        } catch {
          throw new Error('Neither sonar-scanner CLI nor Docker scanner available');
        }
      }
      
      console.log('   📊 Running SonarScanner...');
      
      execSync(scannerCommand, {
        cwd: projectPath,
        stdio: 'pipe',
        timeout: 30000 // 30 second timeout
      });

      return { success: true };
      
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Fetch analysis results from SonarQube API
   */
  async fetchAnalysisResults(projectKey) {
    try {
      // Wait for analysis to complete
      await this.waitForAnalysis(projectKey);
      
      // Fetch issues
      const issuesResponse = await axios.get(
        `${this.sonarUrl}/api/issues/search`,
        {
          params: {
            componentKeys: projectKey,
            types: 'VULNERABILITY,CODE_SMELL,BUG,SECURITY_HOTSPOT'
          },
          auth: this.getAuth()
        }
      );

      // Fetch measures
      const measuresResponse = await axios.get(
        `${this.sonarUrl}/api/measures/component`,
        {
          params: {
            component: projectKey,
            metricKeys: 'reliability_rating,security_rating,maintainability_rating,coverage,duplicated_lines_density,ncloc'
          },
          auth: this.getAuth()
        }
      );

      return this.processResults(issuesResponse.data, measuresResponse.data);

    } catch (error) {
      console.error('Failed to fetch SonarQube results:', error.message);
      return this.getErrorResult('Failed to fetch results from SonarQube');
    }
  }

  /**
   * Wait for analysis to complete
   */
  async waitForAnalysis(projectKey, maxWait = 20000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      try {
        const response = await axios.get(
          `${this.sonarUrl}/api/ce/activity`,
          {
            params: { component: projectKey },
            auth: this.getAuth()
          }
        );

        const tasks = response.data.tasks || [];
        const latestTask = tasks[0];

        if (latestTask && latestTask.status === 'SUCCESS') {
          console.log('   ✅ Analysis completed');
          return;
        }

        if (latestTask && latestTask.status === 'FAILED') {
          throw new Error('SonarQube analysis failed');
        }

        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
      } catch (error) {
        if (Date.now() - startTime > maxWait / 2) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('   ⏱️ Analysis timeout, fetching partial results...');
  }

  /**
   * Process SonarQube results
   */
  processResults(issuesData, measuresData) {
    const issues = issuesData.issues || [];
    
    const vulnerabilities = issues
      .filter(issue => issue.type === 'VULNERABILITY' || issue.type === 'SECURITY_HOTSPOT')
      .map(issue => ({
        source: 'sonarqube',
        type: 'security-vulnerability',
        severity: this.mapSeverity(issue.severity),
        rule: issue.rule,
        message: issue.message,
        line: issue.textRange?.startLine || 1,
        column: issue.textRange?.startOffset || 1,
        recommendation: `Fix SonarQube rule: ${issue.rule}`
      }));

    const codeQuality = issues
      .filter(issue => issue.type === 'CODE_SMELL' || issue.type === 'BUG')
      .map(issue => ({
        source: 'sonarqube',
        type: 'code-quality',
        severity: this.mapSeverity(issue.severity),
        rule: issue.rule,
        message: issue.message,
        line: issue.textRange?.startLine || 1,
        column: issue.textRange?.startOffset || 1,
        category: issue.type.toLowerCase().replace('_', '-')
      }));

    // Process metrics
    const metrics = {};
    if (measuresData.component && measuresData.component.measures) {
      measuresData.component.measures.forEach(measure => {
        metrics[measure.metric] = measure.value;
      });
    }

    return {
      success: true,
      issues: [...vulnerabilities, ...codeQuality],
      summary: {
        totalIssues: issues.length,
        vulnerabilities: vulnerabilities.length,
        codeQuality: codeQuality.length,
        linesOfCode: parseInt(metrics.ncloc) || 0
      },
      metrics
    };
  }

  /**
   * Map SonarQube severity to our levels
   */
  mapSeverity(sonarSeverity) {
    const mapping = {
      'BLOCKER': 'critical',
      'CRITICAL': 'critical', 
      'MAJOR': 'high',
      'MINOR': 'medium',
      'INFO': 'low'
    };
    return mapping[sonarSeverity] || 'medium';
  }

  /**
   * Cleanup temporary files and project
   */
  async cleanup(projectPath, projectKey) {
    try {
      // Remove temp files
      await fs.rm(projectPath, { recursive: true, force: true });
      
      // Delete project from SonarQube (optional, for cleanup)
      try {
        await axios.post(
          `${this.sonarUrl}/api/projects/delete`,
          new URLSearchParams({ project: projectKey }),
          { 
            auth: this.getAuth(),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          }
        );
      } catch (error) {
        // Ignore project deletion errors
      }
      
    } catch (error) {
      console.warn('Cleanup failed:', error.message);
    }
  }

  /**
   * Result when SonarQube unavailable
   */
  getUnavailableResult() {
    return {
      success: false,
      unavailable: true,
      issues: [],
      message: 'SonarQube Docker not running',
      setup: 'Run: npm run start:sonar'
    };
  }

  /**
   * Error result
   */
  getErrorResult(message) {
    return {
      success: false,
      issues: [],
      error: message
    };
  }

  /**
   * Health check
   */
  async getHealth() {
    await this.checkAvailability();
    
    return {
      status: this.available ? 'healthy' : 'unavailable',
      name: this.name,
      version: this.version,
      dockerUrl: this.sonarUrl,
      available: this.available,
      capabilities: this.available ? [
        'Professional Static Code Analysis',
        'Multi-language Support (25+ languages)',
        'Security Vulnerability Detection',
        'Code Smell Detection',
        'Technical Debt Calculation',
        'Quality Gate Evaluation',
        'Real SonarQube Rules Engine'
      ] : [
        'Start SonarQube: npm run start:sonar',
        'Login: http://localhost:9000 (admin/admin)',
        'Set token: SONAR_TOKEN environment variable'
      ]
    };
  }
}

module.exports = SonarDocker;