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