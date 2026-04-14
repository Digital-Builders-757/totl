import {withSentryConfig} from '@sentry/nextjs';
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix workspace root warning
  outputFileTracingRoot: process.cwd(),
  
  // Type checking enabled - ensuring production-ready code
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: false, // Enable optimization for better performance
    remotePatterns: [
      { 
        protocol: 'https', 
        hostname: '**.supabase.co', 
        pathname: '/storage/v1/object/**' 
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**'
      },
    ],
    // Optimize avatar images
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 512],
  },
  // Note: serverActions configuration moved to experimental in Next.js 15
  experimental: {
    serverActions: {
      // CRITICAL: Must be >= max file size + form data overhead
      // Portfolio: 10MB (client compresses to ~1-5MB); gig: 4MB; avatar: 5MB
      // TODO: Migrate to direct-to-Supabase signed uploads to eliminate large body payloads
      bodySizeLimit: '15mb',
    },
  },

  /** Legacy talent UI lived under /admin/talentdashboard; canonical routes are /talent/dashboard and /talent/profile. */
  async redirects() {
    return [
      {
        source: '/admin/talentdashboard/profile',
        destination: '/talent/profile',
        permanent: true,
      },
      {
        source: '/admin/talentdashboard/portfolio',
        destination: '/talent/profile',
        permanent: true,
      },
      {
        source: '/admin/talentdashboard/applications',
        destination: '/talent/dashboard',
        permanent: true,
      },
      {
        source: '/admin/talentdashboard',
        destination: '/talent/dashboard',
        permanent: true,
      },
    ];
  },

  // Suppress Edge Runtime warnings for Supabase
  webpack: (config, { isServer, dev }) => {
    // Windows + long/space paths: persistent pack cache can fail mid-build (ENOENT on rename),
    // which then surfaces as missing `.next/server/pages-manifest.json` during "Collecting page data".
    // Limit to win32 (and optional DISABLE_NEXT_WEBPACK_CACHE=1) so Linux CI / Vercel keep webpack cache.
    if (!dev && (process.platform === 'win32' || process.env.DISABLE_NEXT_WEBPACK_CACHE === '1')) {
      config.cache = false;
    }
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      
      // Improve chunk loading reliability
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for better caching
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "the-digital-builders-bi",

  project: "totlmodelagency",

  // Sentry auth token for uploading source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});