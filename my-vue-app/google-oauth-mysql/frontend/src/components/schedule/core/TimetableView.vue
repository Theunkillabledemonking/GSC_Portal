<template>
  <div class="timetable-view">
    <!-- 상단 컨트롤 영역 -->
    <div class="control-panel">
      <div class="filter-controls">
        <!-- 학년 선택 -->
        <div class="control-group grade-selector">
          <button 
            v-for="grade in [1, 2, 3]" 
            :key="`grade-${grade}`"
            :class="['filter-btn', { active: currentGrade === grade }]"
            @click="handleGradeChange(grade)"
          >
            {{ grade }}학년
          </button>
        </div>
        
        <!-- 레벨 선택 -->
        <div class="control-group level-selector">
          <button 
            v-for="level in levels" 
            :key="`level-${level.value}`"
            :class="['filter-btn', { active: currentLevel === level.value }]"
            @click="handleLevelChange(level.value)"
          >
            {{ level.label }}
          </button>
        </div>
      </div>
      
      <!-- 주차 네비게이션 -->
      <div class="week-navigator">
        <button class="nav-btn" @click="navigatePrevWeek">
          <span class="arrow">←</span> 이전 주
        </button>
        
        <div class="current-week">
          {{ formatDateRange(weekStart, weekEnd) }}
        </div>
        
        <button class="nav-btn" @click="navigateNextWeek">
          다음 주 <span class="arrow">→</span>
        </button>
      </div>
    </div>

    <!-- 시간표 컨테이너 -->
    <div class="timetable-container" :class="{ 'loading': isLoading }">
      <table class="timetable">
        <thead>
          <tr>
            <th class="time-header">교시</th>
            <th v-for="(day, index) in DAYS" :key="day" class="day-header">
              {{ DAY_NAMES[index] }}요일
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="period in PERIODS" :key="`period-${period}`">
            <td class="period-cell">{{ period }}교시</td>
            <td 
              v-for="(day, dayIndex) in DAYS" 
              :key="`cell-${day}-${period}`"
              class="schedule-cell-container"
            >
              <TimetableCell
                :dayIndex="dayIndex"
                :timeIndex="period"
                :events="getEventsForCell(day, period)"
                :is-holiday="isHoliday(day, period)"
                :allow-drop="true"
                @cell-click="handleCellClick"
                @dragStart="handleCellDragStart"
              />
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- 로딩 인디케이터 -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text">시간표 로드 중...</div>
      </div>
    </div>
    
    <!-- 수업 등록/관리 모달 -->
    <UnifiedScheduleForm
      v-if="showScheduleModal"
      :initial-data="modalData"
      :event-type="modalType"
      :timetable-data="selectedTimetable"
      :show-type-selector="showTypeSelector"
      :allow-makeup="true"
      :allow-cancel="true"
      @submit="handleScheduleSubmit"
      @cancel="closeModal"
      @error="handleFormError"
    />
    
    <!-- 이벤트 상세 모달 -->
    <DetailEventModal
      v-if="showDetailModal"
      :events="selectedEvents"
      @cancel-class="handleCancelClass"
      @makeup-class="handleMakeupClass"
      @edit="handleEditEvent"
      @delete="handleDeleteEvent"
      @close="closeDetailModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTimetableStore } from '@/store/modules/timetable'
import { useToast } from '@/composables/useToast'
import TimetableCell from './TimetableCell.vue'
import UnifiedScheduleForm from './WeeklyTimetable/forms/UnifiedScheduleForm.vue'
import DetailEventModal from './DetailEventModal.vue'
// import { getWeekRange, formatDateRange } from '@/utils/date'

// Use the toast composable
const toast = useToast()

// formatDateRange 구현
function formatDateRange(start, end) {
  const options = { month: 'long', day: 'numeric' }
  return `${start.toLocaleDateString('ko-KR', options)} - ${end.toLocaleDateString('ko-KR', options)}`
}

// 상수 정의
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri']
const DAY_NAMES = ['월', '화', '수', '목', '금']
const PERIODS = Array.from({ length: 9 }, (_, i) => i + 1)
const levels = [
  { value: 'beginner', label: '초급' },
  { value: 'intermediate', label: '중급' },
  { value: 'advanced', label: '고급' }
]

// Store 및 상태 관리
const timetableStore = useTimetableStore()

// 로컬 상태
const currentWeek = ref(new Date())
const currentGrade = ref(1)
const currentLevel = ref('beginner')
const isLoading = ref(false)

// 모달 관련 상태
const showScheduleModal = ref(false)
const showDetailModal = ref(false)
const modalType = ref('regular') // 'regular', 'special', 'topik', 'cancel', 'makeup'
const modalData = ref({})
const selectedTimetable = ref(null)
const selectedEvents = ref([])
const showTypeSelector = ref(true)

// 드래그 상태 관리
const dragState = ref({
  isDragging: false,
  startDay: null,
  startPeriod: null,
  endDay: null,
  endPeriod: null,
  eventData: null
})

// 계산된 속성
const weekStart = computed(() => {
  const startDate = new Date(currentWeek.value)
  const day = startDate.getDay()
  // 월요일로 설정 (일요일이면 6일 뺌, 다른 날은 해당 요일 수 - 1만큼 뺌)
  startDate.setDate(startDate.getDate() - (day === 0 ? 6 : day - 1))
  return startDate
})

const weekEnd = computed(() => {
  const endDate = new Date(weekStart.value)
  // 금요일까지 (시작일로부터 4일 후)
  endDate.setDate(endDate.getDate() + 4)
  return endDate
})

// 시간표 데이터 로드
const loadTimetableData = async () => {
  isLoading.value = true
  try {
    console.log('🔄 시간표 데이터 로드 요청:', {
      grade: currentGrade.value,
      week: formatDate(weekStart.value),
      semester: timetableStore.getCurrentSemester(),
      year: new Date().getFullYear()
    })
    
    // 주간 이벤트 조회 (grade, level 고려)
    await timetableStore.fetchWeeklyEvents({
      grade: currentGrade.value,
      level: currentLevel.value,
      week: formatDate(weekStart.value),
      group_level: 'ALL', // 모든 분반의 특강 데이터를 가져옴
      ignoreGradeFilter: 'true' // 특강은 학년 필터 무시
    })
  } catch (error) {
    console.error('시간표 데이터 로드 실패:', error)
    toast.error('시간표를 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

// 이벤트 필터링 - 특정 요일/교시 셀에 표시할 이벤트 목록
const getEventsForCell = (day, period) => {
  // day: 'mon', 'tue', ... 형식
  // dayIndex: 0(월요일), 1(화요일), ... 으로 변환
  const dayIndex = DAYS.indexOf(day)
  
  if (dayIndex < 0) return []
  
  return timetableStore.filteredEvents.filter(event => {
    // 휴일이면 모든 이벤트 포함 (전체 일자 차지)
    if (event.type === 'holiday' || event.event_type === 'holiday') {
      const eventDate = event.date || event.event_date
      if (eventDate) {
        const eventDay = new Date(eventDate).getDay()
        return eventDay - 1 === dayIndex // 0(일)~6(토) → -1~5 변환 (월~금: 0~4)
      }
      return false
    }
    
    // 일반/특강/보강/휴강은 요일+교시로 필터링
    const eventDay = String(event.day).toLowerCase()
    const startPeriod = Number(event.start_period) || 1
    const endPeriod = Number(event.end_period) || startPeriod
    
    // 숫자 요일(1-5)을 텍스트(mon-fri)로 변환
    let dayValue = eventDay
    if (['1', '2', '3', '4', '5'].includes(eventDay)) {
      dayValue = DAYS[Number(eventDay) - 1]
    }
    
    const isDayMatch = dayValue === day
    const isPeriodMatch = period >= startPeriod && period <= endPeriod
    
    return isDayMatch && isPeriodMatch
  })
}

// 공휴일 확인
const isHoliday = (day, period) => {
  const dayIndex = DAYS.indexOf(day)
  if (dayIndex < 0) return false
  
  // 주간 범위 내 날짜 계산
  const targetDate = new Date(weekStart.value)
  targetDate.setDate(targetDate.getDate() + dayIndex)
  
  // 해당 날짜가 공휴일인지 확인
  const formattedDate = formatDate(targetDate)
  
  return timetableStore.filteredEvents.some(event => 
    (event.type === 'holiday' || event.event_type === 'holiday') && 
    (event.date === formattedDate || event.event_date === formattedDate)
  )
}

// 드래그 대상 셀 확인
const isDragging = (day, period) => {
  if (!dragState.value.isDragging) return false
  if (dragState.value.startDay !== day) return false
  
  const startPeriod = Math.min(dragState.value.startPeriod, dragState.value.endPeriod || dragState.value.startPeriod)
  const endPeriod = Math.max(dragState.value.startPeriod, dragState.value.endPeriod || dragState.value.startPeriod)
  
  return period >= startPeriod && period <= endPeriod
}

// 날짜 포맷 변경 함수
const formatDate = (date) => {
  return date.toISOString().split('T')[0] // YYYY-MM-DD
}

// 핸들러 함수
const handleGradeChange = (grade) => {
  currentGrade.value = grade
  timetableStore.setCurrentGrade(grade)
  loadTimetableData()
}

const handleLevelChange = (level) => {
  currentLevel.value = level
  timetableStore.setLevel(level)
  loadTimetableData()
}

const navigatePrevWeek = () => {
  const prevWeek = new Date(currentWeek.value)
  prevWeek.setDate(prevWeek.getDate() - 7)
  currentWeek.value = prevWeek
  timetableStore.setCurrentWeek(prevWeek)
  loadTimetableData()
}

const navigateNextWeek = () => {
  const nextWeek = new Date(currentWeek.value)
  nextWeek.setDate(nextWeek.getDate() + 7)
  currentWeek.value = nextWeek
  timetableStore.setCurrentWeek(nextWeek)
  loadTimetableData()
}

// 셀 클릭 핸들러
const handleCellClick = (cellData) => {
  const { dayIndex, timeIndex, hasEvents, events } = cellData
  
  if (hasEvents && events.length > 0) {
    // 이벤트가 있는 셀: 상세 모달 표시
    selectedEvents.value = events
    showDetailModal.value = true
  } else {
    // 이벤트가 없는 셀: 등록 모달 (기본: 빈 셀 클릭 = 정규 수업 등록)
    const day = DAYS[dayIndex]
    const dayNumber = dayIndex + 1 // 1(월요일)~5(금요일)
    
    modalData.value = {
      type: 'regular', // 기본값: 정규 수업
      day: dayNumber,
      start_period: timeIndex,
      end_period: timeIndex,
      grade: currentGrade.value,
      level: currentLevel.value
    }
    
    modalType.value = 'regular'
    showTypeSelector.value = true
    selectedTimetable.value = null
    showScheduleModal.value = true
  }
}

// 셀 드래그 시작 핸들러
const handleCellDragStart = (eventData) => {
  const { dayIndex, timeIndex, events, mainEvent } = eventData
  
  // 메인 이벤트가 있는 경우: 휴강 등록 모달
  if (mainEvent) {
    selectedTimetable.value = mainEvent
    
    modalData.value = {
      type: 'cancel',
      timetable_id: mainEvent.id || mainEvent.timetable_id,
      date: formatDate(new Date(weekStart.value.getTime() + dayIndex * 24 * 60 * 60 * 1000)),
      start_period: mainEvent.start_period,
      end_period: mainEvent.end_period,
      professor_name: mainEvent.professor_name,
      room: mainEvent.room,
      inherit_attributes: true
    }
    
    modalType.value = 'cancel'
    showTypeSelector.value = false
    showScheduleModal.value = true
  } else {
    // 빈 셀: 보강 등록을 위한 드래그 시작
    const day = DAYS[dayIndex]
    
    dragState.value = {
      isDragging: true,
      startDay: day,
      startPeriod: timeIndex,
      endDay: day,
      endPeriod: timeIndex,
      eventData: null
    }
  }
}

// 마우스 이동 핸들러
const handleMouseOver = (day, period) => {
  if (!dragState.value.isDragging) return
  if (day !== dragState.value.startDay) return
  
  dragState.value.endPeriod = period
}

// 드래그 종료 핸들러
const handleDragEnd = () => {
  if (!dragState.value.isDragging) return
  
  const { startDay, startPeriod, endPeriod } = dragState.value
  const dayIndex = DAYS.indexOf(startDay)
  
  if (dayIndex >= 0) {
    // 보강 등록 모달 표시
    const start = Math.min(startPeriod, endPeriod)
    const end = Math.max(startPeriod, endPeriod)
    
    modalData.value = {
      type: 'makeup',
      day: dayIndex + 1,
      start_period: start,
      end_period: end,
      date: formatDate(new Date(weekStart.value.getTime() + dayIndex * 24 * 60 * 60 * 1000)),
      grade: currentGrade.value,
      level: currentLevel.value
    }
    
    modalType.value = 'makeup'
    showTypeSelector.value = false
    selectedTimetable.value = null
    showScheduleModal.value = true
  }
  
  // 드래그 상태 초기화
  dragState.value = {
    isDragging: false,
    startDay: null,
    startPeriod: null,
    endDay: null,
    endPeriod: null,
    eventData: null
  }
}

// 모달 액션 핸들러
const handleScheduleSubmit = async (formData) => {
  try {
    console.log('🔄 스케줄 폼 제출:', formData)
    
    // 캐시 즉시 갱신을 위해 타임아웃 없이 즉시 로드
    await loadTimetableData()
    
    // 성공적으로 등록되면 모달 닫기
    closeModal()
    
    // 성공 메시지 표시
    toast.success('일정이 성공적으로 등록되었습니다.')
  } catch (error) {
    console.error('일정 등록 실패:', error)
    toast.error('일정 등록에 실패했습니다.')
  }
}

const handleFormError = (error) => {
  toast.error(error.message || '입력 내용을 확인해주세요.')
}

const closeModal = () => {
  showScheduleModal.value = false
  modalData.value = {}
  selectedTimetable.value = null
  
  // Force the UI to update
  setTimeout(() => {
    showScheduleModal.value = false
  }, 100)
}

// 상세 모달 액션 핸들러
const handleCancelClass = (event) => {
  selectedTimetable.value = event
  
  modalData.value = {
    type: 'cancel',
    timetable_id: event.id || event.timetable_id,
    date: event.date || formatDate(new Date()),
    start_period: event.start_period,
    end_period: event.end_period,
    professor_name: event.professor_name,
    room: event.room,
    inherit_attributes: true
  }
  
  modalType.value = 'cancel'
  showTypeSelector.value = false
  showDetailModal.value = false
  showScheduleModal.value = true
}

const handleMakeupClass = (event) => {
  selectedTimetable.value = event
  
  modalData.value = {
    type: 'makeup',
    timetable_id: event.id || event.timetable_id,
    subject_id: event.subject_id,
    date: formatDate(new Date()),
    start_period: event.start_period,
    end_period: event.end_period,
    professor_name: event.professor_name,
    room: event.room,
    inherit_attributes: true
  }
  
  modalType.value = 'makeup'
  showTypeSelector.value = false
  showDetailModal.value = false
  showScheduleModal.value = true
}

const handleEditEvent = (event) => {
  // 이벤트 유형에 따라 편집 모달 설정
  const eventType = event.type || event.event_type || 'regular'
  const isSpecial = event.is_special_lecture === 1 || event.is_special_lecture === true
  
  // 타입 결정
  let type = eventType
  if (isSpecial) {
    type = 'special'
  } else if (eventType === 'regular' && event.level) {
    type = 'topik'
  }
  
  modalData.value = {
    ...event,
    type
  }
  
  modalType.value = type
  showTypeSelector.value = false
  selectedTimetable.value = null
  showDetailModal.value = false
  showScheduleModal.value = true
}

const handleDeleteEvent = async (event) => {
  if (!confirm('정말 삭제하시겠습니까?')) return
  
  try {
    // 삭제 요청
    await timetableStore.processScheduleAction(event, 'delete')
    
    toast.success('삭제되었습니다.')
    closeDetailModal()
    loadTimetableData()
  } catch (error) {
    console.error('삭제 실패:', error)
    toast.error(error.message || '삭제 중 오류가 발생했습니다.')
  }
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedEvents.value = []
  // Force the UI to update
  setTimeout(() => {
    showDetailModal.value = false
  }, 100)
}

// 이벤트 타입 표시명 반환
const getScheduleTypeName = (type) => {
  switch (type) {
    case 'regular': return '정규 수업'
    case 'topik': return 'TOPIK 수업'
    case 'special': return '특강'
    case 'cancel': return '휴강'
    case 'makeup': return '보강'
    default: return '수업'
  }
}

// Lifecycle hooks
onMounted(async () => {
  // 초기 데이터 로드
  currentGrade.value = timetableStore.currentGrade
  currentLevel.value = timetableStore.currentLevel
  currentWeek.value = timetableStore.currentWeek
  
  await loadTimetableData()
})

// 마우스 업 이벤트를 전역적으로 감시
const setupGlobalMouseEvents = () => {
  document.addEventListener('mouseup', () => {
    if (dragState.value.isDragging) {
      handleDragEnd()
    }
  })
  
  document.addEventListener('mouseleave', () => {
    if (dragState.value.isDragging) {
      handleDragEnd()
    }
  })
}

setupGlobalMouseEvents()
</script>

<style scoped>
.timetable-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.control-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.filter-controls {
  display: flex;
  gap: 1rem;
}

.control-group {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background-color: #f9fafb;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background-color: #f3f4f6;
}

.filter-btn.active {
  background-color: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.week-navigator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background-color: #f9fafb;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  background-color: #f3f4f6;
}

.current-week {
  font-weight: 500;
  color: #1f2937;
  padding: 0.375rem 0.75rem;
  background-color: #f3f4f6;
  border-radius: 4px;
}

.arrow {
  font-size: 1.1em;
}

.timetable-container {
  position: relative;
  width: 100%;
  overflow-x: auto;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.timetable {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.time-header, .day-header {
  padding: 0.75rem;
  background-color: #f9fafb;
  font-weight: 500;
  text-align: center;
  border: 1px solid #e5e7eb;
}

.time-header {
  width: 80px;
}

.period-cell {
  padding: 0.5rem;
  text-align: center;
  font-weight: 500;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
}

.schedule-cell-container {
  position: relative;
  height: 100px;
  min-width: 150px;
  padding: 0;
  vertical-align: top;
  border: 1px solid #e5e7eb;
}

.timetable-container.loading {
  opacity: 0.6;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.spinner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(79, 70, 229, 0.2);
  border-top-color: #4f46e5;
  animation: spin 1s infinite linear;
}

.loading-text {
  margin-top: 1rem;
  color: #4f46e5;
  font-weight: 500;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .control-panel {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .filter-controls {
    flex-direction: column;
    width: 100%;
  }
  
  .week-navigator {
    width: 100%;
    justify-content: space-between;
  }
}
</style> 