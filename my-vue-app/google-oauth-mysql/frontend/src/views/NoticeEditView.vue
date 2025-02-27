<template>
  <div class="notice-edit">
    <h2>공지사항 수정</h2>

    <form @submit.prevent="updateNotice">
      <label for="title">제목:</label>
      <input v-model="title" type="text" id="title" required />

      <label for="content">내용:</label>
      <textarea v-model="content" id="content" cols="30" rows="10" required></textarea>

      <label for="grade" id="grade">대상 학년 (선택):</label>
      <select v-model="grade" id="grade">
        <option value="">전체</option>
        <option value="1">1학년</option>
        <option value="2">2학년</option>
        <option value="3">3학년</option>
      </select>

      <!-- 중요 공지 체크박스 추가 -->
      <label>
        <input type="checkbox" v-model="is_important" />
        중요 공지 (🔥)
      </label>

      <button type="submit">수정하기</button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNoticeStore } from "@/store/noticeStore";

const noticeStore = useNoticeStore();
const router = useRouter();
const route = useRoute();

const title = ref("");
const content = ref("");
const grade = ref("");
const is_important = ref(false);

// 기존 공지사항 데이터 불러오기
onMounted(async() => {
  await noticeStore.loadNotice(route.params.id);
  const notice = noticeStore.selectedNotice;

  if (notice) {
    title.value = notice.title;
    content.value = notice.content;
    grade.value = notice.grade;
    is_important.value = notice.is_important;
  }
});

// 수정 버튼 클릭 시 API 호출
const updateNotice = async () => {
  await noticeStore.editNotice(route.params.id, {
    title: title.value,
    content: content.value,
    grade: grade.value,
    is_important: is_important.value
  });

  router.push("/notices"); // 수정 후 목록으로 이동
}
</script>

<style scoped>
.notice-edit {
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