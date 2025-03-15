<script setup>
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/services/apiClient"; // Axios 인스턴스 가져오기
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();
const googleAuthUrl = ref(null);

// ✅ Google 로그인 요청
const handleGoogleLogin = async () => {
  try {
    // ✅ 백엔드에서 Google OAuth URL 가져오기
    const response = await apiClient.get("/api/auth/google");

    // ✅ 해당 URL로 이동하여 Google 로그인 진행
    window.location.href = response.data.authUrl;
  } catch (error) {
    console.error("🚨 Google 로그인 URL 요청 실패:", error);
  }
};

// ✅ Google 로그인 콜백 데이터 처리
onMounted(() => {
  window.addEventListener("message", (event) => {
    if (event.origin !== "http://localhost:5173") return;

    const data = event.data;

    if (data.token) {
      // ✅ 토큰을 로컬스토리지 및 Pinia 스토어에 저장
      localStorage.setItem("accessToken", data.token);
      localStorage.setItem("role", data.role);
      authStore.token = data.token;
      authStore.role = data.role;

      alert("✅ 로그인 성공!");

      // ✅ 대시보드로 이동
      router.push("/dashboard");
    } else if (data.needRegister) {
      alert("📝 회원가입이 필요합니다!");
      router.push(`/register?email=${data.email}`);
    } else if (data.error) {
      alert(`❌ 로그인 실패: ${data.error}`);
    }
  });
});
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
