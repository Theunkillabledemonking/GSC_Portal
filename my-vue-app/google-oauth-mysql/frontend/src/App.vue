<script setup>
import { useAuthStore } from '@/store/authStore';
import GoogleLoginButton from '@/components/specific/GoogleLoginButton.vue';

const authStore = useAuthStore();
</script>

<template>
  <div id="app">
    <h1>GSC_Portal</h1>

    <!-- 사용자가 로그인하지 않았을 경우 Google 로그인 버튼 표시 -->
    <GoogleLoginButton v-if="!authStore.token" />

    <!-- 사용자가 로그인 한 경우 대시보드로 이동 -->
    <router-view />
  </div>
</template>

<style scoped>
#app {
  text-align: center;
  margin-top: 100px;
}
</style>
