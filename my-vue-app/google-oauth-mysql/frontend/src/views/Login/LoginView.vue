<template>
  <div class="login-container">
    <h1>GSC 포털 로그인</h1>
    <!-- GoogleLoginButton 컴포넌트를 렌더링 -->
    <GoogleLoginButton />
    <!-- 필요 시 에러 메시지 표시 -->
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import GoogleLoginButton from '@/components/GoogleLoginButton.vue';

import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/authStore";
import { ref, onMounted } from "vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  if (route.query.error === "invalid_email") {
    alert('학교 이메일이 아닙니다. 로그인할 수 없습니다.');
    authStore.logout(); // 강제 로그아웃
    router.push('/login'); // 로그인 페이지로 리다이렉트
  }
})

const errorMessage = ref('');
</script>

<style scoped>
.login-container {
  text-align: center;
  margin-top: 50px;
}
.error {
  color: red;
  font-weight: bold;
  margin-top: 20px;
}
</style>
