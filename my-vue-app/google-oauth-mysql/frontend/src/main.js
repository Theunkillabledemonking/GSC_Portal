// main.js: Vue 앱 초기화 및 마운트
import { createApp } from "vue"; // Vue 앱을 생성하기 위한 함수
import { createPinia } from "pinia"; // Pinia 상태 관리
import App from "./App.vue"; // 최상위 컴포넌트
import router from "./router";
import {useAuthStore} from "@/store/authStore.js"; // Vue router 설정

// vue 앱 생성 및 설정
const app = createApp(App);
const pinia = createPinia();

// Pinia 및 라우터 사용
app.use(pinia);
app.use(router);

const authStore = useAuthStore();
authStore.initializeAuth();

// Vue 앱을 DOM에 마운트
app.mount("#app");