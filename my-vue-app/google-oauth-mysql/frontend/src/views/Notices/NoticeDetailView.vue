<template>
  <div class="notice-detail">
    <h2>📢 공지사항 상세보기</h2>

    <p v-if="!notice">📌 공지사항을 불러오는 중...</p>

    <table v-else class="notice-table">
      <tbody>
      <tr>
        <th>제목</th>
        <td colspan="3">{{ notice.title }}</td>
      </tr>
      <tr>
        <th>작성자</th>
        <td>{{ notice.author }}</td>
        <th>작성일</th>
        <td>{{ formatDate(notice.created_at) }}</td>
      </tr>
      <tr>
        <th>조회수</th>
        <td>{{ notice.views }}</td>
        <th>첨부파일</th>
        <td>
          <<template v-if="notice.attachments && notice.attachments.length">
          <div v-for="file in notice.attachments" :key="file.id">
            <template v-if="isImage(file.name)">
              <img :src="file.url" :alt="file.name" style="max-width: 150px; max-height: 150px;" />
            </template>
            <template v-else>
              <a :href="file.url" target="_blank">{{ file.name }}</a>
            </template>
          </div>
        </template>
          <span v-else>없음</span>
        </td>
      </tr>
      <tr>
        <th>내용</th>
        <td colspan="3" class="notice-content">
          <pre class="content-box">{{ notice.content }}</pre>
        </td>
      </tr>
      </tbody>
    </table>

    <div class="button-group">
      <button @click="goBack">목록</button>
      <button v-if="canEdit" @click="goToEditNotice">수정</button>
      <button v-if="canEdit" @click="confirmDelete">삭제</button>
    </div>
  </div>
</template>

<script setup>
import { watch, onMounted, computed  } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNoticeStore } from '@/store/noticeStore.js';
import { useAuthStore } from "@/store/authStore.js";

const noticeStore = useNoticeStore();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const isImage = (filename) => {
  if (!filename) return false;
  const ext = filename.split('.').pop().toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
};

// selectNotice를 'computed'를 활용
const notice = computed(() => noticeStore.selectedNotice);

// 공지사항 수정 가능
const canEdit = computed(() => {
  return authStore.role === 1 || (authStore.role === 2 && notice.value?.author_id === authStore.userId)
})

// ✅ 공지사항 불러오기 함수
const loadNoticeData = async () => {
  await noticeStore.loadNotice(route.params.id);
};

// ✅ 처음 마운트될 때 데이터 불러오기
onMounted(() => {
  const id = route.params.id;
  if (id) {
    noticeStore.loadNotice(id);
  }
});



const goBack = () => {
  router.push("/notices");
}

// ✅ route.params.id가 변경될 때마다 새로운 공지 불러오기
watch(() => route.params.id, async (newId) => {
  if (newId) {
    loadNoticeData();
  }
});

const goToEditNotice = () => {
  router.push(`/notices/edit/${route.params.id}`);
};

const confirmDelete = async () => {
  if (confirm("정말 삭제하시겠습니까?")) {
    await noticeStore.removeNotice(route.params.id);
    goBack();
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString() + " " + new Date(date).toLocaleTimeString();
};

const getFileName = (filename) => {
  return filename ? filename.split('/').pop() : '';
};
</script>

<style scoped>
.notice-detail {
  padding: 20px;
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 10px;
  width: 90%;
  margin: 20px auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.content-box {
  white-space: pre-wrap;
  word-break: break-word;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
}

.notice-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.notice-table th, .notice-table td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
  font-size: 14px;
}

.notice-table th {
  background-color: #f0f0f0;
  width: 15%;
}

.notice-table td {
  background-color: #fff;
}

.notice-content {
  white-space: pre-wrap;
  font-family: inherit;
  line-height: 1.5;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 10px;
}

button {
  padding: 10px 15px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

button:nth-child(2) {
  background-color: #ffa500;
}

button:nth-child(2):hover {
  background-color: #ff8c00;
}

button:nth-child(3) {
  background-color: #f44336;
}

button:nth-child(3):hover {
  background-color: #d32f2f;
}
</style>