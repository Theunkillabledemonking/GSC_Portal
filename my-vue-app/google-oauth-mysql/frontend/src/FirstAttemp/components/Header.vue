<template>
  <header>
    <h1>포털 시스템</h1>

    <!-- ✅ 로그인한 경우에만 메뉴 표시 -->
    <nav v-if="isAuthenticated">
      <router-link to="/board">게시판</router-link> |
      <router-link to="/timetable">시간표</router-link>
    </nav>

    <!-- ✅ 로그인 상태에 따라 버튼 표시 -->
    <div v-if="isAuthenticated">
      <UserProfile />
    </div>
    <div v-else>
      <LoginButton />
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/FirstAttemp/store/auth.js";
import UserProfile from "./UserProfile.vue";
import LoginButton from "./LoginButton.vue";

// ✅ Pinia 스토어 사용
const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);
</script>

<style scoped>
header {
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
nav {
  margin-top: 10px;
}
</style>
