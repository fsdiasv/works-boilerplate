import aspectRatio from '@tailwindcss/aspect-ratio'
import containerQueries from '@tailwindcss/container-queries'
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1400px',
      },
    },
    screens: {
      // Mobile-first breakpoints optimized for PWA
      xs: '475px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      // Touch-specific breakpoints
      touch: { raw: '(hover: none) and (pointer: coarse)' },
      'no-touch': { raw: '(hover: hover) and (pointer: fine)' },
      // PWA app display mode
      standalone: { raw: '(display-mode: standalone)' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        // Fluid typography system with mobile-optimized scales
        xs: [
          'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
          { lineHeight: '1.5', letterSpacing: '0.025em' },
        ],
        sm: [
          'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
          { lineHeight: '1.5', letterSpacing: '0.025em' },
        ],
        base: ['clamp(1rem, 0.9rem + 0.5vw, 1.125rem)', { lineHeight: '1.6', letterSpacing: '0' }],
        lg: [
          'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',
          { lineHeight: '1.6', letterSpacing: '-0.025em' },
        ],
        xl: [
          'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
          { lineHeight: '1.5', letterSpacing: '-0.025em' },
        ],
        '2xl': [
          'clamp(1.5rem, 1.3rem + 1vw, 2rem)',
          { lineHeight: '1.4', letterSpacing: '-0.05em' },
        ],
        '3xl': [
          'clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem)',
          { lineHeight: '1.3', letterSpacing: '-0.05em' },
        ],
        '4xl': [
          'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',
          { lineHeight: '1.2', letterSpacing: '-0.075em' },
        ],
        '5xl': [
          'clamp(3rem, 2.5rem + 2.5vw, 4rem)',
          { lineHeight: '1.1', letterSpacing: '-0.075em' },
        ],
      },
      spacing: {
        // Mobile gesture-friendly spacing with 8px grid
        '18': '4.5rem', // 72px
        '22': '5.5rem', // 88px
        '26': '6.5rem', // 104px
        '30': '7.5rem', // 120px
        '34': '8.5rem', // 136px
        '38': '9.5rem', // 152px
        '42': '10.5rem', // 168px
        '46': '11.5rem', // 184px
        // Touch target minimum sizes
        'touch-sm': '2.75rem', // 44px - minimum touch target
        touch: '3rem', // 48px - comfortable touch target
        'touch-lg': '3.5rem', // 56px - large touch target
      },
      minHeight: {
        touch: '2.75rem', // 44px minimum touch target
        'screen-safe': '100dvh', // Dynamic viewport height for mobile
      },
      minWidth: {
        touch: '2.75rem', // 44px minimum touch target
      },
      maxWidth: {
        prose: '65ch',
        'prose-sm': '55ch',
        'prose-lg': '75ch',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        touch: '0 2px 8px rgba(0, 0, 0, 0.15)',
        'touch-active': '0 1px 4px rgba(0, 0, 0, 0.2)',
        glass: '0 8px 32px rgba(31, 38, 135, 0.37)',
      },
      // Safe area insets for PWA
      padding: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      margin: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [
    typography({
      className: 'prose',
    }),
    forms({
      strategy: 'class',
    }),
    aspectRatio,
    containerQueries,
  ],
}

export default config
