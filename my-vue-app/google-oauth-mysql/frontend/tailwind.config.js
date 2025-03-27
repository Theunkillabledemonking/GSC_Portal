// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    './src/assets/**/*.css',
  ],
  theme: {
    extend: {
      colors: {
        idolPink: '#f272ba',
        idolPurple: '#a259ff',
        idolBlue: '#5b9fff',
        idolSky: '#c3dafe',
        idolGray: '#f4f4f6',
        idolDark: '#3a3a3a',
      },
      borderColor: theme => ({
        ...theme('colors'),
        idolPurple: '#a259ff',
      }),
      backgroundImage: {
        'idol-gradient': 'linear-gradient(to right, #f272ba, #a259ff)',
        'idol-gradient-soft': 'linear-gradient(to right, #f8bbd0, #e1bee7)',
      },
      boxShadow: {
        idol: '0 4px 12px rgba(242, 114, 186, 0.3)',
      },
      fontFamily: {
        idol: ['"Noto Sans KR"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
