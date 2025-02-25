<script setup>
// Pinia 스토어와 Vue Router 사용
import { useAuthStore } from "@/store/authStore";
import { useRouter } from 'vue-router';

// Pinia 스토어와 Vue Router 인스턴스 초기화
const authStore = useAuthStore();
const router = useRouter();

// 로그인 페이지로 이동
const goToLogin = () => {
  router.push("/login");
}

// 대시보드 페이지로 이동
const goToDashBoard = () => {
  router.push("/dashboard");
}
</script>

<template>
  <div class="home">

    <!-- 로그인 상태에 따라 버튼 표시 -->
    <button v-if="!authStore.token" @click="goToLogin">로그인</button>
    <button v-else @click="goToDashBoard">대시보드</button>
  </div>
</template>

<style scoped>
.home {
  text-align: center;
  margin-top: 100px;
}

button {
  padding: 10px 20px;
  font-size: 18px;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #4caf50;
}
</style>