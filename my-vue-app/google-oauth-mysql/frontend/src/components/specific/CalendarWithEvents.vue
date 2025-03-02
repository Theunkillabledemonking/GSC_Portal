<template>
  <div class="calendar-with-events">
    <!-- (A) 왼쪽 패널: 날짜별 이벤트 목록 -->
    <div class="left-panel">
      <h3>📅 월 전체 일정 목록</h3>
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
.calendar-with-events {
  display: flex;
  gap: 20px;
  padding: 20px;
  background-color: #fff;
  box-sizing: border-box;
}

.left-panel {
  flex: 1.2;
  max-height: 80vh;
  overflow-y: auto;
  background: #f9f9f9;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.right-panel {
  flex: 2;
  padding: 15px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.date-section {
  margin-bottom: 10px;
  padding: 6px;
  border-left: 4px solid transparent;
  transition: background-color 0.2s;
}

.date-section.selected {
  background-color: rgba(76, 175, 80, 0.2);
  border-left-color: #4caf50;
}

.event-item {
  background: #4caf50;
  color: #fff;
  padding: 6px;
  margin: 4px 0;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.event-item:hover {
  background: #45a049;
}

.admin-buttons {
  margin-top: 15px;
  text-align: center;
}

.new-event-btn {
  padding: 10px 12px;
  background: #2196f3;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  transition: background 0.2s;
}

.new-event-btn:hover {
  background: #1976d2;
}
</style>
