<script setup>
import { useAuthStore } from "../store/auth";

const authStore = useAuthStore();

const loginWithGoogle = () => {
  authStore.loginWithGoogle();
};
</script>

<template>
  <button @click="loginWithGoogle" class="login-btn">Google로 로그인</button>
</template>

<style scoped>
.login-btn {
  padding: 10px 20px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
</style>
