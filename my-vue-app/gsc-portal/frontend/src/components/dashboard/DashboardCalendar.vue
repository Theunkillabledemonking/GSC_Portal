// components/dashboard/DashboardCalendar.vue
<template>
  <div class="bg-white rounded-lg shadow-sm overflow-hidden">
    <!-- 헤더 -->
    <div class="border-b border-gray-100 p-4">
      <h3 class="text-lg font-semibold text-gray-900 flex items-center">
        <span class="mr-2">🗓️</span> 월간 달력
      </h3>
    </div>
    
    <!-- 달력 내비게이션 -->
    <div class="flex items-center justify-between p-4">
      <button 
        @click="prevMonth" 
        class="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="이전 달"
      >&#9664;</button>
      
      <span class="text-base font-medium text-gray-800">
        {{ currentYear }}년 {{ currentMonth + 1 }}월
      </span>
      
      <button 
        @click="nextMonth" 
        class="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="다음 달"
      >&#9654;</button>
    </div>
    
    <!-- 달력 그리드 -->
    <div class="px-4 pb-4">
      <!-- 요일 헤더 -->
      <div class="grid grid-cols-7 mb-2 text-center">
        <div 
          v-for="dayLabel in ['일', '월', '화', '수', '목', '금', '토']" 
          :key="dayLabel"
          class="text-xs font-medium py-2"
          :class="[
            dayLabel === '일' ? 'text-red-500' : '',
            dayLabel === '토' ? 'text-blue-500' : '',
            !['일', '토'].includes(dayLabel) ? 'text-gray-500' : ''
          ]"
        >
          {{ dayLabel }}
        </div>
      </div>
      
      <!-- 날짜 그리드 -->
      <div class="grid grid-cols-7 gap-1">
        <div 
          v-for="(day, idx) in calendarDays" 
          :key="idx" 
          @click="selectDate(day.date)"
          class="aspect-square relative flex flex-col items-center justify-center cursor-pointer select-none"
          :class="[
            day.currentMonth ? 'text-gray-800' : 'text-gray-400',
            isSelectedDate(day.date) ? 'selected-date' : '',
            !isSelectedDate(day.date) && isToday(day.date) ? 'today-date' : '',
            idx % 7 === 0 && !isSelectedDate(day.date) ? 'text-red-500' : '',
            idx % 7 === 6 && !isSelectedDate(day.date) ? 'text-blue-500' : ''
          ]"
        >
          <div class="text-sm">{{ day.day }}</div>
          
          <!-- 이벤트 표시 (점) -->
          <div 
            v-if="hasEvents(day.date)" 
            class="absolute bottom-1 w-1.5 h-1.5 rounded-full"
            :class="isSelectedDate(day.date) ? 'bg-white' : 'bg-red-500'"
          ></div>
        </div>
      </div>
    </div>
    
    <!-- 선택된 날짜의 이벤트 요약 -->
    <div class="border-t border-gray-100 p-4 bg-gray-50">
      <div class="text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
        <span>{{ formatDate(selectedDate, true) }} 일정</span>
        <span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
          {{ selectedDateEvents.length }}개
        </span>
      </div>
      
      <div v-if="selectedDateEvents.length > 0" class="space-y-2">
        <div 
          v-for="(event, index) in selectedDateEvents.slice(0, 3)" 
          :key="index"
          class="p-2 bg-white rounded border border-gray-200 text-sm flex items-center space-x-2"
        >
          <div 
            class="w-2 h-2 rounded-full flex-shrink-0" 
            :class="eventDotClass(event)"
          ></div>
          <div class="flex-grow truncate">{{ event.summary || event.subject_name || '일정' }}</div>
          <div class="text-xs text-gray-500 whitespace-nowrap">{{ formatEventTime(event) }}</div>
        </div>
        
        <div v-if="selectedDateEvents.length > 3" class="text-center text-xs text-gray-500 mt-2">
          외 {{ selectedDateEvents.length - 3 }}개 더 있음
        </div>
      </div>
      <div v-else class="text-center text-sm text-gray-500 py-4">
        선택한 날짜에 일정이 없습니다.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useTimetableStore } from '@/store/modules/timetable';
import dayjs from 'dayjs';

const props = defineProps({
  initialDate: {
    type: Date,
    default: () => new Date()
  }
});

const emit = defineEmits(['date-selected', 'month-changed']);

const timetableStore = useTimetableStore();
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth());
const selectedDate = ref(props.initialDate);
const calendarDays = ref([]);
const isLoading = ref(false);
const lastLoadedMonth = ref(null);

// 선택된 날짜의 이벤트
const selectedDateEvents = computed(() => {
  return timetableStore.events?.filter(event => {
    // 다양한 날짜 형식 처리
    const eventDateStr = getEventDateString(event);
    const selectedDateStr = dayjs(selectedDate.value).format('YYYY-MM-DD');
    return eventDateStr === selectedDateStr;
  }) || [];
});

// 이벤트의 날짜 문자열을 추출하는 유틸리티 함수
function getEventDateString(event) {
  if (!event) return '';
  
  // 다양한 날짜 형식 처리
  if (event.date) {
    return typeof event.date === 'string' 
      ? event.date.split('T')[0] 
      : dayjs(event.date).format('YYYY-MM-DD');
  }
  
  if (event.event_date) {
    return typeof event.event_date === 'string'
      ? event.event_date.split('T')[0]
      : dayjs(event.event_date).format('YYYY-MM-DD');
  }
  
  if (event.start?.dateTime) {
    return dayjs(event.start.dateTime).format('YYYY-MM-DD');
  }
  
  if (event.start?.date) {
    return dayjs(event.start.date).format('YYYY-MM-DD');
  }
  
  return '';
}

// 캘린더 데이터 생성
function generateCalendarDays() {
  const date = dayjs(new Date(currentYear.value, currentMonth.value, 1));
  const firstDay = date.startOf('month').day(); // 0: 일요일, 6: 토요일
  const daysInMonth = date.daysInMonth();
  
  // 이전 달의 마지막 날짜들
  const prevMonthDays = [];
  if (firstDay > 0) {
    const prevMonth = date.subtract(1, 'month');
    const prevMonthLastDay = prevMonth.endOf('month').date();
    
    for (let i = prevMonthLastDay - firstDay + 1; i <= prevMonthLastDay; i++) {
      prevMonthDays.push({
        day: i,
        date: prevMonth.date(i).format('YYYY-MM-DD'),
        currentMonth: false
      });
    }
  }
  
  // 현재 달의 날짜들
  const currentMonthDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push({
      day: i,
      date: date.date(i).format('YYYY-MM-DD'),
      currentMonth: true
    });
  }
  
  // 다음 달의 시작 날짜들 (42칸 채우기 위해)
  const nextMonthDays = [];
  const totalDaysShown = prevMonthDays.length + currentMonthDays.length;
  const remainingCells = 42 - totalDaysShown; // 6주 x 7일 = 42
  
  if (remainingCells > 0) {
    const nextMonth = date.add(1, 'month');
    for (let i = 1; i <= remainingCells; i++) {
      nextMonthDays.push({
        day: i,
        date: nextMonth.date(i).format('YYYY-MM-DD'),
        currentMonth: false
      });
    }
  }
  
  calendarDays.value = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
}

// 날짜 관련 유틸리티 함수
function formatDate(date, withDayOfWeek = false) {
  if (!date) return '';
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const d = dayjs(date);
  return withDayOfWeek 
    ? `${d.format('M월 D일')} (${days[d.day()]})`
    : d.format('YYYY-MM-DD');
}

// 캘린더 네비게이션 함수
function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
  generateCalendarDays();
  loadMonthEvents();
  emit('month-changed', new Date(currentYear.value, currentMonth.value, 1));
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
  generateCalendarDays();
  loadMonthEvents();
  emit('month-changed', new Date(currentYear.value, currentMonth.value, 1));
}

function selectDate(date) {
  if (!date) return;
  selectedDate.value = dayjs(date).toDate();
  emit('date-selected', selectedDate.value);
}

// 날짜 상태 체크 함수
function isToday(date) {
  if (!date) return false;
  return dayjs(date).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
}

function isSelectedDate(date) {
  if (!date || !selectedDate.value) return false;
  return dayjs(date).format('YYYY-MM-DD') === dayjs(selectedDate.value).format('YYYY-MM-DD');
}

function hasEvents(date) {
  if (!date || !timetableStore.events || !timetableStore.events.length) return false;
  
  const dateStr = dayjs(date).format('YYYY-MM-DD');
  
  return timetableStore.events.some(event => {
    const eventDateStr = getEventDateString(event);
    return eventDateStr === dateStr;
  });
}

// 이벤트 타입에 따른 색상 클래스
function eventDotClass(event) {
  if (!event) return 'bg-blue-500';
  
  const eventType = determineEventType(event);
  
  switch (eventType) {
    case 'regular':
      return 'bg-blue-500';
    case 'special':
      return 'bg-purple-500';
    case 'topik':
      return 'bg-indigo-500';
    case 'cancel':
      return 'bg-amber-500';
    case 'makeup':
      return 'bg-green-500';
    case 'holiday':
      return 'bg-red-500';
    default:
      return 'bg-blue-500';
  }
}

// 이벤트 타입 결정 함수
function determineEventType(event) {
  if (!event) return 'regular';

  if (event.event_type === 'special' || event.type === 'special' ||
      event.summary?.includes('특강') || event.subject_name?.includes('특강') ||
      event.summary?.includes('특별') || event.subject_name?.includes('특별')) {
    return 'special';
  }

  if (event.event_type === 'topik' || event.type === 'topik' ||
      event.summary?.includes('TOPIK') || event.subject_name?.includes('TOPIK') ||
      event.summary?.includes('토픽') || event.subject_name?.includes('토픽')) {
    return 'topik';
  }

  if (event.event_type === 'cancel' || event.type === 'cancel' ||
      event.summary?.includes('취소') || event.subject_name?.includes('취소') ||
      event.summary?.includes('휴강') || event.subject_name?.includes('휴강')) {
    return 'cancel';
  }

  if (event.event_type === 'makeup' || event.type === 'makeup' ||
      event.summary?.includes('보강') || event.subject_name?.includes('보강')) {
    return 'makeup';
  }

  if (event.event_type === 'holiday' || event.type === 'holiday' ||
      event.summary?.includes('휴일') || event.subject_name?.includes('휴일') ||
      event.summary?.includes('공휴일') || event.subject_name?.includes('공휴일')) {
    return 'holiday';
  }

  return 'regular';
}

// 이벤트 시간 포맷
function formatEventTime(event) {
  if (!event) return '';
  
  // 교시 정보가 있는 경우
  if (event.start_period && event.end_period) {
    if (event.start_period === event.end_period) {
      return `${event.start_period}교시`;
    } else {
      return `${event.start_period}-${event.end_period}교시`;
    }
  }
  
  // 시간 정보만 있는 경우
  if (event.start?.dateTime && event.end?.dateTime) {
    const start = dayjs(event.start.dateTime);
    const end = dayjs(event.end.dateTime);
    return `${start.format('HH:mm')} ~ ${end.format('HH:mm')}`;
  }
  
  return '';
}

// 월간 이벤트 로드
async function loadMonthEvents() {
  try {
    const month = currentMonth.value + 1;
    const year = currentYear.value;
    const currentMonthKey = `${year}-${month}`;
    
    // 이미 동일한 월을 로드했는지 확인
    if (lastLoadedMonth.value === currentMonthKey && timetableStore.events.length > 0) {
      console.log(`📅 이미 ${currentMonthKey} 데이터가 로드되어 있습니다.`);
      return;
    }
    
    isLoading.value = true;
    const semester = month >= 3 && month <= 8 ? 'spring' : 'fall';
    
    // 월의 시작일과 마지막 날
    const firstDay = dayjs(new Date(currentYear.value, currentMonth.value, 1)).startOf('month');
    const lastDay = dayjs(new Date(currentYear.value, currentMonth.value, 1)).endOf('month');
    
    console.log(`📆 ${currentMonthKey} 월 데이터 로드 시작`);
    
    // 월 시작 주 로드
    await timetableStore.fetchWeeklyEvents({
      date: firstDay.toISOString(),
      semester,
      logLevel: 'minimal' // 최소한의 로그만 출력
    });
    
    // 월 중간 주 로드 (15일경)
    const midMonth = dayjs(new Date(currentYear.value, currentMonth.value, 15));
    await timetableStore.fetchWeeklyEvents({
      date: midMonth.toISOString(),
      semester,
      logLevel: 'minimal'
    });
    
    // 월말 주 로드
    await timetableStore.fetchWeeklyEvents({
      date: lastDay.toISOString(),
      semester,
      logLevel: 'minimal'
    });
    
    lastLoadedMonth.value = currentMonthKey;
    console.log(`✅ ${currentMonthKey} 월 데이터 로드 완료`);
  } catch (error) {
    console.error('❌ 월간 이벤트 로드 실패:', error);
  } finally {
    isLoading.value = false;
  }
}

// 초기화
onMounted(() => {
  generateCalendarDays();
  loadMonthEvents();
});

// 프롭스 변경 감지
watch(() => props.initialDate, (newDate) => {
  if (newDate) {
    const newDateStr = dayjs(newDate).format('YYYY-MM-DD');
    const currentDateStr = dayjs(new Date(currentYear.value, currentMonth.value, 1)).format('YYYY-MM-DD');
    
    selectedDate.value = newDate;
    
    // 월이 변경된 경우에만 새로 로드
    if (dayjs(newDate).month() !== currentMonth.value ||
        dayjs(newDate).year() !== currentYear.value) {
      currentMonth.value = dayjs(newDate).month();
      currentYear.value = dayjs(newDate).year();
      generateCalendarDays();
      loadMonthEvents();
    }
  }
});
</script>

<style scoped>
.selected-date {
  @apply bg-blue-500 text-white rounded-full;
}

.today-date {
  @apply border-2 border-blue-500 rounded-full;
}
</style>