import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ✅ axios 인스턴스 생성
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    }
});

// ✅ 인증이 필요한 요청에만 Authorization 헤더 추가
apiClient.interceptors.request.use(config => {
    const authStore = useAuthStore();
    const token = authStore.token;

    // ✅ 로그인 요청("/auth/google")에는 Authorization 헤더를 추가하지 않음
    if (token && !config.url.includes("/auth/google")) {
        config.headers.Authorization = `Bearer ${token}`;
    } else if (!token && !config.url.includes("/auth/google")) {
        console.warn("🚨 Authorization 헤더 없음!");
    }

    return config;
}, error => {
    return Promise.reject(error);
});

// ✅ 응답 인터셉터: 토큰 만료 시 자동으로 `refresh-token` 요청
apiClient.interceptors.response.use(response => {
    return response;
}, async error => {
    if (error.response?.status === 401) {
        console.warn("⚠️ 토큰 만료됨! refresh-token 요청 시도 중...");
        const authStore = useAuthStore();
        authStore.logout();
        // try {
        //     const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
        //         refreshToken: authStore.refreshToken,
        //     });
        //
        //     authStore.setToken(refreshResponse.data.accessToken);  // 새로운 JWT 저장
        //     error.config.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
        //     return axios(error.config);  // 실패한 요청 다시 보내기
        // } catch (refreshError) {
        //     console.error("🚨 refresh-token 요청 실패:", refreshError.response?.data || refreshError.message);
        //     authStore.logout();
        //     return Promise.reject(refreshError);
        // }
    }
    return Promise.reject(error);
});

export default apiClient;
