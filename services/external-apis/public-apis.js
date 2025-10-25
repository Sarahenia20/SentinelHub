/**
 * FREE Public APIs Integration
 * NO API KEYS REQUIRED! All free tier or completely open
 */

const axios = require('axios');

/**
 * Have I Been Pwned - Check if emails/passwords are compromised
 * FREE API - No key needed for basic breach check
 */
async function checkDataBreach(email) {
  try {
    const response = await axios.get(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`, {
      headers: {
        'User-Agent': 'SentinelHub-Security-Scanner'
      }
    });

    return {
      isBreached: true,
      breaches: response.data.map(breach => ({
        name: breach.Name,
        title: breach.Title,
        domain: breach.Domain,
        date: breach.BreachDate,
        count: breach.PwnCount,
        dataClasses: breach.DataClasses
      }))
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return { isBreached: false, breaches: [] };
    }
    throw error;
  }
}

/**
 * IPapi.co - IP Geolocation and Security Info
 * COMPLETELY FREE - No API key needed
 */
async function getIPInfo(ip) {
  try {
    const response = await axios.get(`https://ipapi.co/${ip}/json/`);
    return {
      ip: response.data.ip,
      city: response.data.city,
      region: response.data.region,
      country: response.data.country_name,
      countryCode: response.data.country_code,
      timezone: response.data.timezone,
      asn: response.data.asn,
      org: response.data.org,
      isVpn: response.data.asn?.includes('VPN'),
      isTor: response.data.asn?.includes('TOR'),
      threat: response.data.threat || 'low'
    };
  } catch (error) {
    console.error('IPapi error:', error.message);
    return null;
  }
}

/**
 * URLScan.io - URL Security Scanning
 * FREE - No API key for public scans
 */
async function scanURL(url) {
  try {
    // Submit for scanning
    const submitResponse = await axios.post('https://urlscan.io/api/v1/scan/', {
      url: url,
      visibility: 'public'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const uuid = submitResponse.data.uuid;

    // Wait 10 seconds for scan to complete
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Get results
    const resultResponse = await axios.get(`https://urlscan.io/api/v1/result/${uuid}/`);

    return {
      url: resultResponse.data.page.url,
      domain: resultResponse.data.page.domain,
      ip: resultResponse.data.page.ip,
      country: resultResponse.data.page.country,
      server: resultResponse.data.page.server,
      malicious: resultResponse.data.verdicts?.overall?.malicious || false,
      score: resultResponse.data.verdicts?.overall?.score || 0,
      categories: resultResponse.data.verdicts?.overall?.categories || [],
      threats: resultResponse.data.lists?.ips || [],
      scanUrl: `https://urlscan.io/result/${uuid}/`
    };
  } catch (error) {
    console.error('URLScan error:', error.message);
    return null;
  }
}

/**
 * DNS over HTTPS (Cloudflare) - DNS Security Check
 * COMPLETELY FREE
 */
async function checkDNSSecurity(domain) {
  try {
    const response = await axios.get(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
      headers: {
        'Accept': 'application/dns-json'
      }
    });

    return {
      domain: domain,
      records: response.data.Answer || [],
      isDnsSecEnabled: response.data.AD || false,
      status: response.data.Status === 0 ? 'success' : 'failed'
    };
  } catch (error) {
    console.error('DNS check error:', error.message);
    return null;
  }
}

/**
 * SSL Labs API - SSL/TLS Security Assessment
 * FREE - Rate limited but no key needed
 */
async function checkSSL(hostname) {
  try {
    // Start assessment
    await axios.get('https://api.ssllabs.com/api/v3/analyze', {
      params: {
        host: hostname,
        startNew: 'on',
        all: 'done'
      }
    });

    // Wait for completion (simplified - in production use polling)
    await new Promise(resolve => setTimeout(resolve, 60000));

    // Get results
    const response = await axios.get('https://api.ssllabs.com/api/v3/analyze', {
      params: {
        host: hostname,
        all: 'done'
      }
    });

    const endpoint = response.data.endpoints[0];

    return {
      host: hostname,
      grade: endpoint.grade,
      hasWarnings: endpoint.hasWarnings,
      isExceptional: endpoint.isExceptional,
      progress: response.data.status,
      protocols: endpoint.details?.protocols || [],
      vulnerabilities: {
        heartbleed: endpoint.details?.heartbleed,
        poodle: endpoint.details?.poodle,
        freak: endpoint.details?.freak,
        logjam: endpoint.details?.logjam
      }
    };
  } catch (error) {
    console.error('SSL Labs error:', error.message);
    return null;
  }
}

/**
 * GitHub Advisory Database - Security Vulnerabilities
 * FREE - No authentication needed for public access
 */
async function searchAdvisories(query) {
  try {
    const response = await axios.get(`https://api.github.com/advisories`, {
      params: {
        affects: query,
        per_page: 20
      },
      headers: {
        'Accept': 'application/vnd.github+json'
      }
    });

    return response.data.map(advisory => ({
      id: advisory.ghsa_id,
      summary: advisory.summary,
      description: advisory.description,
      severity: advisory.severity,
      cvss: advisory.cvss?.score,
      published: advisory.published_at,
      updated: advisory.updated_at,
      affectedPackages: advisory.vulnerabilities?.map(v => v.package?.name) || []
    }));
  } catch (error) {
    console.error('GitHub Advisory error:', error.message);
    return [];
  }
}

/**
 * CRT.sh - Certificate Transparency Logs
 * COMPLETELY FREE - Find all SSL certs for a domain
 */
async function getCertificates(domain) {
  try {
    const response = await axios.get(`https://crt.sh/?q=%.${domain}&output=json`);

    return response.data.map(cert => ({
      id: cert.id,
      issuer: cert.issuer_name,
      commonName: cert.common_name,
      notBefore: cert.not_before,
      notAfter: cert.not_after,
      serialNumber: cert.serial_number
    }));
  } catch (error) {
    console.error('CRT.sh error:', error.message);
    return [];
  }
}

/**
 * Censys Search - Internet-wide security data
 * FREE tier available - 250 queries/month
 */
async function censysSearch(query, apiId, apiSecret) {
  if (!apiId || !apiSecret) {
    console.warn('Censys API credentials not configured');
    return null;
  }

  try {
    const response = await axios.get('https://search.censys.io/api/v2/hosts/search', {
      params: { q: query },
      auth: {
        username: apiId,
        password: apiSecret
      }
    });

    return response.data.result.hits;
  } catch (error) {
    console.error('Censys error:', error.message);
    return null;
  }
}

/**
 * Hunter.io - Email Verification
 * FREE tier: 25 searches/month
 */
async function verifyEmail(email, apiKey) {
  if (!apiKey) {
    console.warn('Hunter.io API key not configured');
    return null;
  }

  try {
    const response = await axios.get('https://api.hunter.io/v2/email-verifier', {
      params: {
        email: email,
        api_key: apiKey
      }
    });

    return {
      email: response.data.data.email,
      status: response.data.data.status,
      score: response.data.data.score,
      result: response.data.data.result,
      isAcceptAll: response.data.data.accept_all,
      isDisposable: response.data.data.disposable,
      isWebmail: response.data.data.webmail
    };
  } catch (error) {
    console.error('Hunter.io error:', error.message);
    return null;
  }
}

/**
 * AlienVault OTX - Open Threat Exchange
 * FREE - Requires API key (signup at https://otx.alienvault.com)
 * Provides threat intelligence for IPs, domains, URLs, file hashes
 */
async function getAlienVaultThreatIntel(ip, apiKey) {
  if (!apiKey) {
    console.warn('AlienVault OTX API key not configured');
    return null;
  }

  try {
    // Get general threat intelligence for IP
    const response = await axios.get(`https://otx.alienvault.com/api/v1/indicators/IPv4/${ip}/general`, {
      headers: {
        'X-OTX-API-KEY': apiKey
      },
      timeout: 10000
    });

    const data = response.data;

    return {
      ip: ip,
      reputation: data.reputation || 0,
      pulseCount: data.pulse_info?.count || 0,
      pulses: (data.pulse_info?.pulses || []).slice(0, 5).map(pulse => ({
        name: pulse.name,
        description: pulse.description,
        created: pulse.created,
        tags: pulse.tags,
        adversary: pulse.adversary
      })),
      validation: data.validation || [],
      countryCode: data.country_code,
      asn: data.asn,
      isMalicious: data.pulse_info?.count > 0 || data.reputation < 0
    };
  } catch (error) {
    if (error.response?.status === 404) {
      // IP not in database - likely clean
      return {
        ip: ip,
        reputation: 0,
        pulseCount: 0,
        pulses: [],
        isMalicious: false,
        clean: true
      };
    }
    console.error('AlienVault OTX error:', error.message);
    return null;
  }
}

/**
 * IPQualityScore - IP Reputation & Fraud Detection
 * FREE tier: 5,000 lookups/month
 * Signup at https://www.ipqualityscore.com/create-account
 */
async function getIPQualityScore(ip, apiKey) {
  if (!apiKey) {
    console.warn('IPQualityScore API key not configured');
    return null;
  }

  try {
    const response = await axios.get(`https://ipqualityscore.com/api/json/ip/${apiKey}/${ip}`, {
      params: {
        strictness: 0, // 0 = least strict, 3 = most strict
        allow_public_access_points: true,
        lighter_penalties: true
      },
      timeout: 10000
    });

    const data = response.data;

    return {
      ip: ip,
      fraudScore: data.fraud_score, // 0-100 (higher = more suspicious)
      countryCode: data.country_code,
      city: data.city,
      isp: data.ISP,
      isProxy: data.proxy,
      isVpn: data.vpn,
      isTor: data.tor,
      isBot: data.bot_status,
      isRecentAbuse: data.recent_abuse,
      isActiveVpn: data.active_vpn,
      isActiveTor: data.active_tor,
      connectionType: data.connection_type,
      abuseVelocity: data.abuse_velocity,
      timezone: data.timezone,
      isCrawler: data.is_crawler,
      threatLevel: data.fraud_score >= 75 ? 'high' : data.fraud_score >= 50 ? 'medium' : 'low',
      recommendation: data.fraud_score >= 75 ? 'Block - High fraud risk' :
                      data.fraud_score >= 50 ? 'Review - Medium risk' :
                      'Allow - Low risk'
    };
  } catch (error) {
    console.error('IPQualityScore error:', error.message);
    return null;
  }
}

module.exports = {
  checkDataBreach,
  getIPInfo,
  scanURL,
  checkDNSSecurity,
  checkSSL,
  searchAdvisories,
  getCertificates,
  censysSearch,
  verifyEmail,
  getAlienVaultThreatIntel,
  getIPQualityScore
};
