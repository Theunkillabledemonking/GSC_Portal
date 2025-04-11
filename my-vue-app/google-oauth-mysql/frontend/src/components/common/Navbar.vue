<script setup>
import { computed, ref } from 'vue';
import { useAuthStore } from '@/store/authStore.js';
import LineConnectModal from '@/components/LineConnectModal.vue';

const authStore = useAuthStore();
const isAdmin = computed(() => Number(authStore.role) === 1);
const isAuthenticated = computed(() => !!authStore.token);

// ✅ 모달 상태
const showLineModal = ref(false);

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
      <!-- 우측 버튼: LINE 친구 + 로그아웃 -->
      <div class="flex items-center">
        <LineConnectModal v-if="showLineModal" @close="showLineModal = false" />

        <!-- 버튼 -->
        <button @click="showLineModal = true" class="btn-soft flex items-center gap-2 text-sm font-medium hover:opacity-80">
          <img src="@/assets/line_88.png" alt="LINE" class="w-6 h-6" />
          <span>LINE 연동</span>
        </button>

        <!-- 로그아웃 버튼 -->
        <button @click="logout" class="btn-soft text-sm font-semibold">
          로그아웃
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
nav a {
  text-decoration: none;
  color: #333;
}
</style>

