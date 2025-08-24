# 🛡️ SentinelHub

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Redis](https://img.shields.io/badge/Redis-7.0-red.svg)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-24.0-blue.svg)](https://www.docker.com/)
[![Grafana](https://img.shields.io/badge/Grafana-10.0-orange.svg)](https://grafana.com/)

> **Professional DevSecOps Intelligence Platform**  
> Comprehensive security scanning, AI-powered vulnerability analysis, and automated threat detection for modern development workflows.

## 🎯 **Overview**

SentinelHub is an enterprise-grade, open-source security platform that integrates seamlessly into your development pipeline. Built with a microservices architecture, it provides real-time security scanning, intelligent threat detection, and automated vulnerability remediation across your entire technology stack.

**🏆 Key Differentiators:**
- **Multi-Source Analysis**: Code repositories, cloud infrastructure, and container images
- **AI-Powered Insights**: Advanced vulnerability explanations and fix recommendations  
- **Professional Monitoring**: Enterprise-grade dashboards and alerting
- **Zero Vendor Lock-in**: Fully open-source with self-hosting capabilities

## ✨ **Core Features**

### 🔍 **Comprehensive Security Scanning**
- **Static Code Analysis**: ESLint, Semgrep, SonarQube integration with 1000+ security rules
- **Secret Detection**: Advanced pattern matching for API keys, tokens, and credentials
- **Container Security**: CIS Docker Benchmark compliance and vulnerability scanning
- **Infrastructure Analysis**: AWS S3, IAM, and cloud security posture assessment

### 🤖 **AI-Enhanced Intelligence**
- **Vulnerability Explanations**: Context-aware security insights powered by Gemma 270M
- **Automated Code Review**: CodeRabbit integration for intelligent pull request analysis
- **Threat Intelligence**: Real-time CVE database updates and exploit intelligence
- **Smart Recommendations**: Personalized security improvement suggestions

### 📊 **Enterprise Monitoring**
- **Real-time Dashboards**: Grafana-powered security metrics and compliance tracking
- **Advanced Analytics**: Redis-backed performance analytics and trend analysis
- **Automated Alerting**: Configurable security threshold notifications
- **Audit Trail**: Complete scan history and remediation tracking

## 🏗️ **Architecture**

SentinelHub employs a modern microservices architecture designed for scalability and maintainability:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Grafana       │    │   Redis Insight │
│   (Next.js)     │    │   Dashboards    │    │   (Analytics)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                              │
│          (Express.js + Clerk Authentication)               │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Microservices Layer                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Code Scanner   │  Secret Scanner │  Infrastructure Scanner │
│  (Node.js)      │  (Python)       │  (Python)              │
├─────────────────┼─────────────────┼─────────────────────────┤
│  Docker Scanner │  AI Service     │  Metrics Collector      │
│  (Python)       │  (Python)       │  (Go)                  │
└─────────────────┴─────────────────┴─────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                              │
│    Redis Stack + Prometheus + File System                  │
└─────────────────────────────────────────────────────────────┘
```

### **Service Responsibilities**

| Service | Technology | Purpose |
|---------|------------|---------|
| **API Gateway** | Node.js + Express | Request routing, authentication, rate limiting |
| **Code Scanner** | Node.js | ESLint, Semgrep, SonarQube integration |
| **Secret Scanner** | Python | Advanced credential and API key detection |
| **Infrastructure Scanner** | Python | AWS, GCP, Azure security posture assessment |
| **Docker Scanner** | Python | Container security and CIS compliance |
| **AI Service** | Python | Gemma model inference and CodeRabbit integration |

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- Python 3.9+
- Docker & Docker Compose
- Redis 7.0+

### **Installation**

```bash
# Clone the repository
git clone https://github.com/Sarahenia20/SentinelHub.git
cd SentinelHub

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your API keys and configurations

# Start development environment
docker-compose up -d
npm run dev
```

### **Environment Configuration**

```env
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# External Integrations
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# AI Services
HUGGINGFACE_API_TOKEN=hf_...
CODERABBIT_API_KEY=cr_...

# Security APIs
VIRUSTOTAL_API_KEY=your_vt_key
ABUSEIPDB_API_KEY=your_abuse_key
```

## 🔧 **Integrations**

### **Security Tools**
- **[ESLint Security](https://github.com/eslint-community/eslint-plugin-security)**: JavaScript/TypeScript vulnerability detection
- **[Semgrep](https://github.com/returntocorp/semgrep)**: Multi-language static analysis with 1000+ rules
- **[SonarQube](https://github.com/SonarSource/sonarqube)**: Enterprise code quality and security analysis
- **[Docker Bench](https://github.com/docker/docker-bench-security)**: CIS Docker Benchmark implementation
- **[Trivy](https://github.com/aquasecurity/trivy)**: Container and filesystem vulnerability scanner

### **AI & Intelligence**
- **[HuggingFace Gemma](https://huggingface.co/google/gemma-3-270m)**: Advanced language model for security explanations
- **[CodeRabbit](https://coderabbit.ai/)**: AI-powered code review and analysis
- **[OpenAI GPT](https://openai.com/api/)**: Optional enhanced AI capabilities

### **Threat Intelligence**
- **[VirusTotal](https://www.virustotal.com/gui/home/upload)**: File and URL reputation analysis
- **[AbuseIPDB](https://www.abuseipdb.com/)**: IP address reputation database
- **[CVE Details](https://www.cvedetails.com/)**: Comprehensive vulnerability database
- **[Shodan](https://www.shodan.io/)**: Internet-connected device discovery

### **Cloud Platforms**
- **AWS**: S3, IAM, CloudTrail, Config, GuardDuty integration
- **GitHub**: Repository analysis, webhook integration, OAuth authentication
- **Docker Hub**: Image vulnerability analysis and metadata extraction

## 📊 **Monitoring & Analytics**

SentinelHub includes comprehensive monitoring capabilities:

### **Security Dashboards**
- **Overview Dashboard**: High-level security metrics and trends
- **Vulnerability Dashboard**: Detailed vulnerability analysis and remediation tracking
- **Compliance Dashboard**: Regulatory compliance status and audit trails
- **Performance Dashboard**: System performance and scanning efficiency metrics

### **Key Metrics Tracked**
- Total repositories scanned
- Critical vulnerabilities detected
- Security score trends
- Mean time to remediation (MTTR)
- Compliance percentage
- False positive rates

## 🛠️ **Development**

### **Project Structure**
```
SentinelHub/
├── frontend/                 # Next.js application
│   ├── components/          # Reusable UI components
│   ├── pages/              # Application pages
│   └── hooks/              # Custom React hooks
├── services/               # Microservices
│   ├── api-gateway/        # Main API routing service
│   ├── code-scanner/       # Static code analysis
│   ├── secret-scanner/     # Credential detection
│   ├── infrastructure-scanner/ # Cloud security analysis
│   ├── docker-scanner/     # Container security
│   └── ai-service/         # AI-powered analysis
├── grafana-dashboards/     # Grafana dashboard configurations
├── docker-compose.yml      # Development environment setup
└── docs/                   # Additional documentation
```

### **Contributing**

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Workflow**

```bash
# Install pre-commit hooks
npm run prepare

# Run tests
npm run test

# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

## 🔒 **Security Considerations**

- **Data Privacy**: All scan data is processed locally and never transmitted to third parties
- **API Security**: Rate limiting, authentication, and input validation on all endpoints
- **Secret Management**: Secure handling and storage of API keys and credentials
- **Audit Logging**: Comprehensive logging of all security-related activities

## 📈 **Roadmap**

### **Current Version (v1.0)**
- ✅ Multi-service security scanning
- ✅ AI-powered vulnerability analysis
- ✅ Real-time monitoring dashboards
- ✅ GitHub and AWS integration

### **Upcoming Features (v1.1)**
- 🔄 Advanced machine learning models for threat prediction
- 🔄 JIRA and Slack integration for automated ticketing
- 🔄 Custom security rule creation interface
- 🔄 Enhanced compliance frameworks (SOC2, PCI-DSS)

### **Future Roadmap (v2.0)**
- 📋 Multi-tenant support for enterprise deployments
- 📋 Advanced CI/CD pipeline integration
- 📋 Custom dashboard builder
- 📋 Mobile application for security monitoring

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 **Acknowledgments**

- **Security Community**: For the excellent open-source security tools
- **AI Research**: HuggingFace and Google for accessible AI models
- **DevOps Tools**: Grafana, Redis, and Prometheus teams
- **Contributors**: All the developers who make this project possible

## 📞 **Support**

- **Documentation**: [docs.sentinelhub.dev](https://docs.sentinelhub.dev)
- **Issues**: [GitHub Issues](https://github.com/Sarahenia20/SentinelHub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Sarahenia20/SentinelHub/discussions)
- **Email**: security@sentinelhub.dev

---

**Built with ❤️ by [Sarah Henia](https://github.com/Sarahenia20) and the SentinelHub community**

*SentinelHub - Securing the future of development, one scan at a time.*