/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
  webpack: (config) => {
    // Handle Three.js compatibility
    config.externals = [...config.externals, { canvas: "canvas" }];
    return config;
  },
  // Enable static export for Vercel deployment
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig;