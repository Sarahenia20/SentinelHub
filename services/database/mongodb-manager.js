const { MongoClient } = require('mongodb');

/**
 * MongoDB Database Manager for SentinelHub
 * Manages storage of scan results, conversations, reports, and analytics data
 * Uses MongoDB Atlas for persistent, scalable storage
 */
class MongoDBManager {
  constructor() {
    this.name = 'SentinelHub MongoDB Manager';
    this.version = '1.0.0';
    
    this.client = null;
    this.db = null;
    this.isConnected = false;
    
    // Collection names
    this.collections = {
      pipelines: 'security_pipelines',
      conversations: 'ai_conversations',
      reports: 'reports', // Main reports collection for visualization and emailing
      security_reports: 'security_reports', // Detailed security reports
      analytics: 'platform_analytics',
      users: 'users',
      settings: 'system_settings'
    };
    
    this.initializeConnection();
    console.log(`${this.name} v${this.version} initialized`);
  }
  
  /**
   * Initialize MongoDB connection
   */
  async initializeConnection() {
    try {
      const uri = process.env.MONGODB_URI;
      const dbName = process.env.MONGODB_DB_NAME || 'sentinelhub_security';
      
      if (!uri) {
        throw new Error('MONGODB_URI not configured');
      }
      
      this.client = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 30000,  // Increased to 30 seconds
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,  // Add connection timeout
        family: 4,  // Force IPv4 to avoid DNS issues
        retryWrites: true,
        retryReads: true,
      });
      
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.isConnected = true;
      
      console.log(`Connected to MongoDB Atlas: ${dbName}`);
      
      // Initialize collections and indexes
      await this.initializeCollections();
      
    } catch (error) {
      console.error('MongoDB connection failed:', error.message);
      this.isConnected = false;
      this.setupMemoryFallback();
    }
  }
  
  /**
   * Initialize collections and create indexes for performance
   */
  async initializeCollections() {
    try {
      // Create indexes for better query performance
      
      // Pipeline results indexes
      await this.db.collection(this.collections.pipelines).createIndex({ 
        pipelineId: 1 
      });
      await this.db.collection(this.collections.pipelines).createIndex({ 
        'scanType': 1, 'timestamp': -1 
      });
      await this.db.collection(this.collections.pipelines).createIndex({ 
        'scanResults.summary.riskLevel': 1, 'timestamp': -1 
      });
      
      // Conversations indexes
      await this.db.collection(this.collections.conversations).createIndex({ 
        sessionId: 1 
      });
      await this.db.collection(this.collections.conversations).createIndex({ 
        'createdAt': 1 
      }, { expireAfterSeconds: 7200 }); // Auto-expire conversations after 2 hours
      
      // Reports indexes
      await this.db.collection(this.collections.reports).createIndex({ 
        reportId: 1 
      });
      await this.db.collection(this.collections.reports).createIndex({ 
        'type': 1, 'createdAt': -1 
      });
      
      // Analytics indexes
      await this.db.collection(this.collections.analytics).createIndex({ 
        'timestamp': -1 
      });
      
      console.log('Database indexes created successfully');
      
    } catch (error) {
      console.warn('Failed to create indexes:', error.message);
    }
  }
  
  /**
   * Fallback to memory storage if MongoDB unavailable
   */
  setupMemoryFallback() {
    this.memoryStore = {
      pipelines: new Map(),
      conversations: new Map(),
      reports: new Map(),
      analytics: new Map()
    };
    console.log('Using memory storage as MongoDB fallback');
  }
  
  /**
   * Store complete pipeline results
   */
  async storePipelineResults(pipelineData) {
    const timestamp = new Date();
    
    const document = {
      pipelineId: pipelineData.pipelineId,
      scanType: pipelineData.scanType,
      scanResults: pipelineData.scanResults,
      aiInsights: pipelineData.aiInsights,
      conversationSession: pipelineData.conversationSession,
      metrics: pipelineData.metrics,
      status: pipelineData.status,
      timestamp: timestamp,
      storedAt: timestamp,
      version: this.version
    };
    
    try {
      if (this.isConnected) {
        const result = await this.db.collection(this.collections.pipelines)
          .insertOne(document);
        
        console.log(`Pipeline results stored: ${pipelineData.pipelineId}`);
        
        return {
          stored: true,
          pipelineId: pipelineData.pipelineId,
          documentId: result.insertedId,
          timestamp: timestamp.toISOString()
        };
        
      } else {
        this.memoryStore.pipelines.set(pipelineData.pipelineId, document);
        return {
          stored: true,
          pipelineId: pipelineData.pipelineId,
          timestamp: timestamp.toISOString(),
          fallback: true
        };
      }
      
    } catch (error) {
      console.error('Failed to store pipeline results:', error.message);
      return { stored: false, error: error.message };
    }
  }
  
  /**
   * Retrieve pipeline results
   */
  async getPipelineResults(pipelineId) {
    try {
      if (this.isConnected) {
        const result = await this.db.collection(this.collections.pipelines)
          .findOne({ pipelineId: pipelineId });
        return result;
      } else {
        return this.memoryStore.pipelines.get(pipelineId) || null;
      }
    } catch (error) {
      console.error('Failed to retrieve pipeline results:', error.message);
      return null;
    }
  }
  
  /**
   * Store conversation session
   */
  async storeConversationSession(sessionId, conversationData) {
    const timestamp = new Date();
    
    const document = {
      sessionId: sessionId,
      messages: conversationData.messages || [],
      scanContext: conversationData.scanContext,
      userProfile: conversationData.userProfile,
      metadata: conversationData.metadata || {},
      createdAt: timestamp,
      lastUpdated: timestamp,
      isActive: true
    };
    
    try {
      if (this.isConnected) {
        await this.db.collection(this.collections.conversations)
          .insertOne(document);
        
        console.log(`Conversation session stored: ${sessionId}`);
        return { stored: true, sessionId };
        
      } else {
        this.memoryStore.conversations.set(sessionId, document);
        return { stored: true, sessionId, fallback: true };
      }
      
    } catch (error) {
      console.error('Failed to store conversation:', error.message);
      return { stored: false, error: error.message };
    }
  }
  
  /**
   * Update conversation session with new messages
   */
  async updateConversationSession(sessionId, newMessages) {
    try {
      if (this.isConnected) {
        const result = await this.db.collection(this.collections.conversations)
          .updateOne(
            { sessionId: sessionId },
            { 
              $push: { messages: { $each: newMessages } },
              $set: { lastUpdated: new Date() }
            }
          );
        
        if (result.matchedCount === 0) {
          return { updated: false, error: 'Session not found' };
        }
        
        console.log(`Conversation updated: ${sessionId}`);
        return { updated: true, sessionId };
        
      } else {
        const conversation = this.memoryStore.conversations.get(sessionId);
        if (!conversation) {
          return { updated: false, error: 'Session not found' };
        }
        
        conversation.messages = [...conversation.messages, ...newMessages];
        conversation.lastUpdated = new Date();
        this.memoryStore.conversations.set(sessionId, conversation);
        
        return { updated: true, sessionId, fallback: true };
      }
      
    } catch (error) {
      console.error('Failed to update conversation:', error.message);
      return { updated: false, error: error.message };
    }
  }
  
  /**
   * Get conversation session
   */
  async getConversationSession(sessionId) {
    try {
      if (this.isConnected) {
        return await this.db.collection(this.collections.conversations)
          .findOne({ sessionId: sessionId });
      } else {
        return this.memoryStore.conversations.get(sessionId) || null;
      }
    } catch (error) {
      console.error('Failed to retrieve conversation:', error.message);
      return null;
    }
  }
  
  /**
   * Store analytics and metrics data
   */
  async storeAnalytics(analyticsData) {
    const timestamp = new Date();
    const analyticsId = `analytics_${timestamp.getTime()}`;
    
    const document = {
      analyticsId: analyticsId,
      type: analyticsData.type || 'general',
      data: analyticsData,
      timestamp: timestamp,
      version: this.version
    };
    
    try {
      if (this.isConnected) {
        await this.db.collection(this.collections.analytics)
          .insertOne(document);
        
        return { stored: true, analyticsId };
        
      } else {
        this.memoryStore.analytics.set(analyticsId, document);
        return { stored: true, analyticsId, fallback: true };
      }
      
    } catch (error) {
      console.error('Failed to store analytics:', error.message);
      return { stored: false, error: error.message };
    }
  }
  
  /**
   * Store email-ready security report with AI advice and vulnerabilities
   */
  async storeSecurityReport(scanResults, aiAdvice, options = {}) {
    const timestamp = new Date();
    const reportId = `report_${timestamp.getTime()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Extract and categorize vulnerabilities
    const vulnerabilities = this.extractVulnerabilities(scanResults);
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
    
    const reportDocument = {
      reportId: reportId,
      date: timestamp,
      scanType: scanResults.type || 'security-scan',
      target: options.target || 'Application',
      
      // Summary for gatekeeping table
      summary: {
        totalVulnerabilities: vulnerabilities.length,
        criticalCount: criticalCount,
        highCount: highCount,
        mediumCount: mediumCount,
        riskLevel: this.calculateRiskLevel(criticalCount, highCount, vulnerabilities.length),
        scanDuration: scanResults.metrics?.scanDuration || 0
      },
      
      // AI Analysis and Advice
      aiAdvice: {
        overview: aiAdvice.overview || aiAdvice.message || 'Security analysis completed',
        recommendations: aiAdvice.recommendations || [],
        priorityActions: aiAdvice.priorityActions || [],
        complianceNotes: aiAdvice.complianceNotes || [],
        riskAssessment: aiAdvice.riskAssessment || 'Medium'
      },
      
      // Detailed vulnerabilities for email report
      vulnerabilities: vulnerabilities.map(vuln => ({
        id: vuln.ruleId || vuln.id,
        type: vuln.type || 'Security Issue',
        severity: vuln.severity || 'medium',
        message: vuln.message || vuln.description,
        file: vuln.file || vuln.location,
        line: vuln.line || 0,
        category: vuln.category || 'general',
        cwe: vuln.cwe || null,
        recommendation: vuln.recommendation || 'Review and remediate',
        confidence: vuln.confidence || 0.8
      })),
      
      // Email metadata
      emailStatus: {
        sent: false,
        sentAt: null,
        recipient: options.emailRecipient || null,
        detailedReportSent: false
      },
      
      // Visualization metadata
      visualization: {
        displayed: false,
        acknowledged: false,
        gatekeepingStatus: 'pending'
      },
      
      // Audit trail
      createdAt: timestamp,
      createdBy: options.userId || 'system',
      version: this.version
    };
    
    try {
      if (this.isConnected) {
        const result = await this.db.collection(this.collections.reports)
          .insertOne(reportDocument);
        
        console.log(`Security report stored for emailing: ${reportId}`);
        
        return {
          success: true,
          reportId: reportId,
          documentId: result.insertedId,
          vulnerabilityCount: vulnerabilities.length,
          riskLevel: reportDocument.summary.riskLevel,
          timestamp: timestamp.toISOString()
        };
        
      } else {
        this.memoryStore.reports.set(reportId, reportDocument);
        return {
          success: true,
          reportId: reportId,
          vulnerabilityCount: vulnerabilities.length,
          riskLevel: reportDocument.summary.riskLevel,
          timestamp: timestamp.toISOString(),
          fallback: true
        };
      }
      
    } catch (error) {
      console.error('Failed to store security report:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Extract and normalize vulnerabilities from scan results
   */
  extractVulnerabilities(scanResults) {
    const vulnerabilities = [];
    
    if (!scanResults.findings) return vulnerabilities;
    
    // Process different types of findings
    Object.entries(scanResults.findings).forEach(([category, items]) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          vulnerabilities.push({
            ...item,
            category: category,
            source: item.source || 'security-scan'
          });
        });
      }
    });
    
    // Sort by severity
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
    return vulnerabilities.sort((a, b) => 
      (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
    );
  }
  
  /**
   * Calculate overall risk level
   */
  calculateRiskLevel(critical, high, total) {
    if (critical > 0) return 'critical';
    if (high > 2) return 'high';
    if (high > 0 || total > 5) return 'medium';
    if (total > 0) return 'low';
    return 'clean';
  }
  
  /**
   * Get reports for gatekeeping table visualization
   */
  async getReportsForTable(limit = 20, filters = {}) {
    try {
      if (this.isConnected) {
        const query = this.buildReportsQuery(filters);
        
        const reports = await this.db.collection(this.collections.reports)
          .find(query)
          .sort({ date: -1 })
          .limit(limit)
          .toArray();
        
        return reports.map(report => ({
          id: report.reportId,
          date: report.date,
          target: report.target,
          totalVulnerabilities: report.summary.totalVulnerabilities,
          criticalCount: report.summary.criticalCount,
          highCount: report.summary.highCount,
          mediumCount: report.summary.mediumCount,
          riskLevel: report.summary.riskLevel,
          emailSent: report.emailStatus.sent,
          gatekeepingStatus: report.visualization.gatekeepingStatus,
          aiAdvice: report.aiAdvice.overview.substring(0, 100) + '...'
        }));
        
      } else {
        const reports = Array.from(this.memoryStore.reports.values())
          .slice(0, limit);
        
        return reports.map(report => ({
          id: report.reportId,
          date: report.date || report.createdAt,
          target: report.target || 'Unknown',
          totalVulnerabilities: report.summary?.totalVulnerabilities || 0,
          riskLevel: report.summary?.riskLevel || 'unknown',
          emailSent: false,
          gatekeepingStatus: 'pending'
        }));
      }
      
    } catch (error) {
      console.error('Failed to get reports for table:', error.message);
      return [];
    }
  }
  
  /**
   * Mark report as acknowledged in gatekeeping
   */
  async acknowledgeReport(reportId, userId) {
    try {
      if (this.isConnected) {
        const result = await this.db.collection(this.collections.reports)
          .updateOne(
            { reportId: reportId },
            { 
              $set: { 
                'visualization.acknowledged': true,
                'visualization.acknowledgedBy': userId,
                'visualization.acknowledgedAt': new Date(),
                'visualization.gatekeepingStatus': 'acknowledged'
              }
            }
          );
        
        return { success: result.modifiedCount > 0 };
        
      } else {
        const report = this.memoryStore.reports.get(reportId);
        if (report) {
          report.visualization.acknowledged = true;
          report.visualization.gatekeepingStatus = 'acknowledged';
          return { success: true, fallback: true };
        }
        return { success: false };
      }
      
    } catch (error) {
      console.error('Failed to acknowledge report:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get detailed report for email sending
   */
  async getDetailedReport(reportId) {
    try {
      if (this.isConnected) {
        return await this.db.collection(this.collections.reports)
          .findOne({ reportId: reportId });
      } else {
        return this.memoryStore.reports.get(reportId) || null;
      }
    } catch (error) {
      console.error('Failed to get detailed report:', error.message);
      return null;
    }
  }
  
  /**
   * Build query for reports filtering
   */
  buildReportsQuery(filters) {
    const query = {};
    
    if (filters.riskLevel) {
      query['summary.riskLevel'] = filters.riskLevel;
    }
    
    if (filters.dateFrom || filters.dateTo) {
      query.date = {};
      if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.date.$lte = new Date(filters.dateTo);
    }
    
    if (filters.emailSent !== undefined) {
      query['emailStatus.sent'] = filters.emailSent;
    }
    
    if (filters.acknowledged !== undefined) {
      query['visualization.acknowledged'] = filters.acknowledged;
    }
    
    return query;
  }

  /**
   * Store report data (legacy method, keeping for compatibility)
   */
  async storeReport(reportData) {
    const timestamp = new Date();
    const reportId = `report_${timestamp.getTime()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const document = {
      reportId: reportId,
      type: reportData.type || 'security-report',
      title: reportData.title || 'Security Analysis Report',
      data: reportData,
      createdAt: timestamp,
      version: this.version,
      isPublic: reportData.isPublic || false
    };
    
    try {
      if (this.isConnected) {
        await this.db.collection(this.collections.reports)
          .insertOne(document);
        
        console.log(`Report stored: ${reportId}`);
        return { stored: true, reportId };
        
      } else {
        this.memoryStore.reports.set(reportId, document);
        return { stored: true, reportId, fallback: true };
      }
      
    } catch (error) {
      console.error('Failed to store report:', error.message);
      return { stored: false, error: error.message };
    }
  }
  
  /**
   * Get stored report
   */
  async getReport(reportId) {
    try {
      if (this.isConnected) {
        return await this.db.collection(this.collections.reports)
          .findOne({ reportId: reportId });
      } else {
        return this.memoryStore.reports.get(reportId) || null;
      }
    } catch (error) {
      console.error('Failed to retrieve report:', error.message);
      return null;
    }
  }
  
  /**
   * Get recent pipeline results for dashboard
   */
  async getRecentPipelines(limit = 10, scanType = null) {
    try {
      if (this.isConnected) {
        const query = scanType ? { scanType } : {};
        
        const pipelines = await this.db.collection(this.collections.pipelines)
          .find(query)
          .sort({ timestamp: -1 })
          .limit(limit)
          .toArray();
        
        return pipelines;
        
      } else {
        let pipelines = Array.from(this.memoryStore.pipelines.values());
        if (scanType) {
          pipelines = pipelines.filter(p => p.scanType === scanType);
        }
        return pipelines.slice(0, limit);
      }
      
    } catch (error) {
      console.error('Failed to get recent pipelines:', error.message);
      return [];
    }
  }
  
  /**
   * Get security metrics for dashboard
   */
  async getSecurityMetrics(timeRange = '7d') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      if (this.isConnected) {
        const metrics = await this.db.collection(this.collections.pipelines)
          .aggregate([
            { $match: { timestamp: { $gte: timeFilter } } },
            {
              $group: {
                _id: null,
                totalScans: { $sum: 1 },
                avgExecutionTime: { $avg: '$metrics.totalDuration' },
                riskLevels: { $push: '$scanResults.summary.riskLevel' },
                scanTypes: { $push: '$scanType' }
              }
            }
          ])
          .toArray();
        
        const result = metrics[0] || {};
        
        // Count risk levels
        const riskCounts = this.countRiskLevels(result.riskLevels || []);
        
        return {
          totalScans: result.totalScans || 0,
          avgExecutionTime: Math.round(result.avgExecutionTime || 0),
          criticalIssues: riskCounts.critical,
          highIssues: riskCounts.high,
          mediumIssues: riskCounts.medium,
          lowIssues: riskCounts.low,
          securityTrend: await this.calculateSecurityTrend(),
          lastUpdated: new Date().toISOString()
        };
        
      } else {
        return this.getMemoryMetrics();
      }
      
    } catch (error) {
      console.error('Failed to get security metrics:', error.message);
      return this.getDefaultMetrics();
    }
  }
  
  /**
   * Get dashboard analytics data
   */
  async getDashboardAnalytics() {
    try {
      const [recentPipelines, securityMetrics, reportCount] = await Promise.all([
        this.getRecentPipelines(50),
        this.getSecurityMetrics(),
        this.getReportCount()
      ]);
      
      return {
        overview: {
          totalScans: securityMetrics.totalScans,
          criticalFindings: securityMetrics.criticalIssues,
          avgScanTime: securityMetrics.avgExecutionTime,
          securityScore: this.calculateSecurityScore(recentPipelines)
        },
        trends: {
          scanVolume: this.calculateScanTrend(recentPipelines),
          riskTrend: await this.calculateSecurityTrend(),
          complianceStatus: this.calculateComplianceStatus(recentPipelines)
        },
        recentActivity: recentPipelines.slice(0, 10).map(p => ({
          pipelineId: p.pipelineId,
          scanType: p.scanType,
          riskLevel: p.scanResults?.summary?.riskLevel || 'unknown',
          timestamp: p.timestamp,
          findings: this.countFindings(p.scanResults)
        })),
        reports: {
          totalReports: reportCount,
          canExport: true
        }
      };
      
    } catch (error) {
      console.error('Failed to get dashboard analytics:', error.message);
      return this.getDefaultDashboardAnalytics();
    }
  }
  
  /**
   * Search pipeline results
   */
  async searchPipelines(query, filters = {}) {
    try {
      if (this.isConnected) {
        const searchQuery = this.buildSearchQuery(query, filters);
        
        const results = await this.db.collection(this.collections.pipelines)
          .find(searchQuery)
          .sort({ timestamp: -1 })
          .limit(50)
          .toArray();
        
        return results;
        
      } else {
        // Simple memory search
        const pipelines = Array.from(this.memoryStore.pipelines.values());
        return pipelines.filter(p => 
          p.scanType.includes(query) || 
          p.pipelineId.includes(query)
        ).slice(0, 50);
      }
      
    } catch (error) {
      console.error('Failed to search pipelines:', error.message);
      return [];
    }
  }
  
  /**
   * Helper methods
   */
  getTimeFilter(timeRange) {
    const now = new Date();
    const timeMap = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    return new Date(now.getTime() - (timeMap[timeRange] || timeMap['7d']));
  }
  
  countRiskLevels(riskLevels) {
    return {
      critical: riskLevels.filter(r => r === 'critical').length,
      high: riskLevels.filter(r => r === 'high').length,
      medium: riskLevels.filter(r => r === 'medium').length,
      low: riskLevels.filter(r => r === 'low').length
    };
  }
  
  countFindings(scanResults) {
    if (!scanResults?.findings) return 0;
    
    return Object.values(scanResults.findings).reduce((total, items) => {
      return total + (Array.isArray(items) ? items.length : 0);
    }, 0);
  }
  
  async calculateSecurityTrend() {
    // Simple implementation - can be enhanced
    return 'improving';
  }
  
  calculateSecurityScore(pipelines) {
    if (pipelines.length === 0) return 0;
    
    const scores = pipelines.map(p => {
      const riskLevel = p.scanResults?.summary?.riskLevel || 'unknown';
      const scoreMap = { critical: 25, high: 50, medium: 75, low: 90, unknown: 60 };
      return scoreMap[riskLevel] || 60;
    });
    
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }
  
  calculateScanTrend(pipelines) {
    return pipelines.length > 5 ? 'increasing' : 'stable';
  }
  
  calculateComplianceStatus(pipelines) {
    return 'improving'; // Simplified - can analyze compliance findings
  }
  
  async getReportCount() {
    try {
      if (this.isConnected) {
        return await this.db.collection(this.collections.reports)
          .countDocuments();
      } else {
        return this.memoryStore.reports.size;
      }
    } catch (error) {
      return 0;
    }
  }
  
  buildSearchQuery(query, filters) {
    const searchQuery = {};
    
    if (query) {
      searchQuery.$or = [
        { pipelineId: { $regex: query, $options: 'i' } },
        { scanType: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (filters.scanType) {
      searchQuery.scanType = filters.scanType;
    }
    
    if (filters.riskLevel) {
      searchQuery['scanResults.summary.riskLevel'] = filters.riskLevel;
    }
    
    if (filters.dateFrom || filters.dateTo) {
      searchQuery.timestamp = {};
      if (filters.dateFrom) searchQuery.timestamp.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) searchQuery.timestamp.$lte = new Date(filters.dateTo);
    }
    
    return searchQuery;
  }
  
  getMemoryMetrics() {
    const pipelines = Array.from(this.memoryStore.pipelines.values());
    const riskLevels = pipelines.map(p => p.scanResults?.summary?.riskLevel || 'unknown');
    const riskCounts = this.countRiskLevels(riskLevels);
    
    return {
      totalScans: pipelines.length,
      avgExecutionTime: 0,
      criticalIssues: riskCounts.critical,
      highIssues: riskCounts.high,
      mediumIssues: riskCounts.medium,
      lowIssues: riskCounts.low,
      securityTrend: 'stable',
      lastUpdated: new Date().toISOString(),
      fallback: true
    };
  }
  
  getDefaultMetrics() {
    return {
      totalScans: 0,
      avgExecutionTime: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      securityTrend: 'stable',
      lastUpdated: new Date().toISOString()
    };
  }
  
  getDefaultDashboardAnalytics() {
    return {
      overview: {
        totalScans: 0,
        criticalFindings: 0,
        avgScanTime: 0,
        securityScore: 0
      },
      trends: {
        scanVolume: 'stable',
        riskTrend: 'stable',
        complianceStatus: 'unknown'
      },
      recentActivity: [],
      reports: {
        totalReports: 0,
        canExport: false
      }
    };
  }
  
  /**
   * Database maintenance and cleanup
   */
  async maintenance() {
    console.log('Running database maintenance...');
    
    try {
      if (this.isConnected) {
        // Remove expired conversations (handled by TTL index)
        // Clean up old analytics data (keep last 90 days)
        const oldAnalytics = new Date();
        oldAnalytics.setDate(oldAnalytics.getDate() - 90);
        
        const result = await this.db.collection(this.collections.analytics)
          .deleteMany({ timestamp: { $lt: oldAnalytics } });
        
        console.log(`Database maintenance completed. Removed ${result.deletedCount} old analytics records`);
        
        return { success: true, cleanedRecords: result.deletedCount };
        
      } else {
        console.log('Memory storage maintenance - no action needed');
        return { success: true, fallback: true };
      }
      
    } catch (error) {
      console.error('Database maintenance failed:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Health check
   */
  async getHealth() {
    try {
      if (this.isConnected) {
        // Test database connection
        const pingResult = await this.db.admin().ping();
        const stats = await this.db.stats();
        
        return {
          status: 'healthy',
          service: 'MongoDB Atlas',
          connected: true,
          database: this.db.databaseName,
          collections: Object.keys(this.collections).length,
          version: this.version,
          dbStats: {
            dataSize: stats.dataSize,
            storageSize: stats.storageSize,
            indexes: stats.indexes
          },
          capabilities: [
            'Pipeline Results Storage',
            'Conversation Session Management',
            'Analytics and Metrics Tracking',
            'Report Data Storage',
            'Dashboard Data Queries',
            'Full-text Search',
            'Data Aggregation and Analytics'
          ]
        };
        
      } else {
        return {
          status: 'degraded',
          service: 'Memory Storage (Fallback)',
          connected: false,
          fallback: true,
          memoryUsage: {
            pipelines: this.memoryStore.pipelines.size,
            conversations: this.memoryStore.conversations.size,
            reports: this.memoryStore.reports.size,
            analytics: this.memoryStore.analytics.size
          }
        };
      }
      
    } catch (error) {
      return {
        status: 'error',
        service: 'MongoDB Manager',
        error: error.message,
        connected: false
      };
    }
  }
  
  /**
   * Close database connection
   */
  async close() {
    if (this.client && this.isConnected) {
      await this.client.close();
      console.log('MongoDB connection closed');
    }
  }
}

module.exports = MongoDBManager;