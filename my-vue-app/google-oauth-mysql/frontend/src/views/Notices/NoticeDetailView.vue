<template>
  <div class="notice-detail-wrapper">
    <div v-if="notice" class="notice-detail">
      <div class="notice-title">
        <span v-if="notice.is_important" class="badge-important">중요한 공지</span>
        {{ notice.title }}
      </div>

      <div class="notice-meta">
        <span>작성자: {{ notice.author }}</span>
        <span>작성일: {{ formatDate(notice.created_at) }}</span>
        <span>조회수: {{ notice.views }}</span>
      </div>

      <div class="notice-content">
        <p>{{ notice.content }}</p>
      </div>

      <div v-if="notice.attachments?.length" class="attachments">
        <h3>첨부파일</h3>
        <ul>
          <li v-for="file in notice.attachments" :key="file.id">
            <a :href="file.url" target="_blank">{{ file.name }}</a>
          </li>
        </ul>
      </div>

      <div class="button-group">
        <button class="btn gray" @click="goBack">← 목록</button>
        <button class="btn orange" v-if="canEdit" @click="goToEditNotice">✏️ 수정</button>
        <button class="btn red" v-if="canEdit" @click="confirmDelete">🗑️ 삭제</button>
      </div>
    </div>
    <div v-else>
      불러오는 중입니다...
    </div>
  </div>
</template>


<script setup>
import { computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNoticeStore } from '@/store/noticeStore.js';
import { useAuthStore } from '@/store/authStore.js';

const route = useRoute();
const router = useRouter();
const noticeStore = useNoticeStore();
const authStore = useAuthStore();

const notice = computed(() => noticeStore.selectedNotice);

const canEdit = computed(() => {
  const data = notice.value;
  return authStore.role === 1 || (authStore.role === 2 && data?.author_id === authStore.userId);
});

const formatDate = (date) => new Date(date).toLocaleString();

const goBack = () => router.push('/notices');
const goToEditNotice = () => router.push(`/notices/edit/${route.params.id}`);
const confirmDelete = async () => {
  if (confirm("정말 삭제하시겠습니까?")) {
    await noticeStore.removeNotice(route.params.id);
    goBack();
  }
};

onMounted(() => {
  const id = route.params.id;
  if (id) noticeStore.loadNotice(id);
});

watch(() => route.params.id, (newId) => {
  if (newId) noticeStore.loadNotice(newId);
});
</script>

<style scoped>
.notice-detail-wrapper {
  min-height: 100vh;
  background: #ffeef5;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 60px 20px;
  box-sizing: border-box;
}

.notice-detail {
  background: white;
  width: 100%;
  max-width: 900px;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 80vh;
}

.notice-title {
  font-size: 24px;
  font-weight: 700;
  color: #d81b60;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge-important {
  background-color: #f272ba;
  color: white;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
}

.notice-meta {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.notice-content {
  background: #f9f9f9;
  padding: 24px 28px;
  border-radius: 12px;
  font-size: 16px;
  color: #333;
  line-height: 1.7;
  text-align: left;
  min-height: 200px;
  white-space: pre-wrap;
}

.attachments {
  margin-top: 20px;
  padding-left: 4px;
  font-size: 15px;
}
.attachments h3 {
  font-size: 15px;
  color: #d81b60;
  margin-bottom: 8px;
  font-weight: bold;
}
.attachments li {
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.attachments li::before {
  content: "📎";
  font-size: 14px;
  color: #d81b60;
}
.attachments a {
  color: #1e88e5;
  text-decoration: none;
  font-size: 14px;
}
.attachments a:hover {
  text-decoration: underline;
}

.button-group {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  font-size: 14px;
}
.btn.gray { background: #666; }
.btn.orange { background: #ffa000; }
.btn.red { background: #f44336; }
</style>
