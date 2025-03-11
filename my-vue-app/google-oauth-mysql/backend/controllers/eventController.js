// controllers/eventController.js

const pool = require('../config/db');

/**
 * 모든 이벤트 조회
 * @route GET /api/events
 */
exports.getEvents = async (req, res) => {
    try {
        // timetable_events 테이블에서 전체 조회
        const [rows] = await pool.query(`
            SELECT *
            FROM timetable_events
            ORDER BY event_date DESC
        `);
        res.json({ events: rows });
    } catch (error) {
        console.error("이벤트 조회 오류:", error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

/**
 * 이벤트 등록 (휴강/보강/특강)
 * @route POST /api/events
 */
exports.createEvent = async (req, res) => {
    try {
        const {
            timetable_id, subject_id, event_type, event_date,
            level, start_period, end_period, start_time, end_time, description
        } = req.body;

        // 필수값 체크
        if (!timetable_id || !subject_id || !event_type || !event_date) {
            return res.status(400).json({
                message: '필수 데이터(timetable_id, subject_id, event_type, event_date)가 누락되었습니다.'
            });
        }
        if (!['cancel','makeup','special'].includes(event_type)) {
            return res.status(400).json({
                message: 'event_type은 (cancel, makeup, special) 중 하나여야 합니다.'
            });
        }

        console.log("📌 이벤트 INSERT 요청 데이터:", JSON.stringify(req.body, null, 2));

        // MySQL INSERT
        const [result] = await pool.query(`
            INSERT INTO timetable_events
            (timetable_id, subject_id, event_type, event_date, level,
             start_period, end_period, start_time, end_time, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            timetable_id,
            subject_id,
            event_type,
            event_date,
            level || null,
            start_period || null,
            end_period || null,
            start_time || null,
            end_time || null,
            description || ''
        ]);

        if (result.affectedRows === 0) {
            throw new Error("이벤트 INSERT 실패");
        }

        console.log("✅ 이벤트 INSERT 성공", result);
        res.status(201).json({ message: '이벤트 등록 완료' });
    } catch (error) {
        console.error("❌ 이벤트 등록 오류:", error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};


/**
 * 이벤트 수정
 * @route PUT /api/events/:event_id
 */
exports.updateEvent = async (req, res) => {
    try {
        const { event_id } = req.params;
        const {
            timetable_id, subject_id, event_type, event_date,
            level, start_period, end_period,
            start_time, end_time, description
        } = req.body;

        const [result] = await pool.query(`
            UPDATE timetable_events
            SET timetable_id=?, subject_id=?, event_type=?,
                event_date=?, level=?,
                start_period=?, end_period=?,
                start_time=?, end_time=?,
                description=?
            WHERE id=?
        `, [
            timetable_id || null,
            subject_id,
            event_type,
            event_date,
            level || null,
            start_period || null,
            end_period || null,
            start_time || null,
            end_time || null,
            description || '',
            event_id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '해당 이벤트가 없습니다.' });
        }
        res.json({ message: '이벤트 수정 완료' });
    } catch (error) {
        console.log('이벤트 수정 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

/**
 * 이벤트 삭제
 * @route DELETE /api/events/:event_id
 */
exports.deleteEvent = async (req, res) => {
    const { event_id } = req.params;
    try {
        // timetable_events에서 해당 id 삭제
        const [result] = await pool.query(`
            DELETE FROM timetable_events
            WHERE id = ?
        `, [event_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '해당 이벤트를 찾을 수 없습니다' });
        }
        res.json({ message: '이벤트가 삭제되었습니다.' });
    } catch (error) {
        console.log('이벤트 삭제 오류' ,error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};
