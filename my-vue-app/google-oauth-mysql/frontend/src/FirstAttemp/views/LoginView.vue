<template>
  <div class="login-page">
    <h2>로그인</h2>
    <button @click="loginWithGoogle">Google 로그인</button>
  </div>
</template>

<script setup>
import { useAuthStore } from '../store/auth.js';

const authStore = useAuthStore();

// ✅ Google 로그인 함수
const loginWithGoogle = () => {
  authStore.loginWithGoogle(); // ✅ authStore의 메서드 사용
};
</script>

<style scoped>
.login-page {
  text-align: center;
  margin-top: 50px;
}

.login-page h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
}

button {
  padding: 10px 20px;
  background-color: #4285F4;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #357AE8;
}
</style>
