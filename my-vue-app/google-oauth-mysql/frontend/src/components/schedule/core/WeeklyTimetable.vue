<template>
  <div class="flex flex-col space-y-4">
    <!-- 주 변경 컨트롤 -->
    <div class="flex justify-between items-center mb-2">
      <button 
        @click="changeWeek(-1)" 
        class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        이전 주
      </button>
      
      <div class="text-center">
        <span class="font-semibold">
          {{ new Date(currentWeek).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) }}
          ~
          {{ new Date(new Date(currentWeek).setDate(new Date(currentWeek).getDate() + 6)).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) }}
        </span>
      </div>
      
      <button 
        @click="changeWeek(1)" 
        class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        다음 주
      </button>
    </div>
    
    <!-- 범례 표시 -->
    <div class="flex justify-start gap-4 text-sm">
      <div class="flex items-center">
        <div class="w-4 h-4 bg-white border border-gray-300 mr-1"></div>
        <span>정규 수업</span>
      </div>
      <div class="flex items-center">
        <div class="w-4 h-4 bg-purple-100 border border-purple-300 mr-1"></div>
        <span>특강</span>
      </div>
      <div class="flex items-center">
        <div class="w-4 h-4 bg-amber-100 border border-amber-300 mr-1"></div>
        <span>휴강</span>
      </div>
      <div class="flex items-center">
        <div class="w-4 h-4 bg-green-100 border border-green-300 mr-1"></div>
        <span>보강</span>
      </div>
      <div class="flex items-center">
        <div class="w-4 h-4 bg-red-100 border border-red-300 mr-1"></div>
        <span>공휴일</span>
      </div>
    </div>
    
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
                :dayIndex="index"
                :timeIndex="period"
                @click="handleCellClick(day, period)"
                @cell-click="handleCellClick"
                @edit="handleEdit"
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
      @edit="handleEdit"
      @cancel="handleCancelEvent"
      @close="timetableStore.closeModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTimetableStore } from '@/store/modules/timetable.js'
import TimetableCell from './TimetableCell.vue'
import RegisterEventModal from '../forms/RegisterEventModal.vue'
import DetailEventModal from '../modals/DetailEventModal.vue'
import { nextTick } from 'vue'
import { useRoute } from 'vue-router'
//import { DAYS_OF_WEEK, CLASS_TYPES } from '@/constants/timetable/index.js'

// 현재 주 구하기
const getCurrentWeek = () => {
  // 테스트용 날짜 지정 (2025-04-13이 속한 주)
  const testDate = new Date('2025-04-13'); // 이 날짜는 2025년 4월 13일
  return testDate.toISOString().split('T')[0];
  
  // 실제 현재 날짜 기준
  // const now = new Date()
  // 기준일(일요일)
  // const sunday = new Date(now.setDate(now.getDate() - now.getDay()))
  // 
  // console.log(`🗓️ 현재 주 기준 일요일: ${sunday.toISOString().split('T')[0]}`)
  // return sunday.toISOString().split('T')[0]
}

// props 정의
const props = defineProps({
  selectedGrade: {
    type: Number,
    default: 1
  }
})

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri']
const DAY_NAMES = ['월', '화', '수', '목', '금']
const PERIODS = Array.from({ length: 9 }, (_, i) => i + 1)

const timetableStore = useTimetableStore()
const route = useRoute()

// 경로의 쿼리 파라미터나 prop으로부터 현재 선택된 학년을 결정
const selectedGrade = ref(props.selectedGrade)
const currentWeek = ref(getCurrentWeek())

const showScheduleModal = ref(false)
const modalType = ref('regular')
const modalData = ref({})
const selectedTimetable = ref(null)
const showTypeSelector = ref(true)


const dragState = ref({
  isDragging: false,
  startDay: null,
  startPeriod: null,
  endDay: null,
  endPeriod: null
})

// props가 변경될 때 내부 상태 업데이트
watch(() => props.selectedGrade, (newGrade) => {
  selectedGrade.value = newGrade
})

// 이벤트 날짜가 현재 표시 중인 주에 해당하는지 확인
const isDateInCurrentWeek = (eventDate) => {
  if (!eventDate) return false
  
  try {
    // 현재 선택된 주의 시작일(일요일) 구하기
    const startDate = new Date(currentWeek.value)
    startDate.setHours(0, 0, 0, 0)
    
    // 주의 마지막 날(토요일) 구하기
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    endDate.setHours(23, 59, 59, 999)
    
    // 이벤트 날짜
    const date = new Date(eventDate)
    
    // 날짜 비교 로그
    console.log(`📅 날짜 비교: 이벤트=${date.toISOString().split('T')[0]}, 주 범위=${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]}`)
    
    // 날짜 범위 검사
    const isInRange = date >= startDate && date <= endDate
    if (isInRange) {
      console.log(`✅ 이벤트 날짜 ${date.toISOString().split('T')[0]}은(는) 현재 선택된 주(${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]})에 포함됩니다.`)
    } else {
      console.log(`❌ 이벤트 날짜 ${date.toISOString().split('T')[0]}은(는) 현재 선택된 주(${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]})에 포함되지 않습니다.`)
    }
    
    return isInRange
  } catch (error) {
    console.error('❌ 날짜 비교 중 오류 발생:', error, '이벤트 날짜:', eventDate)
    return false
  }
}

// 주 이동 함수 (이전, 다음 주 이동)
const changeWeek = (offset = 0) => {
  // 현재 주의 시작일(일요일) 가져오기
  const currentDate = new Date(currentWeek.value)
  
  // offset 주 만큼 이동 (예: -1은 이전 주, 1은 다음 주)
  currentDate.setDate(currentDate.getDate() + (offset * 7))
  
  // 새 주 설정 (항상 일요일 기준으로)
  const newWeek = currentDate.toISOString().split('T')[0]
  currentWeek.value = newWeek
  
  console.log(`📆 주 변경: ${newWeek} (${offset > 0 ? '다음' : '이전'} 주)`)
  console.log(`🔍 선택된 주 범위 확인:`)
  
  // 현재 선택된 주의 범위 확인 (디버깅용)
  const startOfWeek = new Date(newWeek)
  startOfWeek.setHours(0, 0, 0, 0)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)
  
  console.log(`📆 조회 주 시작일(일): ${startOfWeek.toISOString().split('T')[0]}`)
  console.log(`📆 조회 주 종료일(토): ${endOfWeek.toISOString().split('T')[0]}`)
  
  fetchEvents() // 새 주 데이터 조회
}

// 이벤트 조회 (학년별 필터링 포함)
const fetchEvents = async () => {
  console.log(`학년 ${selectedGrade.value}에 대한 데이터 조회 중...`)
  console.log(`📆 조회 주: ${currentWeek.value}`)
  
  // 현재 선택된 주의 시작일(일요일)과 종료일(토요일) 계산
  const startDate = new Date(currentWeek.value)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)
  
  console.log(`📅 조회 주 범위: ${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]}`)
  
  // 현재 선택된 학년을 timetableStore의 currentGrade로 설정
  timetableStore.setCurrentGrade(selectedGrade.value)
  
  // 현재 선택된 주를 store에 설정
  timetableStore.setCurrentWeek(currentWeek.value)
  
  // 파라미터 구성
  const params = {
    grade: selectedGrade.value,                // 현재 선택된 학년
    week: currentWeek.value,                   // 현재 선택된 주
    semester: timetableStore.getCurrentSemester(), // 현재 학기
    year: new Date().getFullYear(),           // 현재 년도
    skipGradeFilter: false,                   // 정규 수업은 학년별로 필터링 (false)
    level: timetableStore.currentLevel        // 현재 선택된 레벨 (ref 직접 참조)
  }
  
  console.log('📝 시간표 조회 파라미터:', params)
  
  // 주간 이벤트 조회 (모든 필요 파라미터 포함)
  await timetableStore.fetchWeeklyEvents(params)
  
  // 이벤트 로딩 후 필터링 결과 로깅
  console.log(`📊 최종 이벤트 로드 완료: 총 ${timetableStore.events.length}개, 필터링 후: ${timetableStore.filteredEvents.length}개`)
  
  // 날짜 기반 이벤트(makeups, cancellations) 검사
  const makeupEvents = timetableStore.events.filter(e => 
    e.type === 'makeup' || e.event_type === 'makeup'
  )
  
  const cancelEvents = timetableStore.events.filter(e => 
    e.type === 'cancel' || e.event_type === 'cancel'
  )
  
  // 현재 주에 해당하는 makeup/cancel 이벤트 찾기
  if (makeupEvents.length > 0) {
    console.log(`🔄 보강 이벤트 ${makeupEvents.length}개 발견:`)
    makeupEvents.forEach(event => {
      const eventDate = event.event_date || event.date
      const isInCurrentWeek = isDateInCurrentWeek(eventDate)
      console.log(`  - ID: ${event.id}, 날짜: ${eventDate}, 과목: ${event.subject_name || event.title}, 현재 주에 포함: ${isInCurrentWeek ? '✅' : '❌'}`)
    })
  }
  
  if (cancelEvents.length > 0) {
    console.log(`🛑 휴강 이벤트 ${cancelEvents.length}개 발견:`)
    cancelEvents.forEach(event => {
      const eventDate = event.event_date || event.date
      const isInCurrentWeek = isDateInCurrentWeek(eventDate)
      console.log(`  - ID: ${event.id}, 날짜: ${eventDate}, 과목: ${event.subject_name || event.title}, 현재 주에 포함: ${isInCurrentWeek ? '✅' : '❌'}`)
    })
  }
  
  // 특강 데이터 확인
  const specialLectures = timetableStore.events.filter(e => 
    e.is_special_lecture === 1 || 
    e.type === 'special' || 
    e.event_type === 'special'
  )
  
  console.log(`📊 특강 데이터: ${specialLectures.length}개`)
  
  // 학년별 정규 수업 데이터 확인
  const regularByGrade = {}
  timetableStore.events.forEach(e => {
    const isRegular = (!e.is_special_lecture || e.is_special_lecture === 0) && 
                       (!e.type || e.type === 'regular') &&
                       (e.year !== null && e.year !== undefined)
    
    if (isRegular) {
      const grade = e.year
      regularByGrade[grade] = (regularByGrade[grade] || 0) + 1
    }
  })
  
  console.log('📊 학년별 정규 수업:', regularByGrade)
}

// 초기 학년 설정을 위한 함수
const updateGradeFromRoute = () => {
  // URL에서 학년 정보 가져오기 
  // 예: /timetable?grade=2 또는 props로 전달된 경우
  const gradeFromRoute = route.query.grade 
    ? (Array.isArray(route.query.grade) ? route.query.grade[0] : route.query.grade)
    : route.params.grade
  
  if (gradeFromRoute) {
    selectedGrade.value = parseInt(String(gradeFromRoute))
  }
  
  console.log(`선택된 학년: ${selectedGrade.value}`)
}

// 학년 선택 변경 함수 (외부에서 호출 가능)
const changeGrade = (grade) => {
  if (grade >= 1 && grade <= 3) {
    selectedGrade.value = grade
    fetchEvents() // 학년 변경 시 데이터 다시 조회
  }
}

// 셀별 이벤트 조회
const getEventsForCell = (day, period) => {
  console.log(`🔍 셀(${day}, ${period}) 이벤트 조회 시작 - 총 ${timetableStore.events.length}개 중`)
  
  // 날짜 기반 이벤트 (휴강/보강)가 있는지 체크
  const dateBasedEvents = timetableStore.events.filter(event => {
    if (!event) return false
    
    // 이벤트에 날짜 정보가 있는지 확인
    const hasDateInfo = event.event_date || event.date
    if (!hasDateInfo) return false
    
    // 타입이 휴강 또는 보강인지 확인
    const isCancellationOrMakeup = 
      (event.type === 'cancel' || event.event_type === 'cancel') || 
      (event.type === 'makeup' || event.event_type === 'makeup')
    
    if (!isCancellationOrMakeup) return false
    
    // 이벤트 날짜가 현재 표시 중인 주에 포함되는지 확인
    const isInCurrentWeek = isDateInCurrentWeek(hasDateInfo)
    if (!isInCurrentWeek) return false
    
    // 요일 일치 확인
    const eventDate = new Date(hasDateInfo)
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    const eventDayName = dayNames[eventDate.getDay()]
    
    // 해당 요일(열)과 교시(행)에 일치하는지
    if (eventDayName !== day) return false
    
    const isInPeriodRange = period >= (event.start_period || 1) && period <= (event.end_period || 9)
    if (!isInPeriodRange) return false
    
    // 모든 조건 충족
    console.log(`🎯 날짜 기반 이벤트 매칭 성공! 타입: ${event.type || event.event_type}, 날짜: ${hasDateInfo}, 교시: ${event.start_period}-${event.end_period}`)
    return true
  })
  
  // 날짜 기반 이벤트가 있다면 우선 표시 (우선순위 높음)
  if (dateBasedEvents.length > 0) {
    console.log(`📅 날짜 기반 이벤트 ${dateBasedEvents.length}개 발견 (${day}, ${period})`)
    return dateBasedEvents
  }
  
  // 일반 이벤트 필터링 (기존 로직 유지)
  const cellEvents = timetableStore.events.filter(event => {
    // 1. 공휴일 - 전체 요일에 적용
    if (event.type === 'holiday' || event.event_type === 'holiday') {
      const eventDate = new Date(event.event_date || event.date)
      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
      const eventDayName = dayNames[eventDate.getDay()]
      const isHolidayMatch = day === eventDayName && isDateInCurrentWeek(eventDate)
      
      if (isHolidayMatch) {
        console.log(`🏖️ 공휴일 매칭 (${day}, ${period}): ${event.title || event.name || '공휴일'}, 날짜: ${eventDate.toISOString().split('T')[0]}`)
      }
      
      return isHolidayMatch
    }

    // 2. 이벤트 유형 판별
    const isCancellation = event.type === 'cancel' || event.event_type === 'cancel'
    const isMakeup = event.type === 'makeup' || event.event_type === 'makeup'
    const isSpecialLecture = event.is_special_lecture === 1 || 
                            event.is_special_lecture === true || 
                            event.is_special_lecture === '1' ||
                            event.type === 'special' || 
                            event.event_type === 'special'
    const isTopikClass = event.is_foreigner_target === 1 || 
                        event.is_foreigner_target === true ||
                        event.is_foreigner_target === '1' ||
                        event.type === 'topik' ||
                        event.event_type === 'topik' ||
                        (event.level && event.level.includes('TOPIK'))
    
    // 3. 날짜 기반 이벤트 (보강/휴강) 
    // - 앞에서 이미 처리했으므로 여기서는 제외
    if ((isCancellation || isMakeup) && (event.event_date || event.date)) {
      return false
    }
    
    // 4. 요일 기반 이벤트 (정규 수업, 특강 등)
    // 요일/교시 매칭 확인 (비날짜 기반 이벤트 전용)
    const dayMap = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금' }
    const dayMatches = (event.day === dayMap[day] || event.day === day)
    const periodMatches = period >= (event.start_period || 1) && period <= (event.end_period || 9)
    
    // 요일/교시 조건이 일치하지 않으면 제외
    if (!dayMatches || !periodMatches) return false

    // 5. 특강 (모든 학년에 표시)
    if (isSpecialLecture) {
      console.log(`✨ 요일 기반 특강 포함 (${day}, ${period}): ${event.subject_name || event.title || '특강'}, 레벨: ${event.level || 'N/A'}`)
      return true // 특강은 모든 학년에 표시
    }
    
    // 6. TOPIK 수업 (외국인 대상 수업) - 모든 학년에 표시
    if (isTopikClass) {
      console.log(`🌏 요일 기반 TOPIK 수업 포함 (${day}, ${period}): ${event.subject_name || event.title || 'TOPIK'}, 레벨: ${event.level || 'N/A'}`)
      return true // TOPIK 수업도 모든 학년에 표시 가능
    }
    
    // 7. 정규 수업 (학년별 필터링)
    const eventYear = event.year !== null && event.year !== undefined ? Number(event.year) : null
    const currentGradeInt = Number(selectedGrade.value)
    
    if (eventYear === null) {
      console.log(`⚠️ 정규 수업 누락된 학년 정보 (${day}, ${period}): ${event.subject_name || event.title || '제목 없음'}`)
      return false // 학년 정보가 없으면 표시 안함
    }
    
    const yearMatches = eventYear === currentGradeInt
    
    if (yearMatches) {
      console.log(`📚 정규 수업 포함 (${day}, ${period}): ${event.subject_name || event.title || '정규'}, 학년: ${eventYear}`)
    }
    
    return yearMatches
  })
  
  // 이벤트 개수 및 유형별 로깅
  const eventTypes = {
    regular: 0,
    special: 0,
    cancel: 0,
    makeup: 0,
    holiday: 0,
    topik: 0
  }
  
  // 이벤트 분류 (일반 이벤트 + 날짜 기반 이벤트 합치기)
  const allEvents = [...cellEvents]
  
  allEvents.forEach(event => {
    if (event.type === 'holiday' || event.event_type === 'holiday') {
      eventTypes.holiday++
    } else if (event.type === 'cancel' || event.event_type === 'cancel') {
      eventTypes.cancel++
    } else if (event.type === 'makeup' || event.event_type === 'makeup') {
      eventTypes.makeup++
    } else if (event.is_special_lecture === 1 || event.type === 'special' || event.event_type === 'special') {
      eventTypes.special++
    } else if (event.is_foreigner_target === 1 || event.type === 'topik' || event.event_type === 'topik' || 
               (event.level && event.level.includes('TOPIK'))) {
      eventTypes.topik++
    } else {
      eventTypes.regular++
    }
  })
  
  // 이벤트 개수 로깅 추가
  console.log(`📊 셀(${day}, ${period}) 이벤트 개수: ${allEvents.length} (정규: ${eventTypes.regular}, 특강: ${eventTypes.special}, 휴강: ${eventTypes.cancel}, 보강: ${eventTypes.makeup}, 공휴일: ${eventTypes.holiday}, TOPIK: ${eventTypes.topik})`)
  
  return allEvents
}

// 공휴일 체크
const isHoliday = (day) => {
  const holidayEvents = timetableStore.events.filter(event => {
    if (event.type !== 'holiday' && event.event_type !== 'holiday') return false
    
    const eventDate = new Date(event.event_date || event.date)
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    const eventDayName = dayNames[eventDate.getDay()]
    const isMatch = day === eventDayName
    
    if (isMatch) {
      console.log(`🏖️ 공휴일 확인: ${event.title || event.name || '공휴일'}, 날짜: ${eventDate.toISOString().split('T')[0]}, 요일: ${eventDayName}`)
    }
    
    return isMatch
  })
  
  return holidayEvents.length > 0
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
  timetableStore.showMakeupClassModal({
    day: startDay,
    start_period: start,
    end_period: end
  })

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
const handleCellClick = (data, periodArg) => {
  // 새로운 cell-click 이벤트 형식 처리
  if (typeof data === 'object' && data.hasOwnProperty('action')) {
    // 스토어의 통합 셀 액션 핸들러로 전달
    timetableStore.handleCellAction(data);
    return;
  }
  
  // 기존 처리 방식 (호환성 유지)
  const day = data;
  const period = periodArg;
  
  const events = getEventsForCell(day, period);
  if (events.length > 0) {
    timetableStore.showDetailModal(events);
  } else {
    // Show cancel class modal for single cell clicks
    timetableStore.showCancelClassModal(day, period);
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
    // 이벤트 ID 문자열 변환
    const stringId = String(eventId);
    console.log(`🗑️ 이벤트 취소 요청: ID ${stringId}`);
    
    // 이벤트 객체 찾기
    const targetEvent = timetableStore.events.find(e => String(e.id) === stringId);
    
    if (!targetEvent) {
      console.error(`❌ ID ${stringId}에 해당하는 이벤트를 찾을 수 없습니다.`);
      alert('취소할 이벤트를 찾을 수 없습니다.');
      return;
    }
    
    console.log('🎯 취소할 이벤트 정보:', targetEvent);
    
    // 요청 준비 (이벤트 유형에 맞게 데이터 구성)
    const payload = { 
      id: stringId,
      event_type: targetEvent.event_type || targetEvent.type || 'regular',
      is_special_lecture: targetEvent.is_special_lecture
    };
    
    // 특강 여부 체크
    if (targetEvent.is_special_lecture === 1 || targetEvent.type === 'special' || targetEvent.event_type === 'special') {
      payload.is_special_lecture = 1;
    }
    
    console.log('📤 삭제 요청 데이터:', payload);
    
    // 이벤트 삭제 요청
    await timetableStore.processScheduleAction(payload, 'delete');
    
    // 성공 메시지 출력
    console.log('✅ 이벤트가 성공적으로 취소되었습니다.');
    
    // 이벤트 목록 다시 로드
    await fetchEvents();
  } catch (error) {
    console.error('❌ 이벤트 취소 실패:', error);
    
    // 사용자에게 알림
    if (error.response && error.response.status === 500) {
      alert('서버 오류가 발생했습니다. 관리자에게 문의하세요.');
    } else {
      alert('이벤트 취소 중 오류가 발생했습니다.');
    }
  }
}

// 이벤트 수정 핸들러
const handleEdit = async (event) => {
  console.log('🟢 edit 이벤트 도착', event)
  const eventType = event.type || event.event_type || 'regular'

  // ✅ 수정 모드용 데이터 구성
  const modalData = {
    id: event.id,
    timetable_id: event.timetable_id || event.id,
    subject_id: event.subject_id,
    title: event.title || event.subject_name,
    day: event.day,
    start_period: event.start_period,
    end_period: event.end_period,
    professor_name: event.professor_name || event.inherited_professor_name,
    room: event.room || event.inherited_room,
    type: eventType,
    is_special_lecture: eventType === 'special' ? 1 : 0,
    year: event.year || null,
    level: event.level || null,
    semester: event.semester,
    isEdit: true
  }

  // ✅ 모달 열기
  timetableStore.openUnifiedScheduleForm({
    isEdit: true,
    modalData,
    eventType,
    timetableData: event,
    showTypeSelector: true,
    allowCancel: true
  })

  // ⚠️ 기존 modalData.value 등은 제거 가능
}


// 학년/레벨 변경 감지
watch([() => selectedGrade.value], () => {
  console.log(`학년 변경 감지: ${selectedGrade.value}`)
  fetchEvents()
})

// 라우트 변경 감지
watch(() => route.query.grade, () => {
  updateGradeFromRoute()
})

onMounted(() => {
  updateGradeFromRoute()
  fetchEvents()
})

// 이벤트 노출을 위해 defineExpose 사용
defineExpose({
  changeGrade,
  changeWeek,
  selectedGrade,
  currentWeek,
  fetchEvents
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
