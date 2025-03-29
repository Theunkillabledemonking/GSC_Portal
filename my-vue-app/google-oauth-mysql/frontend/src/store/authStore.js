import { defineStore } from "pinia";
import apiClient from "../services/apiClient";

export const useAuthStore = defineStore("auth", {
    state: () => ({
        token: localStorage.getItem("accessToken") || null,
        // user 객체를 localStorage에서 JSON으로 불러옴
        user: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null,
        role: localStorage.getItem("role") ? Number(localStorage.getItem("role")) : null,
        name: localStorage.getItem("name") || null,
        grade: localStorage.getItem("grade") || null,
        level: localStorage.getItem("level") || null,
        status: localStorage.getItem("status") ? Number(localStorage.getItem("status")) : null,
    }),

    getters: {
        isAuthenticated: (state) => !!state.token, // 로그인 여부 확인
    },

    actions: {
        async register(userData) {
            try {
                const response = await apiClient.post("/auth/register", userData);
                const { status } = response.data;

                if (status === 0) {
                    // ✅ 회원가입 성공, 하지만 승인 대기 상태
                    return { success: true, status };
                } else {
                    return { success: false, message: "회원가입 상태 오류!" };
                }
            } catch (error) {
                console.error("🚨 회원가입 실패:", error);
                return { success: false, message: error.response?.data?.message || "회원가입 실패" };
            }
        },

        // ✅ 로그인 처리 (LocalStorage에 저장)
        login(token, user) {
            this.token = token;
            this.user = user;
            this.role = user.role;
            console.log('🧪 login 파라미터:', token, user);
            this.name = user.name;
            this.grade = Number(user.grade);
            this.level = user.level;
            this.status = user.status;

            localStorage.setItem("accessToken", token);
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("role", user.role);
            localStorage.setItem("name", user.name);
            localStorage.setItem("grade", String(user.grade));
            localStorage.setItem("level", user.level);
            localStorage.setItem("status", user.status);
        },

        // ✅ 로그아웃 처리
        logout(shouldRedirect = true) {
            this.token = null;
            this.user = null;
            this.role = null;
            this.name = null;
            this.grade = null;
            this.level = null;
            this.status = null;

            localStorage.clear();

            if (shouldRedirect) {
                window.location.href = "/login"; // 또는 router.push('/login')도 가능
            }
        },

        // 앱 초기화 시 localStorage에서 정보를 불러옵니다.
        initializeAuth() {
            this.token = localStorage.getItem("accessToken") || null;
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                this.user = JSON.parse(storedUser);
                this.role = this.user.role;
                this.name = this.user.name;
                this.grade = this.user.grade;
                this.level = this.user.level;
                this.status = this.user.status;
            } else {
                // user 객체가 없을 경우 개별 항목으로 불러오기
                this.role = localStorage.getItem("role") ? Number(localStorage.getItem("role")) : null;
                this.name = localStorage.getItem("name") || null;
                this.grade = localStorage.getItem("grade") || null;
                this.level = localStorage.getItem("level") || null;
                this.status = localStorage.getItem("status") ? Number(localStorage.getItem("status")) : null;
            }
        },
    },
});
