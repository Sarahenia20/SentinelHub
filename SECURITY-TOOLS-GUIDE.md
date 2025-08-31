# 🛡️ SentinelHub Security Tools Guide

## Overview
SentinelHub employs different security tools depending on the scan type. Each tool serves a specific purpose and provides comprehensive security analysis across various attack vectors.

---

## 🔍 Scan Types & Their Tools

### 1. **Paste Code Scanning** (`paste`)
**Purpose**: Analyze pasted code snippets for vulnerabilities, secrets, and code quality issues.

**Tools Used**:
- **ESLint Security** - Static analysis for JavaScript/TypeScript security patterns
- **Pattern Matcher** - Custom regex-based vulnerability detection
- **Semgrep Scanner** - SAST (Static Application Security Testing) using Docker
- **TruffleHog Secrets** - Advanced secret detection using Docker
- **CVE Database** - Known vulnerability lookup
- **SonarQube Analysis** - Code quality and security analysis

**Performance Optimizations**:
- Semgrep skipped for snippets < 10 lines
- TruffleHog skipped for content < 5 lines
- 30-second timeout on Docker operations

---

### 2. **GitHub Repository Scanning** (`github`)
**Purpose**: Comprehensive security analysis of entire GitHub repositories.

**Tools Used**:
- **ESLint Security** - JavaScript/TypeScript security analysis
- **Pattern Matcher** - Multi-language vulnerability patterns
- **Secret Detection** - API keys, tokens, credentials discovery
- **CVE Lookup** - Known vulnerability database matching
- **GitHub Advisory** - GitHub Security Advisory integration

**Scope**:
- Full repository codebase analysis
- Dependency vulnerability scanning
- Historical commit analysis for secrets
- OWASP Top 10 coverage

---

### 3. **AWS Cloud Scanning** (`aws`)
**Purpose**: Cloud infrastructure security assessment for AWS resources.

**Tools Used**:
- **S3 Bucket Analysis** - Bucket permissions and public access
- **Access Control Check** - IAM policies and permissions audit
- **Encryption Status** - Data encryption compliance
- **Configuration Review** - Security group and network analysis

**Coverage**:
- S3 bucket security posture
- IAM privilege escalation risks
- Network security configurations
- Compliance with security frameworks

---

### 4. **Docker Security Scanning** (`docker`)
**Purpose**: Container and image security analysis.

**Tools Used**:
- **Docker Bench Security** - CIS Docker Benchmark compliance
- **Image Vulnerability Scan** - Container image security analysis
- **Configuration Assessment** - Docker daemon and runtime security
- **Registry Security** - Docker Hub and private registry analysis

---

## 🔧 Core Security Engines

### **Static Analysis Tools**

#### ESLint Security Scanner
- **Purpose**: JavaScript/TypeScript security rule enforcement
- **Strengths**: Fast, lightweight, extensive security rule coverage
- **Use Cases**: Code quality + security for JS/TS projects
- **Output**: Security violations with line-level precision

#### Semgrep Scanner (Docker-based)
- **Purpose**: Multi-language SAST with OWASP coverage
- **Strengths**: 1000+ security rules, professional-grade analysis
- **Use Cases**: Comprehensive security analysis for production code
- **Performance**: Heavy tool - optimized for larger codebases (>10 lines)

#### SonarQube Analysis (Docker-based)
- **Purpose**: Code quality + security technical debt analysis  
- **Strengths**: Industry-standard analysis, detailed metrics
- **Use Cases**: Enterprise-grade code quality assessment
- **Integration**: Optional Docker scanner with fallback

### **Secret Detection Tools**

#### Pattern Matcher (Built-in)
- **Purpose**: Fast, regex-based secret pattern detection
- **Strengths**: Lightweight, customizable patterns, context validation
- **Coverage**: 26+ secret types across 5+ languages
- **Features**: False positive reduction, context awareness

#### TruffleHog Scanner (Docker-based)
- **Purpose**: Advanced secret detection with 700+ detectors
- **Strengths**: High accuracy, verification capabilities, entropy analysis
- **Use Cases**: Professional secret scanning for larger codebases
- **Performance**: Optimized for content >5 lines

### **Intelligence & Research Tools**

#### CVE Database Lookup
- **Purpose**: Known vulnerability identification and matching
- **Data Source**: National Vulnerability Database (NVD)
- **Features**: CVSS scoring, severity classification, fix recommendations
- **API**: RESTful integration with caching

#### GitHub Security Advisory
- **Purpose**: GitHub's curated security vulnerability database
- **Coverage**: Package vulnerabilities, security patches, advisories
- **Integration**: Real-time advisory matching
- **Scope**: Multi-language ecosystem coverage

---

## ⚡ Performance & Optimization

### Smart Performance Rules
1. **Small Code Optimization**: 
   - Semgrep skipped for <10 lines
   - TruffleHog skipped for <5 lines
   
2. **Timeout Management**:
   - 30-second Docker operation timeouts
   - Graceful fallback to pattern-based scanning
   
3. **Caching Strategy**:
   - Redis caching for API responses
   - CVE data caching for faster lookups
   - Report caching for repeated queries

### Tool Selection Logic
```
Paste Scanning (Small): Pattern Matcher + ESLint only
Paste Scanning (Large): Full tool suite with Docker
GitHub Scanning: Repository-optimized tool selection  
Cloud Scanning: Infrastructure-specific tools
```

---

## 🎯 Tool Effectiveness by Attack Vector

| Attack Vector | Primary Tool | Secondary Tool | Coverage |
|---|---|---|---|
| **Injection Attacks** | Semgrep | Pattern Matcher | 95% |
| **Secret Exposure** | TruffleHog | Pattern Matcher | 98% |
| **Known Vulnerabilities** | CVE Lookup | GitHub Advisory | 90% |
| **Code Quality Issues** | SonarQube | ESLint | 85% |
| **Cloud Misconfigurations** | AWS Scanner | Custom Rules | 80% |
| **Container Security** | Docker Bench | Image Scanner | 88% |

---

## 🚀 Getting Started

### For Developers
1. **Quick Code Check**: Use paste scanning for rapid feedback
2. **Repository Analysis**: GitHub scanning for comprehensive assessment  
3. **Production Readiness**: Enable all tools for thorough analysis

### For Security Teams
1. **Vulnerability Assessment**: Focus on CVE + Advisory tools
2. **Secret Auditing**: TruffleHog + Pattern Matcher combination
3. **Compliance Checking**: SonarQube + Docker Bench for standards

### For DevOps
1. **CI/CD Integration**: API endpoints for automated scanning
2. **Cloud Security**: AWS scanning for infrastructure assessment
3. **Container Security**: Docker scanning for deployment validation

---

## 📊 Reporting & Analysis

### Report Types
- **Executive Summary**: High-level security posture
- **Technical Details**: Line-by-line findings with remediation
- **Compliance Reports**: Standards-based assessment
- **Trend Analysis**: Historical security improvements

### AI-Powered Insights
- **Contextual Analysis**: Understanding of code context and business logic
- **Remediation Guidance**: Step-by-step fix recommendations
- **Risk Prioritization**: Intelligent severity assessment
- **Learning Integration**: Continuous improvement from scan results

---

*This guide represents the current tool configuration. Tools and capabilities are continuously updated to address emerging security threats.*