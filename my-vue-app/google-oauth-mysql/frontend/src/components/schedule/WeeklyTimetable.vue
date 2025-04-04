<template>
  <div class="weekly-timetable">
    <table class="timetable">
      <thead>
      <tr>
        <th class="time-col">교시</th>
        <th v-for="day in DAYS" :key="day">
          {{ day }}<br />
          {{ formatDateForDay(day) }}
        </th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="period in PERIODS" :key="period">
        <td class="time-col">{{ period }}교시</td>
        <td
            v-for="day in DAYS"
            :key="day"
            class="timetable-cell"
        >
          <TimetableCell
              :day="day"
              :period="period"
              :items="getItemsForCell(day, period)"
              @open-detail="({ items, el }) => showDetail(items, el)"
              @close-detail="hideDetail"
          />
        </td>
      </tr>
      </tbody>
    </table>
    <TimetableDetailModal
        v-if="showModal"
        :items="hoverItems"
        :targetEl="hoverTarget"
        :visible="showModal"
        @close="hideDetail"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import TimetableCell from './TimetableCell.vue'
import TimetableDetailModal from './TimetableDetailModal.vue'


dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

const showModal = ref(false)
const hoverItems = ref([])
const hoverTarget = ref(null)

function showDetail(items, el) {
  hoverItems.value = items
  hoverTarget.value = el
  showModal.value = true
}

function hideDetail() {
  showModal.value = false
}

// ✅ Props 정의 + 타입 안정성
const props = defineProps({
  year: { type: Number, required: true },
  level: { type: String, required: true },
  start: { type: String, required: true }, // YYYY-MM-DD
  end: { type: String, required: true },
  timetables: { type: Array, default: () => [] }
})

// ✅ 상수
const DAYS = ['월', '화', '수', '목', '금']
const DAY_INDEX_MAP = { 월: 0, 화: 1, 수: 2, 목: 3, 금: 4 }
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const EVENT_PRIORITY = {
  holiday: 0,
  cancel: 1,
  makeup: 2,
  special: 3,
  event: 4,
  regular: 5
}

// ✅ 날짜 파싱
const startDate = computed(() => dayjs(props.start))
const endDate = computed(() => dayjs(props.end))

function formatDateForDay(dayName) {
  const idx = DAY_INDEX_MAP[dayName]
  return startDate.value.add(idx, 'day').format('MM/DD')
}

// ✅ 날짜 필터 유틸
function useDateInRange(dateStr) {
  const d = dayjs(dateStr)
  return d.isValid() &&
      d.isSameOrAfter(startDate.value, 'day') &&
      d.isSameOrBefore(endDate.value, 'day')
}

// ✅ 정렬 및 필터된 timetable 데이터
const combinedItems = computed(() => {
  return props.timetables
      .filter(item => {
        const isValidDate = item.date && useDateInRange(item.date)
        if (!isValidDate) return false

        const isSpecial = item.is_special_lecture === 1
        const levelMatch = item.level === props.level || item.level == null
        const gradeMatch = Number(item.year) === Number(props.year)

        switch (item.event_type) {
          case 'regular': return !isSpecial && gradeMatch && !item.isCancelled
          case 'special': return isSpecial && levelMatch
          case 'makeup': return levelMatch || gradeMatch
          case 'cancel': return true
          case 'event': return true
          case 'holiday': return true
          default: return false
        }
      })
      .sort((a, b) => EVENT_PRIORITY[a.event_type] - EVENT_PRIORITY[b.event_type])
})

// ✅ 셀 필터링 로직
function getItemsForCell(day, period) {
  const filtered = combinedItems.value.filter(item =>
      item.day === day &&
      period >= item.start_period &&
      period <= item.end_period
  )

  const cancelIds = new Set(
      filtered
          .filter(i => i.event_type === 'cancel' && i.timetable_id)
          .map(i => Number(i.timetable_id))
  )

  return filtered.filter(item => {
    if (item.event_type === 'cancel') return true
    if (item.event_type === 'regular' && cancelIds.has(Number(item.id))) return false
    return true
  })
}
</script>

<style scoped>
.weekly-timetable {
  position: relative; /* 추가 */
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

th,
td {
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

.timetable-cell {
  position: relative;
}
</style>
