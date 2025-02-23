<template>
  <div class="home">
    <Header />
    <router-view />
    <LoginButton />
    <UserProfile />
    <h1>포털 메인 페이지</h1>
    <nav>
      <router-link to="/board">게시판</router-link> |
      <router-link to="/timetable">시간표</router-link> |
      <router-link to="/inquiry">문의사항</router-link>
    </nav>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useUserStore } from "../store/user.js";
import Header from "../components/Header.vue"; // 확장자 추가

import LoginButton from "@/components/LoginButton.vue";
import UserProfile from "@/components/UserProfile.vue";

export default {
  name: "Home",
  component: { LoginButton, UserProfile },
};

defineOptions({
  name: "HomeView",
});

const userStore = useUserStore();

onMounted(() => {
  userStore.fetchUser(); // fetchUser() 한 번만 호출
});
</script>

<style scoped>
.home {
  text-align: center;
  margin-top: 50px;
}
</style>
