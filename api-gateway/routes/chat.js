const express = require('express');
const router = express.Router();

/**
 * Chat Routes
 * Conversational AI endpoints for security discussions
 */

// Start new conversation session
router.post('/start', async (req, res) => {
  try {
    const { scanResults, userMessage } = req.body;
    
    if (!scanResults) {
      return res.status(400).json({
        error: 'Scan results required to start conversation',
        example: { scanResults: { findings: {}, summary: {} } }
      });
    }
    
    const conversation = await req.services.conversationAI.startConversation(
      scanResults,
      userMessage
    );
    
    // Store conversation session in database
    if (req.services.database) {
      try {
        await req.services.database.storeConversationSession(
          conversation.sessionId,
          {
            scanContext: scanResults,
            messages: [{
              role: 'assistant',
              content: conversation.message,
              timestamp: new Date().toISOString(),
              type: conversation.type || 'overview'
            }],
            metadata: {
              startedAt: new Date().toISOString(),
              scanType: scanResults.type || 'unknown'
            }
          }
        );
      } catch (dbError) {
        console.warn('Failed to store conversation session:', dbError.message);
      }
    }
    
    res.json(conversation);
    
  } catch (error) {
    console.error('Failed to start conversation:', error);
    res.status(500).json({
      error: 'Failed to start conversation',
      message: error.message
    });
  }
});

// Send message to AI
router.post('/message', async (req, res) => {
  try {
    const { message, sessionId, options = {} } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
        example: { message: "How do I fix the SQL injection vulnerability?" }
      });
    }
    
    // Get conversation context from database if sessionId provided
    let conversationContext = null;
    if (sessionId && req.services.database) {
      try {
        conversationContext = await req.services.database.getConversationSession(sessionId);
        if (conversationContext && conversationContext.scanContext) {
          // Set scan results context for AI
          req.services.conversationAI.currentScanResults = conversationContext.scanContext;
        }
      } catch (dbError) {
        console.warn('Could not load conversation context:', dbError.message);
      }
    }
    
    // Get AI response
    const response = await req.services.conversationAI.chat(message, options);
    
    // Add AI persona and sentiment analysis
    const enhancedResponse = await enhanceResponseWithPersona(response, conversationContext);
    
    // Store conversation messages in database
    if (sessionId && req.services.database) {
      try {
        await req.services.database.updateConversationSession(sessionId, [
          {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
          },
          {
            role: 'assistant',
            content: enhancedResponse.message,
            timestamp: new Date().toISOString(),
            model: enhancedResponse.model || 'unknown',
            persona: enhancedResponse.persona
          }
        ]);
      } catch (dbError) {
        console.warn('Failed to store conversation messages:', dbError.message);
      }
    }
    
    res.json(enhancedResponse);
    
  } catch (error) {
    console.error('Chat message failed:', error);
    res.status(500).json({
      error: 'Chat message failed',
      message: error.message
    });
  }
});

// Get conversation history
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const conversation = await req.services.database.getConversationSession(sessionId);
    
    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
        sessionId
      });
    }
    
    res.json({
      sessionId,
      messages: conversation.messages || [],
      scanContext: conversation.scanContext,
      createdAt: conversation.createdAt,
      lastUpdated: conversation.lastUpdated
    });
    
  } catch (error) {
    console.error('Failed to get conversation history:', error);
    res.status(500).json({
      error: 'Failed to get conversation history',
      message: error.message
    });
  }
});

// Clear conversation
router.delete('/clear/:sessionId?', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (sessionId) {
      // Clear specific conversation (in production, mark as inactive)
      if (req.services.database) {
        // In a real implementation, you might mark as inactive instead of deleting
        console.log(`Clearing conversation: ${sessionId}`);
      }
    } else {
      // Clear current conversation AI state
      req.services.conversationAI.clearConversation();
    }
    
    res.json({
      success: true,
      message: sessionId ? `Conversation ${sessionId} cleared` : 'Current conversation cleared'
    });
    
  } catch (error) {
    console.error('Failed to clear conversation:', error);
    res.status(500).json({
      error: 'Failed to clear conversation',
      message: error.message
    });
  }
});

// Export conversation for reports
router.get('/export/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { format = 'json' } = req.query;
    
    const conversation = await req.services.database.getConversationSession(sessionId);
    
    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
        sessionId
      });
    }
    
    const exportData = {
      sessionId,
      exportedAt: new Date().toISOString(),
      conversation: conversation.messages || [],
      scanSummary: {
        type: conversation.scanContext?.type || 'unknown',
        timestamp: conversation.scanContext?.timestamp,
        riskLevel: conversation.scanContext?.summary?.riskLevel || 'unknown'
      },
      analytics: {
        messageCount: conversation.messages?.length || 0,
        duration: calculateConversationDuration(conversation),
        topicsDiscussed: extractTopicsFromConversation(conversation.messages || [])
      }
    };
    
    if (format === 'csv') {
      // Convert to CSV format for report integration
      const csv = convertConversationToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="conversation-${sessionId}.csv"`);
      res.send(csv);
    } else {
      res.json(exportData);
    }
    
  } catch (error) {
    console.error('Failed to export conversation:', error);
    res.status(500).json({
      error: 'Failed to export conversation',
      message: error.message
    });
  }
});

/**
 * Enhance AI response with persona based on scan type and sentiment
 */
async function enhanceResponseWithPersona(response, conversationContext) {
  try {
    // Determine AI persona based on scan context
    let persona = 'professional'; // default
    
    if (conversationContext && conversationContext.scanContext) {
      const scanType = conversationContext.scanContext.type;
      const riskLevel = conversationContext.scanContext.summary?.riskLevel || 
                       conversationContext.scanContext.riskAssessment?.overall;
      
      // AI persona logic
      if (scanType === 's3-bucket' || scanType === 'cloud-security') {
        persona = 'cloud-security-expert';
      } else if (scanType === 'code-analysis') {
        persona = 'code-security-mentor';
      } else if (scanType === 'github-repository') {
        persona = 'devops-consultant';
      }
      
      // Adjust tone based on risk level
      if (riskLevel === 'critical') {
        persona += '-urgent';
      } else if (riskLevel === 'low') {
        persona += '-encouraging';
      }
    }
    
    // Simple sentiment analysis of user's last message
    const sentiment = analyzeSentiment(response.message);
    
    return {
      ...response,
      persona: persona,
      sentiment: sentiment,
      enhancedAt: new Date().toISOString(),
      suggestedPersonaAdjustments: getPersonaSuggestions(persona, sentiment)
    };
    
  } catch (error) {
    console.warn('Failed to enhance response with persona:', error.message);
    return response;
  }
}

/**
 * Simple sentiment analysis (can be enhanced with NPM sentiment package)
 */
function analyzeSentiment(text) {
  const positiveWords = ['good', 'great', 'excellent', 'helpful', 'thank', 'perfect'];
  const negativeWords = ['bad', 'terrible', 'awful', 'confused', 'difficult', 'problem'];
  const urgentWords = ['urgent', 'critical', 'immediate', 'asap', 'emergency'];
  
  const lowerText = text.toLowerCase();
  
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
  const urgentCount = urgentWords.filter(word => lowerText.includes(word)).length;
  
  if (urgentCount > 0) return 'urgent';
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

/**
 * Get persona adjustment suggestions
 */
function getPersonaSuggestions(persona, sentiment) {
  const suggestions = [];
  
  if (sentiment === 'urgent') {
    suggestions.push('Use direct, action-oriented language');
    suggestions.push('Provide immediate next steps');
  } else if (sentiment === 'negative') {
    suggestions.push('Use reassuring, supportive tone');
    suggestions.push('Break down complex solutions into simple steps');
  } else if (sentiment === 'positive') {
    suggestions.push('Maintain encouraging tone');
    suggestions.push('Provide additional learning resources');
  }
  
  return suggestions;
}

/**
 * Helper functions for conversation export
 */
function calculateConversationDuration(conversation) {
  if (!conversation.messages || conversation.messages.length < 2) return 0;
  
  const start = new Date(conversation.createdAt);
  const end = new Date(conversation.lastUpdated);
  return Math.round((end - start) / 1000); // seconds
}

function extractTopicsFromConversation(messages) {
  const topics = new Set();
  const securityTopics = [
    'sql injection', 'xss', 'csrf', 'authentication', 'encryption', 
    'secrets', 'permissions', 'compliance', 'vulnerability'
  ];
  
  messages.forEach(msg => {
    if (msg.role === 'user') {
      const content = msg.content.toLowerCase();
      securityTopics.forEach(topic => {
        if (content.includes(topic)) {
          topics.add(topic);
        }
      });
    }
  });
  
  return Array.from(topics);
}

function convertConversationToCSV(exportData) {
  const headers = 'Timestamp,Role,Message,Persona,Model\n';
  const rows = exportData.conversation.map(msg => {
    const timestamp = msg.timestamp || '';
    const role = msg.role || '';
    const message = (msg.content || '').replace(/"/g, '""'); // Escape quotes
    const persona = msg.persona || '';
    const model = msg.model || '';
    
    return `"${timestamp}","${role}","${message}","${persona}","${model}"`;
  }).join('\n');
  
  return headers + rows;
}

module.exports = router;