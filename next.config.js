const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // legacyBrowsers: false,
    esmExternals: 'loose',
  },
  swcMinify: true, // Ensure JS is minified
  images: {
    domains: [
      'cdn.discordapp.com',
    ],
  },
};

module.exports = withBundleAnalyzer(nextConfig);
