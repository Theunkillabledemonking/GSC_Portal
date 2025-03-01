<template>
  <div class="calendar">
    <div class="calendar-header">
      <!-- 이전 달 버튼 -->
      <button @click="prevMonth">&lt;</button>
      <h2>{{ currentYear }}년 {{ currentMonth + 1 }}월</h2>
      <!-- 다음 달 버튼 -->
      <button @click="nextMonth">&gt;</button>
    </div>

    <div class="calendar-grid">
      <div
          v-for="day in days"
          :key="day.date"
          class="calendar-cell"
          :class="{
          selected: day.date === selectedDate,
          'has-event': hasEvents(day.date)
        }"
          @click="selectDate(day.date)"
          :ref="el => dayRefs[day.date] = el"
      >
        <div class="day-number">{{ day.day }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';

/**
 * 부모로부터 monthlyEvents를 받아옴
 */
const props = defineProps({
  monthlyEvents: {
    type: Object,
    default: () => ({})
  }
});

/**
 * 이벤트를 부모로 emit할 수 있도록 설정
 */
const emit = defineEmits(['dateSelected', 'monthChanged']);

/** 현재 연도, 월, 날짜 목록 등 **/
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth());
const selectedDate = ref('');
const days = ref([]);
const dayRefs = ref({});

/** 달력에 표시할 날짜 목록을 생성 **/
const loadDays = () => {
  const totalDays = new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
  days.value = Array.from({ length: totalDays }, (_, i) => {
    const dayNumber = i + 1;
    const monthString = String(currentMonth.value + 1).padStart(2, '0');
    const dayString = String(dayNumber).padStart(2, '0');

    return {
      day: dayNumber,
      date: `${currentYear.value}-${monthString}-${dayString}`
    };
  });
};

/** currentYear, currentMonth가 바뀔 때마다 loadDays 재실행 **/
watch([currentYear, currentMonth], loadDays, { immediate: true });

/** 날짜 클릭 -> 부모에 'dateSelected' emit **/
const selectDate = (date) => {
  selectedDate.value = date;
  emit('dateSelected', date);
};

/** 부모에서 스크롤을 제어할 수 있도록 노출 **/
const scrollToDate = async (date) => {
  selectedDate.value = date;
  await nextTick();
  dayRefs.value[date]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};
defineExpose({ scrollToDate });

/** 이전 달 버튼 클릭 -> monthChanged emit **/
const prevMonth = () => {
  console.log('prevMonth', currentYear.value, currentMonth.value)
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
  emit('monthChanged', {
    year: currentYear.value,
    month: currentMonth.value
  });
};

/** 다음 달 버튼 클릭 -> monthChanged emit **/
const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
  emit('monthChanged', {
    year: currentYear.value,
    month: currentMonth.value
  });
};

/** 해당 날짜에 이벤트가 있는지 -> has-event 클래스 적용 **/
const hasEvents = (date) => {
  return props.monthlyEvents[date] && props.monthlyEvents[date].length > 0;
};
</script>

<style scoped>
.calendar {
  width: 100%;
  text-align: center;
}
.calendar-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}
.calendar-cell {
  border: 1px solid #ddd;
  padding: 10px;
  cursor: pointer;
  background: #f1f1f1;
}
.calendar-cell.selected {
  background: #4caf50;
  color: white;
}
.calendar-cell.has-event {
  background: #ffeb3b;
  color: #000;
}
.day-number {
  font-size: 1.2rem;
}
</style>
