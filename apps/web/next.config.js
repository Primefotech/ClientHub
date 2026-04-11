const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output: creates a self-contained .next/standalone folder
  // that includes only the necessary files + traced node_modules.
  // This produces very small, fast Docker images.
  output: 'standalone',

  // Skip TypeScript type-checking errors during `next build`.
  // Type checking is done separately (IDE / CI lint step).
  // This prevents Docker build failures caused by strict TS errors.
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint during Docker build (run it as a separate CI step).
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Tell Next.js to trace files from the monorepo root so it includes
  // the correct node_modules in the standalone output.
  experimental: {
    outputFileTracingRoot: path.resolve(__dirname, '../../'),
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
