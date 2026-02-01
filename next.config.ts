// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow all remote patterns to avoid strict validation errors
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;