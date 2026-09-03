/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Single restrained brand accent — used for the FairFill identity,
        // primary actions, and "informational/system-generated" semantics.
        // Everything else (success/warning/danger) uses Tailwind's own
        // emerald/amber/rose so the palette stays deliberately small.
        accent: {
          50: '#eef1fc',
          100: '#dde3f9',
          200: '#c0caf3',
          300: '#96a5e9',
          400: '#6c7ddc',
          500: '#4c5bc7',
          600: '#3a44ab',
          700: '#313a8c',
          800: '#2b3272',
          900: '#272d5f',
        },
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(28,25,23,0.05)',
        card: '0 1px 2px 0 rgba(28,25,23,0.04), 0 1px 1px 0 rgba(28,25,23,0.02)',
        popover: '0 12px 32px -8px rgba(28,25,23,0.16), 0 4px 10px -4px rgba(28,25,23,0.08)',
      },
      keyframes: {
        fillbar: { from: { width: '0%' }, to: { width: 'var(--fill-to)' } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.45 } },
        fadeUp: { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        fillbar: 'fillbar 900ms cubic-bezier(0.22,1,0.36,1) forwards',
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
        fadeUp: 'fadeUp 250ms cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
};
