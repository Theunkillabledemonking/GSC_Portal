import { defineStore } from "pinia";
import apiClient from "../services/apiClient";
import { useRouter } from "vue-router";

export const useAuthStore = defineStore("auth", {
    state: () => ({
        token: localStorage.getItem("accessToken") || null,
        user: JSON.parse(localStorage.getItem("user")) || null,
        role: Number(localStorage.getItem("role")) || null,
        name: localStorage.getItem("name") || null,
        grade: localStorage.getItem("grade") || null,
        level: localStorage.getItem("level") || null,
        status: Number(localStorage.getItem("status")) || null
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
        login(token, role, name, grade, level, status) {
            this.token = token;
            this.role = role;
            this.name = name;
            this.grade = grade;
            this.level = level;
            this.status = status;

            localStorage.setItem("accessToken", token);
            localStorage.setItem("role", role);
            localStorage.setItem("name", name);
            localStorage.setItem("grade", grade);
            localStorage.setItem("level", level);
            localStorage.setItem("status", status);
        },

        // ✅ 로그아웃 처리
        logout() {
            this.token = null;
            this.user = null;
            this.role = null;
            this.name = null;
            this.grade = null;
            this.level = null;
            this.status = null;

            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            localStorage.removeItem("role");
            localStorage.removeItem("name");
            localStorage.removeItem("grade");
            localStorage.removeItem("level");
            localStorage.removeItem("status");


            window.location.href = "/login";
        },

        // ✅ 앱 시작 시 자동 로그인 (새로고침 후에도 유지)
        initializeAuth() {
            this.token = localStorage.getItem("accessToken") || null;
            this.role = Number(localStorage.getItem("role")) || null;
            this.name = localStorage.getItem("name") || null;
            this.grade = localStorage.getItem("grade") || null;
            this.level = localStorage.getItem("level") || null;
            this.status = Number(localStorage.getItem("status")) || null;
        }
    }
});
