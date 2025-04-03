const pool = require('../config/db');

const VALID_EVENT_TYPES = ['cancel', 'makeup', 'special', 'event'];

// ✅ 이벤트 유효성 검사
async function validateEventInput(body, mode = 'create') {
    const {
        event_type, event_date, timetable_id,
        subject_id, start_period, end_period
    } = body;

    if (!event_type || !event_date) return '이벤트 유형과 날짜는 필수입니다.';
    if (!VALID_EVENT_TYPES.includes(event_type)) {
        return `이벤트 유형은 ${VALID_EVENT_TYPES.join(', ')} 중 하나여야 합니다.`;
    }

    // 휴강 → timetable_id 반드시 필요
    if (event_type === 'cancel') {
        if (!timetable_id) return '휴강 이벤트는 timetable_id가 필요합니다.';
        const [[tt]] = await pool.query(`SELECT * FROM timetables WHERE id = ?`, [timetable_id]);
        if (!tt) return '해당 timetable_id의 정규 수업을 찾을 수 없습니다.';
    }

    // 보강 / 특강 → 과목, 교시 필수
    if (['makeup', 'special'].includes(event_type)) {
        if (!subject_id) return '보강/특강은 과목 선택이 필요합니다.';
        if (!start_period || !end_period) return '보강/특강은 교시 정보가 필요합니다.';
        if (start_period > end_period) return '교시 범위가 올바르지 않습니다.';
    }

    return null;
}

/**
 * 📌 이벤트 전체 조회 (grade, level, group_level 기반 필터링)
 */
exports.getEvents = async (req, res) => {
    const { grade, level, group_level, start_date, end_date } = req.query;

    try {
        let query = `
            SELECT e.*, s.name AS subject_name
            FROM timetable_events e
            LEFT JOIN subjects s ON e.subject_id = s.id
            WHERE 1 = 1
        `;
        const params = [];

        if (grade) {
            query += ` AND (e.grade = ? OR e.grade IS NULL)`;
            params.push(grade);
        }

        if (level) {
            query += ` AND (e.level = ? OR e.level IS NULL)`;
            params.push(level);
        }

        if (group_level) {
            query += ` AND (e.group_levels IS NULL OR JSON_CONTAINS(e.group_levels, JSON_QUOTE(?)))`;
            params.push(group_level);
        }

        if (start_date && end_date) {
            query += ` AND e.event_date BETWEEN ? AND ?`;
            params.push(start_date, end_date);
        }

        query += ` ORDER BY e.event_date DESC`;

        const [rows] = await pool.query(query, params);
        res.status(200).json({ events: rows });
    } catch (err) {
        console.error("❌ 이벤트 조회 오류:", err);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/**
 * 📌 이벤트 등록
 */
exports.createEvent = async (req, res) => {
    const error = await validateEventInput(req.body);
    if (error) return res.status(400).json({ message: error });

    const {
        timetable_id, subject_id, event_type, event_date,
        grade, level, group_levels,
        start_period, end_period, start_time, end_time,
        description
    } = req.body;

    try {
        const [result] = await pool.query(`
            INSERT INTO timetable_events (
                timetable_id, subject_id, event_type, event_date,
                grade, level, group_levels,
                start_period, end_period, start_time, end_time,
                description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            timetable_id || null,
            subject_id || null,
            event_type,
            event_date,
            grade || null,
            level || null,
            group_levels ? JSON.stringify(group_levels) : null,
            start_period || null,
            end_period || null,
            start_time || null,
            end_time || null,
            description || ''
        ]);

        res.status(201).json({ message: '이벤트 등록 완료', id: result.insertId });
    } catch (err) {
        console.error("❌ 이벤트 등록 오류:", err);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/**
 * 📌 이벤트 수정
 */
exports.updateEvent = async (req, res) => {
    const { event_id } = req.params;
    const error = await validateEventInput(req.body, 'update');
    if (error) return res.status(400).json({ message: error });

    const {
        timetable_id, subject_id, event_type, event_date,
        grade, level, group_levels,
        start_period, end_period, start_time, end_time,
        description
    } = req.body;

    try {
        const [result] = await pool.query(`
            UPDATE timetable_events SET
                timetable_id = ?, subject_id = ?, event_type = ?, event_date = ?,
                grade = ?, level = ?, group_levels = ?,
                start_period = ?, end_period = ?,
                start_time = ?, end_time = ?, description = ?
            WHERE id = ?
        `, [
            timetable_id || null,
            subject_id || null,
            event_type,
            event_date,
            grade || null,
            level || null,
            group_levels ? JSON.stringify(group_levels) : null,
            start_period || null,
            end_period || null,
            start_time || null,
            end_time || null,
            description || '',
            event_id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '이벤트를 찾을 수 없습니다.' });
        }

        res.json({ message: '이벤트 수정 완료' });
    } catch (err) {
        console.error("❌ 이벤트 수정 오류:", err);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/**
 * 📌 이벤트 삭제
 */
exports.deleteEvent = async (req, res) => {
    const { event_id } = req.params;

    try {
        const [result] = await pool.query(`DELETE FROM timetable_events WHERE id = ?`, [event_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '이벤트를 찾을 수 없습니다.' });
        }

        res.json({ message: '이벤트 삭제 완료' });
    } catch (err) {
        console.error("❌ 이벤트 삭제 오류:", err);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};
