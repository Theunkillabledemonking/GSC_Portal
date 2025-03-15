import { defineStore } from "pinia";
import { googleLogin, registerUser } from "../services/authService";
import apiClient from "../services/apiClient"; // ✅ apiClient 사용

export const useAuthStore = defineStore("auth", {
    state: () => ({
        status: null,
        token: localStorage.getItem("accessToken") || null,
        role: Number(localStorage.getItem("role")) || null,
        grade: null,
        level: null,
        name: null
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
    },

    actions: {
        async loginWithGoogle(code) {
            try {
                // ✅ Google OAuth 콜백 처리 요청
                const response = await apiClient.get(`/api/auth/google/callback?code=${code}`);

                // ✅ JWT 토큰 및 사용자 정보 저장
                this.token = response.data.token;
                this.role = response.data.role;
                this.is_verified = response.data.is_verified;

                localStorage.setItem("accessToken", response.data.token);
                localStorage.setItem("role", response.data.role);

                // ✅ 승인된 사용자면 대시보드로 이동
                if (this.is_verified === 1) {
                    useRouter().push("/dashboard");
                }
            } catch (error) {
                console.error("🚨 Google 로그인 실패:", error);
            }
        },

        logout() {
            this.token = null;
            this.role = null;
            localStorage.removeItem("accessToken");
            localStorage.removeItem("role");
            window.location.reload();
        },
    }
});
