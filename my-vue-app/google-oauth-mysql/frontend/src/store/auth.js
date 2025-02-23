// ✅ Pinia 스토어: 사용자의 로그인 상태와 토큰 관리
import { defineStore } from "pinia";
import axios from "axios";

// ✅ authStore: 사용자의 상태 및 인증 관련 기능
export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null, // 사용자 정보
    accessToken: localStorage.getItem("accessToken") || null, // Access Token
    refreshToken: localStorage.getItem("refreshToken") || null, // Refresh Token
    isAuthenticated: !!localStorage.getItem("accessToken"), // 로그인 여부
  }),

  getters: {
    // ✅ 현재 사용자의 이름 반환 (없으면 null)
    userName: (state) => state.user?.name || null,
  },

  actions: {
    // ✅ Google OAuth 로그인 (백엔드로 리디렉션)
    loginWithGoogle() {
      window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google`;
    },

    // ✅ Access Token과 Refresh Token을 로컬 스토리지에 저장
    setTokens(accessToken, refreshToken) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.isAuthenticated = true;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    },

    // ✅ 사용자의 프로필 정보를 가져오기
    async fetchUser() {
      if (!this.accessToken) return;

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user`,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
          }
        );
        this.user = response.data.user;
      } catch (error) {
        if (error.response?.status === 401) {
          await this.refreshAccessToken();
        }
      }
    },

    // ✅ Refresh Token으로 Access Token 재발급
    async refreshAccessToken() {
      if (!this.refreshToken) return;

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/auth/refresh-token`,
          {
            refreshToken: this.refreshToken,
          }
        );
        this.setTokens(response.data.accessToken, this.refreshToken);
      } catch (error) {
        this.logout();
      }
    },

    // ✅ 로그아웃 (로컬 스토리지 및 상태 초기화)
    logout() {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.isAuthenticated = false;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
  },
});
