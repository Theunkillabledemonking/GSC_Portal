<template>
  <div class="flex flex-col space-y-4">
    <!-- 시간표 -->
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="border p-2 bg-gray-50">교시</th>
            <th 
              v-for="(dayName, index) in ['월', '화', '수', '목', '금']" 
              :key="dayName"
              class="border p-2 bg-gray-50 min-w-[150px]"
            >
              {{ dayName }}요일
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="period in 9" :key="period">
            <td class="border p-2 text-center bg-gray-50">{{ period }}교시</td>
            <td 
              v-for="(day, index) in ['mon', 'tue', 'wed', 'thu', 'fri']" 
              :key="day"
              class="border p-2 relative min-h-[80px]"
              @mousedown="handleDragStart(day, period)"
              @mouseover="handleDragOver(day, period)"
              @mouseup="handleDragEnd"
              @mouseleave="handleDragLeave"
            >
              <TimetableCell
                :day="day"
                :period="period"
                :events="getEventsForCell(day, period)"
                :is-holiday="isHoliday(day)"
                :is-dragging="isDragging(day, period)"
                @click="handleCellClick(day, period)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 이벤트 등록 모달 -->
    <RegisterEventModal 
      v-if="timetableStore.showModal && timetableStore.modalType === 'register'"
      :initial-data="timetableStore.modalData || {}"
      @close="timetableStore.closeModal"
      @submit="handleRegisterEvent"
    />

    <!-- 이벤트 상세 모달 -->
    <DetailEventModal
      v-if="timetableStore.showModal && timetableStore.modalType === 'detail'"
      :events="timetableStore.modalData?.events || []"
      @close="timetableStore.closeModal"
      @cancel="handleCancelEvent"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTimetableStore } from '@/store/modules/timetable'
import TimetableCell from './TimetableCell.vue'
import RegisterEventModal from './RegisterEventModal.vue'
import DetailEventModal from './DetailEventModal.vue'
import { DAYS_OF_WEEK, CLASS_TYPES } from '@/constants/timetable'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri']
const DAY_NAMES = ['월', '화', '수', '목', '금']
const PERIODS = Array.from({ length: 9 }, (_, i) => i + 1)

const timetableStore = useTimetableStore()
const selectedGrade = ref(1)

const dragState = ref({
  isDragging: false,
  startDay: null,
  startPeriod: null,
  endDay: null,
  endPeriod: null
})

// 현재 주 구하기
const getCurrentWeek = () => {
  const now = new Date()
  const sunday = new Date(now.setDate(now.getDate() - now.getDay()))
  return sunday.toISOString().split('T')[0]
}

// 이벤트 조회
const fetchEvents = async () => {
  await timetableStore.fetchWeeklyEvents({
    grade: selectedGrade.value,
    week: getCurrentWeek()
  })
}

// 셀별 이벤트 조회
const getEventsForCell = (day, period) => {
  return timetableStore.events.filter(event => {
    // 공휴일은 전체 요일에 적용
    if (event.type === 'holiday' || event.event_type === 'holiday') {
      const eventDate = new Date(event.event_date || event.date)
      const dayIndex = eventDate.getDay()
      const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5 }
      return dayMap[day] === dayIndex
    }

    // 날짜 기반 이벤트 (보강/휴강)
    if (event.event_date || event.date) {
      const eventDate = new Date(event.event_date || event.date)
      const dayIndex = eventDate.getDay()
      const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5 }
      return dayMap[day] === dayIndex && 
             period >= (event.start_period || 1) && 
             period <= (event.end_period || 9)
    }

    // 요일 기반 이벤트 (정규/특강)
    const dayMap = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금' }
    return (event.day === dayMap[day] || event.day === day) && 
           period >= (event.start_period || 1) && 
           period <= (event.end_period || 9)
  })
}

// 공휴일 체크
const isHoliday = (day) => {
  return timetableStore.events.some(event => {
    if (event.type !== 'holiday') return false
    const eventDate = new Date(event.event_date || event.date)
    const dayIndex = eventDate.getDay()
    const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5 }
    return dayMap[day] === dayIndex
  })
}

// 드래그 상태 체크
const isDragging = (day, period) => {
  if (!dragState.value.isDragging) return false
  if (dragState.value.startDay !== day) return false

  const startPeriod = Math.min(dragState.value.startPeriod, dragState.value.endPeriod || dragState.value.startPeriod)
  const endPeriod = Math.max(dragState.value.startPeriod, dragState.value.endPeriod || dragState.value.startPeriod)

  return period >= startPeriod && period <= endPeriod
}

// 드래그 핸들러
const handleDragStart = (day, period) => {
  dragState.value = {
    isDragging: true,
    startDay: day,
    startPeriod: period,
    endDay: day,
    endPeriod: period
  }
}

const handleDragOver = (day, period) => {
  if (!dragState.value.isDragging) return
  if (day !== dragState.value.startDay) return

  dragState.value.endDay = day
  dragState.value.endPeriod = period
}

const handleDragEnd = () => {
  if (!dragState.value.isDragging) return

  const { startDay, startPeriod, endPeriod } = dragState.value
  const start = Math.min(startPeriod, endPeriod)
  const end = Math.max(startPeriod, endPeriod)

  // Show makeup class modal for drag events
  timetableStore.showMakeupClassModal(start, end)

  dragState.value = {
    isDragging: false,
    startDay: null,
    startPeriod: null,
    endDay: null,
    endPeriod: null
  }
}

const handleDragLeave = () => {
  if (dragState.value.isDragging) {
    dragState.value.endPeriod = dragState.value.startPeriod
  }
}

// 셀 클릭 핸들러
const handleCellClick = (day, period) => {
  const events = getEventsForCell(day, period)
  if (events.length > 0) {
    timetableStore.showDetailModal(events)
  } else {
    // Show cancel class modal for single cell clicks
    timetableStore.showCancelClassModal(day, period)
  }
}

// 이벤트 등록 핸들러
const handleRegisterEvent = async (eventData) => {
  try {
    if (timetableStore.modalType === 'cancel') {
      await timetableStore.registerCancellation(eventData)
    } else if (timetableStore.modalType === 'makeup') {
      await timetableStore.registerMakeup(eventData)
    }
    await fetchEvents()
  } catch (error) {
    console.error('Failed to register event:', error)
  }
}

// 이벤트 취소 핸들러
const handleCancelEvent = async (eventId) => {
  try {
    await timetableStore.cancelClass(eventId)
    await fetchEvents()
  } catch (error) {
    console.error('Failed to cancel event:', error)
  }
}

// 학년/레벨 변경 감지
watch([() => selectedGrade.value], () => {
  fetchEvents()
})

onMounted(() => {
  fetchEvents()
})
</script>

<style scoped>
.min-h-80px {
  min-height: 80px;
}

.is-dragging {
  background-color: #EBF5FF;
}
</style>
