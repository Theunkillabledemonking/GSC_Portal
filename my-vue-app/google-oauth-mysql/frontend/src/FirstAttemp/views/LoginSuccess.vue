<template>
  <div>구글 로그인 처리중...</div>
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  if (token) {
    localStorage.setItem("token", token);
    // 토큰 저장 후, 실제 구글 폼 링크로 이동
    window.location.href = "https://docs.google.com/forms/d/1uutryAMUHPduDakVf_FusZC23xSwuGLi246nEaGxY9U/edit";
  } else {
    alert("로그인 실패");
    router.push("/login");
  }
});
</script>
