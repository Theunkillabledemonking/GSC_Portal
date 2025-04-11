import axios from "axios";
import { useAuthStore } from "@/store/authStore";
let authStore;
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ✅ axios 인스턴스 생성
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    }
});

// ✅ 요청 인터셉터 추가 (매 요청마다 JWT 포함)
apiClient.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore();

        if (authStore.token) {
            config.headers.Authorization = `Bearer ${authStore.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ✅ 응답 인터셉터: 토큰 만료 시 자동으로 `refresh-token` 요청
apiClient.interceptors.response.use(
    response => response,
    async (error) => {
        if (error.response?.status === 401) {
            console.warn("🚨 토큰 만료 또는 인증 오류");
            if (!authStore) authStore = useAuthStore();
            authStore.logout(); // 이제 정확히 동작함!
        }
        return Promise.reject(error);
    }
);


export default apiClient;