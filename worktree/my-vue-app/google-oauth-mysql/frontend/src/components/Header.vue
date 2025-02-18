<template>
  <header>
    <h1>포털 시스템</h1>
    <div v-if="userStore.isLoggedIn">
      <p>환영합니다, {{ userStore.username}}!</p>
      <button @click="logout">로그아웃</button>
    </div>
    <div v-else>
      <router-link to="/login">로그인</router-link>
    </div>
  </header>
</template>

<script setup>
  import { useUserStore } from "../store/user.js";
  import {computed, watch} from "vue";

  const userStore = useUserStore();

  // 반응형으로 상태 감시
  const isLoggedIn = computed(() => userStore.isLoggedIn);
  const username = computed(() => userStore.username);

  // localStorage 변경 감지
  watch(() => localStorage.getItem("isLoggedIn"), (newVal) => {
    userStore.isLoggedIn = newVal === true;
  });

  const logout = () => {
    userStore.logout();
  };
</script>
