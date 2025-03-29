const pool = require('../config/db');

// 📌 공통 유효성 검사
const VALID_EVENT_TYPES = ['cancel', 'makeup', 'special', 'event'];

/**
 * ✅ 전체 이벤트 조회 (+ level, 기간 필터링 지원)
 */
exports.getEvents = async (req, res) => {
    const { level, start_date, end_date } = req.query;

    try {
        let query = `
            SELECT e.*, s.name AS subject_name
            FROM timetable_events e
                     LEFT JOIN subjects s ON e.subject_id = s.id
        `;

        const conditions = [];
        const params = [];

        if (level) {
            conditions.push("e.level = ?");
            params.push(level);
        }

        if (start_date && end_date) {
            conditions.push("e.event_date BETWEEN ? AND ?");
            params.push(start_date, end_date);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY e.event_date DESC";

        const [rows] = await pool.query(query, params);
        res.status(200).json({ events: rows });

    } catch (err) {
        console.error("❌ 이벤트 조회 오류:", err);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};


/**
 * ✅ 이벤트 등록 (보강, 특강, 휴강, 행사)
 */
exports.createEvent = async (req, res) => {
    try {
        const {
            timetable_id, subject_id, event_type, event_date,
            level, start_period, end_period, start_time, end_time, description
        } = req.body;

        // 🔎 필수 체크
        if (!event_type || !event_date) {
            return res.status(400).json({
                message: "필수 항목(event_type, event_date)이 누락되었습니다."
            });
        }

        if (!VALID_EVENT_TYPES.includes(event_type)) {
            return res.status(400).json({
                message: `event_type은 ${VALID_EVENT_TYPES.join(', ')} 중 하나여야 합니다.`
            });
        }

        // 🎯 INSERT
        const [result] = await pool.query(`
            INSERT INTO timetable_events (
                timetable_id, subject_id, event_type, event_date,
                level, start_period, end_period, start_time, end_time, description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            timetable_id || null,
            subject_id || null,
            event_type,
            event_date,
            level || null,
            start_period || null,
            end_period || null,
            start_time || null,
            end_time || null,
            description || ''
        ]);

        res.status(201).json({
            message: "이벤트 등록 완료",
            id: result.insertId
        });

    } catch (err) {
        console.error("❌ 이벤트 등록 오류:", err);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};


/**
 * ✅ 이벤트 수정
 */
exports.updateEvent = async (req, res) => {
    const { event_id } = req.params;
    const {
        timetable_id, subject_id, event_type, event_date,
        level, start_period, end_period, start_time, end_time, description
    } = req.body;

    try {
        if (!VALID_EVENT_TYPES.includes(event_type)) {
            return res.status(400).json({
                message: `event_type은 ${VALID_EVENT_TYPES.join(', ')} 중 하나여야 합니다.`
            });
        }

        const [result] = await pool.query(`
            UPDATE timetable_events
            SET
                timetable_id = ?, subject_id = ?, event_type = ?,
                event_date = ?, level = ?,
                start_period = ?, end_period = ?,
                start_time = ?, end_time = ?, description = ?
            WHERE id = ?
        `, [
            timetable_id || null,
            subject_id || null,
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
            return res.status(404).json({ message: '해당 이벤트를 찾을 수 없습니다.' });
        }

        res.json({ message: '이벤트 수정 완료' });

    } catch (err) {
        console.error("❌ 이벤트 수정 오류:", err);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};


/**
 * ✅ 이벤트 삭제
 */
exports.deleteEvent = async (req, res) => {
    const { event_id } = req.params;

    try {
        const [result] = await pool.query(`
            DELETE FROM timetable_events WHERE id = ?
        `, [event_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '해당 이벤트를 찾을 수 없습니다.' });
        }

        res.json({ message: '이벤트 삭제 완료' });

    } catch (err) {
        console.error("❌ 이벤트 삭제 오류:", err);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};
