const axios = require('axios');
const pool = require('../config/db');
const dayjs = require('dayjs');
const { KOREA_HOLIDAY_KEY, KOREA_HOLIDAY_API_URL } = process.env;

/**
 * ✅ DB에서 범위 기반 공휴일 조회
 */
async function getPublicHolidaysInRange(startDate, endDate) {
    const [rows] = await pool.query(`
        SELECT date FROM holidays
        WHERE date BETWEEN ? AND ? AND isHoliday = 1
    `, [startDate, endDate]);
    return rows.map(row => row.date);
}

/**
 * ✅ 외부 API 호출 (월별) + DB 저장
 */
async function fetchAndCacheMonthlyHolidays(year, month) {
    const formattedMonth = month.toString().padStart(2, '0');

    const [cached] = await pool.query(`
        SELECT * FROM holidays WHERE DATE_FORMAT(date, '%Y-%m') = ?
    `, [`${year}-${formattedMonth}`]);

    if (cached.length > 0) return cached;

    try {
        const response = await axios.get(KOREA_HOLIDAY_API_URL, {
            params: {
                ServiceKey: KOREA_HOLIDAY_KEY,
                solYear: year,
                solMonth: formattedMonth,
                _type: 'json'
            }
        });

        const rawItems = response.data.response?.body?.items?.item;
        const items = Array.isArray(rawItems) ? rawItems : (rawItems ? [rawItems] : []);

        const holidays = items.map(h => ({
            date: h.locdate.toString().replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3"),
            name: h.dateName,
            isHoliday: h.isHoliday === 'Y'
        }));

        for (const h of holidays) {
            await pool.query(`
                INSERT IGNORE INTO holidays (date, name, isHoliday)
                VALUES (?, ?, ?)
            `, [h.date, h.name, h.isHoliday]);
        }

        return holidays;
    } catch (err) {
        console.error(`❌ 공휴일 API 호출 실패: ${year}-${formattedMonth}`, err.message);
        return []; // 실패했어도 일단 계속 진행
    }
}

/**
 * ✅ fallback 포함 범위 공휴일 조회
 */
async function getPublicHolidaysInRangeWithFallback(startDate, endDate) {
    let holidays = await getPublicHolidaysInRange(startDate, endDate);
    if (holidays.length > 0) return holidays;

    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const seen = new Set();

    for (let d = start; d.isSame(end) || d.isBefore(end); d = d.add(1, 'day')) {
        const key = `${d.year()}-${d.month() + 1}`;
        if (!seen.has(key)) {
            await fetchAndCacheMonthlyHolidays(d.year(), d.month() + 1);
            seen.add(key);
        }
    }

    holidays = await getPublicHolidaysInRange(startDate, endDate);
    return holidays;
}

module.exports = {
    getPublicHolidaysInRangeWithFallback,
    fetchAndCacheMonthlyHolidays,
    getPublicHolidaysInRange
};
