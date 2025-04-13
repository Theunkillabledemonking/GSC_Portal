import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import './assets/index.css';
import router from "./router";
import { useAuthStore } from "./store";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

// Auth store 초기화 및 앱 마운트
const initApp = async () => {
  const authStore = useAuthStore();
  await authStore.initializeAuth();
  app.mount("#app");
};

initApp().catch(error => {
  console.error('Failed to initialize app:', error);
});
