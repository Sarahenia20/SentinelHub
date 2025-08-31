const axios = require('axios');

/**
 * 🐙 GitHub Security Advisory Integration
 * Access GitHub's comprehensive security advisory database
 * 
 * API Reference: https://docs.github.com/en/rest/security-advisories
 * - Free API with rate limits (5000 requests/hour)
 * - No API key required for public data
 * - Optional: Use GitHub token for higher rate limits
 */
class GitHubAdvisory {
  constructor(githubToken = null) {
    this.name = 'GitHub Security Advisory';
    this.version = '1.0.0';
    this.baseURL = 'https://api.github.com';
    this.timeout = 10000;
    this.githubToken = githubToken;
    
    // Initialize axios instance
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'SentinelHub-PasteScanner/1.0.0',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    // Add auth header if token is provided
    if (this.githubToken) {
      this.api.defaults.headers['Authorization'] = `Bearer ${this.githubToken}`;
    }

    console.log(`✅ ${this.name} v${this.version} initialized`);
  }

  /**
   * Search security advisories by keywords
   * @param {Array<string>} keywords - Security keywords to search
   * @returns {Array} Relevant security advisories
   */
  async searchAdvisories(keywords) {
    if (!keywords || keywords.length === 0) {
      return [];
    }

    console.log(`🐙 Searching GitHub advisories for: ${keywords.join(', ')}`);
    
    const advisoryResults = [];
    const uniqueAdvisories = new Set();

    for (const keyword of keywords) {
      try {
        const results = await this.searchAdvisoryByKeyword(keyword);
        
        results.forEach(advisory => {
          if (!uniqueAdvisories.has(advisory.ghsa_id) && this.isRelevantAdvisory(advisory, keyword)) {
            uniqueAdvisories.add(advisory.ghsa_id);
            advisoryResults.push({
              ...this.formatAdvisoryData(advisory),
              matchedKeyword: keyword,
              source: 'github-advisory'
            });
          }
        });
      } catch (error) {
        console.warn(`⚠️ Failed to search advisories for "${keyword}":`, error.message);
      }
    }

    // Sort by severity and date
    advisoryResults.sort((a, b) => {
      const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      const aSeverity = severityOrder[a.severity] || 0;
      const bSeverity = severityOrder[b.severity] || 0;
      
      if (aSeverity !== bSeverity) {
        return bSeverity - aSeverity; // Sort by severity first
      }
      
      return new Date(b.published_at) - new Date(a.published_at); // Then by date
    });

    console.log(`   ✓ Found ${advisoryResults.length} relevant advisories`);
    return advisoryResults.slice(0, 15); // Limit results
  }

  /**
   * Search advisories by keyword
   */
  async searchAdvisoryByKeyword(keyword) {
    try {
      const searchQuery = encodeURIComponent(keyword);
      const response = await this.api.get(`/advisories`, {
        params: {
          type: 'reviewed', // Only reviewed advisories
          sort: 'published',
          direction: 'desc',
          per_page: 30,
          // Use keyword in ecosystem or affects search
          ecosystem: this.mapKeywordToEcosystem(keyword)
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        return response.data.filter(advisory => 
          this.matchesKeyword(advisory, keyword)
        );
      }
      
      return [];
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get specific advisory details
   * @param {string} ghsaId - GitHub Security Advisory ID
   * @returns {Object} Detailed advisory information
   */
  async getAdvisoryDetails(ghsaId) {
    try {
      console.log(`🔍 Fetching advisory details for ${ghsaId}`);
      
      const response = await this.api.get(`/advisories/${ghsaId}`);
      return this.formatAdvisoryData(response.data);
    } catch (error) {
      console.warn(`⚠️ Failed to get advisory ${ghsaId}:`, error.message);
      return null;
    }
  }

  /**
   * Get advisories for specific ecosystem
   * @param {string} ecosystem - Package ecosystem (npm, pypi, rubygems, etc.)
   * @param {number} limit - Number of advisories to fetch
   * @returns {Array} Recent advisories for ecosystem
   */
  async getEcosystemAdvisories(ecosystem, limit = 10) {
    try {
      console.log(`📦 Fetching ${ecosystem} advisories...`);
      
      const response = await this.api.get('/advisories', {
        params: {
          ecosystem: ecosystem.toLowerCase(),
          type: 'reviewed',
          sort: 'published',
          direction: 'desc',
          per_page: limit
        }
      });
      
      return response.data.map(advisory => this.formatAdvisoryData(advisory));
    } catch (error) {
      console.warn(`⚠️ Failed to fetch ${ecosystem} advisories:`, error.message);
      return [];
    }
  }

  /**
   * Format advisory data into consistent structure
   */
  formatAdvisoryData(rawAdvisory) {
    return {
      id: rawAdvisory.ghsa_id,
      cve_id: rawAdvisory.cve_id || null,
      title: rawAdvisory.summary || 'No title available',
      description: rawAdvisory.description || 'No description available',
      severity: rawAdvisory.severity?.toLowerCase() || 'unknown',
      cvss_score: this.extractCVSSScore(rawAdvisory),
      cvss_vector: rawAdvisory.cvss?.vector_string || null,
      published_at: rawAdvisory.published_at,
      updated_at: rawAdvisory.updated_at,
      withdrawn_at: rawAdvisory.withdrawn_at || null,
      vulnerabilities: this.extractVulnerabilities(rawAdvisory),
      affected_packages: this.extractAffectedPackages(rawAdvisory),
      references: this.extractReferences(rawAdvisory),
      credits: this.extractCredits(rawAdvisory),
      cwe_ids: rawAdvisory.cwe_ids || [],
      github_reviewed: rawAdvisory.github_reviewed || false,
      url: rawAdvisory.html_url || `https://github.com/advisories/${rawAdvisory.ghsa_id}`
    };
  }

  /**
   * Extract CVSS score from advisory
   */
  extractCVSSScore(advisory) {
    if (advisory.cvss?.score) {
      return parseFloat(advisory.cvss.score);
    }
    
    // Fallback severity mapping
    const severityScores = {
      'critical': 9.5,
      'high': 7.5,
      'medium': 5.0,
      'low': 2.5
    };
    
    return severityScores[advisory.severity?.toLowerCase()] || null;
  }

  /**
   * Extract vulnerability information
   */
  extractVulnerabilities(advisory) {
    if (!advisory.vulnerabilities) return [];
    
    return advisory.vulnerabilities.map(vuln => ({
      package: {
        ecosystem: vuln.package?.ecosystem || 'unknown',
        name: vuln.package?.name || 'unknown'
      },
      vulnerable_version_range: vuln.vulnerable_version_range || null,
      patched_versions: vuln.patched_versions || [],
      vulnerable_functions: vuln.vulnerable_functions || [],
      database_specific: vuln.database_specific || {}
    }));
  }

  /**
   * Extract affected packages information
   */
  extractAffectedPackages(advisory) {
    const packages = new Set();
    
    if (advisory.vulnerabilities) {
      advisory.vulnerabilities.forEach(vuln => {
        if (vuln.package?.name) {
          packages.add(`${vuln.package.ecosystem}:${vuln.package.name}`);
        }
      });
    }
    
    return Array.from(packages);
  }

  /**
   * Extract references from advisory
   */
  extractReferences(advisory) {
    const references = [];
    
    if (advisory.references && Array.isArray(advisory.references)) {
      advisory.references.forEach(ref => {
        references.push({
          url: ref.url,
          type: ref.type || 'reference'
        });
      });
    }
    
    return references;
  }

  /**
   * Extract credits information
   */
  extractCredits(advisory) {
    if (!advisory.credits || !Array.isArray(advisory.credits)) {
      return [];
    }
    
    return advisory.credits.map(credit => ({
      login: credit.login || null,
      type: credit.type || 'unknown'
    }));
  }

  /**
   * Check if advisory matches keyword
   */
  matchesKeyword(advisory, keyword) {
    const searchText = (
      (advisory.summary || '') + ' ' +
      (advisory.description || '') + ' ' +
      (advisory.cwe_ids || []).join(' ') + ' ' +
      JSON.stringify(advisory.vulnerabilities || [])
    ).toLowerCase();
    
    const keywordLower = keyword.toLowerCase();
    
    // Direct match
    if (searchText.includes(keywordLower)) {
      return true;
    }
    
    // Related terms match
    const relatedTerms = this.getRelatedTerms(keywordLower);
    return relatedTerms.some(term => searchText.includes(term));
  }

  /**
   * Check if advisory is relevant
   */
  isRelevantAdvisory(advisory, keyword) {
    // Skip withdrawn advisories
    if (advisory.withdrawn_at) {
      return false;
    }
    
    // Prefer GitHub reviewed advisories
    if (advisory.github_reviewed === false && advisory.severity === 'low') {
      return false;
    }
    
    return true;
  }

  /**
   * Map keyword to ecosystem for better search
   */
  mapKeywordToEcosystem(keyword) {
    const ecosystemMap = {
      'javascript': 'npm',
      'node': 'npm',
      'react': 'npm',
      'express': 'npm',
      'python': 'pypi',
      'django': 'pypi',
      'flask': 'pypi',
      'ruby': 'rubygems',
      'rails': 'rubygems',
      'java': 'maven',
      'spring': 'maven',
      'php': 'packagist',
      'composer': 'packagist',
      'go': 'go',
      'rust': 'crates.io',
      'cargo': 'crates.io'
    };
    
    return ecosystemMap[keyword.toLowerCase()] || null;
  }

  /**
   * Get related terms for better matching
   */
  getRelatedTerms(keyword) {
    const termMap = {
      'sql injection': ['sqli', 'sql inject', 'database'],
      'xss': ['cross-site scripting', 'script injection', 'dom'],
      'csrf': ['cross-site request forgery', 'request forgery'],
      'code injection': ['remote code execution', 'rce', 'command'],
      'path traversal': ['directory traversal', 'file'],
      'authentication': ['auth', 'login', 'session'],
      'authorization': ['access control', 'privilege'],
      'deserialization': ['serialize', 'pickle', 'marshal']
    };
    
    return termMap[keyword] || [];
  }

  /**
   * Get trending security advisories
   */
  async getTrendingAdvisories(limit = 10) {
    try {
      console.log('🔥 Fetching trending security advisories...');
      
      const response = await this.api.get('/advisories', {
        params: {
          type: 'reviewed',
          sort: 'published',
          direction: 'desc',
          per_page: limit,
          severity: 'high,critical' // Focus on high/critical issues
        }
      });
      
      return response.data.map(advisory => this.formatAdvisoryData(advisory));
    } catch (error) {
      console.warn('⚠️ Failed to fetch trending advisories:', error.message);
      return [];
    }
  }

  /**
   * Get advisory statistics
   */
  async getAdvisoryStats() {
    try {
      const stats = {
        totalCritical: 0,
        totalHigh: 0,
        totalMedium: 0,
        totalLow: 0,
        recentAdvisories: [],
        topEcosystems: {}
      };

      // Get recent advisories for statistics
      const recentAdvisories = await this.getTrendingAdvisories(50);
      stats.recentAdvisories = recentAdvisories.slice(0, 5);

      // Count by severity and ecosystem
      recentAdvisories.forEach(advisory => {
        // Count severity
        switch (advisory.severity) {
          case 'critical': stats.totalCritical++; break;
          case 'high': stats.totalHigh++; break;
          case 'medium': stats.totalMedium++; break;
          case 'low': stats.totalLow++; break;
        }

        // Count ecosystems
        advisory.vulnerabilities.forEach(vuln => {
          const ecosystem = vuln.package?.ecosystem;
          if (ecosystem) {
            stats.topEcosystems[ecosystem] = (stats.topEcosystems[ecosystem] || 0) + 1;
          }
        });
      });

      return stats;
    } catch (error) {
      console.warn('⚠️ Failed to get advisory stats:', error.message);
      return null;
    }
  }

  /**
   * Health check for GitHub Advisory service
   */
  async getHealth() {
    try {
      // Test API connectivity
      await this.api.get('/advisories', { 
        params: { per_page: 1 },
        timeout: 5000 
      });
      
      return {
        status: 'healthy',
        name: this.name,
        version: this.version,
        apiUrl: this.baseURL,
        authenticated: !!this.githubToken,
        capabilities: [
          'Security Advisory Search',
          'CVE Cross-referencing',
          'Package Vulnerability Tracking',
          'Ecosystem-specific Advisories',
          'CVSS Score Analysis',
          'Trending Security Issues'
        ]
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        name: this.name
      };
    }
  }
}

module.exports = GitHubAdvisory;