// Date utilities
export * from './date'

// Timetable utilities
export const calculateCellPosition = (period, day) => {
  const { CELL_HEIGHT, HEADER_HEIGHT } = DISPLAY_CONFIG
  return {
    top: HEADER_HEIGHT + (period - 1) * CELL_HEIGHT,
    left: day * CELL_MIN_WIDTH
  }
}

export const formatTimeRange = (startPeriod, endPeriod) => {
  const formatPeriod = (period) => {
    const hour = Math.floor((period - 1) * TIME_PERIODS.DURATION / 60) + 9
    const minute = ((period - 1) * TIME_PERIODS.DURATION) % 60
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }
  return `${formatPeriod(startPeriod)} - ${formatPeriod(endPeriod)}`
}

// Data formatting
export const formatClassInfo = (item) => {
  const { subject, professor, classroom, type } = item
  const style = EVENT_STYLES[type] || EVENT_STYLES.REGULAR
  return {
    title: subject,
    subtitle: `${professor ? professor + ' ' : ''}${classroom || ''}`,
    icon: style.icon,
    iconClass: style.iconClass
  }
}

// Validation
export const validateTimetableItem = (item) => {
  const required = ['subject', 'day', 'startPeriod', 'endPeriod']
  return required.every(field => item[field] != null)
} 