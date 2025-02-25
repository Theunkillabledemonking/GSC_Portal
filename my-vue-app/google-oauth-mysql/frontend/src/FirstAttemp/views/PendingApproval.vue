<template>
  <div class="pending-approval">
    <div class="icon-container">
    </div>

    <h1>승인 대기 중입니다.</h1>

    <div class="faq-section">
      <h2>자주 묻는 질문</h2>
      <ul>
        <li>✅ 승인까지는 최대 24시간이 소요됩니다.</li>
        <li>💡 문제가 있으면 관리자에게 문의하세요.</li>
      </ul>
    </div>

    <div class="button-container">
      <button @click="goHome" class="btn-primary">홈으로 돌아가기</button>
      <button @click="logout" class="btn-secondary">로그아웃</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/FirstAttemp/store/auth.js';

const router = useRouter();
const authStore = useAuthStore();

// 홈으로 돌아가기
const goHome = () => {
  router.push('/');
};

// 로그아웃
const logout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.pending-approval {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
}

.icon-container img {
  width: 150px;
  height: 150px;
  margin-bottom: 20px;
}

h1 {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

p {
  font-size: 1.2rem;
  color: #555;
  margin-bottom: 30px;
}

.faq-section {
  margin-bottom: 30px;
  text-align: left;
}

.faq-section h2 {
  font-size: 1.5rem;
  margin-bottom: 10px;
}

.faq-section ul {
  list-style: none;
  padding: 0;
  font-size: 1rem;
}

.button-container {
  display: flex;
  gap: 10px;
}

.btn-primary {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
}

.btn-secondary {
  padding: 10px 20px;
  background-color: #ccc;
  color: #333;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
}

.btn-primary:hover {
  background-color: #45a049;
}

.btn-secondary:hover {
  background-color: #b3b3b3;
}
</style>
