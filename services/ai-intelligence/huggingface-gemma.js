
/**
 * 🤖 HuggingFace Gemma AI Integration
 * Uses google/gemma-3-270m model for intelligent security analysis
 * 
 * Reference: https://huggingface.co/google/gemma-3-270m
 * API Docs: https://huggingface.co/docs/api-inference/
 */
class HuggingFaceGemma {
  constructor() {
    this.name = 'HuggingFace Gemma AI Analyzer';
    this.version = '1.0.0';
    this.model = 'google/gemma-3-270m';
    this.apiUrl = `https://api-inference.huggingface.co/models/${this.model}`;
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.maxTokens = 512;
    
    if (!this.apiKey) {
      console.warn('⚠️ HUGGINGFACE_API_KEY not set - AI analysis will be limited');
    }
    
    console.log(`🤖 ${this.name} v${this.version} initialized`);
  }
  
  /**
   * Analyze security findings with AI intelligence
   */
  async analyzeSecurityFindings(scanResults, options = {}) {
    console.log('🧠 Running AI security analysis...');
    
    if (!this.apiKey) {
      return this.getFallbackAnalysis(scanResults);
    }
    
    try {
      const analysis = {
        riskAssessment: await this.assessOverallRisk(scanResults),
        vulnerabilityAnalysis: await this.analyzeVulnerabilities(scanResults.vulnerabilities || []),
        secretsAnalysis: await this.analyzeSecrets(scanResults.secrets || []),
        recommendations: await this.generateRecommendations(scanResults),
        falsePositiveFiltering: await this.filterFalsePositives(scanResults),
        model: this.model,
        timestamp: new Date().toISOString()
      };
      
      console.log(`   ✅ AI analysis completed with ${analysis.vulnerabilityAnalysis.length} insights`);
      return analysis;
      
    } catch (error) {
      console.warn(`   ⚠️ AI analysis failed: ${error.message}`);
      return this.getFallbackAnalysis(scanResults);
    }
  }
  
  /**
   * Assess overall security risk using AI
   */
  async assessOverallRisk(scanResults) {
    const vulnerabilities = scanResults.vulnerabilities || [];
    const secrets = scanResults.secrets || [];
    const codeQuality = scanResults.codeQuality || [];
    
    const prompt = `Analyze this security scan summary and assess overall risk:
    
SCAN RESULTS:
- ${vulnerabilities.length} vulnerabilities found
- ${secrets.length} secrets detected  
- ${codeQuality.length} code quality issues
- Critical findings: ${vulnerabilities.filter(v => v.severity === 'critical').length}
- High severity: ${vulnerabilities.filter(v => v.severity === 'high').length}

Provide a brief risk assessment (1-2 sentences):`;
    
    try {
      const response = await this.queryGemma(prompt);
      return {
        level: this.calculateRiskLevel(vulnerabilities, secrets),
        aiExplanation: response.trim(),
        confidence: 0.8
      };
    } catch (error) {
      return {
        level: this.calculateRiskLevel(vulnerabilities, secrets),
        aiExplanation: 'AI analysis unavailable - risk calculated from findings count',
        confidence: 0.6
      };
    }
  }
  
  /**
   * Analyze individual vulnerabilities with AI
   */
  async analyzeVulnerabilities(vulnerabilities) {
    const analyses = [];
    
    // Analyze top 3 most critical vulnerabilities to avoid API limits
    const topVulns = vulnerabilities
      .filter(v => ['critical', 'high'].includes(v.severity))
      .slice(0, 3);
    
    for (const vuln of topVulns) {
      try {
        const analysis = await this.analyzeVulnerability(vuln);
        analyses.push({
          ...vuln,
          aiAnalysis: analysis
        });
      } catch (error) {
        console.warn(`   ⚠️ Failed to analyze vulnerability: ${error.message}`);
      }
    }
    
    return analyses;
  }
  
  /**
   * Analyze individual vulnerability
   */
  async analyzeVulnerability(vulnerability) {
    const prompt = `Analyze this security vulnerability:
    
VULNERABILITY:
Type: ${vulnerability.type || 'Unknown'}
Severity: ${vulnerability.severity || 'Unknown'}  
Message: ${vulnerability.message || 'No description'}
Source: ${vulnerability.source || 'Unknown'}
CWE: ${vulnerability.cwe || 'N/A'}

Is this a real security threat? Explain in 1-2 sentences:`;
    
    try {
      const response = await this.queryGemma(prompt);
      
      return {
        explanation: response.trim(),
        realThreat: this.assessThreatReality(response),
        confidence: 0.75,
        falsePositiveProbability: this.calculateFalsePositiveProbability(vulnerability, response)
      };
      
    } catch (error) {
      return {
        explanation: 'AI analysis failed',
        realThreat: true, // Default to true for safety
        confidence: 0.3,
        falsePositiveProbability: 0.3
      };
    }
  }
  
  /**
   * Analyze secrets with AI intelligence
   */
  async analyzeSecrets(secrets) {
    const realSecrets = [];
    
    // Process secrets in batches to avoid API limits
    const secretBatches = this.chunkArray(secrets, 5);
    
    for (const batch of secretBatches.slice(0, 2)) { // Limit to 2 batches (10 secrets)
      try {
        const batchAnalysis = await this.analyzeSecretBatch(batch);
        realSecrets.push(...batchAnalysis.filter(s => s.aiAnalysis.isRealSecret));
      } catch (error) {
        console.warn(`   ⚠️ Secret batch analysis failed: ${error.message}`);
        // If AI fails, keep original secrets (safer)
        realSecrets.push(...batch);
      }
    }
    
    return realSecrets;
  }
  
  /**
   * Analyze batch of secrets
   */
  async analyzeSecretBatch(secretBatch) {
    const secretsDescription = secretBatch.map((secret, i) => 
      `${i + 1}. Type: ${secret.type}, Value: ${secret.redactedValue || '***'}, File: ${secret.file || 'unknown'}`
    ).join('\n');
    
    const prompt = `Analyze these potential secrets - which are REAL secrets vs FALSE POSITIVES?

POTENTIAL SECRETS:
${secretsDescription}

Common FALSE POSITIVES: npm package hashes, base64 encoded data, test keys, placeholder values
REAL SECRETS: actual API keys, passwords, tokens, private keys

For each item, respond with "REAL" or "FALSE":`;
    
    try {
      const response = await this.queryGemma(prompt);
      const lines = response.split('\n').filter(line => line.trim());
      
      return secretBatch.map((secret, i) => ({
        ...secret,
        aiAnalysis: {
          isRealSecret: this.parseSecretAnalysis(lines[i] || ''),
          explanation: lines[i] || 'No AI analysis',
          confidence: 0.7
        }
      }));
      
    } catch (error) {
      // If AI fails, assume all might be real (safer)
      return secretBatch.map(secret => ({
        ...secret,
        aiAnalysis: {
          isRealSecret: true,
          explanation: 'AI analysis failed - manual review needed',
          confidence: 0.3
        }
      }));
    }
  }
  
  /**
   * Generate intelligent recommendations
   */
  async generateRecommendations(scanResults) {
    const vulnCount = scanResults.vulnerabilities?.length || 0;
    const secretCount = secrets.length || 0;
    const criticalCount = scanResults.vulnerabilities?.filter(v => v.severity === 'critical').length || 0;
    
    const prompt = `Generate 3 priority security recommendations based on:
- ${vulnCount} vulnerabilities (${criticalCount} critical)
- ${secretCount} secrets found
- Languages: ${scanResults.language || 'unknown'}

Provide actionable recommendations:`;
    
    try {
      const response = await this.queryGemma(prompt);
      const lines = response.split('\n').filter(line => line.trim() && (line.includes('1.') || line.includes('2.') || line.includes('3.')));
      
      return lines.map((line, i) => ({
        priority: i + 1,
        action: line.replace(/^\d+\.?\s*/, '').trim(),
        category: this.categorizeRecommendation(line),
        urgency: criticalCount > 0 ? 'immediate' : 'medium'
      }));
      
    } catch (error) {
      return this.getFallbackRecommendations(scanResults);
    }
  }
  
  /**
   * Filter false positives using AI
   */
  async filterFalsePositives(scanResults) {
    const falsePositives = [];
    const realFindings = [];
    
    // Focus on secrets for false positive filtering
    const secrets = scanResults.secrets || [];
    
    for (const secret of secrets.slice(0, 10)) { // Limit to avoid API costs
      try {
        if (this.isLikelyFalsePositive(secret)) {
          falsePositives.push(secret);
        } else {
          realFindings.push(secret);
        }
      } catch (error) {
        realFindings.push(secret); // If uncertain, keep it
      }
    }
    
    return {
      falsePositives: falsePositives,
      realFindings: realFindings,
      filteredCount: falsePositives.length
    };
  }
  
  /**
   * Query Gemma model via HuggingFace API
   */
  async queryGemma(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('HuggingFace API key not available');
    }
    
    const { default: fetch } = await import('node-fetch');
    
    const payload = {
      inputs: prompt,
      parameters: {
        max_new_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || 0.3,
        do_sample: true,
        return_full_text: false
      },
      options: {
        wait_for_model: true,
        use_cache: false
      }
    };
    
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HuggingFace API error: ${response.status} - ${error}`);
    }
    
    const result = await response.json();
    
    if (Array.isArray(result) && result[0]?.generated_text) {
      return result[0].generated_text;
    }
    
    if (result.generated_text) {
      return result.generated_text;
    }
    
    throw new Error('Unexpected API response format');
  }
  
  /**
   * Calculate risk level from findings
   */
  calculateRiskLevel(vulnerabilities, secrets) {
    const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highVulns = vulnerabilities.filter(v => v.severity === 'high').length;
    const verifiedSecrets = secrets.filter(s => s.verified).length;
    
    if (criticalVulns > 0 || verifiedSecrets > 0) return 'critical';
    if (highVulns > 3 || secrets.length > 10) return 'high';
    if (highVulns > 0 || secrets.length > 5) return 'medium';
    return 'low';
  }
  
  /**
   * Assess if vulnerability description indicates real threat
   */
  assessThreatReality(aiResponse) {
    const response = aiResponse.toLowerCase();
    const realThreatIndicators = ['yes', 'real', 'threat', 'vulnerable', 'exploitable', 'dangerous'];
    const falsePositiveIndicators = ['false', 'not real', 'unlikely', 'benign', 'safe'];
    
    const realScore = realThreatIndicators.reduce((score, indicator) => 
      score + (response.includes(indicator) ? 1 : 0), 0);
    const falseScore = falsePositiveIndicators.reduce((score, indicator) => 
      score + (response.includes(indicator) ? 1 : 0), 0);
    
    return realScore >= falseScore;
  }
  
  /**
   * Calculate false positive probability
   */
  calculateFalsePositiveProbability(vulnerability, aiResponse) {
    let probability = 0.3; // Base probability
    
    // Adjust based on AI response
    if (aiResponse.toLowerCase().includes('false positive')) probability += 0.4;
    if (aiResponse.toLowerCase().includes('real threat')) probability -= 0.3;
    
    // Adjust based on vulnerability source
    if (vulnerability.source === 'eslint') probability += 0.1;
    if (vulnerability.source === 'semgrep-real') probability -= 0.2;
    
    return Math.max(0, Math.min(1, probability));
  }
  
  /**
   * Parse secret analysis response
   */
  parseSecretAnalysis(analysisLine) {
    const line = analysisLine.toLowerCase();
    return line.includes('real') && !line.includes('false');
  }
  
  /**
   * Check if secret is likely false positive without AI
   */
  isLikelyFalsePositive(secret) {
    const value = (secret.secretValue || secret.value || '').toLowerCase();
    const file = (secret.file || '').toLowerCase();
    
    // Package lock hashes
    if (file.includes('package-lock.json') || file.includes('yarn.lock')) return true;
    
    // Test data
    if (value.includes('test') || value.includes('example') || value.includes('demo')) return true;
    
    // Common false positives
    if (value.length === 64 && /^[a-f0-9]+$/.test(value)) return true; // SHA256 hash
    if (value.startsWith('sha') && value.includes('-')) return true; // NPM integrity
    
    return false;
  }
  
  /**
   * Categorize recommendation type
   */
  categorizeRecommendation(recommendation) {
    const rec = recommendation.toLowerCase();
    if (rec.includes('secret') || rec.includes('credential')) return 'secrets';
    if (rec.includes('input') || rec.includes('validation')) return 'input-validation';
    if (rec.includes('update') || rec.includes('dependency')) return 'dependencies';
    if (rec.includes('access') || rec.includes('permission')) return 'access-control';
    return 'general';
  }
  
  /**
   * Utility to chunk array into smaller arrays
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
  
  /**
   * Get fallback analysis when AI is unavailable
   */
  getFallbackAnalysis(scanResults) {
    const vulns = scanResults.vulnerabilities || [];
    const secrets = scanResults.secrets || [];
    
    return {
      riskAssessment: {
        level: this.calculateRiskLevel(vulns, secrets),
        aiExplanation: 'Risk assessment based on finding counts and severity levels',
        confidence: 0.6
      },
      vulnerabilityAnalysis: vulns.slice(0, 3).map(v => ({
        ...v,
        aiAnalysis: {
          explanation: 'AI analysis unavailable - manual review recommended',
          realThreat: true,
          confidence: 0.5,
          falsePositiveProbability: 0.3
        }
      })),
      secretsAnalysis: secrets,
      recommendations: this.getFallbackRecommendations(scanResults),
      falsePositiveFiltering: {
        falsePositives: [],
        realFindings: secrets,
        filteredCount: 0
      },
      model: 'fallback-heuristics',
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Get fallback recommendations
   */
  getFallbackRecommendations(scanResults) {
    const recommendations = [];
    const vulns = scanResults.vulnerabilities || [];
    const secrets = scanResults.secrets || [];
    
    if (vulns.filter(v => v.severity === 'critical').length > 0) {
      recommendations.push({
        priority: 1,
        action: 'Address critical vulnerabilities immediately',
        category: 'vulnerabilities',
        urgency: 'immediate'
      });
    }
    
    if (secrets.length > 0) {
      recommendations.push({
        priority: 2,
        action: 'Review and secure exposed secrets',
        category: 'secrets',
        urgency: 'high'
      });
    }
    
    if (vulns.length > 5) {
      recommendations.push({
        priority: 3,
        action: 'Implement security linting in CI/CD pipeline',
        category: 'general',
        urgency: 'medium'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Health check for HuggingFace API
   */
  async getHealth() {
    let apiStatus = 'unavailable';
    let modelInfo = {};
    
    if (this.apiKey) {
      try {
        // Test API with simple query
        const testResponse = await this.queryGemma('Test query', { maxTokens: 10 });
        apiStatus = 'healthy';
      } catch (error) {
        apiStatus = 'error';
        console.warn(`   ⚠️ HuggingFace API error: ${error.message}`);
      }
    }
    
    return {
      status: apiStatus,
      model: this.model,
      apiKey: this.apiKey ? 'configured' : 'missing',
      capabilities: this.apiKey ? [
        'Intelligent Vulnerability Analysis',
        'False Positive Detection',
        'Risk Assessment',
        'Smart Recommendations',
        'Natural Language Explanations'
      ] : ['Limited heuristic analysis'],
      limitations: [
        'Rate limited API calls',
        'Analysis limited to top findings',
        'Requires HUGGINGFACE_API_KEY'
      ],
      documentation: 'https://huggingface.co/docs/api-inference/'
    };
  }
}

module.exports = HuggingFaceGemma;