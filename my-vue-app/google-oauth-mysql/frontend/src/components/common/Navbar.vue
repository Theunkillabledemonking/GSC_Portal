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
      <router-link to="/" class="logo">永進專門大學校</router-link>
      <div class="nav-links"></div>
        <router-link to="/notices">공지사항</router-link>
        <router-link to="/calendar">학과 일정</router-link>
        <router-link to="/dashboard" v-if="authStore.isAuthenticated">대시보드</router-link>

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

.nav-links a {
  margin: 0 10px;
  color: white;
  text-decoration: none;
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