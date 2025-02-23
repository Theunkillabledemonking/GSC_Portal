<template>
  <div class="home">
    <Header />
    <nav>
      <router-link to="/board">게시판</router-link> |
      <router-link to="/timetable">시간표</router-link> |
      <router-link to="/inquiry">문의사항</router-link>
    </nav>

    <div v-if="isAuthenticated">
      <LoginButton />
      <UserProfile />
      <h1>포털 메인 페이지</h1>
    </div>
    <div v-else>
      <p>로그인 후 이용해 주세요.</p>
      <router-link to="/login"></router-link>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useUserStore } from "../store/user.js";
import Header from "../components/Header.vue"; // 확장자 추가
import LoginButton from "@/components/LoginButton.vue";
import UserProfile from "@/components/UserProfile.vue";
import { useAuthStore } from "../store/auth.js";

const authStore = useAuthStore();
const isAuthenticated = authStore.isAuthenticated; // 로그인 상태 가져오기;
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
