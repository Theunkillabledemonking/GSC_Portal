require('dotenv').config();
const { fetchAndCacheMonthlyHolidays } = require('../controllers/holidayController');

async function cacheYear(year = new Date().getFullYear()) {
    console.log(`🗓️ ${year}년 공휴일 사전 캐시 시작`);
    for (let m = 1; m <= 12; m++) {
        await fetchAndCacheMonthlyHolidays(year, m);
    }
    console.log(`✅ ${year}년 공휴일 캐시 완료`);
    process.exit(0);
}

const targetYear = process.argv[2] || new Date().getFullYear();
cacheYear(Number(targetYear));
