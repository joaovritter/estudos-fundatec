/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '4.5mb',
    },
  },
};

module.exports = nextConfig;
