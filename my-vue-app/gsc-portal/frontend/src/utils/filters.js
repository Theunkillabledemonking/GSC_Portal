import { STUDENT_TYPES, SUBJECT_TYPES } from '@/constants/timetable'

export function filterByGrade(events, grade) {
  if (!grade) return events
  return events.filter(event => {
    // 특강은 학년 필터링에서 제외 (N1, N2, N3 레벨의 특강은 모든 학년에 표시)
    if (event.type === 'special' || event.event_type === 'special' || 
        event.is_special_lecture === 1 || event.is_special_lecture === true) {
      return true;
    }
    
    // 정규 수업은 학년으로 필터링
    return event.grade === grade || event.year === grade;
  })
}

export function filterByStudentType(events, studentType) {
  if (studentType === STUDENT_TYPES.ALL) return events
  return events.filter(event => {
    if (studentType === STUDENT_TYPES.KOREAN) {
      return event.subjectType in SUBJECT_TYPES.KOREAN_REGULAR ||
             event.subjectType in SUBJECT_TYPES.SPECIAL
    }
    if (studentType === STUDENT_TYPES.FOREIGN) {
      return event.subjectType in SUBJECT_TYPES.FOREIGN_REGULAR
    }
    return true
  })
}

export function filterByDateRange(events, startDate, endDate) {
  return events.filter(event => {
    const eventDate = new Date(event.date)
    return eventDate >= startDate && eventDate <= endDate
  })
}

export function filterBySubjectType(events, subjectType) {
  if (!subjectType) return events
  return events.filter(event => event.subjectType === subjectType)
}

export function applyFilters(events, filters) {
  let filteredEvents = [...events]
  
  if (filters.grade) {
    filteredEvents = filterByGrade(filteredEvents, filters.grade)
  }
  
  if (filters.studentType) {
    filteredEvents = filterByStudentType(filteredEvents, filters.studentType)
  }
  
  if (filters.startDate && filters.endDate) {
    filteredEvents = filterByDateRange(filteredEvents, filters.startDate, filters.endDate)
  }
  
  if (filters.subjectType) {
    filteredEvents = filterBySubjectType(filteredEvents, filters.subjectType)
  }
  
  return filteredEvents
} 