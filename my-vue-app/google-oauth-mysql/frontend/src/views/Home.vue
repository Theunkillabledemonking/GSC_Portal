<template>
  <div class="home">
    <Header />

    <!-- ✅ 승인 상태에 따라 화면 표시 -->
    <div v-if="isAuthenticated && !isPendingApproval">
      <h1>포털 메인 페이지</h1>
    </div>

    <div v-else-if="isPendingApproval">
      <h1>승인 대기 중입니다.</h1>
      <p>관리자가 승인하면 알림을 통해 알려드립니다.</p>
      <button @click="logout" class="btn-secondary">로그아웃</button>
    </div>

    <div v-else>
      <LoginButton />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import Header from "@/components/Header.vue";
import LoginButton from "../components/LoginButton.vue";
import { useAuthStore } from "@/store/auth";

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);
const isPendingApproval = computed(() => authStore.user?.is_first_input === 1);

// ✅ 로그아웃 함수
const logout = () => {
  authStore.logout();
  window.location.href = "/";
};

// ✅ 사용자 승인 상태 확인
onMounted(async () => {
  if (isAuthenticated.value) {
    await authStore.fetchUser();
  }
});
</script>
