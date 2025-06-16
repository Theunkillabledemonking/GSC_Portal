// components/dashboard/DashboardSchedule.vue
<template>
  <div class="bg-white rounded-lg shadow-sm overflow-hidden">
    <!-- 헤더 -->
    <div class="border-b border-gray-100 p-4">
      <h3 class="text-lg font-semibold text-gray-900 flex items-center justify-between">
        <div class="flex items-center">
          <span class="mr-2">📚</span> {{ formatDate(selectedDate, true) }} 수업
        </div>
        <div class="flex items-center space-x-2">
          <button 
            @click="prevDay" 
            class="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            @click="goToday" 
            class="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
          >
            오늘
          </button>
          <button 
            @click="nextDay" 
            class="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </h3>
    </div>
    
    <!-- 필터 -->
    <div class="px-4 pt-3 pb-2 flex items-center border-b border-gray-100">
      <div class="flex flex-wrap gap-2">
        <select 
          v-model="selectedGrade" 
          class="px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700"
        >
          <option value="all">모든 학년</option>
          <option value="1">1학년</option>
          <option value="2">2학년</option>
          <option value="special">특강/토픽</option>
        </select>
        
        <div 
          v-for="(type, index) in eventTypes" 
          :key="index"
          @click="toggleEventType(type.value)"
          :class="[
            'px-2 py-1 text-xs rounded-full font-medium cursor-pointer transition-colors flex items-center gap-1',
            selectedEventTypes.includes(type.value) ? type.activeClass : 'bg-gray-100 text-gray-700'
          ]"
        >
          <span 
            class="w-2 h-2 rounded-full inline-block"
            :class="type.dotClass"
          ></span>
          {{ type.label }}
        </div>
      </div>
    </div>
    
    <!-- 로딩 표시 -->
    <div v-if="isLoading" class="p-8 text-center">
      <div class="animate-spin mb-3 text-5xl">🔄</div>
      <p class="text-gray-500">수업 정보를 불러오는 중입니다...</p>
    </div>
    
    <!-- 수업 목록 -->
    <div v-else-if="hasFilteredClasses" class="p-4 divide-y divide-gray-100">
      <div 
        v-for="(group, groupIndex) in filteredGroupedClasses" 
        :key="groupIndex" 
        v-show="group.events.length > 0"
        class="py-3 first:pt-0 last:pb-0"
      >
        <h4 v-if="selectedGrade === 'all'" class="text-sm font-semibold text-gray-700 mb-2">
          {{ group.title }}
        </h4>
        
        <div 
          v-for="(event, eventIndex) in group.events" 
          :key="eventIndex"
          class="mb-3 last:mb-0 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
          :class="eventBgClass(event)"
        >
          <div class="flex justify-between items-start mb-2">
            <div class="font-medium">{{ event.subject_name || event.summary || '수업' }}</div>
            <div 
              class="px-2 py-0.5 text-xs rounded-full font-medium" 
              :class="eventTypeClass(event)"
            >
              {{ getEventTypeLabel(event) }}
            </div>
          </div>
          
          <div class="flex flex-wrap items-center text-sm text-gray-600 gap-4">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ formatClassTime(event) }}
            </div>
            
            <div v-if="event.professor_name" class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {{ event.professor_name }}
            </div>
            
            <div v-if="event.room" class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {{ event.room }}
            </div>
            
            <div v-if="event.level" class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {{ event.level }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 빈 상태 -->
    <div v-else class="p-8 text-center">
      <div class="mb-3 text-5xl opacity-50">📅</div>
      <p class="text-gray-500">해당 날짜에 수업이 없습니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { useTimetableStore } from '@/store/modules/timetable';
import dayjs from 'dayjs';

const props = defineProps({
  selectedDate: {
    type: Date,
    default: () => new Date()
  }
});

const emit = defineEmits(['date-change']);

const authStore = useAuthStore();
const timetableStore = useTimetableStore();

// 상태 변수
const isLoading = ref(false);
const localSelectedDate = ref(new Date(props.selectedDate));
const lastLoadedDate = ref(null);

// 필터 상태
const selectedGrade = ref('all'); // 'all', '1', '2', 'special'
const selectedEventTypes = ref(['regular', 'special', 'topik', 'makeup']);

// 이벤트 타입 정의
const eventTypes = [
  { 
    value: 'regular', 
    label: '정규', 
    activeClass: 'bg-blue-500 text-white',
    dotClass: 'bg-blue-500'
  },
  { 
    value: 'special', 
    label: '특강', 
    activeClass: 'bg-purple-500 text-white',
    dotClass: 'bg-purple-500'
  },
  { 
    value: 'topik', 
    label: 'TOPIK', 
    activeClass: 'bg-indigo-500 text-white',
    dotClass: 'bg-indigo-500'
  },
  { 
    value: 'makeup', 
    label: '보강', 
    activeClass: 'bg-green-500 text-white',
    dotClass: 'bg-green-500'
  },
  { 
    value: 'cancel', 
    label: '휴강', 
    activeClass: 'bg-amber-500 text-white',
    dotClass: 'bg-amber-500'
  }
];

// 이벤트 타입 필터 토글
function toggleEventType(type) {
  const index = selectedEventTypes.value.indexOf(type);
  if (index === -1) {
    selectedEventTypes.value.push(type);
  } else {
    if (selectedEventTypes.value.length > 1) {
      selectedEventTypes.value.splice(index, 1);
    }
  }
}

// 선택된 날짜의 수업들
const filteredClassesByGrade = computed(() => {
  const userGrade = authStore.user?.student?.grade || 1;
  const selectedDateString = dayjs(localSelectedDate.value).format('YYYY-MM-DD');

  return timetableStore.events?.filter(event => {
    // 1. 이벤트 타입 확인 (수업 관련 이벤트만)
    const eventType = determineEventType(event);
    if (!selectedEventTypes.value.includes(eventType)) {
      return false;
    }

    // 2. 학년 필터링
    if (selectedGrade.value !== 'all') {
      if (selectedGrade.value === 'special') {
        // 특강/토픽 필터인 경우
        if (eventType !== 'special' && eventType !== 'topik') {
          return false;
        }
      } else {
        // 특정 학년 필터인 경우
        const eventGrade = event.grade || event.year;
        if (eventGrade && Number(eventGrade) !== Number(selectedGrade.value)) {
          return false;
        }
      }
    }

    // 3. 선택된 날짜의 이벤트만 필터링
    const eventDateStr = getEventDateString(event);
    return eventDateStr === selectedDateString;
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

// 수업이 있는지 여부
const hasFilteredClasses = computed(() => {
  return filteredClassesByGrade.value.length > 0;
});

// 학년별로 그룹화된 수업
const filteredGroupedClasses = computed(() => {
  // 기본 학년 그룹
  const groups = [
    { title: '1학년', grade: 1, events: [] },
    { title: '2학년', grade: 2, events: [] },
    { title: '특강/한국어', grade: 'special', events: [] }
  ];

  if (!filteredClassesByGrade.value || filteredClassesByGrade.value.length === 0) {
    return groups;
  }

  // 이벤트를 각 그룹에 배치
  filteredClassesByGrade.value.forEach(event => {
    const eventType = determineEventType(event);
    const grade = event.grade || event.year;

    if (eventType === 'special' || eventType === 'topik') {
      groups[2].events.push(event);
    } else if (grade) {
      const gradeNum = Number(grade);
      if (gradeNum === 1) {
        groups[0].events.push(event);
      } else if (gradeNum === 2) {
        groups[1].events.push(event);
      }
    }
  });

  return groups;
});

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

// 이벤트 타입 라벨
function getEventTypeLabel(event) {
  const type = determineEventType(event);
  const typeLabels = {
    'regular': '정규',
    'special': '특강',
    'topik': 'TOPIK',
    'cancel': '휴강',
    'makeup': '보강',
    'holiday': '휴일'
  };

  return typeLabels[type] || '일반';
}

// 이벤트 타입에 따른 클래스
function eventTypeClass(event) {
  const type = determineEventType(event);
  const classes = {
    'regular': 'bg-blue-100 text-blue-800',
    'special': 'bg-purple-100 text-purple-800',
    'topik': 'bg-indigo-100 text-indigo-800',
    'cancel': 'bg-amber-100 text-amber-800',
    'makeup': 'bg-green-100 text-green-800',
    'holiday': 'bg-red-100 text-red-800'
  };

  return classes[type] || 'bg-gray-100 text-gray-800';
}

// 이벤트 배경 클래스
function eventBgClass(event) {
  const type = determineEventType(event);
  const classes = {
    'regular': 'bg-white',
    'special': 'bg-purple-50',
    'topik': 'bg-indigo-50',
    'cancel': 'bg-amber-50',
    'makeup': 'bg-green-50',
    'holiday': 'bg-red-50'
  };

  return classes[type] || 'bg-white';
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

// 수업 시간 포맷
function formatClassTime(event) {
  if (!event) return '';

  let timeText = '';

  // 교시 정보가 있는 경우
  if (event.start_period && event.end_period) {
    if (event.start_period === event.end_period) {
      timeText = `${event.start_period}교시`;
    } else {
      timeText = `${event.start_period}-${event.end_period}교시`;
    }

    // 시간 정보도 있는 경우 괄호로 추가
    if (event.start?.dateTime && event.end?.dateTime) {
      const start = dayjs(event.start.dateTime);
      const end = dayjs(event.end.dateTime);
      timeText += ` (${start.format('HH:mm')} ~ ${end.format('HH:mm')})`;
    }
  }
  // 교시 정보가 없고 시간만 있는 경우
  else if (event.start?.dateTime && event.end?.dateTime) {
    const start = dayjs(event.start.dateTime);
    const end = dayjs(event.end.dateTime);
    timeText = `${start.format('HH:mm')} ~ ${end.format('HH:mm')}`;
  }

  return timeText;
}

// 날짜 이동 함수
function prevDay() {
  const newDate = dayjs(localSelectedDate.value).subtract(1, 'day').toDate();
  localSelectedDate.value = newDate;
  emit('date-change', newDate);
}

function nextDay() {
  const newDate = dayjs(localSelectedDate.value).add(1, 'day').toDate();
  localSelectedDate.value = newDate;
  emit('date-change', newDate);
}

function goToday() {
  const today = new Date();
  localSelectedDate.value = today;
  emit('date-change', today);
}

// 디바운스 함수 - 중복 호출 방지용
let loadingTimeout = null;
function debounce(fn, delay) {
  return function(...args) {
    clearTimeout(loadingTimeout);
    loadingTimeout = setTimeout(() => fn(...args), delay);
  };
}

// 선택된 날짜에 대한 시간표 데이터 로드
const loadTimetableData = debounce(async () => {
  // 이미 동일한 날짜를 로드했는지 확인
  const currentDateString = dayjs(localSelectedDate.value).format('YYYY-MM-DD');
  const lastLoadedDateString = lastLoadedDate.value ? dayjs(lastLoadedDate.value).format('YYYY-MM-DD') : null;
  
  // 이미 해당 날짜의 데이터가 로드되었다면 스킵
  if (lastLoadedDateString === currentDateString && timetableStore.events.length > 0) {
    console.log(`📅 이미 ${currentDateString} 데이터가 로드되어 있습니다.`);
    return;
  }
  
  try {
    isLoading.value = true;
    const month = localSelectedDate.value.getMonth() + 1;
    const semester = month >= 3 && month <= 8 ? 'spring' : 'fall';

    console.log(`📆 ${currentDateString} 날짜의 데이터 로드 시작`);
    
    await timetableStore.fetchWeeklyEvents({
      grade: authStore.user?.student?.grade || 1,
      date: localSelectedDate.value.toISOString(),
      semester
    });
    
    // 마지막 로드 날짜 기록
    lastLoadedDate.value = new Date(localSelectedDate.value);
    console.log(`✅ ${currentDateString} 날짜의 데이터 로드 완료`);
  } catch (error) {
    console.error('❌ 시간표 데이터 로드 실패:', error);
  } finally {
    isLoading.value = false;
  }
}, 300); // 300ms 디바운스

// props 날짜 변경 감지
watch(() => props.selectedDate, (newDate) => {
  if (!newDate) return;
  
  const newDateString = dayjs(newDate).format('YYYY-MM-DD');
  const currentDateString = dayjs(localSelectedDate.value).format('YYYY-MM-DD');
  
  // 날짜가 실제로 변경되었을 때만 업데이트
  if (newDateString !== currentDateString) {
    console.log(`📆 선택된 날짜 변경: ${currentDateString} → ${newDateString}`);
    localSelectedDate.value = new Date(newDate);
    loadTimetableData();
  }
}, { immediate: true });

// localSelectedDate 변경 감지
watch(localSelectedDate, () => {
  loadTimetableData();
});

// 컴포넌트 마운트 시 초기화
onMounted(() => {
  // 사용자 학년 기반 필터 설정
  const userGrade = authStore.user?.student?.grade;
  if (userGrade) {
    selectedGrade.value = String(userGrade);
  }
  
  // 초기 데이터 로드
  loadTimetableData();
});
</script>

<style scoped>
/* Tailwind classes are used for styling, so this style block can be empty */
</style>