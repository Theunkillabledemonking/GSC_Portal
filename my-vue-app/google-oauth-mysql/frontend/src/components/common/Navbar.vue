<script setup>
import { computed, ref, onMounted } from 'vue';
import { useAuthStore } from '@/store';
import { useRouter } from 'vue-router';
import LineConnectModal from '../LineConnectModal.vue';

const router = useRouter();
const authStore = useAuthStore();

// Computed properties
const isAdmin = computed(() => authStore.isAdmin);
const isLoggedIn = computed(() => authStore.isLoggedIn);

// Debug: 마운트 시 상태 확인
onMounted(() => {
  console.log('📱 Navbar mounted:', { 
    isLoggedIn: isLoggedIn.value,
    isAdmin: isAdmin.value,
    token: authStore.token,
    role: authStore.role
  });
});

// ✅ 모달 상태
const showLineModal = ref(false);

const logout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <nav
      v-if="isLoggedIn"
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
      <div class="flex items-center gap-4">
        <LineConnectModal v-if="showLineModal" @close="showLineModal = false" />

        <!-- LINE 연동 버튼 -->
        <button 
          @click="showLineModal = true" 
          class="btn-soft flex items-center gap-2 text-sm font-medium hover:opacity-80 transition"
        >
          <img src="@/assets/line_88.png" alt="LINE" class="w-6 h-6" />
          <span>LINE 연동</span>
        </button>

        <!-- 로그아웃 버튼 -->
        <button 
          @click="logout" 
          class="btn-soft text-sm font-semibold hover:opacity-80 transition"
        >
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

.btn-soft {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background-color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>

