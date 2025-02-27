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
        <input type="checkbox" v-model="isImportant" />
        중요 공지 (★)
      </label>

      <button type="submit">등록하기</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useNoticeStore } from "@/store/noticeStore";
// import { userNoticeService } from "@/services/noticeService.js";
import { useRouter } from "vue-router";

const noticeStore = useNoticeStore();
const router = useRouter();

const title = ref("");
const content = ref("");
const grade = ref("");
const isImportant = ref(false); // 중요 공지 여부

const submitNotice = async () => {
  await noticeStore.createNotice({
    title: title.value,
    content: content.value,
    grade: grade.value,
    isImportant: isImportant.value,
    // 카톡 알림은 추후 구편
  });

  router.push("/notices");
}
</script>

<style scoped>
.notice-create {
  padding: 20px;
}

input, textarea, select {
  display: block;
  width: 100%;
  margin-bottom: 10px;
  padding: 8px;
}

button {
  background-color: #4caf50;
  color: white;
  padding: 10px;
  border: none;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}
</style>