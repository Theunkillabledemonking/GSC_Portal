const axios = require("axios");
const dayjs = require("dayjs");
const pool = require("../config/db");
const subjectController = require("./subjectController");
const { getPublicHolidaysInRangeWithFallback } = require('./holidayController');

// ------------------ 유틸 함수 ------------------

// 🔁 요일 한글 ➜ 숫자 (0: 일 ~ 6: 토)
function mapDayOfWeek(day) {
    return { "일": 0, "월": 1, "화": 2, "수": 3, "목": 4, "금": 5, "토": 6 }[day] ?? null;
}

// 🔁 요일 ➜ 날짜별로 확장
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

// 🔁 교시 ➜ 시간 매핑
async function getPeriodMap() {
    const [rows] = await pool.query(`SELECT * FROM period_time_map`);
    return Object.fromEntries(rows.map(p => [p.period, p]));
}

// 🔁 공휴일 API 응답 파싱
function parseHolidays(holidayRes) {
    return (holidayRes.data.response?.body?.items?.item || []).map(item =>
        item.locdate.toString().replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
    );
}

// ------------------ 과목 ------------------

exports.getSubjects = async (req, res) => subjectController.getSubjects(req, res);
exports.getSubjectsByYear = async (req, res) => subjectController.getSubjectsByYear(req, res);

// ------------------ 시간표 조회 ------------------

exports.getTimetables = async (req, res) => {
    const { year, semester, grade, level, group_level } = req.query;

    try {
        const [rows] = await pool.query(`
            SELECT t.*, s.name AS subject_name
            FROM timetables t
                     LEFT JOIN subjects s ON t.subject_id = s.id
            WHERE t.year = ?
              AND t.semester = ?
              AND (
                (t.is_special_lecture = 0 AND t.grade = ?)
                    OR
                (t.is_special_lecture = 1 AND t.level = ?
                    AND (
                     t.group_levels IS NULL OR JSON_CONTAINS(t.group_levels, JSON_QUOTE(?))
                     )
                    )
                )
            ORDER BY t.day, t.start_period
        `, [year, semester, grade, level, group_level]);

        const periodMap = await getPeriodMap(); // 기존 유틸 사용

        const formatted = rows.map(t => ({
            ...t,
            subject_name: t.subject_name || "미지정 과목",
            professor_name: t.professor_name || "미지정 교수",
            start_time: periodMap[t.start_period]?.start_time,
            end_time: periodMap[t.end_period]?.end_time,
        }));

        res.json({ timetables: formatted });
    } catch (err) {
        console.error("❌ getTimetables 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

// 🔍 특강 시간표
exports.getSpecialLectures = async (req, res) => {
    const { level, start_date, end_date } = req.query;

    try {
        const [specials] = await pool.query(`
            SELECT t.*, s.name AS subject_name
            FROM timetables t
                     LEFT JOIN subjects s ON t.subject_id = s.id
            WHERE t.is_special_lecture = 1
                ${level ? "AND (t.level = ? OR t.level IS NULL)" : ""}
            ORDER BY t.day, t.start_period
        `, level ? [level] : []);

        const periodMap = await getPeriodMap();

        const expanded = [];

        for (const t of specials) {
            const expandedDates = expandTimetableToDates(t, start_date, end_date);

            for (const e of expandedDates) {
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

// 🔍 주간 시간표 + 이벤트 + 공휴일
exports.getTimetableWithEvents = async (req, res) => {
    const year = Number(req.query.year);
    const {
        semester,
        start_date,
        end_date,
        grade,
        level,
        group_level
    } = req.query;

    try {
        // ✅ 공휴일 조회 (캐시 or API)
        const holidayRes = await axios.get(process.env.KOREA_HOLIDAY_API_URL, {
            params: {
                ServiceKey: process.env.KOREA_HOLIDAY_KEY,
                year,
                _type: "json"
            }
        });

        const holidays = await getPublicHolidaysInRangeWithFallback(start_date, end_date);

        const periodMap = await getPeriodMap(); // {1: {start_time, end_time}, ...}

        // ✅ 정규 수업 조회 (grade 기반)
        const [regulars] = await pool.query(`
            SELECT t.*, s.name AS subject_name
            FROM timetables t
            LEFT JOIN subjects s ON t.subject_id = s.id
            WHERE t.year = ?
              AND t.semester = ?
              AND t.is_special_lecture = 0
              AND t.grade = ?
        `, [year, semester, grade]);

        // ✅ 특강 수업 조회 (level + group_level 조건)
        const [specials] = await pool.query(`
            SELECT t.*, s.name AS subject_name
            FROM timetables t
            LEFT JOIN subjects s ON t.subject_id = s.id
            WHERE t.year = ?
              AND t.semester = ?
              AND t.is_special_lecture = 1
              AND t.level = ?
              AND (t.group_levels IS NULL OR JSON_CONTAINS(t.group_levels, JSON_QUOTE(?)))
        `, [year, semester, level, group_level]);

        const allLectures = [...regulars, ...specials];

        // ✅ 이벤트 조회 (grade OR level + group_levels 대응)
        const [events] = await pool.query(`
            SELECT e.*, s.name AS subject_name
            FROM timetable_events e
            LEFT JOIN subjects s ON e.subject_id = s.id
            WHERE e.event_date BETWEEN ? AND ?
              AND (
                  e.grade = ? OR
                  (
                      e.level = ?
                      AND (e.group_levels IS NULL OR JSON_CONTAINS(e.group_levels, JSON_QUOTE(?)))
                  )
              )
        `, [start_date, end_date, grade, level, group_level]);

        // ✅ 정규/특강 확장 & 휴강/보강/행사 반영
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

        // ✅ 이벤트 직접 등록된 수업 (makeup, special, event)
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

        // ✅ 공휴일 추가
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

// ------------------ 시간표 CRUD ------------------

// ✅ 생성
exports.createTimetable = async (req, res) => {
    const {
        year, level, subject_id, room, description,
        day, start_period, end_period,
        professor_name, semester,
        is_special_lecture = 0
    } = req.body;

    try {
        const [result] = await pool.query(`
      INSERT INTO timetables (
        year, level, subject_id, room, description,
        day, start_period, end_period, professor_name, semester, is_special_lecture
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            year, level || null, subject_id, room || '', description || '',
            day, start_period, end_period, professor_name || '', semester, is_special_lecture
        ]);

        res.status(201).json({ message: "정규 수업 등록 완료", id: result.insertId });
    } catch (err) {
        console.error("❌ createTimetable 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

// ✏️ 수정
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
            day, start_period, end_period, professor_name || '', id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "해당 시간표를 찾을 수 없습니다." });
        }

        res.json({ message: "정규 수업 수정 완료" });
    } catch (err) {
        console.error("❌ updateTimetable 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

// ❌ 삭제
exports.deleteTimetable = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query(`DELETE FROM timetables WHERE id = ?`, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "시간표가 존재하지 않습니다" });
        }
        res.json({ message: "삭제 완료" });
    } catch (err) {
        console.error("❌ deleteTimetable 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};
