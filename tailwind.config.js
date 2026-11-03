/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          500: '#0284C7',
          600: '#0369A1',
        },
        slate: {
          900: '#0F172A',
          850: '#131d35',
          800: '#1E293B',
          700: '#334155',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Space Grotesk"', 'monospace'],
      }
    },
  },
  plugins: [],
}
