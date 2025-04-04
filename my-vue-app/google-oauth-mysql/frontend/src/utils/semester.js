export function getSemesterRange(year, semester) {
    // 🛡️ year가 4자리 숫자 아니면 자동 보정 (예: 1 → 2025)
    if (year < 1000) {
        const current = new Date().getFullYear()
        year = current
    }

    const semesterMap = {
        spring: ['03-01', '06-30'],
        summer: ['07-01', '08-31'],
        fall:   ['09-01', '12-31'],
        winter: ['01-01', '02-28']
    }
    const [start, end] = semesterMap[semester] || semesterMap.spring

    return {
        start_date: `${year}-${start}`,
        end_date: `${year}-${end}`
    }
}
