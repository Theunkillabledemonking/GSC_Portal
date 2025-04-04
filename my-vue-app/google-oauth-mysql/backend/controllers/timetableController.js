const dayjs = require("dayjs");
const pool = require("../config/db");
const subjectController = require("./subjectController");
const { getPublicHolidaysInRangeWithFallback } = require('../services/holidayService');

// ✅ 요일 매핑 - 한글 + 영어 지원
function mapDayOfWeek(day) {
    return {
        "일": 0, "월": 1, "화": 2, "수": 3, "목": 4, "금": 5, "토": 6,
        "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6
    }[day] ?? null;
}

// ✅ 시간표를 실제 날짜로 확장
function expandTimetableToDates(timetable, startDate, endDate) {
    const result = [];
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const dayOfWeek = mapDayOfWeek(timetable.day);

    for (let date = start; date.isBefore(end) || date.isSame(end); date = date.add(1, "day")) {
        if (date.day() === dayOfWeek) {
            result.push({ ...timetable, date: date.format("YYYY-MM-DD"), day: timetable.day });
        }
    }

    return result;
}

// ✅ 교시 타임맵 로드
async function getPeriodMap() {
    const [rows] = await pool.query(`SELECT * FROM period_time_map`);
    return Object.fromEntries(rows.map(p => [p.period, p]));
}

// ------------------ 과목 ------------------

exports.getSubjects = async (req, res) => subjectController.getSubjects(req, res);
exports.getSubjectsByYear = async (req, res) => subjectController.getSubjectsByYear(req, res);

// ------------------ 정규 시간표 조회 ------------------

exports.getTimetables = async (req, res) => {
    const { year, semester, level } = req.query;

    try {
        const params = [year, semester];
        let query = `
            SELECT t.*, s.name AS subject_name
            FROM timetables t
                     LEFT JOIN subjects s ON t.subject_id = s.id
            WHERE t.year = ? AND t.semester = ? AND t.is_special_lecture = 0
        `;

        if (level) {
            query += ` AND (t.level = ? OR t.level IS NULL)`;
            params.push(level);
        }

        console.log("📥 [getTimetables] params:", { year, semester, level });

        const [rows] = await pool.query(query, params);
        const periodMap = await getPeriodMap();

        const formatted = rows.map(t => ({
            ...t,
            subject_name: t.subject_name || "미지정 과목",
            professor_name: t.professor_name || "미지정 교수",
            start_time: periodMap[t.start_period]?.start_time,
            end_time: periodMap[t.end_period]?.end_time
        }));

        res.json({ timetables: formatted });
    } catch (err) {
        console.error("❌ getTimetables 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

// ------------------ 특강 조회 ------------------

exports.getSpecialLectures = async (req, res) => {
    const { level, start_date, end_date } = req.query;

    try {
        console.log("📥 [getSpecialLectures] params:", { level, start_date, end_date });

        const [specials] = await pool.query(`
            SELECT t.*, s.name AS subject_name
            FROM timetables t
                     LEFT JOIN subjects s ON t.subject_id = s.id
            WHERE t.is_special_lecture = 1
              AND (t.level = ? OR t.level IS NULL)
        `, [level]);

        const periodMap = await getPeriodMap();
        const expanded = [];

        for (const t of specials) {
            const dates = expandTimetableToDates(t, start_date, end_date);
            for (const e of dates) {
                expanded.push({
                    ...e,
                    subject_name: t.subject_name || "미지정 과목",
                    professor_name: t.professor_name || "미지정 교수",
                    start_time: periodMap[e.start_period]?.start_time || '09:00',
                    end_time: periodMap[e.end_period]?.end_time || '18:00',
                });
            }
        }

        res.json(expanded);
    } catch (err) {
        console.error("❌ getSpecialLectures 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

// ------------------ 시간표 + 이벤트 + 공휴일 ------------------

exports.getTimetableWithEvents = async (req, res) => {
    const {
        year,
        semester,
        start_date,
        end_date,
        level,
        group_level = 'A',
        type = 'all'
    } = req.query;

    console.log("📥 [getTimetableWithEvents] params:", {
        year,
        semester,
        start_date,
        end_date,
        level,
        group_level
    });

    try {
        const holidays = await getPublicHolidaysInRangeWithFallback(start_date, end_date);
        const periodMap = await getPeriodMap();

        const [regulars] = await pool.query(`
            SELECT t.*, s.name AS subject_name
            FROM timetables t
                     LEFT JOIN subjects s ON t.subject_id = s.id
            WHERE t.year = ? AND t.semester = ? AND t.is_special_lecture = 0
        `, [year, semester]);

        const [specials] = await pool.query(`
            SELECT t.*, s.name AS subject_name
            FROM timetables t
                     LEFT JOIN subjects s ON t.subject_id = s.id
            WHERE t.semester = ? AND t.is_special_lecture = 1
              AND (t.level = ? OR t.level IS NULL)
              AND (t.group_levels IS NULL OR JSON_CONTAINS(t.group_levels, JSON_QUOTE(?)))
        `, [semester, level, group_level]);

        const [events] = await pool.query(`
            SELECT e.*, s.name AS subject_name
            FROM timetable_events e
                     LEFT JOIN subjects s ON e.subject_id = s.id
            WHERE e.event_date BETWEEN ? AND ?
              AND (
                e.year = ? OR (
                    e.level = ? AND (e.group_levels IS NULL OR JSON_CONTAINS(e.group_levels, JSON_QUOTE(?)))
                    )
                )
        `, [start_date, end_date, year, level, group_level]);

        let allLectures = [];
        if (type === 'regular') allLectures = regulars;
        else if (type === 'special') allLectures = specials;
        else allLectures = [...regulars, ...specials];

        const expandedTimetables = [];

        for (const t of allLectures) {
            const dates = expandTimetableToDates(t, start_date, end_date);

            for (const e of dates) {
                const isCancelled = events.some(ev =>
                    ev.event_type === 'cancel' &&
                    ev.event_date === e.date &&
                    (ev.timetable_id === t.id ||
                        (!ev.timetable_id && ev.subject_id === t.subject_id &&
                            !(ev.end_period < t.start_period || ev.start_period > t.end_period)))
                );

                expandedTimetables.push({
                    ...e,
                    event_type: isCancelled ? 'cancel' : 'regular',
                    isCancelled,
                    start_time: periodMap[e.start_period]?.start_time || '09:00',
                    end_time: periodMap[e.end_period]?.end_time || '18:00',
                });
            }
        }

        // 📌 기타 이벤트 추가
        for (const ev of events) {
            if (["makeup", "special", "event"].includes(ev.event_type)) {
                expandedTimetables.push({
                    id: `event-${ev.id}`,
                    date: ev.event_date,
                    day: dayjs(ev.event_date).format("dd"),
                    subject_name: ev.subject_name || "이벤트",
                    professor_name: ev.professor_name || "",
                    room: ev.room || "",
                    description: ev.description || "",
                    start_period: ev.start_period,
                    end_period: ev.end_period,
                    start_time: periodMap[ev.start_period]?.start_time || "09:00",
                    end_time: periodMap[ev.end_period]?.end_time || "18:00",
                    event_type: ev.event_type
                });
            }
        }

        // 🎌 공휴일도 같이 출력
        for (const holiday of holidays) {
            expandedTimetables.push({
                id: `holiday-${holiday}`,
                date: holiday,
                subject_name: "공휴일",
                professor_name: "",
                room: "",
                description: "공휴일",
                start_period: 1,
                end_period: 9,
                start_time: "09:00",
                end_time: "18:00",
                event_type: "holiday",
                day: dayjs(holiday).format("dd")
            });
        }

        res.json({ timetables: expandedTimetables, events, holidays });
    } catch (err) {
        console.error("❌ getTimetableWithEvents 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

// ------------------ 시간표 CRUD (개선 버전) ------------------

exports.createTimetable = async (req, res) => {
    console.log("✅ [createTimetable] 요청 body:", req.body);

    const {
        year, level, subject_id, room, description,
        day, start_period, end_period,
        professor_name, semester,
        is_special_lecture = 0
    } = req.body;

    // ✅ 필수값 검사
    if (!year || !semester || !day || !start_period || !end_period || !subject_id) {
        return res.status(400).json({
            status: "error",
            message: "필수 필드가 누락되었습니다.",
            missing: { year, semester, day, start_period, end_period, subject_id }
        });
    }

    try {
        const [result] = await pool.query(`
            INSERT INTO timetables (
                year, level, subject_id, room, description,
                day, start_period, end_period, professor_name, semester, is_special_lecture
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            year, level || null, subject_id, room || '', description || '',
            day, start_period, end_period, professor_name || '', semester, is_special_lecture
        ]);

        res.status(201).json({
            status: "success",
            message: "시간표 등록 완료",
            data: { id: result.insertId }
        });
    } catch (err) {
        console.error("❌ createTimetable 오류:", err);
        res.status(500).json({ status: "error", message: "서버 오류 발생" });
    }
};

exports.updateTimetable = async (req, res) => {
    const { id } = req.params;
    const {
        year, level, subject_id, room, description,
        day, start_period, end_period, professor_name, semester,
        is_special_lecture = 0
    } = req.body;

    // ✅ 필수값 검사
    if (!id || !year || !semester || !day || !start_period || !end_period || !subject_id) {
        return res.status(400).json({
            status: "error",
            message: "필수 필드가 누락되었습니다.",
            missing: { id, year, semester, day, start_period, end_period, subject_id }
        });
    }

    try {
        const [result] = await pool.query(`
            UPDATE timetables SET
                                  year = ?, level = ?, subject_id = ?, room = ?, description = ?,
                                  day = ?, start_period = ?, end_period = ?, professor_name = ?,
                                  semester = ?, is_special_lecture = ?
            WHERE id = ?
        `, [
            year, level || null, subject_id, room || '', description || '',
            day, start_period, end_period, professor_name || '',
            semester, is_special_lecture, id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: "error",
                message: "해당 시간표를 찾을 수 없습니다."
            });
        }

        res.status(200).json({
            status: "success",
            message: "시간표 수정 완료",
            data: { id }
        });
    } catch (err) {
        console.error("❌ updateTimetable 오류:", err);
        res.status(500).json({ status: "error", message: "서버 오류 발생" });
    }
};

exports.deleteTimetable = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            status: "error",
            message: "ID 값이 필요합니다."
        });
    }

    try {
        const [result] = await pool.query(`DELETE FROM timetables WHERE id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: "error",
                message: "시간표가 존재하지 않습니다"
            });
        }

        res.status(200).json({
            status: "success",
            message: "삭제 완료",
            data: { id }
        });
    } catch (err) {
        console.error("❌ deleteTimetable 오류:", err);
        res.status(500).json({ status: "error", message: "서버 오류 발생" });
    }
};
