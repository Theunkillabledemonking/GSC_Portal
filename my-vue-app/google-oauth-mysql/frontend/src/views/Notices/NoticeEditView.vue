<template>
  <div v-if="loaded">
  <NoticeForm :isEdit="true" :initialData="notice" @submit="handleUpdate" />
  </div>
  <p v-else>데이터를 불러오는 중...</p>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNoticeStore } from "@/store";
// FIXME: NoticeForm 컴포넌트가 존재하지 않음
// import NoticeForm from "@/components/specific/NoticeForm.vue";

const noticeStore = useNoticeStore();
const route = useRoute();
const router = useRouter();
const notice = ref({});
const loaded = ref(false);

// 기존 공지사항 데이터 불러오기
onMounted(async() => {
  const fetched = await noticeStore.loadNotice(route.params.id);
  notice.value = fetched;
  loaded.value = true;
});

const handleUpdate = async (formData) => {
  await noticeStore.editNotice(route.params.id, formData);
  router.push("/notices");
}
</script>

