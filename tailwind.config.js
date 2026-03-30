/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        day: '#fcf2e3',
        night: '#212122',
        sunshine: '#ffcc12',
        earth: '#dd6945',
        forest: '#195e47',
        sky: '#85d1e3',
        primary: '#195e47',
        coin: '#ffcc12',
        success: '#195e47',
      },
      fontFamily: {
        serif: ['Inria Serif', 'Georgia', 'serif'],
        sans: ['Geist', 'system-ui', 'sans-serif'],
      },
      animation: {
        bounce: 'bounce 0.6s ease-in-out',
        slideIn: 'slideIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
