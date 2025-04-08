<template>
  <div class="timetable-grid">
    <!-- Header row with dates -->
    <div class="grid-header">
      <div class="time-header"></div>
      <div v-for="date in weekDates" :key="date" class="date-cell">
        {{ formatDate(date) }}
      </div>
    </div>

    <!-- Time slots -->
    <div class="time-slots">
      <div v-for="period in timeSlots" :key="period" class="time-row">
        <div class="time-label">
          {{ period }}교시<br>
          <small class="text-gray-500">{{ getPeriodTime(period) }}</small>
        </div>
        <div v-for="date in weekDates" :key="date" class="time-cell">
          <TimetableCell
            :items="getItemsForCell(date, period)"
            :date="date"
            :time="period"
            @click="item => $emit('showDetail', item)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { useTimetableStore } from '@/store/timetableStore'
import TimetableCell from './TimetableCell.vue'

dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)

const timetableStore = useTimetableStore()

// Props
const props = defineProps({
  start: { type: String, required: true },
  end: { type: String, required: true }
})

// Emits
defineEmits(['showDetail'])

// Computed
const weekDates = computed(() => {
  const dates = []
  let current = dayjs(props.start)
  const end = dayjs(props.end)
  
  while (current.isSameOrBefore(end)) {
    dates.push(current.format('YYYY-MM-DD'))
    current = current.add(1, 'day')
  }
  console.log('📅 주간 날짜 계산:', dates)
  return dates
})

const timeSlots = computed(() => {
  // 모든 항목에서 시작 교시와 종료 교시를 추출
  const allPeriods = timetableStore.combinedData.reduce((periods, item) => {
    const start = Number(item.start_period)
    const end = Number(item.end_period)
    
    // 유효한 교시 번호만 추가
    if (!isNaN(start) && !isNaN(end)) {
      periods.push(start)
      periods.push(end)
    }
    return periods
  }, [])

  // 교시가 없는 경우 기본값 반환
  if (allPeriods.length === 0) {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9]
  }

  // 최소 교시와 최대 교시 찾기
  const minPeriod = Math.min(...allPeriods)
  const maxPeriod = Math.max(...allPeriods)

  // 해당 범위의 모든 교시를 배열로 생성
  return Array.from(
    { length: maxPeriod - minPeriod + 1 },
    (_, i) => minPeriod + i
  )
})

// 교시별 시간 매핑 (기존 매핑 확장)
const PERIOD_TIMES = {
  1: '09:00-09:50',
  2: '10:00-10:50',
  3: '11:00-11:50',
  4: '12:00-12:50',
  5: '13:00-13:50',
  6: '14:00-14:50',
  7: '15:00-15:50',
  8: '16:00-16:50',
  9: '17:00-17:50',
  10: '18:00-18:50',
  11: '19:00-19:50',
  12: '20:00-20:50',
  13: '21:00-21:50'
}

// Methods
const formatDate = (date) => {
  return dayjs(date).format('M/D (ddd)')
}

const getPeriodTime = (period) => {
  return PERIOD_TIMES[period] || `${period}교시`
}

const getItemsForCell = (date, period) => {
  const dayOfWeek = dayjs(date).format('ddd').toLowerCase()
  const items = timetableStore.combinedData

  // 요일 매핑
  const dayMap = {
    'mon': '월',
    'tue': '화',
    'wed': '수',
    'thu': '목',
    'fri': '금',
    'sat': '토',
    'sun': '일'
  }

  const filtered = items.filter(item => {
    // 시작-종료 교시 범위 체크
    const isInPeriodRange = Number(period) >= Number(item.start_period) && 
                           Number(period) <= Number(item.end_period)

    // 날짜가 있는 항목 (특강, 휴강, 보강 등)
    if (item.date) {
      return dayjs(item.date).format('YYYY-MM-DD') === date && isInPeriodRange
    }
    
    // 정규 수업 (요일 기반)
    return (item.day === dayMap[dayOfWeek] || item.day?.toLowerCase() === dayOfWeek) && 
           isInPeriodRange
  })

  return filtered
}

// Lifecycle
onMounted(() => {
  console.log('WeeklyTimetable mounted:', {
    start: props.start,
    end: props.end,
    weekDates: weekDates.value,
    store: {
      filters: timetableStore.filters,
      dateRange: timetableStore.dateRange,
      items: timetableStore.combinedData.length
    }
  })
})

// Watch for date changes
watch([() => props.start, () => props.end], ([newStart, newEnd]) => {
  console.log('Date range changed:', { newStart, newEnd })
  timetableStore.setDateRange({
    start: newStart,
    end: newEnd
  })
})
</script>

<style scoped>
.timetable-grid {
  @apply border rounded overflow-hidden;
}

.grid-header {
  @apply grid grid-cols-8 bg-gray-100;
}

.time-header {
  @apply p-2 text-center border-b border-r bg-gray-200;
}

.date-cell {
  @apply p-2 text-center border-b border-r;
}

.time-slots {
  @apply divide-y;
}

.time-row {
  @apply grid grid-cols-8;
}

.time-label {
  @apply p-2 text-center border-r bg-gray-50 text-sm;
}

.time-cell {
  @apply p-2 border-r min-h-[100px];
}
</style>
