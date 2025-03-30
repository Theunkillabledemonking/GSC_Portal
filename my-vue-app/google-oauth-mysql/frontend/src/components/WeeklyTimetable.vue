<template>
  <div class="weekly-timetable">
    <table class="timetable">
      <thead>
      <tr>
        <th class="time-col">교시</th>
        <th v-for="day in days" :key="day">{{ day }}</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="period in periods" :key="period">
        <td class="time-col">{{ period }}교시</td>
        <td
            v-for="day in days"
            :key="day"
            class="timetable-cell"
        >
          <TimetableCell
              :day="day"
              :period="period"
              :items="getItemsForCell(day, period)"
          />
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import dayjs from 'dayjs';
import { useTimetableStore } from '@/store/timetableStore';
import TimetableCell from './TimetableCell.vue';

const props = defineProps({
  year: Number,
  level: String,
  start: String, // YYYY-MM-DD
  end: String    // YYYY-MM-DD
});

const days = ['월', '화', '수', '목', '금'];
const periods = [1, 2, 3, 4, 5, 6, 7, 8];

const timetableStore = useTimetableStore();

const startDate = computed(() => dayjs(props.start));
const endDate = computed(() => dayjs(props.end));

/**
 * 📌 유효한 날짜 범위 안의 수업 + 이벤트 + 공휴일 필터링
 */
const combinedItems = computed(() =>
    timetableStore.getCombinedData.filter(item => {
      const isEventOrHoliday = !!item.event_date;
      const dateToCheck = isEventOrHoliday ? dayjs(item.event_date) : null;

      return (
          item.year === props.year &&
          item.level === props.level &&
          (
              !isEventOrHoliday || (
                  dateToCheck.isSameOrAfter(startDate.value) &&
                  dateToCheck.isSameOrBefore(endDate.value)
              )
          )
      );
    })
);

/**
 * 🧠 요일 + 교시 기준으로 셀 데이터 필터링
 */
function getItemsForCell(day, period) {
  return combinedItems.value.filter(item =>
      item.day === day &&
      period >= item.start_period &&
      period <= item.end_period
  );
}
</script>

<style scoped>
.weekly-timetable {
  background: white;
  border-radius: 12px;
  overflow-x: auto;
  padding: 1rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

.timetable {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th, td {
  border: 1px solid #e5e7eb;
  padding: 8px;
  text-align: center;
  vertical-align: top;
}

.time-col {
  width: 60px;
  font-weight: bold;
  background: #f9fafb;
}
</style>
