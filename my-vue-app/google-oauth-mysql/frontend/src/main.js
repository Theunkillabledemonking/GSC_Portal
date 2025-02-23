import { createApp } from "vue";
import { createPinia } from "pinia";
import store from "./store/auth";
import router from "./router/index.js";
import axios from "./axios";
import App from "./App.vue";

const app = createApp(App);
app.use(createPinia());
app.use(store);
app.use(router);

app.config.globalProperties.$axios = axios;

store.dispatch("auth/loadTokens");
app.mount("#app");
