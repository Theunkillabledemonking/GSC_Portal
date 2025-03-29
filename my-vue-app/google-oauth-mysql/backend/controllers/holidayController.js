const axios = require('axios');
const { KOREA_HOLIDAY_KEY } = process.env;

const getPublicHolidays = async (req, res) => {
    const { year, month } = req.query;

    if (!year || !month) {
        return res.status(400).json({ message: "year, month 쿼리 파라미터가 필요합니다." });
    }

    try {
        const response = await axios.get('https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo', {
            params: {
                ServiceKey: KOREA_HOLIDAY_KEY,
                solYear: year,
                solMonth: month.padStart(2, '0'),
                _type: 'json',
            },
        });

        const items = response.data.response.body.items?.item || [];

        const holidays = Array.isArray(items) ? items : [items];

        const result = holidays.map(h => ({
            date: h.locdate?.toString().replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3"),
            name: h.dateName,
            isHoliday: h.isHoliday === 'Y',
        }));

        res.json({ holidays: result });
    } catch (err) {
        console.error("❌ 공휴일 API 호출 실패:", err);
        res.status(500).json({ message: "공휴일 데이터를 불러오는 중 오류 발생" });
    }
};

module.exports = {
    getPublicHolidays,
};