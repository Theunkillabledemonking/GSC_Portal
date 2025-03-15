import { defineStore } from "pinia";
import apiClient from "../services/apiClient"; // ✅ apiClient 사용

export const useAuthStore = defineStore("auth", {
    state: () => ({
        status: Number(localStorage.getItem("status")) || null,  // ✅ 승인 상태 (0: 대기, 1: 승인 완료, 2: 거부)
        token: localStorage.getItem("accessToken") || null,
        role: Number(localStorage.getItem("role")) || null,
        is_verified: null,
        grade: localStorage.getItem("grade") || null,  // ✅ 학년 추가
        level: localStorage.getItem("level") || null,  // ✅ 한국어/일본어 레벨 추가
        name: localStorage.getItem("name") || null,  // ✅ 학생 이름 추가
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
    },

    actions: {
        async loginWithGoogle(code) {
            try {
                // ✅ Google OAuth 콜백 요청
                const response = await apiClient.get(`/api/auth/callback?code=${code}`);

                // ✅ 서버에서 받은 로그인 데이터 구조 분해 할당
                const { token, role, is_verified, name, grade, level, status } = response.data;

                // ✅ Pinia Store에 저장
                this.token = token;
                this.role = role;
                this.is_verified = is_verified;
                this.name = name;  // ✅ 학생 이름 저장
                this.grade = grade;  // ✅ 학년 저장
                this.level = level;  // ✅ 한국어/일본어 레벨 저장
                this.status = status;  // ✅ 승인 상태 저장

                // ✅ LocalStorage에도 저장하여 새로고침해도 유지
                localStorage.setItem("accessToken", token);
                localStorage.setItem("role", role);
                localStorage.setItem("name", name);
                localStorage.setItem("grade", grade);
                localStorage.setItem("level", level);
                localStorage.setItem("status", status);

                // ✅ 승인 상태에 따른 처리
                if (status === 1) {
                    // 승인 완료 → 대시보드로 이동
                    useRouter().push("/dashboard");
                } else if (status === 2) {
                    // 승인 거부 → 로그인 페이지로 이동
                    alert("❌ 승인 거부된 사용자입니다.");
                    useRouter().push("/login");
                } else {
                    // 승인 대기 → 알림 후 로그인 페이지 유지
                    alert("⏳ 관리자 승인 대기 중입니다.");
                    useRouter().push("/login");
                }

            } catch (error) {
                console.error("🚨 Google 로그인 실패:", error);
            }
        },

        logout() {
            this.token = null;
            this.role = null;
            this.name = null;
            this.grade = null;
            this.level = null;
            this.status = null;

            localStorage.removeItem("accessToken");
            localStorage.removeItem("role");
            localStorage.removeItem("name");
            localStorage.removeItem("grade");
            localStorage.removeItem("level");
            localStorage.removeItem("status");

            window.location.reload();
        },
    }
});
