<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/store/authStore.js";

const authStore = useAuthStore();
const isAdmin = computed(() => Number(authStore.role) === 1); // 관리자
const isProfessor = computed(() => Number(authStore.role) === 2); // 교수

const isAuthenticated = computed(() => !!authStore.token);

const logout = () => {
  authStore.logout();
}
</script>

<template>
  <nav v-if="isAuthenticated" class="navbar">
    <router-link to="/" class="logo">永進專門大學校</router-link>

    <ul class="nav-links">
      <li><router-link to="/notices">공지사항</router-link></li>
      <li><router-link to="/calendar">학과 일정</router-link></li>
      <li v-if="authStore.isAuthenticated"><router-link to="/dashboard">대시보드</router-link></li>
      <li v-if="authStore.isAuthenticated"><router-link to="/timetables">시간표</router-link></li>

      <!-- 관리자 전용 메뉴 -->
      <template v-if="isAdmin">
        <li><router-link to="/admin/users">사용자 관리</router-link></li>
        <li><router-link to="/admin/subjects">과목 관리</router-link></li>
      </template>

      <!-- 교수 전용 메뉴 (추가 가능) -->
      <template v-if="isProfessor">
        <!-- 필요하면 교수만 보는 메뉴 추가 가능 -->
      </template>
    </ul>

    <button class="logout-button" @click="logout">로그아웃</button>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #4CAF50;
  padding: 15px;
  color: white;
}

.nav-links {
  display: flex;
  gap: 15px;
}

.nav-links a {
  color: white;
  text-decoration: none;
}

.nav-links a:hover {
  text-decoration: underline;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 15px;
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

.logo {
  font-weight: bold;
  font-size: 18px;
  text-decoration: none;
  color: white;
}
</style>
