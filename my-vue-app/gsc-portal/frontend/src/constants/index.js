// Days
export * from './days'

// Timetable
export const CLASS_TYPES = {
  REGULAR: 'regular',
  SPECIAL: 'special',
  CANCEL: 'cancel',
  MAKEUP: 'makeup',
  HOLIDAY: 'holiday',
  EVENT: 'event'
}

export const EVENT_STYLES = {
  [CLASS_TYPES.REGULAR]: {
    icon: '📚',
    iconClass: 'regular-icon',
    label: '정규'
  },
  [CLASS_TYPES.SPECIAL]: {
    icon: '🌟',
    iconClass: 'special-icon',
    label: '특별'
  },
  [CLASS_TYPES.CANCEL]: {
    icon: '❌',
    iconClass: 'cancel-icon',
    label: '휴강'
  },
  [CLASS_TYPES.MAKEUP]: {
    icon: '🔄',
    iconClass: 'makeup-icon',
    label: '보강'
  },
  [CLASS_TYPES.HOLIDAY]: {
    icon: '🎉',
    iconClass: 'holiday-icon',
    label: '휴일'
  },
  [CLASS_TYPES.EVENT]: {
    icon: '📅',
    iconClass: 'event-icon',
    label: '이벤트'
  }
}

// Time periods
export const TIME_PERIODS = {
  START: 1,
  END: 10,
  DURATION: 50  // minutes
}

// Display settings
export const DISPLAY_CONFIG = {
  CELL_HEIGHT: 60,  // pixels
  CELL_MIN_WIDTH: 120,  // pixels
  HEADER_HEIGHT: 40  // pixels
} 