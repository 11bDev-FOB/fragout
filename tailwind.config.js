/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        // 11b.dev inspired military/tactical color scheme
        tactical: {
          50: '#f6f7f6',   // Very light gray-green
          100: '#e1e5e1',  // Light tactical gray
          200: '#c4cbc4',  // Medium tactical gray
          300: '#9ea89e',  // Dark tactical gray
          400: '#7a8a7a',  // Military green-gray
          500: '#5a6b5a',  // Base tactical green
          600: '#4a5a4a',  // Dark tactical green
          700: '#3d4a3d',  // Darker tactical
          800: '#2f3a2f',  // Very dark tactical
          900: '#1f251f',  // Deepest tactical
          950: '#0f120f',  // Almost black tactical
        },
        // Lightning accent color inspired by 11b.dev 💣
        lightning: {
          50: '#fef9e7',   // Very light yellow
          100: '#fef2c7',  // Light lightning
          200: '#fde68a',  // Medium lightning
          300: '#fcd34d',  // Bright lightning
          400: '#fbbf24',  // Lightning yellow
          500: '#f59e0b',  // Base lightning
          600: '#d97706',  // Dark lightning
          700: '#b45309',  // Darker lightning
          800: '#92400e',  // Very dark lightning
          900: '#78350f',  // Deepest lightning
        },
        // Military-inspired greens
        military: {
          50: '#f0f4f0',   // Very light military
          100: '#dcebdc',  // Light military
          200: '#bad7ba',  // Medium light military
          300: '#8fbb8f',  // Medium military
          400: '#5f9a5f',  // Dark military
          500: '#4a7c4a',  // Base military green
          600: '#3a633a',  // Darker military
          700: '#2f4f2f',  // Very dark military
          800: '#253e25',  // Almost black military
          900: '#1a2b1a',  // Deepest military
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
