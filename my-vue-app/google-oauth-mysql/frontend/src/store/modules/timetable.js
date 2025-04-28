/**
 * Timetable Store
 * 
 * 주요 업데이트 사항 (2023.05):
 * 1. 렌더링 로직 개선:
 *    - 정규 수업: 학년(grade) 기준 필터링
 *    - 특강 수업: 레벨(level) 기준 필터링
 *    - TOPIK 수업: is_special_lecture=2 또는 is_foreigner_target=1 인 경우 처리
 *    - 휴강/보강/공휴일: 날짜 비교 로직 개선 (isDateInWeekRange 함수)
 * 
 * 2. 통합 UI 처리:
 *    - openUnifiedScheduleForm: 모든 이벤트 타입 등록/수정 통합 처리
 *    - handleCellAction: 셀 클릭 통합 처리
 *    - determineEventType: 이벤트 객체에서 타입 추출 로직 개선
 * 
 * 3. 날짜 처리:
 *    - formatDate: Date 객체를 YYYY-MM-DD 형식으로 변환
 *    - isDateInWeekRange: 날짜가 특정 주 범위 내인지 확인
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/store'
import apiClient from '@/services/apiClient'
import { fetchAllBySemester } from '@/services/timetableService'
import { CLASS_TYPES, STUDENT_TYPES, LINE_MESSAGE_TEMPLATES } from '@/constants/timetable'
import { applyFilters } from '@/utils/filters'
import { isOverlapping, validateEventTimes } from '@/utils/events'
import { getCache, setCache, getCacheKey } from '@/utils/cache'
import { getSemesterRange } from '@/utils/semester'

// Helper function to format dates as YYYY-MM-DD
function formatDate(date) {
  if (!(date instanceof Date)) return 'Invalid date';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to check if a date is within the week range
function isDateInWeekRange(date, weekRef) {
  try {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return false;
    }
    
    // 기준일 (weekRef)로부터 해당 주의 월요일과 금요일 계산
    const refDate = weekRef instanceof Date ? weekRef : new Date(weekRef);
    if (isNaN(refDate.getTime())) {
      console.error('Invalid reference date for week range check');
      return false;
    }
    
    // 기준일의 요일 (0: 일요일, 1: 월요일, ..., 6: 토요일)
    const dayOfWeek = refDate.getDay();
    
    // 월요일로 조정 (일요일이면 -6, 월요일이면 0, 화요일이면 -1, ...)
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(refDate);
    monday.setDate(refDate.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0); // 시작일은 00:00:00
    
    // 금요일로 조정 (월요일 + 4일)
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999); // 종료일은 23:59:59
    
    // 해당 날짜가 월요일과 금요일 사이인지 확인
    const isInRange = date >= monday && date <= friday;
    
    if (isInRange) {
      console.log(`✅ 날짜 ${formatDate(date)}는 현재 주 ${formatDate(monday)} ~ ${formatDate(friday)} 범위 내`);
    } else {
      console.log(`❌ 날짜 ${formatDate(date)}는 현재 주 ${formatDate(monday)} ~ ${formatDate(friday)} 범위 밖`);
    }
    
    return isInRange;
  } catch (error) {
    console.error('주간 범위 체크 중 오류 발생:', error);
    return false;
  }
}

export const useTimetableStore = defineStore('timetable', () => {
  // State
  const events = ref([])
  const regulars = ref([])
  const specials = ref([])
  const loading = ref(false)
  const error = ref(null)
  const currentGrade = ref(1)
  const currentLevel = ref('beginner')
  const currentWeek = ref(new Date())
  const studentType = ref(STUDENT_TYPES.ALL)
  const dateRange = ref({
    start: null,
    end: null
  })
  const filters = ref({
    year: null,
    level: null,
    groupLevel: null,
    grade: null,
      studentType: STUDENT_TYPES.ALL,
      subjectType: null
  })
  // Modal states
  const showingRegisterModal = ref(false)
  const showingDetailModal = ref(false)
  const registerModalData = ref(null)
  const detailModalData = ref(null)
  const showModal = ref(false)
  const modalType = ref('') // 'register', 'detail', 'edit', 'cancel', 'makeup', 'unified'
  const modalData = ref(null)
  // UnifiedScheduleForm states
  const showUnifiedModal = ref(false)
  const unifiedModalData = ref({
    isEdit: false,
    modalData: null,
    showTypeSelector: true,
    allowCancel: true,
    eventType: 'regular',
    timetableData: null,
    allEvents: null  // 여러 이벤트가 있는 경우 (선택 UI용)
  })
  // Getters
  const authStore = useAuthStore()
  const filteredEvents = computed(() => {
    // 선택된 학년이 없으면 빈 배열 반환
    if (!currentGrade.value && !currentLevel.value) {
      console.log('🚨 선택된 학년/레벨이 없습니다.');
      return [];
    }

    // 필터링을 위한 환경 변수
    const currentGradeInt = parseInt(typeof currentGrade.value === 'number' ? String(currentGrade.value) : currentGrade.value || '0', 10) || 0;
    const eventYearFilter = currentGradeInt > 0 ? currentGradeInt : null;
    
    // 현재 학기와 년도 가져오기
    const currentYear = new Date().getFullYear();
    const currentSemesterName = getCurrentSemester();
    
    // 학기 범위 가져오기 - 년도는 문자열로 전달
    const semesterRange = getSemesterRange(String(currentYear), currentSemesterName);
    
    console.log('🔍 필터링 시작...');
    console.log(`  📆 현재 학기 범위: ${semesterRange.start_date} - ${semesterRange.end_date}`);
    console.log(`  👥 선택된 학년: ${currentGradeInt || 'ALL'}, 레벨: ${currentLevel.value || 'ALL'}`);
    
    console.log(`🔍 이벤트 필터링 시작: ${events.value.length}개 이벤트, 현재 학년: ${currentGrade.value}, 현재 주: ${formatDate(currentWeek.value)}`)
    console.log(`👤 사용자 권한: ${authStore.isAdmin ? '관리자' : '일반 사용자'}`)
    
    // 필터링 결과를 위한 카운터 초기화
    let regularClassesCount = 0;
    let specialLecturesCount = 0;
    let canceledCount = 0;
    let makeupCount = 0;
    let holidaysCount = 0;
    let topikCount = 0;
    
    // 이벤트 필터링
    const filtered = events.value.filter((event) => {
      if (!event) return false;
      
      // 이벤트 학년 추출 - 학생과 매칭시키는데 사용
      const eventYear = 
        typeof event.grade === 'number' ? event.grade : 
        typeof event.grade === 'string' ? parseInt(event.grade, 10) : 
        typeof event.year === 'number' ? event.year : 
        typeof event.year === 'string' ? parseInt(event.year, 10) : null;
      
      // 이벤트 타입 명확히 결정
      const isRegular = 
        (!event.is_special_lecture || event.is_special_lecture === 0) && 
        (!event.type || event.type === 'regular') &&
        (!event.event_type || event.event_type === 'regular');
        
      const isSpecialLecture = 
        event.is_special_lecture === 1 || 
        event.is_special_lecture === true || 
        event.is_special_lecture === '1' ||
        event.type === 'special' || 
        event.event_type === 'special';
      
      const isHoliday = 
        event.type === 'holiday' || 
        event.event_type === 'holiday';
      
      const isCancellation = 
        event.type === 'cancel' || 
        event.event_type === 'cancel' || 
        event.status === 'canceled';
      
      const isMakeup = 
        event.type === 'makeup' || 
        event.event_type === 'makeup';
      
      const isTopikClass = 
        event.is_special_lecture === 2 || 
        event.is_special_lecture === '2' ||
        (event.is_foreigner_target === 1 || 
         event.is_foreigner_target === true || 
         event.is_foreigner_target === '1') ||
        (event.level && String(event.level).includes('TOPIK')) ||
        event.type === 'topik' || 
        event.event_type === 'topik';
      
      // 1. 공휴일 - 모든 학년에 표시 (주간 범위 내 날짜만)
      if (isHoliday) {
        const eventDate = event.date ? new Date(event.date) : event.event_date ? new Date(event.event_date) : null;
        // 날짜가 없거나 유효하지 않으면 필터링
        if (!eventDate || isNaN(eventDate.getTime())) {
          return false;
        }
        
        // 현재 주 범위 내 공휴일만 포함 - 나중에 구현할 isDateInWeekRange 함수 사용
        const isInCurrentWeek = isDateInWeekRange(eventDate, currentWeek.value);
        if (!isInCurrentWeek) {
          return false;
        }
        
        holidaysCount++;
        console.log(`🏖️ 공휴일 포함됨: ${event.title || event.name || '공휴일'}, 날짜: ${formatDate(eventDate)}`);
        return true;
      }
      
      // 2. 휴강 이벤트 - 날짜 비교 및 원 수업의 학년과 일치하는지 확인
      if (isCancellation) {
        const eventDate = event.date ? new Date(event.date) : event.event_date ? new Date(event.event_date) : null;
        // 날짜가 없거나 유효하지 않으면 필터링
        if (!eventDate || isNaN(eventDate.getTime())) {
          return false;
        }
        
        // 현재 주 범위 내 휴강만 포함
        const isInCurrentWeek = isDateInWeekRange(eventDate, currentWeek.value);
        if (!isInCurrentWeek) {
          console.log(`📅 휴강 날짜 ${formatDate(eventDate)} 범위 밖 - 필터링됨`);
          return false;
        }
        
        // 휴강 대상 수업의 학년 정보를 확인
        const relatedGrade = event.grade || (event.timetable_id ? event.timetable?.grade : null);
        
        // 휴강이 속한 원 수업의 학년과 현재 선택된 학년이 다르면 필터링
        if (relatedGrade && currentGradeInt && parseInt(relatedGrade, 10) !== currentGradeInt) {
          console.log(`🚫 학년 불일치로 휴강 필터링 제외: ${event.subject_name || event.title}, ID: ${event.id}, 휴강학년: ${relatedGrade}, 현재학년: ${currentGradeInt}`);
          return false;
        }
        
        canceledCount++;
        console.log(`🛑 휴강 이벤트 포함됨: ${event.subject_name || event.title}, 날짜: ${formatDate(eventDate)}, ID: ${event.id}, 학년: ${relatedGrade || '미지정'}`);
        return true;
      }
      
      // 3. 보강 이벤트 - 날짜 비교 및 원 수업의 학년과 일치하는지 확인
      if (isMakeup) {
        const eventDate = event.date ? new Date(event.date) : event.event_date ? new Date(event.event_date) : null;
        // 날짜가 없거나 유효하지 않으면 필터링
        if (!eventDate || isNaN(eventDate.getTime())) {
          return false;
        }
        
        // 현재 주 범위 내 보강만 포함
        const isInCurrentWeek = isDateInWeekRange(eventDate, currentWeek.value);
        if (!isInCurrentWeek) {
          console.log(`📅 보강 날짜 ${formatDate(eventDate)} 범위 밖 - 필터링됨`);
          return false;
        }
        
        // 보강 대상 수업의 학년 정보를 확인
        const relatedGrade = event.grade || (event.timetable_id ? event.timetable?.grade : null);
        
        // 보강이 속한 원 수업의 학년과 현재 선택된 학년이 다르면 필터링
        if (relatedGrade && currentGradeInt && parseInt(relatedGrade, 10) !== currentGradeInt) {
          console.log(`🚫 학년 불일치로 보강 필터링 제외: ${event.subject_name || event.title}, ID: ${event.id}, 보강학년: ${relatedGrade}, 현재학년: ${currentGradeInt}`);
          return false;
        }
        
        makeupCount++;
        console.log(`🔄 보강 이벤트 포함됨: ${event.subject_name || event.title}, 날짜: ${formatDate(eventDate)}, ID: ${event.id}, 학년: ${relatedGrade || '미지정'}`);
        return true;
      }
      
      // 4. 특강 - 레벨 필터링 적용
      if (isSpecialLecture) {
        // 관리자는 레벨 필터링 우회
        if (!authStore.isAdmin && currentLevel.value && event.level) {
          const eventLevel = String(event.level).toLowerCase();
          const userLevel = String(currentLevel.value).toLowerCase();
          
          if (eventLevel !== userLevel && !eventLevel.includes(userLevel)) {
            console.log(`🔍 레벨 불일치로 특강 필터링 제외: ${event.subject_name || event.title} (${eventLevel}, 현재 ${userLevel})`);
            return false;
          }
        }
        
        specialLecturesCount++;
        console.log(`✨ 특강 이벤트 포함됨 ${authStore.isAdmin ? '(관리자 권한)' : '(날짜 기반)'}: ${event.subject_name || event.title}, 레벨: ${event.level || 'N/A'}, ID: ${event.id}`);
        return true;
      }
      
      // 5. TOPIK 수업 - 레벨 필터링 적용
      if (isTopikClass) {
        // 관리자는 레벨 필터링 우회
        if (!authStore.isAdmin && currentLevel.value && event.level) {
          const eventLevel = String(event.level).toLowerCase();
          const userLevel = String(currentLevel.value).toLowerCase();
          
          if (eventLevel !== userLevel && !eventLevel.includes(userLevel)) {
            console.log(`🔍 레벨 불일치로 TOPIK 수업 필터링 제외: ${event.subject_name || event.title} (${eventLevel}, 현재 ${userLevel})`);
            return false;
          }
        }
        
        // 요일 기반 TOPIK 수업은 현재 주 표시에 항상 포함
        topikCount++;
        console.log(`🌏 TOPIK 수업 포함됨 ${authStore.isAdmin ? '(관리자 권한)' : ''}: ${event.subject_name || event.title}, 레벨: ${event.level || 'N/A'}, ID: ${event.id}`);
        return true;
      }
      
      // 6. 정규 수업 - 학년(year) 기준으로 엄격하게 필터링
      // 관리자는 학년 필터링 우회
      if (!authStore.isAdmin && (eventYear === null || eventYear !== currentGradeInt)) {
        console.log(`🚫 학년 불일치로 제외: ${event.subject_name || event.title || '이름 없음'} (이벤트 학년: ${eventYear !== null ? eventYear : 'NULL'}, 현재 학년: ${currentGradeInt})`);
        return false;
      }
      
      // 정규 수업
      regularClassesCount++;
      console.log(`📚 정규 수업 포함됨 ${authStore.isAdmin ? '(관리자 권한)' : '(학년 일치)'}: ${event.subject_name || event.title}, 학년: ${eventYear}, ID: ${event.id}`);
      return true;
    });
    
    console.log(`🔍 필터링 결과: 총 ${filtered.length}개 이벤트 (정규: ${regularClassesCount}, 특강: ${specialLecturesCount}, 휴강: ${canceledCount}, 보강: ${makeupCount}, 공휴일: ${holidaysCount}, TOPIK: ${topikCount})`);
    
    // 각 이벤트 유형별 개수 출력
    const eventsByType = filtered.reduce((acc, event) => {
      if (event.type === 'holiday' || event.event_type === 'holiday') {
        acc.holiday = (acc.holiday || 0) + 1;
      } else if (event.type === 'cancel' || event.event_type === 'cancel') {
        acc.cancel = (acc.cancel || 0) + 1;
      } else if (event.type === 'makeup' || event.event_type === 'makeup') {
        acc.makeup = (acc.makeup || 0) + 1;
      } else if (event.is_special_lecture === 1 || event.type === 'special' || event.event_type === 'special') {
        acc.special = (acc.special || 0) + 1;
      } else if (event.is_special_lecture === 2 || 
                event.is_foreigner_target === 1 || event.type === 'topik' || event.event_type === 'topik' || 
                (event.level && String(event.level).includes('TOPIK'))) {
        acc.topik = (acc.topik || 0) + 1;
      } else {
        acc.regular = (acc.regular || 0) + 1;
      }
      return acc;
    }, {});
    
    console.log('📊 필터링 후 이벤트 유형별 개수:', eventsByType);
    
    return filtered;
  })
  
  const hasOverlappingEvents = computed(() => {
    return events.value.some((event1, index) => {
      return events.value.some((event2, index2) => {
        return index !== index2 && 
               event1.day === event2.day && 
               event1.period === event2.period
      })
    })
  })

  const combinedData = computed(() => {
    // Combine all events
    const allEvents = [...regulars.value, ...specials.value, ...events.value];
    
    // 추가: 병합 전 특강 개수 로깅
    const specialLecturesBefore = allEvents.filter(e => 
      e.type === CLASS_TYPES.SPECIAL || 
      e.event_type === CLASS_TYPES.SPECIAL || 
      e.is_special_lecture === 1 || 
      e.is_special_lecture === true
    );
    
    console.log('✨ combinedData 병합 전 특강:', specialLecturesBefore.length, '개');
    
    // Sort events with null-safety
    const sortedEvents = allEvents.sort((a, b) => {
      // Compare dates if they exist
      if (a.date && b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (a.date) {
        return -1; // a has date, b doesn't
      } else if (b.date) {
        return 1;  // b has date, a doesn't
      }
      
      // If neither has date or dates are equal, compare by period
      const aStartPeriod = a.start_period || 1;
      const bStartPeriod = b.start_period || 1;
      
      return aStartPeriod - bStartPeriod;
    });
    
    // 추가: 최종 병합 결과 로깅
    console.log('📦 combinedData 최종 병합:', sortedEvents.map(e => ({
      id: e.id,
      title: e.title || e.subject_name,
      type: e.type || e.event_type,
      date: e.date,
      is_special_lecture: e.is_special_lecture
    })));
    
    // 최종 병합 후 특강 개수 로깅
    const specialLecturesAfter = sortedEvents.filter(e => 
      e.type === CLASS_TYPES.SPECIAL || 
      e.event_type === CLASS_TYPES.SPECIAL || 
      e.is_special_lecture === 1 || 
      e.is_special_lecture === true
    );
    
    console.log('✨ combinedData 병합 후 특강:', specialLecturesAfter.length, '개');
    
    return sortedEvents;
  })

  // Event type priorities
  const EVENT_PRIORITIES = {
    holiday: 0,    // 최우선 (공휴일)
    cancel: 1,     // 휴강
    makeup: 2,     // 보강
    special: 3,    // 특강
    event: 4,      // 기타 이벤트
    regular: 5     // 정규 수업
  }

  // Actions

  // 필터 변경 함수들
  function setCurrentGrade(grade) {
    if (grade && grade >= 1 && grade <= 3) {
      console.log(`📝 학년 변경: ${currentGrade.value} → ${grade}`);
      currentGrade.value = grade;
    }
  }

  function setCurrentWeek(week) {
    try {
      // Handle Date objects
      if (week instanceof Date) {
        if (!isNaN(week.getTime())) {
          currentWeek.value = week;
          console.log(`🔄 현재 주 설정: ${formatDate(week)}`);
          return;
        }
      } 
      // Handle string values
      else if (typeof week === 'string') {
        const dateObj = new Date(week);
        if (!isNaN(dateObj.getTime())) {
          currentWeek.value = dateObj;
          console.log(`🔄 현재 주 설정: ${week} (문자열에서 변환)`);
          return;
        }
      }
      
      // Fallback to current date if the provided value is invalid
      console.warn(`Invalid week value: ${week}, using current date instead`);
      currentWeek.value = new Date();
    } catch (error) {
      console.error('Error setting current week:', error);
      currentWeek.value = new Date(); 
    }
  }

  function setLevel(level) {
    currentLevel.value = level
    console.log(`🔄 현재 레벨 설정: ${level}`)
  }

  function setStudentType(type) {
    studentType.value = type
    console.log(`🔄 학생 유형 설정: ${type}`)
  }

  // 필터 설정 함수
  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
    console.log('🔄 필터 설정 완료:', filters.value)
  }

  // 날짜 범위 설정
  function setDateRange(range) {
    dateRange.value = range
    console.log('🔄 날짜 범위 설정 완료:', dateRange.value)
  }

  // 통합 데이터 처리 함수: 이벤트 유형에 따라 적절한 API 호출 실행
  async function processScheduleAction(data, actionType) {
    try {
      loading.value = true;
      let endpoint = '';
      let payload = {};

      // 공통 필드 초기화
      const commonFields = {
        year: data.year || new Date().getFullYear(),
        semester: data.semester || getCurrentSemester(),
        level: data.level || null,
        group_levels: data.group_levels || null,
        professor_name: data.professor_name || '미지정',
        room: data.room || '미지정',
        day: data.day,
        start_period: data.start_period,
        end_period: data.end_period || data.start_period,
        inherit_attributes: data.inherit_attributes === true ? 1 : 0
      };
      
      // 로깅: 처리 시작
      console.log(`🔄 [processScheduleAction] ${actionType} 처리 시작:`, {
        actionType,
        data: { ...data, id: data.id || '신규' }
      });

      switch (actionType) {
        case 'regular':
          // 정규 수업 등록
          endpoint = '/timetable';
          payload = {
            ...commonFields,
            grade: data.grade,
            level: null, // 정규 수업은 레벨 없음 (TOPIK 제외)
            is_special_lecture: 0,
            subject_id: data.subject_id
          };
          break;
          
        case 'topik':
          // TOPIK 수업 등록 (레벨 기반 정규 수업)
          endpoint = '/timetable';
          payload = {
            ...commonFields,
            year: null, // TOPIK 수업은 year 필드 사용 안함
            grade: null, // 학년 필드도 사용 안함
            level: data.level, // 직접 레벨 사용 (TOPIK4, TOPIK6)
            is_special_lecture: 0,
            is_foreigner_target: 1, // 외국인 대상임을 명시
            subject_id: data.subject_id
          };
          break;

        case 'special':
          // 특강 등록
          endpoint = '/timetable';
          payload = {
            ...commonFields,
            grade: null, // 특강은 학년 필드 사용 안함
            is_special_lecture: 1,
            subject_id: data.subject_id
          };
          break;

        case 'cancel':
          // 휴강 등록
          endpoint = '/timetable/events';
          payload = {
            ...commonFields,
            timetable_id: data.timetable_id,
            event_type: 'cancel',
            event_date: data.date,
            description: data.description || data.reason || '휴강'
          };
          break;

        case 'makeup':
          // 보강 등록
          endpoint = '/timetable/events';
          payload = {
            ...commonFields,
            timetable_id: data.timetable_id,
            subject_id: data.subject_id,
            event_type: 'makeup',
            event_date: data.date,
            description: data.description || data.reason || '보강'
          };
          break;

        case 'update':
          // 기존 이벤트 업데이트
          if (data.id) {
            if (data.is_special_lecture === 1 || data.event_type === 'special') {
              // 특강 업데이트
              endpoint = `/timetable/${data.id}`;
            } else if (data.event_type === 'cancel' || data.event_type === 'makeup') {
              // 휴강/보강 업데이트
              endpoint = `/timetable/events/${data.id}`;
            } else {
              // 정규 수업 업데이트
              endpoint = `/timetable/${data.id}`;
            }
            
            payload = {
              ...commonFields,
              id: data.id,
              subject_id: data.subject_id,
              timetable_id: data.timetable_id,
              event_type: data.event_type,
              event_date: data.date || data.event_date,
              is_special_lecture: data.is_special_lecture === true || data.is_special_lecture === 1 ? 1 : 0,
              description: data.description
            };
          } else {
            throw new Error('업데이트 요청에 ID가 누락되었습니다.');
          }
          break;

        case 'delete':
          // 이벤트 삭제
          if (data.id) {
            // ID를 항상 문자열로 변환하여 안전하게 처리
            const idStr = String(data.id);
            console.log('🔹 삭제할 ID:', idStr, '타입:', data.event_type || 'regular');
            
            // 이벤트 타입에 따라 엔드포인트 결정
            if (data.is_special_lecture === 1 || data.event_type === 'special') {
              endpoint = `/timetable/${idStr}`;
            } else if (data.event_type === 'cancel' || data.event_type === 'makeup') {
              endpoint = `/timetable/events/${idStr}`;
            } else {
              endpoint = `/timetable/${idStr}`;
            }
            
            console.log('🔍 DELETE 요청 경로:', endpoint);
            
            // DELETE 요청은 페이로드 없음
            payload = null;
          } else {
            throw new Error('삭제 요청에 ID가 누락되었습니다.');
          }
          break;

        default:
          throw new Error(`지원되지 않는 액션 타입: ${actionType}`);
      }

      // API 요청 실행
      let response;
      
      if (actionType === 'delete') {
        // 확인: 엔드포인트가 정상적인 문자열인지 확인
        if (typeof endpoint !== 'string' || !endpoint) {
          throw new Error(`유효하지 않은 엔드포인트: ${endpoint}`);
        }
        
        try {
          response = await apiClient.delete(endpoint, {
            headers: {
              Authorization: `Bearer ${authStore.token}`
            }
          });
          console.log(`✅ DELETE 요청 성공: ${endpoint}`);
        } catch (error) {
          console.error(`❌ DELETE 요청 실패 (${endpoint}):`, error);
          if (error.response) {
            console.error('응답 상태:', error.response.status);
            console.error('응답 데이터:', error.response.data);
          }
          throw error;
        }
      } else if (actionType === 'update') {
        response = await apiClient.put(endpoint, payload, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        response = await apiClient.post(endpoint, payload, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      // 응답 로깅
      console.log(`✅ [processScheduleAction] ${actionType} 처리 완료:`, response.data);
      
      // 중복 확인 (보강의 경우)
      if (actionType === 'makeup' && isOverlapping(payload)) {
        console.warn('⚠️ 중복 이벤트가 감지되었습니다:', payload);
      }

      // LINE 알림 전송 (해당하는 이벤트 타입만)
      if (['regular', 'special', 'topik', 'cancel', 'makeup'].includes(actionType)) {
        try {
          await sendLineNotification(response.data);
        } catch (notifyError) {
          console.error('LINE 알림 전송 실패:', notifyError);
        }
      }

      // 캐시 무효화 - 주간 조회 시 최신 데이터 로드되도록
      invalidateEventCache();

      return response.data;
    } catch (err) {
      console.error(`❌ [processScheduleAction] ${actionType} 처리 실패:`, err);
      error.value = err.message || `${actionType} 이벤트 처리 중 오류가 발생했습니다.`;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 캐시 무효화 함수
  function invalidateEventCache() {
    // 현재 선택된 주 관련 캐시만 무효화
    const targetWeek = getWeekDate(currentWeek.value);
    const specialCacheKey = getCacheKey('special_lectures', {
      level: currentLevel.value,
      semester: getCurrentSemester(),
      year: new Date().getFullYear(),
      week: targetWeek
    });
    
    const regularCacheKey = getCacheKey('weekly', {
      grade: currentGrade.value,
      level: currentLevel.value,
      semester: getCurrentSemester(),
      week: targetWeek,
      year: new Date().getFullYear()
    });
    
    // 캐시 삭제 (10초 후 만료 - 바로 무효화하지 않고 짧은 유효기간 설정)
    setCache(specialCacheKey, null, 10 * 1000);
    setCache(regularCacheKey, null, 10 * 1000);
    
    console.log('🔄 이벤트 캐시 무효화 완료');
  }

  // 통합 등록 함수: 외부에서 호출할 메인 API
  async function registerScheduleItem(data) {
    // 필수 필드 검증
    if (!data.type) {
      throw new Error('이벤트 유형이 지정되지 않았습니다.');
    }
    
    // 유형별 필수 필드 검증
    validateRequiredFields(data);
    
    // 적절한 액션 타입으로 처리
    return await processScheduleAction(data, data.type);
  }

  // 필드 유효성 검증
  function validateRequiredFields(data) {
    const type = data.type;
    const missingFields = [];
    
    // 공통 필수 필드
    if (!data.start_period) missingFields.push('start_period');
    if (!data.day && !data.date) missingFields.push('day or date');
    
    // 유형별 필수 필드
    switch (type) {
      case 'regular':
        if (!data.subject_id) missingFields.push('subject_id');
        if (!data.grade) missingFields.push('grade');
        if (!data.semester) missingFields.push('semester');
        break;
        
      case 'topik':
        if (!data.subject_id) missingFields.push('subject_id');
        if (!data.level) missingFields.push('level');
        if (!data.semester) missingFields.push('semester');
        break;
        
      case 'special':
        if (!data.subject_id) missingFields.push('subject_id');
        if (!data.level) missingFields.push('level');
        if (!data.semester) missingFields.push('semester');
        break;
        
      case 'cancel':
        if (!data.timetable_id && !data.event_id) missingFields.push('timetable_id or event_id');
        if (!data.date) missingFields.push('date');
        break;
        
      case 'makeup':
        if (!data.timetable_id && !data.subject_id) missingFields.push('timetable_id or subject_id');
        if (!data.date) missingFields.push('date');
        break;
    }
    
    if (missingFields.length > 0) {
      throw new Error(`${type} 등록에 필요한 필드가 누락되었습니다: ${missingFields.join(', ')}`);
    }
    
    return true;
  }

  // 정규 수업 등록 - 레거시 호환용
  async function createTimetableEntry(data) {
    // 새 통합 인터페이스로 리디렉션
    const actionType = data.is_special_lecture === 1 ? 'special' : 
                      (data.level ? 'topik' : 'regular');
    
    console.log(`ℹ️ createTimetableEntry → registerScheduleItem(${actionType})`);
    return await processScheduleAction(data, actionType);
  }

  // 이벤트 등록 (휴강/보강) - 레거시 호환용
  async function createTimetableEvent(eventData) {
    // 새 통합 인터페이스로 리디렉션
    const actionType = eventData.event_type || 
                      (eventData.type === 'cancel' ? 'cancel' : 'makeup');
    
    console.log(`ℹ️ createTimetableEvent → registerScheduleItem(${actionType})`);
    return await processScheduleAction(eventData, actionType);
  }

  // LINE 알림 전송 (개선: 대상자 계산 정확도 향상)
  async function sendLineNotification(event) {
    // 알림이 필요한 이벤트 타입인지 확인
    const notifiableTypes = [
      'regular', 'special', 'topik', 'cancel', 'makeup',
      CLASS_TYPES.REGULAR, CLASS_TYPES.SPECIAL, CLASS_TYPES.CANCEL, CLASS_TYPES.MAKEUP
    ];
    
    if (!event || !notifiableTypes.includes(event.type) && !notifiableTypes.includes(event.event_type)) {
      console.log('📱 LINE 알림 대상 아님:', event?.type || event?.event_type);
      return;
    }

    try {
      // 이벤트 유형 결정 (다양한 필드 형식 지원)
      const eventType = event.type || event.event_type || 'regular';
      
      // 메시지 템플릿 가져오기
      const template = LINE_MESSAGE_TEMPLATES[eventType];
      if (!template) {
        console.log(`📱 LINE 템플릿 없음: ${eventType}`);
        return;
      }
      
      // 알림 대상자 필터링 파라미터 구성
      const targetParams = {};
      
      // 특강(special)과 레벨 기반 수업(topik)은 학년 대신 레벨 기준으로 대상자 선택
      if (eventType === CLASS_TYPES.SPECIAL || event.is_special_lecture === 1 || event.is_special_lecture === true) {
        // 특강인 경우 레벨 기준 대상자 선택
        if (event.level) targetParams.level = event.level;
        if (event.group_levels) targetParams.group_levels = event.group_levels;
      } else {
        // 정규 수업인 경우 학년 기준 대상자 선택
        if (event.year || event.grade) targetParams.year = event.year || event.grade;
        // TOPIK 수업은 레벨도 함께 고려
        if (event.level) targetParams.level = event.level;
      }
      
      // 외국인 대상 여부
      if (event.is_foreigner !== undefined) {
        targetParams.is_foreigner = event.is_foreigner;
      }
      
      console.log('📱 LINE 알림 대상자 파라미터:', targetParams);

      // 알림 대상자 조회
      const recipients = await apiClient.get('/api/line/recipients', {
        params: targetParams
      });

      if (!recipients.data || recipients.data.length === 0) {
        console.log('📱 LINE 알림 대상자 없음');
        return;
      }
      
      console.log(`📱 LINE 알림 대상자: ${recipients.data.length}명`);

      // LINE 메시지 전송
      await apiClient.post('/api/line/notify', {
        message: template(event),
        recipients: recipients.data
      });
      
      console.log('✅ LINE 알림 전송 완료');
    } catch (err) {
      console.error('❌ LINE 알림 전송 실패:', err);
    }
  }

  // 현재 날짜에서 해당 주의 시작일(월요일) 구하기
  function getWeekDate(date) {
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) {
        console.error('Invalid date provided to getWeekDate:', date)
        return formatDate(new Date()) // 현재 날짜 반환
      }
      
      // 요일 (0: 일요일, 1: 월요일, ..., 6: 토요일)
      const day = d.getDay()
      
      // 월요일로 조정 (일요일이면 -6, 월요일이면 0, 화요일이면 -1, ...)
      const mondayOffset = day === 0 ? -6 : 1 - day
      const monday = new Date(d)
      monday.setDate(d.getDate() + mondayOffset)
      monday.setHours(0, 0, 0, 0) // 시작 시간은 00:00:00으로 설정
      
      return formatDate(monday)
    } catch (error) {
      console.error('getWeekDate 처리 중 오류 발생:', error)
      return formatDate(new Date())
    }
  }

  // 현재 학기 가져오기
  function getCurrentSemester() {
    const now = new Date();
    const month = now.getMonth() + 1; // JavaScript months are 0-based
    
    if (month >= 3 && month <= 6) return 'spring';
    if (month >= 7 && month <= 8) return 'summer';
    if (month >= 9 && month <= 12) return 'fall';
    return 'winter';
  }

  // 학기 범위 정보 구하기
  function getSemesterRangeForFiltering() {
    const currentYear = new Date().getFullYear();
    const currentSemesterName = getCurrentSemester();
    // 숫자를 문자열로 변환하여 전달
    return getSemesterRange(String(currentYear), currentSemesterName);
  }

  function showCancelClassModal(day, period) {
    modalType.value = 'cancel'
    modalData.value = { day, period, subjects: [] }
    showModal.value = true
  }

  function showMakeupClassModal(data) {
    modalType.value = 'makeup'
    modalData.value = data
    showModal.value = true
  }
  
  function showRegisterModal(data) {
    modalType.value = 'register'
    modalData.value = data
    showModal.value = true
  }
  
  function showEditModal(event) {
    modalType.value = 'edit'
    modalData.value = event
    showModal.value = true
  }

  function showDetailModal(events) {
    modalType.value = 'detail'
    modalData.value = { events }
    showingDetailModal.value = true
    showModal.value = true
  }

  function closeModal() {
    // Reset all modal states
    showModal.value = false
    showUnifiedModal.value = false
    modalType.value = ''
    modalData.value = null
    
    // Reset detailed modal states
    showingDetailModal.value = false
    showingRegisterModal.value = false
    registerModalData.value = null
    detailModalData.value = null
    
    // Reset unified modal data
    unifiedModalData.value = {
      isEdit: false,
      modalData: null,
      showTypeSelector: true,
      allowCancel: true,
      eventType: 'regular',
      timetableData: null,
      allEvents: null  // 여러 이벤트가 있는 경우 (선택 UI용)
    }
  }

  function hideRegisterModal() {
    showingRegisterModal.value = false
    registerModalData.value = null
  }

  function hideDetailModal() {
    showingDetailModal.value = false
    detailModalData.value = null
  }

  async function registerCancellation(data) {
    try {
      const payload = {
        timetable_id: data.timetable_id,
        event_type: 'cancel',
        event_date: data.date,
        start_period: data.start_period,
        end_period: data.end_period,
        description: data.reason || '휴강',
        professor_name: data.professor_name,
        room: data.room,
        inherit_attributes: data.inherit_attributes === true ? 1 : 0
      };

      const response = await apiClient.post('/timetable/events', payload);
      return response.data;
    } catch (error) {
      console.error('❌ [registerCancellation] 오류:', error);
      throw error;
    }
  }

  async function registerMakeup(data) {
    try {
      const payload = {
        timetable_id: data.timetable_id,
        subject_id: data.subject_id,
        event_type: 'makeup',
        event_date: data.date,
        start_period: data.start_period,
        end_period: data.end_period,
        description: data.reason || '보강',
        professor_name: data.professor_name,
        room: data.room,
        inherit_attributes: data.inherit_attributes === true ? 1 : 0
      };

      const response = await apiClient.post('/timetable/events', payload);
      return response.data;
    } catch (error) {
      console.error('❌ [registerMakeup] 오류:', error);
      throw error;
    }
  }

  // 주간 시간표 조회 (통합 API 사용)
  async function fetchWeeklyEvents(params = {}) {
    const authStore = useAuthStore()
    if (!authStore.isLoggedIn) {
      console.warn('사용자가 로그인되어 있지 않습니다. 시간표를 불러올 수 없습니다.')
      return { events: [] }
    }

    // 파라미터 기본값 및 변수 처리
    const {
      grade = currentGrade.value,
      level = currentLevel.value,
      group_level = 'ALL',
      is_foreigner = null,
      student_type = studentType.value,
      semester = getCurrentSemester(),
      week,
      year = new Date().getFullYear(),
      skipGradeFilter = false, // 기본값 false: 정규 수업은 학년별로 구분함
      includeHolidays = true,  // 기본값 true: 공휴일 포함
      includeCancellations = true, // 기본값 true: 휴강 포함
      includeMakeups = true    // 기본값 true: 보강 포함
    } = params

    // 날짜 검증: week 파라미터가 유효한 날짜 형식인지 확인
    const weekDate = week ? new Date(week) : null
    if (week && (!weekDate || isNaN(weekDate.getTime()) || weekDate.toString() === 'Invalid Date')) {
      console.warn(`⚠️ 잘못된 날짜 형식: ${week}, 현재 날짜로 대체합니다.`)
      params.week = getWeekDate(new Date())
    }

    // 현재 주 지정이 없으면 현재 날짜 기준으로 계산
    const targetWeek = params.week || getWeekDate(currentWeek.value)

    // *** 캐시 키 생성 - 일반 강의용, 특강용 분리 ***
    // 특강용 별도 캐시 키 생성 (학년 무관, 레벨만 포함)
    const specialLectureCacheKey = getCacheKey('special_lectures', {
      level, semester, year, week: targetWeek
    })
    
    // 일반 수업용 캐시 키 생성 (학년 포함)
    const regularCacheKey = getCacheKey('weekly', {
      grade, level, group_level, is_foreigner, student_type, semester, week: targetWeek, year
    })

    // 일반 수업 캐시 확인
    const cachedRegularData = getCache(regularCacheKey)
    // 특강 캐시 확인
    const cachedSpecialData = getCache(specialLectureCacheKey)

    // 두 캐시 모두 있으면 병합해서 반환
    if (cachedRegularData && cachedSpecialData) {
      console.log('🔄 캐시에서 시간표 데이터 로드 (병합):', 
        '일반:', cachedRegularData.events?.length || 0, '개,',
        '특강:', cachedSpecialData.events?.length || 0, '개 이벤트');
      
      // 두 이벤트 배열 병합
      const combinedEvents = [
        ...(cachedRegularData.events || []),
        ...(cachedSpecialData.events || [])
      ];
      
      // 병합된 데이터 상태 업데이트
      events.value = processEvents(combinedEvents);
      
      // 병합된 결과 반환
      return { 
        ...cachedRegularData, 
        events: combinedEvents,
        _source: '캐시 병합' 
      };
    }
    
    // 일반 캐시만 있는 경우, 특강은 따로 요청해야 함
    if (cachedRegularData) {
      console.log('🔄 캐시에서 일반 수업 데이터 로드:', cachedRegularData.events?.length || 0, '개 (특강 별도 요청 필요)');
    }
    
    // 특강 캐시만 있는 경우도 처리 (일반 수업은 요청 필요)
    if (cachedSpecialData) {
      console.log('🔄 캐시에서 특강 데이터 로드:', cachedSpecialData.events?.length || 0, '개 (일반 수업 별도 요청 필요)');
    }

    loading.value = true
    error.value = null

    try {
      // API 호출
      const isForeigner = authStore.user?.is_foreigner || false
      
      // API 요청 파라미터 설정 (모든 값을 문자열로 변환)
      const requestParams = {
        // 공통 파라미터
        semester: String(semester),
        week: String(targetWeek),
        year: String(year),
        
        // 사용자 타입에 따른 필터링
        is_foreigner: String(isForeigner)
      }
      
      // 관리자 권한 확인 및 플래그 추가
      if (authStore.isAdmin) {
        requestParams.is_admin = 'true'
        console.log('👑 관리자 권한으로 요청을 보냅니다. 필터링 제한이 적용되지 않습니다.')
      }
      
      // 정규 수업은 grade(year)로 필터링 (학년별로 구분)
      if (grade) {
        requestParams.grade = String(grade)
      }
      
      // 특강 등은 level로 필터링
      if (level && level !== 'ALL') {
        requestParams.level = String(level)
      }
      
      // 학년 무시 플래그 설정 (optional)
      // 특강은 학년과 무관하게 모든 학년에 표시해야 함
      if (skipGradeFilter) {
        requestParams.ignoreGradeFilter = 'true'
      }
      
      // 특정 이벤트 유형 포함/제외 설정
      requestParams.includeHolidays = String(includeHolidays)
      requestParams.includeCancellations = String(includeCancellations)
      requestParams.includeMakeups = String(includeMakeups)
      
      if (group_level && group_level !== 'ALL') {
        requestParams.group_level = String(group_level)
      }
      
      // 학생 타입에 따른 필터링
      if (student_type && student_type !== 'all') {
        requestParams.student_type = String(student_type)
      }
      
      console.log('🔍 요청 파라미터:', requestParams)
      console.log('🎯 API 요청 전 중요 파라미터 확인:')
      console.log('  - 학년 정보:', requestParams.grade || '전체')
      console.log('  - 레벨 필터:', requestParams.level || '전체')
      console.log('  - 학기:', requestParams.semester || '전체')
      console.log('  - 학년 무시 설정:', requestParams.ignoreGradeFilter === 'true' ? '✅ 활성화' : '❌ 비활성화')
      console.log('  - 공휴일 포함:', requestParams.includeHolidays === 'true' ? '✅ 포함' : '❌ 제외')
      console.log('  - 휴강 포함:', requestParams.includeCancellations === 'true' ? '✅ 포함' : '❌ 제외')
      console.log('  - 보강 포함:', requestParams.includeMakeups === 'true' ? '✅ 포함' : '❌ 제외')
      
      // API 요청 전송
      const response = await apiClient.get('/timetable/weekly', {
        params: requestParams,
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000, // 15초 타임아웃 설정
        validateStatus: function (status) {
          return status < 500 // 500 미만 상태 코드는 정상 처리 (에러는 catch 블록에서 처리)
        }
      })

      // 응답 데이터 처리
      const data = response.data || { events: [] }
      
      // 데이터 형식 검증: events 배열이 없거나 null인 경우 빈 배열로 초기화
      if (!data.events) {
        console.warn('⚠️ API 응답에 events 배열이 없습니다. 빈 배열로 초기화합니다.')
        data.events = []
      }
      
      // 데이터 로그
      console.log(`✅ 주간 이벤트 로드 완료: ${data.events.length}개`)
      
      // 서버에서 받은 이벤트 데이터 전처리
      const validEvents = data.events.filter(event => !!event).map(event => {
        // null 또는 undefined ID 필드 처리 (localeCompare 오류 방지)
        if (!event.id) {
          event.id = `temp-${Date.now()}-${Math.floor(Math.random() * 10000)}`
        }
        
        // 타입 필드 확인 및 정규화
        if (!event.type && !event.event_type) {
          event.type = 'regular'
          event.event_type = 'regular'
        }
        
        // 이벤트 타입 정규화 (type과 event_type 동기화)
        if (!event.type && event.event_type) {
          event.type = event.event_type
        } else if (event.type && !event.event_type) {
          event.event_type = event.type
        }
        
        return event
      })
      
      // 이벤트 유형별 분류 카운터
      const eventTypeCounts = {
        special: 0,
        regular: 0,
        cancel: 0,
        makeup: 0,
        holiday: 0,
        topik: 0
      }
      
      // 이벤트 유형별 분류
      validEvents.forEach(event => {
        if (event.type === 'holiday' || event.event_type === 'holiday') {
          eventTypeCounts.holiday++
        } else if (event.type === 'cancel' || event.event_type === 'cancel') {
          eventTypeCounts.cancel++
        } else if (event.type === 'makeup' || event.event_type === 'makeup') {
          eventTypeCounts.makeup++
        } else if (event.is_special_lecture === 1 || event.type === 'special' || event.event_type === 'special') {
          eventTypeCounts.special++
        } else if (event.is_foreigner_target === 1 || event.type === 'topik' || event.event_type === 'topik' || 
                  (event.level && event.level.includes('TOPIK'))) {
          eventTypeCounts.topik++
        } else {
          eventTypeCounts.regular++
        }
      })
      
      console.log('📊 가져온 이벤트 유형별 개수:', eventTypeCounts)
      
      // 특강과 일반 수업 분리
      const specialEvents = validEvents.filter(event => 
        event.type === 'special' || 
        event.event_type === 'special' || 
        event.is_special_lecture === 1 || 
        event.is_special_lecture === true
      );
      
      const regularEvents = validEvents.filter(event => 
        !(event.type === 'special' || 
          event.event_type === 'special' || 
          event.is_special_lecture === 1 || 
          event.is_special_lecture === true)
      );
      
      console.log(`🔢 이벤트 분류: 특강 ${specialEvents.length}개, 일반 ${regularEvents.length}개`);
      
      // 이벤트 데이터 가공 후 상태 업데이트
      const processedEvents = processEvents(validEvents)
      events.value = processedEvents
      
      // 공휴일 데이터 유효성 검사
      if (data.holidays && Array.isArray(data.holidays)) {
        // 공휴일 데이터를 이벤트 형식으로 변환하여 추가
        const holidayEvents = data.holidays.map(holiday => {
          const holidayDate = typeof holiday === 'string' ? holiday : holiday.date
          const holidayId = `holiday-${holidayDate}`
          
          return {
            id: holidayId,
            title: holiday.name || '공휴일',
            subject_name: holiday.name || '공휴일',
            type: 'holiday',
            event_type: 'holiday',
            date: holidayDate,
            event_date: holidayDate,
            start_period: 1,
            end_period: 9, // 공휴일은 전일 적용
            isFullDay: true
          }
        })
        
        // 공휴일 이벤트를 기존 이벤트 목록에 추가
        events.value = [...processedEvents, ...holidayEvents]
        data.events = events.value
      }
      
      // 추가: API 응답에서 특강 확인
      console.log('✨ API 응답에서 특강 확인:', data.events.filter(e => 
        e.event_type === 'special' || 
        e.is_special_lecture === 1 || 
        e.is_special_lecture === true
      ));
      
      // 별도 캐시 - 특강만 캐싱
      if (specialEvents.length > 0) {
        const specialData = {
          ...data,
          events: specialEvents,
          _special_only: true
        };
        setCache(specialLectureCacheKey, specialData, 30 * 60 * 1000); // 30분 유효
        console.log(`💾 특강 전용 캐시 저장: ${specialEvents.length}개 (키: ${specialLectureCacheKey})`);
      }
      
      // 별도 캐시 - 일반 수업만 캐싱
      if (regularEvents.length > 0) {
        const regularData = {
          ...data,
          events: regularEvents,
          _regular_only: true
        };
        setCache(regularCacheKey, regularData, 30 * 60 * 1000); // 30분 유효
        console.log(`💾 일반 수업 전용 캐시 저장: ${regularEvents.length}개 (키: ${regularCacheKey})`);
      }
      
      // 추가: 처리 후 events.value에 특강 확인
      console.log('✨ 최종 이벤트 목록:', events.value);
      console.log('📌 특강 포함 여부 확인:', events.value.filter(e => 
        e.type === CLASS_TYPES.SPECIAL || 
        e.event_type === CLASS_TYPES.SPECIAL || 
        e.is_special_lecture === 1 || 
        e.is_special_lecture === true
      ));
      
      return data
    } catch (err) {
      console.error('❌ 주간 이벤트 로드 실패:', err)
      
      // 상세 에러 정보 기록
      if (err.response) {
        console.error('서버 응답:', {
          status: err.response.status,
          data: err.response.data,
          url: err.response.config?.url,
          params: err.response.config?.params
        })
        
        // 특정 서버 오류 메시지 처리
        const errorMsg = err.response.data?.error || err.message || ''
        
        // localeCompare 관련 오류 처리
        if (errorMsg.includes('localeCompare') || 
            errorMsg.includes('Cannot read properties of undefined') ||
            errorMsg.includes('null') ||
            errorMsg.includes('sort')) {
          console.warn('🔧 서버 정렬 오류 발생: 클라이언트에서 대응합니다')
          
          // 빈 데이터로 응답하고 다음 요청에서 재시도
          const fallbackData = { events: [] }
          events.value = []
          
          // 캐시 무효화 (다음 요청에서 다시 시도)
          setCache(regularCacheKey, null, 10 * 1000) // 10초 후 만료
          setCache(specialLectureCacheKey, null, 10 * 1000) // 특강 캐시도 무효화
          
          return fallbackData
        }
        
        // 토큰 만료 오류 처리
        if (err.response.status === 401) {
          console.warn('인증 토큰이 만료되었습니다. 재로그인이 필요합니다.')
          authStore.logout()
        }
        
        // 서버 오류 (500) 처리
        if (err.response.status >= 500) {
          console.error('서버 내부 오류가 발생했습니다. 개발팀에 문의하세요.')
          // 로컬 폴백 데이터로 응답
          return { events: [] }
        }
      } else if (err.request) {
        // 요청은 보냈으나 응답이 없는 경우
        console.error('서버 응답 없음:', err.request)
        console.warn('네트워크 연결을 확인하세요.')
      } else {
        // 요청 자체가 설정되지 않은 경우
        console.error('요청 오류:', err.message)
      }
      
      error.value = err.message || 'Failed to fetch weekly events'
      return { events: [] }
    } finally {
      loading.value = false
    }
  }

  /**
   * 이벤트 데이터 전처리 함수
   * @param {Array} eventList - 원본 이벤트 배열
   * @returns {Array} - 처리된 이벤트 배열
   */
  function processEvents(eventList = []) {
    if (!eventList || eventList.length === 0) {
      console.log('ℹ️ 처리할 이벤트가 없습니다.')
      return []
    }
    
    console.log(`🔄 이벤트 처리 시작: ${eventList.length}개`)
    
    // 특강 개수 확인
    const specialLectures = eventList.filter(event => 
      event && (
        event.is_special_lecture === 1 || 
        event.is_special_lecture === true || 
        event.is_special_lecture === '1' ||
        event.type === 'special' || 
        event.event_type === 'special'
      )
    )
    
    console.log(`✨ 특강 ${specialLectures.length}개 발견됨`)
    
    // null 제거 및 데이터 정규화
    const processedEvents = eventList
      .filter(event => {
        if (!event) {
          console.warn('⚠️ null/undefined 이벤트 필터링됨')
          return false
        }
        return true
      })
      .map(event => {
        // 이벤트 기본 정보
        const normalized = {
          ...event,
          id: event.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: event.subject_name || event.title || '제목 없음',
          description: event.description || '',
          start_period: parseInt(event.start_period || 1),
          end_period: parseInt(event.end_period || event.start_period || 1)
        }
        
        // 날짜 정규화 (ISO 문자열로 변환)
        if (event.date) {
          normalized.date = typeof event.date === 'string' ? event.date : new Date(event.date).toISOString().split('T')[0]
        } else if (event.event_date) {
          normalized.date = typeof event.event_date === 'string' ? event.event_date : new Date(event.event_date).toISOString().split('T')[0]
        }
        
        // 레벨 정규화
        if (event.level) {
          normalized.level = Array.isArray(event.level) ? event.level.join(',') : String(event.level)
        }
        
        // 이벤트 색상 설정
        normalized.color = getEventColor(event)
        
        return normalized
      })
    
    console.log(`✅ 이벤트 처리 완료: ${processedEvents.length}개`)
    return processedEvents
  }

  /**
   * 이벤트 유형에 따라 색상을 반환하는 함수
   */
  function getEventColor(event) {
    if (!event) return '#6B7280' // 기본 회색
    
    // 이벤트 유형 확인
    const isHoliday = 
      event.type === 'holiday' || 
      event.event_type === 'holiday'
    
    const isCancelled = 
      event.type === 'cancel' || 
      event.event_type === 'cancel' || 
      event.status === 'canceled'
    
    const isMakeup = 
      event.type === 'makeup' || 
      event.event_type === 'makeup'
    
    const isSpecialLecture = 
      event.is_special_lecture === 1 || 
      event.is_special_lecture === true || 
      event.is_special_lecture === '1' ||
      event.type === 'special' || 
      event.event_type === 'special'
    
    // 유형별 색상 반환
    if (isHoliday) return '#EF4444' // 공휴일 - 빨간색
    if (isCancelled) return '#F97316' // 휴강 - 주황색
    if (isMakeup) return '#22C55E' // 보강 - 초록색
    if (isSpecialLecture) return '#8B5CF6' // 특강 - 보라색
    
    // 기본 색상 (정규 수업)
    return '#3B82F6' // 파란색
  }

  // 통합 일정 등록 폼 열기
  function openUnifiedScheduleForm(options = {}) {
    const {
      isEdit = false,
      modalData = null,
      showTypeSelector = true,
      allowCancel = true,
      eventType = 'regular',
      timetableData = null,
      allEvents = null  // 여러 이벤트가 있는 경우 전체 목록
    } = options;
    
    console.log(`🔄 통합 스케줄 폼 열기: ${isEdit ? '수정' : '등록'} 모드, 타입: ${eventType}`);
    
    // 모달 데이터 설정
    unifiedModalData.value = {
      isEdit,
      modalData,
      showTypeSelector,
      allowCancel,
      eventType,
      timetableData,
      allEvents
    };
    
    // 모달 표시
    showUnifiedModal.value = true;
    
    // 모달 타입 설정 (이전 모달 처리 방식과의 호환성 유지)
    modalType.value = 'unified';
    showModal.value = true;
  }

  // 통합 셀 액션 핸들러
  function handleCellAction(data) {
    const { dayIndex, timeIndex, hasEvents, events, action, event } = data;
    
    // 날짜 문자열로 변환 (1: 월요일, 2: 화요일, ...)
    const dayNumber = dayIndex + 1;
    const dayName = ['mon', 'tue', 'wed', 'thu', 'fri'][dayIndex];
    
    console.log(`🖱️ 셀 액션: ${dayName} ${timeIndex}교시 (${action || 'click'}), 이벤트 ${hasEvents ? events.length : 0}개`);
    
    // 1. 이벤트 수정 (특정 이벤트 선택 시)
    if (action === 'edit' && event) {
      openUnifiedScheduleForm({
        isEdit: true,
        modalData: event,
        eventType: determineEventType(event),
        showTypeSelector: false
      });
      return;
    }
    
    // 2. 이벤트가 있는 셀 일반 클릭
    if (hasEvents && events.length > 0) {
      if (events.length === 1) {
        // 단일 이벤트 - 바로 수정 모드
        openUnifiedScheduleForm({
          isEdit: true,
          modalData: events[0],
          eventType: determineEventType(events[0]),
          showTypeSelector: false
        });
      } else {
        // 복수 이벤트 - 첫 번째 이벤트로 수정 모드 (향후: 이벤트 선택 UI 구현 가능)
        openUnifiedScheduleForm({
          isEdit: true,
          modalData: events[0],
          eventType: determineEventType(events[0]),
          showTypeSelector: false,
          allEvents: events // 필요시 전체 이벤트 목록 전달
        });
      }
      return;
    }
    
    // 3. 빈 셀 클릭 - 새 이벤트 등록
    // 기본값: 학년 필터링, 정규 수업으로 초기화
    openUnifiedScheduleForm({
      isEdit: false,
      modalData: {
        type: 'regular',
        day: dayNumber,
        start_period: timeIndex,
        end_period: timeIndex,
        grade: currentGrade.value,
        level: currentLevel.value,
        professor_name: '',
        room: '',
        semester: getCurrentSemester()
      },
      eventType: 'regular',
      showTypeSelector: true
    });
  }
  
  // 이벤트 타입 결정 (이벤트 객체에서 type 추출)
  function determineEventType(event) {
    if (!event) return 'regular';
    
    if (event.type === 'holiday' || event.event_type === 'holiday') {
      return 'holiday';
    }
    
    if (event.type === 'cancel' || event.event_type === 'cancel') {
      return 'cancel';
    }
    
    if (event.type === 'makeup' || event.event_type === 'makeup') {
      return 'makeup';
    }
    
    if (event.is_special_lecture === 1 || 
        event.is_special_lecture === '1' ||
        event.type === 'special' || 
        event.event_type === 'special') {
      return 'special';
    }
    
    if (event.is_special_lecture === 2 || 
        event.is_special_lecture === '2' ||
        event.is_foreigner_target === 1 || 
        event.is_foreigner_target === true || 
        event.is_foreigner_target === '1' ||
        event.type === 'topik' || 
        event.event_type === 'topik' ||
        (event.level && String(event.level).includes('TOPIK'))) {
      return 'topik';
    }
    
    return 'regular';
  }

  return {
    // State
    events,
    regulars,
    specials,
    loading,
    error,
    currentGrade,
    currentLevel,
    currentWeek,
    studentType,
    dateRange,
    filters,
    
    // Modal states
    showingRegisterModal,
    showingDetailModal,
    registerModalData,
    detailModalData,
    modalType,
    modalData,
    showModal,
    showUnifiedModal,
    unifiedModalData,
    
    // Modal actions
    showRegisterModal,
    hideRegisterModal,
    showDetailModal,
    hideDetailModal,
    showEditModal,
    closeModal,

    // Getters
    filteredEvents,
    hasOverlappingEvents,
    combinedData,
    
    // Actions
    setFilters,
    setDateRange,
    setCurrentGrade,
    setCurrentWeek,
    setLevel,
    setStudentType,
    fetchWeeklyEvents,
    showCancelClassModal,
    showMakeupClassModal,
    registerCancellation,
    registerMakeup,
    createTimetableEntry,
    createTimetableEvent,
    getWeekDate,
    getCurrentSemester,
    processScheduleAction,
    registerScheduleItem,
    validateRequiredFields,
    invalidateEventCache,
    sendLineNotification,
    openUnifiedScheduleForm,
    handleCellAction,
    determineEventType,
    formatDate,
    isDateInWeekRange
  }
}) 