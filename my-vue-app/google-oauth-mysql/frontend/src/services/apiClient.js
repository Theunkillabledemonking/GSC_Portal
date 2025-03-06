import axios from 'axios';
import { useAuthStore } from "@/store/authStore";

const apiClient = axios.create({
    baseURL: '/api',  // /api로 시작하는 요청은 전부 이걸 거침
    headers: {
        'Content-Type': 'application/json',
    }
});

apiClient.interceptors.request.use(config => {
    const authStore = useAuthStore();
    const token = authStore.accessToken; // Pinia에서 accessToken 가져옴

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;  // 매 요청마다 토큰 추가
    } else {
        console.warn("🚨 Authorization 헤더 없음!");
    }

    return config;
}, error => {
    return Promise.reject(error);
});

export default apiClient;
