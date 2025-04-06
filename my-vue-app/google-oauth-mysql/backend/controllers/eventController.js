const pool = require('../config/db');

const VALID_EVENT_TYPES = ['cancel', 'makeup', 'special', 'event'];

// ✅ 유효성 검사
async function validateEventInput(body, mode = 'create') {
    const {
        event_type, event_date, timetable_id,
        subject_id, start_period, end_period
    } = body;

    if (!event_type || !event_date) return '이벤트 유형과 날짜는 필수입니다.';

    if (!VALID_EVENT_TYPES.includes(event_type)) {
        return `이벤트 유형은 ${VALID_EVENT_TYPES.join(', ')} 중 하나여야 합니다.`;
    }

    if (isNaN(Date.parse(event_date))) {
        return 'event_date는 올바른 날짜 형식이어야 합니다.';
    }

    if (event_type === 'cancel') {
        if (!timetable_id) return '휴강 이벤트는 timetable_id가 필요합니다.';
        const [[tt]] = await pool.query(`SELECT * FROM timetables WHERE id = ?`, [timetable_id]);
        if (!tt) return '해당 timetable_id의 정규 수업을 찾을 수 없습니다.';
    }

    if (['makeup', 'special'].includes(event_type)) {
        if (!subject_id) return '보강/특강은 과목 선택이 필요합니다.';
        if (!start_period || !end_period) return '보강/특강은 교시 정보가 필요합니다.';
        if (start_period > end_period) return '교시 범위가 올바르지 않습니다.';
    }

    return null;
}

// ✅ 휴강 중복 검사
async function isDuplicateCancel({ event_type, event_date, timetable_id }) {
    if (event_type !== 'cancel' || !timetable_id) return false;

    const [rows] = await pool.query(`
        SELECT id FROM timetable_events
        WHERE event_type = 'cancel' AND event_date = ? AND timetable_id = ?
    `, [event_date, timetable_id]);

    return rows.length > 0;
}

// ✅ group_levels 유틸
function toJSONStringArray(input) {
    if (Array.isArray(input)) return JSON.stringify(input);
    if (typeof input === 'string') return JSON.stringify([input]);
    return null;
}

// ✅ 로깅 유틸
function logParams(label, obj) {
    console.log(`📥 [${label}] 요청:`, JSON.stringify(obj, null, 2));
}

// ---------------------- 컨트롤러 ----------------------

exports.getEvents = async (req, res) => {
    const { year, level, group_level, start_date, end_date } = req.query;
    logParams('getEvents', req.query);

    try {
        let query = `
            SELECT e.*, s.name AS subject_name
            FROM timetable_events e
            LEFT JOIN subjects s ON e.subject_id = s.id
            WHERE 1 = 1
        `;
        const params = [];

        if (year) {
            query += ` AND (e.year = ? OR e.year IS NULL)`;
            params.push(year);
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

        res.status(200).json({
            status: 'success',
            data: { events: rows }
        });
    } catch (err) {
        console.error("❌ 이벤트 조회 오류:", err);
        res.status(500).json({ status: 'error', message: '서버 오류 발생' });
    }
};

exports.createEvent = async (req, res) => {
    const payload = req.body;
    logParams('createEvent', payload);

    const error = await validateEventInput(payload, 'create');
    if (error) return res.status(400).json({ status: 'error', message: error });

    const {
        timetable_id, subject_id, event_type, event_date,
        year, level, group_levels,
        start_period, end_period, start_time, end_time,
        description
    } = payload;

    try {
        if (await isDuplicateCancel({ event_type, event_date, timetable_id })) {
            return res.status(409).json({
                status: 'error',
                message: '해당 날짜에 이미 휴강 이벤트가 존재합니다.'
            });
        }

        let finalYear = year;
        let finalLevel = level;
        let finalSubject = subject_id;
        let finalStartPeriod = start_period;
        let finalEndPeriod = end_period;
        let finalDescription = description;

        // 휴강이면 timetable 기준으로 자동 보완
        if (event_type === 'cancel' && timetable_id) {
            const [[tt]] = await pool.query(
                `SELECT t.*, s.name as subject_name 
                 FROM timetables t 
                 LEFT JOIN subjects s ON t.subject_id = s.id 
                 WHERE t.id = ?`, 
                [timetable_id]
            );
            if (tt) {
                finalYear = tt.year;
                finalLevel = tt.level;
                finalSubject = tt.subject_id;
                finalStartPeriod = tt.start_period;
                finalEndPeriod = tt.end_period;
                finalDescription = description || `${tt.subject_name || '미지정 과목'} 휴강`;
            }
        }

        const [result] = await pool.query(`
            INSERT INTO timetable_events (
                timetable_id, subject_id, event_type, event_date,
                year, level, group_levels,
                start_period, end_period, start_time, end_time, description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            timetable_id || null,
            finalSubject || null,
            event_type,
            event_date,
            finalYear || null,
            finalLevel || null,
            toJSONStringArray(group_levels),
            finalStartPeriod || null,
            finalEndPeriod || null,
            start_time || null,
            end_time || null,
            finalDescription || ''
        ]);

        console.log("✅ [createEvent] 이벤트 생성 완료:", {
            id: result.insertId,
            event_type,
            timetable_id,
            subject_id: finalSubject,
            start_period: finalStartPeriod,
            end_period: finalEndPeriod
        });

        res.status(201).json({
            status: 'success',
            message: '이벤트 등록 완료',
            data: { id: result.insertId }
        });
    } catch (err) {
        console.error("❌ 이벤트 등록 오류:", err);
        res.status(500).json({ status: 'error', message: '서버 오류 발생' });
    }
};

exports.updateEvent = async (req, res) => {
    const { event_id } = req.params;
    const payload = req.body;
    logParams('updateEvent', { event_id, ...payload });

    const error = await validateEventInput(payload, 'update');
    if (error) return res.status(400).json({ status: 'error', message: error });

    const {
        timetable_id, subject_id, event_type, event_date,
        year, level, group_levels,
        start_period, end_period, start_time, end_time,
        description
    } = payload;

    try {
        // 휴강 중복 체크 (자기 자신 제외)
        if (event_type === 'cancel' && timetable_id) {
            const [rows] = await pool.query(`
                SELECT id FROM timetable_events
                WHERE event_type = 'cancel' AND event_date = ? AND timetable_id = ? AND id != ?
            `, [event_date, timetable_id, event_id]);

            if (rows.length > 0) {
                return res.status(409).json({
                    status: 'error',
                    message: '해당 날짜에 이미 휴강 이벤트가 존재합니다.'
                });
            }
        }

        const [result] = await pool.query(`
            UPDATE timetable_events SET
                timetable_id = ?, subject_id = ?, event_type = ?, event_date = ?,
                year = ?, level = ?, group_levels = ?,
                start_period = ?, end_period = ?, start_time = ?, end_time = ?, description = ?
            WHERE id = ?
        `, [
            timetable_id || null,
            subject_id || null,
            event_type,
            event_date,
            year || null,
            level || null,
            toJSONStringArray(group_levels),
            start_period || null,
            end_period || null,
            start_time || null,
            end_time || null,
            description || '',
            event_id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: '이벤트를 찾을 수 없습니다.'
            });
        }

        res.status(200).json({
            status: 'success',
            message: '이벤트 수정 완료',
            data: { id: parseInt(event_id) }
        });
    } catch (err) {
        console.error("❌ 이벤트 수정 오류:", err);
        res.status(500).json({ status: 'error', message: '서버 오류 발생' });
    }
};

exports.deleteEvent = async (req, res) => {
    const { event_id } = req.params;
    logParams('deleteEvent', { event_id });

    try {
        const [result] = await pool.query(`DELETE FROM timetable_events WHERE id = ?`, [event_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: '이벤트를 찾을 수 없습니다.'
            });
        }

        res.status(200).json({
            status: 'success',
            message: '이벤트 삭제 완료',
            data: { id: parseInt(event_id) }
        });
    } catch (err) {
        console.error("❌ 이벤트 삭제 오류:", err);
        res.status(500).json({ status: 'error', message: '서버 오류 발생' });
    }
};
