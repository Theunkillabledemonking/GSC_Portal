<script setup>
import { useRouter } from "vue-router";
import { useNoticeStore } from "@/store/noticeStore.js";
import NoticeForm from "@/components/specific/NoticeForm.vue";

const router = useRouter();
const noticeStore = useNoticeStore();

async function handleCreate(noticeData) {
  try {
    // 부모에서 store.addNotice 호출 (자식에서 이미 emit 했음)
    await noticeStore.addNotice(noticeData, noticeData.files);
    console.log("공지사항 등록 성공");

    // ✅ 작성 후 목록으로 자동 이동
    router.push("/notices");
  } catch (error) {
    console.error("공지사항 등록 실패:", error);
  }
}
</script>

<template>
  <NoticeForm :isEdit="false" @submitted="handleCreate"/>
</template>
