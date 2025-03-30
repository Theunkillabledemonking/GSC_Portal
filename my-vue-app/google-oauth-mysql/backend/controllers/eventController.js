const pool = require('../config/db')

// 📌 공통 유효성 검사
const VALID_EVENT_TYPES = ['cancel', 'makeup', 'special', 'event']

/**
 * ✅ 이벤트 유효성 검사 (공통)
 */
function validateEventInput(body, mode = 'create') {
    const {
        timetable_id, subject_id, event_type,
        event_date, start_period, end_period
    } = body

    if (!event_type || !event_date) {
        return '필수 항목(event_type, event_date)이 누락되었습니다.'
    }

    if (!VALID_EVENT_TYPES.includes(event_type)) {
        return `event_type은 ${VALID_EVENT_TYPES.join(', ')} 중 하나여야 합니다.`
    }

    if (event_type === 'cancel' && !timetable_id) {
        return '휴강 이벤트는 timetable_id가 필요합니다.'
    }

    if (['makeup', 'special', 'event'].includes(event_type) && !subject_id) {
        return '보강/특강/행사는 subject_id가 필요합니다.'
    }

    if (start_period && end_period && start_period > end_period) {
        return '교시 범위(start_period ~ end_period)가 올바르지 않습니다.'
    }

    return null // 유효
}

/**
 * ✅ 전체 이벤트 조회
 */
exports.getEvents = async (req, res) => {
    const { level, start_date, end_date } = req.query

    try {
        let query = `
            SELECT e.*, s.name AS subject_name
            FROM timetable_events e
                     LEFT JOIN subjects s ON e.subject_id = s.id
        `

        const conditions = []
        const params = []

        if (level) {
            conditions.push("e.level = ?")
            params.push(level)
        }

        if (start_date && end_date) {
            conditions.push("e.event_date BETWEEN ? AND ?")
            params.push(start_date, end_date)
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ")
        }

        query += " ORDER BY e.event_date DESC"

        const [rows] = await pool.query(query, params)
        res.status(200).json({ events: rows })

    } catch (err) {
        console.error("❌ 이벤트 조회 오류:", err)
        res.status(500).json({ message: "서버 오류가 발생했습니다." })
    }
}

/**
 * ✅ 이벤트 등록
 */
exports.createEvent = async (req, res) => {
    const validationError = validateEventInput(req.body, 'create')
    if (validationError) {
        return res.status(400).json({ message: validationError })
    }

    const {
        timetable_id, subject_id, event_type, event_date,
        level, start_period, end_period, start_time, end_time, description
    } = req.body

    try {
        const [result] = await pool.query(`
      INSERT INTO timetable_events (
        timetable_id, subject_id, event_type, event_date,
        level, start_period, end_period, start_time, end_time, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        ])

        res.status(201).json({ message: "이벤트 등록 완료", id: result.insertId })

    } catch (err) {
        console.error("❌ 이벤트 등록 오류:", err)
        res.status(500).json({ message: "서버 오류가 발생했습니다." })
    }
}

/**
 * ✅ 이벤트 수정
 */
exports.updateEvent = async (req, res) => {
    const { event_id } = req.params
    const validationError = validateEventInput(req.body, 'update')
    if (validationError) {
        return res.status(400).json({ message: validationError })
    }

    const {
        timetable_id, subject_id, event_type, event_date,
        level, start_period, end_period, start_time, end_time, description
    } = req.body

    try {
        const [result] = await pool.query(`
            UPDATE timetable_events SET
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
        ])

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '해당 이벤트를 찾을 수 없습니다.' })
        }

        res.json({ message: '이벤트 수정 완료' })

    } catch (err) {
        console.error("❌ 이벤트 수정 오류:", err)
        res.status(500).json({ message: "서버 오류가 발생했습니다." })
    }
}

/**
 * ✅ 이벤트 삭제
 */
exports.deleteEvent = async (req, res) => {
    const { event_id } = req.params

    try {
        const [result] = await pool.query(`DELETE FROM timetable_events WHERE id = ?`, [event_id])

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '해당 이벤트를 찾을 수 없습니다.' })
        }

        res.json({ message: '이벤트 삭제 완료' })

    } catch (err) {
        console.error("❌ 이벤트 삭제 오류:", err)
        res.status(500).json({ message: "서버 오류가 발생했습니다." })
    }
}
