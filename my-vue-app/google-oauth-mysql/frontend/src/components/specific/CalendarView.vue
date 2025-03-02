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

// 부모에서 날짜 클릭 시 사용할 이벤트
const emit = defineEmits(['dateSelected', 'monthChanged']);

// 부모로부터 전달받는 월별 이벤트 데이터
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

// (1) 달력 날짜 계산 함수
function loadDays() {
  // 이전 참조 초기화
  dayRefs.value = {};
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay();
  const totalDays = new Date(currentYear.value, currentMonth.value + 1, 0).getDate();

  // 앞쪽 빈칸 생성
  const blanks = Array(firstDay).fill({ day: '', date: '' });
  // 실제 날짜 배열 생성
  const realDays = Array.from({ length: totalDays }, (_, i) => {
    const dNum = i + 1;
    const dateStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
    return { day: dNum, date: dateStr };
  });

  days.value = [...blanks, ...realDays];
  // (필요 시 콘솔 로그로 확인)
  // console.log("days =>", days.value);
}

// currentYear, currentMonth 변경 시 날짜 재계산 및 부모에 변경 알림
watch([currentYear, currentMonth], () => {
  loadDays();
  emit('monthChanged', { year: currentYear.value, month: currentMonth.value });
}, { immediate: true });

function selectDate(date) {
  if (date) {
    // 날짜 선택 시 부모로 알림
    emit('dateSelected', date);
  }
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

// 각 날짜 셀의 DOM 참조 저장
function setDayRef(date, el) {
  if (date && el) {
    dayRefs.value[date] = el;
  }
}

// 부모에서 호출할 수 있도록 특정 날짜로 스크롤하는 함수
async function scrollToDate(date) {
  if (!date) return;
  await nextTick();
  dayRefs.value[date]?.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
}

// 부모가 이 함수에 접근할 수 있도록 노출
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
  padding: 8px;
  height: 70px;
  background: #fff;
  overflow-y: auto;
  cursor: pointer;
  transition: background 0.2s;
}

.calendar-cell:hover {
  background: #f1f1f1;
}

.day-number {
  font-size: 1.0rem;
  margin-bottom: 4px;
}

.event-squares {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.square {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.color-1 { background: #f44336; }
.color-2 { background: #ff9800; }
.color-3 { background: #ffeb3b; }
.color-4 { background: #4caf50; }
.color-5 { background: #2196f3; }
.color-6 { background: #9c27b0; }
.color-7 { background: #e91e63; }
</style>
