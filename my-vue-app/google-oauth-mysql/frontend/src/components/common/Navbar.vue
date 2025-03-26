<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/store/authStore.js';

const authStore = useAuthStore();
const isAdmin = computed(() => Number(authStore.role) === 1);
const isAuthenticated = computed(() => !!authStore.token);

const logout = () => {
  authStore.logout();
};
</script>

<template>
  <nav
      v-if="isAuthenticated"
      class="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-white/40 shadow-sm font-idol"
  >
    <div class="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
      <!-- 로고 -->
      <router-link to="/main-dashboard" class="text-idolPurple text-xl font-bold tracking-wide hover:opacity-80">
        永進專門大學校
      </router-link>

      <!-- 메뉴 -->
      <ul class="flex gap-6 text-sm font-medium">
        <li>
          <router-link to="/notices" class="hover:text-idolPink transition">공지사항</router-link>
        </li>
        <li>
          <router-link to="/timetables" class="hover:text-idolPurple transition">시간표</router-link>
        </li>
        <li>
          <router-link to="/calendar" class="hover:text-idolBlue transition">학과 일정</router-link>
        </li>
        <li>
          <router-link to="/dashboard" class="hover:text-idolBlueLight transition">대시보드</router-link>
        </li>
        <li v-if="isAdmin">
          <router-link to="/admin" class="hover:text-idolPink transition">관리자 페이지</router-link>
        </li>
      </ul>

      <!-- 로그아웃 -->
      <button @click="logout" class="btn-soft text-sm font-semibold ml-4">
        로그아웃
      </button>
    </div>
  </nav>
</template>

<style scoped>
nav a {
  text-decoration: none;
  color: #333;
}
</style>

