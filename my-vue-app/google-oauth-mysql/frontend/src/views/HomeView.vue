<script setup>
// Pinia 스토어와 Vue Router 사용
import { onMounted} from "vue";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from 'vue-router';

// Pinia 스토어와 Vue Router 인스턴스 초기화
const authStore = useAuthStore();
const router = useRouter();

// 로그인 페이지로 이동
const goToLogin = () => {
  router.push("/login");
}

// 메인 대시보드로 이동
const goToMainDashBoard = () => {
  router.push("/main-dashboard");
}

// 로그인 상태일 경우 바로 메인으로 이동
onMounted(() => {
  if (authStore.token) {
    router.push("/main-dashboard");
  }
});
</script>

<template>
  <div class="home">
    <!-- 로그인 상태에 따라 다른 버튼 표시 -->
    <button v-if="!authStore.token" @click="goToLogin">로그인</button>
    <button v-else @click="goToMainDashBoard">메인으로 이동</button>
  </div>
</template>

<style scoped>
.home {
  text-align: center;
  margin-top: 100px;
}

button {
  padding: 10px 20px;
  font-size: 18px;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:first-of-type {
  background-color: #007bff; /* 로그인 버튼 */
}

button:last-of-type {
  background-color: #4caf50; /* 메인 이동 버튼 */
}

button:hover {
  opacity: 0.9;
}
</style>
