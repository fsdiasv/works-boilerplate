import withBundleAnalyzerInit from '@next/bundle-analyzer'
import createNextIntlPlugin from 'next-intl/plugin'
import withPWAInit from 'next-pwa'

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline',
  },
  runtimeCaching: [
    // API Routes - Network First
    {
      urlPattern: /^https?.*\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        networkTimeoutSeconds: 10,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Images - Cache First
    {
      urlPattern: /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Static Assets - Stale While Revalidate
    {
      urlPattern: /\.(?:js|css|woff|woff2|ttf|eot)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    // Pages - Network First with offline fallback
    {
      urlPattern: /^https?.*\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        networkTimeoutSeconds: 8,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
})

const withBundleAnalyzer = withBundleAnalyzerInit({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack configuration (moved from experimental)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Server external packages (moved from experimental.serverComponentsExternalPackages)
  serverExternalPackages: ['@prisma/client'],

  experimental: {
    // React 19 optimizations
    // ppr: true, // Partial Prerendering - only available in canary
    // reactCompiler: true, // React Compiler - requires additional setup

    // Mobile optimizations
    optimizePackageImports: [
      '@/components',
      '@/lib',
      'lucide-react',
      'framer-motion',
      'recharts',
      '@supabase/supabase-js',
      '@supabase/ssr',
      'react-hook-form',
      '@hookform/resolvers',
      'sonner',
      'next-themes',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
    ],
  },

  // Mobile-first image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // Bundle optimization
  webpack: (config, { isServer }) => {
    // Mobile bundle size limits
    config.performance = {
      maxAssetSize: 300000, // 300KB limit (temporary increase)
      maxEntrypointSize: 600000, // 600KB limit for entry points
      hints: 'warning', // Changed to warning for development
    }

    // SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    // Code splitting optimization
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Split large vendor libraries
            supabase: {
              test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
              name: 'supabase',
              priority: 10,
            },
            framer: {
              test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
              name: 'framer',
              priority: 10,
            },
            recharts: {
              test: /[\\/]node_modules[\\/](recharts|d3-.*|victory-.*)[\\/]/,
              name: 'charts',
              priority: 10,
            },
            ui: {
              test: /[\\/]components[\\/]ui[\\/]/,
              name: 'ui',
              priority: 5,
            },
            commons: {
              minChunks: 2,
              priority: -10,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }

    // Bundle analyzer integration handled by withBundleAnalyzer

    return config
  },

  // Compression for mobile networks
  compress: true,

  // Source maps disabled for security
  productionBrowserSourceMaps: false,

  // Security headers
  async headers() {
    // More permissive CSP for development
    const isDev = process.env.NODE_ENV === 'development'

    const cspHeader = isDev
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' http://localhost:* ws://localhost:* https://*.supabase.co wss://*.supabase.co https://*.supabase.com wss://*.supabase.com http://gc.kis.v2.scr.kaspersky-labs.com ws://gc.kis.v2.scr.kaspersky-labs.com; frame-src 'self' https://*.supabase.co https://*.supabase.com;"
      : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.supabase.com wss://*.supabase.com; frame-src 'self' https://*.supabase.co https://*.supabase.com;"

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  poweredByHeader: false,
}

export default withBundleAnalyzer(withPWA(withNextIntl(nextConfig)))
