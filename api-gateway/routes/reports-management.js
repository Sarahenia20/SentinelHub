const express = require('express');
const router = express.Router();

/**
 * Reports Management API
 * Handles security reports with gatekeeping table and email functionality
 */

// Store security report with AI advice
router.post('/store', async (req, res) => {
  try {
    const { scanResults, aiAdvice, options = {} } = req.body;
    
    if (!scanResults) {
      return res.status(400).json({
        error: 'scanResults required',
        message: 'Scan results data is required to store report'
      });
    }
    
    const database = req.services.database;
    const result = await database.storeSecurityReport(scanResults, aiAdvice || {}, options);
    
    if (result.success) {
      console.log(`📊 Security report stored: ${result.reportId}`);
      
      // Trigger email sending if recipient provided
      if (options.emailRecipient) {
        const ReportMailer = require('../../services/email/report-mailer');
        const mailer = new ReportMailer();
        
        const detailedReport = await database.getDetailedReport(result.reportId);
        if (detailedReport) {
          // Send summary report
          await mailer.sendSummaryReport(detailedReport, options.emailRecipient);
          
          // Send detailed report to admin if specified
          if (options.adminEmail) {
            await mailer.sendDetailedReport(detailedReport, options.adminEmail);
          }
        }
      }
      
      res.json({
        success: true,
        reportId: result.reportId,
        vulnerabilityCount: result.vulnerabilityCount,
        riskLevel: result.riskLevel,
        timestamp: result.timestamp,
        message: 'Security report stored successfully'
      });
      
    } else {
      res.status(500).json({
        error: 'Failed to store report',
        message: result.error || 'Database storage failed'
      });
    }
    
  } catch (error) {
    console.error('Store report error:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process report storage request'
    });
  }
});

// Get reports for gatekeeping table
router.get('/table', async (req, res) => {
  try {
    const database = req.services.database;
    const { 
      limit = 20, 
      riskLevel, 
      dateFrom, 
      dateTo, 
      emailSent, 
      acknowledged 
    } = req.query;
    
    const filters = {};
    if (riskLevel) filters.riskLevel = riskLevel;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (emailSent !== undefined) filters.emailSent = emailSent === 'true';
    if (acknowledged !== undefined) filters.acknowledged = acknowledged === 'true';
    
    const reports = await database.getReportsForTable(parseInt(limit), filters);
    
    res.json({
      success: true,
      reports: reports,
      count: reports.length,
      filters: filters,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get reports table error:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve reports',
      message: error.message
    });
  }
});

// Acknowledge report (gatekeeping action)
router.post('/acknowledge/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { userId = 'admin' } = req.body;
    
    const database = req.services.database;
    const result = await database.acknowledgeReport(reportId, userId);
    
    if (result.success) {
      res.json({
        success: true,
        reportId: reportId,
        acknowledgedBy: userId,
        timestamp: new Date().toISOString(),
        message: 'Report acknowledged successfully'
      });
    } else {
      res.status(404).json({
        error: 'Report not found',
        message: 'Could not find or acknowledge the specified report'
      });
    }
    
  } catch (error) {
    console.error('Acknowledge report error:', error.message);
    res.status(500).json({
      error: 'Failed to acknowledge report',
      message: error.message
    });
  }
});

// Get detailed report
router.get('/detail/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const database = req.services.database;
    const report = await database.getDetailedReport(reportId);
    
    if (report) {
      res.json({
        success: true,
        report: report,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        error: 'Report not found',
        message: 'The specified report does not exist'
      });
    }
    
  } catch (error) {
    console.error('Get detailed report error:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve detailed report',
      message: error.message
    });
  }
});

// Send email report
router.post('/email/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { recipient, type = 'summary', adminEmail } = req.body;
    
    if (!recipient) {
      return res.status(400).json({
        error: 'Recipient required',
        message: 'Email recipient is required'
      });
    }
    
    const database = req.services.database;
    const report = await database.getDetailedReport(reportId);
    
    if (!report) {
      return res.status(404).json({
        error: 'Report not found',
        message: 'Cannot send email for non-existent report'
      });
    }
    
    const ReportMailer = require('../../services/email/report-mailer');
    const mailer = new ReportMailer();
    
    let emailResult;
    
    if (type === 'detailed') {
      emailResult = await mailer.sendDetailedReport(report, recipient);
    } else {
      emailResult = await mailer.sendSummaryReport(report, recipient);
    }
    
    // Send detailed report to admin if specified
    if (adminEmail && type === 'summary') {
      await mailer.sendDetailedReport(report, adminEmail);
    }
    
    if (emailResult.sent) {
      // Update report email status in database
      await database.db.collection(database.collections.reports)
        .updateOne(
          { reportId: reportId },
          { 
            $set: { 
              'emailStatus.sent': true,
              'emailStatus.sentAt': new Date(),
              'emailStatus.recipient': recipient,
              'emailStatus.type': type
            }
          }
        );
      
      res.json({
        success: true,
        emailSent: true,
        recipient: recipient,
        type: type,
        messageId: emailResult.messageId,
        timestamp: emailResult.timestamp,
        message: 'Report email sent successfully'
      });
      
    } else {
      res.status(500).json({
        error: 'Email sending failed',
        message: emailResult.error || 'Could not send email report'
      });
    }
    
  } catch (error) {
    console.error('Send email report error:', error.message);
    res.status(500).json({
      error: 'Failed to send email report',
      message: error.message
    });
  }
});

// Get reports statistics for dashboard
router.get('/stats', async (req, res) => {
  try {
    const database = req.services.database;
    
    // Get recent reports for statistics
    const reports = await database.getReportsForTable(100);
    
    const stats = {
      total: reports.length,
      riskLevels: {
        critical: reports.filter(r => r.riskLevel === 'critical').length,
        high: reports.filter(r => r.riskLevel === 'high').length,
        medium: reports.filter(r => r.riskLevel === 'medium').length,
        low: reports.filter(r => r.riskLevel === 'low').length,
        clean: reports.filter(r => r.riskLevel === 'clean').length
      },
      emailStatus: {
        sent: reports.filter(r => r.emailSent).length,
        pending: reports.filter(r => !r.emailSent).length
      },
      gatekeeping: {
        acknowledged: reports.filter(r => r.gatekeepingStatus === 'acknowledged').length,
        pending: reports.filter(r => r.gatekeepingStatus === 'pending').length
      },
      recentActivity: reports.slice(0, 5).map(r => ({
        id: r.id,
        date: r.date,
        riskLevel: r.riskLevel,
        vulnerabilities: r.totalVulnerabilities
      }))
    };
    
    res.json({
      success: true,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get reports stats error:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: error.message
    });
  }
});

// Test email configuration
router.get('/test-email', async (req, res) => {
  try {
    const ReportMailer = require('../../services/email/report-mailer');
    const mailer = new ReportMailer();
    
    const health = await mailer.getHealth();
    
    res.json({
      success: true,
      emailService: health,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test email error:', error.message);
    res.status(500).json({
      error: 'Email service test failed',
      message: error.message
    });
  }
});

module.exports = router;