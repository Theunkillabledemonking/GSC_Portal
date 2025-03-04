<template>
  <div class="main-dashboard">
    <h1>GSC Portal 메인 대시보드</h1>

    <div class="dashboard-grid">
      <!-- 공지사항 섹션 -->
      <section class="notice-section">
        <h2>📢 공지사항</h2>
        <ul class="notice-list">
          <li
          v-for="notice in notices"
          :key="notice.id"
          @click="goToNoticeDetail(notice.id)"
          class="notice-item"
          >
            <span :class="{ important: notice.is_important }">{{ notice.title}}</span>
            <small>{{ formatDate(notice.created_at)}}</small>
          </li>
        </ul>
        <button @click="goToNoticePage">+</button>
      </section>

      <!-- 월간 일정 섹션 -->
      <section class="calendar-section">
        <h2>📅 이번달 일정</h2>
        <CalendarView
            :monthly-events="monthlyEvents"
            @monthChanged="loadEventsForMonth"
        />
        <button @click="goToCalendarPage">더보기+</button>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore} from "@/store/authStore.js";
import { fetchNotices } from "@/services/noticeService.js";
import { listEvents } from "@/services/calendarApi.js";
import CalendarView from "@/components/specific/CalendarView.vue";

const router = useRouter();
const authStore = useAuthStore();
const notices = ref([]);
const monthlyEvents = ref({});

// 공지사항 불러오기 (최신 10개)
onMounted(async () => {

  checkLoginStatus();
  await loadRecentNotices();
  const now = new Date();
  await loadEventsForMonth({ year: now.getFullYear(), month: now.getMonth() });
})

// 로그인 체크 (비로그인 시 강제 이동)
function checkLoginStatus() {
  if (!authStore.token) {
    router.push("/login");
  }
}
// 공지사항 최신 10개 불러오기
async function loadRecentNotices() {
  const allNotices = await fetchNotices();
  notices.value = allNotices.slice(0, 20);
}

// 월간 일정 불러오기
async function loadEventsForMonth({ year, month }) {
  const start = new Date(year, month, 1).toISOString();
  const end = new Date(year, month + 1, 0).toISOString();
  const events = await listEvents(start, end);

  const grouped = {};
  for (const e of events) {
    const dateKey = e.start.dateTime?.split('T')[0] || e.start.date;
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(e);
  }
  monthlyEvents.value = grouped;
}


// 페이지 이동 함수
function goToNoticePage() {
  router.push("/notices");
}
function goToCalendarPage() {
  router.push('/calendar');
}

// 날짜 포멧 함수
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}
</script>

<style scoped>
.main-dashboard {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
  box-sizing: border-box;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

/* 공지사항 + 일정 가로 배치 */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* 섹션 공통 스타일 */
.notice-section, .calendar-section {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* 공지사항 리스트 */
.notice-list {
  list-style: none;
  padding: 0;
  max-height: 300px;
  overflow-y: auto;
}
.notice-list li {
  padding: 8px 0;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #ddd;
}
.notice-list .important {
  color: red;
  font-weight: bold;
}

/* 버튼 공통 */
button {
  margin-top: 10px;
  padding: 8px 12px;
  cursor: pointer;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
}
button:hover {
  background-color: #45a049;
}

/* 모바일 대응 */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>