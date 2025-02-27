<script setup>
import { useAuthStore} from "@/store/authStore.js";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.token = null; //토큰 삭제
  localStorage.removeItem('token'); //로컬 스토리지 삭자
  router.push('/login');
}
</script>

<template>
    <nav class="navbar">
      <div class="nav-title">永進專門大學校</div>
      <button class="logout-button" @click="handleLogout">로그아웃</button>
    </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  background-color: #4CAF50;
  padding: 15px;
  color: white;
}

.logout-button {
  background-color: #4285F4;
  color: white;
  border: none;
  padding: 8px 15px;
  cursor: pointer;
  border-radius: 5px;
}

.logout-button:hover {
  background-color: #357AE8;
}
</style>