/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    'postcss-nesting': {},
    'postcss-preset-env': {
      stage: 1,
      features: {
        'custom-properties': true,
        'custom-media-queries': true,
        'custom-selectors': true,
        'nesting-rules': true,
      },
      autoprefixer: {
        flexbox: 'no-2009',
        grid: 'autoplace',
      },
    },
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: [
          'default',
          {
            discardComments: {
              removeAll: true,
            },
            normalizeWhitespace: true,
            colormin: true,
            minifySelectors: true,
            minifyParams: true,
            minifyFontValues: true,
          },
        ],
      },
    }),
  },
}

export default config
