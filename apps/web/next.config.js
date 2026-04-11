const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output: creates a self-contained .next/standalone folder
  // that includes only the necessary files + traced node_modules.
  // This produces very small, fast Docker images.
  output: 'standalone',

  // Tell Next.js to trace files from the monorepo root so it includes
  // the correct node_modules in the standalone output.
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: 'minio' },
    ],
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
  },
};

module.exports = nextConfig;
