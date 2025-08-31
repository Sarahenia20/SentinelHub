const AWS = require('aws-sdk');
const TruffleHogIntegration = require('../real-security-tools/trufflehog-integration');
const HuggingFaceGemma = require('../ai-intelligence/huggingface-gemma');
const ConversationAI = require('../ai-intelligence/conversation-ai');

/**
 * 🪣 AWS S3 Bucket Security Scanner
 * Comprehensive S3 bucket security analysis using real AWS APIs + pattern detection
 * 
 * Features:
 * - Real AWS S3 API integration
 * - Bucket permission analysis
 * - Object content scanning for secrets
 * - TruffleHog secret detection
 * - AI-powered risk assessment
 * - Compliance checking
 */
class S3BucketScanner {
  constructor() {
    this.name = 'AWS S3 Security Scanner';
    this.version = '1.0.0';
    this.truffleHog = new TruffleHogIntegration();
    this.gemmaAI = new HuggingFaceGemma();
    this.conversationAI = new ConversationAI();
    
    // AWS Configuration
    this.s3 = null;
    this.iam = null;
    this.cloudtrail = null;
    
    console.log(`🪣 ${this.name} v${this.version} initialized`);
  }
  
  /**
   * Initialize AWS clients with credentials
   */
  initializeAWS(credentials) {
    const config = {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: credentials.region || 'us-east-1'
    };
    
    AWS.config.update(config);
    
    this.s3 = new AWS.S3();
    this.iam = new AWS.IAM();
    this.cloudtrail = new AWS.CloudTrail();
    
    console.log(`   ✅ AWS clients initialized for region: ${config.region}`);
  }
  
  /**
   * Comprehensive S3 bucket security scan
   */
  async scanBucket(bucketName, credentials, options = {}) {
    const scanId = require('crypto').randomUUID();
    const startTime = Date.now();
    
    console.log(`🪣 Starting S3 security scan: ${bucketName}`);
    
    // Initialize AWS
    this.initializeAWS(credentials);
    
    const results = {
      scanId,
      bucketName,
      timestamp: new Date().toISOString(),
      type: 's3-bucket-security',
      
      // Scan phases
      phases: {
        bucketAnalysis: { completed: false, findings: [] },
        permissionsAudit: { completed: false, findings: [] },
        contentScanning: { completed: false, findings: [] },
        secretDetection: { completed: false, findings: [] },
        complianceCheck: { completed: false, findings: [] },
        aiAnalysis: { completed: false, findings: {} }
      },
      
      // Consolidated findings
      findings: {
        misconfigurations: [],
        permissions: [],
        secrets: [],
        compliance: [],
        vulnerabilities: []
      },
      
      // Risk assessment
      riskAssessment: {
        overall: 'unknown',
        categories: {
          access: 'unknown',
          encryption: 'unknown',
          logging: 'unknown',
          secrets: 'unknown'
        }
      },
      
      metrics: {
        scanDuration: 0,
        objectsScanned: 0,
        secretsFound: 0,
        configurationsChecked: 0
      }
    };
    
    try {
      // Phase 1: Bucket Configuration Analysis
      await this.analyzeBucketConfiguration(bucketName, results);
      
      // Phase 2: Permissions and Access Control Audit
      await this.auditBucketPermissions(bucketName, results);
      
      // Phase 3: Content Scanning (limited for performance)
      await this.scanBucketContent(bucketName, results, options);
      
      // Phase 4: Secret Detection with TruffleHog
      await this.detectSecretsInBucket(bucketName, results, options);
      
      // Phase 5: Compliance Checking
      await this.checkCompliance(bucketName, results);
      
      // Phase 6: AI Risk Assessment
      await this.performAIAnalysis(results);
      
      // Calculate final risk assessment
      this.calculateOverallRisk(results);
      
      results.metrics.scanDuration = Date.now() - startTime;
      
      // Initialize conversational AI with scan results
      results.conversationAI = await this.initializeConversationForScan(results);
      
      console.log(`S3 scan completed: ${results.metrics.scanDuration}ms`);
      console.log(`Found: ${results.findings.misconfigurations.length} misconfigs, ${results.findings.secrets.length} secrets`);
      console.log(`Risk Level: ${results.riskAssessment.overall.toUpperCase()}`);
      
      return results;
      
    } catch (error) {
      console.error(`❌ S3 scan failed: ${error.message}`);
      results.error = error.message;
      results.metrics.scanDuration = Date.now() - startTime;
      return results;
    }
  }
  
  /**
   * Phase 1: Analyze bucket configuration and settings
   */
  async analyzeBucketConfiguration(bucketName, results) {
    console.log('🔍 Phase 1: Analyzing bucket configuration...');
    
    try {
      // Get bucket location
      const location = await this.s3.getBucketLocation({ Bucket: bucketName }).promise();
      
      // Get bucket versioning
      const versioning = await this.s3.getBucketVersioning({ Bucket: bucketName }).promise();
      
      // Get bucket encryption
      let encryption = null;
      try {
        encryption = await this.s3.getBucketEncryption({ Bucket: bucketName }).promise();
      } catch (e) {
        // Encryption not configured
      }
      
      // Get bucket logging
      let logging = null;
      try {
        logging = await this.s3.getBucketLogging({ Bucket: bucketName }).promise();
      } catch (e) {
        // Logging not configured
      }
      
      // Get bucket policy
      let policy = null;
      try {
        const policyResult = await this.s3.getBucketPolicy({ Bucket: bucketName }).promise();
        policy = JSON.parse(policyResult.Policy);
      } catch (e) {
        // No bucket policy
      }
      
      // Analyze findings
      const configFindings = [];
      
      // Check encryption
      if (!encryption) {
        configFindings.push({
          type: 'encryption-disabled',
          severity: 'high',
          category: 'encryption',
          message: 'S3 bucket encryption is not enabled',
          recommendation: 'Enable S3 server-side encryption (SSE-S3 or SSE-KMS)',
          impact: 'Data stored in bucket is not encrypted at rest',
          compliance: ['PCI-DSS', 'HIPAA', 'SOX']
        });
      }
      
      // Check versioning
      if (versioning.Status !== 'Enabled') {
        configFindings.push({
          type: 'versioning-disabled',
          severity: 'medium',
          category: 'backup',
          message: 'S3 bucket versioning is not enabled',
          recommendation: 'Enable versioning to protect against accidental deletion',
          impact: 'Risk of permanent data loss from accidental deletion'
        });
      }
      
      // Check logging
      if (!logging || !logging.LoggingEnabled) {
        configFindings.push({
          type: 'access-logging-disabled',
          severity: 'medium',
          category: 'logging',
          message: 'S3 access logging is not enabled',
          recommendation: 'Enable S3 access logging for audit trail',
          impact: 'Cannot track access patterns or detect unauthorized access',
          compliance: ['SOX', 'GDPR']
        });
      }
      
      results.phases.bucketAnalysis.completed = true;
      results.phases.bucketAnalysis.findings = configFindings;
      results.findings.misconfigurations.push(...configFindings);
      results.metrics.configurationsChecked = 4; // encryption, versioning, logging, policy
      
      console.log(`   ✓ Configuration analysis: ${configFindings.length} issues found`);
      
    } catch (error) {
      console.warn(`   ⚠️ Configuration analysis failed: ${error.message}`);
      results.phases.bucketAnalysis.error = error.message;
    }
  }
  
  /**
   * Phase 2: Audit bucket permissions and access controls
   */
  async auditBucketPermissions(bucketName, results) {
    console.log('🔐 Phase 2: Auditing bucket permissions...');
    
    try {
      // Get bucket ACL
      const acl = await this.s3.getBucketAcl({ Bucket: bucketName }).promise();
      
      // Get bucket policy (if exists)
      let policy = null;
      try {
        const policyResult = await this.s3.getBucketPolicy({ Bucket: bucketName }).promise();
        policy = JSON.parse(policyResult.Policy);
      } catch (e) {
        // No bucket policy
      }
      
      // Get public access block configuration
      let publicAccessBlock = null;
      try {
        publicAccessBlock = await this.s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
      } catch (e) {
        // No public access block configured
      }
      
      const permissionFindings = [];
      
      // Check for public read access in ACL
      const publicReadGrants = acl.Grants.filter(grant => 
        grant.Grantee.URI && grant.Grantee.URI.includes('AllUsers') && 
        (grant.Permission === 'READ' || grant.Permission === 'FULL_CONTROL')
      );
      
      if (publicReadGrants.length > 0) {
        permissionFindings.push({
          type: 'public-read-access',
          severity: 'critical',
          category: 'access-control',
          message: 'S3 bucket allows public read access via ACL',
          recommendation: 'Remove public read permissions and use signed URLs if needed',
          impact: 'Anyone on the internet can read bucket contents',
          evidence: `Public read grants: ${publicReadGrants.length}`,
          compliance: ['GDPR', 'PCI-DSS', 'HIPAA']
        });
      }
      
      // Check for public write access in ACL
      const publicWriteGrants = acl.Grants.filter(grant => 
        grant.Grantee.URI && grant.Grantee.URI.includes('AllUsers') && 
        (grant.Permission === 'WRITE' || grant.Permission === 'FULL_CONTROL')
      );
      
      if (publicWriteGrants.length > 0) {
        permissionFindings.push({
          type: 'public-write-access',
          severity: 'critical',
          category: 'access-control',
          message: 'S3 bucket allows public write access via ACL',
          recommendation: 'Remove public write permissions immediately',
          impact: 'Anyone can upload/modify/delete objects in your bucket',
          evidence: `Public write grants: ${publicWriteGrants.length}`,
          compliance: ['All compliance frameworks violated']
        });
      }
      
      // Analyze bucket policy for public access
      if (policy && policy.Statement) {
        for (const statement of policy.Statement) {
          if (statement.Effect === 'Allow' && 
              (statement.Principal === '*' || statement.Principal.AWS === '*')) {
            
            permissionFindings.push({
              type: 'policy-public-access',
              severity: 'critical',
              category: 'access-control',
              message: 'Bucket policy allows public access',
              recommendation: 'Restrict bucket policy to specific principals',
              impact: 'Bucket policy grants broad public access',
              evidence: `Statement: ${JSON.stringify(statement)}`,
              compliance: ['GDPR', 'PCI-DSS']
            });
          }
        }
      }
      
      // Check public access block configuration
      if (!publicAccessBlock || 
          !publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicAcls ||
          !publicAccessBlock.PublicAccessBlockConfiguration.IgnorePublicAcls) {
        
        permissionFindings.push({
          type: 'public-access-block-disabled',
          severity: 'high',
          category: 'access-control',
          message: 'S3 public access block is not fully enabled',
          recommendation: 'Enable all public access block settings',
          impact: 'Increased risk of accidental public exposure',
          compliance: ['Security best practice']
        });
      }
      
      results.phases.permissionsAudit.completed = true;
      results.phases.permissionsAudit.findings = permissionFindings;
      results.findings.permissions.push(...permissionFindings);
      
      console.log(`   ✓ Permissions audit: ${permissionFindings.length} issues found`);
      
    } catch (error) {
      console.warn(`   ⚠️ Permissions audit failed: ${error.message}`);
      results.phases.permissionsAudit.error = error.message;
    }
  }
  
  /**
   * Phase 3: Scan bucket content for sensitive data patterns
   */
  async scanBucketContent(bucketName, results, options) {
    console.log('📄 Phase 3: Scanning bucket content...');
    
    try {
      // List objects (limit for performance)
      const maxObjects = options.maxObjects || 100;
      const listParams = {
        Bucket: bucketName,
        MaxKeys: maxObjects
      };
      
      const objects = await this.s3.listObjectsV2(listParams).promise();
      results.metrics.objectsScanned = objects.Contents?.length || 0;
      
      if (!objects.Contents || objects.Contents.length === 0) {
        console.log('   ℹ️ No objects found in bucket');
        results.phases.contentScanning.completed = true;
        return;
      }
      
      const contentFindings = [];
      
      // Scan first few objects for sensitive patterns
      const objectsToScan = objects.Contents.slice(0, Math.min(10, objects.Contents.length));
      
      for (const obj of objectsToScan) {
        try {
          // Skip large files to avoid timeout
          if (obj.Size > 1024 * 1024) { // 1MB limit
            continue;
          }
          
          // Get object content
          const objectData = await this.s3.getObject({
            Bucket: bucketName,
            Key: obj.Key
          }).promise();
          
          const content = objectData.Body.toString('utf8');
          
          // Pattern-based secret detection
          const secrets = this.detectSecretsInContent(content, obj.Key);
          contentFindings.push(...secrets);
          
          // Check for common sensitive files
          if (this.isSensitiveFile(obj.Key)) {
            contentFindings.push({
              type: 'sensitive-file',
              severity: 'high',
              category: 'data-exposure',
              message: `Potentially sensitive file: ${obj.Key}`,
              recommendation: 'Review file contents and restrict access if needed',
              impact: 'Sensitive information may be exposed',
              evidence: `File: ${obj.Key}, Size: ${obj.Size} bytes`
            });
          }
          
        } catch (objectError) {
          console.warn(`   ⚠️ Could not scan object ${obj.Key}: ${objectError.message}`);
        }
      }
      
      results.phases.contentScanning.completed = true;
      results.phases.contentScanning.findings = contentFindings;
      results.findings.secrets.push(...contentFindings.filter(f => f.category === 'secrets'));
      results.findings.vulnerabilities.push(...contentFindings.filter(f => f.category === 'data-exposure'));
      
      console.log(`   ✓ Content scanning: ${contentFindings.length} findings in ${objectsToScan.length} objects`);
      
    } catch (error) {
      console.warn(`   ⚠️ Content scanning failed: ${error.message}`);
      results.phases.contentScanning.error = error.message;
    }
  }
  
  /**
   * Phase 4: Use TruffleHog for advanced secret detection
   */
  async detectSecretsInBucket(bucketName, results, options) {
    console.log('🔐 Phase 4: TruffleHog secret detection...');
    
    if (!this.truffleHog) {
      console.log('   ⚠️ TruffleHog not available, skipping advanced secret detection');
      results.phases.secretDetection.completed = true;
      return;
    }
    
    try {
      // For demo: scan a sample of object contents with TruffleHog
      // In production, you might want to scan specific file types or use S3 events
      
      const objects = await this.s3.listObjectsV2({
        Bucket: bucketName,
        MaxKeys: 5 // Limit for TruffleHog scanning
      }).promise();
      
      let truffleSecrets = [];
      
      if (objects.Contents && objects.Contents.length > 0) {
        // Combine content from multiple small files
        let combinedContent = '';
        
        for (const obj of objects.Contents.slice(0, 3)) {
          try {
            if (obj.Size < 50000) { // 50KB limit
              const objectData = await this.s3.getObject({
                Bucket: bucketName,
                Key: obj.Key
              }).promise();
              
              combinedContent += `\\n\\n// File: ${obj.Key}\\n`;
              combinedContent += objectData.Body.toString('utf8');
            }
          } catch (e) {
            // Skip files that can't be read as text
          }
        }
        
        if (combinedContent.length > 100) {
          truffleSecrets = await this.truffleHog.scanCode(combinedContent);
        }
      }
      
      // Convert TruffleHog results to our format
      const secretFindings = truffleSecrets.map(secret => ({
        type: 'trufflehog-secret',
        severity: secret.verified ? 'critical' : 'high',
        category: 'secrets',
        message: `${secret.type} detected in S3 bucket`,
        recommendation: secret.recommendation,
        impact: secret.verified ? 'Verified secret - immediate risk' : 'Potential secret exposure',
        evidence: `Detector: ${secret.detectorName}, Confidence: ${(secret.confidence * 100).toFixed(0)}%`,
        source: 'trufflehog'
      }));
      
      results.phases.secretDetection.completed = true;
      results.phases.secretDetection.findings = secretFindings;
      results.findings.secrets.push(...secretFindings);
      results.metrics.secretsFound = secretFindings.length;
      
      console.log(`   ✓ TruffleHog detection: ${secretFindings.length} secrets found`);
      
    } catch (error) {
      console.warn(`   ⚠️ TruffleHog detection failed: ${error.message}`);
      results.phases.secretDetection.error = error.message;
    }
  }
  
  /**
   * Phase 5: Check compliance against security standards
   */
  async checkCompliance(bucketName, results) {
    console.log('📋 Phase 5: Checking compliance...');
    
    const complianceFindings = [];
    
    // Aggregate all findings for compliance analysis
    const allFindings = [
      ...results.findings.misconfigurations,
      ...results.findings.permissions,
      ...results.findings.secrets,
      ...results.findings.vulnerabilities
    ];
    
    // Check GDPR compliance
    const gdprViolations = allFindings.filter(f => 
      f.compliance && f.compliance.includes('GDPR')
    );
    
    if (gdprViolations.length > 0) {
      complianceFindings.push({
        type: 'gdpr-violation',
        severity: 'high',
        category: 'compliance',
        message: `${gdprViolations.length} GDPR compliance violations detected`,
        recommendation: 'Address encryption, access controls, and logging requirements',
        impact: 'May violate GDPR data protection requirements',
        evidence: `Violations: ${gdprViolations.map(v => v.type).join(', ')}`
      });
    }
    
    // Check PCI-DSS compliance
    const pciViolations = allFindings.filter(f => 
      f.compliance && f.compliance.includes('PCI-DSS')
    );
    
    if (pciViolations.length > 0) {
      complianceFindings.push({
        type: 'pci-dss-violation',
        severity: 'critical',
        category: 'compliance',
        message: `${pciViolations.length} PCI-DSS compliance violations detected`,
        recommendation: 'Implement encryption, access controls, and monitoring',
        impact: 'May violate PCI-DSS payment card security requirements',
        evidence: `Violations: ${pciViolations.map(v => v.type).join(', ')}`
      });
    }
    
    results.phases.complianceCheck.completed = true;
    results.phases.complianceCheck.findings = complianceFindings;
    results.findings.compliance.push(...complianceFindings);
    
    console.log(`   ✓ Compliance check: ${complianceFindings.length} violations found`);
  }
  
  /**
   * Phase 6: AI-powered risk analysis using Gemma
   */
  async performAIAnalysis(results) {
    console.log('🤖 Phase 6: AI risk analysis...');
    
    if (!this.gemmaAI || !this.gemmaAI.apiKey) {
      console.log('   ⚠️ Gemma AI not available, skipping AI analysis');
      results.phases.aiAnalysis.completed = true;
      return;
    }
    
    try {
      const analysisData = {
        vulnerabilities: results.findings.misconfigurations,
        secrets: results.findings.secrets,
        permissions: results.findings.permissions,
        compliance: results.findings.compliance
      };
      
      const aiAnalysis = await this.gemmaAI.analyzeSecurityFindings(analysisData, {
        focusArea: 'cloud-storage'
      });
      
      results.phases.aiAnalysis.completed = true;
      results.phases.aiAnalysis.findings = aiAnalysis;
      
      console.log(`   ✓ AI analysis completed: ${aiAnalysis.riskAssessment.level} risk level`);
      
    } catch (error) {
      console.warn(`   ⚠️ AI analysis failed: ${error.message}`);
      results.phases.aiAnalysis.error = error.message;
    }
  }
  
  /**
   * Pattern-based secret detection in content
   */
  detectSecretsInContent(content, filename) {
    const secrets = [];
    
    // AWS Access Key pattern
    const awsKeyPattern = /AKIA[0-9A-Z]{16}/g;
    let match;
    while ((match = awsKeyPattern.exec(content)) !== null) {
      secrets.push({
        type: 'aws-access-key',
        severity: 'critical',
        category: 'secrets',
        message: 'AWS Access Key found in file content',
        recommendation: 'Remove AWS credentials from files, use IAM roles instead',
        impact: 'AWS account compromise risk',
        evidence: `Key: ${match[0].substring(0, 8)}..., File: ${filename}`
      });
    }
    
    // Private key pattern
    const privateKeyPattern = /-----BEGIN [A-Z ]+PRIVATE KEY-----/g;
    while ((match = privateKeyPattern.exec(content)) !== null) {
      secrets.push({
        type: 'private-key',
        severity: 'high',
        category: 'secrets',
        message: 'Private key found in file content',
        recommendation: 'Remove private keys from files, use secure key management',
        impact: 'Cryptographic key compromise risk',
        evidence: `File: ${filename}`
      });
    }
    
    // API key patterns
    const apiKeyPatterns = [
      { pattern: /sk_[a-zA-Z0-9]{24,}/, type: 'stripe-secret-key' },
      { pattern: /ghp_[a-zA-Z0-9]{36}/, type: 'github-token' },
      { pattern: /xoxb-[0-9]+-[0-9]+-[a-zA-Z0-9]+/, type: 'slack-bot-token' }
    ];
    
    for (const { pattern, type } of apiKeyPatterns) {
      while ((match = pattern.exec(content)) !== null) {
        secrets.push({
          type: type,
          severity: 'high',
          category: 'secrets',
          message: `${type.replace('-', ' ')} found in file content`,
          recommendation: 'Remove API keys from files, use environment variables',
          impact: 'API service compromise risk',
          evidence: `File: ${filename}`
        });
      }
    }
    
    return secrets;
  }
  
  /**
   * Check if filename indicates sensitive content
   */
  isSensitiveFile(filename) {
    const sensitivePatterns = [
      /\.env/, /config/, /secret/, /key/, /credential/,
      /password/, /backup/, /database/, /\.sql/,
      /\.pem/, /\.p12/, /\.pfx/, /id_rsa/, /id_dsa/
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(filename.toLowerCase()));
  }
  
  /**
   * Calculate overall risk assessment
   */
  calculateOverallRisk(results) {
    const allFindings = [
      ...results.findings.misconfigurations,
      ...results.findings.permissions,
      ...results.findings.secrets,
      ...results.findings.compliance,
      ...results.findings.vulnerabilities
    ];
    
    const criticalCount = allFindings.filter(f => f.severity === 'critical').length;
    const highCount = allFindings.filter(f => f.severity === 'high').length;
    
    // Overall risk calculation
    if (criticalCount > 0) {
      results.riskAssessment.overall = 'critical';
    } else if (highCount > 2) {
      results.riskAssessment.overall = 'high';
    } else if (allFindings.length > 3) {
      results.riskAssessment.overall = 'medium';
    } else {
      results.riskAssessment.overall = 'low';
    }
    
    // Category-specific risk
    results.riskAssessment.categories.access = this.calculateCategoryRisk(
      results.findings.permissions
    );
    results.riskAssessment.categories.encryption = this.calculateCategoryRisk(
      results.findings.misconfigurations.filter(f => f.category === 'encryption')
    );
    results.riskAssessment.categories.secrets = this.calculateCategoryRisk(
      results.findings.secrets
    );
    results.riskAssessment.categories.logging = this.calculateCategoryRisk(
      results.findings.misconfigurations.filter(f => f.category === 'logging')
    );
  }
  
  /**
   * Calculate risk for specific category
   */
  calculateCategoryRisk(findings) {
    if (!findings || findings.length === 0) return 'low';
    
    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const highCount = findings.filter(f => f.severity === 'high').length;
    
    if (criticalCount > 0) return 'critical';
    if (highCount > 0) return 'high';
    if (findings.length > 1) return 'medium';
    return 'low';
  }
  
  /**
   * Initialize conversational AI for scan results
   */
  async initializeConversationForScan(scanResults) {
    try {
      const conversationData = await this.conversationAI.startConversation(scanResults);
      
      return {
        sessionId: conversationData.sessionId,
        overview: conversationData.message,
        quickActions: conversationData.quickActions || [],
        suggestedQuestions: conversationData.suggestedQuestions || [],
        canChat: true,
        chatEndpoint: `/api/s3-scanner/chat/${conversationData.sessionId}`
      };
      
    } catch (error) {
      console.warn('Failed to initialize conversation AI:', error.message);
      return {
        canChat: false,
        error: 'Conversational AI unavailable',
        fallbackMessage: 'S3 security scan completed. Review the findings above for security recommendations.'
      };
    }
  }
  
  /**
   * Chat about scan results - main conversation interface
   */
  async chatAboutResults(userMessage, options = {}) {
    console.log(`S3 Scanner Chat: ${userMessage.substring(0, 60)}...`);
    
    try {
      const response = await this.conversationAI.chat(userMessage, options);
      
      // Enhance response with S3-specific context
      return {
        ...response,
        scannerType: 's3-bucket-scanner',
        bucketName: this.currentScanResults?.bucketName,
        canProvideS3Commands: true,
        awsCliSuggestions: this.generateAWSCliSuggestions(userMessage, response)
      };
      
    } catch (error) {
      console.error('S3 chat failed:', error.message);
      return {
        message: 'I apologize for the technical difficulty. Could you rephrase your question about the S3 security findings?',
        type: 'error_response',
        timestamp: new Date().toISOString(),
        isError: true
      };
    }
  }
  
  /**
   * Generate AWS CLI suggestions based on conversation
   */
  generateAWSCliSuggestions(userMessage, aiResponse) {
    const suggestions = [];
    const message = userMessage.toLowerCase();
    const bucketName = this.currentScanResults?.bucketName || 'your-bucket-name';
    
    if (message.includes('encrypt') || aiResponse.message.toLowerCase().includes('encrypt')) {
      suggestions.push({
        command: `aws s3api put-bucket-encryption --bucket ${bucketName} --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'`,
        description: 'Enable S3 bucket encryption'
      });
    }
    
    if (message.includes('public') || message.includes('access')) {
      suggestions.push({
        command: `aws s3api put-public-access-block --bucket ${bucketName} --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"`,
        description: 'Block all public access to bucket'
      });
    }
    
    if (message.includes('version') || message.includes('backup')) {
      suggestions.push({
        command: `aws s3api put-bucket-versioning --bucket ${bucketName} --versioning-configuration Status=Enabled`,
        description: 'Enable bucket versioning for data protection'
      });
    }
    
    if (message.includes('log')) {
      suggestions.push({
        command: `aws s3api put-bucket-logging --bucket ${bucketName} --bucket-logging-status file://logging.json`,
        description: 'Enable access logging (requires logging configuration file)'
      });
    }
    
    return suggestions;
  }
  
  /**
   * Get conversation export for reports
   */
  exportConversation() {
    return this.conversationAI.exportConversation();
  }
  
  /**
   * Clear conversation session
   */
  clearConversation() {
    this.conversationAI.clearConversation();
  }
  
  /**
   * Health check for S3 scanner
   */
  async getHealth() {
    const conversationHealth = await this.conversationAI.getHealth();
    
    return {
      status: 'healthy',
      service: 'S3 Bucket Scanner with Conversational AI',
      capabilities: [
        'Real AWS S3 API Integration',
        'Bucket Configuration Analysis',
        'Permission Auditing',
        'Content Pattern Scanning',
        'TruffleHog Secret Detection',
        'Compliance Checking (GDPR, PCI-DSS)',
        'AI Risk Assessment',
        'Interactive Security Conversations',
        'Remediation Guidance and Best Practices'
      ],
      conversationAI: conversationHealth,
      requirements: [
        'AWS credentials (Access Key + Secret)',
        'S3 read permissions for target bucket',
        'HuggingFace API key for conversational AI',
        'Optional: TruffleHog for advanced secret detection'
      ]
    };
  }
}

module.exports = S3BucketScanner;