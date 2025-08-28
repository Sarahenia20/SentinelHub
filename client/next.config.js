/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; img-src 'self' https://api.dicebear.com https://images.clerk.dev https://img.clerk.com; sandbox;",
  },
  
  // Experimental flags for Next.js 15 + Clerk compatibility
  experimental: {
    // Suppress dynamic API warnings from Clerk until they update for Next.js 15
    cacheComponents: false,
  },
  
  // Logging configuration to reduce noise from Clerk's headers() usage
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

module.exports = nextConfig;