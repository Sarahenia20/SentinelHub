const express = require('express');
const router = express.Router();

/**
 * Pipeline Routes
 * Main security scanning pipeline endpoints
 */

// Execute security pipeline
router.post('/execute', async (req, res) => {
  try {
    const { type, input, options = {} } = req.body;
    
    if (!type || !input) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['type', 'input'],
        received: Object.keys(req.body)
      });
    }
    
    console.log(`Executing ${type} pipeline...`);
    
    // Execute pipeline
    const result = await req.services.pipeline.executePipeline({
      type,
      input,
      options
    });
    
    // Store results in MongoDB
    if (result.status === 'completed' && req.services.database) {
      try {
        const storageResult = await req.services.database.storePipelineResults({
          pipelineId: result.pipelineId,
          scanType: type,
          scanResults: result.scanResults,
          aiInsights: result.aiInsights,
          conversationSession: result.conversation,
          metrics: result.pipeline?.metrics || {},
          status: result.status
        });
        
        result.stored = storageResult.stored;
        console.log(`Pipeline results stored: ${storageResult.stored}`);
        
      } catch (storageError) {
        console.warn('Failed to store pipeline results:', storageError.message);
        result.storageWarning = 'Results not persisted to database';
      }
    }
    
    // Broadcast update to connected clients
    if (req.services.broadcastUpdate) {
      req.services.broadcastUpdate(result.pipelineId, {
        type: 'pipeline_completed',
        status: result.status,
        findings: result.scanResults?.findings || {}
      });
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Pipeline execution failed:', error);
    res.status(500).json({
      error: 'Pipeline execution failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get pipeline status
router.get('/status/:pipelineId', async (req, res) => {
  try {
    const { pipelineId } = req.params;
    
    const status = req.services.pipeline.getPipelineStatus(pipelineId);
    
    if (!status) {
      return res.status(404).json({
        error: 'Pipeline not found',
        pipelineId
      });
    }
    
    res.json(status);
    
  } catch (error) {
    console.error('Failed to get pipeline status:', error);
    res.status(500).json({
      error: 'Failed to get pipeline status',
      message: error.message
    });
  }
});

// Get pipeline history
router.get('/history', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const history = req.services.pipeline.getPipelineHistory();
    const limitedHistory = history.slice(0, parseInt(limit));
    
    res.json({
      history: limitedHistory,
      total: history.length,
      limit: parseInt(limit)
    });
    
  } catch (error) {
    console.error('Failed to get pipeline history:', error);
    res.status(500).json({
      error: 'Failed to get pipeline history',
      message: error.message
    });
  }
});

// Chat about pipeline results
router.post('/chat/:pipelineId', async (req, res) => {
  try {
    const { pipelineId } = req.params;
    const { message, options = {} } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
        example: { message: "What are the critical security issues?" }
      });
    }
    
    const chatResponse = await req.services.pipeline.chatAboutResults(
      pipelineId, 
      message, 
      options
    );
    
    // Store conversation update in database
    if (req.services.database) {
      try {
        await req.services.database.updateConversationSession(
          chatResponse.sessionId || pipelineId,
          [{
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
          }, {
            role: 'assistant',
            content: chatResponse.message,
            timestamp: new Date().toISOString(),
            model: chatResponse.model || 'unknown'
          }]
        );
      } catch (dbError) {
        console.warn('Failed to store conversation:', dbError.message);
      }
    }
    
    res.json(chatResponse);
    
  } catch (error) {
    console.error('Chat failed:', error);
    res.status(500).json({
      error: 'Chat failed',
      message: error.message
    });
  }
});

// Get service health
router.get('/health', async (req, res) => {
  try {
    const health = await req.services.pipeline.getHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;