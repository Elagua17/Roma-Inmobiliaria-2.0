/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#0A0A0A',
          100: '#161616',
          200: '#2A2A2A',
          300: '#3A3A3A',
          400: '#71717A',
          500: '#A1A1AA',
          600: '#B8954F',
          700: '#C5A059',
          800: '#E5C378',
          900: '#0A0A0A',
        },
        accent: {
          50: '#211b0f',
          100: '#3a2d15',
          200: '#6a501f',
          300: '#a77d2f',
          400: '#C5A059',
          500: '#C5A059',
          600: '#D4AF37',
          700: '#E5C378',
          800: '#F0D99A',
          900: '#211b0f',
        },
        whatsapp: {
          DEFAULT: '#25D366',
          dark: '#128C7E',
          darker: '#075E54',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      boxShadow: {
        gold: '0 0 24px rgba(197, 160, 89, 0.16)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
};
