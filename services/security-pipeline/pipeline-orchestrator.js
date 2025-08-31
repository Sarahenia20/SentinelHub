const RealSecurityScanner = require('../real-security-scanner');
const S3BucketScanner = require('../cloud-security/s3-bucket-scanner');
const ConversationAI = require('../ai-intelligence/conversation-ai');
const crypto = require('crypto');

/**
 * Security Pipeline Orchestrator
 * Automated pipeline that orchestrates the complete security analysis workflow:
 * 1. Security Scanning → 2. AI Analysis → 3. Conversation Setup → 4. Storage → 5. Reporting
 */
class SecurityPipelineOrchestrator {
  constructor() {
    this.name = 'SentinelHub Security Pipeline';
    this.version = '1.0.0';
    
    // Initialize scanners and AI
    this.codeScanner = new RealSecurityScanner();
    this.s3Scanner = new S3BucketScanner();
    this.conversationAI = new ConversationAI();
    
    // Pipeline state
    this.activePipelines = new Map();
    this.pipelineHistory = [];
    
    console.log(`${this.name} v${this.version} initialized`);
  }
  
  /**
   * Execute complete security analysis pipeline
   */
  async executePipeline(request) {
    const pipelineId = this.generatePipelineId();
    const startTime = Date.now();
    
    console.log(`Starting security pipeline ${pipelineId} for ${request.type}`);
    
    const pipeline = {
      id: pipelineId,
      type: request.type,
      input: request.input,
      startTime: new Date().toISOString(),
      status: 'running',
      stages: {
        scanning: { status: 'pending', results: null },
        aiAnalysis: { status: 'pending', results: null },
        conversation: { status: 'pending', results: null },
        storage: { status: 'pending', results: null },
        reporting: { status: 'pending', results: null }
      },
      metrics: {
        totalDuration: 0,
        scanDuration: 0,
        aiDuration: 0
      }
    };
    
    this.activePipelines.set(pipelineId, pipeline);
    
    // Set up 2-minute timeout email
    const timeoutTimer = setTimeout(() => {
      this.sendTimeoutEmail(pipeline, request.userEmail);
    }, 2 * 60 * 1000); // 2 minutes
    
    try {
      // Stage 1: Security Scanning
      await this.executeScanningStage(pipeline, request);
      
      // Stage 2: AI Analysis & Recommendations
      await this.executeAIAnalysisStage(pipeline);
      
      // Stage 3: Conversation Initialization
      await this.executeConversationStage(pipeline);
      
      // Stage 4: Storage (Database/Reports)
      await this.executeStorageStage(pipeline);
      
      // Stage 5: Report Generation
      await this.executeReportingStage(pipeline);
      
      // Complete pipeline
      pipeline.status = 'completed';
      pipeline.completedTime = new Date().toISOString();
      pipeline.metrics.totalDuration = Date.now() - startTime;
      
      // Clear timeout timer
      clearTimeout(timeoutTimer);
      
      console.log(`Pipeline ${pipelineId} completed successfully in ${pipeline.metrics.totalDuration}ms`);
      
      // Move to history
      this.pipelineHistory.unshift(pipeline);
      this.activePipelines.delete(pipelineId);
      
      return this.buildPipelineResponse(pipeline);
      
    } catch (error) {
      console.error(`Pipeline ${pipelineId} failed:`, error.message);
      
      pipeline.status = 'failed';
      pipeline.error = error.message;
      pipeline.failedTime = new Date().toISOString();
      pipeline.metrics.totalDuration = Date.now() - startTime;
      
      // Clear timeout timer on failure too
      clearTimeout(timeoutTimer);
      
      this.pipelineHistory.unshift(pipeline);
      this.activePipelines.delete(pipelineId);
      
      return this.buildErrorResponse(pipeline, error);
    }
  }
  
  /**
   * Stage 1: Execute security scanning based on request type
   */
  async executeScanningStage(pipeline, request) {
    console.log(`Pipeline ${pipeline.id}: Executing security scanning...`);
    pipeline.stages.scanning.status = 'running';
    
    const scanStart = Date.now();
    let scanResults;
    
    switch (request.type) {
      case 'code-analysis':
        scanResults = await this.codeScanner.scanCode(
          request.input.code,
          request.input.language,
          request.options || {}
        );
        break;
        
      case 'github-repository':
        scanResults = await this.codeScanner.scanGitHubRepository(
          request.input.owner,
          request.input.repo,
          request.options || {}
        );
        break;
        
      case 's3-bucket':
        scanResults = await this.s3Scanner.scanBucket(
          request.input.bucketName,
          request.input.credentials,
          request.options || {}
        );
        break;
        
      default:
        throw new Error(`Unsupported scan type: ${request.type}`);
    }
    
    pipeline.stages.scanning.status = 'completed';
    pipeline.stages.scanning.results = scanResults;
    pipeline.metrics.scanDuration = Date.now() - scanStart;
    
    console.log(`Pipeline ${pipeline.id}: Scanning completed with ${this.getTotalFindings(scanResults)} findings`);
  }
  
  /**
   * Stage 2: AI Analysis and enhancement of scan results
   */
  async executeAIAnalysisStage(pipeline) {
    console.log(`Pipeline ${pipeline.id}: Executing AI analysis...`);
    pipeline.stages.aiAnalysis.status = 'running';
    
    const aiStart = Date.now();
    const scanResults = pipeline.stages.scanning.results;
    
    try {
      // Enhance scan results with additional AI insights
      const aiEnhancedResults = await this.enhanceWithAI(scanResults, pipeline.type);
      
      pipeline.stages.aiAnalysis.status = 'completed';
      pipeline.stages.aiAnalysis.results = aiEnhancedResults;
      pipeline.metrics.aiDuration = Date.now() - aiStart;
      
      // Update scan results with AI enhancements
      pipeline.stages.scanning.results = {
        ...scanResults,
        aiEnhanced: true,
        aiInsights: aiEnhancedResults
      };
      
      console.log(`Pipeline ${pipeline.id}: AI analysis completed`);
      
    } catch (error) {
      console.warn(`Pipeline ${pipeline.id}: AI analysis failed, continuing without enhancement:`, error.message);
      pipeline.stages.aiAnalysis.status = 'failed';
      pipeline.stages.aiAnalysis.error = error.message;
      pipeline.metrics.aiDuration = Date.now() - aiStart;
    }
  }
  
  /**
   * Stage 3: Initialize conversation system
   */
  async executeConversationStage(pipeline) {
    console.log(`Pipeline ${pipeline.id}: Initializing conversation system...`);
    pipeline.stages.conversation.status = 'running';
    
    try {
      const scanResults = pipeline.stages.scanning.results;
      const conversationData = await this.conversationAI.startConversation(scanResults);
      
      pipeline.stages.conversation.status = 'completed';
      pipeline.stages.conversation.results = {
        sessionId: conversationData.sessionId,
        overview: conversationData.message,
        quickActions: conversationData.quickActions || [],
        suggestedQuestions: conversationData.suggestedQuestions || [],
        chatEndpoint: `/api/chat/${conversationData.sessionId}`,
        canChat: true
      };
      
      console.log(`Pipeline ${pipeline.id}: Conversation system ready`);
      
    } catch (error) {
      console.warn(`Pipeline ${pipeline.id}: Conversation initialization failed:`, error.message);
      pipeline.stages.conversation.status = 'failed';
      pipeline.stages.conversation.error = error.message;
      pipeline.stages.conversation.results = {
        canChat: false,
        fallback: 'Conversational AI unavailable - scan results available for manual review'
      };
    }
  }
  
  /**
   * Stage 4: Store results in database and prepare for reporting
   */
  async executeStorageStage(pipeline) {
    console.log(`Pipeline ${pipeline.id}: Executing storage stage...`);
    pipeline.stages.storage.status = 'running';
    
    try {
      const storageData = this.prepareStorageData(pipeline);
      
      // For now, store in memory (later replace with actual database)
      const storageResult = await this.storeInDatabase(storageData);
      
      pipeline.stages.storage.status = 'completed';
      pipeline.stages.storage.results = storageResult;
      
      console.log(`Pipeline ${pipeline.id}: Data stored successfully`);
      
    } catch (error) {
      console.warn(`Pipeline ${pipeline.id}: Storage failed:`, error.message);
      pipeline.stages.storage.status = 'failed';
      pipeline.stages.storage.error = error.message;
    }
  }
  
  /**
   * Stage 5: Generate reports and prepare dashboard data
   */
  async executeReportingStage(pipeline) {
    console.log(`Pipeline ${pipeline.id}: Generating reports...`);
    pipeline.stages.reporting.status = 'running';
    
    try {
      const reportData = this.generateReportData(pipeline);
      
      pipeline.stages.reporting.status = 'completed';
      pipeline.stages.reporting.results = reportData;
      
      console.log(`Pipeline ${pipeline.id}: Reports generated`);
      
    } catch (error) {
      console.warn(`Pipeline ${pipeline.id}: Report generation failed:`, error.message);
      pipeline.stages.reporting.status = 'failed';
      pipeline.stages.reporting.error = error.message;
    }
  }
  
  /**
   * Enhance scan results with AI analysis
   */
  async enhanceWithAI(scanResults, scanType) {
    const findings = scanResults.findings || {};
    
    // Generate AI-powered risk assessment
    const riskPrompt = this.buildRiskAssessmentPrompt(scanResults, scanType);
    const riskAssessment = await this.conversationAI.gemmaAI.queryGemma(riskPrompt, {
      maxTokens: 200
    });
    
    // Generate prioritized remediation recommendations
    const remediationPrompt = this.buildRemediationPrompt(scanResults, scanType);
    const remediation = await this.conversationAI.gemmaAI.queryGemma(remediationPrompt, {
      maxTokens: 250
    });
    
    return {
      riskAssessment: {
        level: this.extractRiskLevel(riskAssessment),
        explanation: riskAssessment,
        timestamp: new Date().toISOString()
      },
      remediationPlan: {
        prioritizedSteps: this.parseRemediationSteps(remediation),
        fullRecommendation: remediation,
        estimatedEffort: this.estimateRemediationEffort(findings)
      },
      complianceImpact: this.assessComplianceImpact(findings),
      businessRisk: this.assessBusinessRisk(findings)
    };
  }
  
  /**
   * Build risk assessment prompt for AI
   */
  buildRiskAssessmentPrompt(scanResults, scanType) {
    const findings = this.summarizeFindings(scanResults);
    
    return `Security Assessment Analysis:

Scan Type: ${scanType}
Total Findings: ${findings.total}
Critical Issues: ${findings.critical}
High Severity: ${findings.high}
Medium Severity: ${findings.medium}

Key Issues: ${findings.keyIssues.join(', ')}

As a cybersecurity expert, assess the overall risk level (Critical/High/Medium/Low) and explain the primary security concerns in 2-3 sentences:`;
  }
  
  /**
   * Build remediation prompt for AI
   */
  buildRemediationPrompt(scanResults, scanType) {
    const findings = this.summarizeFindings(scanResults);
    
    return `Security Remediation Planning:

${findings.keyIssues.slice(0, 5).map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

Provide a prioritized list of 3-4 remediation steps, focusing on the highest impact security improvements:`;
  }
  
  /**
   * Prepare data for storage
   */
  prepareStorageData(pipeline) {
    return {
      pipelineId: pipeline.id,
      scanType: pipeline.type,
      timestamp: pipeline.startTime,
      scanResults: pipeline.stages.scanning.results,
      aiInsights: pipeline.stages.aiAnalysis.results,
      conversationSession: pipeline.stages.conversation.results,
      metrics: pipeline.metrics,
      status: pipeline.status
    };
  }
  
  /**
   * Store in database (placeholder - implement actual database logic)
   */
  async storeInDatabase(data) {
    // TODO: Implement actual database storage (Redis, MongoDB, PostgreSQL, etc.)
    // For now, just simulate storage
    return {
      stored: true,
      storageId: `store_${Date.now()}`,
      timestamp: new Date().toISOString(),
      dataSize: JSON.stringify(data).length
    };
  }
  
  /**
   * Generate report data for dashboard
   */
  generateReportData(pipeline) {
    const scanResults = pipeline.stages.scanning.results;
    const findings = scanResults.findings || {};
    
    return {
      summary: {
        pipelineId: pipeline.id,
        scanType: pipeline.type,
        executionTime: pipeline.metrics.totalDuration,
        timestamp: pipeline.startTime,
        status: pipeline.status
      },
      securityMetrics: {
        totalFindings: this.getTotalFindings(scanResults),
        riskLevel: scanResults.summary?.riskLevel || 'unknown',
        criticalIssues: this.getCriticalCount(scanResults),
        categoriesAffected: Object.keys(findings).length
      },
      dashboardData: {
        riskChart: this.generateRiskChartData(findings),
        categoryBreakdown: this.generateCategoryBreakdown(findings),
        trendData: this.generateTrendData(pipeline.id)
      },
      exportData: {
        jsonReport: scanResults,
        conversationExport: pipeline.stages.conversation.results,
        auditLog: this.generateAuditLog(pipeline)
      }
    };
  }
  
  /**
   * Build complete pipeline response
   */
  buildPipelineResponse(pipeline) {
    return {
      pipelineId: pipeline.id,
      status: 'completed',
      executionTime: pipeline.metrics.totalDuration,
      timestamp: pipeline.completedTime,
      
      // Security scan results
      scanResults: pipeline.stages.scanning.results,
      
      // AI insights and recommendations
      aiInsights: pipeline.stages.aiAnalysis.results,
      
      // Conversation system ready
      conversation: pipeline.stages.conversation.results,
      
      // Report data for dashboard
      reports: pipeline.stages.reporting.results,
      
      // Pipeline metadata
      pipeline: {
        stages: Object.fromEntries(
          Object.entries(pipeline.stages).map(([stage, data]) => [
            stage,
            { status: data.status, error: data.error }
          ])
        ),
        metrics: pipeline.metrics,
        canExport: true,
        canChat: pipeline.stages.conversation.results?.canChat || false
      }
    };
  }
  
  /**
   * Build error response
   */
  buildErrorResponse(pipeline, error) {
    return {
      pipelineId: pipeline.id,
      status: 'failed',
      error: error.message,
      executionTime: pipeline.metrics.totalDuration,
      timestamp: pipeline.failedTime,
      partialResults: {
        scanning: pipeline.stages.scanning.results,
        aiAnalysis: pipeline.stages.aiAnalysis.results
      },
      canRetry: true
    };
  }
  
  /**
   * Chat with the conversation AI about pipeline results
   */
  async chatAboutResults(pipelineId, userMessage, options = {}) {
    const pipeline = this.findPipelineById(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }
    
    // Set context for conversation AI
    if (pipeline.stages.scanning.results) {
      this.conversationAI.currentScanResults = pipeline.stages.scanning.results;
    }
    
    return this.conversationAI.chat(userMessage, options);
  }
  
  /**
   * Get pipeline status
   */
  getPipelineStatus(pipelineId) {
    const active = this.activePipelines.get(pipelineId);
    if (active) return { ...active, isActive: true };
    
    const historical = this.pipelineHistory.find(p => p.id === pipelineId);
    if (historical) return { ...historical, isActive: false };
    
    return null;
  }
  
  /**
   * Get all pipeline history
   */
  getPipelineHistory() {
    return this.pipelineHistory.slice(0, 50); // Last 50 pipelines
  }
  
  /**
   * Utility methods
   */
  generatePipelineId() {
    return `pipeline_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  getTotalFindings(scanResults) {
    const findings = scanResults.findings || {};
    return Object.values(findings).reduce((total, items) => {
      return total + (Array.isArray(items) ? items.length : 0);
    }, 0);
  }
  
  getCriticalCount(scanResults) {
    const findings = scanResults.findings || {};
    let critical = 0;
    Object.values(findings).forEach(items => {
      if (Array.isArray(items)) {
        critical += items.filter(item => item.severity === 'critical').length;
      }
    });
    return critical;
  }
  
  summarizeFindings(scanResults) {
    const findings = scanResults.findings || {};
    let total = 0, critical = 0, high = 0, medium = 0;
    const keyIssues = [];
    
    Object.entries(findings).forEach(([category, items]) => {
      if (Array.isArray(items) && items.length > 0) {
        total += items.length;
        items.forEach(item => {
          if (item.severity === 'critical') critical++;
          else if (item.severity === 'high') high++;
          else if (item.severity === 'medium') medium++;
          
          if (item.severity === 'critical' || item.severity === 'high') {
            keyIssues.push(`${category}: ${item.message || item.type}`);
          }
        });
      }
    });
    
    return { total, critical, high, medium, keyIssues: keyIssues.slice(0, 8) };
  }
  
  // Send timeout email notification
  async sendTimeoutEmail(pipeline, userEmail) {
    try {
      if (!userEmail) {
        console.warn(`No user email provided for timeout notification - Pipeline: ${pipeline.pipelineId}`);
        return;
      }
      
      const axios = require('axios');
      const apiUrl = process.env.API_GATEWAY_URL || 'http://localhost:5000';
      
      await axios.post(`${apiUrl}/api/notifications/email/scan-timeout`, {
        recipient: userEmail,
        scanId: pipeline.pipelineId,
        scanType: pipeline.scanType,
        startTime: pipeline.startTime
      });
      
      console.log(`Timeout email sent for pipeline ${pipeline.pipelineId} to ${userEmail}`);
      
    } catch (error) {
      console.error(`Failed to send timeout email for pipeline ${pipeline.pipelineId}:`, error.message);
    }
  }
  
  extractRiskLevel(riskText) {
    const text = riskText.toLowerCase();
    if (text.includes('critical')) return 'critical';
    if (text.includes('high')) return 'high';
    if (text.includes('medium')) return 'medium';
    return 'low';
  }
  
  parseRemediationSteps(remediation) {
    return remediation
      .split('\n')
      .filter(line => line.match(/^\d+\.|^[-*]/))
      .slice(0, 5);
  }
  
  estimateRemediationEffort(findings) {
    const total = Object.values(findings).reduce((sum, items) => 
      sum + (Array.isArray(items) ? items.length : 0), 0
    );
    
    if (total > 20) return 'High (2-3 weeks)';
    if (total > 10) return 'Medium (1-2 weeks)';
    return 'Low (3-5 days)';
  }
  
  assessComplianceImpact(findings) {
    const impact = [];
    Object.values(findings).forEach(items => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (item.compliance) {
            impact.push(...item.compliance);
          }
        });
      }
    });
    return [...new Set(impact)];
  }
  
  assessBusinessRisk(findings) {
    const criticalCount = Object.values(findings).reduce((count, items) => {
      if (Array.isArray(items)) {
        return count + items.filter(item => item.severity === 'critical').length;
      }
      return count;
    }, 0);
    
    if (criticalCount > 5) return 'High - Immediate action required';
    if (criticalCount > 0) return 'Medium - Address within 48 hours';
    return 'Low - Monitor and address in next cycle';
  }
  
  generateRiskChartData(findings) {
    const data = { critical: 0, high: 0, medium: 0, low: 0 };
    Object.values(findings).forEach(items => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (data[item.severity] !== undefined) {
            data[item.severity]++;
          }
        });
      }
    });
    return data;
  }
  
  generateCategoryBreakdown(findings) {
    return Object.entries(findings).map(([category, items]) => ({
      category,
      count: Array.isArray(items) ? items.length : 0
    }));
  }
  
  generateTrendData(currentPipelineId) {
    // Simulate trend data - in real implementation, fetch from database
    return {
      currentPipeline: currentPipelineId,
      improvement: 'trending_up', // or 'trending_down', 'stable'
      comparedToPrevious: '15% improvement in security posture'
    };
  }
  
  generateAuditLog(pipeline) {
    return {
      pipelineId: pipeline.id,
      stages: pipeline.stages,
      metrics: pipeline.metrics,
      timestamp: pipeline.startTime,
      completedAt: pipeline.completedTime
    };
  }
  
  findPipelineById(pipelineId) {
    return this.activePipelines.get(pipelineId) || 
           this.pipelineHistory.find(p => p.id === pipelineId);
  }
  
  /**
   * Health check
   */
  async getHealth() {
    const [codeHealth, s3Health, aiHealth] = await Promise.all([
      this.codeScanner.getHealth(),
      this.s3Scanner.getHealth(),
      this.conversationAI.getHealth()
    ]);
    
    return {
      status: 'healthy',
      service: 'Security Pipeline Orchestrator',
      activePipelines: this.activePipelines.size,
      completedPipelines: this.pipelineHistory.length,
      components: {
        codeScanner: codeHealth.status,
        s3Scanner: s3Health.status,
        conversationAI: aiHealth.status
      },
      capabilities: [
        'Automated Security Pipeline Orchestration',
        'Multi-Stage Scanning and Analysis',
        'AI-Enhanced Results and Recommendations',
        'Conversation System Integration',
        'Report Generation and Storage',
        'Dashboard Data Preparation'
      ]
    };
  }
}

module.exports = SecurityPipelineOrchestrator;