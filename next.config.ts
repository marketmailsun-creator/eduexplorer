import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // For Docker production builds
  
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

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};

export default nextConfig;