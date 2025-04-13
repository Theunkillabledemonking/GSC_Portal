// 🎓 학년 정보
export const GRADES = [1, 2, 3]

export const DAYS_OF_WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

// 👥 대상자 구분
export const TARGET_TYPES = [
  { value: 'all', label: '전체' },
  { value: 'korean', label: '한국인' },
  { value: 'foreigner', label: 'TOPIK' }
]

// 📚 수업 유형 및 우선순위
export const CLASS_TYPES = {
  REGULAR: 'regular',    // 정규 수업
  SPECIAL: 'special',    // 특강
  CANCEL: 'cancel',      // 휴강
  MAKEUP: 'makeup',      // 보강
  HOLIDAY: 'holiday',    // 공휴일
  EVENT: 'event',        // 행사
}

// 🎯 레벨 정보
export const LEVELS = [
  { value: 'N1', label: 'JLPT N1' },
  { value: 'N2', label: 'JLPT N2' },
  { value: 'N3', label: 'JLPT N3' }
]

// 📅 학기 정보
export const SEMESTERS = [
  { value: 'spring', label: '1학기' },
  { value: 'summer', label: '여름학기' },
  { value: 'fall', label: '2학기' },
  { value: 'winter', label: '겨울학기' }
]

// ⏰ 교시 정보
export const PERIODS = [
  { period: 1, startTime: '09:00', endTime: '09:50' },
  { period: 2, startTime: '10:00', endTime: '10:50' },
  { period: 3, startTime: '11:00', endTime: '11:50' },
  { period: 4, startTime: '12:00', endTime: '12:50' },
  { period: 5, startTime: '13:00', endTime: '13:50' },
  { period: 6, startTime: '14:00', endTime: '14:50' },
  { period: 7, startTime: '15:00', endTime: '15:50' },
  { period: 8, startTime: '16:00', endTime: '16:50' },
  { period: 9, startTime: '17:00', endTime: '17:50' },
  { period: 10, startTime: '18:00', endTime: '18:50' },
  { period: 11, startTime: '19:00', endTime: '19:50' },
  { period: 12, startTime: '20:00', endTime: '20:50' }
]

// 🎨 이벤트 타입별 스타일
export const CLASS_STYLES = {
  [CLASS_TYPES.REGULAR]: {
    backgroundColor: '#ffffff',
    borderColor: '#3b82f6',
    textColor: '#1f2937',
    icon: '📘',
    label: '정규',
    priority: 5
  },
  [CLASS_TYPES.SPECIAL]: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    textColor: '#92400e',
    icon: '⭐',
    label: '특강',
    priority: 4
  },
  [CLASS_TYPES.MAKEUP]: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    textColor: '#065f46',
    icon: '✅',
    label: '보강',
    priority: 3
  },
  [CLASS_TYPES.CANCEL]: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    textColor: '#991b1b',
    icon: '❌',
    label: '휴강',
    priority: 2
  },
  [CLASS_TYPES.HOLIDAY]: {
    backgroundColor: '#fecaca',
    borderColor: '#ef4444',
    textColor: '#991b1b',
    icon: '🎌',
    label: '공휴일',
    priority: 1
  },
  [CLASS_TYPES.EVENT]: {
    backgroundColor: '#ede9fe',
    borderColor: '#8b5cf6',
    textColor: '#5b21b6',
    icon: '🎯',
    label: '행사',
    priority: 6
  }
}

// 📱 LINE 메시지 템플릿
export const LINE_MESSAGE_TEMPLATES = {
  [CLASS_TYPES.CANCEL]: (data) => `
[휴강 안내]
과목: ${data.subject_name}
날짜: ${data.date}
시간: ${data.start_time}~${data.end_time}
자세히 보기: ${data.url}
  `.trim(),
  
  [CLASS_TYPES.MAKEUP]: (data) => `
[보강 안내]
과목: ${data.subject_name}
날짜: ${data.date}
시간: ${data.start_time}~${data.end_time}
강의실: ${data.room}
자세히 보기: ${data.url}
  `.trim(),
  
  [CLASS_TYPES.SPECIAL]: (data) => `
[특강 안내]
과목: ${data.subject_name}
대상: ${data.level}
날짜: ${data.date}
시간: ${data.start_time}~${data.end_time}
강의실: ${data.room}
자세히 보기: ${data.url}
  `.trim()
}

LINE_MESSAGE_TEMPLATES.notice = (data) => `
[📢 공지사항]
과목: ${data.subject_name || '전체'}
제목: ${data.title}
작성자: ${data.author}
내용: ${data.content.slice(0, 80)}...
▶️ 자세히 보기: ${data.url}
`.trim();

// 👥 대상자 구분
export const STUDENT_TYPES = {
  ALL: 'all',
  KOREAN: 'korean',
  FOREIGN: 'foreign'
}

// 📚 과목 유형
export const SUBJECT_TYPES = {
  KOREAN_REGULAR: {
    GRAMMAR: 'grammar',
    CONVERSATION: 'conversation'
  },
  FOREIGN_REGULAR: {
    TOPIK4: 'topik4',
    TOPIK6: 'topik6'
  },
  SPECIAL: {
    JLPT_N1: 'jlpt_n1',
    JLPT_N2: 'jlpt_n2',
    JLPT_N3: 'jlpt_n3'
  }
}

// ⚙️ 시간표 표시 설정
export const DISPLAY_CONFIG = {
  CELL_MIN_WIDTH: 120,  // 셀 최소 너비
  CELL_HEIGHT: 60,      // 셀 높이
  HEADER_HEIGHT: 40,    // 헤더 높이
  MAX_VISIBLE_EVENTS: 2 // 셀당 최대 표시 이벤트 수
}

// ⏰ 시간 범위 설정
export const TIME_PERIODS = {
  START: 1,             // 시작 교시
  END: 12              // 종료 교시
} 