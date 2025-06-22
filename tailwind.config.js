/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      colors: {
        // 🏛️ PREMIUM AUCTION HOUSE PALETTE
        auction: {
          // Primary - Cor da marca #0088D9
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0088D9', // Main brand color
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Secondary - Warm Gold Accents
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Accent color
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Neutral - Sophisticated Grays
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Success - Badge de desconto #0A850E
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#0A850E', // Badge de desconto
          600: '#097a0d',
          700: '#086b0c',
          800: '#075a0a',
          900: '#064a09',
        },
        // Error - Badge novo #E22851
        error: {
          50: '#fef2f4',
          100: '#fde2e8',
          200: '#fbc9d6',
          300: '#f7a2b8',
          400: '#f1708f',
          500: '#E22851', // Badge novo
          600: '#d91e47',
          700: '#b91c3c',
          800: '#9a1a35',
          900: '#821a32',
        },
        // Background cinza #F1F1F0
        neutral: {
          50: '#F1F1F0', // Background cinza
          100: '#e8e8e7',
          200: '#d1d1cf',
          300: '#b4b4b1',
          400: '#8f8f8b',
          500: '#737370',
          600: '#5c5c59',
          700: '#4a4a47',
          800: '#3e3e3c',
          900: '#363634',
        }
      },
      boxShadow: {
        // 🎨 PREMIUM SHADOWS - Usando cor da marca #0088D9
        'auction-sm': '0 1px 3px 0 rgba(0, 136, 217, 0.1), 0 1px 2px 0 rgba(0, 136, 217, 0.06)',
        'auction-md': '0 4px 6px -1px rgba(0, 136, 217, 0.1), 0 2px 4px -1px rgba(0, 136, 217, 0.06)',
        'auction-lg': '0 10px 15px -3px rgba(0, 136, 217, 0.1), 0 4px 6px -2px rgba(0, 136, 217, 0.05)',
        'auction-xl': '0 20px 25px -5px rgba(0, 136, 217, 0.1), 0 10px 10px -5px rgba(0, 136, 217, 0.04)',
        'card-hover': '0 8px 25px -5px rgba(0, 136, 217, 0.15), 0 4px 10px -3px rgba(0, 136, 217, 0.1)',
        'premium': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      borderRadius: {
        'auction': '16px',
        'auction-lg': '20px',
        'auction-xl': '24px',
      },
      backdropBlur: {
        'auction': '12px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};