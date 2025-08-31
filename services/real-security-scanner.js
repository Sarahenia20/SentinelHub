const SemgrepIntegration = require('./real-security-tools/semgrep-integration');
const TruffleHogIntegration = require('./real-security-tools/trufflehog-integration');
const HuggingFaceGemma = require('./ai-intelligence/huggingface-gemma');
const ConversationAI = require('./ai-intelligence/conversation-ai');

/**
 * 🛡️ REAL Security Scanner Orchestrator
 * Integrates actual security tools with AI intelligence
 * 
 * Tools Integrated:
 * - Semgrep: 1000+ community security rules
 * - TruffleHog: 700+ verified secret detectors
 * - HuggingFace Gemma: AI analysis and chat
 * - CVE API: Real vulnerability intelligence
 */
class RealSecurityScanner {
  constructor() {
    this.name = 'SentinelHub Real Security Scanner';
    this.version = '2.0.0';
    
    // Initialize real tools
    this.semgrep = new SemgrepIntegration();
    this.truffleHog = new TruffleHogIntegration();
    this.gemmaAI = new HuggingFaceGemma();
    
    console.log(`🛡️ ${this.name} v${this.version} initialized with REAL tools`);
  }
  
  /**
   * Comprehensive security scan using REAL tools
   */
  async scanCode(code, language, options = {}) {
    const scanId = require('crypto').randomUUID();
    const startTime = Date.now();
    
    console.log(`🚀 Starting REAL security scan ${scanId} for ${language} code...`);
    
    const results = {
      scanId,
      timestamp: new Date().toISOString(),
      language,
      codeLength: code.length,
      tools: {
        semgrep: { enabled: true, results: [] },
        truffleHog: { enabled: true, results: [] },
        gemmaAI: { enabled: !!this.gemmaAI.apiKey, results: {} }
      },
      findings: {
        vulnerabilities: [],
        secrets: [],
        aiAnalysis: {}
      },
      metrics: {
        scanDuration: 0,
        toolsUsed: 0,
        toolsSucceeded: 0
      },
      summary: {
        totalIssues: 0,
        riskLevel: 'unknown',
        confidence: 0
      }
    };
    
    try {
      // Phase 1: Semgrep Static Analysis
      await this.runSemgrepAnalysis(code, language, results, options);
      
      // Phase 2: TruffleHog Secret Detection
      await this.runTruffleHogAnalysis(code, results, options);
      
      // Phase 3: AI Analysis and Recommendations
      await this.runGemmaAnalysis(results, options);
      
      // Phase 4: Calculate Final Metrics
      this.calculateFinalMetrics(results, startTime);
      
      console.log(`✅ REAL security scan ${scanId} completed in ${results.metrics.scanDuration}ms`);
      console.log(`📊 Results: ${results.findings.vulnerabilities.length} vulns, ${results.findings.secrets.length} secrets`);
      console.log(`🎯 Risk Level: ${results.summary.riskLevel.toUpperCase()}`);
      
      return results;
      
    } catch (error) {
      console.error(`❌ REAL security scan ${scanId} failed:`, error.message);
      results.error = error.message;
      results.metrics.scanDuration = Date.now() - startTime;
      return results;
    }
  }
  
  /**
   * Phase 1: Run Semgrep static analysis
   */
  async runSemgrepAnalysis(code, language, results, options) {
    console.log('🔍 Phase 1: Running Semgrep static analysis...');
    results.metrics.toolsUsed++;
    
    try {
      const semgrepOptions = {
        includeInfra: options.includeInfra || false,
        includeSupplyChain: options.includeSupplyChain || true
      };
      
      const semgrepFindings = await this.semgrep.scanCode(code, language, semgrepOptions);
      
      results.tools.semgrep.results = semgrepFindings;
      results.findings.vulnerabilities.push(...semgrepFindings);
      results.metrics.toolsSucceeded++;
      
      console.log(`   ✅ Semgrep: ${semgrepFindings.length} findings from community rules`);
      
    } catch (error) {
      console.warn(`   ⚠️ Semgrep analysis failed: ${error.message}`);
      results.tools.semgrep.error = error.message;
    }
  }
  
  /**
   * Phase 2: Run TruffleHog secret detection
   */
  async runTruffleHogAnalysis(code, results, options) {
    console.log('🔐 Phase 2: Running TruffleHog secret detection...');
    results.metrics.toolsUsed++;
    
    try {
      const truffleOptions = {
        includeEntropy: options.includeEntropy !== false,
        onlyVerified: options.onlyVerified || false
      };
      
      const secretFindings = await this.truffleHog.scanCode(code, truffleOptions);
      
      results.tools.truffleHog.results = secretFindings;
      results.findings.secrets.push(...secretFindings);
      results.metrics.toolsSucceeded++;
      
      const verifiedSecrets = secretFindings.filter(s => s.verified).length;
      console.log(`   ✅ TruffleHog: ${secretFindings.length} secrets (${verifiedSecrets} verified)`);
      
    } catch (error) {
      console.warn(`   ⚠️ TruffleHog analysis failed: ${error.message}`);
      results.tools.truffleHog.error = error.message;
    }
  }
  
  /**
   * Phase 3: Run Gemma AI analysis
   */
  async runGemmaAnalysis(results, options) {
    console.log('🤖 Phase 3: Running Gemma AI analysis...');
    
    if (!this.gemmaAI.apiKey) {
      console.log('   ⚠️ Skipping AI analysis - HUGGINGFACE_API_KEY not configured');
      return;
    }
    
    results.metrics.toolsUsed++;
    
    try {
      const scanData = {
        vulnerabilities: results.findings.vulnerabilities,
        secrets: results.findings.secrets,
        language: results.language
      };
      
      const aiAnalysis = await this.gemmaAI.analyzeSecurityFindings(scanData, options);
      
      results.tools.gemmaAI.results = aiAnalysis;
      results.findings.aiAnalysis = aiAnalysis;
      results.metrics.toolsSucceeded++;
      
      // Update findings with AI insights
      results.findings.vulnerabilities = this.mergeAIInsights(
        results.findings.vulnerabilities, 
        aiAnalysis.vulnerabilityAnalysis
      );
      
      results.findings.secrets = aiAnalysis.secretsAnalysis || results.findings.secrets;
      
      console.log(`   ✅ Gemma AI: Risk level ${aiAnalysis.riskAssessment.level}, ${aiAnalysis.recommendations.length} recommendations`);
      
    } catch (error) {
      console.warn(`   ⚠️ AI analysis failed: ${error.message}`);
      results.tools.gemmaAI.error = error.message;
    }
  }
  
  /**
   * Calculate final scan metrics
   */
  calculateFinalMetrics(results, startTime) {
    results.metrics.scanDuration = Date.now() - startTime;
    results.summary.totalIssues = results.findings.vulnerabilities.length + results.findings.secrets.length;
    
    // Calculate risk level
    const criticalVulns = results.findings.vulnerabilities.filter(v => v.severity === 'critical').length;
    const verifiedSecrets = results.findings.secrets.filter(s => s.verified).length;
    
    if (criticalVulns > 0 || verifiedSecrets > 0) {
      results.summary.riskLevel = 'critical';
    } else if (results.findings.vulnerabilities.filter(v => v.severity === 'high').length > 0) {
      results.summary.riskLevel = 'high';
    } else if (results.summary.totalIssues > 5) {
      results.summary.riskLevel = 'medium';
    } else {
      results.summary.riskLevel = 'low';
    }
    
    // Calculate overall confidence
    const confidences = [
      ...results.findings.vulnerabilities.map(v => v.confidence || 0.7),
      ...results.findings.secrets.map(s => s.confidence || 0.8)
    ];
    
    results.summary.confidence = confidences.length > 0 
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0.5;
  }
  
  /**
   * Merge AI insights with vulnerability findings
   */
  mergeAIInsights(vulnerabilities, aiAnalyses) {
    const enriched = [...vulnerabilities];
    
    for (const aiAnalysis of aiAnalyses || []) {
      const vulnIndex = enriched.findIndex(v => 
        v.ruleId === aiAnalysis.ruleId || 
        (v.line === aiAnalysis.line && v.type === aiAnalysis.type)
      );
      
      if (vulnIndex >= 0) {
        enriched[vulnIndex] = {
          ...enriched[vulnIndex],
          aiEnhanced: true,
          aiInsights: aiAnalysis.aiAnalysis
        };
      }
    }
    
    return enriched;
  }
  
  /**
   * Generate AI-powered chat response about findings
   */
  async chatAboutFindings(results, userQuestion, options = {}) {
    console.log('💬 Generating AI chat response...');
    
    if (!this.gemmaAI.apiKey) {
      return {
        response: 'AI chat unavailable - HUGGINGFACE_API_KEY not configured',
        suggestions: ['Set up HuggingFace API key for intelligent responses']
      };
    }
    
    try {
      const context = `SECURITY SCAN RESULTS:
- ${results.findings.vulnerabilities.length} vulnerabilities found
- ${results.findings.secrets.length} secrets detected
- Risk level: ${results.summary.riskLevel}
- Languages: ${results.language}

USER QUESTION: ${userQuestion}

Provide a helpful response about the security findings:`;
      
      const response = await this.gemmaAI.queryGemma(context, { maxTokens: 256 });
      
      return {
        response: response.trim(),
        riskLevel: results.summary.riskLevel,
        recommendations: results.findings.aiAnalysis.recommendations || [],
        followUpSuggestions: [
          'How can I fix the critical vulnerabilities?',
          'What are the most important security improvements?',
          'How do I secure the exposed secrets?'
        ]
      };
      
    } catch (error) {
      return {
        response: `Sorry, I couldn't analyze your question: ${error.message}`,
        suggestions: ['Try asking about specific vulnerabilities or security improvements']
      };
    }
  }
  
  /**
   * Scan GitHub repository with real tools
   */
  async scanGitHubRepository(owner, repo, options = {}) {
    console.log(`🐙 Starting REAL GitHub repository scan: ${owner}/${repo}`);
    
    const scanId = require('crypto').randomUUID();
    const startTime = Date.now();
    
    const results = {
      scanId,
      repository: `${owner}/${repo}`,
      timestamp: new Date().toISOString(),
      type: 'github-repository',
      tools: {
        truffleHog: { enabled: true, results: [] },
        semgrep: { enabled: false, results: [] }, // Too expensive for full repos
        gemmaAI: { enabled: !!this.gemmaAI.apiKey, results: {} }
      },
      findings: {
        secrets: [],
        repositorySecrets: [],
        aiAnalysis: {}
      },
      metrics: {
        scanDuration: 0,
        toolsUsed: 0
      }
    };
    
    try {
      // Use TruffleHog for repository secret scanning
      const repoUrl = `https://github.com/${owner}/${repo}`;
      const truffleOptions = {
        githubToken: options.githubToken,
        branch: options.branch || 'main'
      };
      
      const repoSecrets = await this.truffleHog.scanRepository(repoUrl, truffleOptions);
      
      results.tools.truffleHog.results = repoSecrets;
      results.findings.repositorySecrets = repoSecrets;
      results.metrics.toolsUsed++;
      
      // AI analysis of repository findings
      if (this.gemmaAI.apiKey && repoSecrets.length > 0) {
        const aiAnalysis = await this.gemmaAI.analyzeSecurityFindings({
          secrets: repoSecrets,
          language: 'mixed'
        });
        
        results.findings.aiAnalysis = aiAnalysis;
      }
      
      results.metrics.scanDuration = Date.now() - startTime;
      
      console.log(`✅ Repository scan completed: ${repoSecrets.length} secrets found`);
      return results;
      
    } catch (error) {
      console.error(`❌ Repository scan failed: ${error.message}`);
      results.error = error.message;
      results.metrics.scanDuration = Date.now() - startTime;
      return results;
    }
  }
  
  /**
   * Get comprehensive health status of all tools
   */
  async getHealth() {
    console.log('🏥 Checking health of all security tools...');
    
    const health = {
      overall: 'checking',
      timestamp: new Date().toISOString(),
      tools: {}
    };
    
    try {
      // Check each tool in parallel
      const [semgrepHealth, truffleHealth, gemmaHealth] = await Promise.all([
        this.semgrep.getHealth(),
        this.truffleHog.getHealth(),
        this.gemmaAI.getHealth()
      ]);
      
      health.tools.semgrep = semgrepHealth;
      health.tools.truffleHog = truffleHealth;
      health.tools.gemmaAI = gemmaHealth;
      
      // Determine overall health
      const toolStatuses = [semgrepHealth.status, truffleHealth.status, gemmaHealth.status];
      const healthyCount = toolStatuses.filter(s => s === 'healthy').length;
      
      if (healthyCount === 3) health.overall = 'excellent';
      else if (healthyCount === 2) health.overall = 'good';
      else if (healthyCount === 1) health.overall = 'limited';
      else health.overall = 'degraded';
      
      health.capabilities = [
        semgrepHealth.status === 'healthy' ? '✅ 1000+ Semgrep Security Rules' : '❌ Semgrep Unavailable',
        truffleHealth.status === 'healthy' ? '✅ 700+ TruffleHog Secret Detectors' : '❌ TruffleHog Unavailable',  
        gemmaHealth.status === 'healthy' ? '✅ Gemma AI Analysis & Chat' : '❌ AI Analysis Limited'
      ];
      
      console.log(`   🏥 Overall health: ${health.overall.toUpperCase()}`);
      return health;
      
    } catch (error) {
      health.overall = 'error';
      health.error = error.message;
      return health;
    }
  }
}

module.exports = RealSecurityScanner;