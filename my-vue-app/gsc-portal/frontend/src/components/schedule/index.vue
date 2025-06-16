<template>
  <div class="weekly-timetable">
    <!-- 필터 섹션 -->
    <div class="filter-section mb-4 p-4 bg-white rounded-lg shadow-sm">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 학년 필터 -->
        <div class="filter-group">
          <h3 class="text-sm font-semibold mb-2">학년</h3>
          <div class="flex flex-wrap gap-2">
            <button 
              v-for="grade in [1, 2, 3]"
              :key="`grade-${grade}`"
              class="px-3 py-1 rounded text-sm transition-colors duration-200" 
              :class="selectedGrade === grade ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              @click="selectedGrade = grade"
            >
              {{ grade }}학년
            </button>
          </div>
        </div>

        <!-- 레벨 필터 -->
        <div class="filter-group">
          <h3 class="text-sm font-semibold mb-2">레벨</h3>
          <div class="flex flex-wrap gap-2">
            <button 
              v-for="level in levels" 
              :key="`level-${level}`"
              class="px-3 py-1 rounded text-sm transition-colors duration-200" 
              :class="selectedLevel === level ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              @click="selectedLevel = level"
            >
              {{ level }}
            </button>
          </div>
        </div>

        <!-- 학생 구분 필터 -->
        <div class="filter-group">
          <h3 class="text-sm font-semibold mb-2">학생 구분</h3>
          <div class="flex flex-wrap gap-2">
            <button 
              v-for="type in studentTypes" 
              :key="`type-${type.value}`"
              class="px-3 py-1 rounded text-sm transition-colors duration-200" 
              :class="selectedStudentType === type.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              @click="selectedStudentType = type.value"
            >
              {{ type.label }}
            </button>
          </div>
        </div>

        <!-- 분반 필터 -->
        <div class="filter-group">
          <h3 class="text-sm font-semibold mb-2">분반</h3>
          <div class="flex flex-wrap gap-2">
            <button 
              v-for="group in groupLevels" 
              :key="`group-${group.value}`"
              class="px-3 py-1 rounded text-sm transition-colors duration-200" 
              :class="selectedGroupLevel === group.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              @click="selectedGroupLevel = group.value"
            >
              {{ group.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 시간표 -->
    <div class="timetable-container bg-white rounded-lg shadow overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="border p-2 bg-gray-50 w-20">교시</th>
            <th 
              v-for="(dayName, index) in DAYS_DISPLAY" 
              :key="dayName"
              class="border p-2 bg-gray-50"
              :class="{ 'weekend': index > 4 }"
            >
              {{ dayName }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="period in PERIODS_RANGE" :key="`period-${period}`">
            <td class="border p-2 text-center bg-gray-50 font-medium">{{ period }}교시</td>
            <td 
              v-for="(day, dayIndex) in DAYS" 
              :key="`${day}-${period}`"
              class="border p-0 relative"
              @mousedown="handleMouseDown(day, period)"
              @mouseover="handleMouseOver(day, period)"
              @mouseup="handleMouseUp()"
            >
              <TimetableCell
                :dayIndex="dayIndex"
                :timeIndex="period"
                :events="getEventsForCell(day, period)"
                :is-holiday="isHoliday(day, period)"
                :is-dragging="isDragging(day, period)"
                @cell-click="handleCellClick"
                @dragStart="handleCellDragStart"
                @drop="handleCellDrop"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 로딩 인디케이터 -->
    <div v-if="timetableStore.loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">시간표 로드 중...</div>
    </div>

    <!-- 이벤트 등록 모달 -->
    <div 
      v-if="timetableStore.showModal && timetableStore.modalType === 'register'"
      class="modal-backdrop"
      @click.self="timetableStore.closeModal"
    >
      <div class="modal-container">
        <RegisterEventModal 
          :initial-data="timetableStore.modalData || {}"
          @close="timetableStore.closeModal"
          @submit="handleRegisterEvent"
        />
      </div>
    </div>

    <!-- 이벤트 상세 모달 -->
    <div 
      v-if="timetableStore.showModal && timetableStore.modalType === 'detail'"
      class="modal-backdrop"
      @click.self="timetableStore.closeModal"
    >
      <div class="modal-container">
        <DetailEventModal
          :events="timetableStore.modalData?.events || []"
          @close="timetableStore.closeModal"
          @cancel="handleCancelEvent"
          @edit="handleEditEvent"
        />
      </div>
    </div>

    <!-- 통합 일정 등록 모달 (UnifiedScheduleForm) -->
    <div 
      v-if="timetableStore.showUnifiedModal" 
      class="modal-backdrop"
      @click.self="timetableStore.closeModal"
    >
      <div class="modal-container">
        <UnifiedScheduleForm
          :initial-data="timetableStore.unifiedModalData.modalData"
          :event-type="timetableStore.unifiedModalData.eventType"
          :timetable-data="timetableStore.unifiedModalData.timetableData"
          :show-type-selector="timetableStore.unifiedModalData.showTypeSelector"
          :allow-makeup="true"
          :allow-cancel="timetableStore.unifiedModalData.allowCancel"
          :is-edit="timetableStore.unifiedModalData.isEdit"
          @submit="handleUnifiedScheduleSubmit"
          @cancel="timetableStore.closeModal"
          @error="handleFormError"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTimetableStore } from '@/store/modules/timetable'
import { useAuthStore } from '@/store/modules/auth'
import { useSubjectStore } from '@/store/modules/subject'
//import TimetableCell from '../TimetableCell.vue'
import RegisterEventModal from './forms/RegisterEventModal.vue'
//import DetailEventModal from '../modals/DetailEventModal.vue'
import UnifiedScheduleForm from './forms/UnifiedScheduleForm.vue'
import { CLASS_TYPES } from '@/constants/timetable'

// 요일 및 교시 상수
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri']
const DAYS_DISPLAY = ['월', '화', '수', '목', '금']
const PERIODS_RANGE = Array.from({ length: 9 }, (_, i) => i + 1)

// Store 사용
const timetableStore = useTimetableStore()
const authStore = useAuthStore()

// 상태 관리
const selectedGrade = ref(1)
const selectedLevel = ref('N2')
const selectedStudentType = ref('foreigner')
const selectedGroupLevel = ref('ALL')

// 필터 옵션 정의
const levels = ['N2', 'N1', 'ALL']
const studentTypes = [
  { value: 'all', label: '전체' },
  { value: 'foreigner', label: '유학생' },
  { value: 'korean', label: '한국인' }
]
const groupLevels = [
  { value: 'ALL', label: '전체' },
  { value: 'A', label: 'A반' },
  { value: 'B', label: 'B반' }
]

// 드래그 관련 상태
const dragState = ref({
  isDragging: false,
  startDay: null,
  startPeriod: null,
  endDay: null,
  endPeriod: null,
  eventData: null
})

// 이벤트 타입별 우선순위
const EVENT_PRIORITIES = {
  holiday: 4,    // 공휴일 (가장 낮은 우선순위)
  cancel: 3,     // 휴강 
  special: 2,    // 특강
  regular: 1,    // 정규
  makeup: 0      // 보강 (가장 높은 우선순위)
}

// 현재 주 구하기 (일요일 기준)
const getCurrentWeek = () => {
  const now = new Date()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - now.getDay())
  return sunday.toISOString().split('T')[0]
}

// 이벤트 조회
const fetchEvents = async () => {
  try {
    // 로딩 상태 설정
    timetableStore.setLoading(true)
    
    // 과목 데이터 로드가 필요한 경우
    const subjectStore = useSubjectStore()
    if (subjectStore.subjects.length === 0) {
      await subjectStore.fetchSubjects()
    }
    
    // 시간표 데이터 로드
    const params = {
      grade: selectedGrade.value,
      level: selectedLevel.value, 
      student_type: selectedStudentType.value === 'all' ? '' : selectedStudentType.value,
      group_level: selectedGroupLevel.value === 'ALL' ? '' : selectedGroupLevel.value,
      week: timetableStore.getCurrentWeekStart(),
      ignoreGradeFilter: 'true',  // 특강이 학년과 무관하게 표시되도록 설정
      ignoreLevelFilter: 'true'   // 특강이 선택된 레벨에 관계없이 모두 표시되도록 설정
    }
    
    console.log('📊 시간표 데이터 요청 파라미터:', params)
    await timetableStore.fetchWeeklyEvents(params)
    
    // 데이터 로드 후 디버깅 로그
    console.log('📋 이벤트 데이터 로드 완료 - 총', timetableStore.events.length, '개')
    
    // 특강 이벤트 디버깅
    const specialEvents = timetableStore.events.filter(event => 
      event.is_special_lecture === true ||
      event.is_special_lecture === 1 ||
      event.is_special_lecture === '1' ||
      event.type === 'special' ||
      event.event_type === 'special' ||
      (event.level && String(event.level).startsWith('N'))
    );
    
    console.log('✨ 특강 이벤트 개수:', specialEvents.length);
    if (specialEvents.length > 0) {
      console.log('✨ 특강 이벤트 목록:', specialEvents);
    } else {
      console.log('⚠️ 특강 이벤트가 없습니다. 백엔드 API 응답을 확인해 주세요.');
    }
    
    // 상속 필드 디버깅
    const eventWithInherit = timetableStore.events.filter(e => e.inherit_attributes === 1)
    console.log('🔍 상속 속성 적용 이벤트:', eventWithInherit.length, '개')
    
    if (eventWithInherit.length > 0) {
      // 첫 번째 상속 이벤트 상세 정보 출력
      const sampleEvent = eventWithInherit[0]
      console.log('📌 상속 이벤트 샘플:', {
        id: sampleEvent.id,
        type: sampleEvent.type,
        timetable_id: sampleEvent.timetable_id,
        inherit_attributes: sampleEvent.inherit_attributes,
        professor_name: sampleEvent.professor_name,
        inherited_professor_name: sampleEvent.inherited_professor_name,
        room: sampleEvent.room,
        inherited_room: sampleEvent.inherited_room
      })
    }
    
    // 데이터가 없는 경우 추가 정보 로깅
    if (timetableStore.events.length === 0) {
      console.log('⚠️ 이벤트 데이터가 없습니다. API 요청 파라미터와 응답을 확인하세요.')
    }
  } catch (error) {
    console.error('❌ 이벤트 로드 중 오류 발생:', error)
  } finally {
    timetableStore.setLoading(false)
  }
}

// 보강 이벤트를 명확하게 식별하기 위한 함수
const isMakeupEvent = (event) => {
  return event.type === 'makeup' || 
         event.event_type === 'makeup' || 
         (event.timetable_id && (event.type === 'temporary' || event.event_type === 'temporary'));
}

// 특강 이벤트를 명확하게 식별하기 위한 함수
const isSpecialLectureEvent = (event) => {
  // 특강 여부 체크 - level이 N1, N2인 경우 명시적으로 체크
  const isSpecial = 
      event.is_special_lecture === true || 
      event.is_special_lecture === 1 || 
      event.is_special_lecture === '1' ||
      event.type === 'special' || 
      event.event_type === 'special' ||
      (event.level && (
        String(event.level) === 'N1' || 
        String(event.level) === 'N2' ||
        String(event.level).startsWith('N')
      ));
  
  // 매치 이유 로깅 (디버깅용)
  let matchReason = '';
  if (event.is_special_lecture === true || event.is_special_lecture === 1 || event.is_special_lecture === '1') {
    matchReason = 'is_special_lecture 필드';
  } else if (event.type === 'special') {
    matchReason = 'type=special';
  } else if (event.event_type === 'special') {
    matchReason = 'event_type=special';
  } else if (event.level) {
    matchReason = `level=${event.level}`;
  }
  
  if (isSpecial) {
    console.log(`✨ 특강 확인됨: ${event.subject_name || '제목 없음'}, 매치 이유: ${matchReason}, 레벨: ${event.level || 'none'}, ID: ${event.id}`);
  } else if (event.level) {
    // 레벨이 있지만 특강으로 인식되지 않은 경우 로깅
    console.log(`ℹ️ 레벨이 있으나 특강으로 인식되지 않음: ${event.subject_name || '제목 없음'}, 레벨: ${event.level}, 타입: ${event.type || event.event_type || 'unknown'}, ID: ${event.id}`);
  }
  
  return isSpecial;
}

// 셀별 이벤트 조회
const getEventsForCell = (day, period) => {
  if (!timetableStore.events.length) return []
  
  // 📋 모든 이벤트 타입 디버깅 로그
  const allSpecialEvents = timetableStore.events.filter(event => 
    isSpecialLectureEvent(event)
  );
  
  if (allSpecialEvents.length > 0 && day === 'mon' && period === 1) {
    console.log(`🔍 전체 특강 개수: ${allSpecialEvents.length}개`, allSpecialEvents);
  }
  
  // 공휴일 이벤트 포함
  const holidayEvents = timetableStore.events.filter(event => {
    if (event.type === 'holiday' || event.event_type === 'holiday') {
      const eventDate = new Date(event.event_date || event.date)
      const dayIndex = eventDate.getDay()
      const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5 }
      return dayMap[day] === dayIndex
    }
    return false
  })
  
  // 사용자 권한 확인 (관리자는 모든 과목 조회 가능)
  const isAdmin = authStore.isAdmin

  // 특강 이벤트 먼저 필터링 - 특강은 학년 무관하게 모든 학년에 표시
  const specialEvents = timetableStore.events.filter(event => {
    // 특강 판별
    if (isSpecialLectureEvent(event)) {
      // 특강은 학년 필터링을 무시하고 레벨만 확인
      const levelMatch = !selectedLevel.value || selectedLevel.value === 'ALL' || 
                         event.level === selectedLevel.value || !event.level;
      
      // 날짜/요일 및 교시 확인
      const periodMatch = isEventVisibleForPeriod(event, day, period);
      
      // 결과 디버깅
      if (levelMatch && periodMatch) {
        console.log(`✅ 특강 이벤트 셀에 표시됨: ${event.subject_name || '제목 없음'}, 요일: ${day}, 교시: ${period}`);
      } else if (periodMatch) {
        console.log(`❌ 특강 이벤트 레벨 불일치: ${event.subject_name || '제목 없음'}, 레벨: ${event.level}, 선택 레벨: ${selectedLevel.value}`);
      }
      
      return levelMatch && periodMatch;
    }
    return false;
  });
  
  // 일반 이벤트 - 정규 수업은 학년 필터링 적용
  const regularEvents = timetableStore.events.filter(event => {
    // 이미 특강으로 포함된 이벤트는 제외
    if (isSpecialLectureEvent(event)) return false;
    
    // 관리자는 모든 이벤트를 볼 수 있음
    if (isAdmin) {
      // 필요한 필터링만 적용 (요일, 교시)
      if (event.type === 'holiday' || event.event_type === 'holiday') {
        return false; // 공휴일은 위에서 이미 처리
      }
      
      // 날짜 또는 요일 기반 이벤트 처리
      return isEventVisibleForPeriod(event, day, period);
    }
    
    // 학생 유형 및 분반 필터링 (일반 사용자)
    if (selectedStudentType.value !== 'all' && 
        event.student_type && 
        event.student_type !== selectedStudentType.value) {
      return false
    }
    
    // 그룹 레벨 필터링 (분반)
    if (selectedGroupLevel.value !== 'ALL' && 
        event.group_level && 
        !isGroupLevelMatched(event.group_levels, selectedGroupLevel.value)) {
      return false
    }

    // 보강 이벤트(makeup) - 학년 필터링 무시하고 무조건 표시
    if (isMakeupEvent(event)) {
      console.log('🔄 보강 이벤트 발견:', event.subject_name || event.title || '제목 없음', event);
      return isEventVisibleForPeriod(event, day, period);
    }
    
    // 정규 수업은 학년 필터링 적용
    if (event.year && selectedGrade.value) {
      // 문자열로 변환하여 안전하게 비교
      const eventYear = String(event.year);
      const selectedYear = String(selectedGrade.value);
      
      if (eventYear !== selectedYear) {
        // 디버깅을 위한 로그
        console.log(`🔍 학년 불일치로 제외: 이벤트=${event.id || '?'}, 과목=${event.title || event.subject_name || '?'}, 요청학년=${selectedGrade.value}, 이벤트학년=${event.year}`);
        return false;
      }
    }

    // 공휴일은 이미 위에서 처리했으므로 제외
    if (event.type === 'holiday' || event.event_type === 'holiday') {
      return false
    }

    // 날짜/요일 및 교시 기반 필터링
    return isEventVisibleForPeriod(event, day, period);
  })

  // 모든 이벤트 합치기 (특강 포함)
  const allEvents = [...holidayEvents, ...specialEvents, ...regularEvents];
  
  // 디버깅: 특강이 포함된 경우
  if (specialEvents.length > 0) {
    console.log(`📊 셀(${day}, ${period}) 특강 이벤트 수: ${specialEvents.length}개`);
  }

  // 이벤트 타입 우선순위로 정렬
  const sortedEvents = allEvents.sort((a, b) => {
    // 이벤트 타입 결정
    let typeA = 'regular'; // 기본 타입
    let typeB = 'regular';
    
    // 타입 A 결정
    if (a.type === 'holiday' || a.event_type === 'holiday') typeA = 'holiday';
    else if (a.type === 'cancel' || a.event_type === 'cancel') typeA = 'cancel';
    else if (isSpecialLectureEvent(a)) typeA = 'special';
    else if (isMakeupEvent(a)) typeA = 'makeup';
    
    // 타입 B 결정
    if (b.type === 'holiday' || b.event_type === 'holiday') typeB = 'holiday';
    else if (b.type === 'cancel' || b.event_type === 'cancel') typeB = 'cancel';
    else if (isSpecialLectureEvent(b)) typeB = 'special';
    else if (isMakeupEvent(b)) typeB = 'makeup';
    
    const priorityA = EVENT_PRIORITIES[typeA];
    const priorityB = EVENT_PRIORITIES[typeB];
    
    return priorityA - priorityB;
  });

  // 정렬된 이벤트 로깅 (디버깅)
  if (sortedEvents.length > 0) {
    const eventTypes = sortedEvents.map(e => e.type || e.event_type || (isSpecialLectureEvent(e) ? 'special' : 'regular')).join(', ');
    console.log(`📊 셀(${day}, ${period}) 이벤트 타입: ${eventTypes}, 개수: ${sortedEvents.length}`);
  }

  return sortedEvents;
}

// 그룹 레벨 매칭 확인 (배열 또는 JSON 문자열 처리)
const isGroupLevelMatched = (groupLevels, selectedGroup) => {
  if (!groupLevels) return true;
  
  let parsedGroups = groupLevels;
  
  // JSON 문자열인 경우 파싱
  if (typeof groupLevels === 'string') {
    try {
      parsedGroups = JSON.parse(groupLevels);
    } catch (e) {
      console.error('그룹 레벨 파싱 오류:', e);
      return false;
    }
  }
  
  // 배열인 경우 포함 여부 확인
  if (Array.isArray(parsedGroups)) {
    return parsedGroups.includes(selectedGroup);
  }
  
  return false;
}

// 특정 요일/교시에 이벤트가 표시되어야 하는지 확인
const isEventVisibleForPeriod = (event, day, period) => {
  // 이벤트 타입 확인
  const eventType = event.type || event.event_type;
  
  // 날짜 기반 이벤트 (보강/휴강/이벤트)
  if (event.event_date || event.date) {
    const eventDate = new Date(event.event_date || event.date)
    const dayIndex = eventDate.getDay()
    const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5 }
    const startP = parseInt(event.start_period || 1)
    const endP = parseInt(event.end_period || 9)
    
    // 보강 이벤트 로그
    if (eventType === 'makeup' && dayMap[day] === dayIndex) {
      console.log(`💡 보강 이벤트 교시 체크: 과목=${event.subject_name || '이름 없음'}, 요일=${day}, 교시=${period}, 이벤트 교시=${startP}-${endP}`);
    }
    
    return dayMap[day] === dayIndex && period >= startP && period <= endP
  }

  // 요일 기반 이벤트 (정규/특강)
  const dayMap = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금' }
  
  // 요일 일치 여부 확인 (한글 요일 또는 영문 요일 코드)
  const isDayMatched = event.day === dayMap[day] || event.day === day
  
  // 교시 범위 확인 
  const startP = parseInt(event.start_period || 1)
  const endP = parseInt(event.end_period || 9)
  const isPeriodInRange = period >= startP && period <= endP
  
  // 디버깅 로그 (특강 표시에 문제가 있는 경우만)
  if (
    ((event.is_special_lecture === true || 
    event.is_special_lecture === 1 || 
    event.is_special_lecture === '1') || 
    eventType === 'special') && 
    isDayMatched && 
    !isPeriodInRange
  ) {
    console.log(`⚠️ 특강 교시 범위 불일치: 과목=${event.subject_name}, 요일=${event.day}, 교시=${event.start_period}-${event.end_period}, 선택된 교시=${period}`)
  }
  
  // 보강 이벤트 로그
  if (eventType === 'makeup' && isDayMatched) {
    console.log(`🧩 보강 이벤트 요일 일치: ${event.subject_name || '이름 없음'}, 교시 범위=${startP}-${endP}, 선택 교시=${period}`);
  }
  
  return isDayMatched && isPeriodInRange
}

// 공휴일 체크
const isHoliday = (day, period) => {
  const holidays = timetableStore.events.filter(event => {
    return (event.type === 'holiday' || event.event_type === 'holiday')
  })
  
  if (holidays.length === 0) return false
  
  // 요일 매핑 (0: 일, 1: 월, 2: 화, ...)
  const dayMap = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5 }
  const targetDayNum = dayMap[day]
  
  return holidays.some(holiday => {
    const eventDate = new Date(holiday.event_date || holiday.date)
    const holidayDayNum = eventDate.getDay()
    return holidayDayNum === targetDayNum
  })
}

// 드래그 상태 체크
const isDragging = (day, period) => {
  if (!dragState.value.isDragging) return false
  if (dragState.value.startDay !== day) return false

  const startPeriod = Math.min(
    dragState.value.startPeriod || 0, 
    dragState.value.endPeriod || dragState.value.startPeriod || 0
  )
  const endPeriod = Math.max(
    dragState.value.startPeriod || 0, 
    dragState.value.endPeriod || dragState.value.startPeriod || 0
  )

  return period >= startPeriod && period <= endPeriod
}

// 마우스 다운 핸들러 (셀에서 직접 드래그 시작)
const handleMouseDown = (day, period) => {
  // 이벤트 버블링 방지 - TimetableCell에서 처리하는 경우 무시
  if (getEventsForCell(day, period).length > 0) return
  
  dragState.value = {
    isDragging: true,
    startDay: day,
    startPeriod: period,
    endDay: day,
    endPeriod: period,
    eventData: null
  }
}

// 마우스 이동 핸들러
const handleMouseOver = (day, period) => {
  if (!dragState.value.isDragging) return
  if (day !== dragState.value.startDay) return

  dragState.value.endPeriod = period
}

// 마우스 업 핸들러
const handleMouseUp = () => {
  handleDragEnd()
}

// 셀 드래그 핸들러 - TimetableCell 컴포넌트에서 호출됨
const handleCellDragStart = (eventData) => {
  const { dayIndex, timeIndex, events, mainEvent } = eventData
  const day = DAYS[dayIndex]
  
  dragState.value = {
    isDragging: true,
    startDay: day,
    startPeriod: timeIndex,
    endDay: day,
    endPeriod: timeIndex,
    eventData: mainEvent
  }
}

// 드래그 종료 핸들러
const handleDragEnd = () => {
  if (!dragState.value.isDragging) return

  const { startDay, startPeriod, endPeriod, eventData } = dragState.value
  
  // 이벤트 데이터가 있으면 이벤트 이동 작업 (미구현 상태)
  if (eventData && eventData.id) {
    // 이벤트 이동 로직 구현
    console.log('이벤트 이동:', eventData, startDay, startPeriod, endPeriod)
  } else {
    // ⬜️ 빈 셀 드래그: 보강 등록 폼 열기
    const start = Math.min(startPeriod, endPeriod)
    const end = Math.max(startPeriod, endPeriod)
    
    // 겹치는 이벤트 확인
    const hasOverlap = checkForOverlappingEvents(startDay, start, end)
    
    if (hasOverlap) {
      alert('선택한 시간대에 이미 다른 수업이 있습니다.')
    } else {
      console.log('⬜️ 빈 셀 드래그 -> 보강 등록 폼')
      
      // 날짜 계산 (현재 주의 해당 요일)
      const dayIndex = DAYS.indexOf(startDay)
      const dayOffset = dayIndex % 7  // 0(월요일) ~ 4(금요일)
      const currentDate = new Date(timetableStore.weekStart)
      currentDate.setDate(currentDate.getDate() + dayOffset)
      const formattedDate = currentDate.toISOString().split('T')[0]
      
      // 보강 수업 데이터
      const modalData = {
        type: 'makeup', // 드래그는 보강 수업으로
        day: dayIndex + 1, // 1(월요일) ~ 5(금요일)
        start_period: start,
        end_period: end,
        grade: selectedGrade.value,
        level: selectedLevel.value,
        student_type: selectedStudentType.value,
        semester: timetableStore.currentSemester,
        date: formattedDate,
        is_special_lecture: 0,
        reason: '보강'
      }
      
      // UnifiedScheduleForm 모달 열기
      timetableStore.openUnifiedScheduleForm({
        isEdit: false,
        modalData,
        showTypeSelector: false, // 보강으로 고정
        allowCancel: false,
        eventType: 'makeup'
      })
    }
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

// 셀 드롭 핸들러 - TimetableCell 컴포넌트에서 호출됨
const handleCellDrop = (dropData) => {
  const { dayIndex, timeIndex, droppedData } = dropData
  const targetDay = DAYS[dayIndex]
  
  // 드래그 데이터가 있으면 이벤트 이동 처리
  if (droppedData && droppedData.eventId) {
    const { eventId, sourceDay, sourceTime } = droppedData
    const sourceDayName = DAYS[sourceDay]
    
    console.log(`이벤트 이동: ID=${eventId}, ${sourceDayName}${sourceTime}교시 → ${targetDay}${timeIndex}교시`)
    
    // 여기에 이벤트 이동 로직 구현
    // TODO: timetableStore에 moveEvent 함수 추가 필요
  }
  
  handleDragEnd()
}

// 선택된 시간대에 겹치는 이벤트가 있는지 확인
const checkForOverlappingEvents = (day, startPeriod, endPeriod) => {
  for (let period = startPeriod; period <= endPeriod; period++) {
    const events = getEventsForCell(day, period)
    if (events.length > 0) {
      return true // 겹치는 이벤트가 있음
    }
  }
  return false // 겹치는 이벤트가 없음
}

// 셀 클릭 핸들러
const handleCellClick = (data) => {
  const { dayIndex, timeIndex, hasEvents, events } = data
  const day = DAYS[dayIndex]
  
  console.log('🖱️ 셀 클릭:', { day, period: timeIndex, hasEvents, eventCount: events.length })
  
  if (hasEvents && events.length > 0) {
    // 채워진 셀 클릭 처리
    console.log('📅 이벤트가 있는 셀 클릭:', events)
    
    // 이벤트 정보 로깅
    const eventTypes = events.map(e => e.type || e.event_type).join(', ')
    console.log(`📊 이벤트 타입: ${eventTypes}`)
    
    // 메인 이벤트 가져오기
    const mainEvent = events[0] // 가장 우선순위 높은 이벤트
    const eventType = mainEvent?.type || mainEvent?.event_type
    
    if (eventType === 'regular' || eventType === 'special') {
      // 수업 셀 클릭: UnifiedScheduleForm을 수정 모드로 열기 (휴강 처리 가능)
      console.log('📗 수업 셀 클릭 -> UnifiedScheduleForm 수정 모드')
      
      // 날짜 계산 (현재 주의 해당 요일)
      const dayOffset = dayIndex % 7  // 0(월요일) ~ 4(금요일)
      const currentDate = new Date(timetableStore.weekStart)
      currentDate.setDate(currentDate.getDate() + dayOffset)
      const formattedDate = currentDate.toISOString().split('T')[0]
      
      // 모달 데이터 설정
      const modalData = {
        id: mainEvent.id,
        type: eventType,
        event_type: eventType,
        title: mainEvent.title || mainEvent.subject_name,
        subject_id: mainEvent.subject_id,
        day: dayIndex + 1, // 1(월요일) ~ 5(금요일)
        start_period: mainEvent.start_period || timeIndex,
        end_period: mainEvent.end_period || timeIndex,
        professor_name: mainEvent.professor_name || mainEvent.professor,
        room: mainEvent.room,
        date: formattedDate,
        isEdit: true,
        grade: mainEvent.grade || selectedGrade.value,
        level: mainEvent.level || selectedLevel.value,
        semester: mainEvent.semester || timetableStore.currentSemester,
        is_special_lecture: eventType === 'special' ? 1 : 0
      }
      
      // UnifiedScheduleForm 모달 열기
      timetableStore.openUnifiedScheduleForm({
        isEdit: true,
        modalData,
        showTypeSelector: true,
        allowCancel: true,
        timetableData: mainEvent
      })
    } else {
      // 그 외 이벤트(휴강, 보강 등)는 상세 정보 모달
      console.log('🔍 이벤트 상세 정보 모달')
      timetableStore.showDetailModal(events)
    }
  } else {
    // ⬜️ 빈 셀 클릭: 정규 수업 or 특강 등록 폼 열기
    console.log('⬜️ 빈 셀 클릭 -> 정규 수업/특강 등록 폼')
    
    // 날짜 계산 (현재 주의 해당 요일)
    const dayOffset = dayIndex % 7  // 0(월요일) ~ 4(금요일)
    const currentDate = new Date(timetableStore.weekStart)
    currentDate.setDate(currentDate.getDate() + dayOffset)
    const formattedDate = currentDate.toISOString().split('T')[0]
    
    // 기본 정규 수업 데이터
    const modalData = {
      type: 'regular', // 기본값: 정규 수업
      day: dayIndex + 1, // 1(월요일) ~ 5(금요일)
      start_period: timeIndex,
      end_period: timeIndex,
      grade: selectedGrade.value,
      level: selectedLevel.value,
      student_type: selectedStudentType.value,
      semester: timetableStore.currentSemester,
      date: formattedDate,
      is_special_lecture: 0
    }
    
    // UnifiedScheduleForm 모달 열기
    timetableStore.openUnifiedScheduleForm({
      isEdit: false,
      modalData,
      showTypeSelector: true,
      allowCancel: false
    })
  }
}

// 이벤트 등록 핸들러
const handleRegisterEvent = async (eventData) => {
  try {
    if (timetableStore.modalType === 'cancel') {
      await timetableStore.registerCancellation(eventData)
    } else if (timetableStore.modalType === 'makeup') {
      await timetableStore.registerMakeup(eventData)
    } else {
      // 일반 수업(정규/특강) 등록
      await timetableStore.createEvent(eventData)
    }
    await fetchEvents()
  } catch (error) {
    console.error('이벤트 등록 실패:', error)
  }
}

// 이벤트 취소 핸들러
const handleCancelEvent = async (eventData) => {
  try {
    // eventData가 ID만 있는 경우와 객체인 경우 모두 처리
    const eventId = typeof eventData === 'object' ? eventData.id : eventData
    
    if (!eventId) {
      console.error('유효한 이벤트 ID가 없습니다')
      return
    }
    
    await timetableStore.cancelClass(eventId)
    await fetchEvents()
  } catch (error) {
    console.error('이벤트 취소 실패:', error)
  }
}

// 이벤트 수정 핸들러
const handleEditEvent = (event) => {
  timetableStore.showEditModal({
    ...event,
    grade: selectedGrade.value,
    level: selectedLevel.value,
    student_type: selectedStudentType.value,
    group_level: selectedGroupLevel.value,
    is_foreigner: selectedStudentType.value === 'foreigner'
  })
}

// 통합 일정 등록 폼 제출 핸들러
const handleUnifiedScheduleSubmit = async (formData) => {
  try {
    console.log('📝 통합 일정 등록 폼 제출:', formData)
    
    // 폼 데이터 처리
    const eventType = formData.type
    
    if (eventType === 'cancel') {
      // 휴강 등록
      await timetableStore.registerCancellation(formData)
    } else if (eventType === 'makeup') {
      // 보강 등록
      await timetableStore.registerMakeup(formData)
    } else if (formData.id) {
      // 기존 이벤트 수정
      await timetableStore.updateEvent(formData)
    } else {
      // 새 이벤트 등록
      await timetableStore.createEvent(formData)
    }
    
    // 이벤트 다시 로드
    await fetchEvents()
    
    // 모달 닫기
    timetableStore.closeModal()
  } catch (error) {
    console.error('일정 등록 오류:', error)
    alert(`일정 등록 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
  }
}

// 폼 오류 핸들러
const handleFormError = (error) => {
  console.error('폼 제출 오류:', error)
  alert(`폼 제출 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
}

// 필터 변경 감지
watch([selectedGrade, selectedLevel, selectedStudentType, selectedGroupLevel], () => {
  fetchEvents();
}, { deep: true });

// 컴포넌트 마운트 시 이벤트 조회
onMounted(() => {
  console.log('WeeklyTimetable component mounted')
  console.log('Initial state:', {
    grade: selectedGrade.value,
    level: selectedLevel.value,
    studentType: selectedStudentType.value,
    groupLevel: selectedGroupLevel.value
  })
  
  // 과목 데이터 로드
  const subjectStore = useSubjectStore()
  if (subjectStore.subjects.length === 0) {
    subjectStore.fetchSubjects()
  }
  
  // 시간표 데이터 로드
  fetchEvents().then(() => {
    console.log('Events loaded:', timetableStore.events.length)
    
    // 데이터가 없으면 추가 정보 로깅
    if (timetableStore.events.length === 0) {
      console.log('No events found. Check API request parameters and response.')
    }
  }).catch(error => {
    console.error('Failed to fetch events:', error)
  })
})
</script>

<style scoped>
.weekly-timetable {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
}

.filter-section {
  transition: all 0.3s ease;
}

.timetable-container {
  min-height: 600px;
}

.weekend {
  background-color: #fef3c7;
}

table {
  table-layout: fixed;
}

th, td {
  width: calc(100% / 6);
}

th:first-child, td:first-child {
  width: 80px;
}

/* Modal Styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  max-width: 90%;
  width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: modal-fade-in 0.3s ease;
}

@keyframes modal-fade-in {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 50;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #4b5563;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
