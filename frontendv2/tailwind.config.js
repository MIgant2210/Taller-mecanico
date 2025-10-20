/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // Para Vite + React
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    
    // O si quieres ser más específico:
    // "./src/**/*.jsx",
    // "./src/**/*.js", 
    // "./src/**/*.tsx",
    // "./src/**/*.ts",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [],
}