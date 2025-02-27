<template>
  <div class="notice-create">
    <h2>📢공지사항 등록</h2>

    <form @submit.prevent="submitNotice">
      <label for="title">제목:</label>
      <input v-model="title" type="text" id="title" required />

      <label for="content">내용:</label>
      <textarea v-model="content" id="content" cols="30" rows="10" required></textarea>

      <label for="grade">대상 학년 (선택):</label>
      <select v-model="grade" id="grade">
        <option value="">전체</option>
        <option value="1">1학년</option>
        <option value="2">2학년</option>
        <option value="3">3학년</option>
      </select>

      <!-- 중요 공지 체크박스 추가 -->
      <label>
        <input type="checkbox" v-model="is_important" />
        중요 공지 (★)
      </label>

      <button type="submit">등록하기</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useNoticeStore } from "@/store/noticeStore.js";
import { useRouter } from "vue-router";

const noticeStore = useNoticeStore();
const router = useRouter();

const title = ref("");
const content = ref("");
const grade = ref("");
const is_important = ref(false); // 중요 공지 여부

const submitNotice = async () => {
  await noticeStore.addNotice({
    title: title.value,
    content: content.value,
    grade: grade.value === "" ? null : grade.value,
    is_important: is_important.value
    // 카톡 알림은 추후 구편
  });

  alert('공지사항이 성공적으로 등록되었습니다.');
  router.push("/notices");
}
</script>

<style scoped>
.notice-create {
  padding: 20px;
}
</style>