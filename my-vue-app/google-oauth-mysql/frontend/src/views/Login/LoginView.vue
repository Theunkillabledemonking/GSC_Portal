<template>
  <div class="login-page">
    <!-- 상단 로고 이미지 -->
    <img
        src="@/assets/globalsys.svg"
        alt="영진전문대학교 글로벌시스템융합과"
        class="top-logo"
    />

    <!-- 가운데 구글 로그인 -->
    <div class="center-content">
      <GoogleLoginButton />
      <p class="notice">@g.yju.ac.kr로 끝나는 Google 계정만 사용 가능합니다.</p>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import GoogleLoginButton from '@/components/GoogleLoginButton.vue';

import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store";
import { ref, onMounted } from "vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  const error = route.query.error;

  if (error === "invalid_email") {
    alert("학교 이메일이 아닙니다. 로그인할 수 없습니다.");
    authStore.logout();

    // 쿼리 파라미터 제거
    router.replace({ path: route.path, query: {} });
  }
})

const errorMessage = ref('');
</script>

<style scoped>
.login-page {
  background-color: #f9f9f9;
  min-height: 100vh;
  position: relative;
}

/* 상단 좌측에 고정된 로고 이미지 */
.top-logo {
  position: absolute;
  top: 40px;
  left: 40px;
  height: 60px; /* 필요에 따라 크기 조정 가능 */
  object-fit: contain;
}

/* 로그인 버튼 중앙 */
.center-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.notice {
  font-size: 0.85rem;
  color: #888;
  margin-top: 10px;
}

.error {
  color: red;
  font-weight: bold;
  margin-top: 10px;
}
</style>
