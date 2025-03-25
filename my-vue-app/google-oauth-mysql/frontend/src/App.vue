<script setup>
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/common/Navbar.vue';
import { computed } from "vue";

const authStore = useAuthStore();
// const isAuthenticated = computed(() => !!authStore.token);
</script>

<template>
  <div id="app">
    <!-- 로그인한 경우에만 NavBar 표시 -->
    <Navbar v-if="authStore.isAuthenticated" />
    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
#app {
  text-align: center;
}

.navbar {
  position: fixed;  /* ✅ 화면 최상단 고정 */
  top: 0;
  left: 0;
  width: 100%;
  background-color: #1E3A8A;
  padding: 15px 20px;
  color: white;
  z-index: 1000;
}

.content {
  padding-top: 80px;
}

button {
  margin-top: 20px;
  background-color: #4285F4;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #357AE8;
}
</style>
