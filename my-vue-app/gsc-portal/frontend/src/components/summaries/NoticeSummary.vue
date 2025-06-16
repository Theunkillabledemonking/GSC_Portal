<template>
  <ul class="notice-list">
    <li
        v-for="notice in sortedNotices"
        :key="notice.id"
        :class="notice.is_important ? 'important-notice' : 'normal-notice'"
        @click="goToDetail(notice.id)"
        tabindex="0"
        @keydown.enter="goToDetail(notice.id)"
    >
      <div class="title-row" :title="notice.title">
        <span class="notice-title">
          <span v-if="notice.is_important" class="tag" aria-hidden="true">📌</span>
          {{ notice.title }}
        </span>
      </div>
      <div class="meta">
        <span class="date">{{ formatDate(notice.created_at) }}</span>
        <span class="author">작성자: {{ notice.author || '관리자' }}</span>
      </div>
    </li>
  </ul>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { fetchNotices } from '@/services/noticeService.js'

const router = useRouter()
const notices = ref([])

onMounted(async () => {
  const data = await fetchNotices()
  notices.value = data.slice(0, 50) // 충분히 받아오고
})

const sortedNotices = computed(() => {
  return [...notices.value]
      .sort((a, b) => (b.is_important ?? false) - (a.is_important ?? false))
      .slice(0, 12)
})

function goToDetail(id) {
  router.push(`/notices/${id}`)
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.notice-list {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
  font-family: 'Pretendard', 'sans-serif';
}

.notice-list li {
  padding: 18px 16px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.15s ease;
  outline: none;
}
.notice-list li:hover,
.notice-list li:focus {
  background-color: #f7f7f7;
}

.notice-list li:last-child {
  border-bottom: none;
}

.title-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.notice-title {
  font-size: 17px;
  font-weight: 600;
  color: #222;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 95%;
}

.tag {
  margin-right: 6px;
  color: #e53935;
  font-size: 18px;
  vertical-align: middle;
}

.meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
}

.author {
  font-style: normal;
}
.date {
  color: #999;
}

.important-notice {
  background-color: #fff8f8;
  border-left: 4px solid #e53935;
}
.normal-notice {
  background-color: #fff;
}

/* ✅ 반응형 */
@media (max-width: 768px) {
  .notice-title {
    font-size: 15px;
    max-width: 100%;
  }

  .meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .notice-list li {
    padding: 14px;
  }
}
</style>
