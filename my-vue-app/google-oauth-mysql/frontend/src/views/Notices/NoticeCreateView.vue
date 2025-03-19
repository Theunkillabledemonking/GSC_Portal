<script setup>
import { useNoticeStore } from "@/store/noticeStore.js";
import NoticeForm from "@/components/specific/NoticeForm.vue";
import { useRouter } from "vue-router";

const noticeStore = useNoticeStore();
const router = useRouter();

const handleCreate = async (formData) => {
  await noticeStore.addNotice(formData);
  router.push("/notices");
}
</script>

<template>
  <NoticeForm :isEdit="false" @submit="handleCreate"/>
</template>
