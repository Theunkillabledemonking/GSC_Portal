export const CLASS_TYPES = {
  REGULAR: 'regular',
  SPECIAL: 'special',
  CANCEL: 'cancel',
  MAKEUP: 'makeup',
  HOLIDAY: 'holiday',
  EVENT: 'event'
}

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

export const EVENT_STYLES = {
  [CLASS_TYPES.REGULAR]: {
    icon: '📚',
    iconClass: '',
    label: '정규',
    color: '#3b82f6',
    bgColor: '#f0f9ff'
  },
  [CLASS_TYPES.SPECIAL]: {
    icon: '⭐',
    iconClass: 'warning',
    label: '특강',
    color: '#f59e0b',
    bgColor: '#fef3c7'
  },
  [CLASS_TYPES.CANCEL]: {
    icon: '⛔',
    iconClass: 'error',
    label: '휴강',
    color: '#ef4444',
    bgColor: '#fee2e2'
  },
  [CLASS_TYPES.MAKEUP]: {
    icon: '🔄',
    iconClass: 'success',
    label: '보강',
    color: '#10b981',
    bgColor: '#dcfce7'
  },
  [CLASS_TYPES.HOLIDAY]: {
    icon: '🏖️',
    iconClass: 'error',
    label: '공휴일',
    color: '#ef4444',
    bgColor: '#fee2e2'
  },
  [CLASS_TYPES.EVENT]: {
    icon: '🎈',
    iconClass: '',
    label: '행사',
    color: '#8b5cf6',
    bgColor: '#f3e8ff'
  }
}

export const TARGET_TYPES = [
  { value: 'all', label: '전체' },
  { value: 'korean', label: '한국인' },
  { value: 'foreigner', label: '외국인' }
]

export const GRADES = [1, 2, 3]

export const LEVELS = [
  'N1', 'N2', 'N3',
  'TOPIK4', 'TOPIK6'
]

export const GROUP_LEVELS = ['A', 'B', 'C', 'ALL']

export const SEMESTERS = [
  { value: 'spring', label: '봄학기' },
  { value: 'summer', label: '여름학기' },
  { value: 'fall', label: '가을학기' },
  { value: 'winter', label: '겨울학기' }
] 