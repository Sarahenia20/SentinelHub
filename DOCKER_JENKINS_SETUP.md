# 🐳 SentinelHub - Docker & Jenkins CI/CD Setup Guide

## 🚀 Quick Start

This guide will help you set up the complete Docker containerization and Jenkins CI/CD pipeline **locally** without deploying to the cloud.

---

## 📋 Prerequisites

### Required Software:
- ✅ **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
- ✅ **Docker Compose** v2.0+
- ✅ **Git**
- ✅ **8GB+ RAM** recommended
- ✅ **20GB+ free disk space**

### Check Installations:
```bash
docker --version          # Should be 20.10+
docker-compose --version  # Should be 2.0+
git --version
```

---

## 🏗️ Part 1: Docker Containerization

### 1.1 Environment Setup

Create a `.env` file in the root directory:

```bash
# Copy the example and fill in your values
cp .env.example .env
```

**Required Environment Variables:**
```env
# MongoDB
MONGO_USERNAME=sentinelhub
MONGO_PASSWORD=sentinelhub123

# Redis
REDIS_PASSWORD=sentinelhub123

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=your_clerk_key_here
CLERK_SECRET_KEY=your_clerk_secret_here

# Gemini AI
GEMINI_API_KEY=your_gemini_key_here

# Security APIs
ALIENVAULT_API_KEY=your_alienvault_key_here
IPQS_API_KEY=your_ipqs_key_here

# Grafana
GRAFANA_USER=admin
GRAFANA_PASSWORD=sentinelhub123
```

### 1.2 Build and Run the Application Stack

```bash
# Build all Docker images
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Services will be available at:**
- 🌐 **Frontend**: http://localhost:3000
- 🔌 **API Gateway**: http://localhost:3001
- 📊 **Prometheus**: http://localhost:9090
- 📈 **Grafana**: http://localhost:3002 (admin/sentinelhub123)
- 🔍 **SonarQube**: http://localhost:9000 (admin/admin)
- 🗄️ **MongoDB**: localhost:27017
- 💾 **Redis**: localhost:6379

### 1.3 Production Build

For production-ready containers:

```bash
# Use the production compose file
docker-compose -f docker-compose.prod.yml up -d
```

### 1.4 Useful Docker Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Rebuild a specific service
docker-compose build frontend
docker-compose up -d frontend

# View logs for specific service
docker-compose logs -f api-gateway

# Execute command in running container
docker-compose exec api-gateway sh

# Remove all stopped containers and unused images
docker system prune -a
```

---

## 🔧 Part 2: Jenkins CI/CD Setup

### 2.1 Start Jenkins Stack

```bash
# Start Jenkins, SonarQube, and Nexus
docker-compose -f docker-compose.jenkins.yml up -d

# Check if services are running
docker-compose -f docker-compose.jenkins.yml ps

# Get initial Jenkins admin password
docker exec sentinelhub-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

**Jenkins Services:**
- 🏗️ **Jenkins**: http://localhost:8080/jenkins
- 📊 **SonarQube**: http://localhost:9000
- 📦 **Nexus**: http://localhost:8081

### 2.2 Jenkins Initial Configuration

1. **Unlock Jenkins:**
   - Open http://localhost:8080/jenkins
   - Paste the initial admin password
   - Click "Continue"

2. **Install Plugins:**
   - Select "Install suggested plugins"
   - Additional recommended plugins:
     - Docker Pipeline
     - SonarQube Scanner
     - NodeJS Plugin
     - Git Parameter
     - Blue Ocean (for better UI)

3. **Create Admin User:**
   - Username: `admin`
   - Password: `sentinelhub123`
   - Full name: `SentinelHub Admin`
   - Email: your email

4. **Jenkins Configuration:**
   - Go to: **Manage Jenkins** → **Global Tool Configuration**
   - Add NodeJS installation:
     - Name: `NodeJS-18`
     - Version: `NodeJS 18.x`
     - Install automatically: ✅

5. **SonarQube Integration:**
   - Go to: **Manage Jenkins** → **Configure System**
   - Add SonarQube server:
     - Name: `SonarQube`
     - Server URL: `http://sonarqube:9000`
     - Server authentication token: (generate in SonarQube)

6. **Docker Credentials:**
   - Go to: **Manage Jenkins** → **Credentials**
   - Add credentials:
     - Kind: Username with password
     - ID: `docker-registry-credentials`
     - Username: your GitHub/Docker Hub username
     - Password: your token

### 2.3 Create Jenkins Pipeline Job

1. **New Item:**
   - Click "New Item"
   - Name: `SentinelHub-CI-CD`
   - Type: "Pipeline"
   - Click OK

2. **Configure Pipeline:**
   - **General:**
     - Description: "SentinelHub DevSecOps CI/CD Pipeline"
     - GitHub project: your repo URL

   - **Build Triggers:**
     - ✅ GitHub hook trigger for GITScm polling
     - ✅ Poll SCM: `H/5 * * * *` (every 5 min)

   - **Pipeline:**
     - Definition: "Pipeline script from SCM"
     - SCM: Git
     - Repository URL: your repo
     - Branches: `*/main`
     - Script Path: `Jenkinsfile`

3. **Save and Build:**
   - Click "Save"
   - Click "Build Now"
   - Watch the build progress in Blue Ocean view

### 2.4 SonarQube Setup

1. **Access SonarQube:**
   - Open http://localhost:9000
   - Default login: `admin` / `admin`
   - Change password on first login

2. **Generate Token:**
   - User → My Account → Security → Generate Token
   - Name: `Jenkins`
   - Copy the token

3. **Create Project:**
   - Projects → Create Project
   - Name: `sentinelhub-security`
   - Key: `sentinelhub-security`
   - Set up → With Jenkins

4. **Configure Quality Gate:**
   - Quality Gates → Create
   - Add conditions for your security standards

---

## 📊 Part 3: Monitoring & Observability

### 3.1 Prometheus Configuration

Create `services/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'sentinelhub-api'
    static_configs:
      - targets: ['api-gateway:3001']

  - job_name: 'sentinelhub-frontend'
    static_configs:
      - targets: ['frontend:3000']
```

### 3.2 Grafana Dashboards

1. **Access Grafana:**
   - http://localhost:3002
   - Login: admin/sentinelhub123

2. **Add Prometheus Data Source:**
   - Configuration → Data Sources → Add
   - Type: Prometheus
   - URL: http://prometheus:9090
   - Save & Test

3. **Import Dashboards:**
   - Create → Import
   - Dashboard IDs to import:
     - `11159` - Node Exporter
     - `1860` - Node Exporter Full
     - `7362` - Docker monitoring

---

## 🔒 Part 4: Security Scanning in CI/CD

Your Jenkinsfile includes these security tools:

### 4.1 Secret Detection
- **TruffleHog**: Scans for hardcoded secrets
- **Gitleaks**: Additional secret scanning

### 4.2 Static Analysis
- **Semgrep**: SAST (Static Application Security Testing)
- **SonarQube**: Code quality and security

### 4.3 Dependency Scanning
- **npm audit**: Frontend & backend dependencies

### 4.4 Container Scanning
- **Trivy**: Docker image vulnerability scanning

### Reports Generated:
```
📄 trufflehog-report.json
📄 gitleaks-report.json
📄 semgrep-report.json
📄 trivy-frontend-report.json
📄 trivy-backend-report.json
📄 npm-audit-frontend.json
📄 npm-audit-backend.json
📄 security-summary.txt
```

---

## 🧪 Part 5: Testing the Complete Setup

### 5.1 Test Application Stack

```bash
# Start everything
docker-compose up -d

# Wait for services to be healthy
docker-compose ps

# Test API
curl http://localhost:3001/api/health

# Test Frontend
curl http://localhost:3000

# Check MongoDB
docker exec -it sentinelhub-mongodb mongosh -u sentinelhub -p sentinelhub123

# Check Redis
docker exec -it sentinelhub-redis redis-cli -a sentinelhub123 ping
```

### 5.2 Test Jenkins Pipeline

1. Make a code change
2. Commit and push to your repo
3. Jenkins will automatically trigger a build
4. Watch the pipeline stages execute
5. Check generated security reports

### 5.3 Verify Security Scans

```bash
# Manually run security scans
docker run --rm -v "$(pwd):/scan" trufflesecurity/trufflehog:latest filesystem /scan

docker run --rm -v "$(pwd):/scan" zricethezav/gitleaks:latest detect --source /scan

docker run --rm -v "$(pwd):/src" returntocorp/semgrep semgrep --config auto /src

# Scan built images
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image sentinelhub-frontend:latest
```

---

## 📈 Part 6: Advanced Features (Optional)

### 6.1 Multi-Stage Builds

Your Dockerfiles use multi-stage builds for:
- ✅ Smaller image sizes
- ✅ Separation of build and runtime dependencies
- ✅ Better security (fewer attack surfaces)

### 6.2 Health Checks

All services have health checks configured:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
  interval: 30s
  timeout: 3s
  retries: 3
```

### 6.3 Docker Compose Profiles

Run specific services:
```bash
# Only app services (no monitoring)
docker-compose up frontend api-gateway mongodb redis

# Only monitoring stack
docker-compose up prometheus grafana
```

---

## 🐛 Troubleshooting

### Common Issues:

**1. Port Already in Use:**
```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Stop the process or change port in docker-compose.yml
```

**2. MongoDB Connection Failed:**
```bash
# Check MongoDB logs
docker-compose logs mongodb

# Recreate MongoDB container
docker-compose up -d --force-recreate mongodb
```

**3. Jenkins Not Starting:**
```bash
# Check Jenkins logs
docker logs sentinelhub-jenkins

# Increase memory allocation in Docker Desktop settings
# Recommended: 4GB+ for Jenkins
```

**4. Build Failures:**
```bash
# Clean Docker cache
docker builder prune -af

# Rebuild without cache
docker-compose build --no-cache
```

### 5. Reset Everything:**
```bash
# Nuclear option - clean everything
docker-compose down -v
docker-compose -f docker-compose.jenkins.yml down -v
docker system prune -af --volumes

# Start fresh
docker-compose up -d
```

---

## 📚 Additional Resources

### Documentation:
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Jenkins Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [SonarQube Quality Gates](https://docs.sonarqube.org/latest/user-guide/quality-gates/)

### Security Tools:
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Semgrep Rules](https://semgrep.dev/explore)
- [TruffleHog Usage](https://github.com/trufflesecurity/trufflehog)

---

## ✅ Success Checklist

- [ ] Docker Compose running all services successfully
- [ ] Frontend accessible at http://localhost:3000
- [ ] API responding at http://localhost:3001/api/health
- [ ] MongoDB connected and storing data
- [ ] Jenkins running at http://localhost:8080/jenkins
- [ ] SonarQube accessible at http://localhost:9000
- [ ] Jenkins pipeline executing without errors
- [ ] Security scans generating reports
- [ ] Prometheus collecting metrics
- [ ] Grafana displaying dashboards

---

**🎉 Congratulations! You now have a complete DevSecOps environment running locally!**

**Key Achievements:**
- ✅ Full application containerization
- ✅ CI/CD pipeline with Jenkins
- ✅ Automated security scanning
- ✅ Code quality analysis
- ✅ Monitoring and observability
- ✅ All running locally without cloud deployment!

**For Your Internship Journal:**
> "Implemented comprehensive Docker containerization with multi-stage builds, orchestrated microservices using Docker Compose, and established a Jenkins CI/CD pipeline with integrated security scanning (Trivy, Semgrep, TruffleHog), code quality analysis (SonarQube), and monitoring (Prometheus/Grafana) - all validated in local development environment."
