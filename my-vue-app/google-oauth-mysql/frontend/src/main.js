// main.js: Vue 앱 초기화 및 마운트
import { createApp } from "vue"; // Vue 앱을 생성하기 위한 함수
import { createPinia } from "pinia"; // Pinia 상태 관리
import App from "./App.vue"; // 최상위 컴포넌트
import router from "./router"; // Vue router 설정

//import './assets/styles/main.css'; // 전역 스타일 가져오기

// vue 앱 생성 및 설정
const app = createApp(App);

// Pinia 및 라우터 사용
app.use(createPinia());
app.use(router);

// Vue 앱을 DOM에 마운트
app.mount("#app");