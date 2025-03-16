<script setup>
import RegisterUserForm from '@/components/specific/RegisterUserForm.vue';
import { useAuthStore } from "@/store/authStore.js";
import { useRouter } from 'vue-router';

// Pinia 스토어 및 Vue Router 초기화
const authStore = useAuthStore();
const router = useRouter();

// 사용자 정보 제출 함수
const handleSubmit = async (userData) => {
  try {
    const { success } = await authStore.register(userData);

    if (success) {
      alert("⏳ 관리자 승인이 필요합니다. 가입이 완료되었습니다!");
      router.push("/login");
    } else {
      alert("회원가입 처리 중 오류가 발생했습니다.");
    }
  } catch (error) {
    console.log("회원가입 오류:", error);
    alert("회원가입 처리 중 오류가 발생했습니다.");
  }
};
</script>

<template>
  <div class="register">
    <h1>사용자 정보 입력</h1>
    <!-- 자식 컴포넌트에 submit 이벤트 핸들러 연결 -->
    <RegisterUserForm @submit="handleSubmit"/>
  </div>
</template>

<style scoped>
.register {
  text-align: center;
  margin-top: 50px;
}
</style>