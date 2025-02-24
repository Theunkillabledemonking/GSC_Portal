import { createApp } from "vue";
import { createPinia } from "pinia";
import { useAuthStore } from "./store/auth";
import router from "./router/index.js";
import axios from "./axios.js";
import App from "./App.vue";

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

app.config.globalProperties.$axios = axios;

const authStore = useAuthStore();
if (authStore.accessToken) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${authStore.accessToken}`; // ✅ Axios 기본 헤더 설정
    authStore.fetchUser().then(() => {
        app.mount("#app");
    });
} else {
    app.mount("#app");
}