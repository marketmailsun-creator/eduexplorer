/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Required for Next.js 16 with Turbopack
  turbopack: {},
  
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.elevenlabs.io',
      },
    ],
  },

  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.elevenlabs.io',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
    // Don't fail on image load errors
    dangerouslyAllowSVG: true,
    unoptimized: false,
  },
  // Headers for PWA
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;