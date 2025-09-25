// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Use remotePatterns for better flexibility
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**',
      },
      // Add other image hosting services you might use
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleapis.com',
        pathname: '/**',
      },
    ],
  },
  // ... other config options
};

module.exports = nextConfig;