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
    timetableData: null
  })
  // Getters
  const filteredEvents = computed(() => {
    // 선택된 학년이 없으면 빈 배열 반환
    if (!currentGrade.value && !currentLevel.value) {
      console.log('🚨 선택된 학년/레벨이 없습니다.');
      return [];
    }

    // 필터링을 위한 환경 변수
    const currentGradeInt = parseInt(currentGrade.value, 10) || 0;
    const eventYearFilter = currentGradeInt > 0 ? currentGradeInt : null;
    
    // 현재 학기와 년도 가져오기
    const currentYear = new Date().getFullYear();
    const currentSemesterName = getCurrentSemester();
    
    // 학기 범위 가져오기 - 년도는 문자열로 전달
    const semesterRange = getSemesterRange(String(currentYear), currentSemesterName);
    
    console.log('🔍 필터링 시작...');
    console.log(`  📆 현재 학기 범위: ${semesterRange.start_date} - ${semesterRange.end_date}`);
    console.log(`  👥 선택된 학년: ${currentGradeInt || 'ALL'}, 레벨: ${currentLevel.value || 'ALL'}`);
    
    // 필터링 결과를 위한 카운터 초기화
    let regularClassesCount = 0;
    let specialLecturesCount = 0;
    let topikCount = 0;
    let canceledCount = 0;
    let makeupCount = 0;
    let holidaysCount = 0;
    
    // 이벤트 필터링
    const filtered = events.value.filter((event) => {
      if (!event) return false;
      
      // 이벤트 학년 추출 - 학생과 매칭시키는데 사용
      const eventYear = 
        typeof event.grade === 'number' ? event.grade : 
        typeof event.grade === 'string' ? parseInt(event.grade, 10) : 
        typeof event.year === 'number' ? event.year : 
        typeof event.year === 'string' ? parseInt(event.year, 10) : null;
      
      // 특강 여부
      const isSpecialLecture = 
        event.is_special_lecture === 1 || 
        event.is_special_lecture === true || 
        event.is_special_lecture === '1' ||
        event.type === 'special' || 
        event.event_type === 'special';
      
      // 공휴일 여부
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
        (event.is_foreigner_target === 1 || 
         event.is_foreigner_target === true || 
         event.is_foreigner_target === '1') ||
        (event.level && String(event.level).includes('TOPIK')) ||
        event.type === 'topik' || 
        event.event_type === 'topik';
      
      // 1. 공휴일 - 모든 학년에 표시
      if (isHoliday) {
        holidaysCount++;
        console.log(`🏖️ 공휴일 포함됨: ${event.title || event.name || '공휴일'}, 날짜: ${event.date || event.event_date}`);
        return true;
      }
      
      // 2. 휴강 이벤트 
      if (isCancellation) {
        // 휴강 대상 수업의 학년 정보를 확인
        const relatedGrade = event.grade || (event.timetable_id ? event.timetable?.grade : null);
        
        // 휴강이 속한 원 수업의 학년과 현재 선택된 학년이 다르면 필터링
        if (relatedGrade && currentGradeInt && parseInt(relatedGrade, 10) !== currentGradeInt) {
          console.log(`🚫 학년 불일치로 휴강 필터링 제외: ${event.subject_name || event.title}, ID: ${event.id}, 휴강학년: ${relatedGrade}, 현재학년: ${currentGradeInt}`);
          return false;
        }
        
        canceledCount++;
        console.log(`🛑 휴강 이벤트 포함됨: ${event.subject_name || event.title}, 날짜: ${event.date || event.event_date}, ID: ${event.id}, 학년: ${relatedGrade || '미지정'}`);
        return true;
      }
      
      // 3. 보강 이벤트 
      if (isMakeup) {
        // 보강 대상 수업의 학년 정보를 확인
        const relatedGrade = event.grade || (event.timetable_id ? event.timetable?.grade : null);
        
        // 보강이 속한 원 수업의 학년과 현재 선택된 학년이 다르면 필터링
        if (relatedGrade && currentGradeInt && parseInt(relatedGrade, 10) !== currentGradeInt) {
          console.log(`🚫 학년 불일치로 보강 필터링 제외: ${event.subject_name || event.title}, ID: ${event.id}, 보강학년: ${relatedGrade}, 현재학년: ${currentGradeInt}`);
          return false;
        }
        
        makeupCount++;
        console.log(`🔄 보강 이벤트 포함됨: ${event.subject_name || event.title}, 날짜: ${event.date || event.event_date}, ID: ${event.id}, 학년: ${relatedGrade || '미지정'}`);
        return true;
      }
      
      // 4. 특강 - 모든 학년에 표시 (학기 범위 및 레벨 필터링만 적용)
      if (isSpecialLecture) {
        // 학기 범위 내 확인
        const eventDate = event.date ? new Date(event.date) : null;
        const eventStartDate = event.start_date ? new Date(event.start_date) : null;
        const effectiveDate = eventDate || eventStartDate;
        
        if (effectiveDate && (effectiveDate < new Date(semesterRange.start_date) || effectiveDate > new Date(semesterRange.end_date))) {
          console.log(`⏱️ 특강 "${event.subject_name || event.title}" (${effectiveDate.toISOString().split('T')[0]})이(가) 현재 학기 범위를 벗어나 필터링됨`);
          return false;
        }
        
        // 레벨 필터링 확인
        if (currentLevel.value && event.level) {
          const eventLevel = String(event.level).toLowerCase();
          const userLevel = String(currentLevel.value).toLowerCase();
          
          if (eventLevel !== userLevel && !eventLevel.includes(userLevel)) {
            console.log(`🔍 레벨 불일치로 특강 필터링 제외: ${event.subject_name || event.title} (${eventLevel}, 현재 ${userLevel})`);
            return false;
          }
        }
        
        specialLecturesCount++;
        console.log(`✨ 특강 이벤트 포함됨: ${event.subject_name || event.title}, 레벨: ${event.level || 'N/A'}, ID: ${event.id}`);
        return true;
      }
      
      // 5. TOPIK 수업 - 모든 학년에 표시 (레벨 필터링만 적용)
      if (isTopikClass) {
        // TOPIK은 레벨 필터링만 적용
        if (currentLevel.value && event.level) {
          const eventLevel = String(event.level).toLowerCase();
          const userLevel = String(currentLevel.value).toLowerCase();
          
          if (eventLevel !== userLevel && !eventLevel.includes(userLevel)) {
            console.log(`🔍 레벨 불일치로 TOPIK 수업 필터링 제외: ${event.subject_name || event.title} (${eventLevel}, 현재 ${userLevel})`);
            return false;
          }
        }
        
        topikCount++;
        console.log(`🌏 TOPIK 수업 포함됨: ${event.subject_name || event.title}, 레벨: ${event.level || 'N/A'}, ID: ${event.id}`);
        return true;
      }
      
      // 6. 정규 수업 - 학년(year) 기준으로 엄격하게 필터링
      
      // 이벤트에 학년 정보가 없거나 현재 선택된 학년과 일치하지 않으면 제외
      if (eventYear === null || eventYear !== currentGradeInt) {
        console.log(`🚫 학년 불일치로 제외: ${event.subject_name || event.title || '이름 없음'} (이벤트 학년: ${eventYear !== null ? eventYear : 'NULL'}, 현재 학년: ${currentGradeInt})`);
        return false;
      }
      
      // 정규 수업
      regularClassesCount++;
      console.log(`📚 정규 수업 포함됨 (학년 일치): ${event.subject_name || event.title}, 학년: ${eventYear}, ID: ${event.id}`);
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
      } else if (event.is_foreigner_target === 1 || event.type === 'topik' || event.event_type === 'topik' || 
                 (event.level && event.level.includes('TOPIK'))) {
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
    currentWeek.value = week
    console.log(`🔄 현재 주 설정: ${week}`)
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
      const authStore = useAuthStore();
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
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 일요일이면 전 주 월요일로
    const monday = new Date(d.setDate(diff))
    return monday.toISOString().split('T')[0]
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
      timetableData: null
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
  function openUnifiedScheduleForm(options) {
    console.log('📝 통합 일정 등록 폼 열기:', options)
    
    // Close any open modals first
    showModal.value = false
    showingDetailModal.value = false
    showingRegisterModal.value = false
    
    // Set up options
    unifiedModalData.value = {
      isEdit: options.isEdit || false,
      modalData: options.modalData || {},
      showTypeSelector: options.showTypeSelector !== undefined ? options.showTypeSelector : true,
      allowCancel: options.allowCancel !== undefined ? options.allowCancel : true,
      eventType: options.eventType || 'regular',
      timetableData: options.timetableData || null
    }
    
    // Set modal state
    modalType.value = 'unified'
    
    // Open the unified modal
    showUnifiedModal.value = true
    
    // Log the state for debugging
    console.log('📊 Modal state after opening:', { 
      showUnifiedModal: showUnifiedModal.value,
      modalType: modalType.value,
      data: unifiedModalData.value
    })
  }

  // 추가: 셀 액션 통합 처리 함수
  function handleCellAction(data) {
    console.log('🔄 셀 액션 처리:', data)
    
    const { dayIndex, timeIndex, hasEvents, events, action, event } = data
    const day = ['mon', 'tue', 'wed', 'thu', 'fri'][dayIndex]
    
    if (action === 'edit' && event) {
      // 수정 버튼 클릭시 처리
      openUnifiedScheduleForm({
        isEdit: true,
        modalData: {
          ...event,
          type: event.type || event.event_type || 'regular',
          timetable_id: event.timetable_id || event.id,
          professor_name: event.professor_name || event.inherited_professor_name,
          room: event.room || event.inherited_room,
          subject_id: event.subject_id
        },
        showTypeSelector: false,
        allowCancel: true,
        eventType: event.type || event.event_type || 'regular',
        timetableData: event
      })
    } else if (hasEvents && events.length > 0) {
      // 일반 셀 클릭시 이벤트가 있으면 상세 보기
      showDetailModal(events)
    } else {
      // 빈 셀 클릭시 새 이벤트 등록
      const dayCode = day || `day${dayIndex+1}`
      showCancelClassModal(dayCode, timeIndex)
    }
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
    handleCellAction
  }
}) 