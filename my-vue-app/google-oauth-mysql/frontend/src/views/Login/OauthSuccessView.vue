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

    const user = {
      role: Number(role),
      name,
      grade: Number(grade),
      level,
      status: Number(status),
      email: '', // 필요시 추가
    };

    console.log("🧪 login 파라미터:", token, user);
    authStore.login(token, user);

    if (user.status === 1) {
      console.log("✅ 승인 완료, 대시보드로 이동");
      router.push("/main-dashboard");
    } else if (user.status === 2) {
      alert("❌ 승인 거부된 사용자입니다.");
      router.push("/login");
    } else {
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
