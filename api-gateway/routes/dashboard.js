const express = require('express');
const router = express.Router();

/**
 * Dashboard Routes
 * Analytics, metrics, and dashboard data endpoints
 */

// Get dashboard overview metrics
router.get('/metrics', async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    // Get security metrics from database
    const metrics = await req.services.database.getSecurityMetrics(timeRange);
    
    // Get dashboard analytics
    const analytics = await req.services.database.getDashboardAnalytics();
    
    // Get recent pipeline activity
    const recentPipelines = await req.services.database.getRecentPipelines(10);
    
    const dashboardData = {
      overview: {
        totalScans: metrics.totalScans,
        criticalIssues: metrics.criticalIssues,
        highIssues: metrics.highIssues,
        securityScore: analytics.overview.securityScore,
        avgScanTime: metrics.avgExecutionTime
      },
      riskDistribution: {
        critical: metrics.criticalIssues,
        high: metrics.highIssues,
        medium: metrics.mediumIssues,
        low: metrics.lowIssues
      },
      trends: {
        securityTrend: metrics.securityTrend,
        scanVolume: analytics.trends.scanVolume,
        complianceStatus: analytics.trends.complianceStatus
      },
      recentActivity: recentPipelines.slice(0, 5).map(pipeline => ({
        id: pipeline.pipelineId,
        type: pipeline.scanType,
        timestamp: pipeline.timestamp,
        riskLevel: pipeline.scanResults?.summary?.riskLevel || 
                   pipeline.scanResults?.riskAssessment?.overall || 'unknown',
        findings: countFindings(pipeline.scanResults),
        status: pipeline.status
      })),
      scanTypes: getScanTypeDistribution(recentPipelines),
      compliance: {
        gdprCompliant: calculateComplianceScore(recentPipelines, 'GDPR'),
        pciCompliant: calculateComplianceScore(recentPipelines, 'PCI-DSS'),
        hipaaCompliant: calculateComplianceScore(recentPipelines, 'HIPAA')
      },
      aiUsage: {
        conversationsStarted: await getConversationCount(req.services.database),
        aiRecommendations: await getAIRecommendationCount(req.services.database),
        topQuestions: await getTopSecurityQuestions(req.services.database)
      }
    };
    
    res.json(dashboardData);
    
  } catch (error) {
    console.error('Failed to get dashboard metrics:', error);
    res.status(500).json({
      error: 'Failed to get dashboard metrics',
      message: error.message
    });
  }
});

// Get detailed scan analytics
router.get('/analytics/scans', async (req, res) => {
  try {
    const { 
      timeRange = '30d', 
      scanType = null, 
      riskLevel = null,
      limit = 50 
    } = req.query;
    
    const pipelines = await req.services.database.getRecentPipelines(
      parseInt(limit), 
      scanType
    );
    
    // Filter by risk level if specified
    let filteredPipelines = pipelines;
    if (riskLevel) {
      filteredPipelines = pipelines.filter(p => 
        (p.scanResults?.summary?.riskLevel === riskLevel) ||
        (p.scanResults?.riskAssessment?.overall === riskLevel)
      );
    }
    
    const analytics = {
      totalScans: filteredPipelines.length,
      scansByType: getScanTypeAnalytics(filteredPipelines),
      riskTrends: getRiskTrends(filteredPipelines),
      executionTimes: getExecutionTimeAnalytics(filteredPipelines),
      findingsOverTime: getFindingsOverTime(filteredPipelines),
      topVulnerabilities: getTopVulnerabilities(filteredPipelines),
      aiInsights: getAIInsightsAnalytics(filteredPipelines)
    };
    
    res.json(analytics);
    
  } catch (error) {
    console.error('Failed to get scan analytics:', error);
    res.status(500).json({
      error: 'Failed to get scan analytics',
      message: error.message
    });
  }
});

// Get AI conversation analytics
router.get('/analytics/conversations', async (req, res) => {
  try {
    // This would require implementing conversation analytics in MongoDB
    const conversationAnalytics = {
      totalConversations: 0,
      avgMessagesPerConversation: 0,
      topTopics: [],
      sentimentDistribution: {
        positive: 0,
        negative: 0,
        neutral: 0,
        urgent: 0
      },
      aiPersonaUsage: {},
      resolutionRate: 0 // How often AI successfully helped
    };
    
    res.json(conversationAnalytics);
    
  } catch (error) {
    console.error('Failed to get conversation analytics:', error);
    res.status(500).json({
      error: 'Failed to get conversation analytics',
      message: error.message
    });
  }
});

// Get real-time system status
router.get('/status', async (req, res) => {
  try {
    // Get health status of all services
    const [pipelineHealth, dbHealth, aiHealth] = await Promise.all([
      req.services.pipeline.getHealth(),
      req.services.database.getHealth(),
      req.services.conversationAI.getHealth()
    ]);
    
    const systemStatus = {
      overall: determineOverallHealth([pipelineHealth, dbHealth, aiHealth]),
      services: {
        securityPipeline: {
          status: pipelineHealth.status,
          activePipelines: pipelineHealth.activePipelines || 0,
          completedPipelines: pipelineHealth.completedPipelines || 0
        },
        database: {
          status: dbHealth.status,
          connected: dbHealth.connected,
          type: dbHealth.service
        },
        conversationAI: {
          status: aiHealth.status,
          model: aiHealth.primaryModel || aiHealth.aiModel,
          activeConversations: aiHealth.activeConversations || 0
        },
        securityTools: {
          semgrep: 'available',
          truffleHog: 'available',
          gemmaAI: aiHealth.status
        }
      },
      performance: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        lastHealthCheck: new Date().toISOString()
      }
    };
    
    res.json(systemStatus);
    
  } catch (error) {
    console.error('Failed to get system status:', error);
    res.status(500).json({
      error: 'Failed to get system status',
      message: error.message
    });
  }
});

// Get user settings and preferences for AI persona
router.get('/user-profile/:userId?', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user settings from Redis if available
    let userProfile = {
      aiPersonaPreference: 'professional',
      expertiseLevel: 'intermediate',
      preferredScanTypes: ['code-analysis'],
      notificationSettings: {
        email: true,
        voice: false,
        criticalOnly: true
      },
      dashboardLayout: 'default'
    };
    
    if (userId && req.services.redis) {
      try {
        const storedProfile = await req.services.redis.get(`user:${userId}:profile`);
        if (storedProfile) {
          userProfile = { ...userProfile, ...JSON.parse(storedProfile) };
        }
      } catch (redisError) {
        console.warn('Could not load user profile from Redis:', redisError.message);
      }
    }
    
    res.json(userProfile);
    
  } catch (error) {
    console.error('Failed to get user profile:', error);
    res.status(500).json({
      error: 'Failed to get user profile',
      message: error.message
    });
  }
});

// Update user settings for AI persona
router.post('/user-profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profileUpdates = req.body;
    
    // Validate profile updates
    const allowedFields = [
      'aiPersonaPreference', 
      'expertiseLevel', 
      'preferredScanTypes',
      'notificationSettings',
      'dashboardLayout'
    ];
    
    const filteredUpdates = {};
    Object.keys(profileUpdates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = profileUpdates[key];
      }
    });
    
    // Store in Redis if available
    if (req.services.redis) {
      try {
        // Get existing profile
        const existingProfile = await req.services.redis.get(`user:${userId}:profile`);
        const currentProfile = existingProfile ? JSON.parse(existingProfile) : {};
        
        // Merge updates
        const updatedProfile = { ...currentProfile, ...filteredUpdates };
        
        // Store back in Redis with 7 day expiry
        await req.services.redis.setEx(
          `user:${userId}:profile`, 
          7 * 24 * 60 * 60, // 7 days
          JSON.stringify(updatedProfile)
        );
        
        res.json({
          success: true,
          profile: updatedProfile,
          updated: Object.keys(filteredUpdates)
        });
        
      } catch (redisError) {
        console.warn('Could not store user profile in Redis:', redisError.message);
        res.json({
          success: false,
          error: 'Profile storage unavailable',
          requested: filteredUpdates
        });
      }
    } else {
      res.json({
        success: false,
        error: 'Profile storage not configured',
        requested: filteredUpdates
      });
    }
    
  } catch (error) {
    console.error('Failed to update user profile:', error);
    res.status(500).json({
      error: 'Failed to update user profile',
      message: error.message
    });
  }
});

/**
 * Helper functions for analytics calculations
 */

function countFindings(scanResults) {
  if (!scanResults?.findings) return 0;
  
  return Object.values(scanResults.findings).reduce((total, items) => {
    return total + (Array.isArray(items) ? items.length : 0);
  }, 0);
}

function getScanTypeDistribution(pipelines) {
  const distribution = {};
  pipelines.forEach(pipeline => {
    const type = pipeline.scanType || 'unknown';
    distribution[type] = (distribution[type] || 0) + 1;
  });
  return distribution;
}

function calculateComplianceScore(pipelines, standard) {
  // Simple compliance calculation - can be enhanced
  const relevantPipelines = pipelines.filter(p => 
    p.scanResults?.findings?.compliance?.some(c => 
      c.includes && c.includes(standard)
    )
  );
  
  if (relevantPipelines.length === 0) return 'unknown';
  
  const compliantCount = relevantPipelines.filter(p => {
    const findings = p.scanResults?.findings?.compliance || [];
    return findings.length === 0; // No compliance violations
  }).length;
  
  return Math.round((compliantCount / relevantPipelines.length) * 100);
}

async function getConversationCount(database) {
  try {
    // This would require implementing in MongoDB
    return 0;
  } catch (error) {
    return 0;
  }
}

async function getAIRecommendationCount(database) {
  try {
    // Count AI-enhanced findings
    return 0;
  } catch (error) {
    return 0;
  }
}

async function getTopSecurityQuestions(database) {
  return [
    'How do I fix SQL injection vulnerabilities?',
    'What should I do about exposed secrets?',
    'How do I improve my security score?'
  ];
}

function getScanTypeAnalytics(pipelines) {
  const analytics = {};
  
  pipelines.forEach(pipeline => {
    const type = pipeline.scanType || 'unknown';
    if (!analytics[type]) {
      analytics[type] = {
        count: 0,
        avgExecutionTime: 0,
        totalFindings: 0,
        riskDistribution: { critical: 0, high: 0, medium: 0, low: 0 }
      };
    }
    
    analytics[type].count++;
    analytics[type].avgExecutionTime += pipeline.metrics?.totalDuration || 0;
    analytics[type].totalFindings += countFindings(pipeline.scanResults);
    
    const riskLevel = pipeline.scanResults?.summary?.riskLevel || 
                     pipeline.scanResults?.riskAssessment?.overall || 'low';
    if (analytics[type].riskDistribution[riskLevel] !== undefined) {
      analytics[type].riskDistribution[riskLevel]++;
    }
  });
  
  // Calculate averages
  Object.keys(analytics).forEach(type => {
    if (analytics[type].count > 0) {
      analytics[type].avgExecutionTime = Math.round(
        analytics[type].avgExecutionTime / analytics[type].count
      );
    }
  });
  
  return analytics;
}

function getRiskTrends(pipelines) {
  // Simple trend calculation - can be enhanced with time-series data
  const recent = pipelines.slice(0, 10);
  const older = pipelines.slice(10, 20);
  
  const recentCritical = recent.filter(p => 
    (p.scanResults?.summary?.riskLevel === 'critical') ||
    (p.scanResults?.riskAssessment?.overall === 'critical')
  ).length;
  
  const olderCritical = older.filter(p => 
    (p.scanResults?.summary?.riskLevel === 'critical') ||
    (p.scanResults?.riskAssessment?.overall === 'critical')
  ).length;
  
  if (recentCritical < olderCritical) return 'improving';
  if (recentCritical > olderCritical) return 'degrading';
  return 'stable';
}

function getExecutionTimeAnalytics(pipelines) {
  const times = pipelines.map(p => p.metrics?.totalDuration || 0).filter(t => t > 0);
  
  if (times.length === 0) {
    return { min: 0, max: 0, avg: 0, median: 0 };
  }
  
  times.sort((a, b) => a - b);
  
  return {
    min: times[0],
    max: times[times.length - 1],
    avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
    median: times[Math.floor(times.length / 2)]
  };
}

function getFindingsOverTime(pipelines) {
  // Group findings by day - simplified implementation
  const findingsByDay = {};
  
  pipelines.forEach(pipeline => {
    const date = new Date(pipeline.timestamp).toISOString().split('T')[0];
    const findings = countFindings(pipeline.scanResults);
    
    if (!findingsByDay[date]) {
      findingsByDay[date] = 0;
    }
    findingsByDay[date] += findings;
  });
  
  return findingsByDay;
}

function getTopVulnerabilities(pipelines) {
  const vulnCounts = {};
  
  pipelines.forEach(pipeline => {
    if (pipeline.scanResults?.findings?.vulnerabilities) {
      pipeline.scanResults.findings.vulnerabilities.forEach(vuln => {
        const type = vuln.type || vuln.ruleId || 'unknown';
        vulnCounts[type] = (vulnCounts[type] || 0) + 1;
      });
    }
  });
  
  return Object.entries(vulnCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([type, count]) => ({ type, count }));
}

function getAIInsightsAnalytics(pipelines) {
  let aiEnhancedCount = 0;
  let totalRecommendations = 0;
  
  pipelines.forEach(pipeline => {
    if (pipeline.aiInsights) {
      aiEnhancedCount++;
      totalRecommendations += pipeline.aiInsights.remediationPlan?.prioritizedSteps?.length || 0;
    }
  });
  
  return {
    aiEnhancedScans: aiEnhancedCount,
    totalRecommendations,
    enhancementRate: pipelines.length > 0 ? 
      Math.round((aiEnhancedCount / pipelines.length) * 100) : 0
  };
}

function determineOverallHealth(healthChecks) {
  const statuses = healthChecks.map(h => h.status);
  
  if (statuses.every(s => s === 'healthy')) return 'healthy';
  if (statuses.some(s => s === 'error')) return 'degraded';
  return 'partial';
}

module.exports = router;