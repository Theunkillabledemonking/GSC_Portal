<template>
  <div v-if="notice">
    <h2>{{ notice.title }}</h2>
    <p>{{ notice.content }}</p>
    <p v-if="notice.is_important">🔥 중요 공지</p>
    <button v-if="authStore.role <= 2" @click="goToEditNotice">수정</button>
    <button v-if="authStore.role === 1 || (authStore.role === 2 && notice.author_id === authStore.userId)" @click="deleteNotice">삭제</button>
  </div>
  <p v-else>📌 공지사항을 불러오는 중...</p>
</template>

<script setup>
import { ref, watch, onMounted, computed  } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNoticeStore } from '@/store/noticeStore.js';
import { useAuthStore } from "@/store/authStore.js";

const noticeStore = useNoticeStore();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

// selectNotice를 'computed'를 활용
const notice = computed(() => noticeStore.selectedNotice);

// ✅ 공지사항 불러오기 함수
const loadNoticeData = async () => {
  await noticeStore.loadNotice(route.params.id);
};
// ✅ 처음 마운트될 때 데이터 불러오기
onMounted(() => {
  loadNoticeData();
});

// ✅ route.params.id가 변경될 때마다 새로운 공지 불러오기
watch(() => route.params.id, async (newId) => {
  if (newId) {
    loadNoticeData();
  }
});

const goToEditNotice = () => {
  router.push(`/notices/edit/${route.params.id}`);
};

const deleteNotice = async () => {
  await noticeStore.removeNotice(route.params.id);
  router.push("/notices");
};

</script>


<style scoped>

</style>