<script setup>
import { useAuthStore } from "@/store/authStore";
import GoogleLoginButton from "@/components/GoogleLoginButton.vue";
import { useRouter, useRoute } from "vue-router";
import { onMounted } from "vue";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

onMounted(async () => {
  const code = route.query.code; // ✅ Google OAuth에서 받은 인증 코드
  if (code) {
    await authStore.loginWithGoogle(code); // 로그인 처리

    // ✅ 로그인 후 승인 상태 확인 후 자동 이동
    if (authStore.is_verified === 1) {
      router.push("/dashboard");
    }
  }
});
</script>

<template>
  <div class="login-container">
    <h1>학교 포털 로그인</h1>

    <GoogleLoginButton v-if="!authStore.isAuthenticated" />

    <div v-if="authStore.is_verified === 0" class="status-message">
      ⏳ 승인 대기 중입니다.
    </div>

    <div v-if="authStore.is_verified === 2" class="status-message error">
      ❌ 승인 거부되었습니다.
    </div>
  </div>
</template>

<style scoped>
.login-container {
  text-align: center;
  margin-top: 50px;
}
.status-message {
  margin-top: 20px;
  font-weight: bold;
}
.error {
  color: red;
}
</style>
