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
import { computed, ref, watch } from 'vue'
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
  year: { type: Number, required: true },       // 👉 연도
  grade: { type: Number, required: true },      // 👉 학년 (정규 timetable용)
  level: { type: String, required: true },
  groupLevel: { type: String, default: '' },
  start: { type: String, required: true },
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

const mondayStart = computed(() =>
    startDate.value.startOf('week').add(1, 'day') // dayjs는 일요일이 week 시작이라 +1 필요
)

function formatDateForDay(dayName) {
  const idx = DAY_INDEX_MAP[dayName]
  return mondayStart.value.add(idx, 'day').format('MM/DD')
}
// ✅ 날짜 필터 유틸
function useDateInRange(dateStr) {

  const d = dayjs(dateStr)
  return d.isValid() &&
      d.isSameOrAfter(startDate.value, 'day') &&
      d.isSameOrBefore(endDate.value, 'day')
}

// ✅ 정렬 + 분반 필터 포함 필터링
const combinedItems = computed(() => {
  return props.timetables
      .filter(item => {
        const isValidDate = item.date && useDateInRange(item.date)
        if (!isValidDate) return false

        const isSpecial = item.is_special_lecture === 1

        const levelMatch =
            !props.level || item.level === props.level || item.level == null

        const gradeMatch =
            !isSpecial && (item.year == null || Number(item.year) === Number(props.grade))

        let groupLevelMatch = true
        if (item.group_levels) {
          try {
            const groupLevels = JSON.parse(item.group_levels)
            groupLevelMatch = props.groupLevel === '' || groupLevels.includes(props.groupLevel)
          } catch (e) {
            console.warn('❌ group_levels JSON 파싱 오류:', item.group_levels)
            groupLevelMatch = false
          }
        }

        // 📦 필터 조건
        switch (item.event_type) {
          case 'regular':
            return !isSpecial && gradeMatch && !item.isCancelled
          case 'special':
            return isSpecial && levelMatch && groupLevelMatch
          case 'makeup':
            return (levelMatch || gradeMatch) && groupLevelMatch
          case 'cancel':
          case 'event':
          case 'holiday':
            return true
          default:
            return false
        }
      })
      .sort((a, b) => EVENT_PRIORITY[a.event_type] - EVENT_PRIORITY[b.event_type])
})




watch(combinedItems, (val) => {
  console.log("🔍 [combinedItems]", val)
  const regulars = val.filter(i => i.event_type === 'regular')
  console.log("🟩 정규수업 갯수:", regulars.length)

  for (const r of regulars) {
    console.log(`🧪 정규수업: ${r.subject_name} - ${r.year}학년`)
  }
}, { immediate: true })

// ✅ 셀에 들어갈 데이터만 필터링
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

  const final = filtered.filter(item => {
    if (item.event_type === 'cancel') return true
    if (item.event_type === 'regular' && cancelIds.has(Number(item.id))) return false
    return true
  })

  // ✅ 로그 추가
  if (final.length > 0) {
    console.log(`📦 [${day} ${period}교시]`, final)
  }

  return final
}

</script>

<style scoped>
.weekly-timetable {
  position: relative; /* 추가 */
  background: white;
  border-radius: 12px;
  overflow: visible;
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
