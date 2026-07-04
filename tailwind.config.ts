import type { Config } from 'tailwindcss';

// Design system "papel de prova": paleta quente ancorada no universo de estudo
// (papel creme, tinta sépia, sálvia como cor de ação, âmbar de marca-texto).
// Tokens semânticos — nunca hex solto nos componentes.
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        creme: {
          50: '#fdfbf6',
          100: '#f8f3e9',
          200: '#f0e8d8',
          300: '#e3d6bc',
        },
        ambar: {
          200: '#fbe79a',
          400: '#e9b949',
          500: '#d19e2f',
          600: '#a97b22',
          700: '#85601c',
        },
        salvia: {
          100: '#e7ede3',
          300: '#b7c9ae',
          500: '#6f8f63',
          600: '#52704a',
          700: '#405a3a',
          800: '#33482e',
        },
        terra: {
          400: '#a98f74',
          500: '#8a6d53',
          700: '#5c4936',
          800: '#43352a',
          900: '#2e241c',
        },
        erro: '#a8453a',
        acerto: '#4e7d46',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        carta: '0 1px 2px rgba(46, 36, 28, 0.06), 0 4px 12px rgba(46, 36, 28, 0.05)',
        'carta-alta': '0 2px 4px rgba(46, 36, 28, 0.08), 0 12px 28px rgba(46, 36, 28, 0.1)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
