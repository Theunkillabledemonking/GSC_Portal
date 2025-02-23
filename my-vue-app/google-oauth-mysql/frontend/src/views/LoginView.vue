<template>
  <div>
    <h2>로그인</h2>
    <button @click="googleLogin">Google 로그인</button>
  </div>
</template>

<script setup>
import { useAuthStore } from '../store/auth.js';

const authStore = useAuthStore();

// Google 로그인
const loginWithGoogle = () => {
  window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google`;
}
</script>

<style scoped>
.login-page {
  text-align: center;
  margin-top: 100px;
}
button {
  padding: 10px 20px;
  background-color: #4285F4;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}