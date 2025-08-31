const ESLintSecurityTool = require('./tools/eslint-security');
const PatternMatcher = require('./tools/pattern-matcher');
const CVELookup = require('./tools/cve-lookup');
const GitHubAdvisory = require('./tools/github-advisory');
const SonarDocker = require('./tools/sonar-docker');
const SimpleReportGenerator = require('./tools/simple-report-generator');

// Real API-based security tools
const SemgrepScanner = require('./tools/semgrep-scanner');
const TruffleHogScanner = require('./tools/trufflehog-scanner');
const crypto = require('crypto');

/**
 * 🎯 Milestone 1: Beautiful Paste Scanner
 * Complete ecosystem with dedicated tools and APIs
 * 
 * Features:
 * - ESLint security scanning with custom rules
 * - Advanced pattern matching for secrets & vulnerabilities
 * - CVE database lookup for known vulnerabilities
 * - GitHub Security Advisory integration
 * - Beautiful report generation with actionable insights
 */
class PasteScanner {
  constructor() {
    this.tools = {
      eslint: new ESLintSecurityTool(),
      patterns: new PatternMatcher(),
      cve: new CVELookup(),
      advisory: new GitHubAdvisory(),
      sonar: new SonarDocker(),
      reporter: new SimpleReportGenerator(),
      // Real API-based security scanners
      semgrep: new SemgrepScanner(),
      trufflehog: new TruffleHogScanner()
    };
    
    console.log('🚀 PasteScanner initialized with all tools including real APIs');
  }

  /**
   * Main scanning orchestrator
   * @param {string} code - Code to scan
   * @param {string} language - Programming language
   * @param {Object} options - Scanning options
   * @returns {Object} Beautiful comprehensive scan results
   */
  async scanCode(code, language = 'javascript', options = {}) {
    const scanId = crypto.randomUUID();
    const startTime = Date.now();

    console.log(`🔍 Starting scan ${scanId} for ${language} code`);

    const scanSession = {
      scanId,
      language,
      timestamp: new Date().toISOString(),
      options,
      results: {
        vulnerabilities: [],
        secrets: [],
        codeQuality: [],
        cveMatches: [],
        advisories: []
      },
      metrics: {
        linesOfCode: code.split('\n').length,
        characters: code.length,
        scanDuration: 0
      },
      summary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      }
    };

    try {
      // 🔧 Phase 1: Static Analysis
      await this.runStaticAnalysis(code, language, scanSession);
      
      // 🔍 Phase 2: Pattern Analysis
      await this.runPatternAnalysis(code, language, scanSession);
      
      // 🌐 Phase 3: External Intelligence
      await this.runExternalIntelligence(scanSession);
      
      // 🛡️ Phase 4: Real Security API Scanning
      await this.runRealSecurityScanning(code, language, scanSession);
      
      // 🔍 Phase 5: SonarQube Analysis (if available)
      await this.runSonarAnalysis(code, language, scanSession);
      
      // Update summary counts
      this.updateSummaryFromResults(scanSession);
      
      // 📊 Phase 6: Generate Beautiful Report  
      const report = await this.tools.reporter.generateReport(scanSession);
      
      scanSession.metrics.scanDuration = Date.now() - startTime;
      
      console.log(`✅ Scan ${scanId} completed in ${scanSession.metrics.scanDuration}ms`);
      
      // Calculate total issues for summary
      const totalIssues = Object.values(scanSession.summary).reduce((sum, count) => sum + count, 0);
      scanSession.summary.totalIssues = totalIssues;
      
      // Log comprehensive results
      console.log(`📊 Final Results:`);
      console.log(`   - Vulnerabilities: ${scanSession.results.vulnerabilities.length}`);
      console.log(`   - Secrets: ${scanSession.results.secrets.length}`);
      console.log(`   - Code Quality: ${scanSession.results.codeQuality.length}`);
      console.log(`   - Total Issues: ${totalIssues}`);
      console.log(`   - Risk Level: ${report?.executive?.overallRisk || 'Unknown'}`);
      
      return {
        success: true,
        scanId: scanId,
        timestamp: scanSession.timestamp,
        results: scanSession.results,
        summary: {
          ...scanSession.summary,
          totalIssues: totalIssues,
          language: language,
          riskLevel: report?.executive?.overallRisk || 'medium',
          status: totalIssues > 0 ? 'issues_found' : 'clean',
          scanDuration: scanSession.metrics.scanDuration
        },
        metrics: scanSession.metrics,
        report: report,
        rawSession: scanSession
      };

    } catch (error) {
      console.error(`❌ Scan ${scanId} failed:`, error);
      throw new Error(`Code scanning failed: ${error.message}`);
    }
  }

  /**
   * Phase 1: Static code analysis using ESLint
   */
  async runStaticAnalysis(code, language, session) {
    console.log('🔧 Running static analysis...');
    
    if (this.isJavaScriptFamily(language)) {
      const eslintResults = await this.tools.eslint.scan(code, {
        language,
        enableSecurityRules: true,
        enableQualityRules: true
      });
      
      session.results.vulnerabilities.push(...eslintResults.vulnerabilities);
      session.results.codeQuality.push(...eslintResults.codeQuality);
      
      console.log(`   ✓ Found ${eslintResults.vulnerabilities.length} security issues`);
      console.log(`   ✓ Found ${eslintResults.codeQuality.length} code quality issues`);
    }
  }

  /**
   * Phase 2: Advanced pattern matching
   */
  async runPatternAnalysis(code, language, session) {
    console.log('🔍 Running pattern analysis...');
    
    // Secret detection
    const secrets = await this.tools.patterns.detectSecrets(code);
    session.results.secrets = secrets;
    console.log(`   ✓ Found ${secrets.length} potential secrets`);
    
    // Vulnerability pattern matching
    const vulnPatterns = await this.tools.patterns.detectVulnerabilities(code, language);
    session.results.vulnerabilities.push(...vulnPatterns);
    console.log(`   ✓ Found ${vulnPatterns.length} vulnerability patterns`);
  }

  /**
   * Phase 3: External intelligence gathering
   */
  async runExternalIntelligence(session) {
    console.log('🌐 Gathering external intelligence...');
    
    // Extract potential CVE references and vulnerability keywords
    const keywords = this.extractVulnerabilityKeywords(session.results.vulnerabilities);
    
    if (keywords.length > 0) {
      // CVE database lookup
      const cveResults = await this.tools.cve.lookupByKeywords(keywords);
      session.results.cveMatches = cveResults;
      console.log(`   ✓ Found ${cveResults.length} CVE matches`);
      
      // GitHub Security Advisories
      const advisories = await this.tools.advisory.searchAdvisories(keywords);
      session.results.advisories = advisories;
      console.log(`   ✓ Found ${advisories.length} security advisories`);
    }
  }

  /**
   * Phase 4: SonarQube static analysis (optional, fast)
   */
  async runSonarAnalysis(code, language, session) {
    try {
      console.log('🔍 Running SonarQube analysis...');
      
      const sonarResult = await this.tools.sonar.scan(code, language);
      
      if (sonarResult.success && sonarResult.issues && sonarResult.issues.length > 0) {
        // Add SonarQube results to code quality findings
        session.results.codeQuality.push(...sonarResult.issues);
        console.log(`   ✓ Found ${sonarResult.issues.length} code quality issues`);
      } else if (sonarResult.unavailable) {
        console.log('   ⚠️ SonarQube analysis unavailable (install sonar-scanner)');
      } else if (sonarResult.timeout) {
        console.log('   ⏱️ SonarQube analysis timed out (15s limit)');
      } else {
        console.log('   ✓ No additional issues found by SonarQube');
      }
      
    } catch (error) {
      console.warn('   ⚠️ SonarQube analysis failed:', error.message);
    }
  }

  /**
   * Phase 4: Real Security API Scanning
   * Uses Semgrep and TruffleHog for advanced security analysis
   */
  async runRealSecurityScanning(code, language, session) {
    console.log('🛡️ Running real security API scanning...');
    
    try {
      // Semgrep scanning for security vulnerabilities
      console.log('   🔍 Running Semgrep analysis...');
      const semgrepResults = await this.tools.semgrep.scanCode(code, language);
      
      if (semgrepResults.success && semgrepResults.findings?.length > 0) {
        // Add Semgrep findings to vulnerabilities
        session.results.vulnerabilities.push(...semgrepResults.findings);
        console.log(`   ✓ Semgrep found ${semgrepResults.findings.length} security issues`);
      } else {
        console.log('   ✓ No security issues found by Semgrep');
      }
      
      // TruffleHog scanning for secrets
      console.log('   🔐 Running TruffleHog secret analysis...');
      const truffleResults = await this.tools.trufflehog.scanForSecrets(code);
      
      if (truffleResults.success && truffleResults.secrets?.length > 0) {
        // Add TruffleHog secrets to results
        session.results.secrets.push(...truffleResults.secrets);
        console.log(`   ✓ TruffleHog found ${truffleResults.secrets.length} additional secrets`);
      } else {
        console.log('   ✓ No additional secrets found by TruffleHog');
      }
      
    } catch (error) {
      console.warn('   ⚠️ Real security scanning failed:', error.message);
      console.log('   ⏮️ Falling back to pattern-based scanning only');
    }
  }

  /**
   * Helper methods
   */
  updateSummaryFromResults(session) {
    const allFindings = [
      ...session.results.vulnerabilities,
      ...session.results.secrets,
      ...session.results.codeQuality
    ];

    // Count by severity
    allFindings.forEach(finding => {
      const severity = finding.severity?.toLowerCase() || 'info';
      if (session.summary.hasOwnProperty(severity)) {
        session.summary[severity]++;
      } else {
        session.summary.info++; // Default to info if unknown severity
      }
    });
  }

  isJavaScriptFamily(language) {
    return ['javascript', 'typescript', 'jsx', 'tsx', 'js', 'ts', 'node'].includes(language.toLowerCase());
  }

  extractVulnerabilityKeywords(vulnerabilities) {
    const keywords = new Set();
    
    vulnerabilities.forEach(vuln => {
      // Extract keywords from vulnerability messages
      const message = vuln.message.toLowerCase();
      
      if (message.includes('sql')) keywords.add('sql injection');
      if (message.includes('xss')) keywords.add('cross-site scripting');
      if (message.includes('csrf')) keywords.add('csrf');
      if (message.includes('eval')) keywords.add('code injection');
      if (message.includes('buffer')) keywords.add('buffer overflow');
      if (message.includes('path traversal')) keywords.add('path traversal');
    });
    
    return Array.from(keywords);
  }

  /**
   * Get scanner health and statistics
   */
  async getHealth() {
    return {
      status: 'healthy',
      tools: {
        eslint: await this.tools.eslint.getHealth(),
        patterns: await this.tools.patterns.getHealth(),
        cve: await this.tools.cve.getHealth(),
        advisory: await this.tools.advisory.getHealth()
      },
      version: '1.0.0',
      capabilities: [
        'ESLint Security Scanning',
        'Secret Detection',
        'Vulnerability Pattern Matching',
        'CVE Database Lookup',
        'GitHub Security Advisories',
        'Beautiful Report Generation'
      ]
    };
  }
}

module.exports = PasteScanner;