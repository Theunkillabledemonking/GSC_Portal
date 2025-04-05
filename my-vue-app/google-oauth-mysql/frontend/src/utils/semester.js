// utils/semester.js
import dayjs from 'dayjs';

export function getSemesterRange(year, semester) {
    if (year < 1000) year = new Date().getFullYear();

    const map = {
        spring: ['03-01', '06-30'],
        summer: ['07-01', '08-31'],
        fall:   ['09-01', '12-31'],
        winter: ['01-01', '02-28'],
        full:   ['01-01', '12-31']
    };

    const [start, end] = map[semester] || map.spring;

    // 겨울 학기 마지막 날 leap‑year 보정
    const endDate = semester === 'winter'
        ? dayjs(`${year}-${end}`).endOf('month').format('YYYY-MM-DD')
        : `${year}-${end}`;

    return {
        start_date: `${year}-${start}`,
        end_date: endDate
    };
}
