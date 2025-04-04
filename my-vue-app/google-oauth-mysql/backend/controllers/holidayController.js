// controllers/holidayController.js
const { getPublicHolidaysInRangeWithFallback } = require('../services/holidayService');

/**
 * 📅 Express 핸들러로 사용 가능한 공휴일 컨트롤러
 */
exports.getPublicHolidays = async (req, res) => {
    const { start, end } = req.query;

    if (!start || !end) {
        return res.status(400).json({ message: "start 와 end 날짜는 필수입니다" });
    }

    try {
        const holidays = await getPublicHolidaysInRangeWithFallback(start, end);
        res.status(200).json({ holidays });
    } catch (err) {
        console.error("❌ 공휴일 조회 실패:", err.message);
        res.status(500).json({ message: "공휴일 조회 중 서버 오류 발생" });
    }
};
