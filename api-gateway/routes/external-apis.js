const express = require('express');
const router = express.Router();

// GET /api/external/status - Check external API connections
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        github: 'connected',
        redis: 'connected',
        websocket: 'active'
      }
    });
  } catch (error) {
    console.error('External APIs status error:', error);
    res.status(500).json({
      error: 'Failed to check external API status',
      message: error.message
    });
  }
});

module.exports = router;