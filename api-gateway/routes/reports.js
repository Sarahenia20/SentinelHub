const express = require('express');
const ReportManager = require('../../services/report-manager');
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

module.exports = router;