<template>
  <div v-if="isAuthenticated" class="user-profile">
    <p>안녕하세요, {{ userName }}님!</p>
    <button @click="logout">로그아웃</button>
  </div>
</template>

<script>
import { useAuthStore } from "@/store/auth";
import { computed } from "vue";

export default {
  name: "UserProfile",
  setup() {
    const authStore = useAuthStore();

    const userName = computed(() => authStore.userName);
    const isAuthenticated = computed(() => authStore.isAuthenticated);

    const logout = () => {
      authStore.logout(); // ✅ 사용자를 로그아웃합니다.
    };

    return { userName, isAuthenticated, logout };
  },
};
</script>

<style scoped>
.user-profile {
  text-align: center;
  margin-top: 20px;
}
.user-profile p {
  font-size: 18px;
  margin-bottom: 10px;
}
.user-profile button {
  padding: 8px 12px;
  background-color: #ff5555;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
</style>
