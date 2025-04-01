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
import { computed } from 'vue'
import dayjs from 'dayjs'
import TimetableCell from './TimetableCell.vue'

// 📦 dayjs 확장 플러그인: 날짜 비교용
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

// ✅ props 정의: 상위에서 주입되는 정보
const props = defineProps({
  year: Number,
  level: String,
  start: String, // YYYY-MM-DD
  end: String,   // YYYY-MM-DD
  timetables: Array // 정규 + 이벤트 + 특강 + 공휴일 통합 데이터
})

// ✅ 렌더링 대상 요일 / 교시
const days = ['월', '화', '수', '목', '금']
const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9]

// ⏰ 날짜 계산
const startDate = computed(() => dayjs(props.start))
const endDate = computed(() => dayjs(props.end))

/**
 * ✅ 날짜, 학년, 레벨 조건에 맞는 timetable 필터링
 */
const combinedItems = computed(() =>
    props.timetables.filter(item => {
      const rawDate = item.event_date || item.date
      if (!rawDate) return false

      const date = dayjs(rawDate)
      if (!date.isValid()) return false

      const levelMatches = item.level === props.level || item.level === null
      const yearMatches = item.event_type === 'special' ? true : item.year === props.year
      console.log('📦 렌더링 직전 필터링된 timetable:', combinedItems.value)

      return (
          yearMatches &&
          levelMatches &&
          date.isSameOrAfter(startDate.value) &&
          date.isSameOrBefore(endDate.value)
      )
    })
)

/**
 * ✅ 셀별 렌더링 아이템 추출
 * - 요일 & 교시 포함
 * - 우선순위 정렬 포함
 */
function getItemsForCell(day, period) {
  return combinedItems.value
      .filter(item =>
          item.day === day &&
          +period >= +item.start_period &&
          +period <= +item.end_period
      )
      .sort((a, b) => {
        const typeA = a.event_type || 'regular'
        const typeB = b.event_type || 'regular'
        const priority = {
          holiday: 0,
          cancel: 1,
          makeup: 2,
          special: 3,
          event: 4,
          regular: 5
        }
        return priority[typeA] - priority[typeB]
        console.log(`🧩 ${day} / ${period}교시 결과:`, result)
      })
}
</script>

<style scoped>
.weekly-timetable {
  background: white;
  border-radius: 12px;
  overflow-x: auto;
  padding: 1rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
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
