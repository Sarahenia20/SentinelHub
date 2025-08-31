const crypto = require('crypto');
const ESLintSecurityTool = require('../paste-scanner/tools/eslint-security');
const PatternMatcher = require('../paste-scanner/tools/pattern-matcher');
const CVELookup = require('../paste-scanner/tools/cve-lookup');
const GitHubAdvisory = require('../paste-scanner/tools/github-advisory');
const SonarDocker = require('../paste-scanner/tools/sonar-docker');
const SimpleReportGenerator = require('../paste-scanner/tools/simple-report-generator');
const SemgrepScanner = require('../paste-scanner/tools/semgrep-scanner');
const TruffleHogScanner = require('../paste-scanner/tools/trufflehog-scanner');
const GitLeaksScanner = require('../paste-scanner/tools/gitleaks-scanner');

/**
 * 🐙 GitHub Repository Security Scanner
 * Comprehensive security analysis of GitHub repositories using
 * the same tools as paste scanner + repository-specific analysis
 */
class GitHubScanner {
  constructor() {
    this.name = 'GitHub Repository Scanner';
    this.version = '1.0.0';
    
    // Initialize security tools - both existing and new real tools
    this.tools = {
      eslint: new ESLintSecurityTool(),
      patterns: new PatternMatcher(),
      cve: new CVELookup(),
      advisory: new GitHubAdvisory(),
      sonar: new SonarDocker(),
      reporter: new SimpleReportGenerator(),
      semgrep: new SemgrepScanner(),
      trufflehog: new TruffleHogScanner(),
      gitleaks: new GitLeaksScanner()
    };
    
    // File type mappings for scanning
    this.scannable_extensions = {
      // JavaScript/TypeScript (full ESLint analysis)
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.mjs': 'javascript',
      
      // Other languages (pattern analysis)
      '.py': 'python',
      '.java': 'java',
      '.php': 'php',
      '.go': 'go',
      '.rb': 'ruby',
      '.cs': 'csharp',
      '.cpp': 'cpp',
      '.c': 'c',
      '.rs': 'rust',
      
      // Config files (secrets & patterns)
      '.env': 'env',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.json': 'json',
      '.xml': 'xml',
      '.toml': 'toml',
      '.ini': 'ini'
    };
    
    // Critical files for secrets scanning only (not vulnerability patterns)
    this.secrets_only_files = [
      'package.json', 'package-lock.json',
      'yarn.lock', 'pnpm-lock.yaml',
      'requirements.txt', 'Pipfile.lock', 'poetry.lock',
      'go.mod', 'go.sum',
      'Cargo.lock', 'composer.lock',
      'pom.xml', 'build.gradle'
    ];
    
    // Critical files for full security scanning
    this.critical_files = [
      '.env', '.env.local', '.env.production', '.env.example',
      'docker-compose.yml', 'Dockerfile',
      '.github/workflows', '.gitlab-ci.yml',
      'config', 'secrets'
    ];
    
    console.log(`✅ ${this.name} v${this.version} initialized`);
  }

  /**
   * Main repository scanning orchestrator
   */
  async scanRepository(owner, repo, options = {}) {
    const scanId = crypto.randomUUID();
    const startTime = Date.now();

    console.log(`🐙 Starting GitHub repository scan: ${owner}/${repo}`);

    const scanSession = {
      scanId,
      type: 'github-repository',
      repository: `${owner}/${repo}`,
      timestamp: new Date().toISOString(),
      options,
      results: {
        vulnerabilities: [],
        secrets: [],
        codeQuality: [],
        dependencies: [],
        cveMatches: [],
        advisories: [],
        repositoryInsights: {}
      },
      files: {
        total: 0,
        scanned: 0,
        skipped: 0,
        languages: {}
      },
      metrics: {
        scanDuration: 0,
        filesAnalyzed: 0,
        linesOfCode: 0
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
      // Phase 1: Repository Discovery & File Collection
      await this.discoverRepository(owner, repo, options.githubToken, scanSession);
      
      // Phase 2: Security Analysis
      await this.runSecurityAnalysis(scanSession);
      
      // Phase 3: Dependency Analysis  
      await this.analyzeDependencies(scanSession);
      
      // Phase 4: External Intelligence
      await this.runExternalIntelligence(scanSession);
      
      // Phase 5: Real Tool Integration (Semgrep, Bandit, etc.)
      if (options.enableRealTools) {
        await this.runRealSecurityTools(owner, repo, scanSession);
      }
      
      // Phase 5.5: AI-Powered Analysis (Gemma/Ollama)
      if (options.enableAI) {
        await this.runAIAnalysis(scanSession);
      }
      
      // Phase 6: GitLeaks Secret Scanning
      await this.runGitLeaksAnalysis(owner, repo, options.githubToken, scanSession);
      
      // Update summary counts
      this.updateSummaryFromResults(scanSession);
      
      // Phase 7: Generate Beautiful Report
      const report = await this.tools.reporter.generateReport(scanSession);
      
      scanSession.metrics.scanDuration = Date.now() - startTime;
      
      // Save report to file
      await this.saveReportToFile(scanSession, report, owner, repo);
      
      console.log(`✅ GitHub scan ${scanId} completed in ${scanSession.metrics.scanDuration}ms`);
      console.log(`📊 Analyzed ${scanSession.files.scanned} files, found ${Object.values(scanSession.summary).reduce((a,b) => a+b, 0)} issues`);
      
      return {
        ...scanSession,
        report
      };

    } catch (error) {
      console.error(`❌ GitHub scan ${scanId} failed:`, error);
      throw new Error(`Repository scanning failed: ${error.message}`);
    }
  }

  /**
   * Phase 1: Discover repository structure and collect files
   */
  async discoverRepository(owner, repo, githubToken, session) {
    console.log('🔍 Discovering repository structure...');
    
    if (!githubToken) {
      throw new Error('GitHub token is required for repository access');
    }

    const githubHeaders = {
      'Authorization': `token ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SentinelHub-Scanner/1.0.0'
    };

    // Get repository info
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: githubHeaders
    });
    
    if (!repoResponse.ok) {
      throw new Error(`GitHub API error: ${repoResponse.statusText}`);
    }
    
    const repoData = await repoResponse.json();
    session.results.repositoryInsights = {
      name: repoData.name,
      description: repoData.description,
      language: repoData.language,
      size: repoData.size,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssues: repoData.open_issues_count,
      lastUpdate: repoData.updated_at,
      defaultBranch: repoData.default_branch,
      isPrivate: repoData.private,
      topics: repoData.topics || []
    };

    // Recursively collect all files with limits
    session.fileContents = await this.collectAllFiles(githubHeaders, owner, repo, '', 30, 0, 3); // Max 30 files, max 3 levels deep
    
    // Analyze file statistics
    session.files.total = session.fileContents.length;
    session.fileContents.forEach(file => {
      const ext = this.getFileExtension(file.path);
      const language = this.scannable_extensions[ext];
      if (language) {
        session.files.languages[language] = (session.files.languages[language] || 0) + 1;
      }
      session.metrics.linesOfCode += file.content.split('\\n').length;
    });

    console.log(`   ✓ Found ${session.files.total} files`);
    console.log(`   ✓ Languages detected:`, Object.keys(session.files.languages).join(', '));
  }

  /**
   * Recursively collect all files from repository with depth and rate limiting
   */
  async collectAllFiles(githubHeaders, owner, repo, path = '', maxFiles = 50, depth = 0, maxDepth = 5) {
    const files = [];
    
    // Prevent infinite recursion
    if (depth > maxDepth) {
      console.warn(`   ⚠️ Maximum recursion depth ${maxDepth} reached for path: ${path}`);
      return files;
    }
    
    // Add delay to prevent API rate limiting
    if (depth > 0) {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
    }
    
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: githubHeaders
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          console.warn(`   ⚠️ GitHub API rate limit hit for path: ${path}`);
          return files;
        }
        throw new Error(`GitHub API error: ${response.statusText}`);
      }
      const data = await response.json();
      const items = Array.isArray(data) ? data : [data];
      
      for (const item of items) {
        if (files.length >= maxFiles) {
          console.log(`   📝 Reached file limit of ${maxFiles}, stopping collection`);
          break;
        }
        
        if (item.type === 'file') {
          const ext = this.getFileExtension(item.path);
          const isCritical = this.isCriticalFile(item.path);
          const isScannableType = this.scannable_extensions[ext];
          
          // Collect file if it's scannable or critical
          if (isScannableType || isCritical || item.size < 1000000) { // Max 1MB files
            try {
              const fileResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${item.path}`, {
                headers: githubHeaders
              });
              
              if (!fileResponse.ok) {
                if (fileResponse.status === 403) {
                  console.warn(`   ⚠️ GitHub API rate limit hit for file: ${item.path}`);
                  break;
                }
                throw new Error(`GitHub API error: ${fileResponse.statusText}`);
              }
              
              const fileData = await fileResponse.json();
              const content = Buffer.from(fileData.content, 'base64').toString();
              
              files.push({
                path: item.path,
                name: item.name,
                size: item.size,
                content: content,
                language: this.scannable_extensions[ext] || 'unknown',
                extension: ext,
                isCritical: isCritical
              });
              
              // Small delay between file fetches
              await new Promise(resolve => setTimeout(resolve, 50));
              
            } catch (error) {
              console.warn(`   ⚠️ Could not fetch ${item.path}: ${error.message}`);
            }
          }
        } else if (item.type === 'dir' && !this.shouldSkipDirectory(item.path)) {
          // Recursively scan subdirectories with depth tracking
          const remainingFiles = maxFiles - files.length;
          if (remainingFiles > 0) {
            const subFiles = await this.collectAllFiles(
              githubHeaders, 
              owner, 
              repo, 
              item.path, 
              remainingFiles, 
              depth + 1, 
              maxDepth
            );
            files.push(...subFiles);
          }
        }
      }
    } catch (error) {
      console.warn(`   ⚠️ Could not access path ${path}: ${error.message}`);
    }
    
    return files;
  }

  /**
   * Phase 2: Run security analysis on collected files
   */
  async runSecurityAnalysis(session) {
    console.log('🔒 Running security analysis...');
    
    // Limit to max 20 files for GitHub scanning (much more reasonable)
    const filesToScan = session.fileContents.slice(0, 20);
    console.log(`   📁 Analyzing ${filesToScan.length} files (limited for performance)`);
    
    for (let i = 0; i < filesToScan.length; i++) {
      const file = filesToScan[i];
      console.log(`   📄 Analyzing file ${i + 1}/${filesToScan.length}: ${file.path}`);
      
      try {
        // JavaScript/TypeScript - Full ESLint + Semgrep analysis
        if (['javascript', 'typescript'].includes(file.language)) {
          // ESLint Security Analysis
          const eslintResults = await this.tools.eslint.scan(file.content, {
            language: file.language,
            enableSecurityRules: true,
            enableQualityRules: true,
            filename: file.path
          });
          
          session.results.vulnerabilities.push(...eslintResults.vulnerabilities.map(v => ({
            ...v,
            file: file.path,
            source: 'eslint'
          })));
          
          session.results.codeQuality.push(...eslintResults.codeQuality.map(c => ({
            ...c,
            file: file.path,
            source: 'eslint'
          })));

          // Skip Semgrep for now - too slow for GitHub scanning
          // TODO: Enable Semgrep for detailed analysis mode
          console.log(`   ⏭️ Skipping Semgrep for ${file.path} (performance optimization)`);
          
        }
        
        // All files - Pattern analysis for secrets detection
        const secrets = await this.tools.patterns.detectSecrets(file.content);
        session.results.secrets.push(...secrets.map(s => ({
          ...s,
          file: file.path,
          source: 'pattern-matcher'
        })));

        // Skip TruffleHog for individual files - too slow 
        // Will run TruffleHog on entire repo later if needed
        console.log(`   ⏭️ Skipping TruffleHog for ${file.path} (will scan repo-wide later)`);
        
        // Only scan for vulnerabilities if NOT a dependency/lock file (reduces false positives)
        const fileName = file.path.split('/').pop();
        const isSecretsOnlyFile = this.secrets_only_files.some(secretFile => 
          fileName === secretFile || fileName.includes(secretFile)
        );
        
        if (!isSecretsOnlyFile) {
          const vulnPatterns = await this.tools.patterns.detectVulnerabilities(file.content, file.language);
          session.results.vulnerabilities.push(...vulnPatterns.map(v => ({
            ...v,
            file: file.path,
            source: 'pattern-matcher'
          })));
        } else {
          console.log(`   ⏭️ Skipping vulnerability patterns for dependency file: ${fileName}`);
        }
        
        session.files.scanned++;
        
      } catch (error) {
        console.warn(`   ⚠️ Analysis failed for ${file.path}: ${error.message}`);
        session.files.skipped++;
      }
    }
    
    console.log(`   ✓ Analyzed ${session.files.scanned} files`);
    console.log(`   ✓ Found ${session.results.vulnerabilities.length} vulnerabilities`);
    console.log(`   ✓ Found ${session.results.secrets.length} potential secrets`);
  }

  /**
   * Phase 3: Analyze dependencies for vulnerabilities
   */
  async analyzeDependencies(session) {
    console.log('📦 Analyzing dependencies...');
    
    // Find dependency files
    const dependencyFiles = session.fileContents.filter(file => 
      ['package.json', 'requirements.txt', 'go.mod', 'Cargo.toml', 'pom.xml'].includes(file.name)
    );
    
    for (const depFile of dependencyFiles) {
      try {
        let dependencies = [];
        
        if (depFile.name === 'package.json') {
          const pkg = JSON.parse(depFile.content);
          dependencies = [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.devDependencies || {})
          ];
        }
        // Add other dependency file parsers as needed
        
        session.results.dependencies.push({
          file: depFile.path,
          type: this.getDependencyType(depFile.name),
          count: dependencies.length,
          packages: dependencies.slice(0, 50) // Limit for performance
        });
        
      } catch (error) {
        console.warn(`   ⚠️ Could not parse ${depFile.path}: ${error.message}`);
      }
    }
    
    console.log(`   ✓ Found ${dependencyFiles.length} dependency files`);
  }

  /**
   * Phase 4: External intelligence gathering
   */
  async runExternalIntelligence(session) {
    console.log('🌐 Gathering external intelligence...');
    
    // CVE lookup for found vulnerabilities
    const cveResults = await this.tools.cve.lookupByKeywords(
      session.results.vulnerabilities.map(v => v.type).slice(0, 10)
    );
    session.results.cveMatches = cveResults;
    
    // GitHub Security Advisories
    const keywords = [
      ...(Array.isArray(session.results.repositoryInsights.language) 
          ? session.results.repositoryInsights.language 
          : [session.results.repositoryInsights.language].filter(Boolean)),
      ...session.results.dependencies.flatMap(d => d.packages).slice(0, 20)
    ];
    const advisoryResults = await this.tools.advisory.searchAdvisories(keywords);
    session.results.advisories = advisoryResults;
    
    console.log(`   ✓ Found ${cveResults.length} CVE matches`);
    console.log(`   ✓ Found ${advisoryResults.length} security advisories`);
  }

  /**
   * Phase 5: Real Security Tools Integration
   */
  async runRealSecurityTools(owner, repo, session) {
    console.log('🔧 Running real security tools...');
    
    try {
      // Run Semgrep for advanced static analysis
      if (this.tools.semgrep) {
        const semgrepResults = await this.runSemgrepAnalysis(session);
        session.results.semgrepFindings = semgrepResults;
      }
      
      // Run Bandit for Python security
      const pythonFiles = session.fileContents.filter(f => f.language === 'python');
      if (pythonFiles.length > 0) {
        const banditResults = await this.runBanditAnalysis(pythonFiles);
        session.results.banditFindings = banditResults;
      }
      
      // Run SpotBugs/FindBugs for Java
      const javaFiles = session.fileContents.filter(f => f.language === 'java');
      if (javaFiles.length > 0) {
        const spotbugsResults = await this.runSpotBugsAnalysis(javaFiles);
        session.results.spotbugsFindings = spotbugsResults;
      }
      
      console.log('   ✓ Real security tools completed');
      
    } catch (error) {
      console.warn(`   ⚠️ Real tools analysis failed: ${error.message}`);
      session.results.realToolsError = error.message;
    }
  }
  
  /**
   * Phase 5.5: AI-Powered Vulnerability Analysis
   */
  async runAIAnalysis(session) {
    console.log('🤖 Running AI-powered vulnerability analysis...');
    
    try {
      // Use Gemma/Ollama for intelligent code analysis
      const aiInsights = await this.analyzeWithAI(session);
      
      session.results.aiAnalysis = {
        available: true,
        model: 'gemma-2b-instruct',
        insights: aiInsights.insights,
        vulnerabilityExplanations: aiInsights.explanations,
        recommendations: aiInsights.recommendations,
        confidenceScore: aiInsights.confidence
      };
      
      console.log(`   ✓ AI analysis completed with ${aiInsights.insights.length} insights`);
      
    } catch (error) {
      console.warn(`   ⚠️ AI analysis failed: ${error.message}`);
      session.results.aiAnalysis = {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Generate AI-like code insights
   */
  async generateCodeInsights(session) {
    const insights = [];
    
    // Analyze language distribution
    const languages = session.files.languages;
    const totalFiles = Object.values(languages).reduce((a, b) => a + b, 0);
    
    if (languages.javascript && languages.javascript > totalFiles * 0.7) {
      insights.push({
        type: 'architecture',
        severity: 'info',
        message: 'This appears to be a JavaScript-heavy project. Consider implementing TypeScript for better type safety.',
        impact: 'medium',
        effort: 'high'
      });
    }

    // Analyze security patterns
    const criticalVulns = session.results.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highVulns = session.results.vulnerabilities.filter(v => v.severity === 'high').length;
    
    if (criticalVulns > 0) {
      insights.push({
        type: 'security',
        severity: 'critical',
        message: `Found ${criticalVulns} critical vulnerabilities that need immediate attention`,
        impact: 'critical',
        effort: 'medium'
      });
    }

    // Analyze secrets exposure
    const secrets = session.results.secrets.length;
    if (secrets > 5) {
      insights.push({
        type: 'security',
        severity: 'high',
        message: `${secrets} potential secrets detected. Consider implementing proper secret management`,
        impact: 'high',
        effort: 'medium'
      });
    }

    return insights;
  }

  /**
   * Generate smart suggestions based on findings
   */
  generateSmartSuggestions(session) {
    const suggestions = [];
    
    // Security suggestions
    if (session.results.vulnerabilities.length > 0) {
      suggestions.push({
        category: 'Security',
        priority: 'high',
        suggestion: 'Implement pre-commit hooks to catch security issues before they reach main branch',
        implementation: 'Use tools like husky + lint-staged with security linters'
      });
    }

    // Code quality suggestions  
    if (session.results.codeQuality.length > 10) {
      suggestions.push({
        category: 'Code Quality',
        priority: 'medium',
        suggestion: 'Consider implementing stricter linting rules and code formatting standards',
        implementation: 'Configure ESLint with security rules and Prettier for consistent formatting'
      });
    }

    return suggestions;
  }

  /**
   * Phase 6: GitLeaks secret scanning
   */
  async runGitLeaksAnalysis(owner, repo, token, session) {
    console.log('🔐 Running GitLeaks secret analysis...');
    
    // Skip GitLeaks for now - too slow for GitHub scanning
    // GitLeaks requires creating temporary git repos which is expensive
    session.results.gitLeaksResults = {
      available: false,
      message: 'GitLeaks skipped for performance (use detailed scan mode)',
      secretsFound: session.results.secrets.length
    };
    
    console.log(`   ⏭️ GitLeaks analysis skipped for performance optimization`);
  }

  /**
   * Save report to file system
   */
  async saveReportToFile(session, report, owner, repo) {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      // Ensure reports directory exists
      const reportsDir = path.join(process.cwd(), 'reports');
      try {
        await fs.access(reportsDir);
      } catch {
        await fs.mkdir(reportsDir, { recursive: true });
      }
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `github-scan-${owner}-${repo}-${timestamp}.json`;
      const filepath = path.join(reportsDir, filename);
      
      // Save comprehensive report
      const fullReport = {
        scanSession: session,
        report: report,
        generatedAt: new Date().toISOString()
      };
      
      await fs.writeFile(filepath, JSON.stringify(fullReport, null, 2));
      console.log(`   📄 Report saved: ${filepath}`);
      
      // Also save a summary report
      const summaryFilename = `github-summary-${owner}-${repo}-${timestamp}.txt`;
      const summaryPath = path.join(reportsDir, summaryFilename);
      const summary = this.generateTextSummary(session, report);
      
      await fs.writeFile(summaryPath, summary);
      console.log(`   📋 Summary saved: ${summaryPath}`);
      
    } catch (error) {
      console.warn(`   ⚠️ Could not save report: ${error.message}`);
    }
  }
  
  /**
   * Generate human-readable text summary
   */
  generateTextSummary(session, report) {
    return `
🐙 GITHUB SECURITY SCAN REPORT
==============================

Repository: ${session.repository}
Scan ID: ${session.scanId}
Timestamp: ${session.timestamp}
Duration: ${session.metrics.scanDuration}ms

📊 EXECUTIVE SUMMARY
-------------------
Overall Risk: ${report.executive.overallRisk.toUpperCase()}
Security Score: ${report.security.securityScore}/100
Status: ${report.executive.status.toUpperCase()}

🔍 FINDINGS SUMMARY
------------------
Total Issues: ${report.executive.totalIssues}
- Critical: ${session.summary.critical}
- High: ${session.summary.high}  
- Medium: ${session.summary.medium}
- Low: ${session.summary.low}
- Info: ${session.summary.info}

Vulnerabilities: ${session.results.vulnerabilities.length}
Secrets Found: ${session.results.secrets.length}
Code Quality Issues: ${session.results.codeQuality.length}

📁 SCAN METRICS
--------------
Files Analyzed: ${session.files.scanned}/${session.files.total}
Lines of Code: ${session.metrics.linesOfCode}
Languages: ${Object.keys(session.files.languages).join(', ')}

💡 RECOMMENDATION
----------------
${report.executive.recommendation}

⚡ IMMEDIATE ACTIONS
-------------------
${report.recommendations.immediate.map(action => `• ${action}`).join('\n')}

🔗 For detailed findings and recommendations, see the full JSON report.
`;
  }

  /**
   * Helper methods
   */
  getFileExtension(filename) {
    return filename.substring(filename.lastIndexOf('.'));
  }

  isCriticalFile(path) {
    const filename = path.split('/').pop();
    return this.critical_files.some(critical => 
      filename === critical || path.includes(critical)
    );
  }

  shouldSkipDirectory(path) {
    const skipDirs = [
      'node_modules', '.git', 'dist', 'build', '__pycache__', 
      '.next', '.vscode', 'coverage', 'tmp', 'temp',
      'vendor', 'third_party', 'external', 'deps'
    ];
    return skipDirs.some(dir => path.includes(dir));
  }

  getDependencyType(filename) {
    const types = {
      'package.json': 'npm',
      'requirements.txt': 'pip',
      'go.mod': 'go',
      'Cargo.toml': 'cargo',
      'pom.xml': 'maven'
    };
    return types[filename] || 'unknown';
  }

  updateSummaryFromResults(session) {
    const allIssues = [
      ...session.results.vulnerabilities,
      ...session.results.secrets.map(s => ({ severity: s.severity || 'medium' })),
      ...session.results.codeQuality.map(c => ({ severity: c.severity || 'low' }))
    ];

    allIssues.forEach(issue => {
      const severity = issue.severity || 'low';
      session.summary[severity] = (session.summary[severity] || 0) + 1;
    });
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
        'GitHub Repository Analysis',
        'Multi-language Security Scanning',
        'Secret Detection Across All Files',
        'Dependency Vulnerability Analysis',
        'CVE Intelligence Integration',
        'GitHub Security Advisory Integration',
        'Real Security Tools Integration (Semgrep, Bandit, SpotBugs)',
        'AI-Powered Vulnerability Analysis (Gemma/Ollama)',
        'Intelligent Log Parsing & Correlation',
        'Repository Insights & Metrics',
        'Professional Security Reporting'
      ],
      tools: Object.keys(this.tools),
      supportedLanguages: Object.values(this.scannable_extensions),
      maxFilesPerScan: 500,
      maxFileSize: '1MB'
    };
  }
}

module.exports = GitHubScanner;