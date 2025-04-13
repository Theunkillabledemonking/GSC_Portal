<template>
  <div class="main-dashboard">
    <!-- 메인 타이틀 -->
    <h1>GSC Portal 메인 대시보드</h1>

    <!-- 전체 레이아웃 컨테이너 -->
    <div class="dashboard-container">

      <!-- 공지사항 영역 (좌측) -->
      <section class="notice-panel">
        <h2>📢 공지사항</h2>
        <ul class="notice-list">
          <li
          v-for="notice in notices"
          :key="notice.id"
          @click="goToNoticeDetail(notice.id)"
          class="notice-title"
          >
            <span :class="{ important: notice.is_important }">{{ notice.title}}</span>
            <small>{{ formatDate(notice.created_at)}}</small>
          </li>
        </ul>
        <button @click="goToNoticePage">+</button>
      </section>

      <!-- 캘린더 및 일정 목록 영역 (우측) -->
      <section class="calendar-panel">
        <h2>📅 이번달 일정</h2>
        <CalendarView
            ref="calendarRef"
            :monthly-events="monthlyEvents"
            @dateSelected="scrollDate"
            @monthChanged="loadEventsForMonth"
        />

        <!-- 선택 날짜의 상세 일정 목록 -->
        <div class="event-list">
          <h3>{{ selectedDate }}일정</h3>
          <div v-if="selectedEvents.length > 0">
            <div
              v-for="(event, idx) in selectedEvents"
              :key="idx"
              class="event-item"
              :class="{ selected: selectedEventIdx === idx }"
              ref="eventItems"
            >
              <strong>{{ event.summary || '제목 없음' }}</strong><br />
              <small>{{ event.description || '설명 없음'}}</small>
            </div>
          </div>
          <div v-else class="no-events">일정이 존재하지 않습니다.</div>
        </div>
        <button @click="goToCalendarPage">더보기+</button>
      </section>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted, nextTick} from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store";
import { fetchNotices } from "@/services/noticeService.js";
import { listEvents } from "@/services/calendarApi.js";
import CalendarView from "@/components/specific/CalendarView.vue";

// 라우터 & 스토어
const router = useRouter();
const authStore = useAuthStore();

// 데이터 변수
const notices = ref([]);             // 공지사항 목록
const monthlyEvents = ref({});       // 월 전체 일정
const selectedDate = ref("");        // 선택된 날짜
const selectedEvents = ref([]);      // 선택 날짜의 이벤트 목록
const calendarRef = ref(null);       // CalnedarView 참조
const selectedEventIdx = ref(null);  // 선택된 일정 인덱스 (스크롤용)
const eventItems = ref([]);          // 이벤트 목록 DOM 참조 저장용


// 페이지 로드 시 데이터 초기화
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
  notices.value = allNotices.slice(0, 15);
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

// 날짜 클릭 시 해당 날짜 일정 표시 & 스크롤 기능 추가
function scrollDate(date) {
  selectedDate.value = date;
  selectedEvents.value = monthlyEvents.value[date] || [];
  selectedEventIdx.value = 0; // 첫 번째 일정 자동 선택

  // 다음 틱에서 스크롤 처리 (이벤트 목록 DOM 준비 후 실행)
  nextTick(() => {
    scrollToDate(0);
  });
}
// 특정 일정으로 스크롤
function scrollToDate(idx) {
  const target = eventItems.value[idx];
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// 날짜 포멧 함수
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}

// 페이지 이동 함수
function goToNoticePage() {
  router.push("/notices");
}
function goToCalendarPage() {
  router.push('/calendar');
}
function goToNoticeDetail(id) {
  router.push(`/notices/${id}`);
}


</script>

<style scoped>
/* 전체 레이아웃 컨테이너 */
.dashboard-container {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

/* 공지사항 패널 (좌측 4) */TM
.notice-panel {
  flex: 4;
  min-width: 300px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* 캘린더 + 일정 패널 (우측 6) */
.calendar-panel {
  flex: 6;
  min-width: 400px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* 공지사항 목록 */
.notice-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.notice-item {
  padding: 8px 0;
  cursor: pointer;
  border-bottom: 1px solid #ddd;
}

.notice-item:hover {
  background-color: #f9f9f9;
}

/* 중요 공지 강조 */
.important {
  color: red;
  font-weight: bold;
}

/* 일정 상세 목록 */
.event-list {
  margin-top: 15px;
  padding: 10px;
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.event-item {
  padding: 8px;
  background-color: #4caf50;
  color: white;
  border-radius: 5px;
  margin-bottom: 5px;
}

.no-events {
  text-align: center;
  color: #999;
  padding: 10px 0;
}

/* 버튼 공통 */
button {
  margin-top: 10px;
  padding: 6px 12px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

/* 반응형: 모바일에서는 세로로 */
@media (max-width: 768px) {
  .dashboard-container {
    flex-direction: column;
  }

  .notice-panel,
  .calendar-panel {
    width: 100%;
  }
}
</style>