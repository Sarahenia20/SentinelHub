# 🛡️ SentinelHub - Professional Security Platform

[![Security Pipeline](https://github.com/Sarahenia20/SentinelHub/actions/workflows/security-pipeline.yml/badge.svg)](https://github.com/Sarahenia20/SentinelHub/actions/workflows/security-pipeline.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Comprehensive DevSecOps platform with real-time security scanning, AI-powered insights, and automated pipeline integration.**

## 🚀 Features

### 🔍 **Security Scanners**
- **ESLint + Security Plugins** - JavaScript/TypeScript security analysis
- **Semgrep** - Multi-language static analysis with OWASP rules
- **Docker Bench Security** - Container security benchmarking
- **Trivy** - Vulnerability scanning for containers and filesystems
- **Secret Detection** - Advanced regex patterns for API keys, tokens, credentials
- **SonarQube Integration** - Code quality and security analysis

### 🌐 **External Integrations**
- **VirusTotal API** - File/URL scanning with 70+ antivirus engines
- **Shodan API** - Internet-connected device reconnaissance
- **AbuseIPDB API** - IP reputation and abuse reporting
- **CVE Details API** - Comprehensive vulnerability database
- **GitHub API** - Repository analysis via Clerk OAuth

### 🤖 **AI & Intelligence**
- **Gemma AI** - Local AI model for vulnerability explanations
- **CodeRabbit AI** - AI-powered code review and suggestions
- **Real-time Chat** - AI assistant for security guidance

### 📊 **Monitoring & Dashboards**
- **Grafana Dashboards** - Custom security metrics visualization
- **Prometheus Metrics** - System performance monitoring
- **Redis Analytics** - Scan history and trend analysis
- **Real-time WebSocket** - Live scan progress updates

## 🏗️ Architecture

```
SentinelHub/
├── SHClient/                 # Next.js 15 Frontend
├── backend/
│   └── api-gateway/         # Express.js API Gateway
├── services/
│   ├── redis/               # Redis Database
│   ├── grafana/             # Grafana Dashboards
│   └── prometheus/          # Metrics Collection
├── .github/workflows/       # GitHub Actions Security Pipeline
└── docker-compose.yml      # Full Stack Deployment
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **Docker & Docker Compose**
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/Sarahenia20/SentinelHub.git
cd SentinelHub
```

### 2. Environment Setup
```bash
# Copy environment template
cp backend/api-gateway/.env.example backend/api-gateway/.env

# Edit with your API keys
nano backend/api-gateway/.env
```

### 3. Required API Keys
```env
# Clerk Authentication (Required)
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# External APIs (Optional but recommended)
VIRUSTOTAL_API_KEY=your_virustotal_key
SHODAN_API_KEY=your_shodan_key
ABUSEIPDB_API_KEY=your_abuseipdb_key
OPENAI_API_KEY=your_openai_key_optional

# Database
REDIS_PASSWORD=sentinelhub123
```

### 4. Start Full Stack
```bash
# Start all services
docker-compose up -d

# Or start individual services
docker-compose up frontend api-gateway redis
```

### 5. Access Applications
- **🌐 Frontend**: http://localhost:3000
- **⚡ API Gateway**: http://localhost:5000
- **📊 Grafana**: http://localhost:3001 (admin/sentinelhub123)
- **🔍 Prometheus**: http://localhost:9090
- **💾 Redis Insight**: http://localhost:8001
- **📈 SonarQube**: http://localhost:9000

## 🔧 Development Setup

### Frontend (Next.js)
```bash
cd SHClient
npm install
npm run dev
```

### Backend (Express.js)
```bash
cd backend/api-gateway
npm install
npm run dev
```

### Database (Redis)
```bash
docker run -d --name redis-dev -p 6379:6379 redis/redis-stack:latest
```

## 📱 Usage Guide

### 1. **Authentication**
- Sign up with GitHub (recommended) or email
- GitHub auth provides automatic repository access
- Non-GitHub users can connect GitHub later in Settings

### 2. **Scanner Page**
- **Code Tab**: Paste code for immediate analysis
- **Repository Tab**: Scan GitHub repositories (requires GitHub connection)
- **S3 Tab**: Scan AWS S3 buckets (requires AWS credentials)
- **Container Tab**: Analyze Docker images

### 3. **Security Reports**
- View scan history with filtering
- Export results in JSON/CSV format
- Detailed vulnerability analysis
- Compliance tracking (OWASP, NIST, ISO27001)

### 4. **Settings**
- Connect GitHub account
- Configure AWS credentials
- Set up OpenAI API for enhanced AI features
- Manage platform preferences

## 🔌 API Endpoints

### Scanner Endpoints
```bash
POST /api/scan/code          # Analyze pasted code
POST /api/scan/github        # Scan GitHub repository
POST /api/scan/s3            # Scan AWS S3 bucket
POST /api/scan/container     # Scan Docker container
```

### GitHub Integration
```bash
GET  /api/github/status      # Check GitHub connection
GET  /api/github/repositories # List user repositories
GET  /api/github/repository/:owner/:repo # Repository details
```

### Reports & Analytics
```bash
GET  /api/reports           # Scan history with filtering
GET  /api/reports/:id       # Detailed scan results
POST /api/reports/export    # Export scan results
GET  /api/reports/analytics/trends # Security trends
```

### External APIs
```bash
POST /api/external/virustotal/scan    # VirusTotal scanning
POST /api/external/shodan/lookup      # Shodan IP lookup
POST /api/external/abuseipdb/check    # IP reputation check
GET  /api/external/cve/:cveId         # CVE details
```

## 🔐 Security Features

### **Multi-Engine Scanning**
- Parallel execution of security engines
- Weighted scoring system
- CVSS integration
- False positive reduction

### **Real-time Analysis**
- WebSocket progress updates
- Live vulnerability detection
- Streaming scan results
- Dynamic threat assessment

### **Compliance Tracking**
- OWASP Top 10 mapping
- NIST Framework alignment
- ISO 27001 compliance
- Custom security policies

## 🎯 GitHub Actions Integration

### Automatic Security Pipeline
```yaml
# Triggers on push/PR
on: [push, pull_request]

# Security scans included:
- ESLint Security Analysis
- Semgrep Static Analysis
- Secret Scanning (TruffleHog)
- Docker Security (Trivy + Hadolint)
- Infrastructure Analysis (Checkov)
- SonarQube Integration
```

### Setup GitHub Secrets
```bash
CLERK_PUBLISHABLE_KEY    # Clerk authentication
CLERK_SECRET_KEY         # Clerk authentication
VIRUSTOTAL_API_KEY       # VirusTotal integration
SHODAN_API_KEY           # Shodan integration
ABUSEIPDB_API_KEY        # AbuseIPDB integration
SONAR_TOKEN              # SonarQube integration
SENTINELHUB_WEBHOOK_URL  # Dashboard notifications
```

## 🚀 Production Deployment

### Docker Compose Production
```bash
# Production environment
docker-compose -f docker-compose.prod.yml up -d

# With SSL
docker-compose -f docker-compose.ssl.yml up -d
```

### Environment Variables
```env
NODE_ENV=production
REDIS_PASSWORD=strong_password_here
GRAFANA_PASSWORD=strong_password_here
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

## 📊 Monitoring

### **Grafana Dashboards**
- Security metrics overview
- Scan performance analytics
- Vulnerability trends
- System health monitoring

### **Prometheus Metrics**
- API response times
- Scan success rates
- Error tracking
- Resource utilization

### **Redis Analytics**
- Scan history storage
- User preferences
- Integration settings
- Performance caching

## 🔧 Customization

### **Adding New Scanners**
```javascript
// backend/api-gateway/routes/scan.js
const newScanner = require('./scanners/custom-scanner');

router.post('/custom', async (req, res) => {
  const results = await newScanner.scan(req.body.target);
  res.json(results);
});
```

### **Custom AI Models**
```javascript
// AI service integration
const customAI = require('./ai/custom-model');

const analyzeVulnerability = async (finding) => {
  return await customAI.explain(finding);
};
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Docker Bench Security**: https://github.com/Sarahenia20/docker-bench
- **Grafana Dashboards**: https://github.com/Sarahenia20/grafana-For-SH
- **UI Prototype**: https://github.com/Sarahenia20/sentinel-hub-UI-Concept
- **Clerk Authentication**: Next.js integration with GitHub OAuth
- **Security Tools**: ESLint, Semgrep, Trivy, SonarQube community

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Sarahenia20/SentinelHub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Sarahenia20/SentinelHub/discussions)
- **Security**: security@sentinelhub.com

---

**Built with 💙 by Sarah Henia - Making DevSecOps Accessible**