// components/dashboard/DashboardTodayEvents.vue
<template>
  <div class="bg-white rounded-lg shadow-sm overflow-hidden">
    <!-- 헤더 -->
    <div class="border-b border-gray-100 p-4">
      <h3 class="text-lg font-semibold text-gray-900 flex items-center">
        <span class="mr-2">📚</span> 오늘의 수업
      </h3>
    </div>
    
    <!-- 필터 -->
    <div class="px-4 pt-3 pb-2 flex items-center space-x-2 border-b border-gray-100">
      <div class="text-xs font-medium text-gray-500">필터:</div>
      <div class="flex gap-2 flex-wrap">
        <button 
          v-for="grade in [1, 2]" 
          :key="grade"
          @click="toggleGradeFilter(grade)"
          :class="[
            'px-2 py-1 text-xs rounded-full font-medium transition-colors',
            selectedGrades.includes(grade) 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ grade }}학년
        </button>
        <button 
          v-for="type in classTypes" 
          :key="type.value"
          @click="toggleTypeFilter(type.value)"
          :class="[
            'px-2 py-1 text-xs rounded-full font-medium transition-colors',
            selectedTypes.includes(type.value) 
              ? `${type.activeClass}` 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ type.label }}
        </button>
      </div>
    </div>
    
    <!-- 수업 목록 -->
    <div class="p-4">
      <div v-if="filteredClasses.length > 0">
        <div 
          v-for="(classItem, index) in filteredClasses" 
          :key="index"
          class="mb-3 last:mb-0 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
          :class="classBgStyle(classItem)"
        >
          <div class="flex justify-between items-start mb-2">
            <div class="font-medium">{{ classItem.subject_name || classItem.summary || '수업' }}</div>
            <div 
              class="px-2 py-0.5 text-xs rounded-full font-medium" 
              :class="classTypeStyle(classItem)"
            >
              {{ getClassTypeLabel(classItem) }}
            </div>
          </div>
          
          <div class="flex items-center text-sm text-gray-600 space-x-4">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ formatClassTime(classItem) }}
            </div>
            
            <div v-if="classItem.professor_name" class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {{ classItem.professor_name }}
            </div>
            
            <div v-if="classItem.room" class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {{ classItem.room }}
            </div>
            
            <div v-if="classItem.level" class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ classItem.level }}
            </div>
          </div>
        </div>
      </div>
      <div v-else class="py-8 text-center">
        <div class="text-4xl mb-3">📚</div>
        <p class="text-gray-500 text-sm">오늘 수업이 없습니다.</p>
      </div>
    </div>
    
    <!-- 푸터 -->
    <div class="border-t border-gray-100 p-3 bg-gray-50">
      <button 
        @click="viewAllClasses" 
        class="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors duration-150 ease-in-out flex items-center justify-center"
      >
        전체 수업 보기
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTimetableStore } from '@/store/modules/timetable';
import { useAuthStore } from '@/store/modules/auth';
import dayjs from 'dayjs';

const timetableStore = useTimetableStore();
const authStore = useAuthStore();
const router = useRouter();

// 필터 상태
const selectedGrades = ref([]);
const selectedTypes = ref(['regular', 'special', 'topik', 'makeup']);

// 수업 타입 정의
const classTypes = [
  { 
    value: 'regular', 
    label: '정규', 
    activeClass: 'bg-blue-500 text-white'
  },
  { 
    value: 'special', 
    label: '특강', 
    activeClass: 'bg-purple-500 text-white'
  },
  { 
    value: 'topik', 
    label: 'TOPIK', 
    activeClass: 'bg-indigo-500 text-white'
  },
  { 
    value: 'makeup', 
    label: '보강', 
    activeClass: 'bg-green-500 text-white'
  },
  { 
    value: 'cancel', 
    label: '휴강', 
    activeClass: 'bg-amber-500 text-white'
  },
];

// 초기화 - 사용자 학년 가져오기
onMounted(() => {
  const userGrade = authStore.user?.student?.grade;
  if (userGrade) {
    selectedGrades.value = [Number(userGrade)];
  } else {
    selectedGrades.value = [1, 2]; // 기본값: 모든 학년
  }
});

// 오늘의 수업
const todayClasses = computed(() => {
  return timetableStore.events
    ?.filter(classItem => {
      const classDate = dayjs(classItem.start?.dateTime || classItem.start?.date);
      return classDate.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
    }) || [];
});

// 필터링 적용된 수업
const filteredClasses = computed(() => {
  return todayClasses.value.filter(classItem => {
    // 1. 수업 타입 필터링
    const classType = determineClassType(classItem);
    if (!selectedTypes.value.includes(classType)) {
      return false;
    }
    
    // 2. 학년 필터링 (특강과 토픽은 모든 학년에 표시)
    if (classType === 'special' || classType === 'topik') {
      return true;
    }
    
    const classGrade = classItem.grade || classItem.year;
    if (!classGrade) return true; // 학년 정보가 없는 경우 모두 표시
    
    return selectedGrades.value.includes(Number(classGrade));
  });
});

// 학년 필터 토글
function toggleGradeFilter(grade) {
  const index = selectedGrades.value.indexOf(grade);
  if (index === -1) {
    selectedGrades.value.push(grade);
  } else {
    // 적어도 하나의 학년은 선택되어 있어야 함
    if (selectedGrades.value.length > 1) {
      selectedGrades.value.splice(index, 1);
    }
  }
}

// 타입 필터 토글
function toggleTypeFilter(type) {
  const index = selectedTypes.value.indexOf(type);
  if (index === -1) {
    selectedTypes.value.push(type);
  } else {
    // 적어도 하나의 타입은 선택되어 있어야 함
    if (selectedTypes.value.length > 1) {
      selectedTypes.value.splice(index, 1);
    }
  }
}

// 수업 타입 결정 함수
function determineClassType(classItem) {
  if (!classItem) return 'regular';

  // event_type이나 type 속성이 있는 경우 우선 사용
  if (classItem.event_type === 'special' || classItem.type === 'special') {
    return 'special';
  }

  if (classItem.event_type === 'topik' || classItem.type === 'topik') {
    return 'topik';
  }

  if (classItem.event_type === 'cancel' || classItem.type === 'cancel') {
    return 'cancel';
  }

  if (classItem.event_type === 'makeup' || classItem.type === 'makeup') {
    return 'makeup';
  }

  if (classItem.event_type === 'holiday' || classItem.type === 'holiday') {
    return 'holiday';
  }

  // 제목(subject_name 또는 summary)에서 키워드 검색
  const title = classItem.subject_name || classItem.summary || '';
  
  if (title.includes('특강') || title.includes('특별')) {
    return 'special';
  }

  if (title.includes('TOPIK') || title.includes('토픽')) {
    return 'topik';
  }

  if (title.includes('취소') || title.includes('휴강')) {
    return 'cancel';
  }

  if (title.includes('보강')) {
    return 'makeup';
  }

  if (title.includes('휴일') || title.includes('공휴일')) {
    return 'holiday';
  }

  return 'regular';
}

// 수업 타입 라벨
function getClassTypeLabel(classItem) {
  const type = determineClassType(classItem);
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

// 수업 타입에 따른 클래스
function classTypeStyle(classItem) {
  const type = determineClassType(classItem);
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

// 수업 배경 클래스
function classBgStyle(classItem) {
  const type = determineClassType(classItem);
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

// 수업 시간 포맷
function formatClassTime(classItem) {
  if (!classItem || !classItem.start) return '';
  
  // 교시 정보가 있는 경우
  if (classItem.start_period && classItem.end_period) {
    if (classItem.start_period === classItem.end_period) {
      return `${classItem.start_period}교시`;
    } else {
      return `${classItem.start_period}-${classItem.end_period}교시`;
    }
  }
  
  // 시간 정보만 있는 경우
  const start = dayjs(classItem.start.dateTime || classItem.start.date);
  const end = classItem.end ? dayjs(classItem.end.dateTime || classItem.end.date) : null;
  
  if (end) {
    return `${start.format('HH:mm')} ~ ${end.format('HH:mm')}`;
  }
  
  return start.format('HH:mm');
}

// 모든 수업 보기
function viewAllClasses() {
  router.push({ name: 'Timetable' });
}

// 시간표 데이터 로드
onMounted(async () => {
  try {
    const month = new Date().getMonth() + 1;
    const semester = month >= 3 && month <= 8 ? 'spring' : 'fall';

    await timetableStore.fetchWeeklyEvents({
      date: new Date().toISOString(),
      semester
    });
  } catch (error) {
    console.error('시간표 데이터 로드 실패:', error);
  }
});
</script>

<style scoped>
.today-section {
  border-left: 4px solid #5B4BFF;
}

.event-item {
  gap: 10px;
}

.event-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.event-tag {
  display: inline-block;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 3px;
  color: white;
  background-color: #666;
}

.event-type-regular .event-tag,
.event-type-regular {
  background-color: #5B4BFF;
}

.event-type-special .event-tag,
.event-type-special {
  background-color: #FF6B6B;
}

.event-type-topik .event-tag,
.event-type-topik {
  background-color: #3498db;
}

.event-type-cancel .event-tag,
.event-type-cancel {
  background-color: #e74c3c;
}

.event-type-makeup .event-tag,
.event-type-makeup {
  background-color: #2ecc71;
}

.event-type-holiday .event-tag,
.event-type-holiday {
  background-color: #f1c40f;
}

.sidebar-footer {
  padding: 10px 15px;
  border-top: 1px solid #eee;
  text-align: center;
}

.view-all-btn {
  background: none;
  border: none;
  color: #FF6B6B;
  font-size: 13px;
  cursor: pointer;
  padding: 5px 10px;
  transition: background-color 0.2s;
  border-radius: 4px;
}

.view-all-btn:hover {
  background-color: #fff0f0;
}
</style>