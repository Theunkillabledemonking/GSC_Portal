<script setup>
import RegisterUserForm from '@/components/specific/RegisterUserForm.vue';
import { useAuthStore } from "@/store/authStore";
import { useRouter } from 'vue-router';

// Pinia 스토어 및 Vue Router 초기화
const authStore = useAuthStore();
const router = useRouter();

// 사용자 정보 제출 함수
const handleSubmit = async (userData) => {
  await authStore.register(userData);
  alert('회원가입 완료. 승인 대기 중입니다.');
  router.push('/login'); // 로그인 페이지로 이동
};
</script>

<template>
  <div class="register">
    <h1>사용자 정보 입력</h1>
    <RegisterUserForm @submit="handleSubmit" />
  </div>
</template>

<style scoped>
.register {
  text-align: center;
  margin-top: 50px;
}
</style>