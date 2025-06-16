<script setup>
import { useAuthStore } from '@/store'
import { computed, onMounted, watch } from 'vue'
import Navbar from '@/components/common/Navbar.vue';

const authStore = useAuthStore();
const isLoggedIn = computed(() => authStore.isLoggedIn);

// Debug: 상태 변화 감지
watch(() => authStore.isLoggedIn, (newValue) => {
  console.log('🔐 Auth state changed:', { 
    isLoggedIn: newValue,
    token: authStore.token,
    role: authStore.role
  });
});

onMounted(() => {
  console.log('🔍 Initial auth state:', { 
    isLoggedIn: authStore.isLoggedIn,
    token: authStore.token,
    role: authStore.role
  });
});
</script>

<template>
  <div class="min-h-screen bg-idolGray font-idol text-center">
    <!-- ✅ 로그인한 경우에만 NavBar 표시 -->
    <Navbar v-if="isLoggedIn" />

    <!-- ✅ 상단 여백 확보 (navbar 고정 때문에) -->
    <div class="pt-20 max-w-7xl mx-auto px-4 py-6">
      <router-view />
    </div>
  </div>
</template>
