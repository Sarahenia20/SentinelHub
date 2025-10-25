/**
 * Security Intelligence Service
 * Enriches scan reports with external threat intelligence using FREE APIs
 * No API keys needed for most services!
 */

const publicApis = require('../external-apis/public-apis');
const axios = require('axios');

/**
 * Get comprehensive security intelligence for a scan
 */
async function getSecurityIntelligence(scanResults) {
  console.log('🔍 Gathering security intelligence...');

  const intelligence = {
    breachData: [],
    cveMatches: [],
    threatIndicators: [],
    recommendations: [],
    externalContext: {}
  };

  try {
    // Run intelligence gathering in parallel
    const [breaches, cves, threats] = await Promise.all([
      checkForBreachedSecrets(scanResults),
      lookupCVEs(scanResults),
      analyzeThreatIndicators(scanResults)
    ]);

    intelligence.breachData = breaches;
    intelligence.cveMatches = cves;
    intelligence.threatIndicators = threats;
    intelligence.recommendations = generateIntelligenceRecommendations(breaches, cves, threats);
    intelligence.externalContext = await getExternalContext(scanResults);

    console.log(`✅ Intelligence gathered: ${breaches.length} breaches, ${cves.length} CVEs, ${threats.length} threats`);

  } catch (error) {
    console.error('Security intelligence gathering failed:', error.message);
  }

  return intelligence;
}

/**
 * Check if any exposed secrets are in breach databases
 */
async function checkForBreachedSecrets(scanResults) {
  const breaches = [];

  // Handle both data structures: scanResults.results.secrets and scanResults.secrets
  const secrets = scanResults.results?.secrets || scanResults.secrets || [];

  if (secrets.length === 0) {
    return breaches;
  }

  console.log('   🔐 Checking for breached credentials...');

  // Extract emails from secrets
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = new Set();

  secrets.forEach(secret => {
    const secretText = secret.message || secret.match || '';
    const foundEmails = secretText.match(emailRegex);
    if (foundEmails) {
      foundEmails.forEach(email => emails.add(email.toLowerCase()));
    }
  });

  // Check each unique email (limit to first 5 to avoid rate limits)
  const emailsToCheck = Array.from(emails).slice(0, 5);

  for (const email of emailsToCheck) {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Rate limit: 1 request per 1.5s
      const breachResult = await publicApis.checkDataBreach(email);

      if (breachResult.isBreached) {
        breaches.push({
          email,
          breachCount: breachResult.breaches.length,
          breaches: breachResult.breaches.map(b => ({
            name: b.name,
            date: b.date,
            dataClasses: b.dataClasses
          })),
          severity: 'critical',
          recommendation: `Email ${email} found in ${breachResult.breaches.length} data breach(es). Rotate credentials immediately.`
        });
      }
    } catch (error) {
      console.warn(`   ⚠️ Could not check ${email}:`, error.message);
    }
  }

  return breaches;
}

/**
 * Lookup CVEs related to vulnerabilities found
 */
async function lookupCVEs(scanResults) {
  const cveMatches = [];

  // Handle both data structures: scanResults.results.vulnerabilities and scanResults.vulnerabilities
  const vulnerabilities = scanResults.results?.vulnerabilities || scanResults.vulnerabilities || [];

  if (vulnerabilities.length === 0) {
    return cveMatches;
  }

  console.log('   🔍 Looking up CVE database...');

  // Extract technology/package names from vulnerabilities
  const technologies = new Set();

  vulnerabilities.forEach(vuln => {
    const vulnText = (vuln.message || vuln.type || '').toLowerCase();

    // Common technology indicators
    const techPatterns = [
      /node[.\s]?js/i,
      /react/i,
      /express/i,
      /mongodb/i,
      /mysql/i,
      /postgres/i,
      /redis/i,
      /docker/i,
      /kubernetes/i,
      /nginx/i,
      /apache/i,
      /spring/i,
      /django/i,
      /flask/i,
      /laravel/i
    ];

    techPatterns.forEach(pattern => {
      const match = vulnText.match(pattern);
      if (match) {
        technologies.add(match[0].toLowerCase());
      }
    });
  });

  // Query GitHub Advisory Database for each technology
  const techArray = Array.from(technologies).slice(0, 3); // Limit to 3 to avoid rate limits

  for (const tech of techArray) {
    try {
      const advisories = await publicApis.searchAdvisories(tech);

      advisories.slice(0, 5).forEach(advisory => {
        cveMatches.push({
          technology: tech,
          cveId: advisory.id,
          summary: advisory.summary,
          severity: advisory.severity,
          cvss: advisory.cvss,
          published: advisory.published,
          affectedPackages: advisory.affectedPackages,
          recommendation: `Update ${tech} packages to patched versions`
        });
      });
    } catch (error) {
      console.warn(`   ⚠️ Could not lookup CVEs for ${tech}:`, error.message);
    }
  }

  return cveMatches;
}

/**
 * Analyze threat indicators (IPs, domains) found in code
 */
async function analyzeThreatIndicators(scanResults) {
  const threats = [];

  console.log('   🌐 Analyzing threat indicators...');

  // Extract IPs and domains from code/secrets
  const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  const domainRegex = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/gi;

  const ips = new Set();
  const domains = new Set();

  // Handle both data structures
  const secrets = scanResults.results?.secrets || scanResults.secrets || [];
  const vulnerabilities = scanResults.results?.vulnerabilities || scanResults.vulnerabilities || [];

  const allContent = [
    ...secrets,
    ...vulnerabilities
  ];

  allContent.forEach(item => {
    const text = item.message || item.match || item.code || '';

    // Find IPs
    const foundIps = text.match(ipRegex);
    if (foundIps) {
      foundIps.forEach(ip => {
        // Skip private IPs
        if (!ip.startsWith('192.168.') && !ip.startsWith('10.') && !ip.startsWith('127.')) {
          ips.add(ip);
        }
      });
    }

    // Find domains
    const foundDomains = text.match(domainRegex);
    if (foundDomains) {
      foundDomains.forEach(domain => {
        const lowerDomain = domain.toLowerCase();
        // Skip common/safe domains
        if (!lowerDomain.includes('localhost') &&
            !lowerDomain.includes('example.com') &&
            !lowerDomain.endsWith('.local')) {
          domains.add(lowerDomain);
        }
      });
    }
  });

  // Check IPs with MULTIPLE sources (limit to first 2 IPs to avoid rate limits)
  const ipsToCheck = Array.from(ips).slice(0, 2);

  for (const ip of ipsToCheck) {
    try {
      // Run all IP checks in parallel for efficiency
      const [ipInfo, alienVault, ipQuality] = await Promise.all([
        publicApis.getIPInfo(ip),
        publicApis.getAlienVaultThreatIntel(ip, process.env.ALIENVAULT_API_KEY),
        publicApis.getIPQualityScore(ip, process.env.IPQS_API_KEY)
      ]);

      // Aggregate data from all sources
      const aggregatedThreat = {
        type: 'ip-address',
        value: ip,
        location: ipInfo ? `${ipInfo.city}, ${ipInfo.country}` : 'Unknown',
        org: ipInfo?.org,
        asn: ipInfo?.asn,

        // Basic checks (IPapi)
        isVpn: ipInfo?.isVpn || ipQuality?.isVpn || false,
        isTor: ipInfo?.isTor || ipQuality?.isTor || false,

        // AlienVault threat intelligence
        alienVault: alienVault ? {
          reputation: alienVault.reputation,
          pulseCount: alienVault.pulseCount,
          isMalicious: alienVault.isMalicious,
          pulses: alienVault.pulses.slice(0, 3) // Top 3 threat pulses
        } : null,

        // IPQualityScore fraud detection
        ipQuality: ipQuality ? {
          fraudScore: ipQuality.fraudScore,
          threatLevel: ipQuality.threatLevel,
          isProxy: ipQuality.isProxy,
          isBot: ipQuality.isBot,
          isRecentAbuse: ipQuality.isRecentAbuse,
          recommendation: ipQuality.recommendation
        } : null,

        // Overall severity (highest from any source)
        severity: determineIPSeverity(alienVault, ipQuality, ipInfo),

        // Combined recommendation
        recommendation: generateIPRecommendation(ip, alienVault, ipQuality, ipInfo)
      };

      threats.push(aggregatedThreat);

    } catch (error) {
      console.warn(`   ⚠️ Could not check IP ${ip}:`, error.message);
    }
  }

  // Check domains for certificates (limit to first 2)
  const domainsToCheck = Array.from(domains).slice(0, 2);

  for (const domain of domainsToCheck) {
    try {
      const certs = await publicApis.getCertificates(domain);

      if (certs && certs.length > 0) {
        const activeCerts = certs.filter(cert => new Date(cert.notAfter) > new Date());

        threats.push({
          type: 'domain',
          value: domain,
          certificates: activeCerts.length,
          latestCert: activeCerts[0],
          severity: activeCerts.length === 0 ? 'medium' : 'info',
          recommendation: activeCerts.length === 0 ?
            'Domain has no active certificates - possible expired SSL' :
            `Domain has ${activeCerts.length} active certificate(s)`
        });
      }
    } catch (error) {
      console.warn(`   ⚠️ Could not check domain ${domain}:`, error.message);
    }
  }

  return threats;
}

/**
 * Determine overall IP severity from multiple sources
 */
function determineIPSeverity(alienVault, ipQuality, ipInfo) {
  // AlienVault: If flagged as malicious, it's critical
  if (alienVault?.isMalicious && alienVault.pulseCount > 5) return 'critical';
  if (alienVault?.isMalicious) return 'high';

  // IPQualityScore: High fraud score = high severity
  if (ipQuality?.fraudScore >= 75) return 'high';
  if (ipQuality?.fraudScore >= 50) return 'medium';

  // VPN/Tor detection
  if (ipQuality?.isProxy || ipQuality?.isTor || ipInfo?.isTor) return 'medium';

  return 'low';
}

/**
 * Generate comprehensive IP recommendation
 */
function generateIPRecommendation(ip, alienVault, ipQuality, ipInfo) {
  const issues = [];

  if (alienVault?.isMalicious) {
    issues.push(`⚠️ IP flagged by AlienVault with ${alienVault.pulseCount} threat indicators`);
    if (alienVault.pulses.length > 0) {
      issues.push(`Recent threats: ${alienVault.pulses.map(p => p.name).join(', ')}`);
    }
  }

  if (ipQuality?.fraudScore >= 75) {
    issues.push(`🚨 High fraud score (${ipQuality.fraudScore}/100) - ${ipQuality.recommendation}`);
  } else if (ipQuality?.fraudScore >= 50) {
    issues.push(`⚠️ Medium fraud score (${ipQuality.fraudScore}/100) - ${ipQuality.recommendation}`);
  }

  if (ipQuality?.isProxy || ipQuality?.isVpn) {
    issues.push('🔒 IP is a proxy/VPN - may indicate anonymization');
  }

  if (ipQuality?.isTor) {
    issues.push('🧅 IP is a Tor exit node - high anonymity risk');
  }

  if (ipQuality?.isBot) {
    issues.push('🤖 Automated bot activity detected');
  }

  if (ipQuality?.isRecentAbuse) {
    issues.push('📛 Recent abuse detected from this IP');
  }

  if (issues.length === 0) {
    return `✅ IP appears clean - no threats detected from ${[alienVault ? 'AlienVault' : null, ipQuality ? 'IPQS' : null].filter(Boolean).join(', ') || 'basic checks'}`;
  }

  return issues.join('\n');
}

/**
 * Get external context (recent security news, trends)
 */
async function getExternalContext(scanResults) {
  const context = {
    recentCVEs: [],
    industryTrends: [],
    emergingThreats: []
  };

  try {
    // Get recent high-severity CVEs from GitHub Advisory
    const recentAdvisories = await publicApis.searchAdvisories('vulnerability');

    context.recentCVEs = recentAdvisories
      .filter(adv => adv.severity === 'high' || adv.severity === 'critical')
      .slice(0, 5)
      .map(adv => ({
        id: adv.id,
        summary: adv.summary,
        severity: adv.severity,
        published: adv.published
      }));

  } catch (error) {
    console.warn('Could not fetch external context:', error.message);
  }

  return context;
}

/**
 * Generate recommendations based on intelligence
 */
function generateIntelligenceRecommendations(breaches, cves, threats) {
  const recommendations = [];

  // Breach recommendations
  if (breaches.length > 0) {
    recommendations.push({
      priority: 'critical',
      category: 'Data Breaches',
      action: `${breaches.length} email(s) found in data breaches - rotate all credentials immediately`,
      details: breaches.map(b => `${b.email}: ${b.breachCount} breach(es)`)
    });
  }

  // CVE recommendations
  if (cves.length > 0) {
    const criticalCVEs = cves.filter(c => c.severity === 'critical' || c.severity === 'high');
    if (criticalCVEs.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Known Vulnerabilities',
        action: `${criticalCVEs.length} critical/high CVEs affect your technology stack`,
        details: criticalCVEs.map(c => `${c.technology}: ${c.cveId}`)
      });
    }
  }

  // Threat indicator recommendations
  const highThreats = threats.filter(t => t.severity === 'high' || t.severity === 'critical');
  if (highThreats.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'Threat Indicators',
      action: `${highThreats.length} high-risk indicator(s) detected`,
      details: highThreats.map(t => `${t.type}: ${t.value}`)
    });
  }

  return recommendations;
}

/**
 * Get security intelligence summary for dashboard
 */
function getIntelligenceSummary(intelligence) {
  return {
    totalThreats: intelligence.breachData.length + intelligence.threatIndicators.length,
    criticalIssues: intelligence.breachData.length,
    cveMatches: intelligence.cveMatches.length,
    recommendations: intelligence.recommendations.length,
    status: intelligence.breachData.length > 0 ? 'critical' :
            intelligence.cveMatches.length > 0 ? 'warning' : 'good'
  };
}

module.exports = {
  getSecurityIntelligence,
  getIntelligenceSummary
};
