const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const WebSocket = require('ws');
const { createClient } = require('redis');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const WS_PORT = process.env.WS_PORT || 8080;

// Security middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// CORS configuration for Next.js frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
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
let redisClient;
(async () => {
  redisClient = createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  });
  
  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  await redisClient.connect();
  console.log('Connected to Redis');
})();

// WebSocket Server for real-time updates
const wss = new WebSocket.Server({ port: WS_PORT });
const activeConnections = new Map();

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
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      redis: redisClient.isReady ? 'connected' : 'disconnected',
      websocket: `running on port ${WS_PORT}`,
      connections: activeConnections.size
    }
  });
});

// Public endpoint - no auth required
app.get('/api/status', (req, res) => {
  res.json({
    message: 'SentinelHub API Gateway is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      scan: '/api/scan/*',
      github: '/api/github/*',
      reports: '/api/reports/*',
      settings: '/api/settings/*'
    }
  });
});

// Import route handlers
const scanRoutes = require('./routes/scan');
const githubRoutes = require('./routes/github');
const reportsRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const externalApiRoutes = require('./routes/external-apis');

// Protected routes - require Clerk authentication
app.use('/api/scan', ClerkExpressRequireAuth(), scanRoutes);
app.use('/api/github', ClerkExpressRequireAuth(), githubRoutes);
app.use('/api/reports', ClerkExpressRequireAuth(), reportsRoutes);
app.use('/api/settings', ClerkExpressRequireAuth(), settingsRoutes);
app.use('/api/external', ClerkExpressRequireAuth(), externalApiRoutes);

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
  
  // Close Redis connection
  if (redisClient) {
    await redisClient.quit();
  }
  
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 SentinelHub API Gateway running on port ${PORT}`);
  console.log(`🔌 WebSocket server running on port ${WS_PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Export for testing
module.exports = { app, broadcastScanUpdate };