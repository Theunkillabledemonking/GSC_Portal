// controllers/timetableController.js
const axios = require("axios"); // 공휴일 요청 API 요청
const pool = require('../config/db');
const subjectController = require('./subjectController');

function mapDayOfWeek(day) {
    return { "일": 0, "월": 1, "화": 2, "수": 3, "목": 4, "금": 5, "토": 6 }[day] ?? null;
}

// 과목 API 프록시
exports.getSubjects = async (req, res) => subjectController.getSubjects(req, res);
exports.getSubjectsByYear = async (req, res) => subjectController.getSubjectsByYear(req, res);

// 📅 정규 수업 목록 조회 (선택적으로 level 필터링)
exports.getTimetables = async (req, res) => {
    const { level } = req.query;

    try {
        const [timetables] = await pool.query(`
            SELECT t.*, s.name AS subject_name,  s.professor_name
            FROM timetables t
            LEFT JOIN subjects s ON t.subject_id = s.id
            ${level ? 'WHERE t.level = ?' : ''}
            ORDER BY t.day, t.start_period
        `, level ? [level] : []);

        const [periods] = await pool.query(`SELECT * FROM period_time_map`);
        const periodMap = Object.fromEntries(periods.map(p => [p.period, p]));

        const formatted = timetables.map(t => ({
            ...t,
            subject_name: t.subject_name || '미지정 과목',
            professor_name: t.professor_name || '미지정 교수',
            start_time: periodMap[t.start_period]?.start_time,
            end_time: periodMap[t.end_period]?.end_time
        }));

        res.json({ timetables: formatted });
    } catch (err) {
        console.error('❌ getTimetables 오류:', err);
        res.status(500).json({ message: '서버 오류 발생' });
    }
};

// 📅 FullCalendar 데이터 통합 (정규 + 이벤트)
exports.getTimetableWithEvents = async (req, res) => {
    const { year, start_date, end_date, level } = req.query;

    try {
        // 1. ✅ 공휴일 가져오기
        const holidayRes = await axios.get(`${process.env.KOREA_HOLIDAY_API_URL}`, {
            params: {
                ServiceKey: process.env.KOREA_HOLIDAY_KEY,
                year,
                month: '',
                _type: 'json'
            }
        });

        const holidays = (holidayRes.data.response?.body?.items?.item || [])
            .map(item => item.locdate.toString().replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));

        // 2. ✅ 정규 수업
        const [timetables] = await pool.query(`
      SELECT t.*, s.name AS subject_name
      FROM timetables t
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE t.year = ?
      ${level ? 'AND t.level = ?' : ''}
    `, level ? [year, level] : [year]);

        const [periods] = await pool.query(`SELECT * FROM period_time_map`);
        const periodMap = Object.fromEntries(periods.map(p => [p.period, p]));

        // 3. ✅ 이벤트
        const [events] = await pool.query(`
      SELECT * FROM timetable_events
      WHERE event_date BETWEEN ? AND ?
      ${level ? 'AND level = ?' : ''}
    `, level ? [start_date, end_date, level] : [start_date, end_date]);

        // 4. ✅ FullCalendar-compatible events
        const finalEvents = [];

        for (const t of timetables) {
            const hasCancel = events.some(e => e.event_type === 'cancel' && e.timetable_id === t.id);
            finalEvents.push({
                id: `t-${t.id}`,
                title: hasCancel ? `[휴강] ${t.subject_name}` : `[정규] ${t.subject_name}`,
                daysOfWeek: [mapDayOfWeek(t.day)],
                startTime: periodMap[t.start_period]?.start_time || "09:00",
                endTime: periodMap[t.end_period]?.end_time || "18:00",
                backgroundColor: hasCancel ? "#d3d3d3" : "#90caf9",
                extendedProps: { ...t, isCancelled: hasCancel }
            });
        }

        for (const e of events) {
            if (['makeup', 'special', 'event'].includes(e.event_type)) {
                finalEvents.push({
                    id: `e-${e.id}`,
                    title:
                        e.event_type === 'makeup' ? `보강: ${e.description || ''}` :
                            e.event_type === 'special' ? `특강: ${e.description || ''}` :
                                `행사: ${e.description || ''}`,
                    start: `${e.event_date}T${e.start_time || '09:00'}`,
                    end: `${e.event_date}T${e.end_time || '18:00'}`,
                    backgroundColor:
                        e.event_type === 'makeup' ? '#4caf50' :
                            e.event_type === 'special' ? '#ff9800' :
                                '#f06292',
                    extendedProps: e
                });
            }
        }

        // 5. ✅ 최종 응답
        res.json({ timetables, events: finalEvents, holidays });

    } catch (err) {
        console.error('❌ getTimetableWithEvents 오류:', err);
        res.status(500).json({ message: '서버 오류 발생' });
    }
};

// 📌 시간표 생성
exports.createTimetable = async (req, res) => {
    const {
        year, level, subject_id, room, description,
        day, start_period, end_period,
        event_type, event_date, timetable_id,
        professor_name
    } = req.body;

    try {
        if (!event_type || event_type === 'normal') {
            const [result] = await pool.query(`
                INSERT INTO timetables (year, level, subject_id, room, description, day, start_period, end_period, professor_name)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [year, level || null, subject_id, room || '', description || '', day, start_period, end_period, professor_name || '']);

            return res.status(201).json({ message: '정규 수업 등록 완료', id: result.insertId });
        }

        if (!['cancel', 'makeup', 'special', 'event'].includes(event_type)) {
            return res.status(400).json({ error: 'event_type이 유효하지 않습니다.' });
        }

        if (!event_date || !timetable_id) {
            return res.status(400).json({ error: '이벤트 등록에 필요한 항목 누락' });
        }

        const [result] = await pool.query(`
            INSERT INTO timetable_events (timetable_id, subject_id, event_type, event_date, level, start_period, end_period, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [timetable_id, subject_id, event_type, event_date, level || null, start_period, end_period, description || '']);

        res.status(201).json({ message: '이벤트 등록 완료', id: result.insertId });

    } catch (err) {
        console.error('❌ createTimetable 오류:', err);
        res.status(500).json({ message: '서버 오류 발생' });
    }
};

// 📌 정규 시간표 수정
exports.updateTimetable = async (req, res) => {
    const { id } = req.params;
    const {
        year, level, subject_id, room, description,
        day, start_period, end_period, professor_name
    } = req.body;

    try {
        const [result] = await pool.query(`
            UPDATE timetables
            SET year = ?, level = ?, subject_id = ?, room = ?, description = ?,
                day = ?, start_period = ?, end_period = ?, professor_name = ?
            WHERE id = ?
        `, [
            year, level || null, subject_id, room || '', description || '',
            day, start_period, end_period, professor_name || null, id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '해당 시간표를 찾을 수 없습니다.' });
        }

        res.json({ message: '정규 수업 수정 완료' });

    } catch (err) {
        console.error('❌ updateTimetable 오류:', err);
        res.status(500).json({ message: '서버 오류 발생' });
    }
};


// 📌 삭제
exports.deleteTimetable = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(`DELETE FROM timetables WHERE id = ?`, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '시간표가 존재하지 않습니다' });
        }
        res.json({ message: '삭제 완료' });
    } catch (err) {
        console.error('❌ deleteTimetable 오류:', err);
        res.status(500).json({ message: '서버 오류 발생' });
    }
};
