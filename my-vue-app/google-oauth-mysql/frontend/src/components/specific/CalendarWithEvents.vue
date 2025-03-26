<template>
  <div class="calendar-with-events">
    <!-- (A) 왼쪽 패널: 날짜별 이벤트 목록 -->
    <div class="left-panel">
      <h3>📅 월 전체 일정 목록</h3>

      <div v-if="isLoading" class="loading-message">
        <span>🔄 일정 데이터를 불러오는 중이에요...</span>
      </div>

      <div
          v-for="(events, date) in monthlyEvents"
          :key="date"
          class="date-section"
          :data-date="date"
          :class="{ selected: date === selectedDate }"
          :ref="el => setLeftRef(date, el)"
          @click="scrollToDate(date)"
      >
        <strong>{{ date }}</strong>
        <div
            v-for="(event, idx) in events"
            :key="event.id"
            class="event-item"
            @click.stop="handleEventClick(date, event)"
        >
          {{ event.summary || '제목 없음' }}<br />
          <small>{{ event.description || '설명 없음' }}</small>
        </div>
      </div>
    </div>

    <!-- (B) 오른쪽 패널: 달력 및 기타 모달 -->
    <div class="right-panel">
      <CalendarView
          ref="calendarRef"
          :monthlyEvents="monthlyEvents"
          @dateSelected="handleDateSelected"
          @monthChanged="handleMonthChanged"
      />

      <!-- 관리자/교수용 버튼 -->
      <div v-if="userRole === 1 || userRole === 2" class="admin-buttons">
        <button class="new-event-btn" @click="openModalForNew">
          신규 일정 추가
        </button>
      </div>

      <EventModal
          v-if="modalVisible"
          :isEdit="isEditMode"
          :selectedDay="selectedDay"
          :selectedEvent="selectedEvent"
          @close="modalVisible = false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import CalendarView from './CalendarView.vue';
import EventModal from './EventModal.vue';
import { listEvents } from '@/services/calendarApi.js';

// 사용자 역할 (예: 1=관리자, 2=교수, 3=학생)
const userRole = ref(2);

// 월별 이벤트 및 선택된 날짜, 모달 관련 데이터
const monthlyEvents = ref({});
const selectedDate = ref(null);
const modalVisible = ref(false);
const isEditMode = ref(false);
const selectedDay = ref(null);
const selectedEvent = ref(null);

const calendarRef = ref(null);
const dayRefsLeft = ref({});
const isLoading = ref(false);


// 왼쪽 패널의 날짜 항목 DOM 저장
function setLeftRef(date, el) {
  if (date && el) {
    dayRefsLeft.value[date] = el;
  }
}

// 특정 달의 이벤트 로드
async function loadMonthlyEvents(year, month) {
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

// 페이지 로드 시 현재 달의 이벤트 조회
onMounted(async () => {
  const now = new Date();
  await loadMonthlyEvents(now.getFullYear(), now.getMonth());
});

// 날짜 클릭 시: 오른쪽 달력과 왼쪽 패널 모두 스크롤 이동
function scrollToDate(date) {
  selectedDate.value = date;
  if (!date) return;

  // 오른쪽 달력 컴포넌트의 scrollToDate 호출
  calendarRef.value?.scrollToDate(date);

  // 왼쪽 패널의 해당 날짜 요소로 스크롤 (DOM 업데이트 후 실행)
  nextTick(() => {
    const targetEl = dayRefsLeft.value[date];
    if (targetEl) {
      targetEl.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  });
}

// 이벤트 클릭 시 처리 (관리자/교수는 모달, 그 외는 스크롤)
function handleEventClick(date, event) {
  if (userRole.value === 1 || userRole.value === 2) {
    isEditMode.value = true;
    selectedDay.value = { date };
    selectedEvent.value = event;
    modalVisible.value = true;
  } else {
    scrollToDate(date);
  }
}

// 달력에서 날짜 선택 시
function handleDateSelected(date) {
  scrollToDate(date);
}

// 달력의 월 변경 시 해당 달의 이벤트 로드
function handleMonthChanged({ year, month }) {
  loadMonthlyEvents(year, month);
}

// "신규 일정 추가" 버튼 클릭 시 모달 열기
function openModalForNew() {
  isEditMode.value = false;
  selectedDay.value = { date: '' };
  selectedEvent.value = null;
  modalVisible.value = true;
}
</script>

<style scoped>
/* 공통 배경 및 폰트 */
body {
  background: linear-gradient(to bottom right, #fce4ec, #f3e5f5); /* 연핑크~연보라 */
  margin: 0;
  font-family: 'Noto Sans KR', sans-serif;
}

header {
  background: linear-gradient(to right, #d63384, #9c27b0); /* 딥핑크~퍼플 */
  color: white;
}

/* 메인 레이아웃 */
.calendar-with-events {
  display: flex;
  gap: 30px;
  padding: 30px;
  background: linear-gradient(to bottom right, #fff0f5, #f3e5f5);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

/* 왼쪽 일정 목록 패널 */
.left-panel {
  flex: 1.2;
  max-height: 80vh;
  overflow-y: auto;
  background: #ffffff;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  border-left: 8px solid #d63384; /* 강조 딥핑크 */
}

.left-panel h3 {
  font-size: 18px;
  font-weight: bold;
  color: #9c27b0; /* 퍼플 계열 */
  margin-bottom: 16px;
}

.date-section {
  margin-bottom: 14px;
  padding: 10px;
  border-left: 4px solid transparent;
  border-radius: 10px;
  background: #fff;
  transition: 0.2s ease;
  opacity: 0;
  transform: translateY(10px);
  animation: fadeInUp 0.3s ease forwards;
}

.date-section.selected {
  background: #f8bbd0; /* 연핑크 하이라이트 */
  border-left-color: #c2185b;
}

.event-item {
  background: linear-gradient(to right, #f06292, #ba68c8); /* 부드러운 핑크퍼플 그라데이션 */
  color: #fff;
  padding: 10px 14px;
  margin: 6px 0;
  border-radius: 8px;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.event-item:hover {
  transform: scale(1.05);
  background: linear-gradient(to right, #ec407a, #ab47bc); /* 살짝 더 진하게 */
}

/* 오른쪽 달력 패널 */
.right-panel {
  flex: 2;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 20px;
}

/* 버튼 영역 */
.admin-buttons {
  text-align: center;
  margin-top: 20px;
}

.new-event-btn {
  background: linear-gradient(to right, #f06292, #ba68c8); /* 버튼도 같은 톤으로 */
  color: white;
  border: none;
  padding: 10px 20px;
  font-weight: bold;
  font-size: 14px;
  border-radius: 999px;
  cursor: pointer;
  transition: 0.3s ease;
  box-shadow: 0 3px 8px rgba(0,0,0,0.1);
}

.new-event-btn:hover {
  background: linear-gradient(to right, #ec407a, #ab47bc);
  transform: scale(1.05);
}

/* 로딩 메시지 */
.loading-message {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold;
  font-size: 16px;
  color: #ba68c8;
  animation: fadein 0.6s ease-in-out infinite alternate;
}

/* 애니메이션 */
@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadein {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
