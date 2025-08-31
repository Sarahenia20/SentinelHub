const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const WebSocket = require('ws');
const { createClient } = require('redis');
const { spawn } = require('child_process');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
// Load environment variables from services directory
require('dotenv').config({ path: '../services/.env' });

const app = express();
const PORT = process.env.PORT || 5000;
const WS_PORT = process.env.WS_PORT || 8081;

// Security middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// CORS configuration for Next.js frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3005', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Redis client setup
let redisClient = null;

async function initRedis() {
  try {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    };

    redisClient = createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
      },
      password: redisConfig.password,
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('🔌 Redis connecting...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis connected and ready!');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    await redisClient.connect();
    
    // Test the connection
    await redisClient.ping();
    console.log('🎯 Redis ping successful!');
    
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error.message);
    console.log('📝 Running without Redis (caching disabled)');
    redisClient = null;
  }
}

// Initialize Redis connection
initRedis();

// WebSocket Server for real-time updates (temporarily disabled)
// const wss = new WebSocket.Server({ port: WS_PORT });
const activeConnections = new Map();

/* WebSocket code temporarily disabled
wss.on('connection', (ws, req) => {
  const connectionId = Date.now() + Math.random();
  activeConnections.set(connectionId, ws);
  
  console.log(`WebSocket client connected: ${connectionId}`);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);
      
      // Echo back for testing
      ws.send(JSON.stringify({
        type: 'ack',
        message: 'Message received',
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    activeConnections.delete(connectionId);
    console.log(`WebSocket client disconnected: ${connectionId}`);
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to SentinelHub WebSocket',
    timestamp: new Date().toISOString()
  }));
});
*/

// Broadcast function for scan updates
function broadcastScanUpdate(scanId, update) {
  const message = JSON.stringify({
    type: 'scanUpdate',
    scanId,
    ...update,
    timestamp: new Date().toISOString()
  });
  
  activeConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const redisStatus = await checkRedisHealth();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      redis: redisStatus,
      websocket: `disabled`,
      connections: 0
    }
  });
});

// Redis health check function
async function checkRedisHealth() {
  if (!redisClient) {
    return 'disabled';
  }
  
  try {
    await redisClient.ping();
    return 'connected';
  } catch (error) {
    console.error('Redis health check failed:', error.message);
    return 'error';
  }
}

// Public endpoint - no auth required
app.get('/api/status', (req, res) => {
  res.json({
    message: 'SentinelHub API Gateway is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      pasteScan: '/api/paste/*',
      scan: '/api/scan/*',
      github: '/api/github/*',
      reports: '/api/reports/*',
      settings: '/api/settings/*'
    }
  });
});

// Import SentinelHub services
const SecurityPipelineOrchestrator = require('../services/security-pipeline/pipeline-orchestrator');
const MongoDBManager = require('../services/database/mongodb-manager');
const ConversationAI = require('../services/ai-intelligence/conversation-ai');

// Initialize services
let pipelineOrchestrator, mongoDatabase, conversationAI;
let chatServiceProcess = null;

// Start chat service as child process
function startChatService() {
  console.log('🤖 Starting integrated chat service...');
  
  try {
    const chatServicePath = '../services/chat-service/server.js';
    chatServiceProcess = spawn('node', [chatServicePath], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    chatServiceProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`[CHAT SERVICE] ${output}`);
      }
    });

    chatServiceProcess.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (error) {
        console.error(`[CHAT SERVICE ERROR] ${error}`);
      }
    });

    chatServiceProcess.on('close', (code) => {
      console.log(`[CHAT SERVICE] Process exited with code ${code}`);
      if (code !== 0) {
        console.error('❌ Chat service crashed, restarting in 5 seconds...');
        setTimeout(startChatService, 5000);
      }
    });

    chatServiceProcess.on('error', (error) => {
      console.error('❌ Failed to start chat service:', error.message);
    });

    console.log('✅ Chat service started successfully');
  } catch (error) {
    console.error('❌ Failed to start chat service:', error.message);
  }
}

async function initializeServices() {
  console.log('Initializing SentinelHub services...');
  
  try {
    pipelineOrchestrator = new SecurityPipelineOrchestrator();
    mongoDatabase = new MongoDBManager();
    conversationAI = new ConversationAI();
    
    // Start integrated chat service
    startChatService();
    
    // Wait for database connection
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ SentinelHub services initialized');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error.message);
    throw error;
  }
}

// Import route handlers
const scanRoutes = require('./routes/scan');
const pasteScanRoutes = require('./routes/paste-scan');
const githubRoutes = require('./routes/github');
const awsRoutes = require('./routes/aws');
const dockerRoutes = require('./routes/docker');
const dockerBenchRoutes = require('./routes/docker-bench');
const reportsRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const externalApiRoutes = require('./routes/external-apis');

// Add new routes for integrated system
const pipelineRoutes = require('./routes/pipeline');
// chatRoutes removed - now handled by separate chat service on port 4000
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const reportsManagementRoutes = require('./routes/reports-management');

// Middleware to make services available to routes
app.use((req, res, next) => {
  req.services = {
    pipeline: pipelineOrchestrator,
    database: mongoDatabase,
    conversationAI: conversationAI,
    redis: redisClient,
    broadcastUpdate: broadcastScanUpdate
  };
  next();
});

// Public API Routes (no auth required for integrations)
app.use('/api/paste', pasteScanRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/aws', awsRoutes);
app.use('/api/docker', dockerRoutes);
app.use('/api/docker-bench', dockerBenchRoutes);
app.use('/api/external', externalApiRoutes);

// New SentinelHub Pipeline Routes (public for testing, can add auth later)
app.use('/api/pipeline', pipelineRoutes);
// /api/chat removed - now handled by separate chat service on port 4000
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports-management', reportsManagementRoutes);

// Protected API Routes (require Clerk authentication)
app.use('/api/scan', ClerkExpressRequireAuth(), scanRoutes);
app.use('/api/reports', ClerkExpressRequireAuth(), reportsRoutes);
app.use('/api/settings', ClerkExpressRequireAuth(), settingsRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  
  if (error.status === 401) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Please sign in to access this resource'
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  // Close WebSocket connections
  activeConnections.forEach((ws) => {
    ws.close();
  });
  
  // Terminate chat service
  if (chatServiceProcess && !chatServiceProcess.killed) {
    console.log('🛑 Terminating chat service...');
    chatServiceProcess.kill('SIGTERM');
    
    // Give it time to shut down gracefully, then force kill if needed
    setTimeout(() => {
      if (!chatServiceProcess.killed) {
        console.log('🔪 Force killing chat service...');
        chatServiceProcess.kill('SIGKILL');
      }
    }, 5000);
  }
  
  // Close Redis connection
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('✅ Redis connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing Redis connection:', error.message);
    }
  }
  
  process.exit(0);
});

// Also handle SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  
  // Terminate chat service
  if (chatServiceProcess && !chatServiceProcess.killed) {
    console.log('🛑 Terminating chat service...');
    chatServiceProcess.kill('SIGTERM');
  }
  
  process.exit(0);
});

// Start server with service initialization
async function startServer() {
  try {
    // Initialize services first
    await initializeServices();
    
    app.listen(PORT, () => {
      console.log(`🚀 SentinelHub API Gateway running on port ${PORT}`);
      console.log(`🔌 WebSocket server disabled (temporary)`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🛡️ Pipeline endpoint: http://localhost:${PORT}/api/pipeline/execute`);
      console.log(`💬 Chat service: INTEGRATED (running on port 4000)`);
      console.log(`📋 Dashboard endpoint: http://localhost:${PORT}/api/dashboard/metrics`);
      console.log(`\n🎯 SINGLE COMMAND STARTUP - All services running!`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start SentinelHub server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();

// Export for testing
module.exports = { app, broadcastScanUpdate };


