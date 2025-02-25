import { defineStore } from "pinia";
import axios from "axios";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    accessToken: localStorage.getItem("accessToken") || null,
    refreshToken: localStorage.getItem("refreshToken") || null,
    isAuthenticated: (state) => !!state.accessToken && !!state.user,
  }),

  getters: {
    userName: (state) => state.user?.name || null,
    isAdmin: (state) => state.user?.user_type === "ADMIN",
    isApproved: (state) => state.user?.is_approved === 1,
    isFirstInput: (state) => state.user?.is_first_input === 1,
  },

  actions: {
    // ✅ Google OAuth 로그인
    loginWithGoogle() {
      window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google`;
    },

    // ✅ Access Token과 Refresh Token을 로컬 스토리지에 저장
    setTokens(accessToken, refreshToken) {
      if (!accessToken || !refreshToken) return;

      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.isAuthenticated = true;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      this.fetchUser();
    },

    // ✅ 사용자 정보 가져오기 (Access Token 사용)
    async fetchUser() {
      if (!this.accessToken) return;

      try {
        const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/user-status`,
            {
              headers: { Authorization: `Bearer ${this.accessToken}` },
            }
        );
        this.user = response.data; // ✅ 사용자 정보 저장
      } catch (error) {
        if (error.response?.status === 401) await this.refreshAccessToken();
      }
    },

    // ✅ Refresh Token을 사용하여 Access Token 재발급
    async refreshAccessToken() {
      if (!this.refreshToken) return;

      try {
        const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/auth/refresh-token`,
            { refreshToken: this.refreshToken }
        );
        this.accessToken = response.data.accessToken;
        this.isAuthenticated = true;
        sessionStorage.setItem("accessToken", this.accessToken);
      } catch (error) {
        this.logout();
      }
    },

    // ✅ 로그아웃
    logout() {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.isAuthenticated = false;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      sessionStorage.clear();

      delete axios.defaults.headers.common["Authorization"];
    },
  },
});
