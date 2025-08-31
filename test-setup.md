# SentinelHub Testing Guide

## Prerequisites Verification

Before starting, ensure you have:

1. **Docker Desktop** - Download from https://docker.com
2. **Node.js 18+** - Download from https://nodejs.org
3. **Git** - Download from https://git-scm.com

## Quick Test Commands

### 1. Test Docker Installation
```bash
docker --version
docker-compose --version
```

### 2. Test Node.js Installation
```bash
node --version
npm --version
```

### 3. Clone and Setup (if not done)
```bash
git clone https://github.com/Sarahenia20/SentinelHub.git
cd SentinelHub
```

### 4. Environment Configuration
```bash
# Copy environment templates
cp .env.example .env
cp backend/api-gateway/.env.example backend/api-gateway/.env

# Edit .env files with your API keys
# At minimum, you need Clerk keys for authentication
```

### 5. Start Services
```bash
# Start all services
docker-compose up -d

# Or start specific services for testing
docker-compose up redis api-gateway frontend
```

### 6. Health Checks
Once services are running, verify:

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:5000/health
- **Redis**: http://localhost:8001 (Redis Insight)
- **Grafana**: http://localhost:3001 (admin/sentinelhub123)
- **Prometheus**: http://localhost:9090
- **SonarQube**: http://localhost:9000

### 7. Test Scanner Functionality

1. Navigate to http://localhost:3000
2. Sign up/login with Clerk authentication
3. Go to Scanner page
4. Paste code in Monaco Editor
5. Click "Start Security Scan"
6. Watch real-time progress updates
7. Review scan results

### 8. Test API Endpoints

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test scan endpoint (requires authentication)
curl -X POST http://localhost:5000/api/scan/code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{"code": "console.log(\"Hello World\");", "language": "javascript"}'
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Stop conflicting services
   docker-compose down
   # Check what's using the port
   netstat -tulpn | grep :3000
   ```

2. **Permission Denied**
   ```bash
   # On Windows, run as Administrator
   # On Linux/Mac, use sudo if needed
   sudo docker-compose up
   ```

3. **Memory Issues**
   ```bash
   # Increase Docker memory limit to 4GB+
   # In Docker Desktop: Settings > Resources > Memory
   ```

4. **API Connection Failures**
   - Verify environment variables are set
   - Check Clerk keys are valid
   - Ensure Redis is running

### Monaco Editor Issues

If the code editor doesn't load:
1. Clear browser cache
2. Check browser console for errors
3. Verify `@monaco-editor/react` is installed:
   ```bash
   cd SHClient
   npm list @monaco-editor/react
   ```

### WebSocket Connection Issues

If real-time updates don't work:
1. Check WebSocket URL in browser dev tools
2. Verify port 8080 is accessible
3. Check firewall settings

## Development Mode

For development without Docker:

### Backend
```bash
cd backend/api-gateway
npm install
npm run dev
```

### Frontend
```bash
cd SHClient
npm install
npm run dev
```

### Redis (Docker only)
```bash
docker run -d --name redis-dev -p 6379:6379 redis/redis-stack:latest
```

## Performance Testing

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Create test config
echo "config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'Scan API'
    requests:
      - post:
          url: '/api/scan/code'
          json:
            code: 'console.log(\"test\");'
            language: 'javascript'" > load-test.yml

# Run load test
artillery run load-test.yml
```

## Next Steps

After successful testing:
1. Configure production environment variables
2. Set up SSL certificates for HTTPS
3. Configure monitoring dashboards
4. Set up automated backups
5. Configure CI/CD pipeline with GitHub Actions