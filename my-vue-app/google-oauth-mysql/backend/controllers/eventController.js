const pool = require('../config/db');

/**
 * 모든 이벤트 조회
 * @route GET /api/events
 */
exports.getEvents = async (req, res) => {
    try {
        const [events] = await pool.query("SELECT * FROM timetalbe_events ORDER BY event_date DESC")
        res.status(200).json({ events });
    } catch (error) {
        console.error("이벤트 조회 오류:", error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

/**
 * 이벤트 (보강/휴강/특강) 등록
 */exports.createEvent = async (req, res) => {
    const { timetable_id, subject_id, event_type, event_date, start_period, end_period, start_time, end_time, level, description } = req.body;

    try {
        if (!['cancel', 'makeup', 'special'].includes(event_type)) {
            return res.status(400).json({ message: '올바른 이벤트 유형을 선택해주세요 (cancel, makeup, special)' });
        }

        let periodValues = [null, null];
        let timeValues = [null, null];

        if (event_type === 'special') {
            // ✅ 특강 → 시간으로 저장, level 필수, year는 NULL
            if (!level) {
                return res.status(400).json({ message: '특강은 레벨 정보가 필요합니다.' });
            }
            timeValues = [start_time, end_time];
        } else {
            // ✅ 휴강/보강 → 기존 수업 시간 불러오기
            const [timetable] = await pool.query("SELECT start_period, end_period FROM timetables WHERE id = ?", [timetable_id]);

            if (!timetable.length) {
                return res.status(400).json({ message: '해당 시간표가 존재하지 않습니다.' });
            }
            periodValues = [timetable[0].start_period, timetable[0].end_period];
        }

        // ✅ 이벤트 추가 (휴강/보강/특강)
        await pool.query(`
            INSERT INTO timetable_events (timetable_id, subject_id, event_type, event_date, start_period, end_period, start_time, end_time, level, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [timetable_id, subject_id, event_type, event_date, ...periodValues, ...timeValues, level, description]);

        res.status(201).json({ message: '이벤트가 등록되었습니다.' });
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
    const { event_id } = req.params;
    const { timetable_id, subject_id, event_type, event_date, start_time, end_time, description } = req.body;

    try {
        await pool.query(`
            UPDATE timetable_events
            SET timetable_id = ?, subject_id = ?, event_type = ?, event_date = ?, start_time = ?, end_time = ?, description = ?
            WHERE id = ?
        `, [timetable_id || null, subject_id, event_type, event_date, start_time, end_time, description]);

        res.status(200).json({ message: '이벤트가 수정되었습니다.' });
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