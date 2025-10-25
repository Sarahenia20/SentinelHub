const express = require('express');
const router = express.Router();
const DockerBenchService = require('../../services/docker-bench-service');

// Docker Bench Security endpoint
router.post('/security-scan', async (req, res) => {
  try {
    const dockerBench = new DockerBenchService();
    const scanResult = await dockerBench.runSecurityScan();

    if (scanResult.success) {
      console.log(`🔒 Docker Bench Security scan completed: ${scanResult.benchmark.securityScore}% security score`);
      console.log(`📊 Found ${scanResult.summary.critical} critical, ${scanResult.summary.high} high priority issues`);

      // Save scan results to database for intelligence and reports
      try {
        if (req.services && req.services.database) {
          await req.services.database.storePipelineResults({
            pipelineId: `docker-bench-${Date.now()}`,
            scanType: 'docker-bench',
            timestamp: new Date().toISOString(),
            scanResults: scanResult,
            summary: {
              securityScore: scanResult.benchmark.securityScore,
              totalIssues: scanResult.summary.critical + scanResult.summary.high + scanResult.summary.medium + scanResult.summary.low,
              riskLevel: scanResult.summary.critical > 0 ? 'critical' : scanResult.summary.high > 0 ? 'high' : 'medium'
            },
            findings: scanResult.summary,
            status: 'completed'
          });
          console.log(`✅ Saved Docker scan to database`);
        }
      } catch (dbError) {
        console.error('Failed to save to database (non-fatal):', dbError.message);
      }
    }

    res.json(scanResult);

  } catch (error) {
    console.error('Docker Bench Security scan failed:', error);
    res.status(500).json({
      success: false,
      error: 'Docker security scan failed',
      message: error.message
    });
  }
});

module.exports = router;