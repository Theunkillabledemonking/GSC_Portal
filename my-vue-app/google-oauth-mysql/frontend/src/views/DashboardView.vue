<template>
  <div class="dashboard">
    <h1>대시보드</h1>

    <!-- 사용자 이름 표시 -->
    <p>환영합니다, {{ userName }}님!</p>

    <!-- 일반 사용자용 버튼 -->
    <button @click="goToUserProfile">내 프로필</button>

    <!-- ✅ 관리자인 경우에만 보이는 버튼 -->
    <button v-if="isAdmin" @click="goToAdminPage">회원 관리(Admin)</button>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();
console.log("현재 role 값:", authStore.role);
// ✅ 로그인한 사용자 정보 가져오기
const userName = computed(() => authStore.name || "사용자");
const isAdmin = computed(() => Number(authStore.role) === 1); // 관리자(1)만 true

// ✅ 사용자 프로필 페이지 이동
const goToUserProfile = () => {
  router.push("/profile");
};

// ✅ 관리자 페이지 이동 (회원 관리 페이지)
const goToAdminPage = () => {
  router.push("/admin/users");
};

onMounted(() => {
  authStore.fetchUserInfo(); // 사용자 정보 불러오기
});

</script>

<style scoped>
  .dashboard {
    text-align: center;
  margin-top: 50px;
}

  button {
  padding: 10px 15px;
  margin: 10px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

  button:first-of-type {
    background-color: #4caf50;
  color: white;
}

  button:last-of-type {
    background-color: #ff4d4d;
  color: white;
}
</style>