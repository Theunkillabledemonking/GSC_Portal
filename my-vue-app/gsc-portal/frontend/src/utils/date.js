import dayjs from 'dayjs'

/**
 * 📅 원 수업 정보로부터 휴강일 유추
 * @param {Object} originalClass - original_class 정보
 * @param {string} semesterStartDate - 학기 시작일 (YYYY-MM-DD)
 * @returns {string | undefined} - 날짜 (YYYY-MM-DD) or undefined
 */
export function inferDateFromOriginalClass(originalClass, semesterStartDate) {
    if (!originalClass || originalClass.weekday_index === undefined) return undefined

    const base = dayjs(semesterStartDate).startOf('week') // 주 시작점 (일요일)
    const targetDate = base.add(originalClass.weekday_index, 'day')
    return targetDate.format('YYYY-MM-DD')
}
