<script setup>
import { useAuthStore } from "@/store/authStore";
import { useRouter, useRoute } from "vue-router";
import { onMounted } from "vue";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();


onMounted(() => {
  // ✅ URL에서 로그인 정보 가져오기
  const token = route.query.token;
  const role = route.query.role || 3;
  const name = route.query.name || "";
  const grade = route.query.grade || "";
  const level = route.query.level || "";
  const status = Number(route.query.status); // 0: 대기, 1: 승인 완료, 2: 거부

  if (token) {
    // ✅ Store에 저장
    authStore.token = token;
    authStore.role = Number(role);
    authStore.name = decodeURIComponent(name);
    authStore.grade = grade;
    authStore.level = level;
    authStore.status = status;

    localStorage.setItem("accessToken", token);
    localStorage.setItem("role", role);
    localStorage.setItem("name", name);
    localStorage.setItem("grade", grade);
    localStorage.setItem("level", level);
    localStorage.setItem("status", status);

    // ✅ 승인 상태에 따른 처리
    if (status === 1) {
      router.push("/dashboard");
    } else if (status === 2) {
      alert("❌ 승인 거부된 사용자입니다.");
      router.push("/login");
    } else {
      alert("⏳ 관리자 승인 대기 중입니다.");
      router.push("/login");
    }
  } else {
    console.error("로그인 토큰이 없습니다.");
    router.push("/login");
  }
});
</script>
<template>
  <div class="login-container">
    <h1>로그인 중...</h1>
    <p v-if="authStore.status === 0">⏳ 승인 대기 중입니다.</p>
    <p v-if="authStore.status === 2" class="error">❌ 승인 거부되었습니다.</p>
<!--    <GoogleLoginButton v-if="!authStore.isAuthenticated" />-->

<!--    <div v-if="authStore.is_verified === 0" class="status-message">-->
<!--      ⏳ 승인 대기 중입니다.-->
<!--    </div>-->

<!--    <div v-if="authStore.is_verified === 2" class="status-message error">-->
<!--      ❌ 승인 거부되었습니다.-->
<!--    </div>-->
<!--  </div>-->
  </div>
</template>

<style scoped>
.login-container {
  text-align: center;
  margin-top: 50px;
}
.status-message {
  margin-top: 20px;
  font-weight: bold;
}
.error {
  color: red;
}
</style>
