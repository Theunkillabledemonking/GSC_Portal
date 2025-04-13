/**
 * Date and time formatting utility functions
 */

/**
 * Formats a time period number to a readable time string
 * @param {number} period - The period number (1-9)
 * @returns {string} Formatted time string (e.g., "09:00")
 */
export const formatTime = (period) => {
  if (!period && period !== 0) return '-'
  
  // Map periods to corresponding times
  const periodMap = {
    1: '09:00',
    2: '10:00',
    3: '11:00',
    4: '12:00',
    5: '13:00',
    6: '14:00',
    7: '15:00',
    8: '16:00',
    9: '17:00'
  }
  
  return periodMap[period] || `${period}교시`
}

/**
 * Formats a date string to a readable format
 * @param {string} dateStr - Date string in ISO format or YYYY-MM-DD
 * @returns {string} Formatted date string (e.g., "2023년 5월 15일 (월)")
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = weekdays[date.getDay()]
  
  return `${year}년 ${month}월 ${day}일 (${weekday})`
}

/**
 * Gets the current semester based on the current date
 * @returns {string} Current semester (e.g., "2023-1")
 */
export const getCurrentSemester = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  
  // First semester: March - August
  // Second semester: September - February
  const semester = month >= 3 && month <= 8 ? 1 : 2
  
  return `${year}-${semester}`
}

/**
 * Parses a time string to a Date object
 * @param {string} timeStr - Time string (e.g., "09:00")
 * @param {Date} baseDate - Base date to use
 * @returns {Date} Date object with the specified time
 */
export const parseTime = (timeStr, baseDate = new Date()) => {
  if (!timeStr) return null
  
  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = new Date(baseDate)
  date.setHours(hours, minutes || 0, 0, 0)
  
  return date
} 