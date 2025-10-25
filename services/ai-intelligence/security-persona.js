const GeminiAssistant = require('./gemini-assistant');
const HuggingFaceGemma = require('./huggingface-gemma');

/**
 * Security AI Persona System
 * Creates fun, engaging AI personalities that provide security insights for the dashboard
 * Powered by Google Gemini and HuggingFace Gemma
 */
class SecurityPersona {
  constructor() {
    this.name = 'SentinelHub Security Persona';
    this.version = '1.0.0';

    // Initialize AI engines
    this.gemini = new GeminiAssistant();
    this.gemma = new HuggingFaceGemma();

    // Persona types
    this.personas = {
      guardian: {
        name: 'The Security Guardian',
        emoji: '🛡️',
        style: 'professional and protective',
        traits: ['vigilant', 'thorough', 'reassuring']
      },
      detective: {
        name: 'The Security Detective',
        emoji: '🕵️',
        style: 'investigative and curious',
        traits: ['analytical', 'detail-oriented', 'clever']
      },
      coach: {
        name: 'The Security Coach',
        emoji: '💪',
        style: 'motivational and supportive',
        traits: ['encouraging', 'educational', 'positive']
      },
      ninja: {
        name: 'The Security Ninja',
        emoji: '🥷',
        style: 'stealthy and efficient',
        traits: ['quick', 'precise', 'action-oriented']
      },
      sage: {
        name: 'The Security Sage',
        emoji: '🧙',
        style: 'wise and knowledgeable',
        traits: ['experienced', 'insightful', 'patient']
      }
    };

    console.log(`✨ ${this.name} v${this.version} initialized with ${Object.keys(this.personas).length} personalities`);
  }

  /**
   * Generate personalized dashboard greeting based on scan results
   */
  async generateDashboardGreeting(scanResults, personaType = 'guardian') {
    const persona = this.personas[personaType] || this.personas.guardian;
    const riskLevel = scanResults?.summary?.riskLevel || scanResults?.riskAssessment?.overall || 'unknown';

    try {
      const prompt = `You are "${persona.name}" ${persona.emoji}, a ${persona.style} security AI assistant with these traits: ${persona.traits.join(', ')}.

Based on these scan results:
- Risk Level: ${riskLevel}
- Vulnerabilities: ${this.countVulnerabilities(scanResults)}
- Secrets Found: ${this.countSecrets(scanResults)}
- Critical Issues: ${this.countCritical(scanResults)}

Create a brief, engaging greeting (2-3 sentences) for the dashboard that:
1. Acknowledges the current security status
2. Provides a quick insight or observation
3. Offers encouragement or actionable advice
4. Matches your persona's ${persona.style} style

Keep it concise, professional yet fun, and use your emoji ${persona.emoji} once.`;

      const greeting = await this.gemini.queryGemini(prompt, { maxTokens: 150 });

      return {
        persona: persona.name,
        emoji: persona.emoji,
        message: greeting,
        mood: this.determineMood(riskLevel),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return this.getFallbackGreeting(scanResults, persona, riskLevel);
    }
  }

  /**
   * Generate fun security tip of the day
   */
  async generateSecurityTip(personaType = 'sage') {
    const persona = this.personas[personaType] || this.personas.sage;

    try {
      const prompt = `You are "${persona.name}" ${persona.emoji}, a ${persona.style} security expert.

Generate a practical, interesting security tip for developers. Make it:
- Actionable and specific
- Relevant to modern web development
- Slightly unexpected or lesser-known
- 2-3 sentences maximum
- In your ${persona.style} voice

Example topics: API security, authentication, secrets management, input validation, dependency security.

Tip:`;

      const tip = await this.gemini.queryGemini(prompt, { maxTokens: 120 });

      return {
        persona: persona.name,
        emoji: persona.emoji,
        tip: tip,
        category: this.categorizeTip(tip),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return this.getFallbackTip(persona);
    }
  }

  /**
   * Generate motivational security insight based on trends
   */
  async generateTrendInsight(currentScan, previousScan, personaType = 'coach') {
    const persona = this.personas[personaType] || this.personas.coach;

    try {
      const improvement = this.calculateImprovement(currentScan, previousScan);

      const prompt = `You are "${persona.name}" ${persona.emoji}, a ${persona.style} security advisor.

Compare these two security scans:
Current: ${this.countVulnerabilities(currentScan)} vulnerabilities, ${this.countCritical(currentScan)} critical
Previous: ${this.countVulnerabilities(previousScan)} vulnerabilities, ${this.countCritical(previousScan)} critical
Improvement: ${improvement}%

Generate a ${persona.style} insight (2 sentences) that:
- Celebrates progress if improving, encourages action if not
- Provides specific next steps
- Stays positive and actionable

Insight:`;

      const insight = await this.gemini.queryGemini(prompt, { maxTokens: 100 });

      return {
        persona: persona.name,
        emoji: persona.emoji,
        insight: insight,
        improvement: improvement,
        trend: improvement > 0 ? 'improving' : improvement < 0 ? 'needs_attention' : 'stable',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return this.getFallbackInsight(currentScan, previousScan, persona);
    }
  }

  /**
   * Generate quick action recommendations with personality
   */
  async generateQuickActions(scanResults, personaType = 'ninja') {
    const persona = this.personas[personaType] || this.personas.ninja;

    try {
      const criticalCount = this.countCritical(scanResults);
      const secretCount = this.countSecrets(scanResults);

      const prompt = `You are "${persona.name}" ${persona.emoji}, a ${persona.style} security expert.

Security status:
- ${criticalCount} critical issues
- ${secretCount} secrets exposed
- Risk: ${scanResults?.summary?.riskLevel || 'unknown'}

List 3 quick, actionable steps in your ${persona.style} voice. Format as:
1. [Action]
2. [Action]
3. [Action]

Keep each action brief (5-8 words), specific, and immediately actionable.`;

      const actions = await this.gemini.queryGemini(prompt, { maxTokens: 150 });

      const actionList = actions.split('\n')
        .filter(line => /^\d+\./.test(line.trim()))
        .map((line, i) => ({
          priority: i + 1,
          action: line.replace(/^\d+\.\s*/, '').trim(),
          icon: this.getActionIcon(i),
          personaStyle: persona.style
        }))
        .slice(0, 3);

      return {
        persona: persona.name,
        emoji: persona.emoji,
        actions: actionList,
        urgency: criticalCount > 0 ? 'high' : 'medium',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return this.getFallbackActions(scanResults, persona);
    }
  }

  /**
   * Generate fun security score commentary
   */
  async generateScoreCommentary(securityScore, personaType = 'detective') {
    const persona = this.personas[personaType] || this.personas.detective;

    try {
      const prompt = `You are "${persona.name}" ${persona.emoji}, a ${persona.style} security analyst.

The security score is ${securityScore}/100.

Provide a brief, ${persona.style} comment (1-2 sentences) about this score that:
- Interprets what it means
- Gives context (good/needs work/critical)
- Adds a touch of personality
- Ends with a specific suggestion

Commentary:`;

      const commentary = await this.gemini.queryGemini(prompt, { maxTokens: 100 });

      return {
        persona: persona.name,
        emoji: persona.emoji,
        score: securityScore,
        commentary: commentary,
        grade: this.calculateGrade(securityScore),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return this.getFallbackCommentary(securityScore, persona);
    }
  }

  /**
   * Helper: Count vulnerabilities
   */
  countVulnerabilities(scanResults) {
    if (!scanResults?.findings?.vulnerabilities) return 0;
    return scanResults.findings.vulnerabilities.length;
  }

  /**
   * Helper: Count secrets
   */
  countSecrets(scanResults) {
    if (!scanResults?.findings?.secrets) return 0;
    return scanResults.findings.secrets.length;
  }

  /**
   * Helper: Count critical issues
   */
  countCritical(scanResults) {
    if (!scanResults?.findings) return 0;

    let count = 0;
    Object.values(scanResults.findings).forEach(items => {
      if (Array.isArray(items)) {
        count += items.filter(item => item.severity === 'critical').length;
      }
    });

    return count;
  }

  /**
   * Helper: Determine mood based on risk level
   */
  determineMood(riskLevel) {
    const moods = {
      critical: 'alert',
      high: 'concerned',
      medium: 'cautious',
      low: 'confident',
      unknown: 'curious'
    };

    return moods[riskLevel] || 'neutral';
  }

  /**
   * Helper: Calculate improvement percentage
   */
  calculateImprovement(current, previous) {
    const currentCount = this.countVulnerabilities(current);
    const previousCount = this.countVulnerabilities(previous);

    if (previousCount === 0) return 0;

    return Math.round(((previousCount - currentCount) / previousCount) * 100);
  }

  /**
   * Helper: Categorize security tip
   */
  categorizeTip(tipText) {
    const text = tipText.toLowerCase();

    if (text.includes('api') || text.includes('endpoint')) return 'api-security';
    if (text.includes('secret') || text.includes('credential')) return 'secrets';
    if (text.includes('auth') || text.includes('password')) return 'authentication';
    if (text.includes('input') || text.includes('validation')) return 'input-validation';
    if (text.includes('dependency') || text.includes('package')) return 'dependencies';

    return 'general';
  }

  /**
   * Helper: Get action icon
   */
  getActionIcon(index) {
    const icons = ['🎯', '⚡', '🔧', '🚀', '✅'];
    return icons[index] || '📌';
  }

  /**
   * Helper: Calculate grade from score
   */
  calculateGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  /**
   * Fallback methods
   */
  getFallbackGreeting(scanResults, persona, riskLevel) {
    const greetings = {
      critical: `${persona.emoji} Alert! We've detected critical security issues that need immediate attention. Let's tackle them together.`,
      high: `${persona.emoji} Your security needs some work, but you're in good hands. Let's fix these high-priority issues first.`,
      medium: `${persona.emoji} Looking good! A few medium-priority items to address, but you're on the right track.`,
      low: `${persona.emoji} Excellent work! Your security posture is strong. Let's keep it that way.`,
      unknown: `${persona.emoji} Welcome back! Let's analyze your security status and keep your code protected.`
    };

    return {
      persona: persona.name,
      emoji: persona.emoji,
      message: greetings[riskLevel] || greetings.unknown,
      mood: this.determineMood(riskLevel),
      timestamp: new Date().toISOString()
    };
  }

  getFallbackTip(persona) {
    const tips = [
      'Always validate and sanitize user input before processing - it\'s your first line of defense against injection attacks.',
      'Rotate your API keys and secrets regularly. Set calendar reminders to make it a habit.',
      'Use environment variables for sensitive data, never commit secrets to version control.',
      'Keep dependencies updated - 80% of vulnerabilities come from outdated packages.',
      'Implement rate limiting on your APIs to prevent abuse and DoS attacks.'
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    return {
      persona: persona.name,
      emoji: persona.emoji,
      tip: randomTip,
      category: this.categorizeTip(randomTip),
      timestamp: new Date().toISOString()
    };
  }

  getFallbackInsight(current, previous, persona) {
    const improvement = this.calculateImprovement(current, previous);

    let message;
    if (improvement > 0) {
      message = `Great progress! You've reduced vulnerabilities by ${improvement}%. Keep this momentum going with regular security scans.`;
    } else if (improvement < 0) {
      message = `We've detected some new security issues. Don't worry - let's address them systematically, starting with the critical ones.`;
    } else {
      message = `Your security status is stable. Stay vigilant and continue following security best practices.`;
    }

    return {
      persona: persona.name,
      emoji: persona.emoji,
      insight: message,
      improvement: improvement,
      trend: improvement > 0 ? 'improving' : improvement < 0 ? 'needs_attention' : 'stable',
      timestamp: new Date().toISOString()
    };
  }

  getFallbackActions(scanResults, persona) {
    const criticalCount = this.countCritical(scanResults);
    const secretCount = this.countSecrets(scanResults);

    const actions = [];

    if (criticalCount > 0) {
      actions.push({
        priority: 1,
        action: `Fix ${criticalCount} critical vulnerabilities immediately`,
        icon: '🎯',
        personaStyle: persona.style
      });
    }

    if (secretCount > 0) {
      actions.push({
        priority: actions.length + 1,
        action: `Secure ${secretCount} exposed secrets`,
        icon: '⚡',
        personaStyle: persona.style
      });
    }

    actions.push({
      priority: actions.length + 1,
      action: 'Review and update security policies',
      icon: '🔧',
      personaStyle: persona.style
    });

    return {
      persona: persona.name,
      emoji: persona.emoji,
      actions: actions.slice(0, 3),
      urgency: criticalCount > 0 ? 'high' : 'medium',
      timestamp: new Date().toISOString()
    };
  }

  getFallbackCommentary(score, persona) {
    let commentary;

    if (score >= 80) {
      commentary = `${persona.emoji} Excellent! Your score of ${score}/100 shows strong security practices. Keep maintaining these standards.`;
    } else if (score >= 60) {
      commentary = `${persona.emoji} Good work with ${score}/100, but there's room for improvement. Focus on addressing high-priority issues.`;
    } else if (score >= 40) {
      commentary = `${persona.emoji} Your ${score}/100 score indicates security gaps. Let's prioritize fixes to strengthen your defenses.`;
    } else {
      commentary = `${persona.emoji} Critical attention needed! ${score}/100 requires immediate action. Start with the most severe vulnerabilities.`;
    }

    return {
      persona: persona.name,
      emoji: persona.emoji,
      score: score,
      commentary: commentary,
      grade: this.calculateGrade(score),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get random persona for variety
   */
  getRandomPersona() {
    const types = Object.keys(this.personas);
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * Health check
   */
  async getHealth() {
    const geminiHealth = await this.gemini.getHealth();
    const gemmaHealth = await this.gemma.getHealth();

    return {
      status: geminiHealth.status === 'healthy' || gemmaHealth.status === 'healthy' ? 'healthy' : 'degraded',
      service: this.name,
      personas: Object.keys(this.personas),
      aiEngines: {
        gemini: geminiHealth.status,
        gemma: gemmaHealth.status
      },
      capabilities: [
        'Personalized Dashboard Greetings',
        'Security Tips & Insights',
        'Trend Analysis Commentary',
        'Quick Action Recommendations',
        'Score Commentary with Personality'
      ]
    };
  }
}

module.exports = SecurityPersona;
