<!-- File: CalendarView.vue -->
<template>
  <div class="calendar">
    <div class="calendar-header">
      <button @click="changeMonth(-1)">&lt;</button>
      <h2>{{ currentYear }}년 {{ currentMonth + 1 }}월</h2>
      <button @click="changeMonth(1)">&gt;</button>
    </div>

    <div class="weekdays">
      <div
          v-for="dayLabel in ['일','월','화','수','목','금','토']"
          :key="dayLabel"
          class="weekday"
      >
        {{ dayLabel }}
      </div>
    </div>

    <div class="calendar-grid">
      <div
          v-for="(day, idx) in days"
          :key="idx"
          class="calendar-cell"
          :class="{ 'has-event': hasEvents(day.date) }"
          @click="selectDate(day.date)"
          ref="el => setDayRef(day.date, el)"
      >
        <div class="day-number">
          {{ day.day }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, defineExpose } from 'vue';

const emit = defineEmits(['dateSelected', 'monthChanged']);
const props = defineProps({
  monthlyEvents: {
    type: Object,
    default: () => ({})
  }
});

const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth());
const days = ref([]);
const dayRefs = ref({});

// 달력 날짜 목록 계산
function loadDays() {
  const firstDayOfMonth = new Date(currentYear.value, currentMonth.value, 1).getDay();
  const totalDays = new Date(currentYear.value, currentMonth.value + 1, 0).getDate();

  // 달력 상에서, 1일 이전에 공백 셀(첫 주 시작 보정) 만들기
  days.value = [
    ...Array(firstDayOfMonth).fill({ day: '', date: '' }),
    ...Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${currentYear.value}-${
          String(currentMonth.value + 1).padStart(2,'0')
      }-${String(dayNum).padStart(2,'0')}`;

      return {
        day: dayNum,
        date: dateStr
      };
    })
  ];
}

// currentYear, currentMonth 변화 시 달력 갱신
watch([currentYear, currentMonth], () => {
  loadDays();
  emit('monthChanged', { year: currentYear.value, month: currentMonth.value });
}, { immediate: true });

function selectDate(date) {
  emit('dateSelected', date);
}

// 특정 날짜에 이벤트가 있는지 확인
function hasEvents(date) {
  return props.monthlyEvents[date]?.length > 0;
}

// 달 이동
function changeMonth(offset) {
  currentMonth.value += offset;
  if (currentMonth.value < 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else if (currentMonth.value > 11) {
    currentMonth.value = 0;
    currentYear.value++;
  }
}

// 날짜 셀 DOM 참조 저장
function setDayRef(date, el) {
  if (el) {
    dayRefs.value[date] = el;
  }
}

// 부모가 접근할 scrollToDate 함수 노출
async function scrollToDate(date) {
  await nextTick();
  dayRefs.value[date]?.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
}

defineExpose({ scrollToDate });
</script>

<style scoped>
.calendar {
  width: 100%;
  text-align: center;
  border: 1px solid #ddd;
  padding: 10px;
  box-sizing: border-box;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #eee;
  font-weight: 600;
}

.weekday {
  padding: 8px;
  text-align: center;
  border: 1px solid #ddd;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.calendar-cell {
  border: 1px solid #ddd;
  padding: 12px;
  height: 60px;
  background: #f9f9f9;
  cursor: pointer;
  transition: background 0.2s;
}
.calendar-cell:hover {
  background: #f1f1f1;
}

.calendar-cell.has-event {
  background: #ffeb3b;
  color: #000;
}

.day-number {
  font-size: 1.1rem;
}
</style>
