<template>
  <div id="app">
    <Header />
    <router-view />
  </div>
</template>

<script setup>
import { useAuthStore } from "@/store/auth";
import { useRouter } from "vue-router";
import { onMounted, watch } from "vue";

const authStore = useAuthStore();
const router = useRouter();

// ✅ 컴포넌트가 마운트된 후 실행
onMounted(() => {
  authStore.fetchUser().then(() => {
    if (authStore.user?.is_first_input === 1) {
      router.push("/pending-approval");
    }
  });
});

// ✅ 사용자 정보가 업데이트될 때도 확인 (Pinia의 상태 변경 감지)
watch(
    () => authStore.user?.is_first_input,
    (newValue) => {
      if (newValue === 1) {
        router.push("/pending-approval");
      }
    }
);
</script>
