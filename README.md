# SentinelHub Security Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://mongodb.com/)
[![AI](https://img.shields.io/badge/AI-Gemma+OpenAI-blue.svg)](https://huggingface.co/)

> **Enterprise Security Platform with Conversational AI**  
> Automated security scanning pipeline with intelligent analysis, real-time conversations, and comprehensive reporting.

## Overview

SentinelHub is a next-generation security platform that revolutionizes how teams approach application security. Built with enterprise-grade architecture, it combines automated scanning, conversational AI, and intelligent reporting to provide comprehensive security analysis.

**Key Innovations:**
- **Conversational AI Security Expert** - Chat with AI about your security findings in natural language
- **Automated Security Pipeline** - Complete CI/CD-style workflow from scan to report
- **Real Security Tools Integration** - Semgrep (1000+ rules), TruffleHog (700+ detectors), GitLeaks
- **MongoDB Atlas Database** - Persistent storage for scans, conversations, and analytics
- **Intelligent Recommendations** - AI-powered risk assessment and remediation guidance

## Core Features

### Automated Security Pipeline
Complete workflow automation that orchestrates:
1. **Security Scanning** → Multiple tools (Semgrep, TruffleHog, Pattern Analysis)
2. **AI Analysis** → Risk assessment and intelligent recommendations  
3. **Conversation Initialization** → AI ready to answer questions about findings
4. **Database Storage** → Persistent MongoDB storage for all results
5. **Report Generation** → Dashboard-ready analytics and exportable reports

### Conversational AI Security Expert
Revolutionary chat interface powered by HuggingFace Gemma and OpenAI:
- **Natural Language Security Discussions** - Ask questions about vulnerabilities in plain English
- **Context-Aware Responses** - AI understands your specific scan results and codebase
- **Actionable Remediation Steps** - Get specific fix instructions and AWS CLI commands  
- **Compliance Guidance** - GDPR, PCI-DSS, HIPAA implications explained
- **Best Practices Education** - Learn security concepts through conversation

### Real Security Tools Integration
Enterprise-grade security scanning with actual industry tools:

**Static Analysis:**
- **Semgrep** - 1000+ community security rules, OWASP Top 10, CWE Top 25
- **ESLint Security** - JavaScript/TypeScript vulnerability detection  
- **Pattern Matching** - Multi-language vulnerability patterns

**Secret Detection:**
- **TruffleHog** - 700+ verified secret detectors with confidence scoring
- **GitLeaks** - Git history scanning with entropy analysis

📖 **[Complete Security Tools Guide](SECURITY-TOOLS-GUIDE.md)** - Detailed documentation of all security tools, their purposes, and when they're used.
- **AWS/GitHub/API Key Detection** - Real credential verification

**AI Intelligence:**
- **HuggingFace Gemma** - Advanced language model for security analysis
- **OpenAI GPT** - Enhanced conversational capabilities (optional)
- **Risk Assessment** - Automated threat level calculation

### Cloud Security Scanning
Comprehensive AWS S3 bucket security analysis:
- **Bucket Configuration Analysis** - Encryption, versioning, logging checks
- **Permission Auditing** - Public access, ACL, and policy analysis  
- **Content Scanning** - Pattern-based secret detection in stored files
- **Compliance Checking** - GDPR, PCI-DSS, HIPAA violation detection
- **AI-Powered Recommendations** - Conversational guidance for security improvements

### Database & Analytics
MongoDB Atlas integration for enterprise data management:
- **Pipeline Results Storage** - Complete scan history and metrics
- **Conversation Sessions** - AI chat history and context preservation
- **Security Analytics** - Trend analysis and dashboard data
- **Report Generation** - Exportable security reports and audit logs
- **Search & Filtering** - Advanced querying of historical scan data

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Conversation   │    │   Dashboard     │
│   (Next.js)     │    │      AI         │    │   Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────▼───────────────────────┘
                                 │
         ┌───────────────────────▼───────────────────────┐
         │           Security Pipeline Orchestrator      │
         │         (Automated Workflow Management)       │
         └───────────────────────┬───────────────────────┘
                                 │
    ┌────────────────────────────┼────────────────────────────┐
    │                            │                            │
    ▼                            ▼                            ▼
┌─────────┐              ┌─────────────┐              ┌─────────────┐
│  Code   │              │     S3      │              │  GitHub     │
│Scanner  │              │   Scanner   │              │  Scanner    │
│(Semgrep)│              │(AWS + AI)   │              │(TruffleHog) │
└─────────┘              └─────────────┘              └─────────────┘
    │                            │                            │
    └────────────────────────────▼────────────────────────────┘
                                 │
         ┌───────────────────────▼───────────────────────┐
         │           MongoDB Atlas Database              │
         │      (Scans, Conversations, Reports)          │
         └───────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- Docker (for Redis, SonarQube, Semgrep, TruffleHog)
- MongoDB Atlas account (provided)
- OpenAI API key (required for chat)
- AWS credentials for S3 scanning (optional)

### 🚀 How to Run Everything (2 Commands - Chat Integrated!)

**1. Start API Gateway (All Backend Services)**
```bash
cd "api-gateway"
npm install  # First time only
npm run dev
```
Port: **5000** | Services: Scanning, GitHub, AWS, Docker, Reports, **Chat AI (Integrated)**
- **Chat Service**: Automatically starts on port **4000** (no separate command needed!)
- **AI Responses**: Now shorter, better formatted, and more focused
- **Single Command**: All backend services run with one command

**2. Start Client (Frontend)**
```bash
cd "client"
npm install  # First time only
npm run dev
```
Port: **3000** | Interface: Web UI

### Access Points
- **🌐 Main Application**: http://localhost:3000
- **🔧 API Health**: http://localhost:5000/api/health  
- **💬 Chat Health**: http://localhost:4000/api/health (auto-started)

### Architecture Overview
```
Client (3000) ←→ API Gateway (5000) ←→ Security Services
                         ↓
                 Chat Service (4000) ←→ OpenAI API (Integrated)
```
**Benefits**: 
- **Single Command Startup** - All backend services with one command
- **Process Isolation** - Chat service runs as child process, prevents crashes
- **Auto-Recovery** - Chat service automatically restarts if it fails

### 🔧 Troubleshooting

**Port Already in Use**
```bash
# Windows - Kill process on port
netstat -ano | findstr ":5000"
taskkill /PID [PID_NUMBER] /F

# Mac/Linux - Kill process on port  
lsof -ti:5000 | xargs kill -9
```

**Services Not Starting**
- Check `npm install` completed in each directory
- Ensure Docker is running (for Redis)
- Verify ports 3000, 5000, 4000 are available

**Chat Not Responding**
- Chat service auto-starts with API Gateway
- Check OpenAI API key in `services/.env`
- Chat only responds to security-related questions
- Look for "[CHAT SERVICE]" logs in API Gateway output

### Installation

```bash
# Clone repository
git clone https://github.com/Sarahenia20/SentinelHub.git
cd SentinelHub

# Install dependencies
npm install

# Install security tools
pip install semgrep
# Download TruffleHog from: https://github.com/trufflesecurity/trufflehog/releases

# Configure environment (already set up)
# MongoDB Atlas, HuggingFace, AWS credentials are pre-configured

# Test the complete system
node test-pipeline-system.js
```

### Environment Configuration

Your environment is pre-configured with:



## Usage Examples

### 1. Automated Code Analysis Pipeline

```javascript
const pipeline = new SecurityPipelineOrchestrator();

// Analyze JavaScript code with complete pipeline
const result = await pipeline.executePipeline({
  type: 'code-analysis',
  input: {
    code: yourCode,
    language: 'javascript'
  }
});

console.log(`Risk Level: ${result.scanResults.summary.riskLevel}`);
console.log(`Findings: ${result.scanResults.findings.vulnerabilities.length}`);
console.log(`Chat Ready: ${result.conversation.canChat}`);
```

### 2. Conversational AI Security Expert

```javascript
// Chat about security findings
const chatResponse = await pipeline.chatAboutResults(
  result.pipelineId,
  "What are the most critical security issues I need to fix immediately?"
);

console.log(chatResponse.message);
// AI Response: "I found 3 critical security issues in your code. 
// The most urgent is the SQL injection vulnerability on line 42..."
```

### 3. S3 Bucket Security Analysis

```javascript
// Comprehensive S3 security scan with AI recommendations
const s3Result = await pipeline.executePipeline({
  type: 's3-bucket',
  input: {
    bucketName: 'my-bucket',
    credentials: { /* AWS creds */ }
  }
});

// Chat about S3 security
const s3Chat = await s3Result.conversation.chat(
  "How do I secure my S3 bucket against public access?"
);
```

### 4. Database Operations

```javascript
const db = new MongoDBManager();

// Store and retrieve scan results
await db.storePipelineResults(pipelineData);
const results = await db.getPipelineResults(pipelineId);

// Get security metrics for dashboard
const metrics = await db.getSecurityMetrics();
console.log(`Total Scans: ${metrics.totalScans}`);
console.log(`Critical Issues: ${metrics.criticalIssues}`);
```

## Security Tools Integration

### Static Analysis Tools
- **Semgrep**: 1000+ community security rules, SAST analysis
- **ESLint Security**: JavaScript/TypeScript vulnerability detection
- **Pattern Matcher**: Multi-language security pattern detection

### Secret Detection Tools  
- **TruffleHog**: 700+ verified secret detectors
- **GitLeaks**: Git history secret scanning
- **Custom Patterns**: API keys, tokens, credentials

### AI & Intelligence
- **HuggingFace Gemma**: Conversational security expert
- **OpenAI GPT**: Enhanced natural language processing
- **CVE Database**: Real-time vulnerability intelligence

### Cloud Security
- **AWS S3 Scanner**: Bucket security analysis
- **IAM Assessment**: Permission and policy analysis
- **Compliance Checking**: GDPR, PCI-DSS, HIPAA

## Project Structure

```
SentinelHub/
├── services/
│   ├── security-pipeline/
│   │   └── pipeline-orchestrator.js    # Main automation pipeline
│   ├── real-security-scanner.js        # Code analysis orchestrator
│   ├── cloud-security/
│   │   └── s3-bucket-scanner.js         # AWS S3 security scanner
│   ├── ai-intelligence/
│   │   ├── conversation-ai.js           # Conversational AI system
│   │   └── huggingface-gemma.js         # Gemma AI integration
│   ├── database/
│   │   └── mongodb-manager.js           # MongoDB Atlas operations
│   └── real-security-tools/
│       ├── semgrep-integration.js       # Semgrep SAST integration
│       └── trufflehog-integration.js    # TruffleHog secret detection
├── client/                              # Next.js frontend
├── api-gateway/                         # Express.js API gateway
├── .env                                # Environment configuration
├── package.json                        # Dependencies and scripts
└── test-pipeline-system.js            # Complete system test
```

## Testing

Run the comprehensive system test:

```bash
node test-pipeline-system.js
```

This tests:
- Complete pipeline execution
- Database storage and retrieval
- Conversational AI functionality
- Security tool integration
- S3 scanner (if AWS configured)

## API Reference

### Pipeline Orchestrator
```javascript
// Execute security pipeline
POST /api/pipeline/execute
{
  "type": "code-analysis|s3-bucket|github-repository",
  "input": { /* scan input */ },
  "options": { /* scan options */ }
}

// Chat about results  
POST /api/pipeline/chat/:pipelineId
{
  "message": "How do I fix the SQL injection vulnerability?"
}
```

### Database Operations
```javascript
// Get recent scans
GET /api/database/pipelines?limit=10

// Get security metrics
GET /api/database/metrics

// Search scans
GET /api/database/search?q=critical&type=code-analysis
```

## Deployment

### Production Deployment
```bash
# Build for production
npm run build

# Start production server
npm run start

# Or use Docker
docker build -t sentinelhub .
docker run -p 3001:3001 sentinelhub
```

### CI/CD Pipeline
The platform is designed for enterprise CI/CD integration:
- Automated security scanning in build pipelines  
- Conversation AI for development teams
- MongoDB Atlas for persistent scan history
- Dashboard integration for security metrics

## Roadmap

### Current (v1.0) ✅
- Automated security pipeline orchestration
- Conversational AI with Gemma and OpenAI
- MongoDB Atlas database integration  
- Real security tools (Semgrep, TruffleHog)
- AWS S3 security scanning
- Complete testing suite

### Next Release (v1.1) 🔄
- **Voice Assistant Integration** - Eleven Labs text-to-speech
- **API Gateway** - RESTful endpoints for frontend integration
- **Advanced Reporting** - Executive dashboards and exports
- **GitHub Actions Integration** - CI/CD pipeline scanning

### Future (v2.0) 📋
- Multi-tenant enterprise deployment
- Advanced compliance frameworks (SOC2, PCI-DSS)
- Custom security rule creation
- Mobile security monitoring app

## Contributing

We welcome contributions! Areas where you can help:

1. **Security Tool Integrations** - Add new scanning tools
2. **AI Model Integration** - Enhance conversation capabilities  
3. **Cloud Provider Support** - Azure, GCP security scanning
4. **Frontend Development** - Dashboard and UI improvements
5. **Documentation** - Setup guides and tutorials

## Security & Privacy

- **Local Processing** - All analysis performed locally, no data sent to third parties
- **Secure Storage** - MongoDB Atlas with encryption at rest
- **API Security** - Rate limiting and authentication on all endpoints  
- **Secret Management** - Secure handling of API keys and credentials
- **Audit Logging** - Complete tracking of security activities

## Support

- **Issues**: [GitHub Issues](https://github.com/Sarahenia20/SentinelHub/issues)
- **Documentation**: Complete setup and usage guides included
- **Testing**: Comprehensive test suite for validation

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with enterprise security in mind by [Sarah Henia](https://github.com/Sarahenia20)**

*SentinelHub - Where AI meets enterprise security scanning*