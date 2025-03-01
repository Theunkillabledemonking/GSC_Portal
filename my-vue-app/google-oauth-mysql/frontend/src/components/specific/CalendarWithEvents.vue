<template>
  <div class="calendar-with-events">
    <!-- 좌측: 월 전체 일정 목록 -->
    <div class="left-panel">
      <h3>📅 월 전체 일정 목록</h3>
      <div
          v-for="(events, date) in monthlyEvents"
          :key="date"
          class="date-section"
          @click="scrollToDate(date)"
      >
        <strong>{{ date }}</strong>
        <div
            v-for="event in events"
            :key="event.id"
            class="event-item"
            @click.stop="selectEvent(date, event)"
        >
          {{ event.summary || "제목 없음" }}
        </div>
      </div>
    </div>

    <!-- 우측: 달력 -->
    <div class="right-panel">
      <!-- (중요) monthlyEvents를 props로 달력에 전달 + 이벤트 바인딩 -->
      <CalendarView
          :monthlyEvents="monthlyEvents"
          @dateSelected="handleDateSelected"
          @monthChanged="handleMonthChanged"
          ref="calendarRef"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { listEvents } from "@/services/calendarApi.js";
import CalendarView from "@/components/specific/CalendarView.vue";

// 월별 이벤트를 저장할 상태
const monthlyEvents = ref({});

// CalendarView를 제어하기 위한 ref
const calendarRef = ref(null);

/**
 * (1) 특정 연/월에 해당하는 이벤트 불러오기
 *     -> API에서 가져온 후 monthlyEvents에 저장
 */
const loadMonthlyEvents = async (year, month) => {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const events = await listEvents(start.toISOString(), end.toISOString());
  console.log('API로부터 받은 events:', events);

  const grouped = events.reduce((acc, event) => {
    const dateKey = event.start.dateTime?.split('T')[0] || event.start.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {});

  monthlyEvents.value = grouped;
  console.log('monthlyEvents.value:', monthlyEvents.value);
};

/**
 * (2) 컴포넌트가 처음 마운트될 때 -> 현재 연/월 이벤트 불러오기
 */
onMounted(() => {
  const now = new Date();
  loadMonthlyEvents(now.getFullYear(), now.getMonth());
});

/**
 * (3) 달력에서 'monthChanged' 이벤트가 발생하면 -> 해당 달의 이벤트 다시 로드
 */
const handleMonthChanged = ({ year, month }) => {
  // ① 디버그용 로그
  console.log('handleMonthChanged 호출됨:', year, month);
  loadMonthlyEvents(year, month);
};

/**
 * (4) 달력에서 날짜를 클릭했을 때
 */
const handleDateSelected = (date) => {
  // 필요하다면 여기서 scrollToDate(date) 호출 가능
  scrollToDate(date);
};

/**
 * (5) 좌측 목록을 클릭했을 때 -> 달력 위치로 스크롤
 */
const scrollToDate = (date) => {
  calendarRef.value?.scrollToDate(date);
};

/**
 * (6) 이벤트 아이템을 클릭했을 때
 */
const selectEvent = (date, event) => {
  scrollToDate(date);
  alert(`선택한 일정: ${event.summary || '제목 없음'}\n설명: ${event.description || '설명 없음'}`);
};
</script>

<style scoped>
.calendar-with-events {
  display: flex;
  gap: 20px;           /* 좌우 패널 간격 */
  padding: 20px;       /* 화면 테두리와 간격 */
  background-color: #fff;
  box-sizing: border-box;
}

/* 왼쪽 패널(일정 목록) */
.left-panel {
  flex: 1.5;           /* 비율: 왼쪽이 1.5, 오른쪽이 2 */
  max-height: 80vh;
  overflow-y: auto;
  background: #f9f9f9;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.right-panel {
  flex: 2;
  background: #fff;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.date-section {
  margin-bottom: 15px;
}

.date-section strong {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
}

.event-item {
  background: #4caf50;
  color: #fff;
  padding: 10px;
  margin: 5px 0;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.event-item:hover {
  background: #45a049;
}

.left-panel h3 {
  margin-bottom: 15px;
  font-size: 1.2rem;
  color: #333;
}
</style>
