/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        lexend: ['"Lexend"', 'sans-serif'],
        opendyslexic: ['"OpenDyslexic"', 'sans-serif'],
        comic: ['"Comic Neue"', 'cursive', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif']
      },
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#FAF6EE',
          200: '#F4EEDB',
          300: '#ECE2C5',
          800: '#3D372A',
          900: '#231F17'
        },
        pastel: {
          green: '#E8F5E9',
          greenDark: '#2E7D32',
          blue: '#E3F2FD',
          blueDark: '#1565C0',
          peach: '#FFF3E0',
          peachDark: '#E65100',
          lavender: '#F3E5F5',
          lavenderDark: '#7B1FA2'
        }
      }
    },
  },
  plugins: [],
}
