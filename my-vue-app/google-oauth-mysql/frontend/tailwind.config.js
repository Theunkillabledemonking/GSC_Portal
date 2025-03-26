/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}", // ✅ .vue 추가!
  ],
  theme: {
    extend: {
      colors: {
        // 아이마스 감성 컬러
        idolPink: '#f272ba',
        idolPurple: '#a259ff',
        idolBlue: '#5b9fff',
        idolSky: '#c3dafe',
        idolGray: '#f4f4f6',
        idolDark: '#3a3a3a',
      },
      borderColor: theme => ({
        ...theme('colors'),
        idolPurple: '#a259ff', // 반드시 이렇게 등록해야 @apply 가능!
      }),
      backgroundImage: {
        // 그라데이션 스타일
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