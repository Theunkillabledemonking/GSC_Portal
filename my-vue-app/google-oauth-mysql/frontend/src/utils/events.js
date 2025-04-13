import { CLASS_TYPES, PERIODS } from '@/constants/timetable'

/**
 * 이벤트 시간 유효성 검사
 * @param {number} startPeriod - 시작 교시
 * @param {number} endPeriod - 종료 교시
 * @returns {boolean} - 유효한 시간 범위인지 여부
 */
export function validateEventTimes(startPeriod, endPeriod) {
  // 숫자가 아니면 먼저 변환 시도
  const start = typeof startPeriod === 'string' ? parseInt(startPeriod, 10) : startPeriod
  const end = typeof endPeriod === 'string' ? parseInt(endPeriod, 10) : endPeriod
  
  // 숫자로 변환할 수 없는 경우
  if (isNaN(start) || isNaN(end)) return false
  
  // 시작 교시가 종료 교시보다 크면 잘못된 범위
  if (start > end) return false
  
  // 음수이거나 소수점이면 잘못된 값
  if (
    start < 1 || 
    end < 1 || 
    !Number.isInteger(start) || 
    !Number.isInteger(end)
  ) {
    return false
  }
  
  // 교시 범위 검증 (1~12)
  if (start > 12 || end > 12) {
    return false
  }
  
  return true
}

/**
 * 이벤트 간 중복 체크
 * @param {Object} event1 - 첫 번째 이벤트
 * @param {Object} event2 - 두 번째 이벤트
 * @returns {boolean} - 중복 여부
 */
export function isOverlapping(event1, event2) {
  // 다른 날짜/요일이면 중복 아님
  if (event1.day !== event2.day) return false
  
  // 날짜 기반 이벤트의 경우
  if (event1.date && event2.date && event1.date !== event2.date) {
    return false
  }
  
  const start1 = parseInt(event1.start_period) || 1
  const end1 = parseInt(event1.end_period) || start1
  const start2 = parseInt(event2.start_period) || 1
  const end2 = parseInt(event2.end_period) || start2
  
  // 시간이 겹치는지 확인
  return (
    (start1 <= end2 && end1 >= start2) || 
    (start2 <= end1 && end2 >= start1)
  )
}

/**
 * 이벤트 데이터 정규화 및 유효성 검사
 * @param {Object} event - 원본 이벤트 데이터
 * @returns {Object} - 정규화된 이벤트 데이터
 */
export function normalizeEvent(event) {
  if (!event) return null
  
  // 타입 정규화
  const eventType = event.type || event.event_type || 'regular'
  
  // 날짜 정규화
  let eventDate = event.date || event.event_date || null
  if (eventDate && typeof eventDate === 'string') {
    // 날짜 형식 유효성 확인 (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}/.test(eventDate)) {
      console.warn(`잘못된 날짜 형식: ${eventDate}, 이벤트 ID: ${event.id}`)
      eventDate = null
    }
  }
  
  // 교시 정규화
  const startPeriod = parseInt(event.start_period) || 1
  const endPeriod = parseInt(event.end_period) || startPeriod
  
  // 유효하지 않은 교시 범위 수정
  const validatedEndPeriod = startPeriod > endPeriod ? startPeriod : endPeriod
  
  return {
    ...event,
    // 필수 텍스트 필드
    id: event.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    subject_name: event.subject_name || event.title || '미지정 과목',
    title: event.title || event.subject_name || '미지정 이벤트',
    professor: event.professor || '미지정',
    room: event.room || '',
    
    // 타입 관련 필드 (양쪽 필드 모두 설정)
    type: eventType,
    event_type: eventType,
    
    // 날짜 관련 필드 (양쪽 필드 모두 설정)
    date: eventDate,
    event_date: eventDate,
    
    // 기간 관련 필드
    start_period: startPeriod,
    end_period: validatedEndPeriod,
    
    // 메타데이터
    normalized: true
  }
}

/**
 * 이벤트 일괄 가공 처리
 * @param {Array} events - 이벤트 배열
 * @returns {Array} - 가공된 이벤트 배열
 */
export function processEvents(events) {
  if (!events || !Array.isArray(events)) return []
  
  // null/undefined 제거 후 정규화
  return events
    .filter(event => !!event)
    .map(event => normalizeEvent(event))
    .filter(event => !!event) // 정규화 실패한 항목 제거
}

/**
 * 이벤트를 요일별로 그룹화
 * @param {Array} events - 이벤트 배열
 * @returns {Object} - 요일별 이벤트 목록
 */
export function groupEventsByDay(events) {
  const days = {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: []
  }
  
  if (!events || !Array.isArray(events)) return days
  
  events.forEach(event => {
    if (!event) return
    
    // 날짜가 있는 이벤트 (날짜에서 요일 추출)
    if (event.date || event.event_date) {
      const date = new Date(event.date || event.event_date)
      if (isNaN(date.getTime())) {
        console.warn(`잘못된 날짜: ${event.date || event.event_date}, 이벤트 ID: ${event.id}`)
        return
      }
      
      const dayIdx = date.getDay() // 0: 일, 1: 월, 2: 화, ...
      const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
      
      if (dayIdx >= 0 && dayIdx <= 6) {
        days[dayKeys[dayIdx]].push(event)
      }
    } 
    // 요일 기반 이벤트 (day 필드 사용)
    else if (event.day) {
      // 요일 한글 -> 영문 변환
      const dayMap = { 
        '월': 'mon', '화': 'tue', '수': 'wed', '목': 'thu', '금': 'fri', 
        '토': 'sat', '일': 'sun'
      }
      
      const dayKey = dayMap[event.day] || event.day
      if (days[dayKey]) {
        days[dayKey].push(event)
      } else {
        console.warn(`잘못된 요일: ${event.day}, 이벤트 ID: ${event.id}`)
      }
    }
  })
  
  return days
}

/**
 * 공휴일 여부 확인
 * @param {Object} event - 이벤트 객체
 * @returns {boolean} - 공휴일 여부
 */
export function isHoliday(event) {
  if (!event) return false
  return event.type === 'holiday' || event.event_type === 'holiday'
}

/**
 * 휴강 여부 확인
 * @param {Object} event - 이벤트 객체
 * @returns {boolean} - 휴강 여부
 */
export function isCanceled(event) {
  if (!event) return false
  return (
    event.status === 'canceled' || 
    event.type === 'cancel' || 
    event.event_type === 'cancel'
  )
}

/**
 * 이벤트 표시 우선순위 가져오기
 * @param {Object} event - 이벤트 객체 
 * @returns {number} - 우선순위 값 (낮을수록 우선순위 높음)
 */
export function getEventPriority(event) {
  if (!event) return 999
  
  const EVENT_PRIORITIES = {
    holiday: 0,    // 최우선 (공휴일)
    cancel: 1,     // 휴강
    makeup: 2,     // 보강
    special: 3,    // 특강
    event: 4,      // 기타 이벤트
    regular: 5     // 정규 수업
  }
  
  const eventType = event.type || event.event_type || 'regular'
  return EVENT_PRIORITIES[eventType] ?? 999
}

export function getEventDuration(startPeriod, endPeriod) {
  return endPeriod - startPeriod + 1
}

export function formatEventTime(period) {
  const { startTime, endTime } = PERIODS[period - 1]
  return `${startTime}-${endTime}`
}

export function getEventStyle(type) {
  return CLASS_STYLES[type] || CLASS_STYLES[CLASS_TYPES.REGULAR]
}

export function calculateEventPosition(startPeriod) {
  const periodHeight = 60 // height of one period in pixels
  return (startPeriod - 1) * periodHeight
}

export function calculateEventHeight(startPeriod, endPeriod) {
  const periodHeight = 60 // height of one period in pixels
  return (endPeriod - startPeriod + 1) * periodHeight
} 