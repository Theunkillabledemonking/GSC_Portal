<script setup>
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/common/Navbar.vue';
import { computed } from "vue";

const authStore = useAuthStore();
const isAuthenticated = computed(() => !!authStore.token);
</script>

<template>
  <div id="app">
    <!-- 로그인한 경우에만 NavBar 표시 -->
    <Navbar v-if="isAuthenticated" />

    <router-view />
  </div>
</template>

<style scoped>
#app {
  text-align: center;
  margin-top: 100px;
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
