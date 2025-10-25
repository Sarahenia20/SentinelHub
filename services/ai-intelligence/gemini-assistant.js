const axios = require('axios');

/**
 * Gemini Assistant for Security Analysis
 * Modern AI service using Google's Gemini models for security analysis and recommendations
 */
class GeminiAssistant {
  constructor() {
    this.name = 'Gemini Security Assistant';
    this.version = '1.0.0';
    this.model = 'gemini-2.0-flash-exp'; // Fast experimental model (was gemini-2.5-flash)
    this.maxTokens = 200;
    this.temperature = 0.7;

    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseURL = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;

    if (!this.apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not set - AI analysis will be limited');
      this.isConfigured = false;
    } else {
      this.isConfigured = true;
      console.log(`🤖 ${this.name} v${this.version} initialized with ${this.model}`);
    }
  }

  /**
   * Query Gemini model
   */
  async queryGemini(prompt, options = {}) {
    if (!this.isConfigured) {
      throw new Error('Gemini API key not configured');
    }

    const requestBody = {
      contents: [{
        parts: [{
          text: `You are a friendly, experienced cybersecurity expert. Be conversational and natural - like talking to a colleague. Adjust your response length based on the question: brief for simple questions, detailed for complex ones. Use markdown naturally (**, -, numbers) but don't force it. Be helpful and encouraging.

${prompt}`
        }]
      }],
      generationConfig: {
        temperature: options.temperature || this.temperature,
        maxOutputTokens: options.maxTokens || this.maxTokens,
        topP: 0.95,
        topK: 64
      }
    };

    try {
      // Use query parameter authentication instead of header (more reliable)
      const urlWithKey = `${this.baseURL}?key=${this.apiKey}`;

      const response = await axios.post(urlWithKey, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const data = response.data;

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated from Gemini');
      }

      const content = data.candidates[0].content;
      if (!content.parts || content.parts.length === 0) {
        throw new Error('Empty response from Gemini');
      }

      return content.parts[0].text.trim();

    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data?.error?.message || 'Unknown API error';
        console.error(`Gemini API error: ${error.response.status} - ${errorMessage}`);
        throw new Error(`Gemini API error: ${error.response.status} - ${errorMessage}`);
      } else {
        console.error('Gemini query failed:', error.message);
        throw error;
      }
    }
  }

  /**
   * Analyze vulnerabilities and provide recommendations
   */
  async analyzeVulnerabilities(vulnerabilities, context = {}) {
    if (!this.isConfigured) {
      return this.createFallbackAnalysis(vulnerabilities);
    }

    const prompt = `VULNERABILITY ANALYSIS REQUEST

CONTEXT:
- Scan Type: ${context.scanType || 'Security Assessment'}
- Target: ${context.target || 'Application'}
- Environment: ${context.environment || 'Production'}

VULNERABILITIES FOUND:
${this.formatVulnerabilities(vulnerabilities)}

Please provide:
1. Risk assessment and business impact
2. Prioritized remediation steps
3. Immediate actions needed
4. Long-term security improvements
5. Compliance considerations

Focus on practical, actionable guidance.`;

    try {
      const analysis = await this.queryGemini(prompt, { maxTokens: 600 });

      return {
        success: true,
        analysis: analysis,
        timestamp: new Date().toISOString(),
        model: this.model,
        context: context
      };

    } catch (error) {
      console.error('Vulnerability analysis failed:', error.message);
      return this.createFallbackAnalysis(vulnerabilities);
    }
  }

  /**
   * Generate security recommendations
   */
  async generateRecommendations(scanResults, priority = 'high') {
    if (!this.isConfigured) {
      return this.createFallbackRecommendations(scanResults);
    }

    const findings = this.summarizeFindings(scanResults);

    const prompt = `SECURITY RECOMMENDATIONS REQUEST

SCAN SUMMARY:
${findings}

Priority Level: ${priority.toUpperCase()}

Please provide:
1. Top 5 priority security actions
2. Quick wins (low effort, high impact)
3. Resource requirements for implementation
4. Timeline recommendations
5. Success metrics to track

Focus on ${priority} priority items that deliver maximum security improvement.`;

    try {
      const recommendations = await this.queryGemini(prompt, { maxTokens: 500 });

      return {
        success: true,
        recommendations: recommendations,
        priority: priority,
        timestamp: new Date().toISOString(),
        applicableTo: scanResults.type || 'Security Scan'
      };

    } catch (error) {
      console.error('Recommendations generation failed:', error.message);
      return this.createFallbackRecommendations(scanResults);
    }
  }

  /**
   * Explain security concepts and findings
   */
  async explainSecurityConcept(concept, context = '') {
    if (!this.isConfigured) {
      return this.createFallbackExplanation(concept);
    }

    const prompt = `SECURITY CONCEPT EXPLANATION

Concept: ${concept}
${context ? `Context: ${context}` : ''}

Please explain:
1. What this security concept means
2. Why it's important for security
3. Common attack vectors related to this
4. How to protect against related threats
5. Real-world examples and scenarios

Explain in clear, professional terms suitable for security teams.`;

    try {
      const explanation = await this.queryGemini(prompt, { maxTokens: 400 });

      return {
        success: true,
        explanation: explanation,
        concept: concept,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Concept explanation failed:', error.message);
      return this.createFallbackExplanation(concept);
    }
  }

  /**
   * Generate compliance guidance
   */
  async generateComplianceGuidance(findings, framework = 'general') {
    if (!this.isConfigured) {
      return this.createFallbackCompliance(findings, framework);
    }

    const prompt = `COMPLIANCE ANALYSIS

Compliance Framework: ${framework.toUpperCase()}
Security Findings: ${this.formatFindings(findings)}

Please analyze:
1. Compliance violations identified
2. Risk level for each violation
3. Required remediation steps for compliance
4. Documentation and evidence requirements
5. Timeline for compliance achievement

Focus on ${framework} compliance requirements and practical implementation steps.`;

    try {
      const guidance = await this.queryGemini(prompt, { maxTokens: 500 });

      return {
        success: true,
        guidance: guidance,
        framework: framework,
        timestamp: new Date().toISOString(),
        applicableStandards: this.getApplicableStandards(framework)
      };

    } catch (error) {
      console.error('Compliance guidance failed:', error.message);
      return this.createFallbackCompliance(findings, framework);
    }
  }

  /**
   * Format vulnerabilities for AI analysis
   */
  formatVulnerabilities(vulnerabilities) {
    if (!Array.isArray(vulnerabilities)) {
      return 'No specific vulnerabilities provided';
    }

    return vulnerabilities.slice(0, 10).map((vuln, index) => {
      return `${index + 1}. ${vuln.title || vuln.type || 'Security Issue'}
   Severity: ${vuln.severity || 'Unknown'}
   Description: ${vuln.description || vuln.message || 'No description available'}
   Location: ${vuln.file || vuln.location || 'Not specified'}`;
    }).join('\n\n');
  }

  /**
   * Summarize scan findings
   */
  summarizeFindings(scanResults) {
    const findings = scanResults.findings || {};
    let summary = `Scan Type: ${scanResults.type || 'Security Assessment'}\n`;

    Object.entries(findings).forEach(([category, items]) => {
      if (Array.isArray(items) && items.length > 0) {
        summary += `${category}: ${items.length} issues found\n`;

        const priority = items
          .filter(item => item.severity === 'critical' || item.severity === 'high')
          .slice(0, 3);

        if (priority.length > 0) {
          summary += `  Priority items:\n`;
          priority.forEach(item => {
            summary += `  - ${item.message || item.type} (${item.severity})\n`;
          });
        }
      }
    });

    return summary;
  }

  /**
   * Format findings for compliance analysis
   */
  formatFindings(findings) {
    if (!findings || typeof findings !== 'object') {
      return 'No findings provided';
    }

    let formatted = '';
    Object.entries(findings).forEach(([category, items]) => {
      if (Array.isArray(items) && items.length > 0) {
        formatted += `${category}: ${items.length} issues\n`;
        items.slice(0, 5).forEach(item => {
          formatted += `- ${item.message || item.type} (${item.severity || 'unknown'})\n`;
        });
      }
    });

    return formatted || 'No specific findings to analyze';
  }

  /**
   * Get applicable compliance standards
   */
  getApplicableStandards(framework) {
    const standards = {
      'gdpr': ['GDPR Article 32', 'Privacy by Design', 'Data Protection'],
      'pci': ['PCI-DSS Requirements', 'Payment Card Security'],
      'hipaa': ['HIPAA Security Rule', 'PHI Protection'],
      'soc2': ['SOC 2 Type II Controls', 'Trust Service Criteria'],
      'iso27001': ['ISO 27001:2013', 'Information Security Management'],
      'nist': ['NIST Cybersecurity Framework', 'Risk Management'],
      'general': ['Industry Best Practices', 'Security Standards']
    };

    return standards[framework.toLowerCase()] || standards['general'];
  }

  /**
   * Fallback methods when AI is unavailable
   */
  createFallbackAnalysis(vulnerabilities) {
    return {
      success: false,
      analysis: 'AI analysis temporarily unavailable. Please review vulnerabilities manually and apply standard security remediation practices.',
      fallback: true,
      vulnerabilityCount: Array.isArray(vulnerabilities) ? vulnerabilities.length : 0,
      recommendations: [
        'Review and prioritize vulnerabilities by severity',
        'Apply security patches and updates',
        'Implement input validation and sanitization',
        'Review access controls and permissions',
        'Enable security monitoring and logging'
      ]
    };
  }

  createFallbackRecommendations(scanResults) {
    return {
      success: false,
      recommendations: 'AI recommendations temporarily unavailable. Focus on addressing critical and high severity issues first.',
      fallback: true,
      genericSteps: [
        'Address critical security vulnerabilities immediately',
        'Update all dependencies and libraries',
        'Review and strengthen authentication mechanisms',
        'Implement proper error handling and logging',
        'Conduct regular security assessments'
      ]
    };
  }

  createFallbackExplanation(concept) {
    return {
      success: false,
      explanation: `Unable to provide detailed explanation for "${concept}" due to AI service unavailability. Please consult security documentation or contact your security team for guidance.`,
      concept: concept,
      fallback: true
    };
  }

  createFallbackCompliance(findings, framework) {
    return {
      success: false,
      guidance: `Compliance analysis for ${framework} temporarily unavailable. Please consult compliance documentation and conduct manual review of security findings.`,
      framework: framework,
      fallback: true,
      generalAdvice: 'Review findings against compliance requirements and document remediation efforts'
    };
  }

  /**
   * Health check
   */
  async getHealth() {
    try {
      if (!this.isConfigured) {
        return {
          status: 'degraded',
          service: this.name,
          issue: 'API key not configured',
          capabilities: 'Limited to fallback responses'
        };
      }

      // Test API connectivity with a simple request
      const testPrompt = 'Test connectivity. Respond with "OK" only.';
      await this.queryGemini(testPrompt, { maxTokens: 10 });

      return {
        status: 'healthy',
        service: this.name,
        model: this.model,
        version: this.version,
        capabilities: [
          'Vulnerability Analysis',
          'Security Recommendations',
          'Concept Explanations',
          'Compliance Guidance',
          'Interactive Consultations'
        ]
      };

    } catch (error) {
      return {
        status: 'error',
        service: this.name,
        error: error.message,
        capabilities: 'Fallback mode active'
      };
    }
  }
}

module.exports = GeminiAssistant;
