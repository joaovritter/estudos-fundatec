import type { Config } from 'tailwindcss';

// Paleta aconchegante de estudo: creme, âmbar, verde-sálvia, marrom terroso.
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        creme: {
          50: '#fdfbf7',
          100: '#faf6ed',
          200: '#f3ecdc',
          300: '#e9ddc4',
        },
        ambar: {
          400: '#d9a441',
          500: '#c98f2b',
          600: '#a97522',
          700: '#8a5e1c',
        },
        salvia: {
          100: '#e6ede4',
          300: '#b4c7ae',
          500: '#7d9a74',
          600: '#5f7d57',
          700: '#4b6345',
        },
        terra: {
          500: '#8c6f56',
          700: '#5e4a38',
          800: '#463729',
          900: '#332821',
        },
        erro: '#b5544a',
        acerto: '#5f7d57',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
