<script setup>
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/common/Navbar.vue';

const authStore = useAuthStore();
</script>

<template>
  <div class="min-h-screen bg-idolGray font-idol text-center">
    <!-- ✅ 로그인한 경우에만 NavBar 표시 -->
    <Navbar v-if="authStore.isAuthenticated" />

    <!-- ✅ 상단 여백 확보 (navbar 고정 때문에) -->
    <div class="pt-20 max-w-7xl mx-auto px-4 py-6">
      <router-view />
    </div>
  </div>
</template>
