import axios from "axios";
import { useAuthStore } from "./store/auth.js";

// ✅ 기본 API 설정
const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000",
});

// ✅ 요청 인터셉터: Access Token을 자동으로 헤더에 추가
api.interceptors.request.use((config) => {
    const authStore = useAuthStore();
    if (authStore.accessToken) {
        config.headers.Authorization = `Bearer ${authStore.accessToken}`;
    }
    return config;
});

// ✅ 응답 인터셉터: Access Token이 만료되면 Refresh Token으로 재발급
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const authStore = useAuthStore();
        if (error.response?.status === 401 && authStore.refreshToken) {
            await authStore.refreshAccessToken();
            return api(error.config); // 재시도
        }
        return Promise.reject(error);
    }
);

export default api;
