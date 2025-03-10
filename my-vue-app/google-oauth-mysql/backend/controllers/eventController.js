const pool = require('../config/db');

/**
 * 모든 이벤트 조회
 * @route GET /api/events
 */
exports.getEvents = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM timetalbe_events ORDER BY event_date DESC")
        res.json({ events: rows });
    } catch (error) {
        console.error("이벤트 조회 오류:", error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

/**
 * 이벤트 (보강/휴강/특강) 등록
 */exports.createEvent = async (req, res) => {
    try {
        const {
            timetable_id, subject_id,
            event_type, event_date,
            level, start_period, end_period,
            start_time, end_time,
            description
        } = req.body;

        if (!['cancel', 'makeup', 'special'].includes(event_type)) {
            return res.status(400).json({ message: '올바른 이벤트 유형을 선택해주세요 (cancel, makeup, special)' });
        }
        // 휴강 or 보강 → 기존 timetable_id 필요, 특강 → timetable_id 없어도 가능
        // (원하는 로직대로 구현)
        await pool.query(`
            INSERT INTO timetable_events(
                timetable_id, subject_id, event_type,
                event_date, level, start_period, end_period,
                start_time, end_time, description
            ) VALUES (?,?,?,?,?,?,?,?,?,?)
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
            description || ''
        ]);

        res.status(201).json({ message: '이벤트 등록 완료' });
    } catch (error) {
        console.error("이벤트 등록 오류:", error);
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
            return res.status(404).json({ message: '이벤트 없음' });
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
        const [result] = await pool.query(`DELETE FROM timetable_evnets WHERE id = ?` [event_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '해당 이벤트를 찾을 수 없습니다' });
        }

        res.json({ message: '이벤트가 삭제되었습니다.' });
    } catch (error) {
        console.log('이벤트 삭제 오류' ,error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};