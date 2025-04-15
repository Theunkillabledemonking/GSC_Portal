<template>
  <div class="flex flex-col space-y-4">
    <!-- 주 변경 컨트롤 -->
    <div class="flex justify-between items-center mb-2">
      <div class="text-center flex items-center space-x-4">
        <span class="font-semibold">
          {{ formatWeekDateRange(currentWeek) }}
        </span>
        <div class="flex space-x-2">
          <button 
            @click="changeWeek(-1)" 
            class="px-2 py-1 bg-blue-500 text-white rounded-l hover:bg-blue-600"
          >
            ←
          </button>
          <button 
            @click="changeWeek(1)" 
            class="px-2 py-1 bg-blue-500 text-white rounded-r hover:bg-blue-600"
          >
            →
          </button>
        </div>
      </div>
      
      <div>
        <!-- 이 부분은 나중에 다른 컨트롤이 필요하면 추가 -->
      </div>
    </div>
    
    <!-- 범례 표시 - 색상 업데이트 -->
    <div class="flex justify-start gap-4 text-sm">
      <div class="flex items-center">
        <div class="w-4 h-4 rounded-sm bg-blue-500 mr-1"></div>
        <span>정규 수업</span>
      </div>
      <div class="flex items-center">
        <div class="w-4 h-4 rounded-sm bg-orange-400 mr-1"></div>
        <span>특강</span>
      </div>
      <div class="flex items-center">
        <div class="w-4 h-4 rounded-sm bg-red-500 mr-1"></div>
        <span>휴강</span>
      </div>
      <div class="flex items-center">
        <div class="w-4 h-4 rounded-sm bg-green-600 mr-1"></div>
        <span>보강</span>
      </div>
      <div class="flex items-center">
        <div class="w-4 h-4 rounded-sm bg-purple-500 mr-1"></div>
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
                @edit="handleEditEvent"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTimetableStore } from '@/store/modules/timetable.js'
import { useAuthStore } from '@/store'
import TimetableCell from './TimetableCell.vue'
import { nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { format } from 'date-fns'
import { startOfWeek, endOfWeek } from 'date-fns'
//import { DAYS_OF_WEEK, CLASS_TYPES } from '@/constants/timetable/index.js'

// 이벤트 정의 - 부모 컴포넌트에 모달 관련 데이터 전달
const emit = defineEmits(['open-modal', 'edit-event'])

// Authentication store for admin role check
const authStore = useAuthStore()

// 현재 주 구하기
const getCurrentWeek = () => {
  // 스토어의 currentWeek 값 사용
  const storeWeek = timetableStore.currentWeek;
  
  try {
    // 스토어 값이 Date 객체인 경우
    if (storeWeek instanceof Date && !isNaN(storeWeek.getTime())) {
      console.log(`🗓️ 스토어에서 가져온 현재 주: ${storeWeek.toISOString().split('T')[0]}`);
      return storeWeek;
    }
    
    // 스토어 값이 문자열인 경우
    if (typeof storeWeek === 'string') {
      // 문자열을 Date로 변환
      const dateObj = new Date(storeWeek);
      if (!isNaN(dateObj.getTime())) {
        console.log(`🗓️ 스토어에서 가져온 현재 주(문자열): ${dateObj.toISOString().split('T')[0]}`);
        return dateObj;
      }
    }
  } catch (e) {
    console.error('날짜 변환 오류:', e);
  }
  
  // 유효하지 않은 경우 현재 날짜 사용
  const now = new Date();
  console.log(`🗓️ 현재 날짜 사용: ${now.toISOString().split('T')[0]}`);
  return now;
}

// 주 날짜 범위 포맷팅 함수 추가
const formatWeekDateRange = (weekDate) => {
  try {
    // 안전하게 Date 객체로 변환
    const weekDateObj = weekDate instanceof Date ? weekDate : new Date(weekDate);
    
    if (isNaN(weekDateObj.getTime())) {
      console.error('Invalid date value for currentWeek:', weekDate);
      return 'Invalid date range';
    }
    
    // 월요일 계산 (일요일 기준이면 +1, 다른 날이면 요일값에 따라 조정)
    const mondayDate = new Date(weekDateObj);
    const day = mondayDate.getDay(); // 0: 일요일, 1: 월요일, ...
    mondayDate.setDate(mondayDate.getDate() - (day === 0 ? 6 : day - 1));
    
    // 금요일 계산 (월요일 + 4일)
    const fridayDate = new Date(mondayDate);
    fridayDate.setDate(mondayDate.getDate() + 4);
    
    // YYYY-MM-DD 포맷으로 변환
    const mondayStr = mondayDate.toISOString().split('T')[0];
    const fridayStr = fridayDate.toISOString().split('T')[0];
    
    return `${mondayStr} ~ ${fridayStr}`;
  } catch (error) {
    console.error('날짜 범위 포맷 중 오류 발생:', error);
    return 'Date range error';
  }
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
  if (!eventDate) return false;
  
  try {
    // 현재 선택된 주의 시작일(월요일) 구하기
    let weekDate;
    
    // currentWeek 안전하게 처리
    if (currentWeek.value instanceof Date) {
      weekDate = new Date(currentWeek.value);
    } else if (typeof currentWeek.value === 'string') {
      weekDate = new Date(currentWeek.value);
    } else {
      console.warn('currentWeek가 예상치 못한 형식입니다. 현재 날짜를 사용합니다.');
      weekDate = new Date();
    }
    
    const day = weekDate.getDay();
    const startDate = new Date(weekDate);
    startDate.setDate(weekDate.getDate() - (day === 0 ? 6 : day - 1)); // 월요일로 설정
    startDate.setHours(0, 0, 0, 0);
    
    // 주의 마지막 날(금요일) 구하기 (월요일 + 4)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 4);
    endDate.setHours(23, 59, 59, 999);
    
    // 이벤트 날짜
    const date = new Date(eventDate);
    
    // 날짜 비교 로그
    console.log(`📅 날짜 비교: 이벤트=${date.toISOString().split('T')[0]}, 주 범위=${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]}`);
    
    // 날짜 범위 검사
    const isInRange = date >= startDate && date <= endDate;
    if (isInRange) {
      console.log(`✅ 이벤트 날짜 ${date.toISOString().split('T')[0]}은(는) 현재 선택된 주(${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]})에 포함됩니다.`);
    } else {
      console.log(`❌ 이벤트 날짜 ${date.toISOString().split('T')[0]}은(는) 현재 선택된 주(${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]})에 포함되지 않습니다.`);
    }
    
    return isInRange;
  } catch (error) {
    console.error('❌ 날짜 비교 중 오류 발생:', error, '이벤트 날짜:', eventDate);
    return false;
  }
}

// 주 이동 함수 (이전, 다음 주 이동)
const changeWeek = (offset = 0) => {
  try {
    // 현재 주의 시작일(일요일) 가져오기
    let currentDate;
    
    // currentWeek가 Date 객체인지 확인하고 안전하게 처리
    if (currentWeek.value instanceof Date) {
      currentDate = new Date(currentWeek.value);
    } else if (typeof currentWeek.value === 'string') {
      currentDate = new Date(currentWeek.value);
    } else {
      // 안전 조치: 현재 날짜로 설정
      console.warn('currentWeek가 예상치 못한 형식입니다. 현재 날짜를 사용합니다.');
      currentDate = new Date();
    }
    
    // offset 주 만큼 이동 (예: -1은 이전 주, 1은 다음 주)
    currentDate.setDate(currentDate.getDate() + (offset * 7));
    
    // 새 주 설정
    currentWeek.value = currentDate;
    
    console.log(`📆 주 변경: ${formatWeekDateRange(currentDate)} (${offset > 0 ? '다음' : '이전'} 주)`);
    
    // 현재 선택된 주의 범위 확인 (디버깅용)
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1)); // 월요일로 설정
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4); // 금요일 (월요일 + 4)
    endOfWeek.setHours(23, 59, 59, 999);
    
    console.log(`📆 조회 주 시작일(월): ${startOfWeek.toISOString().split('T')[0]}`);
    console.log(`📆 조회 주 종료일(금): ${endOfWeek.toISOString().split('T')[0]}`);
    
    fetchEvents(); // 새 주 데이터 조회
  } catch (error) {
    console.error('주 변경 중 오류 발생:', error);
    // 오류 발생 시 currentWeek를 현재 날짜로 리셋
    currentWeek.value = new Date();
    fetchEvents();
  }
}

// 이벤트 조회 (학년별 필터링 포함)
const fetchEvents = async () => {
  console.log(`학년 ${selectedGrade.value}에 대한 데이터 조회 중...`);
  
  try {
    let weekDateStr;
    
    // currentWeek 값 안전하게 처리
    if (currentWeek.value instanceof Date) {
      weekDateStr = currentWeek.value.toISOString().split('T')[0];
    } else if (typeof currentWeek.value === 'string') {
      weekDateStr = currentWeek.value;
    } else {
      // 안전 조치: 현재 날짜를 문자열로 변환
      weekDateStr = new Date().toISOString().split('T')[0];
    }
    
    console.log(`📆 조회 주: ${weekDateStr}`);
    
    // 현재 선택된 주의 시작일(월요일)과 종료일(금요일) 계산
    const weekDate = new Date(weekDateStr);
    const day = weekDate.getDay(); // 0: 일요일, 1: 월요일, ...
    
    // 월요일로 조정
    const startDate = new Date(weekDate);
    startDate.setDate(weekDate.getDate() - (day === 0 ? 6 : day - 1));
    
    // 금요일로 조정 (월요일 + 4)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 4);
    
    console.log(`📅 조회 주 범위: ${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]}`);
    
    // 현재 선택된 학년을 timetableStore의 currentGrade로 설정
    timetableStore.setCurrentGrade(selectedGrade.value);
    
    // 현재 선택된 주를 store에 설정 (Date 객체 그대로 전달)
    timetableStore.setCurrentWeek(weekDate);
    
    // 관리자 여부 확인
    const isAdmin = authStore.isAdmin;
    
    // 파라미터 구성
    const params = {
      grade: selectedGrade.value,                // 현재 선택된 학년
      week: startDate.toISOString().split('T')[0], // 시작일(월요일)
      semester: timetableStore.getCurrentSemester(), // 현재 학기
      year: new Date().getFullYear(),           // 현재 년도
      skipGradeFilter: isAdmin,                 // 관리자면 학년 필터링 건너뛰기
      level: timetableStore.currentLevel,       // 현재 선택된 레벨
      isAdmin: isAdmin                         // 관리자 여부 추가
    };
    
    console.log('📝 시간표 조회 파라미터:', params);
    
    // 주간 이벤트 조회 (모든 필요 파라미터 포함)
    await timetableStore.fetchWeeklyEvents(params);
    
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
  } catch (error) {
    console.error('이벤트 조회 중 오류 발생:', error);
    // 오류 처리 로직
  }
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

// Days for timetable view (in English)
const days = ref(['mon', 'tue', 'wed', 'thu', 'fri'])
const koreanDays = ['월', '화', '수', '목', '금']

// Map Korean day names to English
const koreanDayMap = {
  '월': 'mon',
  '화': 'tue',
  '수': 'wed',
  '목': 'thu',
  '금': 'fri'
}

// Map numeric days to English (1-based, Monday = 1)
const numDayMap = {
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri'
}

// Auth store for admin check
const isAdmin = computed(() => authStore.isAdmin)

/**
 * Gets all events for a specific cell (day/period combination)
 * Admin users see all events without filtering
 */
function getEventsForCell(day, period) {
  // Logging purpose
  const dayIndex = days.value.indexOf(day)
  const koreanDay = dayIndex >= 0 ? koreanDays[dayIndex] : day
  
  console.log(`📑 셀(${day}, ${period}) 이벤트 검색 시작 (요일매핑: ${day}->${koreanDay})`)
  
  // No events check
  if (!timetableStore.events || timetableStore.events.length === 0) {
    console.log(`❓ 이벤트가 없음: ${timetableStore.events}`)
    return []
  }
  
  // First, check if there's a holiday for this day
  const holidayForDay = timetableStore.events.filter(event => {
    if (!event) return false
    // Only check for holiday type events
    if (event.type !== 'holiday' && event.event_type !== 'holiday') return false
    
    const eventDate = new Date(event.event_date || event.date)
    if (isNaN(eventDate.getTime())) return false
    
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    const eventDayName = dayNames[eventDate.getDay()]
    
    // Check if the holiday matches this day and is in current week
    return day === eventDayName && isDateInCurrentWeek(eventDate)
  })
  
  // If we found a holiday for this day, return only the holiday and ignore other events
  if (holidayForDay.length > 0) {
    console.log(`🏖️ 공휴일 발견: ${holidayForDay[0].title || holidayForDay[0].name || '공휴일'}, 다른 이벤트 무시됨`)
    return holidayForDay
  }
  
  // Filter for specific day and period
  let cellEvents = timetableStore.events.filter(event => {
    // Basic validation
    if (!event) {
      console.log('🚨 유효하지 않은 이벤트 객체 발견 (null/undefined)')
      return false
    }
    
    // Special handling for makeup (보강) events - they work by date, not by day of week
    if (event.type === 'makeup' || event.event_type === 'makeup') {
      const eventDate = new Date(event.event_date || event.date)
      if (isNaN(eventDate.getTime())) return false
      
      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
      const eventDayName = dayNames[eventDate.getDay()]
      
      // Check if the makeup day matches this cell's day and is in current week
      const dayMatches = day === eventDayName && isDateInCurrentWeek(eventDate)
      
      // For numeric periods, ensure we're comparing numbers
      const eventStartPeriod = typeof event.start_period === 'string'
        ? parseInt(event.start_period, 10)
        : event.start_period
      
      const eventEndPeriod = typeof event.end_period === 'string'
        ? parseInt(event.end_period, 10)
        : event.end_period
      
      const periodNum = typeof period === 'string'
        ? parseInt(period, 10)
        : period
      
      // Period check - must be between start and end periods inclusive
      const periodMatches = periodNum >= eventStartPeriod && periodNum <= eventEndPeriod
      
      if (dayMatches && periodMatches) {
        console.log(`🔄 보강 이벤트 매치됨: ID=${event.id}, 날짜=${eventDate.toISOString().split('T')[0]}, 교시=${eventStartPeriod}-${eventEndPeriod}`)
      }
      
      return dayMatches && periodMatches
    }
    
    // Admin users see all events with less strict filtering
    if (isAdmin.value) {
      // Admin still needs day and period matching, but more flexible with formats
      const eventDay = typeof event.day === 'string' 
        ? event.day.toLowerCase()
        : event.day
      
      // Get normalized day value using various possible formats
      let normalizedDay
      
      // 1. Try direct English day name (mon, tue, etc.)
      if (typeof eventDay === 'string' && days.value.includes(eventDay.toLowerCase())) {
        normalizedDay = eventDay.toLowerCase()
      } 
      // 2. Try Korean day name (월, 화, etc.)
      else if (typeof eventDay === 'string' && koreanDayMap[eventDay]) {
        normalizedDay = koreanDayMap[eventDay]
        console.log(`🔄 한글 요일 변환: ${eventDay} -> ${normalizedDay}`)
      }
      // 3. Try numeric day (1-5)
      else if (typeof eventDay === 'number' || !isNaN(Number(eventDay))) {
        const numDay = Number(eventDay)
        normalizedDay = numDayMap[numDay]
        console.log(`🔢 숫자 요일 변환: ${eventDay} -> ${normalizedDay}`)
      }
      
      // For numeric periods, ensure we're comparing numbers
      const eventStartPeriod = typeof event.start_period === 'string' 
        ? parseInt(event.start_period, 10)
        : event.start_period
      
      const eventEndPeriod = typeof event.end_period === 'string'
        ? parseInt(event.end_period, 10)
        : event.end_period
        
      const periodNum = typeof period === 'string'
        ? parseInt(period, 10)
        : period
      
      // Check if day and period match, using all possible day formats
      const dayMatches = 
        normalizedDay === day ||                   // Normalized day matches
        (eventDay && eventDay.toLowerCase() === day) ||  // Direct English day match
        (eventDay && koreanDayMap[eventDay] === day) ||  // Korean day -> English match
        (typeof event.day === 'number' && numDayMap[event.day] === day) // Numeric day match
      
      // For admin: log more details about the event to debug day matching
      console.log(`🔍 [관리자 로그] 이벤트 검사: ID=${event.id}, 제목=${event.subject_name || event.title}, 일치여부=${dayMatches}`)
      console.log(`  📆 요일 정보: event.day=${eventDay}, normalized=${normalizedDay}, 셀day=${day}`)
      console.log(`  ⏱️ 교시 정보: start=${eventStartPeriod}, end=${eventEndPeriod}, 셀period=${periodNum}`)
      
      // Period check - must be between start and end periods inclusive
      const periodMatches = periodNum >= eventStartPeriod && periodNum <= eventEndPeriod
      
      return dayMatches && periodMatches
    }
    
    // For regular users - strict matching
    const eventDay = event.day
    
    // Handle Korean day names
    let normalizedDay = eventDay
    if (typeof eventDay === 'string' && koreanDayMap[eventDay]) {
      normalizedDay = koreanDayMap[eventDay]
    } else if (typeof eventDay === 'number' || !isNaN(Number(eventDay))) {
      normalizedDay = numDayMap[Number(eventDay)]
    }
    
    // For numeric periods, ensure we're comparing numbers
    const eventStartPeriod = typeof event.start_period === 'string' 
      ? parseInt(event.start_period, 10)
      : event.start_period
    
    const eventEndPeriod = typeof event.end_period === 'string'
      ? parseInt(event.end_period, 10)
      : event.end_period
      
    const periodNum = typeof period === 'string'
      ? parseInt(period, 10)
      : period
    
    // Check if day and period match
    return (normalizedDay === day || eventDay === day) && 
           periodNum >= eventStartPeriod && periodNum <= eventEndPeriod
  })
  
  console.log(`🧩 셀(${day}, ${period}) 이벤트 필터링 결과: ${cellEvents.length}개 발견`)
  
  if (cellEvents.length > 0) {
    // 이벤트 ID 및 유형 간단 로깅
    console.log(
      cellEvents.map(e => `ID=${e.id} 유형=${e.type||e.event_type||'regular'} 제목=${e.subject_name||e.title}`)
    )
  }
  
  return cellEvents
}

// 공휴일 체크
const isHoliday = (day) => {
  const holidayEvents = timetableStore.events.filter(event => {
    if (!event) return false;
    if (event.type !== 'holiday' && event.event_type !== 'holiday') return false;
    
    const eventDate = new Date(event.event_date || event.date);
    if (isNaN(eventDate.getTime())) return false;
    
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const eventDayName = dayNames[eventDate.getDay()];
    const isMatch = day === eventDayName && isDateInCurrentWeek(eventDate);
    
    if (isMatch) {
      console.log(`🏖️ 공휴일 확인: ${event.title || event.name || '공휴일'}, 날짜: ${eventDate.toISOString().split('T')[0]}`);
    }
    
    return isMatch;
  });
  
  return holidayEvents.length > 0;
};

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

  // 요일 변환 (mon → 1, tue → 2, ...)
  const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5 };
  const dayNumber = typeof startDay === 'string' ? dayMap[startDay] || 1 : startDay;

  // 부모 컴포넌트에 보강 이벤트 추가 요청
  emit('open-modal', 'makeup', {
    type: 'makeup',
    day: dayNumber,
    start_period: start,
    end_period: end,
    date: formatDate(new Date()), // 오늘 날짜 기본값
    grade: selectedGrade.value,
  }, null, false);

  // 드래그 상태 초기화
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
    handleCellAction(data);
    return;
  }
  
  // 기존 처리 방식 (호환성 유지)
  const day = data;
  const period = periodArg;
  
  const events = getEventsForCell(day, period);
  if (events.length > 0) {
    if (events.length === 1) {
      // 단일 이벤트는 바로 수정 모드로
      emit('edit-event', events[0]);
    } else {
      // 여러 이벤트는 첫 번째 이벤트로 기본 설정
      emit('edit-event', events[0]);
    }
  } else {
    // 빈 셀 클릭시 새 이벤트 등록
    showRegisterModal({ day, period });
  }
}

// 추가: 통합 셀 액션 처리
const handleCellAction = (data) => {
  const { dayIndex, timeIndex, hasEvents, events, action, event, fromTooltip } = data;
  
  // 툴팁에서 특정 이벤트 클릭
  if (fromTooltip && event) {
    emit('edit-event', event);
    return;
  }
  
  // 수정 버튼 클릭 또는 특정 이벤트 선택
  if (action === 'edit' && event) {
    emit('edit-event', event);
    return;
  }
  
  // 일반 셀 클릭
  const day = ['mon', 'tue', 'wed', 'thu', 'fri'][dayIndex];
  
  if (hasEvents && events.length > 0) {
    if (events.length === 1) {
      // 단일 이벤트
      emit('edit-event', events[0]);
    } else {
      // 여러 이벤트 - 첫 번째 이벤트 기본 선택
      emit('edit-event', events[0]);
    }
  } else {
    // 빈 셀은 등록 모달
    showRegisterModal({
      day,
      period: timeIndex
    });
  }
}

// 이벤트 등록 핸들러 (빈 셀 클릭)
const showRegisterModal = (data) => {
  const { day, period } = data;
  
  // 요일 변환 (mon → 1, tue → 2, ...)
  const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5 };
  const dayNumber = typeof day === 'string' ? dayMap[day] || 1 : day;
  
  // 이벤트 발생
  emit('open-modal', 'regular', {
    type: 'regular',
    day: dayNumber,
    start_period: period,
    end_period: period,
    grade: selectedGrade.value,
    professor_name: '',
    room: '',
    semester: timetableStore.getCurrentSemester()
  }, null, false);
}

// 이벤트 수정 핸들러
const handleEditEvent = (event) => {
  console.log('🖊️ 이벤트 수정:', event);
  
  // 이벤트 타입 결정
  const eventType = event.type || event.event_type || 
    (event.is_special_lecture === 1 ? 'special' : 
     event.is_foreigner_target === 1 ? 'topik' : 'regular');
  
  // 부모 컴포넌트에 이벤트 전달
  emit('edit-event', event);
}

// 날짜를 YYYY-MM-DD 형식으로 변환
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
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
