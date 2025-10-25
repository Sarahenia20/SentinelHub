const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.CHAT_PORT || 4000;

// Security middleware
app.use(helmet());
app.use(morgan('combined'));

// CORS configuration - allow main frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import AI service
const ConversationAI = require('../ai-intelligence/conversation-ai');

// Initialize AI service
let conversationAI;

async function initializeChatService() {
  console.log('🤖 Initializing Isolated Chat Service...');
  
  try {
    conversationAI = new ConversationAI();
    console.log('✅ Chat AI service initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Chat AI service:', error.message);
    throw error;
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'SentinelHub Chat Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: PORT
  });
});

// Security-focused chat endpoint
app.post('/api/chat/message', async (req, res) => {
  try {
    const { message, sessionId, options } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
        timestamp: new Date().toISOString()
      });
    }

    // Security topic validation
    const securityKeywords = [
      'security', 'vulnerability', 'code', 'scan', 'analysis', 'threat', 
      'risk', 'compliance', 'authentication', 'authorization', 'encryption',
      'injection', 'xss', 'csrf', 'owasp', 'cve', 'secret', 'credential',
      'api', 'database', 'network', 'malware', 'phishing', 'patch',
      'audit', 'assessment', 'penetration', 'firewall', 'ssl', 'tls'
    ];

    const messageText = message.toLowerCase();
    const isSecurityRelated = securityKeywords.some(keyword => 
      messageText.includes(keyword)
    );

    if (!isSecurityRelated) {
      return res.json({
        message: "I'm a security-focused AI assistant. I can only help with security analysis, vulnerability assessment, code security, compliance, and cybersecurity topics. Please ask me about security-related matters like vulnerabilities, code analysis, threat assessment, or security best practices.",
        type: "security_scope_reminder",
        timestamp: new Date().toISOString(),
        sessionId: sessionId || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        actionableSteps: [],
        followUpQuestions: [
          "What security vulnerabilities should I look for in my code?",
          "How can I improve my application's security posture?",
          "What are the most common security risks in web applications?",
          "Can you analyze this code for security issues?"
        ]
      });
    }

    // Enhanced security prompt with formatting requirements
    const securityPrompt = `You are SentinelHub's Security AI Assistant. You ONLY discuss cybersecurity, application security, vulnerability analysis, code security, compliance, and related technical security topics.

User Context: ${message}

Respond as a professional security expert focusing on:
- Security vulnerabilities and fixes
- Code security analysis
- Threat assessment and risk analysis
- Compliance and security standards
- Best practices for secure development

Requirements:
- Keep response under 12 lines
- Use proper markdown formatting (**bold**, ### headings, - bullet points)
- Be engaging yet professional
- Balance conciseness with helpfulness
- Show expertise while being approachable`;

    console.log(`🤖 Processing security chat: "${message.substring(0, 100)}..."`);

    const response = await conversationAI.geminiAI.queryGemini(securityPrompt, {
      sessionId: sessionId || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      maxTokens: options?.maxTokens || 200, // Reduced for shorter responses
      temperature: options?.temperature || 0.7
    });

    // Format response to match expected chat format
    const formattedResponse = {
      message: response.message || response,
      type: "chat_response",
      timestamp: new Date().toISOString(),
      sessionId: response.sessionId || sessionId || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      actionableSteps: [],
      followUpQuestions: [
        "Can you analyze specific code for security vulnerabilities?",
        "What security best practices should I implement?",
        "How can I prevent common security attacks?",
        "What security testing should I perform?"
      ]
    };

    res.json(formattedResponse);

  } catch (error) {
    console.error('❌ Chat service error:', error);
    
    res.status(500).json({
      error: 'Chat service temporarily unavailable',
      message: 'Please try again in a moment',
      timestamp: new Date().toISOString(),
      type: 'service_error'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Chat Service Error:', error);
  
  res.status(500).json({
    error: 'Chat Service Error',
    message: 'An unexpected error occurred in the chat service',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Chat Service - Endpoint Not Found',
    message: 'This chat service only handles /api/chat/message',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Chat Service shutting down gracefully...');
  process.exit(0);
});

// Start chat service
async function startChatService() {
  try {
    await initializeChatService();
    
    app.listen(PORT, () => {
      console.log(`🤖 SentinelHub Chat Service running on port ${PORT}`);
      console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat/message`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔒 Security-focused conversations only`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start Chat Service:', error.message);
    process.exit(1);
  }
}

startChatService();

module.exports = { app };