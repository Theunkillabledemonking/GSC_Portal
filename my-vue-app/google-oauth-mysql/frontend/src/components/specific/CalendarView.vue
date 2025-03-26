<template>
  <div class="calendar">
    <div class="calendar-header">
      <button class="nav-button" @click="changeMonth(-1)">&#9664;</button>
      <h2>{{ currentYear }}년 {{ currentMonth + 1 }}월</h2>
      <button class="nav-button" @click="changeMonth(1)">&#9654;</button>
    </div>

    <div class="weekdays">
      <div
          v-for="dayLabel in ['일', '월', '화', '수', '목', '금', '토']"
          :key="dayLabel"
          class="weekday"
      >
        {{ dayLabel }}
      </div>
    </div>

    <div class="calendar-grid">
      <div
          v-for="(day, idx) in days"
          :key="day.date || idx"
          class="calendar-cell"
          @click="selectDate(day.date)"
          :ref="el => setDayRef(day.date, el)"
      >
        <div class="day-number">{{ day.day }}</div>
        <!-- 이벤트 표시 (색상 블록) -->
        <div class="event-squares">
          <div
              v-for="(evt, eIdx) in monthlyEvents[day.date] || []"
              :key="eIdx"
              class="square"
              :class="`color-${(eIdx % 7) + 1}`"
          ></div>
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

function loadDays() {
  dayRefs.value = {};
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay();
  const totalDays = new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
  const blanks = Array(firstDay).fill({ day: '', date: '' });

  const realDays = Array.from({ length: totalDays }, (_, i) => {
    const dNum = i + 1;
    const dateStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
    return { day: dNum, date: dateStr };
  });

  days.value = [...blanks, ...realDays];
}

watch([currentYear, currentMonth], () => {
  loadDays();
  emit('monthChanged', { year: currentYear.value, month: currentMonth.value });
}, { immediate: true });

function selectDate(date) {
  if (date) emit('dateSelected', date);
}

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

function setDayRef(date, el) {
  if (date && el) {
    dayRefs.value[date] = el;
  }
}

async function scrollToDate(date) {
  if (!date) return;
  await nextTick();
  dayRefs.value[date]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
defineExpose({ scrollToDate });
</script>

<style scoped>
.calendar {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  background: linear-gradient(to right, #f8f9fd, #e3e9f4);
  border-radius: 20px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.calendar-header h2 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.calendar-header button {
  width: 36px;
  height: 36px;
  border: none;
  background: #f0f1f6;
  border-radius: 50%;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
}

.calendar-header button:hover {
  background: #d6d9e0;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: 600;
  margin-bottom: 10px;
}

.weekday {
  padding: 10px 0;
  color: #999;
}

.weekday:first-child {
  color: #e74c3c; /* 일요일만 빨간색 */
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-cell {
  min-height: 80px;
  background: white;
  border-radius: 12px;
  padding: 8px;
  box-shadow: inset 0 0 0 1px #eee;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  transition: background 0.2s;
}

.calendar-cell:hover {
  background: #f6f8fc;
}

.day-number {
  font-size: 14px;
  color: #333;
  align-self: flex-start;
}

.event-squares {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 4px;
}

.square {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.color-1 { background: #f44336; }
.color-2 { background: #ff9800; }
.color-3 { background: #ffeb3b; }
.color-4 { background: #4caf50; }
.color-5 { background: #2196f3; }
.color-6 { background: #3f51b5; }
.color-7 { background: #9c27b0; }

@media screen and (max-width: 768px) {
  .calendar-header h2 {
    font-size: 24px;
  }

  .nav-button {
    font-size: 24px;
  }

  .weekday,
  .calendar-cell {
    padding: 10px;
  }

  .day-number {
    font-size: 16px;
  }
}
</style>