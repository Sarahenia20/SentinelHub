const express = require('express');
const ReportManager = require('../../services/report-manager');
const complianceCalculator = require('../../services/reports/compliance-calculator');
const securityIntelligence = require('../../services/reports/security-intelligence');
const router = express.Router();

// Initialize Report Manager
const reportManager = new ReportManager();

/**
 * POST /api/reports - Save a new report
 */
router.post('/', async (req, res) => {
  try {
    const { scanResult, title, description, tags } = req.body;
    
    if (!scanResult) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'scanResult is required'
      });
    }
    
    const result = await reportManager.saveReport(scanResult, {
      title,
      description,
      tags
    });
    
    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Report saved successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to save report',
        message: result.error
      });
    }
    
  } catch (error) {
    console.error('Save report error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/reports - List all reports with filtering
 */
router.get('/', async (req, res) => {
  try {
    const {
      type,
      category,
      tags,
      limit = 20,
      offset = 0,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;
    
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    
    const result = await reportManager.listReports({
      type,
      category,
      tags: tagsArray,
      limit: parseInt(limit),
      offset: parseInt(offset),
      sortBy,
      sortOrder
    });
    
    res.json({
      success: true,
      data: result.reports,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('List reports error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/reports/:id - Get a specific report
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await reportManager.getReport(id);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.report
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Report not found',
        message: result.error
      });
    }
    
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/reports/:id - Delete a specific report
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await reportManager.deleteReport(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Failed to delete report',
        message: result.error
      });
    }
    
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/reports/analytics/overview - Get report analytics
 */
router.get('/analytics/overview', async (req, res) => {
  try {
    const analytics = await reportManager.getAnalytics();
    
    res.json({
      success: true,
      data: analytics
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * POST /api/reports/cleanup - Clean up old reports
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { maxAge, maxCount } = req.body;
    
    const result = await reportManager.cleanup({
      maxAge: maxAge ? parseInt(maxAge) : undefined,
      maxCount: maxCount ? parseInt(maxCount) : undefined
    });
    
    res.json({
      success: true,
      message: `Cleanup completed. Deleted ${result.deletedCount} reports.`,
      data: result
    });
    
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/reports/health - Health check
 */
router.get('/health', async (req, res) => {
  try {
    const health = await reportManager.getHealth();
    
    res.json({
      success: true,
      data: health
    });
    
  } catch (error) {
    console.error('Reports health check failed:', error);
    res.status(503).json({
      success: false,
      error: 'Service unavailable',
      message: error.message
    });
  }
});

/**
 * Background report generation endpoint
 * POST /api/reports/generate - Generate report in background
 */
router.post('/generate', async (req, res) => {
  try {
    const { scanType, scanParams, reportOptions } = req.body;
    
    if (!scanType) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'scanType is required'
      });
    }
    
    // Start background scan and report generation
    const jobId = `bg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Return immediately with job ID
    res.status(202).json({
      success: true,
      message: 'Background report generation started',
      jobId,
      status: 'in_progress',
      estimatedTime: '2-5 minutes'
    });
    
    // Run in background
    setImmediate(async () => {
      try {
        console.log(`🔄 Starting background ${scanType} scan with job ID: ${jobId}`);
        
        let scanResult = null;
        
        // Route to appropriate scanner based on scanType
        if (scanType === 'github-repository') {
          const GitHubScanner = require('../../services/github-scanner');
          const githubScanner = new GitHubScanner();
          
          const { owner, repo, githubToken, enableCodeRabbit, coderabbitToken } = scanParams;
          scanResult = await githubScanner.scanRepository(owner, repo, {
            githubToken,
            enableCodeRabbit,
            coderabbitToken
          });
          
        } else if (scanType === 'paste-scan') {
          const PasteScanner = require('../../services/paste-scanner');
          const pasteScanner = new PasteScanner();
          
          const { code, language, options } = scanParams;
          scanResult = await pasteScanner.scanCode(code, { language, ...options });
          
        } else {
          throw new Error(`Unsupported scan type: ${scanType}`);
        }
        
        // Save the generated report
        const reportResult = await reportManager.saveReport(scanResult, {
          ...reportOptions,
          title: reportOptions?.title || `Background ${scanType} Scan`,
          tags: [...(reportOptions?.tags || []), 'background', jobId]
        });
        
        if (reportResult.success) {
          console.log(`✅ Background scan ${jobId} completed, report saved: ${reportResult.reportId}`);
        } else {
          console.error(`❌ Background scan ${jobId} failed to save report:`, reportResult.error);
        }
        
      } catch (error) {
        console.error(`❌ Background scan ${jobId} failed:`, error);
      }
    });
    
  } catch (error) {
    console.error('Background generation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/reports/compliance/:pipelineId - Get compliance report for a scan
 */
router.get('/compliance/:pipelineId', async (req, res) => {
  try {
    const { pipelineId } = req.params;

    let pipeline = null;

    // Try database first
    if (req.services?.database?.getPipeline) {
      pipeline = await req.services.database.getPipeline(pipelineId);
    }

    // Fallback to report manager
    if (!pipeline) {
      const result = await reportManager.getReport(pipelineId);
      if (result.success) {
        pipeline = result.report;
      }
    }

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline not found',
        pipelineId
      });
    }

    // Calculate compliance
    const scanResults = pipeline.scanResults || pipeline.scanResult || {};
    const compliance = complianceCalculator.getComplianceReport(scanResults);

    res.json({
      success: true,
      pipelineId,
      compliance
    });

  } catch (error) {
    console.error('Failed to get compliance report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get compliance report',
      message: error.message
    });
  }
});

/**
 * GET /api/reports/intelligence/latest - Get security intelligence for latest scan
 */
router.get('/intelligence/latest', async (req, res) => {
  try {
    // Try to get most recent report from report manager
    let latestReport = null;
    let scanResults = null;

    // First try database if available
    if (req.services?.database?.getRecentPipelines) {
      const pipelines = await req.services.database.getRecentPipelines(1);
      if (pipelines.length > 0) {
        latestReport = pipelines[0];
        scanResults = latestReport.scanResults;
      }
    }

    // Fallback to report manager
    if (!scanResults) {
      const reportsResult = await reportManager.listReports({ limit: 1, sortBy: 'timestamp', sortOrder: 'desc' });
      if (reportsResult.reports && reportsResult.reports.length > 0) {
        latestReport = reportsResult.reports[0];
        scanResults = latestReport.scanResult || latestReport.scanResults;
      }
    }

    // If still no data, return empty intelligence
    if (!scanResults) {
      return res.json({
        success: true,
        intelligence: {
          breaches: [],
          cves: [],
          threats: [],
          recommendations: [],
          context: {}
        },
        message: 'No scans available yet. Run a scan to see security intelligence.'
      });
    }

    console.log(`📊 Gathering intelligence for latest scan...`);

    // Get security intelligence with external API enrichment
    const intelligence = await securityIntelligence.getSecurityIntelligence(scanResults);

    res.json({
      success: true,
      intelligence: {
        breaches: intelligence.breachData || [],
        cves: (intelligence.cveMatches || []).slice(0, 10),
        threats: intelligence.threatIndicators || [],
        recommendations: intelligence.recommendations || [],
        context: intelligence.externalContext || {},
        summary: securityIntelligence.getIntelligenceSummary ?
          securityIntelligence.getIntelligenceSummary(intelligence) :
          {
            totalBreaches: (intelligence.breachData || []).length,
            totalCves: (intelligence.cveMatches || []).length,
            totalThreats: (intelligence.threatIndicators || []).length,
            totalRecommendations: (intelligence.recommendations || []).length
          }
      },
      basedOn: {
        scanId: latestReport?.id || latestReport?.pipelineId || 'latest',
        timestamp: latestReport?.timestamp || new Date().toISOString(),
        scanType: latestReport?.type || latestReport?.scanType || 'unknown'
      }
    });

  } catch (error) {
    console.error('Failed to get intelligence:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get intelligence',
      message: error.message
    });
  }
});

/**
 * GET /api/reports/compliance/summary - Get overall compliance summary
 */
router.get('/compliance/summary', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const pipelines = await req.services.database.getRecentPipelines(parseInt(limit));

    if (pipelines.length === 0) {
      return res.json({
        success: true,
        summary: {
          averages: { owasp: 0, nist: 0, iso27001: 0, overall: 0 },
          trend: 'stable',
          totalScans: 0
        }
      });
    }

    // Calculate compliance for each scan
    const complianceData = pipelines.map(pipeline => {
      const compliance = complianceCalculator.getComplianceReport(pipeline.scanResults || {});
      return {
        scanId: pipeline.pipelineId,
        timestamp: pipeline.timestamp,
        owasp: compliance.frameworks.owasp.score,
        nist: compliance.frameworks.nist.score,
        iso27001: compliance.frameworks.iso27001.score,
        overall: compliance.overall.score
      };
    });

    // Calculate averages
    const avgCompliance = {
      owasp: Math.round(complianceData.reduce((sum, c) => sum + c.owasp, 0) / complianceData.length),
      nist: Math.round(complianceData.reduce((sum, c) => sum + c.nist, 0) / complianceData.length),
      iso27001: Math.round(complianceData.reduce((sum, c) => sum + c.iso27001, 0) / complianceData.length),
      overall: Math.round(complianceData.reduce((sum, c) => sum + c.overall, 0) / complianceData.length)
    };

    res.json({
      success: true,
      summary: {
        averages: avgCompliance,
        trend: 'stable',
        totalScans: complianceData.length,
        byFramework: {
          owasp: {
            current: complianceData[0]?.owasp || 0,
            average: avgCompliance.owasp
          },
          nist: {
            current: complianceData[0]?.nist || 0,
            average: avgCompliance.nist
          },
          iso27001: {
            current: complianceData[0]?.iso27001 || 0,
            average: avgCompliance.iso27001
          }
        }
      },
      history: complianceData
    });

  } catch (error) {
    console.error('Failed to get compliance summary:', error);
    res.status(500).json({
      error: 'Failed to get compliance summary',
      message: error.message
    });
  }
});

module.exports = router;