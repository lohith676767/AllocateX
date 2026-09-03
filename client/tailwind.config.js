/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          950: '#05070a',
          900: '#0a0e14',
          850: '#0d121a',
          800: '#111826',
          700: '#1a2333',
          600: '#26324a',
          500: '#3a4a68',
        },
        mist: {
          400: '#7c8aa5',
          300: '#9fabc2',
          200: '#c3cbdc',
          100: '#e4e8f0',
        },
        signal: {
          teal: '#2dd4bf',
          amber: '#f5b942',
          rose: '#f3607a',
          violet: '#8b7cf6',
          blue: '#4f9df7',
        },
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
      },
      keyframes: {
        fillbar: { from: { width: '0%' }, to: { width: 'var(--fill-to)' } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.55 } },
      },
      animation: {
        fillbar: 'fillbar 900ms cubic-bezier(0.22,1,0.36,1) forwards',
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
