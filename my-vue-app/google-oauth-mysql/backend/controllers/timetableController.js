const pool = require('../config/db');

/**
 * 학기별 정규 시간표 + 휴강/보강/특강 이벤트 조회
 * 프론트에서 학기(기간), 학년(year), 레벨(level)을 넘기면
 * 해당 조건에 맞는 정규 시간표와 이벤트 정보를 함께 반환
 *
 * @route GET /api/timetable-with-events
 * @query year, level, start_date, end_date
 */
exports.getTimetableWithEvents = async (req, res) => {
    const { year, level, start_date, end_date } = req.query;

    // 학년 유효성 체크 (1, 2, 3 학년만 허용)
    if (![1, 2, 3].includes(Number(year))) {
        return res.status(400).json({ message: '올바른 학년을 선택해주세요 (1, 2, 3학년만 가능합니다.'});
    }

    try {
        // 1. 정규 시간표 조회 (timetables)
        const [timetables] = await pool.query(`
            SELECT
                t.id, t.year, t.level, t.day, t.period, t.room,
                s.name AS subject_name
                u.name AS professor_name
            FROM timetables t
            JOIN subjects s ON t.subject_id = s.id
            LEFT JOIN users u ON t.professor_id = u.id
            WHERE t.year = ? AND t.level = ?
        `, [year, level]);

        // 2. 해당 기간 내 이벤트 조회 (timetable_events)
        const [events] = await pool.query(`
            SELECT 
                e.id, e.timetable_id, e.subject_id,
                e.event_type, e.event_date, e.start_time, e.end_time,
                e.description,
                s.name AS subject_name
            FROM timetable_events e
            JOIN subjects s ON e.subject_id = s.id
            WHERE e.event_date BETWEEN ? AND ?
        `, [start_date, end_date]);

        // 3. 응답 반환 (정규 시간표 + 이벤트)
        res.json({ timetables, events });
    } catch (error) {
        console.log("시간표 및 이벤트 조회 오류", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
}

/**
 * 정규 시간표 등록
 * @route POST /api/timetable
 */
exports.createTimetable = async (req, res) => {
    const { year, level, day, period, subject_id, room, professor_id } = req.body;

    try {
        await pool.query(`
            INSERT INTO timetables (year, level, day, period, subject_id, room, professor_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [year, level, day, period, subject_id, room, professor_id]);

        res.status(201).json({ message: '시간표가 등록되었습니다.' });
    } catch (error) {
        console.log('시간표 등록 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했씁니다.'});
    }
};

/**
 * 정규 시간표 수정
 * @route PUT /api/timetable/:id
 */
exports.updateTimetable = async (req, res) => {
    const { id } = req.params;
    const { year, level, day, period, subject_id, room, professor_id } = req.body;

    try {
        await pool.query(`
            UPDATE timetables
            SET year = ?, level = ?, day = ?, period = ?, subject_id = ?, room = ?, professor_id =?
            WHERE id = ?
        `, [year, level, day, period, subject_id, room, professor_id, id]);

        res.status(200).json({ message: '시간표가 수정되었습니다.' });
    } catch (error) {
        console.error('시간표 수정 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

/**
 * 정규 시간표 삭제
 * @route DELETE /api/timetable/:id
 */
exports.deleteTimetable = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query(`DELETE FROM timetables WHERE id = ?`, [id]);
        res.status(200).json({ message: '시간표가 삭제되었습니다.'} );
    } catch (error) {
        console.error('시간표 삭제 오류', error);
        res.status(500).json({ message: '서버 오류가 발생했씁니다.'});
    }
};


/**
 * 휴강/보강/특강 이벤트 등록
 * 교수/관리자가 특정 과목의 특정 날짜에 이벤트를 등록
 *
 * @route POST /api/events
 * @body timetable_id, subject_id, event_type, event_date, start_time, end_time, description
 */
exports.createEvent = async (req, res) => {
    const { timetable_id, subject_id, event_type, event_date, start_time, end_time, description } = req.body;

    try {
        // 기본 유효성 체크
        if (!['cancel', 'makeup', 'special'].includes(event_type)) {
            return res.status(400).json({ message: '올바른 이벤트 유형을 선택해주세요 (cancel, makeup, special' });
        }

        // DB 저장
        await pool.query(`
            INSERT INTO timetable_events (timetable_id, subject_id, event_type, event_date, start_time, end_time, description)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [timetable_id || null, subject_id, event_type, event_date, start_time, end_time, description]);

        res.status(201).json({ message: '이벤트가 등록되었습니다.' });
    } catch (error) {
        console.log("이벤트 등록 오류", error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

/**
 * 휴강/보강/특강 이벤트 수정
 * 잘못 등록한 이벤트 수정
 *
 * @route PUT /api/events/:event_id
 * @param event_id
 */
exports.updateEvent = async (req, res) => {
    const { event_id } = req.params; // url 에서 event_id 받기
    const { timetable_id, subject_id, event_type, event_date, start_time, end_time, description } = req.body;

    try {
        // 기본 유효성 체크
        if (!['cancel', 'makeup', 'special'].includes(event_type)) {
            return res.status(400).json({ message: '올바른 이벤트 유형을 선택해주세요 (cancel, makeup, special)' });
        }

        // DB 수정
        await pool.query(`
            UPDATE timetable_events 
            SET 
                timetable_id = ? , 
                subject_id = ?, 
                event_type = ?, 
                event_date = ?, 
                start_time = ?, 
                end_time = ?, 
                description = ? 
            WHERE id = ?
        `, [timetable_id || null, subject_id, event_type, event_date, start_time, end_time, description, event_id]);

        res.status(200).json({ message: '이벤트가 수정되었습니다.' });
    } catch (error) {
        console.log('이벤트 수정 오류', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.'})
    }
}

/**
 * 휴강/보강/특강 이벤트 삭제
 * 잘못 등록한 이벤트 삭제
 *
 * @route DELETE /api/events/:event_id
 * @param event_id
 */
exports.deleteEvent = async (req, res) => {
    const { event_id } = req.params;

    try {
        const [result] = await pool.query(`DELETE FROM timetable_events WHERE id = ?`, [event_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '해당 이벤트를 찾을 수 없습니다.' });
        }

        res.json({ message: '이벤트가 삭제되었습니다.' });
    } catch (error) {
        console.error('이벤트 삭제 오류', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};
