import withBundleAnalyzerInit from '@next/bundle-analyzer'
import createNextIntlPlugin from 'next-intl/plugin'
import withPWAInit from 'next-pwa'

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development' || process.env.DISABLE_PWA === 'true',
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

    // Mobile optimizations with enhanced tree shaking
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
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-accordion',
      '@radix-ui/react-tabs',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-radio-group',
      'date-fns',
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
    // More aggressive bundle size limits for mobile optimization
    config.performance = {
      maxAssetSize: 280000, // 280KB limit for individual assets
      maxEntrypointSize: 550000, // 550KB limit for entry points
      hints: 'warning',
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
          maxInitialRequests: 25,
          maxAsyncRequests: 25,
          minSize: 20000,
          maxSize: 250000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Split large vendor libraries with better granularity
            supabase: {
              test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
              name: 'supabase',
              priority: 15,
              chunks: 'async',
            },
            framer: {
              test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
              name: 'framer',
              priority: 15,
              chunks: 'async',
            },
            recharts: {
              test: /[\\/]node_modules[\\/](recharts|d3-.*|victory-.*)[\\/]/,
              name: 'charts',
              priority: 15,
              chunks: 'async',
              maxSize: 250000, // 250KB limit per chunk
            },
            radixCore: {
              test: /[\\/]node_modules[\\/](@radix-ui[\\/]react-(dialog|dropdown-menu|select|popover|tooltip))[\\/]/,
              name: 'radix-interactive',
              priority: 12,
              chunks: 'async',
            },
            radixLayout: {
              test: /[\\/]node_modules[\\/](@radix-ui[\\/]react-(accordion|collapsible|tabs|separator))[\\/]/,
              name: 'radix-layout',
              priority: 12,
              chunks: 'async',
            },
            radixForm: {
              test: /[\\/]node_modules[\\/](@radix-ui[\\/]react-(checkbox|radio-group|slider|switch))[\\/]/,
              name: 'radix-form',
              priority: 12,
              chunks: 'async',
            },
            ui: {
              test: /[\\/]components[\\/]ui[\\/]/,
              name: 'ui',
              priority: 8,
              chunks: 'async',
            },
            workspace: {
              test: /[\\/]components[\\/]workspace[\\/]/,
              name: 'workspace',
              priority: 8,
              chunks: 'async',
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
    // CSP is now handled in middleware with nonce support for better security

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
          // CSP is now handled in middleware with nonce support
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
