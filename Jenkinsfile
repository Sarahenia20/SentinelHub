// SentinelHub DevSecOps CI/CD Pipeline
pipeline {
    agent any

    environment {
        // Docker Registry
        DOCKER_REGISTRY = 'ghcr.io'
        DOCKER_IMAGE_PREFIX = 'sarahenia20/sentinelhub'

        // Application
        APP_NAME = 'sentinelhub'

        // SonarQube
        SONAR_HOST_URL = 'http://localhost:9000'
        SONAR_PROJECT_KEY = 'sentinelhub-security'

        // Git
        GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
        BUILD_VERSION = "${env.BUILD_NUMBER}-${GIT_COMMIT_SHORT}"
    }

    tools {
        nodejs 'NodeJS-18'
    }

    stages {
        stage('🔍 Checkout') {
            steps {
                echo '📥 Checking out source code...'
                checkout scm
                sh 'git log -1 --pretty=format:"%h - %an: %s"'
            }
        }

        stage('🔧 Environment Setup') {
            steps {
                echo '⚙️ Setting up environment...'
                sh '''
                    echo "Build Version: ${BUILD_VERSION}"
                    echo "Node Version: $(node --version)"
                    echo "NPM Version: $(npm --version)"
                    echo "Docker Version: $(docker --version)"
                '''
            }
        }

        stage('📦 Install Dependencies') {
            parallel {
                stage('Frontend Dependencies') {
                    steps {
                        dir('client') {
                            echo '📦 Installing frontend dependencies...'
                            sh 'npm ci'
                        }
                    }
                }
                stage('Backend Dependencies') {
                    steps {
                        dir('api-gateway') {
                            echo '📦 Installing backend dependencies...'
                            sh 'npm ci --only=production'
                        }
                    }
                }
            }
        }

        stage('🧪 Lint & Code Quality') {
            parallel {
                stage('Frontend Lint') {
                    steps {
                        dir('client') {
                            echo '🔍 Linting frontend code...'
                            sh 'npm run lint || true'
                        }
                    }
                }
                stage('Backend Lint') {
                    steps {
                        dir('api-gateway') {
                            echo '🔍 Linting backend code...'
                            sh 'npm run lint || echo "No lint script configured"'
                        }
                    }
                }
            }
        }

        stage('🔒 Security Scanning') {
            parallel {
                stage('Secret Detection - TruffleHog') {
                    steps {
                        echo '🔐 Scanning for secrets...'
                        sh '''
                            docker run --rm -v "$(pwd):/scan" \
                                trufflesecurity/trufflehog:latest \
                                filesystem /scan \
                                --no-update \
                                --fail \
                                --json > trufflehog-report.json || true
                        '''
                    }
                }

                stage('Secret Detection - Gitleaks') {
                    steps {
                        echo '🔐 Scanning for secrets with Gitleaks...'
                        sh '''
                            docker run --rm -v "$(pwd):/scan" \
                                zricethezav/gitleaks:latest \
                                detect --source /scan \
                                --report-path /scan/gitleaks-report.json \
                                --no-git || true
                        '''
                    }
                }

                stage('SAST - Semgrep') {
                    steps {
                        echo '🔍 Running static code analysis...'
                        sh '''
                            docker run --rm -v "$(pwd):/src" \
                                returntocorp/semgrep semgrep \
                                --config auto \
                                --json \
                                --output /src/semgrep-report.json \
                                /src || true
                        '''
                    }
                }

                stage('Dependency Check') {
                    steps {
                        echo '📦 Checking dependencies for vulnerabilities...'
                        sh '''
                            cd client && npm audit --json > ../npm-audit-frontend.json || true
                            cd ../api-gateway && npm audit --json > ../npm-audit-backend.json || true
                        '''
                    }
                }
            }
        }

        stage('🏗️ SonarQube Analysis') {
            steps {
                echo '📊 Running SonarQube analysis...'
                script {
                    def scannerHome = tool 'SonarQube Scanner'
                    withSonarQubeEnv('SonarQube') {
                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                                -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                                -Dsonar.sources=. \
                                -Dsonar.host.url=${SONAR_HOST_URL} \
                                -Dsonar.exclusions=**/node_modules/**,**/*.test.js,**/coverage/** \
                                -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                        """
                    }
                }
            }
        }

        stage('🔨 Build Application') {
            parallel {
                stage('Build Frontend') {
                    steps {
                        dir('client') {
                            echo '🏗️ Building frontend...'
                            sh 'npm run build'
                        }
                    }
                }
                stage('Build Backend') {
                    steps {
                        dir('api-gateway') {
                            echo '🏗️ Building backend...'
                            sh 'echo "Backend ready for containerization"'
                        }
                    }
                }
            }
        }

        stage('🐳 Build Docker Images') {
            parallel {
                stage('Build Frontend Image') {
                    steps {
                        echo '🐳 Building frontend Docker image...'
                        sh """
                            docker build -t ${DOCKER_IMAGE_PREFIX}-frontend:${BUILD_VERSION} \
                                         -t ${DOCKER_IMAGE_PREFIX}-frontend:latest \
                                         -f client/Dockerfile \
                                         ./client
                        """
                    }
                }
                stage('Build Backend Image') {
                    steps {
                        echo '🐳 Building backend Docker image...'
                        sh """
                            docker build -t ${DOCKER_IMAGE_PREFIX}-api:${BUILD_VERSION} \
                                         -t ${DOCKER_IMAGE_PREFIX}-api:latest \
                                         -f api-gateway/Dockerfile \
                                         ./api-gateway
                        """
                    }
                }
            }
        }

        stage('🔍 Container Security Scanning') {
            parallel {
                stage('Scan Frontend Image - Trivy') {
                    steps {
                        echo '🔒 Scanning frontend image with Trivy...'
                        sh """
                            docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                                aquasec/trivy image \
                                --format json \
                                --output trivy-frontend-report.json \
                                ${DOCKER_IMAGE_PREFIX}-frontend:${BUILD_VERSION} || true
                        """
                    }
                }
                stage('Scan Backend Image - Trivy') {
                    steps {
                        echo '🔒 Scanning backend image with Trivy...'
                        sh """
                            docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                                aquasec/trivy image \
                                --format json \
                                --output trivy-backend-report.json \
                                ${DOCKER_IMAGE_PREFIX}-api:${BUILD_VERSION} || true
                        """
                    }
                }
            }
        }

        stage('📊 Quality Gate') {
            steps {
                echo '✅ Checking quality gates...'
                script {
                    timeout(time: 5, unit: 'MINUTES') {
                        def qg = waitForQualityGate()
                        if (qg.status != 'OK') {
                            echo "⚠️ Quality Gate failed: ${qg.status}"
                            // Don't fail the build, just warn
                        } else {
                            echo "✅ Quality Gate passed!"
                        }
                    }
                }
            }
        }

        stage('🚀 Push Docker Images') {
            when {
                branch 'main'
            }
            steps {
                echo '📤 Pushing Docker images to registry...'
                withCredentials([usernamePassword(credentialsId: 'docker-registry-credentials', usernameVariable: 'REGISTRY_USER', passwordVariable: 'REGISTRY_PASS')]) {
                    sh '''
                        echo $REGISTRY_PASS | docker login ${DOCKER_REGISTRY} -u $REGISTRY_USER --password-stdin

                        docker push ${DOCKER_IMAGE_PREFIX}-frontend:${BUILD_VERSION}
                        docker push ${DOCKER_IMAGE_PREFIX}-frontend:latest

                        docker push ${DOCKER_IMAGE_PREFIX}-api:${BUILD_VERSION}
                        docker push ${DOCKER_IMAGE_PREFIX}-api:latest

                        docker logout ${DOCKER_REGISTRY}
                    '''
                }
            }
        }

        stage('📋 Generate Reports') {
            steps {
                echo '📊 Generating security reports...'
                sh '''
                    echo "=== Security Scan Summary ===" > security-summary.txt
                    echo "Build Version: ${BUILD_VERSION}" >> security-summary.txt
                    echo "Timestamp: $(date)" >> security-summary.txt
                    echo "" >> security-summary.txt
                    echo "Files scanned:" >> security-summary.txt
                    echo "- TruffleHog Report: trufflehog-report.json" >> security-summary.txt
                    echo "- Gitleaks Report: gitleaks-report.json" >> security-summary.txt
                    echo "- Semgrep Report: semgrep-report.json" >> security-summary.txt
                    echo "- Trivy Frontend: trivy-frontend-report.json" >> security-summary.txt
                    echo "- Trivy Backend: trivy-backend-report.json" >> security-summary.txt

                    cat security-summary.txt
                '''
            }
        }
    }

    post {
        always {
            echo '🧹 Cleaning up...'

            // Archive artifacts
            archiveArtifacts artifacts: '**/*-report.json, security-summary.txt', fingerprint: true, allowEmptyArchive: true

            // Publish reports
            publishHTML([
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: '.',
                reportFiles: 'security-summary.txt',
                reportName: 'Security Summary'
            ])

            // Clean Docker images on Jenkins agent
            sh '''
                docker image prune -f
            '''
        }

        success {
            echo '✅ Pipeline completed successfully!'
            emailext (
                subject: "✅ SentinelHub Build #${env.BUILD_NUMBER} - SUCCESS",
                body: """
                    Build Successful!

                    Build Number: ${env.BUILD_NUMBER}
                    Version: ${BUILD_VERSION}

                    Check console output at ${env.BUILD_URL}
                """,
                to: '${DEFAULT_RECIPIENTS}',
                attachLog: true
            )
        }

        failure {
            echo '❌ Pipeline failed!'
            emailext (
                subject: "❌ SentinelHub Build #${env.BUILD_NUMBER} - FAILED",
                body: """
                    Build Failed!

                    Build Number: ${env.BUILD_NUMBER}
                    Version: ${BUILD_VERSION}

                    Check console output at ${env.BUILD_URL}
                """,
                to: '${DEFAULT_RECIPIENTS}',
                attachLog: true
            )
        }

        unstable {
            echo '⚠️ Pipeline unstable!'
        }
    }
}
