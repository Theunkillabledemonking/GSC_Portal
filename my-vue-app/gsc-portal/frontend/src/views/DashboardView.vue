<template>
  <div class="dashboard">
    <h1>GSC 포털대시보드</h1>

    <!-- 사용자 이름 표시 -->
    <p> 안녕하세요! {{ userName }}님!</p>

    <div class="buttons">
      <button @click="goToUserProfile">내 프로필</button>
      <button v-if="isAdmin" @click="goToAdminPage">회원 관리</button>
      <button @click="goToNotices">공지사항 보기</button>
      <button @click="goToCalendar">학사일정 보기</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useAuthStore } from "@/store";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();
console.log("현재 role 값:", authStore.role);

// ✅ 로그인한 사용자 정보 가져오기
const userName = computed(() => authStore.name || "사용자");
const isAdmin = computed(() => Number(authStore.role) === 1); // 관리자(1)만 true

onMounted( () => {
  if (!authStore.token) {
    router.push("/login");
  }
});


// ✅ 사용자 프로필 페이지 이동
function goToUserProfile() {
  router.push("/profile");
}
// ✅ 관리자 페이지 이동 (회원 관리 페이지)
function goToAdminPage() {
  router.push("/admin/users");
}
function goToNotices() {
  router.push("/notices");
}
function goToCalendar() {
  router.push("/calendar");
}
function goToNoticesDetail(id) {
  router.push(`/notices/${id}`);
}


</script>

<style scoped>
.dashboard {
  text-align: center;
  padding: 20px;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  margin: 5px 0;
}
a {
  cursor: pointer;
  color: #007bff;
  text-decoration: underline;
}

.buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
}
button {
  padding: 10px 15px;
}
</style>