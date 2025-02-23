<template>
  <div class="login-button">
    <button @click="loginWithGoogle">Google 로그인</button>
  </div>
</template>

<script>
import { useAuthStore } from "@/store/auth";

export default {
  name: "LoginButton",
  setup() {
    const authStore = useAuthStore();

    const loginWithGoogle = () => {
      authStore.loginWithGoogle(); // ✅ Google OAuth 로그인 요청
    };

    return { loginWithGoogle };
  },
};
</script>

<style scoped>
.login-button button {
  padding: 10px 15px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
}
</style>
