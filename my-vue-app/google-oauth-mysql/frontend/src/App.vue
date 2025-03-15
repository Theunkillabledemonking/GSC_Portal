<script setup>
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/common/Navbar.vue';
import GoogleLoginButton from '@/components/GoogleLoginButton.vue';

const authStore = useAuthStore();
</script>

<template>
  <div id="app">
    <!-- 로그인한 경우에만 NavBar 표시 -->
    <Navbar v-if="authStore.token" />

    <h1>GSC_Portal</h1>

    <!-- 사용자가 로그인하지 않았을 경우 Google 로그인 버튼 표시 -->
    <GoogleLoginButton v-if="!authStore.token"/>

    <!-- 사용자가 로그인 한 경우 대시보드로 이동 -->
    <router-view />
  </div>
</template>

<style scoped>
#app {
  text-align: center;
  margin-top: 100px;
}

button {
  margin-top: 20px;
  background-color: #4285F4;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #357AE8;
}
</style>
