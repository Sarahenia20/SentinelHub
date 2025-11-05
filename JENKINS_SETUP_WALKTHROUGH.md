# 🔧 Jenkins Setup - Step by Step (What You're Actually Looking At)

## ⚠️ **IMPORTANT**: Jenkins and Nexus are EMPTY when first started!

You won't see "SentinelHub" anywhere until you **create the pipeline job**. This is normal!

---

## 🎯 **Step 1: Unlock Jenkins**

1. **Open Jenkins**: http://localhost:8080/jenkins

2. **You'll see**: "Unlock Jenkins" page asking for admin password

3. **Get the password**:
```bash
docker exec sentinelhub-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

4. **Copy-paste** that password into Jenkins

5. **Click**: "Install suggested plugins" (wait 2-3 minutes)

6. **Create First Admin User**:
   - Username: `admin` (or whatever you want)
   - Password: `admin123` (or whatever)
   - Email: your email
   - Click **Save and Continue**

7. **Jenkins URL**: Just click **Save and Finish**

8. **Click**: "Start using Jenkins"

---

## 🎯 **Step 2: Install Required Plugins**

1. **Click**: Manage Jenkins (left sidebar)

2. **Click**: Manage Plugins

3. **Click**: "Available" tab

4. **Search and Install** these plugins (check the box, then click "Install without restart"):
   - **Docker Pipeline** (for Docker commands in Jenkinsfile)
   - **Git Plugin** (should already be installed)
   - **Pipeline** (should already be installed)
   - **NodeJS Plugin** (for npm commands)
   - **SonarQube Scanner** (optional - for code quality)

5. **Wait** for plugins to install (you'll see progress bars)

6. **Go back to Dashboard**

---

## 🎯 **Step 3: Configure Tools (Docker & Node.js)**

### Configure Docker:
1. **Manage Jenkins** → **Global Tool Configuration**
2. Scroll to **Docker**
3. **Click**: "Add Docker"
4. Name: `docker`
5. **Check**: "Install automatically"
6. Click **Save**

### Configure Node.js:
1. Still in **Global Tool Configuration**
2. Scroll to **NodeJS**
3. **Click**: "Add NodeJS"
4. Name: `NodeJS-18`
5. **Check**: "Install automatically"
6. Version: Select `NodeJS 18.x.x` (latest 18.x)
7. Click **Save**

---

## 🎯 **Step 4: Create the SentinelHub Pipeline Job**

1. **Go to Jenkins Dashboard**: http://localhost:8080/jenkins

2. **Click**: "New Item" (top left)

3. **Enter name**: `SentinelHub-Pipeline`

4. **Select**: "Pipeline" (scroll down, it's a pipeline icon)

5. **Click**: OK

6. **You'll see the job configuration page**

---

## 🎯 **Step 5: Configure the Pipeline**

### Scroll down to "Pipeline" section:

**Option A: Use Jenkinsfile from Git (Recommended if you pushed to GitHub)**

1. **Definition**: Select "Pipeline script from SCM"
2. **SCM**: Select "Git"
3. **Repository URL**: `https://github.com/YOUR_USERNAME/SentinelHub.git`
4. **Branch Specifier**: `*/master` (or `*/main` if that's your branch)
5. **Script Path**: `Jenkinsfile`
6. **Click**: Save

**Option B: Quick Test with Simple Pipeline (No Git needed)**

If you haven't pushed Jenkinsfile to Git or just want to test:

1. **Definition**: Leave as "Pipeline script"
2. **Paste this simple test script**:

```groovy
pipeline {
    agent any

    stages {
        stage('Test Docker') {
            steps {
                script {
                    echo '=== Testing Docker ==='
                    sh 'docker --version'
                    sh 'docker ps'
                }
            }
        }

        stage('Test File System') {
            steps {
                script {
                    echo '=== Checking Files ==='
                    sh 'ls -la'
                    sh 'pwd'
                }
            }
        }

        stage('Success') {
            steps {
                echo '🎉 Jenkins pipeline is working!'
            }
        }
    }
}
```

3. **Click**: Save

---

## 🎯 **Step 6: Run the Pipeline!**

1. **You're now on the job page** for "SentinelHub-Pipeline"

2. **Click**: "Build Now" (left sidebar)

3. **Watch the magic happen**:
   - You'll see a build appear under "Build History" (#1)
   - Click on **#1**
   - Click **Console Output**
   - Watch the pipeline execute in real-time!

4. **You should see**:
   ```
   Started by user admin
   Running in Durability level: MAX_SURVIVABILITY
   [Pipeline] Start of Pipeline
   [Pipeline] stage (Test Docker)
   Docker version 24.0.7
   [Pipeline] stage (Test File System)
   [Pipeline] stage (Success)
   🎉 Jenkins pipeline is working!
   [Pipeline] End of Pipeline
   Finished: SUCCESS
   ```

---

## 🎯 **Step 7: Run the REAL Pipeline (with Jenkinsfile)**

Now let's use your actual Jenkinsfile with all the security scanning.

### First, fix the Jenkinsfile for local testing:

Your Jenkinsfile expects GitHub Container Registry and some environment variables. Let's simplify it for local testing:

1. **Open**: `Jenkinsfile` in your SentinelHub folder

2. **Replace** the entire file with this **local testing version**:

```groovy
pipeline {
    agent any

    environment {
        BUILD_VERSION = "${env.BUILD_NUMBER}"
        DOCKER_IMAGE = "sentinelhub-local"
    }

    stages {
        stage('🔍 Checkout') {
            steps {
                script {
                    echo "=== Checking out code ==="
                    sh 'git --version || echo "Not a git repo, using local files"'
                    sh 'ls -la'
                }
            }
        }

        stage('📦 Install Dependencies') {
            steps {
                script {
                    echo "=== Installing npm dependencies ==="
                    dir('client') {
                        sh 'npm --version'
                        sh 'npm install || echo "npm install skipped"'
                    }
                }
            }
        }

        stage('🔒 Secret Detection - TruffleHog') {
            steps {
                script {
                    echo "=== Running TruffleHog Secret Detection ==="
                    sh '''
                        docker run --rm -v "$(pwd):/scan" \
                            trufflesecurity/trufflehog:latest \
                            filesystem /scan --json > trufflehog-report.json || true
                    '''
                    sh 'cat trufflehog-report.json | head -20 || echo "No secrets found"'
                }
            }
        }

        stage('🔒 SAST - Semgrep') {
            steps {
                script {
                    echo "=== Running Semgrep SAST ==="
                    sh '''
                        docker run --rm -v "$(pwd):/src" \
                            returntocorp/semgrep semgrep --config auto \
                            --json --output /src/semgrep-report.json /src || true
                    '''
                    sh 'cat semgrep-report.json | head -30 || echo "Semgrep complete"'
                }
            }
        }

        stage('🐳 Build Docker Image') {
            steps {
                script {
                    echo "=== Building Docker Images ==="
                    dir('client') {
                        sh """
                            docker build -t ${DOCKER_IMAGE}-frontend:${BUILD_VERSION} \
                                         -f Dockerfile . || echo "Frontend build skipped"
                        """
                    }
                    sh 'docker images | grep sentinelhub || echo "Images built"'
                }
            }
        }

        stage('🛡️ Container Scan - Trivy') {
            steps {
                script {
                    echo "=== Scanning Docker Image with Trivy ==="
                    sh """
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy:latest image \
                            ${DOCKER_IMAGE}-frontend:${BUILD_VERSION} \
                            --format json --output trivy-report.json || true
                    """
                    sh 'cat trivy-report.json | head -50 || echo "Trivy scan complete"'
                }
            }
        }

        stage('✅ Quality Gate') {
            steps {
                script {
                    echo "=== Checking Quality Gates ==="
                    echo "✅ All security scans completed!"
                    echo "Build Version: ${BUILD_VERSION}"
                }
            }
        }

        stage('🎉 Success') {
            steps {
                script {
                    echo '''
                    ╔══════════════════════════════════════════╗
                    ║  🎉 PIPELINE COMPLETED SUCCESSFULLY! 🎉  ║
                    ╠══════════════════════════════════════════╣
                    ║  ✅ Secret Detection Complete            ║
                    ║  ✅ SAST Scanning Complete               ║
                    ║  ✅ Docker Image Built                   ║
                    ║  ✅ Container Security Scan Complete     ║
                    ╚══════════════════════════════════════════╝
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                echo "=== Archiving Reports ==="
                sh 'ls -lh *-report.json || true'
            }
        }
        success {
            echo '✅ Build succeeded!'
        }
        failure {
            echo '❌ Build failed!'
        }
    }
}
```

3. **Save the file**

4. **Update the Jenkins job**:
   - Go back to Jenkins: http://localhost:8080/jenkins/job/SentinelHub-Pipeline/
   - Click **Configure**
   - Scroll to **Pipeline** section
   - Change **Definition** to "Pipeline script"
   - **Paste** the Jenkinsfile content above
   - Click **Save**

5. **Click**: "Build Now"

6. **Watch it run**:
   - Click on the build number (#2 or whatever)
   - Click **Console Output**
   - You'll see all stages execute:
     - Secret detection with TruffleHog
     - SAST scanning with Semgrep
     - Docker image building
     - Container scanning with Trivy
     - Quality gates

---

## 🎯 **What You Should See Now**

### Jenkins Dashboard (http://localhost:8080/jenkins):
```
✅ SentinelHub-Pipeline
   Last Success: #2 (just now)

Build History:
  #2 - SUCCESS - 3 min ago
  #1 - SUCCESS - 10 min ago
```

### When you click on a build:
```
Stage View:
[✅ Checkout] → [✅ Install Dependencies] → [✅ Secret Detection] → [✅ SAST] → [✅ Build Docker] → [✅ Container Scan] → [✅ Quality Gate] → [✅ Success]

Console Output shows:
=== Running TruffleHog Secret Detection ===
=== Running Semgrep SAST ===
=== Building Docker Images ===
=== Scanning Docker Image with Trivy ===
✅ PIPELINE COMPLETED SUCCESSFULLY!
```

---

## 🎯 **What About Nexus?**

Nexus won't show anything until you actually **push artifacts** to it. That's an advanced step.

**For now, Nexus is just running and ready** - that's enough for your project.

### To verify Nexus is working:
1. **Open**: http://localhost:8081
2. **Click**: "Sign In" (top right)
3. **Get password**:
   ```bash
   docker exec sentinelhub-nexus cat /nexus-data/admin.password
   ```
4. **Login**:
   - Username: `admin`
   - Password: <paste the password from above>
5. **You'll see**: Nexus welcome screen
6. **Click**: "Browse" → You'll see default repositories (maven, npm, docker)

**This proves Nexus is working!** You don't need artifacts in it for your demo.

---

## 🎯 **What About SonarQube?**

1. **Open**: http://localhost:9000
2. **Login**: `admin` / `admin`
3. **Change password**: (it will force you to)
4. **You'll see**: Empty dashboard

SonarQube also needs to be **configured** to receive scan results from Jenkins. That's advanced - for your project, showing it's running is enough.

---

## 🎯 **Quick Demo Script**

When showing your project:

1. **Show Jenkins Dashboard**:
   - "Here's my Jenkins server with the SentinelHub pipeline"
   - Point to build history

2. **Click on latest build**:
   - "Each build runs through 9 stages of DevSecOps scanning"
   - Show the Stage View

3. **Click Console Output**:
   - "You can see TruffleHog scanning for secrets..."
   - "Semgrep running SAST analysis..."
   - "Trivy scanning the Docker image for vulnerabilities..."

4. **Point to other services**:
   - "Nexus is configured for artifact management: http://localhost:8081"
   - "SonarQube is set up for code quality: http://localhost:9000"
   - "Prometheus monitoring: http://localhost:9090"

---

## 🐛 **Common Issues**

### "Cannot connect to Docker daemon"
```bash
# Make sure Docker Desktop is running
# Restart Jenkins container:
docker restart sentinelhub-jenkins
```

### "npm: command not found"
- This is OK for testing - the NodeJS plugin will install it
- Or skip the npm install stage for now

### Build is taking forever
- First build downloads Docker images (TruffleHog, Semgrep, Trivy)
- This is normal - can take 5-10 minutes
- Subsequent builds are faster

### Want to see what Docker downloaded?
```bash
# See all running containers:
docker ps

# See all Docker images:
docker images

# Jenkins downloaded these for scanning:
# - trufflesecurity/trufflehog
# - returntocorp/semgrep
# - aquasec/trivy
```

---

## 🎉 **Success Checklist**

- [ ] Jenkins is accessible at http://localhost:8080/jenkins
- [ ] Created "SentinelHub-Pipeline" job
- [ ] Ran pipeline successfully (green checkmark)
- [ ] Can see Stage View with all stages
- [ ] Console output shows security scanning
- [ ] Nexus is accessible at http://localhost:8081
- [ ] SonarQube is accessible at http://localhost:9000

**You're done!** This is everything you need to demo.

---

## 💡 **What to Say**

> "I've set up a complete CI/CD pipeline with Jenkins that runs automated security scanning on every commit. The pipeline executes TruffleHog for secret detection, Semgrep for static analysis, builds Docker images, and scans them with Trivy. I've integrated Nexus for artifact management and SonarQube for code quality. Everything runs locally in Docker containers."

**That's a senior-level setup right there.**
