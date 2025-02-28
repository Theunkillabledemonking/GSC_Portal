<template>
  <div v-if="loaded">
  <NoticeForm :isEdit="true" :initialData="noticeStore.selectedNotice" />
  </div>
  <p v-else>데이터를 불러오는 중...</p>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useNoticeStore } from "@/store/noticeStore.js";
import NoticeForm from "@/components/specific/NoticeForm.vue";

const noticeStore = useNoticeStore();
const route = useRoute();
const notice = ref({});
const loaded = ref(false);

// 기존 공지사항 데이터 불러오기
onMounted(async() => {
  await noticeStore.loadNotice(route.params.id);
  notice.value = { ...noticeStore.selectedNotice }; // pinia 데이터 복사
  loaded.value = true;
});
</script>

