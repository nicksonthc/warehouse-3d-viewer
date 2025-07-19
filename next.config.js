/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: "canvas" }];
    return config;
  },
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig;
