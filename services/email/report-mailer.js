const nodemailer = require('nodemailer');

/**
 * Security Report Email Service
 * Sends formatted security reports with AI advice and vulnerability details
 */
class ReportMailer {
  constructor() {
    this.name = 'SentinelHub Report Mailer';
    this.version = '1.0.0';
    
    // Email configuration
    this.transporter = null;
    this.isConfigured = false;
    
    this.initializeMailer();
    console.log(`📧 ${this.name} v${this.version} initialized`);
  }
  
  /**
   * Initialize email transporter
   */
  async initializeMailer() {
    try {
      const smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };
      
      if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
        console.warn('⚠️ SMTP credentials not configured - email functionality disabled');
        return;
      }
      
      this.transporter = nodemailer.createTransporter(smtpConfig);
      
      // Test connection
      await this.transporter.verify();
      this.isConfigured = true;
      console.log('✅ Email service configured successfully');
      
    } catch (error) {
      console.error('❌ Email service configuration failed:', error.message);
      this.isConfigured = false;
    }
  }
  
  /**
   * Send summary security report (for gatekeeping)
   */
  async sendSummaryReport(reportData, recipient) {
    if (!this.isConfigured) {
      console.warn('Email service not configured');
      return { sent: false, error: 'Email service not configured' };
    }
    
    try {
      const emailSubject = `🛡️ Security Alert: ${reportData.summary.riskLevel.toUpperCase()} Risk Detected`;
      const emailBody = this.generateSummaryEmailBody(reportData);
      
      const mailOptions = {
        from: `${process.env.FROM_NAME || 'SentinelHub'} <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
        to: recipient,
        subject: emailSubject,
        html: emailBody,
        priority: reportData.summary.riskLevel === 'critical' ? 'high' : 'normal'
      };
      
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`📧 Summary report sent to ${recipient}: ${reportData.reportId}`);
      
      return {
        sent: true,
        messageId: result.messageId,
        recipient: recipient,
        reportId: reportData.reportId,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Failed to send summary report:', error.message);
      return { sent: false, error: error.message };
    }
  }
  
  /**
   * Send detailed security report (comprehensive analysis)
   */
  async sendDetailedReport(reportData, recipient) {
    if (!this.isConfigured) {
      console.warn('Email service not configured');
      return { sent: false, error: 'Email service not configured' };
    }
    
    try {
      const emailSubject = `📋 Detailed Security Analysis Report - ${reportData.target}`;
      const emailBody = this.generateDetailedEmailBody(reportData);
      
      const mailOptions = {
        from: `${process.env.FROM_NAME || 'SentinelHub'} <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
        to: recipient,
        subject: emailSubject,
        html: emailBody,
        attachments: [
          {
            filename: `security-report-${reportData.reportId}.json`,
            content: JSON.stringify(reportData, null, 2),
            contentType: 'application/json'
          }
        ]
      };
      
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`📧 Detailed report sent to ${recipient}: ${reportData.reportId}`);
      
      return {
        sent: true,
        messageId: result.messageId,
        recipient: recipient,
        reportId: reportData.reportId,
        timestamp: new Date().toISOString(),
        type: 'detailed'
      };
      
    } catch (error) {
      console.error('Failed to send detailed report:', error.message);
      return { sent: false, error: error.message };
    }
  }
  
  /**
   * Generate summary email body (for gatekeeping alerts)
   */
  generateSummaryEmailBody(reportData) {
    const riskColor = this.getRiskColor(reportData.summary.riskLevel);
    const formatDate = (date) => new Date(date).toLocaleString();
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .risk-badge { 
      display: inline-block; 
      padding: 8px 16px; 
      color: white; 
      border-radius: 4px; 
      font-weight: bold; 
      background: ${riskColor}; 
    }
    .metric { 
      display: inline-block; 
      margin: 10px 15px 10px 0; 
      padding: 10px 15px; 
      background: #f5f5f5; 
      border-radius: 4px; 
    }
    .metric-value { font-size: 24px; font-weight: bold; color: ${riskColor}; }
    .metric-label { font-size: 12px; color: #666; }
    .advice { background: #e8f4fd; padding: 15px; border-left: 4px solid #2196f3; margin: 15px 0; }
    .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🛡️ SentinelHub Security Alert</h1>
    <p>Automated Security Monitoring Report</p>
  </div>
  
  <div class="content">
    <h2>Security Scan Summary</h2>
    <p><strong>Report ID:</strong> ${reportData.reportId}</p>
    <p><strong>Target:</strong> ${reportData.target}</p>
    <p><strong>Scan Date:</strong> ${formatDate(reportData.date)}</p>
    <p><strong>Risk Level:</strong> <span class="risk-badge">${reportData.summary.riskLevel.toUpperCase()}</span></p>
    
    <h3>Vulnerability Metrics</h3>
    <div>
      <div class="metric">
        <div class="metric-value">${reportData.summary.totalVulnerabilities}</div>
        <div class="metric-label">Total Issues</div>
      </div>
      <div class="metric">
        <div class="metric-value" style="color: #d32f2f;">${reportData.summary.criticalCount}</div>
        <div class="metric-label">Critical</div>
      </div>
      <div class="metric">
        <div class="metric-value" style="color: #f57c00;">${reportData.summary.highCount}</div>
        <div class="metric-label">High</div>
      </div>
      <div class="metric">
        <div class="metric-value" style="color: #fbc02d;">${reportData.summary.mediumCount}</div>
        <div class="metric-label">Medium</div>
      </div>
    </div>
    
    <div class="advice">
      <h3>🤖 AI Security Advice</h3>
      <p>${reportData.aiAdvice.overview}</p>
      
      ${reportData.aiAdvice.recommendations.length > 0 ? `
      <h4>Key Recommendations:</h4>
      <ul>
        ${reportData.aiAdvice.recommendations.slice(0, 3).map(rec => `<li>${rec}</li>`).join('')}
      </ul>
      ` : ''}
      
      ${reportData.aiAdvice.priorityActions.length > 0 ? `
      <h4>Priority Actions:</h4>
      <ul>
        ${reportData.aiAdvice.priorityActions.map(action => `<li><strong>${action}</strong></li>`).join('')}
      </ul>
      ` : ''}
    </div>
    
    <h3>Next Steps</h3>
    <ol>
      <li>Review and acknowledge this report in the SentinelHub dashboard</li>
      <li>Prioritize fixing critical and high-severity vulnerabilities</li>
      <li>Implement the recommended security measures</li>
      <li>Schedule follow-up security scans</li>
    </ol>
    
    <p><em>A detailed technical report will be sent separately with full vulnerability details and remediation steps.</em></p>
  </div>
  
  <div class="footer">
    <p>🛡️ Generated by SentinelHub Security Platform | ${formatDate(new Date())}</p>
    <p>This is an automated security alert. Please do not reply to this email.</p>
  </div>
</body>
</html>`;
  }
  
  /**
   * Generate detailed email body (comprehensive technical report)
   */
  generateDetailedEmailBody(reportData) {
    const formatDate = (date) => new Date(date).toLocaleString();
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Courier New', monospace; line-height: 1.4; color: #333; font-size: 13px; }
    .header { background: #1a1a1a; color: #00ff00; padding: 20px; font-family: monospace; }
    .content { padding: 20px; }
    .vuln { 
      border: 1px solid #ddd; 
      margin: 15px 0; 
      padding: 15px; 
      background: #f9f9f9;
    }
    .vuln-critical { border-left: 5px solid #d32f2f; }
    .vuln-high { border-left: 5px solid #f57c00; }
    .vuln-medium { border-left: 5px solid #fbc02d; }
    .vuln-low { border-left: 5px solid #388e3c; }
    .code-block { background: #2d2d2d; color: #f8f8f2; padding: 10px; margin: 10px 0; overflow-x: auto; }
    .severity { padding: 3px 8px; color: white; border-radius: 3px; font-size: 11px; font-weight: bold; }
    .sev-critical { background: #d32f2f; }
    .sev-high { background: #f57c00; }
    .sev-medium { background: #fbc02d; color: #333; }
    .sev-low { background: #388e3c; }
    .footer { background: #1a1a1a; color: #00ff00; padding: 15px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="header">
    <pre>
╔═══════════════════════════════════════════════════════════════╗
║                  SENTINELHUB SECURITY REPORT                 ║
║                   Detailed Technical Analysis                ║
╚═══════════════════════════════════════════════════════════════╝
    </pre>
    <p>Report ID: ${reportData.reportId} | Target: ${reportData.target}</p>
  </div>
  
  <div class="content">
    <h2>📊 SCAN SUMMARY</h2>
    <pre>
Target System: ${reportData.target}
Scan Type: ${reportData.scanType}
Scan Date: ${formatDate(reportData.date)}
Risk Level: ${reportData.summary.riskLevel.toUpperCase()}
Duration: ${reportData.summary.scanDuration}ms

Vulnerability Breakdown:
├── Critical: ${reportData.summary.criticalCount}
├── High: ${reportData.summary.highCount}
├── Medium: ${reportData.summary.mediumCount}
└── Total: ${reportData.summary.totalVulnerabilities}
    </pre>
    
    <h2>🤖 AI ANALYSIS & RECOMMENDATIONS</h2>
    <div style="background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3;">
      <p><strong>AI Assessment:</strong> ${reportData.aiAdvice.overview}</p>
      
      ${reportData.aiAdvice.recommendations.length > 0 ? `
      <h4>Recommendations:</h4>
      <ul>
        ${reportData.aiAdvice.recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
      ` : ''}
      
      ${reportData.aiAdvice.complianceNotes.length > 0 ? `
      <h4>Compliance Notes:</h4>
      <ul>
        ${reportData.aiAdvice.complianceNotes.map(note => `<li>${note}</li>`).join('')}
      </ul>
      ` : ''}
    </div>
    
    <h2>🔍 DETAILED VULNERABILITY ANALYSIS</h2>
    
    ${reportData.vulnerabilities.map((vuln, index) => `
    <div class="vuln vuln-${vuln.severity}">
      <h4>
        [${index + 1}] ${vuln.type} 
        <span class="severity sev-${vuln.severity}">${vuln.severity.toUpperCase()}</span>
      </h4>
      
      <p><strong>Description:</strong> ${vuln.message}</p>
      
      ${vuln.file ? `<p><strong>Location:</strong> ${vuln.file}${vuln.line ? `:${vuln.line}` : ''}</p>` : ''}
      
      ${vuln.cwe ? `<p><strong>CWE Classification:</strong> ${vuln.cwe}</p>` : ''}
      
      <p><strong>Category:</strong> ${vuln.category}</p>
      
      <p><strong>Confidence:</strong> ${Math.round(vuln.confidence * 100)}%</p>
      
      <div style="background: #fff3e0; padding: 10px; margin: 10px 0; border-left: 4px solid #ff9800;">
        <strong>🔧 Remediation:</strong> ${vuln.recommendation}
      </div>
    </div>
    `).join('')}
    
    <h2>📋 REMEDIATION CHECKLIST</h2>
    <pre>
┌─ IMMEDIATE ACTIONS (Critical/High Priority) ─────────────────┐
${reportData.vulnerabilities
  .filter(v => v.severity === 'critical' || v.severity === 'high')
  .slice(0, 5)
  .map((v, i) => `│ ${i + 1}. [ ] Fix: ${v.type} in ${v.file || 'application'}`)
  .join('\n')}
└───────────────────────────────────────────────────────────────┘

┌─ SECURITY IMPROVEMENTS ──────────────────────────────────────┐
${reportData.aiAdvice.recommendations
  .slice(0, 3)
  .map((rec, i) => `│ ${i + 1}. [ ] ${rec}`)
  .join('\n')}
└───────────────────────────────────────────────────────────────┘
    </pre>
    
    <h2>📞 SUPPORT & NEXT STEPS</h2>
    <p>1. Address critical and high-severity vulnerabilities immediately</p>
    <p>2. Implement security controls as recommended by the AI analysis</p>
    <p>3. Schedule regular security scans to monitor improvements</p>
    <p>4. Review compliance requirements based on identified issues</p>
    
    <p><em>Full technical data is available in the attached JSON report.</em></p>
  </div>
  
  <div class="footer">
    <pre>
╔═══════════════════════════════════════════════════════════════╗
║ SentinelHub Security Platform v${this.version}                      ║
║ Generated: ${formatDate(new Date())}                    ║
║ This report contains sensitive security information.          ║
╚═══════════════════════════════════════════════════════════════╝
    </pre>
  </div>
</body>
</html>`;
  }
  
  /**
   * Get risk level color for styling
   */
  getRiskColor(riskLevel) {
    const colors = {
      critical: '#d32f2f',
      high: '#f57c00',
      medium: '#fbc02d',
      low: '#388e3c',
      clean: '#4caf50'
    };
    
    return colors[riskLevel] || '#666';
  }
  
  /**
   * Health check
   */
  async getHealth() {
    return {
      status: this.isConfigured ? 'healthy' : 'degraded',
      service: 'Report Mailer',
      configured: this.isConfigured,
      smtpHost: process.env.SMTP_HOST || 'Not configured',
      capabilities: this.isConfigured ? [
        'Summary Security Alerts',
        'Detailed Technical Reports',
        'HTML Email Formatting',
        'Risk-Based Prioritization',
        'JSON Report Attachments'
      ] : ['Service requires SMTP configuration']
    };
  }
}

module.exports = ReportMailer;