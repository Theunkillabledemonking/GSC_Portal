<template>
  <div class="oauth-success">
    <p>로그인 처리 중...</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/authStore';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  console.log("✅ OAuth 성공 페이지 진입");
  console.log("📌 현재 경로:", route.fullPath);
  console.log("📌 쿼리 데이터:", route.query);

  const { token, role, name, grade, level, status } = route.query;

  if (token) {
    console.log("✅ 토큰 감지됨:", token);

    // ✅ 로그인 상태 저장
    authStore.login(token, role, name, grade, level, status);

    if (Number(status) === 1) {
      console.log("✅ 승인 완료, 대시보드로 이동");
      router.push("/dashboard");
    } else if (Number(status) === 2) {
      console.log("❌ 승인 거부됨, 로그인 페이지로 이동");
      alert("❌ 승인 거부된 사용자입니다.");
      router.push("/login");
    } else {
      console.log("⏳ 승인 대기 중, 로그인 페이지 유지");
      alert("⏳ 관리자 승인 대기 중입니다.");
      router.push("/login");
    }
  } else {
    console.error("🚨 로그인 토큰이 없습니다.");
    router.push("/login");
  }
});
</script>

<style scoped>
.oauth-success {
  text-align: center;
  margin-top: 50px;
  font-size: 18px;
  font-weight: bold;
}
</style>
