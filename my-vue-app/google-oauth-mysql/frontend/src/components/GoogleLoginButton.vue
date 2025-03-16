<script setup>
import apiClient from "@/services/apiClient"; // Axios 인스턴스 가져오기

// ✅ Google 로그인 요청
const handleGoogleLogin = async () => {
  try {
    // ✅ 백엔드에서 Google OAuth URL 가져오기
    const response = await apiClient.get("/auth/google");

    // ✅ 해당 URL로 이동하여 Google 로그인 진행
    window.location.href = response.data.authUrl;
  } catch (error) {
    console.error("🚨 Google 로그인 URL 요청 실패:", error);
  }
};

</script>

<template>
  <div class="google-login-button">
    <button @click="handleGoogleLogin">Google 로그인</button>
  </div>
</template>

<style scoped>
.google-login-button button {
  display: inline-block;
  padding: 10px 20px;
  background-color: #4285F4;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}
.google-login-button button:hover {
  background-color: #357AE8;
}
</style>
