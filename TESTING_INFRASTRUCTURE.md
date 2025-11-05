# 🧪 Testing Infrastructure Locally - Complete Guide

This guide shows you how to test all infrastructure components **locally** without cloud deployment or costs.

---

## 🚀 **Quick Start - Test Everything in 5 Minutes**

### 1️⃣ **Test Docker + Docker Compose** (Easiest - Start Here)

```bash
# Test the development stack
docker-compose up

# Services will start:
# ✅ Frontend: http://localhost:3000
# ✅ API Gateway: http://localhost:3001
# ✅ Redis: localhost:6379

# Stop with Ctrl+C, then:
docker-compose down
```

**Test Production Stack** (with MongoDB + Monitoring):
```bash
# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Check all services are running:
docker-compose -f docker-compose.prod.yml ps

# Access services:
# ✅ Frontend: http://localhost:3000
# ✅ API: http://localhost:3001
# ✅ MongoDB: localhost:27017
# ✅ Prometheus: http://localhost:9090
# ✅ Grafana: http://localhost:3002 (admin/admin)

# View logs:
docker-compose -f docker-compose.prod.yml logs -f frontend

# Stop everything:
docker-compose -f docker-compose.prod.yml down
```

---

## 🔧 **Test Jenkins CI/CD Pipeline**

### Start Jenkins Stack:
```bash
# Start Jenkins + SonarQube + Nexus
docker-compose -f docker-compose.jenkins.yml up -d

# Wait 1-2 minutes for Jenkins to start, then check:
docker-compose -f docker-compose.jenkins.yml ps

# Get Jenkins initial admin password:
docker exec sentinelhub-jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# Access services:
# ✅ Jenkins: http://localhost:8080/jenkins
# ✅ SonarQube: http://localhost:9000 (admin/admin)
# ✅ Nexus: http://localhost:8081 (admin/admin123)
```

### Configure Jenkins:
1. **Open Jenkins**: http://localhost:8080/jenkins
2. **Unlock Jenkins**: Paste the initial admin password from above
3. **Install Suggested Plugins**: Click "Install suggested plugins"
4. **Create Admin User**: Set username/password
5. **Install Additional Plugins**:
   - Go to **Manage Jenkins** → **Manage Plugins** → **Available**
   - Search and install:
     - Docker Pipeline
     - SonarQube Scanner
     - NodeJS Plugin
     - Git Plugin

6. **Configure Tools**:
   - **Manage Jenkins** → **Global Tool Configuration**
   - Add **NodeJS**: Name: `NodeJS-18`, Version: `18.x`
   - Add **Docker**: Name: `docker`, Install automatically

7. **Create Pipeline Job**:
   - Click **New Item**
   - Name: `SentinelHub-Pipeline`
   - Type: **Pipeline**
   - Under **Pipeline** section:
     - Definition: **Pipeline script from SCM**
     - SCM: **Git**
     - Repository URL: Your GitHub repo URL
     - Branch: `*/master` (or `*/main`)
     - Script Path: `Jenkinsfile`
   - Click **Save**

8. **Run Pipeline**:
   - Click **Build Now**
   - Watch the pipeline execute all 9 stages
   - View console output for security scan results

### Test Without Git (Quick Test):
```bash
# Just test if Jenkins can run a simple pipeline
# In Jenkins, create a new Pipeline job with this script:

pipeline {
    agent any
    stages {
        stage('Test') {
            steps {
                echo 'Jenkins is working!'
                sh 'docker --version'
                sh 'node --version || echo "NodeJS not installed yet"'
            }
        }
    }
}
```

### Stop Jenkins Stack:
```bash
docker-compose -f docker-compose.jenkins.yml down

# Keep data (volumes persist):
# Jenkins configs, build history, SonarQube projects remain

# Remove everything including volumes:
docker-compose -f docker-compose.jenkins.yml down -v
```

---

## ☸️ **Test Kubernetes + GitOps (ArgoCD)**

### Install Minikube (Local Kubernetes):

**Windows (PowerShell as Administrator):**
```powershell
# Using Chocolatey
choco install minikube

# Or download installer from:
# https://minikube.sigs.k8s.io/docs/start/

# Verify installation:
minikube version
```

**Start Minikube:**
```bash
# Start local Kubernetes cluster (takes 2-3 minutes first time)
minikube start --cpus=4 --memory=8192

# Verify cluster is running:
kubectl cluster-info
kubectl get nodes

# Enable Ingress addon (for NGINX):
minikube addons enable ingress
minikube addons enable metrics-server
```

### Deploy SentinelHub to Kubernetes:

```bash
# 1. Create namespace
kubectl apply -f kubernetes/namespace.yaml

# 2. Create secrets (edit kubernetes/secrets.yaml with your values first)
kubectl apply -f kubernetes/secrets.yaml

# 3. Deploy MongoDB
kubectl apply -f kubernetes/mongodb-deployment.yaml

# Wait for MongoDB to be ready:
kubectl get pods -n sentinelhub -w
# Press Ctrl+C when pod is Running

# 4. Build and load Docker images into Minikube
# (Minikube can't pull from your local Docker, need to load images)

# Build images:
cd client
docker build -t sentinelhub-frontend:local -f Dockerfile .
cd ..

# Load into Minikube:
minikube image load sentinelhub-frontend:local

# 5. Update deployment to use local image
# Edit kubernetes/frontend-deployment.yaml:
# Change: image: ghcr.io/sarahenia20/sentinelhub-frontend:latest
# To: image: sentinelhub-frontend:local

# 6. Deploy frontend
kubectl apply -f kubernetes/frontend-deployment.yaml

# 7. Deploy API Gateway (if you have Dockerfile for it)
kubectl apply -f kubernetes/api-gateway-deployment.yaml

# 8. Deploy Ingress
kubectl apply -f kubernetes/ingress.yaml
```

### Check Deployment Status:

```bash
# View all resources
kubectl get all -n sentinelhub

# Check pods are running:
kubectl get pods -n sentinelhub

# View pod logs:
kubectl logs -n sentinelhub <pod-name>

# Describe pod (troubleshoot issues):
kubectl describe pod -n sentinelhub <pod-name>

# Check Horizontal Pod Autoscaler:
kubectl get hpa -n sentinelhub
```

### Access Application in Minikube:

```bash
# Get Minikube IP:
minikube ip

# Access frontend:
minikube service frontend-service -n sentinelhub

# Or use port-forward:
kubectl port-forward -n sentinelhub svc/frontend-service 3000:3000

# Then open: http://localhost:3000
```

### Test Auto-Scaling:

```bash
# Generate load to trigger HPA (Horizontal Pod Autoscaler)
# In another terminal:
kubectl run -n sentinelhub -i --tty load-generator --rm --image=busybox --restart=Never -- /bin/sh

# Inside the pod, run:
while true; do wget -q -O- http://api-gateway-service:3001/api/health; done

# In original terminal, watch pods scale:
kubectl get hpa -n sentinelhub -w

# You should see REPLICAS increase from 2 → 3 → 4... up to 10 (based on CPU)
```

---

## 🌊 **Test GitOps with ArgoCD**

### Install ArgoCD in Minikube:

```bash
# Create ArgoCD namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD pods to be ready (takes 2-3 minutes):
kubectl get pods -n argocd -w

# Access ArgoCD UI:
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Open: https://localhost:8080 (ignore SSL warning)

# Get admin password:
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo

# Login:
# Username: admin
# Password: <password from above>
```

### Deploy SentinelHub via ArgoCD:

```bash
# 1. First, push your Kubernetes manifests to GitHub (if not already)
git add kubernetes/
git commit -m "Add Kubernetes manifests"
git push

# 2. Apply ArgoCD application
kubectl apply -f argocd/application.yaml

# 3. Check ArgoCD dashboard:
# https://localhost:8080

# You should see "sentinelhub" application
# Status: Synced, Healthy

# 4. Test GitOps workflow:
# Make a change to kubernetes/frontend-deployment.yaml (e.g., change replicas to 5)
# Commit and push to Git
# ArgoCD will automatically sync and deploy changes!
```

### Test Auto-Sync and Self-Healing:

```bash
# Manually change replica count (simulate drift):
kubectl scale deployment frontend -n sentinelhub --replicas=10

# Watch ArgoCD detect drift and revert (self-heal):
kubectl get deployment frontend -n sentinelhub -w

# ArgoCD will change it back to 2 replicas (what's in Git)
```

### ArgoCD CLI (Optional):

```bash
# Install ArgoCD CLI:
# Windows (PowerShell):
Invoke-WebRequest -Uri https://github.com/argoproj/argo-cd/releases/latest/download/argocd-windows-amd64.exe -OutFile argocd.exe

# Login:
argocd login localhost:8080 --username admin --password <password>

# List applications:
argocd app list

# Get app details:
argocd app get sentinelhub

# Sync manually:
argocd app sync sentinelhub

# View deployment history:
argocd app history sentinelhub
```

---

## 🏗️ **Test Terraform (Without Creating Resources)**

```bash
# Navigate to Terraform directory
cd terraform

# Initialize Terraform (downloads Azure provider):
terraform init

# Validate configuration:
terraform validate

# See what WOULD be created (dry-run):
terraform plan

# Output:
# Plan: 10 to add, 0 to change, 0 to destroy.
#
# Shows all Azure resources that would be created:
# - Resource Group
# - Virtual Network
# - Subnets
# - AKS Cluster
# - Container Registry
# - Cosmos DB
# - Application Insights
# - Network Security Groups
```

**DO NOT run `terraform apply` unless you want to create real Azure resources (costs money)!**

### Estimate Costs:

```bash
# Install Infracost (cost estimation tool):
# https://www.infracost.io/docs/

# Get cost estimate:
infracost breakdown --path .

# Shows estimated monthly cost for Azure resources
```

---

## 🤖 **Test Ansible (On Local Container)**

You can't run Ansible on Windows directly, but you can test it on a Linux container:

```bash
# Start Ubuntu container to test Ansible on:
docker run -d --name ansible-test-server ubuntu:22.04 sleep infinity

# Install SSH in container:
docker exec ansible-test-server apt-get update
docker exec ansible-test-server apt-get install -y openssh-server sudo python3

# Start SSH:
docker exec ansible-test-server service ssh start

# Get container IP:
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ansible-test-server

# Install Ansible on your Windows machine (WSL or use Docker):
# Option 1: WSL (recommended)
wsl
sudo apt update
sudo apt install ansible -y

# Option 2: Use Ansible in Docker
docker run --rm -it -v ${PWD}:/work -w /work cytopia/ansible:latest /bin/bash
```

**Test Ansible Playbook:**

```bash
# Inside WSL or Ansible container:

# Create simple inventory file:
cat > inventory.ini << EOF
[servers]
ansible-test-server ansible_host=<container-ip> ansible_user=root ansible_password=root ansible_ssh_common_args='-o StrictHostKeyChecking=no'
EOF

# Test connection:
ansible -i inventory.ini all -m ping

# Run playbook (WARNING: This will install Docker, Node.js in container):
ansible-playbook -i inventory.ini ansible/playbook.yml

# Check what was installed:
docker exec ansible-test-server docker --version
docker exec ansible-test-server node --version

# Cleanup:
docker stop ansible-test-server
docker rm ansible-test-server
```

**Simpler Test (Check Syntax Only):**

```bash
# Just validate playbook syntax (no execution):
ansible-playbook ansible/playbook.yml --syntax-check

# Do a dry-run (see what would happen):
ansible-playbook -i inventory.ini ansible/playbook.yml --check
```

---

## 📊 **Complete Testing Checklist**

### ✅ **Level 1: Docker (5 minutes)**
- [ ] `docker-compose up` - Development stack works
- [ ] `docker-compose -f docker-compose.prod.yml up` - Production stack works
- [ ] Access http://localhost:3000 - Frontend loads
- [ ] Access http://localhost:9090 - Prometheus works
- [ ] Access http://localhost:3002 - Grafana works

### ✅ **Level 2: Jenkins CI/CD (15 minutes)**
- [ ] `docker-compose -f docker-compose.jenkins.yml up -d` - Jenkins starts
- [ ] Access http://localhost:8080/jenkins - Jenkins UI loads
- [ ] Configure plugins (Docker, NodeJS, SonarQube)
- [ ] Create pipeline job pointing to Jenkinsfile
- [ ] Run pipeline - All 9 stages execute
- [ ] Check SonarQube: http://localhost:9000 - Code analysis appears
- [ ] Check Nexus: http://localhost:8081 - Artifact repository works

### ✅ **Level 3: Kubernetes (30 minutes)**
- [ ] `minikube start` - Local K8s cluster starts
- [ ] `kubectl apply -f kubernetes/namespace.yaml` - Namespace created
- [ ] `kubectl apply -f kubernetes/mongodb-deployment.yaml` - MongoDB deploys
- [ ] `kubectl get pods -n sentinelhub` - Pods are Running
- [ ] `kubectl apply -f kubernetes/frontend-deployment.yaml` - Frontend deploys
- [ ] `kubectl get hpa -n sentinelhub` - HPA is active
- [ ] `minikube service frontend-service -n sentinelhub` - Access app

### ✅ **Level 4: GitOps with ArgoCD (20 minutes)**
- [ ] Install ArgoCD in Minikube
- [ ] Access ArgoCD UI: https://localhost:8080
- [ ] `kubectl apply -f argocd/application.yaml` - App deployed
- [ ] ArgoCD shows "Synced" status
- [ ] Make Git change, push - ArgoCD auto-syncs
- [ ] Manually scale pod - ArgoCD reverts (self-heal)

### ✅ **Level 5: Infrastructure as Code**
- [ ] `cd terraform && terraform init` - Terraform initializes
- [ ] `terraform validate` - Config is valid
- [ ] `terraform plan` - Shows 10+ resources would be created
- [ ] `ansible-playbook ansible/playbook.yml --syntax-check` - Playbook is valid

---

## 🎬 **Demo Script for Presentation**

Use this flow to demonstrate your project:

### 1. **Show Local Development** (2 min)
```bash
docker-compose up
# Show: http://localhost:3000
# "With Docker Compose, entire stack starts with one command"
```

### 2. **Show CI/CD Pipeline** (3 min)
```bash
# Open Jenkins: http://localhost:8080/jenkins
# Click on SentinelHub-Pipeline → Build Now
# Show stages executing: Security Scanning, SonarQube, Docker Build
# "Every commit runs automated security scans"
```

### 3. **Show Kubernetes Auto-Scaling** (3 min)
```bash
kubectl get pods -n sentinelhub
kubectl get hpa -n sentinelhub
# Generate load
# Show pods scaling from 2 → 5
# "Application auto-scales based on traffic"
```

### 4. **Show GitOps** (2 min)
```bash
# ArgoCD UI: https://localhost:8080
# Change replicas in Git: 2 → 5
git commit -am "Scale to 5 replicas"
git push
# Show ArgoCD auto-sync
# "Deploy by merging to Git. GitOps!"
```

### 5. **Show Infrastructure as Code** (2 min)
```bash
cd terraform
terraform plan
# "This code would create entire Azure infrastructure:
#  - Kubernetes cluster
#  - Database
#  - Networking
#  - Monitoring
# All reproducible and version-controlled"
```

---

## 🐛 **Troubleshooting**

### Docker Issues:
```bash
# Restart Docker Desktop
# Clear Docker cache:
docker system prune -a --volumes

# Check Docker is running:
docker ps
```

### Minikube Issues:
```bash
# Delete and restart:
minikube delete
minikube start --cpus=4 --memory=8192

# Check status:
minikube status

# SSH into Minikube VM:
minikube ssh
```

### Kubernetes Pod Not Starting:
```bash
# Describe pod to see error:
kubectl describe pod <pod-name> -n sentinelhub

# Check logs:
kubectl logs <pod-name> -n sentinelhub

# Common issues:
# - ImagePullBackOff: Image doesn't exist in Minikube
#   Solution: minikube image load <image-name>
# - CrashLoopBackOff: Container crashes on start
#   Solution: Check logs, fix environment variables
```

### ArgoCD Not Syncing:
```bash
# Force sync:
argocd app sync sentinelhub --force

# Check ArgoCD logs:
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller
```

---

## 💡 **Pro Tips**

1. **Save Resources**: Stop services when not testing
   ```bash
   docker-compose down
   minikube stop
   ```

2. **Quick Restart**: Use `-d` flag to run in background
   ```bash
   docker-compose up -d
   ```

3. **View All Containers**:
   ```bash
   docker ps -a
   ```

4. **Clean Everything**:
   ```bash
   docker system prune -a --volumes
   minikube delete
   ```

5. **Monitor Resource Usage**:
   ```bash
   docker stats
   kubectl top nodes
   kubectl top pods -n sentinelhub
   ```

---

## 🎓 **What to Say in Interviews**

> "I can demonstrate the entire infrastructure locally. I've set up:
> - Docker Compose for local development
> - Jenkins pipeline with 9 stages of automated security scanning
> - Kubernetes cluster with auto-scaling from 2 to 10 pods
> - ArgoCD for GitOps - changes in Git automatically deploy
> - Terraform to provision Azure infrastructure as code
> - Ansible to automate server configuration
>
> Everything is testable without cloud costs using Minikube and Docker."

**When they ask**: "Have you deployed to production?"
> "The infrastructure is production-ready. I've tested it locally with Minikube and can provision the real Azure infrastructure with `terraform apply`. I designed it to be cloud-agnostic and cost-effective to test."

---

**Next Steps**: Start with Level 1 (Docker Compose), then progress through each level!
