<template>
  <div class="dashboard-wrapper">
    <!-- 상단 네비게이션 스타일 -->
    <header class="dashboard-header">
      <h1>GSC 포털</h1>
      <p>{{ pages[pageIndex] }}</p>
    </header>

    <!-- 콘텐츠 -->
    <div class="dashboard-content">
      <component :is="currentComponent" />
    </div>

    <!-- 페이지 네비게이션 -->
    <div class="pager">
      <button @click="prevPage" :disabled="pageIndex === 0">‹</button>
      <span v-for="(page, i) in pages" :key="i" :class="{ active: pageIndex === i }" @click="goTo(i)">
        {{ i + 1 }}
      </span>
      <button @click="nextPage" :disabled="pageIndex === pages.length - 1">›</button>
    </div>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'

// 페이지 정보
const pageIndex = ref(0)
const pages = ['공지사항', '시간표', '일정']

// 페이지 컴포넌트 연결
import NoticeView from '@/views/Notices/NoticesView.vue';
import TimetableView from '@/views/TimetableView.vue';
import CalendarView from '@/components/TimetableCalendar.vue';

const currentComponent = computed(() => {
  return [NoticeView, TimetableView, CalendarView][pageIndex.value]
})

// 페이지 이동 함수
const prevPage = () => {
  if (pageIndex.value > 0) pageIndex.value--
}
const nextPage = () => {
  if (pageIndex.value < pages.length - 1) pageIndex.value++
}
const goTo = (index) => {
  pageIndex.value = index
}
</script>


<style scoped>
.dashboard-wrapper {
  padding: 40px;
  background: #f9f9f9;
  min-height: 100vh;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 20px;
}

.pager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
}

.pager span {
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 5px;
  background: #e0e0e0;
  font-weight: bold;
}

.pager span.active {
  background: #4caf50;
  color: white;
}

.pager button {
  padding: 6px 10px;
  border: none;
  background: #007bff;
  color: white;
  border-radius: 5px;
  cursor: pointer;
}
.pager button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>

