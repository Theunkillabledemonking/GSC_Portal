import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);   // ✅ 반드시 먼저 등록해야 함
app.use(router);

// ✅ 등록 이후에 store 사용
import { useAuthStore } from "@/store/authStore";
const authStore = useAuthStore();
authStore.initializeAuth();

app.mount("#app");
