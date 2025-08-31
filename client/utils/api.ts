const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const CHAT_API_URL = process.env.NEXT_PUBLIC_CHAT_URL || 'http://localhost:4000';
const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN;

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string;
  updated_at: string;
  language: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  default_branch: string;
}

export interface DockerImage {
  name: string;
  full_name: string;
  description: string;
  star_count: number;
  pull_count: number;
  last_updated: string;
  is_private: boolean;
  repository_type: string;
}

export interface S3Bucket {
  Name: string;
  CreationDate: string;
}

export interface PasteScanRequest {
  code: string;
  language: string;
  options?: {
    enableAllChecks?: boolean;
    userAgent?: string;
    ipAddress?: string;
  };
}

export interface ChatMessage {
  message: string;
  sessionId?: string;
  options?: {
    maxTokens?: number;
    temperature?: number;
  };
}

export interface ChatResponse {
  message: string;
  type: string;
  timestamp: string;
  sessionId: string;
  actionableSteps?: string[];
  followUpQuestions?: string[];
}

export interface PasteScanResult {
  success: boolean;
  timestamp: string;
  scanId: string;
  summary: {
    language: string;
    totalIssues: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    securityScore: number;
    status: 'pass' | 'warning' | 'fail';
    recommendation: string;
  };
  findings: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    topIssues: Array<{
      type: string;
      severity: string;
      message: string;
      line: number;
      recommendation: string;
    }>;
  };
  security: {
    vulnerabilities: Array<{
      id: string;
      type: string;
      severity: string;
      message: string;
      line: number;
      column: number;
      source: string;
      recommendation: string;
      cwe?: string;
      owasp?: string;
    }>;
    secrets: Array<{
      type: string;
      severity: string;
      line: number;
      maskedValue: string;
      confidence: number;
      recommendation: string;
    }>;
    codeQuality: Array<{
      rule: string;
      message: string;
      severity: string;
      line: number;
      category: string;
    }>;
  };
  intelligence: {
    cveMatches: Array<{
      id: string;
      summary: string;
      cvssScore: number;
      severity: string;
      published: string;
      url: string;
    }>;
    advisories: Array<{
      id: string;
      title: string;
      severity: string;
      affectedPackages: string[];
      url: string;
    }>;
  };
  metrics: {
    scanDuration: number;
    linesOfCode: number;
    toolsUsed: string[];
    severityDistribution: Record<string, number>;
    categoryDistribution: Record<string, number>;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    preventive: string[];
  };
  nextSteps: Array<{
    priority: number;
    action: string;
    timeframe: string;
  }>;
}

export interface PasteScanHealth {
  success: boolean;
  service: string;
  status: string;
  timestamp: string;
  version: string;
  tools: Record<string, any>;
  capabilities: string[];
}

class ApiService {
  private baseUrl: string;
  private githubToken: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.githubToken = GITHUB_TOKEN || '';
  }

  private async getAuthToken() {
    try {
      if (typeof window !== 'undefined') {
        const { getToken } = await import('@clerk/nextjs');
        return await getToken();
      }
    } catch (error) {
      console.warn('Could not get Clerk token:', error);
    }
    return null;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}, authToken?: string) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = authToken || await this.getAuthToken();
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'github-token': this.githubToken,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async getRepositories(authToken?: string): Promise<GitHubRepository[]> {
    const response = await this.fetchWithAuth('/api/github/repositories', {}, authToken);
    return response.data || [];
  }

  async scanRepository(owner: string, repo: string, authToken?: string) {
    return await this.fetchWithAuth('/api/scan/repository', {
      method: 'POST',
      body: JSON.stringify({ owner, repo }),
    }, authToken);
  }

  async scanGitHubRepository(owner: string, repo: string, options: { enableCodeRabbit?: boolean } = {}, authToken?: string) {
    return await this.fetchWithAuth(`/api/github/scan/${owner}/${repo}`, {
      method: 'POST',
      body: JSON.stringify(options),
    }, authToken);
  }

  async getGitHubScannerHealth(authToken?: string) {
    return await this.fetchWithAuth('/api/github/scanner/health', {
      method: 'GET',
    }, authToken);
  }

  async testGitHubConnection(authToken?: string): Promise<boolean> {
    try {
      await this.getRepositories(authToken);
      return true;
    } catch (error) {
      console.error('GitHub connection test failed:', error);
      return false;
    }
  }

  // AWS API methods
  async testAWSConnection(accessKey: string, secretKey: string, region: string, authToken?: string): Promise<boolean> {
    try {
      const response = await this.fetchWithAuth('/api/aws/test-connection', {
        method: 'POST',
        body: JSON.stringify({ accessKey, secretKey, region }),
      }, authToken);
      return response.success;
    } catch (error) {
      console.error('AWS connection test failed:', error);
      return false;
    }
  }

  async getS3Buckets(accessKey: string, secretKey: string, region: string, authToken?: string): Promise<S3Bucket[]> {
    const response = await this.fetchWithAuth('/api/aws/buckets', {
      method: 'POST',
      body: JSON.stringify({ accessKey, secretKey, region }),
    }, authToken);
    return response.data || [];
  }

  async scanS3Bucket(bucketName: string, accessKey: string, secretKey: string, region: string, authToken?: string) {
    return await this.fetchWithAuth('/api/aws/scan-bucket', {
      method: 'POST',
      body: JSON.stringify({ bucketName, accessKey, secretKey, region }),
    }, authToken);
  }

  // Docker API methods
  async testDockerConnection(username: string, token: string, authToken?: string): Promise<boolean> {
    try {
      const response = await this.fetchWithAuth('/api/docker/test-connection', {
        method: 'POST',
        body: JSON.stringify({ username, token }),
      }, authToken);
      return response.success;
    } catch (error) {
      console.error('Docker connection test failed:', error);
      return false;
    }
  }

  async runDockerBenchSecurity(authToken?: string) {
    try {
      const response = await this.fetchWithAuth('/api/docker-bench/security-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }, authToken);
      
      // Handle different response types
      if (response && typeof response.json === 'function') {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Docker security scan failed');
        }
        return result;
      } else {
        // Fallback for non-standard response objects
        return response;
      }
    } catch (error) {
      console.error('Docker Bench Security scan failed:', error);
      // Just return null to trigger fallback in frontend
      return null;
    }
  }

  async getDockerImages(username: string, token: string, authToken?: string) {
    const response = await this.fetchWithAuth('/api/docker/images', {
      method: 'POST',
      body: JSON.stringify({ username, token }),
    }, authToken);
    return response.data || [];
  }

  // Paste Scanner API methods
  async scanPastedCode(request: PasteScanRequest): Promise<PasteScanResult> {
    const response = await this.fetchWithAuth('/api/paste/scan', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response;
  }

  async getPasteScannerHealth(): Promise<PasteScanHealth> {
    const response = await this.fetchWithAuth('/api/paste/health', {
      method: 'GET',
    });
    return response;
  }

  async getPasteScannerStats() {
    const response = await this.fetchWithAuth('/api/paste/stats', {
      method: 'GET',
    });
    return response;
  }

  async runPasteScannerTest() {
    const response = await this.fetchWithAuth('/api/paste/test', {
      method: 'POST',
    });
    return response;
  }

  async getPasteScannerReport(scanId: string) {
    const response = await this.fetchWithAuth(`/api/paste/report/${scanId}`, {
      method: 'GET',
    });
    return response;
  }

  // Reports API methods
  async saveReport(scanResult: any, options?: { title?: string; description?: string; tags?: string[] }) {
    const response = await this.fetchWithAuth('/api/reports', {
      method: 'POST',
      body: JSON.stringify({
        scanResult,
        ...options
      }),
    });
    return response;
  }

  async getReports(params?: { 
    type?: string; 
    category?: string; 
    tags?: string; 
    limit?: number; 
    offset?: number; 
    sortBy?: string; 
    sortOrder?: string; 
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await this.fetchWithAuth(`/api/reports?${queryParams.toString()}`, {
      method: 'GET',
    });
    return response;
  }

  async getReport(reportId: string) {
    const response = await this.fetchWithAuth(`/api/reports/${reportId}`, {
      method: 'GET',
    });
    return response;
  }

  async deleteReport(reportId: string) {
    const response = await this.fetchWithAuth(`/api/reports/${reportId}`, {
      method: 'DELETE',
    });
    return response;
  }

  async getReportAnalytics() {
    const response = await this.fetchWithAuth('/api/reports/analytics/overview', {
      method: 'GET',
    });
    return response;
  }

  async generateBackgroundReport(scanType: string, scanParams: any, reportOptions?: any) {
    const response = await this.fetchWithAuth('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify({
        scanType,
        scanParams,
        reportOptions
      }),
    });
    return response;
  }

  async chatWithAI(message: ChatMessage): Promise<ChatResponse> {
    // Use separate chat service to prevent API Gateway crashes
    const url = `${CHAT_API_URL}/api/chat/message`;
    const token = await this.getAuthToken();
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'github-token': this.githubToken,
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Chat API Request failed:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();