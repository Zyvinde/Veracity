/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === 'true' || Boolean(process.env.GITHUB_ACTIONS);
const isGhActions = Boolean(process.env.GITHUB_ACTIONS);

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  ...(isStaticExport ? { output: 'export', trailingSlash: true } : {}),
  basePath: isGhActions ? '/Veracity' : '',
  assetPrefix: isGhActions ? '/Veracity/' : '',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  ...(isStaticExport
    ? {}
    : {
        async headers() {
          return [
            {
              source: '/(.*)',
              headers: [
                { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
                { key: 'X-XSS-Protection', value: '1; mode=block' },
                { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
                { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
              ],
            },
          ];
        },
      }),
  images: {
    ...(isStaticExport ? { unoptimized: true } : { formats: ['image/avif', 'image/webp'] }),
  },
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      fs: false,
      path: false,
    };
    return config;
  },
};

module.exports = nextConfig;
