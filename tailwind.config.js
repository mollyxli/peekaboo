/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './*.html'],
  theme: {
    extend: {
      fontFamily: {
        'press-start': ['"Press Start 2P"', 'cursive'],
        'silkscreen': ['Silkscreen', 'cursive'],
      },
      animation: {
        bob: 'bob 2s ease-in-out infinite',
        shake: 'shake 0.5s ease-in-out',
        'float-up': 'floatUp 2s ease-out infinite',
        'float-up-delayed': 'floatUp 2s ease-out 0.7s infinite',
        'float-up-slow': 'floatUp 2s ease-out 1.4s infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'tail-wag': 'tailWag 0.4s ease-in-out infinite alternate',
        breathe: 'breathe 3.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-in-out forwards',
      },
      keyframes: {
        bob: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0px)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0px)', opacity: '1' },
          '100%': { transform: 'translateY(-24px)', opacity: '0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        tailWag: {
          '0%': { transform: 'rotate(-20deg)' },
          '100%': { transform: 'rotate(20deg)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scaleY(1) translateY(0px)' },
          '40%': { transform: 'scaleY(1.04) translateY(-2px)' },
          '60%': { transform: 'scaleY(1.04) translateY(-2px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
