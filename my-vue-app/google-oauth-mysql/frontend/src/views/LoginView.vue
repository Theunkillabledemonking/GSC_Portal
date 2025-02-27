<script setup>
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'vue-router';
import GoogleLoginButton from "@/components/specific/GoogleLoginButton.vue";

const authStore = useAuthStore();
const router = useRouter();

// 로그인 상태라면 대시보드로 이동
if (authStore.token) {
  router.push('/dashboard');
}
</script>

<template>
  <div class="login-container">
    <h1>로그인</h1>
    <GoogleLoginButton />
  </div>
</template>

<style scoped>
.login-container {
  text-align: center;
  margin-top: 100px;
}
</style>