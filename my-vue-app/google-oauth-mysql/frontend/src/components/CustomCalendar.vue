<template>
  <div class="calendar">
    <!-- 달력 상단, 월 이동 버튼 및 현재 년/월 표시 -->
    <div class="calendar-header">
      <button @click="prevMonth">&lt;</button>
      <h2>{{ currentYear }}년 {{ currentMonth + 1}}월</h2>
      <button @click="nextMonth">&gt;</button>
    </div>

    <!-- 달력 본문: 날짜별 셀 (events와 날짜 표시 포함) -->
    <div class="calendar-grid">
      <div
          v-for="day in days"
          :key="day.date"
          class="calendar-cell"
          @click="openModal(day)"
      >
        <!-- 날짜 숫자 표시 -->
        <div class="day-number">{{ day.day }}</div>

        <!-- 해당 날짜의 일정 리스트 출력 -->
        <div class="events">
          <div
              v-for="event in day.events"
              :key="event.id"
              class="event-item"
              @click.stop="openEvent(event)"
          >
            {{ event.summary }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 일정 추가/수정 모달 (선택한 날짜 정보를 props로 넘김) -->
  <EventModal v-if="modalVisible" :selectedDay="selectedDay" @close="modalVisible = false" />
</template>

<script setup>
import { ref, onMounted } from "vue";
import { listEvents } from "@/services/calendarApi.js"; // 구글 캘린더 이벤트 조회 함수
import EventModal from "@/components/specific/EventModal.vue"; // 일정 추가/수정 모달 컴포넌트

// 현재 연도, 월 정보 (달력 기준)
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth());

// 달력의 날짜 정보 저장할 배열
const days = ref([]);

// 모달 상태 및 선택한 날짜 정보
const modalVisible = ref(false);
const selectedDay = ref(null);

/**
 * ✅ 구글 캘린더에서 일정 불러와 달력에 표시하는 함수
 */
const loadEvents = async () => {
  const start = new Date(currentYear.value, currentMonth.value, 1);
  const end = new Date(currentYear.value, currentMonth.value + 1, 0);

  // 구글 캘린더에서 해당 월의 일정 조회
  const events = await listEvents(start.toISOString(), end.toISOString());

  // 달력 칸 채우기 위한 준비 작업
  const calendarDays = [];
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay();
  const totalDays = new Date(currentYear.value, currentMonth.value + 1, 0).getDate();

  // 1일이 무슨 요일부터 시작하는지에 맞춰 앞에 빈 칸 채우기
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push({ day: '', date: null, events: [] });
  }

  // 해당 월의 날짜 채우기
  for (let i = 1; i <= totalDays; i++) {
    const dateStr = `${currentYear.value}-${(currentMonth.value + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
    const dayEvents = events.filter(event => event.start.dateTime?.startsWith(dateStr) || event.start.date?.startsWith(dateStr));
    calendarDays.push({ day: i, date: dateStr, events: dayEvents });
  }

  days.value = calendarDays; // 화면 업데이트
};

// 컴포넌트 마운트 시 일정 불러오기
onMounted(loadEvents);

/**
 * ✅ 이전 월로 이동
 */
const prevMonth = () => {
  currentMonth.value--;
  if (currentMonth.value < 0) {
    currentMonth.value = 11;
    currentYear.value--;
  }
  loadEvents();
}

/**
 * ✅ 다음 월로 이동
 */
const nextMonth = () => {
  currentMonth.value++;
  if (currentMonth.value > 11) {
    currentMonth.value = 0;
    currentYear.value++;
  }
  loadEvents();
};

/**
 * ✅ 날짜 클릭 시 모달 열기
 */
const openModal = (day) => {
  if (day.date) {
    selectedDay.value = day;
    modalVisible.value = true;
  }
};

/**
 * ✅ 일정 클릭 시 상세 정보 알림
 */
const openEvent = (event) => {
  alert(`이벤트: ${event.summary}\n설명: ${event.description || '설명 없음'}`);
};
</script>

<style scoped>
.calendar {
  width: 100%;
  max-width: 900px;
  margin: 20px auto;
  text-align: center;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.calendar-cell {
  background: #f1f1f1;
  border: 1px solid #ddd;
  padding: 10px;
  min-height: 80px;
  position: relative;
  cursor: pointer;
}

.day-number {
  font-weight: bold;
}

.events {
  margin-top: 5px;
  font-size: 0.8rem;
}

.event-item {
  background: #4caf50;
  color: white;
  padding: 2px;
  margin: 2px 0;
  cursor: pointer;
  border-radius: 4px;
}
</style>
