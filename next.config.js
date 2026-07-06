/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '4.5mb',
    },
  },
  webpack: (config) => {
    // pdfjs (react-pdf) referencia 'canvas' só no ambiente Node; no browser
    // não é necessário. Evita erro de resolução no build.
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
