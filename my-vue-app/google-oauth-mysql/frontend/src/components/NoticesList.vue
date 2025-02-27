<template>
  <div class="notices-list">
    <h2>공지사항 목록</h2>
    <ul v-if="notices.length">
      <li v-for="notice in notices" :key="notice.id">
        <!-- ✅ 중요 공지는 강조 표시 -->
        <span v-if="notice.is_important" class="important">🔥</span>
        <router-link :to="`/notices/${notice.id}`">{{ notice.title }}</router-link>
      </li>
    </ul>
    <p v-else>공지사항이 없습니다.</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useNoticeStore } from '@/store/noticeStore';

const noticeStore = useNoticeStore();

onMounted(() => {
  noticeStore.loadNotices();
});
</script>

<style scoped>
.notices-list {
  padding: 20px;
}

.important {
  color: red;
  font-weight: bold;
  margin-right: 5px;
}
</style>
