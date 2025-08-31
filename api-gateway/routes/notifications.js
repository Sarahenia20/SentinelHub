const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

/**
 * Notifications Routes
 * Email notifications and voice assistant integration
 */

// Email configuration
let emailTransporter = null;

function initializeEmailTransporter() {
  try {
    // Check if SMTP credentials are available
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    
    if (!smtpUser || !smtpPass) {
      console.log('Email service not configured - missing SMTP credentials');
      return;
    }
    
    // Configure with your email service
    emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    
    console.log('Email transporter initialized');
  } catch (error) {
    console.warn('Email service not configured:', error.message);
  }
}

// Initialize email service
initializeEmailTransporter();

// Send email notification for long-running scans
router.post('/email/scan-timeout', async (req, res) => {
  try {
    const { 
      recipient, 
      scanId,
      scanType = 'security-scan',
      startTime,
      estimatedCompletion = 'unknown'
    } = req.body;
    
    if (!recipient || !scanId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['recipient', 'scanId']
      });
    }
    
    if (!emailTransporter) {
      return res.status(503).json({
        error: 'Email service not configured'
      });
    }
    
    const duration = startTime ? Math.round((Date.now() - new Date(startTime)) / 1000 / 60) : 'unknown';
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #dc3545; margin: 0;">⏳ Long-Running Scan Alert</h2>
          <p style="color: #6c757d; margin: 10px 0 0;">SentinelHub Security Platform</p>
        </div>
        
        <div style="padding: 20px 0;">
          <h3>Scan Details</h3>
          <ul>
            <li><strong>Scan ID:</strong> ${scanId}</li>
            <li><strong>Scan Type:</strong> ${scanType}</li>
            <li><strong>Duration:</strong> ${duration} minutes</li>
            <li><strong>Status:</strong> Still processing...</li>
          </ul>
          
          <p><strong>What's happening?</strong></p>
          <p>Your security scan is taking longer than expected (>2 minutes). This could be due to:</p>
          <ul>
            <li>Large codebase or repository size</li>
            <li>Complex security analysis requirements</li>
            <li>High server load</li>
          </ul>
          
          <p><strong>Next Steps:</strong></p>
          <ul>
            <li>The scan will continue running automatically</li>
            <li>You'll receive another email when it completes</li>
            <li>Check your dashboard for real-time status</li>
          </ul>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0;"><strong>💡 Tip:</strong> For faster scans, consider breaking large repositories into smaller chunks.</p>
          </div>
        </div>
        
        <div style="border-top: 1px solid #dee2e6; padding-top: 15px; color: #6c757d; font-size: 12px;">
          <p>This is an automated message from SentinelHub Security Platform.</p>
        </div>
      </div>
    `;
    
    const mailOptions = {
      from: `${process.env.FROM_NAME || 'SentinelHub'} <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: recipient,
      subject: `⏳ Long-Running Scan Alert - ${scanType} (${duration}min)`,
      html: emailContent
    };
    
    const result = await emailTransporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      messageId: result.messageId,
      scanId: scanId,
      duration: duration,
      sentAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to send timeout email:', error);
    res.status(500).json({
      error: 'Failed to send timeout email',
      message: error.message
    });
  }
});

// Send email notification for scan results
router.post('/email/scan-report', async (req, res) => {
  try {
    const { 
      recipient, 
      scanResults, 
      reportType = 'security-scan',
      includeRecommendations = true 
    } = req.body;
    
    if (!recipient || !scanResults) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['recipient', 'scanResults']
      });
    }
    
    if (!emailTransporter) {
      return res.status(503).json({
        error: 'Email service not configured',
        message: 'SMTP credentials required'
      });
    }
    
    // Generate email content
    const emailContent = generateScanReportEmail(scanResults, reportType, includeRecommendations);
    
    // Send email
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@sentinelhub.dev',
      to: recipient,
      subject: `SentinelHub Security Scan Report - ${scanResults.summary?.riskLevel?.toUpperCase() || 'COMPLETED'}`,
      html: emailContent.html,
      attachments: emailContent.attachments || []
    };
    
    const result = await emailTransporter.sendMail(mailOptions);
    
    // Store notification in database
    if (req.services.database) {
      try {
        await req.services.database.storeAnalytics({
          type: 'email_notification',
          recipient: recipient,
          scanId: scanResults.scanId || scanResults.pipelineId,
          reportType: reportType,
          sentAt: new Date().toISOString(),
          messageId: result.messageId
        });
      } catch (dbError) {
        console.warn('Failed to log email notification:', dbError.message);
      }
    }
    
    res.json({
      success: true,
      messageId: result.messageId,
      recipient: recipient,
      sentAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to send email notification:', error);
    res.status(500).json({
      error: 'Failed to send email notification',
      message: error.message
    });
  }
});

// Send voice notification for critical findings
router.post('/voice/critical-alert', async (req, res) => {
  try {
    const { scanResults, voiceSettings = {} } = req.body;
    
    if (!scanResults) {
      return res.status(400).json({
        error: 'Scan results required for voice notification'
      });
    }
    
    // Check if Eleven Labs is configured
    if (!process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY === 'your_elevenlabs_key_here') {
      return res.status(503).json({
        error: 'Eleven Labs API key not configured',
        message: 'Get API key from https://elevenlabs.io'
      });
    }
    
    // Generate voice message for critical findings
    const voiceMessage = generateVoiceMessage(scanResults);
    
    if (!voiceMessage) {
      return res.json({
        success: false,
        message: 'No critical findings requiring voice notification'
      });
    }
    
    // Generate speech using Eleven Labs
    const audioResult = await generateSpeech(voiceMessage, voiceSettings);
    
    res.json({
      success: true,
      message: voiceMessage,
      audioUrl: audioResult.audioUrl,
      duration: audioResult.duration,
      voiceId: audioResult.voiceId
    });
    
  } catch (error) {
    console.error('Failed to generate voice notification:', error);
    res.status(500).json({
      error: 'Failed to generate voice notification',
      message: error.message
    });
  }
});

// Get AI's first response as voice for conversation
router.post('/voice/conversation-start', async (req, res) => {
  try {
    const { conversationData, voiceSettings = {} } = req.body;
    
    if (!conversationData || !conversationData.message) {
      return res.status(400).json({
        error: 'Conversation data with message required'
      });
    }
    
    // Check if Eleven Labs is configured
    if (!process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY === 'your_elevenlabs_key_here') {
      return res.status(503).json({
        error: 'Eleven Labs API key not configured',
        message: 'Get API key from https://elevenlabs.io and add to environment'
      });
    }
    
    // Use the AI's first response message
    const messageText = conversationData.message;
    
    // Generate speech
    const audioResult = await generateSpeech(messageText, voiceSettings);
    
    res.json({
      success: true,
      originalMessage: messageText,
      audioUrl: audioResult.audioUrl,
      duration: audioResult.duration,
      voiceId: audioResult.voiceId
    });
    
  } catch (error) {
    console.error('Failed to generate conversation voice:', error);
    res.status(500).json({
      error: 'Failed to generate conversation voice',
      message: error.message
    });
  }
});

// Send general notification
router.post('/send', async (req, res) => {
  try {
    const { 
      type, 
      recipient, 
      title, 
      message, 
      priority = 'normal',
      channels = ['email'] 
    } = req.body;
    
    const results = [];
    
    // Send via requested channels
    for (const channel of channels) {
      try {
        let result;
        
        switch (channel) {
          case 'email':
            if (emailTransporter && recipient) {
              result = await sendSimpleEmail(recipient, title, message, priority);
              results.push({ channel: 'email', success: true, result });
            } else {
              results.push({ 
                channel: 'email', 
                success: false, 
                error: 'Email not configured or recipient missing' 
              });
            }
            break;
            
          case 'voice':
            if (process.env.ELEVENLABS_API_KEY && message) {
              result = await generateSpeech(message, {});
              results.push({ channel: 'voice', success: true, result });
            } else {
              results.push({ 
                channel: 'voice', 
                success: false, 
                error: 'Voice service not configured or message missing' 
              });
            }
            break;
            
          default:
            results.push({ 
              channel, 
              success: false, 
              error: 'Unsupported notification channel' 
            });
        }
        
      } catch (channelError) {
        results.push({ 
          channel, 
          success: false, 
          error: channelError.message 
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: successCount > 0,
      totalChannels: channels.length,
      successfulChannels: successCount,
      results: results
    });
    
  } catch (error) {
    console.error('Failed to send notification:', error);
    res.status(500).json({
      error: 'Failed to send notification',
      message: error.message
    });
  }
});

// Get notification settings
router.get('/settings/:userId?', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Default notification settings
    let settings = {
      emailEnabled: true,
      voiceEnabled: false,
      criticalOnly: true,
      emailAddress: '',
      voiceSettings: {
        voiceId: 'default',
        speed: 1.0,
        volume: 0.8
      }
    };
    
    // Load user-specific settings from Redis if available
    if (userId && req.services.redis) {
      try {
        const userSettings = await req.services.redis.get(`user:${userId}:notifications`);
        if (userSettings) {
          settings = { ...settings, ...JSON.parse(userSettings) };
        }
      } catch (redisError) {
        console.warn('Could not load notification settings:', redisError.message);
      }
    }
    
    res.json(settings);
    
  } catch (error) {
    console.error('Failed to get notification settings:', error);
    res.status(500).json({
      error: 'Failed to get notification settings',
      message: error.message
    });
  }
});

// Update notification settings
router.post('/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Store in Redis if available
    if (req.services.redis) {
      try {
        // Get existing settings
        const existing = await req.services.redis.get(`user:${userId}:notifications`);
        const currentSettings = existing ? JSON.parse(existing) : {};
        
        // Merge updates
        const newSettings = { ...currentSettings, ...updates };
        
        // Store with 30 day expiry
        await req.services.redis.setEx(
          `user:${userId}:notifications`,
          30 * 24 * 60 * 60, // 30 days
          JSON.stringify(newSettings)
        );
        
        res.json({
          success: true,
          settings: newSettings
        });
        
      } catch (redisError) {
        console.warn('Could not store notification settings:', redisError.message);
        res.status(503).json({
          error: 'Settings storage unavailable'
        });
      }
    } else {
      res.status(503).json({
        error: 'Settings storage not configured'
      });
    }
    
  } catch (error) {
    console.error('Failed to update notification settings:', error);
    res.status(500).json({
      error: 'Failed to update notification settings',
      message: error.message
    });
  }
});

/**
 * Helper Functions
 */

function generateScanReportEmail(scanResults, reportType, includeRecommendations) {
  const findingsCount = countFindings(scanResults);
  const riskLevel = scanResults.summary?.riskLevel || 'unknown';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; }
        .content { padding: 20px; }
        .risk-${riskLevel} { 
          border-left: 5px solid ${getRiskColor(riskLevel)}; 
          padding-left: 15px; 
          margin: 10px 0; 
        }
        .findings { background: #f5f5f5; padding: 15px; margin: 10px 0; }
        .recommendation { background: #e8f4fd; padding: 10px; margin: 5px 0; }
        .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🛡️ SentinelHub Security Platform</div>
        <p>Security Scan Report</p>
      </div>
      
      <div class="content">
        <div class="risk-${riskLevel}">
          <h2>Security Scan Completed</h2>
          <p><strong>Risk Level:</strong> ${riskLevel.toUpperCase()}</p>
          <p><strong>Total Findings:</strong> ${findingsCount}</p>
          <p><strong>Scan Date:</strong> ${new Date(scanResults.timestamp || Date.now()).toLocaleString()}</p>
        </div>
        
        ${generateFindingsSummary(scanResults)}
        
        ${includeRecommendations ? generateRecommendations(scanResults) : ''}
        
        <p><strong>Next Steps:</strong></p>
        <ul>
          <li>Review detailed findings in your SentinelHub dashboard</li>
          <li>Prioritize critical and high-severity issues</li>
          <li>Chat with our AI security expert for remediation guidance</li>
        </ul>
      </div>
      
      <div class="footer">
        <p>This report was generated automatically by SentinelHub Security Platform</p>
        <p>Visit your dashboard for detailed analysis and AI-powered recommendations</p>
      </div>
    </body>
    </html>
  `;
  
  return { html };
}

function generateVoiceMessage(scanResults) {
  const criticalFindings = getCriticalFindings(scanResults);
  
  if (criticalFindings.length === 0) {
    return null; // No voice notification needed
  }
  
  const riskLevel = scanResults.summary?.riskLevel || 'unknown';
  
  let message = `Security scan completed. `;
  
  if (riskLevel === 'critical') {
    message += `Critical security alert. Your scan found ${criticalFindings.length} critical security issues that require immediate attention. `;
  } else {
    message += `Your security scan found ${criticalFindings.length} high priority issues. `;
  }
  
  // Add first few critical findings
  const topFindings = criticalFindings.slice(0, 3);
  if (topFindings.length > 0) {
    message += `The most urgent issues include: `;
    message += topFindings.map(f => f.message || f.type).join(', ');
    message += `. `;
  }
  
  message += `Please review the detailed findings in your dashboard and chat with our AI security expert for remediation guidance.`;
  
  return message;
}

async function generateSpeech(text, voiceSettings = {}) {
  try {
    const elevenLabsAPI = 'https://api.elevenlabs.io/v1/text-to-speech';
    const voiceId = voiceSettings.voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Default voice
    
    const response = await fetch(`${elevenLabsAPI}/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: voiceSettings.stability || 0.5,
          similarity_boost: voiceSettings.similarity_boost || 0.5,
          style: voiceSettings.style || 0.0,
          use_speaker_boost: true
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Eleven Labs API error: ${response.status}`);
    }
    
    const audioBuffer = await response.arrayBuffer();
    
    // In a real implementation, you'd save this to a file or cloud storage
    // For now, we'll return a placeholder URL
    return {
      audioUrl: '/api/audio/generated-speech.mp3', // Placeholder
      duration: Math.ceil(text.length / 15), // Rough estimate: ~15 chars per second
      voiceId: voiceId,
      size: audioBuffer.byteLength
    };
    
  } catch (error) {
    console.error('Speech generation failed:', error);
    throw new Error(`Speech generation failed: ${error.message}`);
  }
}

async function sendSimpleEmail(recipient, subject, message, priority) {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@sentinelhub.dev',
    to: recipient,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>🛡️ SentinelHub Notification</h2>
        <p>${message}</p>
        <p><em>Priority: ${priority.toUpperCase()}</em></p>
        <hr>
        <p><small>This is an automated notification from SentinelHub Security Platform</small></p>
      </div>
    `
  };
  
  return await emailTransporter.sendMail(mailOptions);
}

function countFindings(scanResults) {
  if (!scanResults?.findings) return 0;
  
  return Object.values(scanResults.findings).reduce((total, items) => {
    return total + (Array.isArray(items) ? items.length : 0);
  }, 0);
}

function getCriticalFindings(scanResults) {
  const critical = [];
  
  if (scanResults?.findings) {
    Object.values(scanResults.findings).forEach(items => {
      if (Array.isArray(items)) {
        critical.push(...items.filter(item => item.severity === 'critical'));
      }
    });
  }
  
  return critical;
}

function getRiskColor(riskLevel) {
  switch (riskLevel) {
    case 'critical': return '#dc2626'; // red
    case 'high': return '#ea580c'; // orange
    case 'medium': return '#ca8a04'; // yellow
    case 'low': return '#16a34a'; // green
    default: return '#6b7280'; // gray
  }
}

function generateFindingsSummary(scanResults) {
  const findings = scanResults.findings || {};
  let html = '<div class="findings"><h3>Findings Summary:</h3>';
  
  Object.entries(findings).forEach(([category, items]) => {
    if (Array.isArray(items) && items.length > 0) {
      html += `<p><strong>${category}:</strong> ${items.length} issues found</p>`;
    }
  });
  
  html += '</div>';
  return html;
}

function generateRecommendations(scanResults) {
  if (!scanResults.aiInsights?.remediationPlan?.prioritizedSteps) {
    return '';
  }
  
  let html = '<div class="recommendations"><h3>AI Recommendations:</h3>';
  
  scanResults.aiInsights.remediationPlan.prioritizedSteps.slice(0, 5).forEach(step => {
    html += `<div class="recommendation">${step}</div>`;
  });
  
  html += '</div>';
  return html;
}

module.exports = router;