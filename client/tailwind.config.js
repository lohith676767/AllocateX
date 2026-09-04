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
        // Elegant teal — every component already reads this one token, so
        // retuning the hex values here rebrands the whole app in one place.
        accent: {
          50: '#eefbf9',
          100: '#d3f3ee',
          200: '#a7e6dc',
          300: '#74d2c4',
          400: '#48b7a8',
          500: '#2f9b8e',
          600: '#227d73',
          700: '#1f655e',
          800: '#1d514c',
          900: '#1b4440',
        },
        // Deep navy — sidebar surface and other high-contrast institutional
        // chrome, distinct from the teal accent and the warm off-white body.
        navy: {
          50: '#eef1f5',
          100: '#d8dee7',
          200: '#b2bfd0',
          300: '#8598b3',
          400: '#5d7392',
          500: '#425873',
          600: '#31435a',
          700: '#253345',
          800: '#192431',
          900: '#101823',
          950: '#0a1019',
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
