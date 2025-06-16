<template>
  <div class="dashboard-container">
    <div class="content-wrapper">
      <!-- 왼쪽 화살표 -->
      <button class="nav-arrow left" @click="prevPage">‹</button>

      <!-- 컴포넌트 콘텐츠 -->
      <div class="content-area">
        <div class="section-header">
          <span class="title">
            {{ titles[currentPage] }}
            <button class="plus-btn" @click="goToDetail(currentPage)">＋</button>
          </span>
        </div>
        <component :is="pages[currentPage]" />
      </div>

      <!-- 오른쪽 화살표 -->
      <button class="nav-arrow right" @click="nextPage">›</button>
    </div>

    <!-- 하단 페이지 번호 -->
    <div class="pagination">
      <span
          v-for="(page, index) in pages"
          :key="index"
          :class="['page-number', { active: currentPage === index }]"
          @click="goToPage(index)"
      >
        {{ index + 1 }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import NoticeSummary from '@/components/summaries/NoticeSummary.vue'
import TimetableSummary from '@/components/summaries/TimetableSummary.vue'
import CalendarSummary from '@/components/summaries/CalendarSummary.vue'

const pages = [NoticeSummary, TimetableSummary, CalendarSummary]
const titles = ['📢 최근 공지사항', '📘 이번주 수업 요약', '📅 이번달 일정 요약']
const currentPage = ref(0)

// 무한 루프
const nextPage = () => {
  currentPage.value = (currentPage.value + 1) % pages.length
}
const prevPage = () => {
  currentPage.value = (currentPage.value - 1 + pages.length) % pages.length
}
const goToPage = (index) => {
  currentPage.value = index
}

// 더보기 버튼 동작 (각 컴포넌트별 라우팅 혹은 팝업 등으로 확장 가능)
const goToDetail = (index) => {
  alert(`페이지 ${index + 1} 상세보기로 이동합니다.`)
}
</script>


<style scoped>
.dashboard-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

.content-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 120px); /* 네비게이션 바 제외한 높이 */
  position: relative;
}

.nav-arrow {
  font-size: 36px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 20px;
  font-weight: bold;
  color: #333;
  transition: 0.3s ease;
}
.nav-arrow:hover {
  color: #007bff;
}

.content-area {
  min-height: 80vh;
  width: 100%;
  max-width: 800px;
  padding: 30px;
  margin: 0 20px;
  background: #f9f9f9;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

.section-header {
  width: 100%;
  text-align: center;
  margin-bottom: 20px;
}

.section-header .title {
  font-size: 24px;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.plus-btn {
  background: #333;
  color: #fff;
  border: none;
  font-size: 16px;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  cursor: pointer;
  line-height: 22px;
  text-align: center;
  padding: 0;
  transition: background 0.3s ease;
}
.plus-btn:hover {
  background: #007bff;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.page-number {
  margin: 0 6px;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 6px;
  background: #eee;
  font-weight: bold;
  font-size: 16px;
}

.page-number.active {
  background: #333;
  color: white;
}
</style>