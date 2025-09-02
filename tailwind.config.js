/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",                // App principal
    "./src/**/*.{js,jsx,ts,tsx}",           // Todos los archivos en src/
    "./components/**/*.{js,jsx,ts,tsx}",    // Opcional, si tienes components
    "./app/**/*.{js,jsx,ts,tsx}"            // Opcional
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

