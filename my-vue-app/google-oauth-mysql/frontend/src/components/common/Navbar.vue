<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/store/authStore.js";

const authStore = useAuthStore();
const isAdmin = computed(() => Number(authStore.role) === 1); // 관리자
const isProfessor = computed(() => Number(authStore.role) === 2); // 교수
const isAuthenticated = computed(() => !!authStore.token);

const logout = () => {
  authStore.logout();
};
</script>

<template>
  <nav v-if="isAuthenticated" class="navbar">
    <router-link to="/main-dashboard" class="logo">永進專門大學校</router-link>

    <ul class="nav-links">
      <li><router-link to="/notices">공지사항</router-link></li>
      <li><router-link to="/timetables">시간표</router-link></li>
      <li><router-link to="/calendar">학과 일정</router-link></li>
      <li><router-link to="/dashboard">대시보드</router-link></li>

      <!-- 관리자 전용 메뉴 -->
      <template v-if="isAdmin">
        <li><router-link to="/admin/users">사용자 관리</router-link></li>
        <li><router-link to="/admin/subjects">과목 관리</router-link></li>
      </template>
    </ul>

    <button class="logout-button" @click="logout">로그아웃</button>
  </nav>
</template>
<style scoped>
/* ✅ 네비바 기본 스타일 */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #1E3A8A;
  padding: 15px 40px; /* 🔹 상하 여백 추가 */
  color: white;
}

/* ✅ 네비게이션 메뉴 */
.nav-links {
  display: flex;
  gap: 20px; /* 🔹 메뉴 간격 조정 */
}

/* ✅ 네비게이션 링크 스타일 */
.nav-links a {
  color: white;
  text-decoration: none;
  font-size: 16px;
  padding: 10px 15px; /* 🔹 클릭 영역 확장 */
}

.nav-links a:hover {
  text-decoration: underline;
}

/* ✅ 로그아웃 버튼 스타일 */
.logout-button {
  background-color: #EF4444;
  color: white;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
  border-radius: 5px;
  margin-left: 30px; /* 🔹 로그아웃 버튼이 오른쪽 끝으로 가지 않도록 조정 */
}

.logout-button:hover {
  background-color: #D32F2F;
}

/* ✅ 로고 스타일 */
.logo {
  font-weight: bold;
  font-size: 20px;
  text-decoration: none;
  color: white;
}

/* ✅ 반응형 (모바일 대응) */
@media screen and (max-width: 768px) {
  .navbar {
    flex-direction: column;
    align-items: center;
  }

  .nav-links {
    flex-direction: column;
    gap: 15px;
  }

  .logout-button {
    margin-top: 10px;
  }
}
</style>
