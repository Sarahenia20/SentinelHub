const GeminiAssistant = require('./gemini-assistant');

/**
 * Conversational AI for Security Analysis
 * Full conversation system for security findings, recommendations, and expert advice
 * Uses Google Gemini as primary model with intelligent conversation flow
 */
class ConversationAI {
  constructor() {
    this.name = 'SentinelHub Conversational AI';
    this.version = '2.0.0';

    // Initialize AI model - Now using Gemini!
    this.geminiAI = new GeminiAssistant();

    // Conversation context
    this.conversationHistory = [];
    this.currentScanResults = null;
    this.sessionId = this.generateSessionId();

    console.log(`✨ Conversational AI ${this.version} initialized with Google Gemini`);
  }
  
  /**
   * Start conversation with scan results context
   */
  async startConversation(scanResults, userMessage = null) {
    console.log('Starting security conversation session...');
    
    this.currentScanResults = scanResults;
    this.conversationHistory = [];
    this.sessionId = this.generateSessionId();
    
    // Generate proactive overview if no user message
    if (!userMessage) {
      return this.generateSecurityOverview(scanResults);
    }
    
    return this.chat(userMessage);
  }
  
  /**
   * Main chat interface - handles security questions and provides expert advice
   */
  async chat(userMessage, options = {}) {
    console.log(`Processing user question: ${userMessage.substring(0, 60)}...`);
    
    try {
      // Build context-aware prompt
      const contextualPrompt = this.buildContextualPrompt(userMessage);
      
      // Get AI response from Gemini with shorter, focused responses
      const aiResponse = await this.geminiAI.queryGemini(contextualPrompt, {
        maxTokens: options.maxTokens || 200, // Reduced from 400 to 200 for conciseness
        temperature: 0.7
      });
      
      // Process and enhance response
      const processedResponse = this.processAIResponse(aiResponse, userMessage);
      
      // Add to conversation history
      this.addToHistory('user', userMessage);
      this.addToHistory('assistant', processedResponse.message);
      
      console.log('Response generated successfully');
      return processedResponse;
      
    } catch (error) {
      console.error('Chat processing failed:', error.message);
      return this.createFallbackResponse(userMessage);
    }
  }
  
  /**
   * Generate proactive security overview from scan results
   */
  async generateSecurityOverview(scanResults) {
    console.log('Generating security overview...');
    
    const scanSummary = this.buildScanSummary(scanResults);
    const overviewPrompt = this.buildOverviewPrompt(scanSummary);
    
    try {
      const overview = await this.geminiAI.queryGemini(overviewPrompt, {
        maxTokens: 250, // Reduced from 350 to 250 for conciseness
        temperature: 0.6
      });
      
      return {
        message: overview,
        type: 'security_overview',
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        scanSummary: scanSummary,
        quickActions: this.generateQuickActions(scanResults),
        suggestedQuestions: this.generateSuggestedQuestions(scanResults),
        canInteract: true
      };
      
    } catch (error) {
      console.warn('Failed to generate AI overview, using structured fallback');
      return this.createStructuredOverview(scanResults);
    }
  }
  
  /**
   * Build contextual prompt for AI with scan results and conversation history
   */
  buildContextualPrompt(userMessage) {
    const scanContext = this.buildScanSummary(this.currentScanResults);
    const conversationContext = this.buildConversationContext();

    // Check if question is security-related
    const securityKeywords = ['vulnerability', 'security', 'risk', 'threat', 'attack', 'exploit', 'injection', 'xss', 'csrf', 'authentication', 'authorization', 'encryption', 'credential', 'secret', 'api', 'database', 'code', 'scan', 'finding', 'issue', 'fix', 'remediate', 'protect', 'secure', 'hardening', 'compliance', 'owasp', 'cve', 'patch'];
    const isSecurityRelated = securityKeywords.some(keyword => userMessage.toLowerCase().includes(keyword)) ||
                              userMessage.toLowerCase().match(/\b(how|what|why|when|where|can|should|explain|tell|show)\b/);

    return `You are a friendly and knowledgeable cybersecurity expert having a conversation with a developer.

SCAN RESULTS CONTEXT:
${scanContext}

RECENT CONVERSATION:
${conversationContext}

USER QUESTION: "${userMessage}"

RESPONSE GUIDELINES:
- If the question is about security, vulnerabilities, or code: Answer naturally and conversationally
- If the question is completely unrelated to security/development: Politely decline and redirect to security topics
- Be flexible: Sometimes give brief pointers (1-2 sentences), sometimes explain in detail (5-10 sentences) based on what the question needs
- Use markdown for clarity (**, -, numbered lists) but keep it natural, not overly structured
- Reference specific scan findings when relevant
- Be helpful, encouraging, and approachable - like a senior colleague, not a robot

TONE: Conversational, helpful, professional but friendly. Switch between brief answers and detailed explanations as appropriate.

YOUR RESPONSE:`;
  }
  
  /**
   * Build overview prompt for initial conversation
   */
  buildOverviewPrompt(scanSummary) {
    return `You're a friendly cybersecurity expert reviewing scan results with a developer.

${scanSummary}

Give a conversational overview:
- Start with a quick assessment (is it good? bad? critical?)
- Mention the top 2-3 things that need attention
- Be encouraging if things look good, or supportive if there are issues
- Keep it natural and conversational, not overly formal
- Use markdown where it helps (**, -, numbers) but don't overdo it

Talk like a helpful colleague, not a formal report.

YOUR RESPONSE:`;
  }
  
  /**
   * Build scan summary for AI context
   */
  buildScanSummary(scanResults) {
    if (!scanResults) return 'No scan results available for analysis.';
    
    const findings = scanResults.findings || {};
    const metrics = this.analyzeScanMetrics(findings);
    const riskLevel = this.determineRiskLevel(scanResults);
    
    let summary = `SECURITY SCAN ANALYSIS:
Scan Type: ${scanResults.type || 'Security Assessment'}
Total Findings: ${metrics.total}
Critical Issues: ${metrics.critical}
High Severity: ${metrics.high}
Medium Severity: ${metrics.medium}
Risk Level: ${riskLevel}`;
    
    // Add category breakdown
    if (metrics.categories.length > 0) {
      summary += `\n\nFINDING CATEGORIES:
${metrics.categories.map(cat => `- ${cat.name}: ${cat.count} issues`).join('\n')}`;
    }
    
    // Add key findings
    const keyFindings = this.extractKeyFindings(findings);
    if (keyFindings.length > 0) {
      summary += `\n\nKEY SECURITY ISSUES:
${keyFindings.map(finding => `- ${finding}`).join('\n')}`;
    }
    
    return summary;
  }
  
  /**
   * Analyze scan metrics for summary
   */
  analyzeScanMetrics(findings) {
    let total = 0;
    let critical = 0;
    let high = 0;
    let medium = 0;
    const categories = [];
    
    Object.entries(findings).forEach(([category, items]) => {
      if (Array.isArray(items) && items.length > 0) {
        total += items.length;
        categories.push({ name: category, count: items.length });
        
        items.forEach(item => {
          switch (item.severity) {
            case 'critical': critical++; break;
            case 'high': high++; break;
            case 'medium': medium++; break;
          }
        });
      }
    });
    
    return { total, critical, high, medium, categories };
  }
  
  /**
   * Determine overall risk level
   */
  determineRiskLevel(scanResults) {
    return scanResults.summary?.riskLevel || 
           scanResults.riskAssessment?.overall || 
           'Unknown';
  }
  
  /**
   * Extract key findings for summary
   */
  extractKeyFindings(findings) {
    const keyFindings = [];
    
    Object.entries(findings).forEach(([category, items]) => {
      if (Array.isArray(items)) {
        // Get critical and high severity items
        const priority = items
          .filter(item => item.severity === 'critical' || item.severity === 'high')
          .slice(0, 2);
        
        priority.forEach(item => {
          keyFindings.push(`${category.toUpperCase()}: ${item.message || item.type}`);
        });
      }
    });
    
    return keyFindings.slice(0, 6);
  }
  
  /**
   * Build conversation context for AI
   */
  buildConversationContext() {
    if (this.conversationHistory.length === 0) {
      return 'This is the start of the security consultation.';
    }
    
    return this.conversationHistory
      .slice(-6) // Keep recent context
      .map(entry => `${entry.role.toUpperCase()}: ${entry.content}`)
      .join('\n');
  }
  
  /**
   * Process AI response and enhance with metadata
   */
  processAIResponse(aiResponse, userMessage) {
    return {
      message: aiResponse.trim(),
      type: 'chat_response',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      relatedFindings: this.findRelatedFindings(userMessage),
      actionableSteps: this.extractActionableSteps(aiResponse),
      followUpQuestions: this.generateFollowUpQuestions(aiResponse),
      complianceNotes: this.identifyComplianceAspects(userMessage),
      canProvideMoreDetail: true
    };
  }
  
  /**
   * Find findings related to user's question
   */
  findRelatedFindings(userMessage) {
    if (!this.currentScanResults?.findings) return [];
    
    const keywords = userMessage.toLowerCase().split(' ').filter(word => word.length > 3);
    const relatedFindings = [];
    
    Object.entries(this.currentScanResults.findings).forEach(([category, items]) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          const itemText = `${item.message || ''} ${item.type || ''}`.toLowerCase();
          if (keywords.some(keyword => itemText.includes(keyword))) {
            relatedFindings.push({
              ...item,
              category: category,
              relevanceScore: this.calculateRelevance(itemText, keywords)
            });
          }
        });
      }
    });
    
    return relatedFindings
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);
  }
  
  /**
   * Calculate relevance score for findings
   */
  calculateRelevance(itemText, keywords) {
    return keywords.reduce((score, keyword) => {
      return itemText.includes(keyword) ? score + 1 : score;
    }, 0);
  }
  
  /**
   * Extract actionable steps from AI response
   */
  extractActionableSteps(response) {
    const steps = [];
    const lines = response.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      // Look for action-oriented statements
      if (trimmed.match(/^(\d+\.|[-*]|\w+:)/) && trimmed.length > 10) {
        steps.push(trimmed);
      }
    });
    
    return steps.slice(0, 5);
  }
  
  /**
   * Generate follow-up questions
   */
  generateFollowUpQuestions(response) {
    const questions = [
      'Can you provide more specific implementation details?',
      'What tools would you recommend for this remediation?',
      'How urgent is addressing this issue?',
      'Are there alternative approaches I should consider?'
    ];
    
    // Add context-specific questions based on response content
    if (response.toLowerCase().includes('encrypt')) {
      questions.push('What encryption standards should I implement?');
    }
    
    if (response.toLowerCase().includes('access')) {
      questions.push('How should I configure access controls?');
    }
    
    return questions.slice(0, 4);
  }
  
  /**
   * Identify compliance aspects in user question
   */
  identifyComplianceAspects(userMessage) {
    const compliance = [];
    const message = userMessage.toLowerCase();
    
    if (message.includes('gdpr') || message.includes('privacy')) {
      compliance.push('GDPR compliance considerations apply');
    }
    
    if (message.includes('pci') || message.includes('payment')) {
      compliance.push('PCI-DSS requirements relevant');
    }
    
    if (message.includes('hipaa') || message.includes('health')) {
      compliance.push('HIPAA privacy and security rules apply');
    }
    
    return compliance;
  }
  
  /**
   * Generate quick actions based on scan results
   */
  generateQuickActions(scanResults) {
    const actions = [];
    const findings = scanResults.findings || {};
    
    // Check for critical issues
    const hasCritical = Object.values(findings).some(items => 
      Array.isArray(items) && items.some(item => item.severity === 'critical')
    );
    
    if (hasCritical) {
      actions.push({
        title: 'Address Critical Issues',
        description: 'Fix immediate security risks',
        priority: 'urgent',
        category: 'security'
      });
    }
    
    if (findings.secrets?.length > 0) {
      actions.push({
        title: 'Secure Exposed Credentials',
        description: 'Remove and rotate compromised secrets',
        priority: 'high',
        category: 'secrets'
      });
    }
    
    if (findings.vulnerabilities?.length > 0) {
      actions.push({
        title: 'Patch Vulnerabilities',
        description: 'Apply security updates and fixes',
        priority: 'high',
        category: 'vulnerabilities'
      });
    }
    
    actions.push({
      title: 'Create Remediation Plan',
      description: 'Get detailed step-by-step fix instructions',
      priority: 'medium',
      category: 'planning'
    });
    
    return actions;
  }
  
  /**
   * Generate suggested questions for user
   */
  generateSuggestedQuestions(scanResults) {
    const questions = [
      'What are the most critical security issues I need to fix immediately?',
      'How do I implement the recommended security fixes?',
      'What compliance requirements am I currently violating?',
      'Can you explain these vulnerabilities in business terms?',
      'What is the potential impact if these issues are not addressed?'
    ];
    
    const findings = scanResults.findings || {};
    
    if (findings.secrets?.length > 0) {
      questions.push('How do I properly manage and secure these exposed secrets?');
    }
    
    if (findings.misconfigurations?.length > 0) {
      questions.push('What security configurations should I prioritize?');
    }
    
    if (findings.permissions?.length > 0) {
      questions.push('How do I implement proper access controls?');
    }
    
    return questions.slice(0, 6);
  }
  
  /**
   * Create fallback response when AI fails
   */
  createFallbackResponse(userMessage) {
    return {
      message: 'I apologize, but I\'m experiencing technical difficulties processing your question. However, I can still provide general security guidance. Could you please rephrase your question or ask about a specific aspect of your security findings?',
      type: 'fallback_response',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      isError: true,
      suggestedQuestions: [
        'What should I prioritize in my security fixes?',
        'How do I address the critical vulnerabilities?',
        'What are the compliance implications of these findings?'
      ]
    };
  }
  
  /**
   * Create structured overview when AI is unavailable
   */
  createStructuredOverview(scanResults) {
    const metrics = this.analyzeScanMetrics(scanResults.findings || {});
    const riskLevel = this.determineRiskLevel(scanResults);
    
    const message = `Security assessment completed for your application. 

SUMMARY:
- Total security findings: ${metrics.total}
- Critical issues requiring immediate attention: ${metrics.critical}
- High severity vulnerabilities: ${metrics.high}
- Overall risk level: ${riskLevel}

I'm here to help you understand these findings and create an action plan for remediation. What would you like to explore first?`;
    
    return {
      message: message,
      type: 'structured_overview',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      scanSummary: this.buildScanSummary(scanResults),
      quickActions: this.generateQuickActions(scanResults),
      suggestedQuestions: this.generateSuggestedQuestions(scanResults)
    };
  }
  
  /**
   * Add message to conversation history
   */
  addToHistory(role, content) {
    this.conversationHistory.push({
      role: role,
      content: content,
      timestamp: new Date().toISOString()
    });
    
    // Keep history manageable
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-16);
    }
  }
  
  /**
   * Export conversation for reporting
   */
  exportConversation() {
    return {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      scanContext: this.currentScanResults ? this.buildScanSummary(this.currentScanResults) : null,
      conversation: this.conversationHistory,
      messageCount: this.conversationHistory.length,
      duration: this.calculateSessionDuration()
    };
  }
  
  /**
   * Calculate session duration
   */
  calculateSessionDuration() {
    if (this.conversationHistory.length === 0) return 0;
    
    const start = new Date(this.conversationHistory[0].timestamp);
    const end = new Date(this.conversationHistory[this.conversationHistory.length - 1].timestamp);
    return Math.round((end - start) / 1000); // seconds
  }
  
  /**
   * Clear conversation
   */
  clearConversation() {
    this.conversationHistory = [];
    this.currentScanResults = null;
    this.sessionId = this.generateSessionId();
    console.log('Conversation session cleared');
  }
  
  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }
  
  /**
   * Get conversation summary
   */
  getConversationSummary() {
    return {
      sessionId: this.sessionId,
      messageCount: this.conversationHistory.length,
      hasActiveContext: !!this.currentScanResults,
      lastActivity: this.conversationHistory.length > 0 ? 
        this.conversationHistory[this.conversationHistory.length - 1].timestamp : null
    };
  }
  
  /**
   * Health check
   */
  async getHealth() {
    const geminiHealth = await this.geminiAI.getHealth();

    return {
      status: geminiHealth.status,
      service: 'Conversational AI',
      aiModel: 'Google Gemini 2.0 Flash (Experimental)',
      capabilities: [
        'Interactive Security Consultations',
        'Vulnerability Analysis and Explanation',
        'Remediation Guidance and Best Practices',
        'Compliance and Risk Assessment',
        'Contextual Security Recommendations'
      ],
      activeConversations: this.conversationHistory.length > 0 ? 1 : 0
    };
  }
}

module.exports = ConversationAI;