<template>
  <div class="oauth-success">
    <p>로그인 처리 중...</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  try {
    console.log("✅ OAuth 성공 페이지 진입");
    console.log("📌 현재 경로:", route.fullPath);
    console.log("📌 쿼리 데이터:", route.query);

    const { token, id, role, name, grade, level, status } = route.query;

    if (!token) {
      throw new Error("로그인 토큰이 없습니다.");
    }

    const userData = {
      id: Number(id),
      role: Number(role),
      name,
      grade: Number(grade),
      level,
      status: Number(status)
    };

    console.log("🧪 OAuth 로그인 시도:", { token, userData });
    await authStore.oauthLogin(token, userData);

    // 상태에 따른 리디렉션
    const userStatus = Number(status);
    if (userStatus === 1) {
      console.log("✅ 승인 완료, 대시보드로 이동");
      router.push("/main-dashboard");
    } else if (userStatus === 2) {
      alert("❌ 승인 거부된 사용자입니다.");
      router.push("/login");
    } else {
      alert("⏳ 관리자 승인 대기 중입니다.");
      router.push("/login");
    }
  } catch (error) {
    console.error("🚨 OAuth 로그인 실패:", error);
    alert("로그인 처리 중 오류가 발생했습니다.");
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
