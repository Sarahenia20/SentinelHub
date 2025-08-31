const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Background Report Manager
 * Handles generation, storage, and retrieval of security scan reports
 */
class ReportManager {
  constructor() {
    this.name = 'Report Manager';
    this.version = '1.0.0';
    this.reportsDir = path.join(__dirname, '../../reports');
    this.metadataFile = path.join(this.reportsDir, 'metadata.json');
    this.reports = new Map(); // In-memory cache
    
    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      // Create reports directory
      await fs.mkdir(this.reportsDir, { recursive: true });
      
      // Load existing metadata
      await this.loadMetadata();
      
      console.log(`✅ ${this.name} initialized with ${this.reports.size} existing reports`);
    } catch (error) {
      console.error('Report Manager initialization failed:', error);
    }
  }

  /**
   * Save a scan report
   */
  async saveReport(scanResult, options = {}) {
    try {
      const reportId = options.reportId || crypto.randomUUID();
      const timestamp = new Date().toISOString();
      
      const report = {
        id: reportId,
        timestamp,
        type: scanResult.type || 'unknown',
        title: options.title || this.generateTitle(scanResult),
        description: options.description || '',
        scanResult,
        metadata: {
          createdAt: timestamp,
          size: JSON.stringify(scanResult).length,
          version: this.version,
          tags: options.tags || [],
          category: this.categorizeReport(scanResult)
        }
      };

      // Save report to file
      const reportFile = path.join(this.reportsDir, `${reportId}.json`);
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
      
      // Update in-memory cache and metadata
      this.reports.set(reportId, report);
      await this.saveMetadata();
      
      console.log(`📄 Report ${reportId} saved successfully`);
      
      return {
        success: true,
        reportId,
        title: report.title,
        timestamp,
        size: report.metadata.size
      };
      
    } catch (error) {
      console.error('Failed to save report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Retrieve a specific report
   */
  async getReport(reportId) {
    try {
      // Check cache first
      if (this.reports.has(reportId)) {
        return {
          success: true,
          report: this.reports.get(reportId)
        };
      }
      
      // Load from file
      const reportFile = path.join(this.reportsDir, `${reportId}.json`);
      const reportData = await fs.readFile(reportFile, 'utf8');
      const report = JSON.parse(reportData);
      
      // Cache it
      this.reports.set(reportId, report);
      
      return {
        success: true,
        report
      };
      
    } catch (error) {
      return {
        success: false,
        error: 'Report not found',
        reportId
      };
    }
  }

  /**
   * List all reports with filtering
   */
  async listReports(options = {}) {
    const {
      type = null,
      category = null,
      tags = [],
      limit = 50,
      offset = 0,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = options;

    let reports = Array.from(this.reports.values());
    
    // Apply filters
    if (type) {
      reports = reports.filter(r => r.type === type);
    }
    
    if (category) {
      reports = reports.filter(r => r.metadata.category === category);
    }
    
    if (tags.length > 0) {
      reports = reports.filter(r => 
        tags.some(tag => r.metadata.tags.includes(tag))
      );
    }
    
    // Sort
    reports.sort((a, b) => {
      let aVal = a[sortBy] || a.metadata[sortBy];
      let bVal = b[sortBy] || b.metadata[sortBy];
      
      if (sortBy === 'timestamp' || sortBy === 'createdAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      const comparison = aVal < bVal ? -1 : (aVal > bVal ? 1 : 0);
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    // Paginate
    const total = reports.length;
    const paginatedReports = reports.slice(offset, offset + limit);
    
    return {
      success: true,
      reports: paginatedReports.map(r => ({
        id: r.id,
        title: r.title,
        type: r.type,
        timestamp: r.timestamp,
        description: r.description,
        category: r.metadata.category,
        tags: r.metadata.tags,
        size: r.metadata.size
      })),
      total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Delete a report
   */
  async deleteReport(reportId) {
    try {
      // Remove from file system
      const reportFile = path.join(this.reportsDir, `${reportId}.json`);
      await fs.unlink(reportFile);
      
      // Remove from cache
      this.reports.delete(reportId);
      
      // Update metadata
      await this.saveMetadata();
      
      return {
        success: true,
        message: 'Report deleted successfully'
      };
      
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete report'
      };
    }
  }

  /**
   * Generate analytics about reports
   */
  async getAnalytics() {
    const reports = Array.from(this.reports.values());
    
    const analytics = {
      totalReports: reports.length,
      totalSize: reports.reduce((sum, r) => sum + r.metadata.size, 0),
      
      // Type distribution
      typeDistribution: {},
      categoryDistribution: {},
      
      // Timeline data
      reportsThisWeek: 0,
      reportsThisMonth: 0,
      
      // Size statistics
      averageSize: 0,
      largestReport: null,
      
      // Recent activity
      recentReports: reports
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5)
        .map(r => ({
          id: r.id,
          title: r.title,
          type: r.type,
          timestamp: r.timestamp
        }))
    };
    
    // Calculate distributions
    reports.forEach(report => {
      // Type distribution
      analytics.typeDistribution[report.type] = 
        (analytics.typeDistribution[report.type] || 0) + 1;
      
      // Category distribution  
      const category = report.metadata.category;
      analytics.categoryDistribution[category] = 
        (analytics.categoryDistribution[category] || 0) + 1;
      
      // Timeline calculations
      const reportDate = new Date(report.timestamp);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      if (reportDate >= weekAgo) analytics.reportsThisWeek++;
      if (reportDate >= monthAgo) analytics.reportsThisMonth++;
      
      // Largest report tracking
      if (!analytics.largestReport || report.metadata.size > analytics.largestReport.size) {
        analytics.largestReport = {
          id: report.id,
          title: report.title,
          size: report.metadata.size
        };
      }
    });
    
    // Calculate average size
    analytics.averageSize = reports.length > 0 ? 
      analytics.totalSize / reports.length : 0;
    
    return analytics;
  }

  /**
   * Helper methods
   */
  generateTitle(scanResult) {
    const timestamp = new Date().toLocaleDateString();
    
    if (scanResult.type === 'github-repository') {
      return `GitHub Scan: ${scanResult.repository} - ${timestamp}`;
    }
    
    if (scanResult.type === 'paste-scan') {
      return `Code Scan: ${scanResult.summary?.language || 'Unknown'} - ${timestamp}`;
    }
    
    if (scanResult.type === 'docker-bench') {
      return `Docker Security Scan - ${timestamp}`;
    }
    
    return `Security Scan - ${timestamp}`;
  }

  categorizeReport(scanResult) {
    if (scanResult.type === 'github-repository') return 'Repository Security';
    if (scanResult.type === 'paste-scan') return 'Code Analysis';
    if (scanResult.type === 'docker-bench') return 'Container Security';
    if (scanResult.type === 'aws-s3') return 'Cloud Security';
    return 'General Security';
  }

  async loadMetadata() {
    try {
      const metadataContent = await fs.readFile(this.metadataFile, 'utf8');
      const metadata = JSON.parse(metadataContent);
      
      // Load report summaries into cache
      for (const reportSummary of metadata.reports || []) {
        // Load full report lazily when needed
        this.reports.set(reportSummary.id, {
          ...reportSummary,
          _summary: true // Mark as summary only
        });
      }
      
    } catch (error) {
      // No existing metadata file, start fresh
      await this.saveMetadata();
    }
  }

  async saveMetadata() {
    try {
      const metadata = {
        version: this.version,
        lastUpdated: new Date().toISOString(),
        totalReports: this.reports.size,
        reports: Array.from(this.reports.values()).map(report => ({
          id: report.id,
          title: report.title,
          type: report.type,
          timestamp: report.timestamp,
          description: report.description,
          metadata: report.metadata
        }))
      };
      
      await fs.writeFile(this.metadataFile, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Failed to save metadata:', error);
    }
  }

  /**
   * Clean up old reports
   */
  async cleanup(options = {}) {
    const { 
      maxAge = 30 * 24 * 60 * 60 * 1000, // 30 days
      maxCount = 1000 
    } = options;

    const now = Date.now();
    const reports = Array.from(this.reports.values());
    let deletedCount = 0;
    
    // Delete by age
    for (const report of reports) {
      const reportAge = now - new Date(report.timestamp).getTime();
      if (reportAge > maxAge) {
        await this.deleteReport(report.id);
        deletedCount++;
      }
    }
    
    // Delete excess reports (keep newest)
    if (this.reports.size > maxCount) {
      const sortedReports = reports.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      const reportsToDelete = sortedReports.slice(maxCount);
      for (const report of reportsToDelete) {
        await this.deleteReport(report.id);
        deletedCount++;
      }
    }
    
    return {
      success: true,
      deletedCount,
      remainingCount: this.reports.size
    };
  }

  /**
   * Health check
   */
  async getHealth() {
    try {
      const analytics = await this.getAnalytics();
      
      return {
        name: this.name,
        version: this.version,
        status: 'healthy',
        reportsCount: analytics.totalReports,
        totalSizeMB: Math.round(analytics.totalSize / 1024 / 1024 * 100) / 100,
        reportsDir: this.reportsDir,
        capabilities: [
          'Report storage and retrieval',
          'Background report generation',
          'Report analytics and insights',
          'Automatic cleanup',
          'Report categorization and tagging',
          'Full-text search capabilities'
        ]
      };
    } catch (error) {
      return {
        name: this.name,
        version: this.version,
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = ReportManager;