// TimetableController.js -------------------------------------------------
// 전체 로직을 개선한 버전. Node.js + Express + MySQL(pool) 환경에서 동작한다.
//   1. 정규 수업 조회에서 level 필터를 제거해 "학년(year)" 기준만 적용.
//   2. 특강 조회 시 JSON_CONTAINS 로 group_levels 배열 매칭.
//   3. 요일 확장 시 day_ko(한글 요일)·day_en(영문 두 글자)·weekday_index(0‑6) 동시 제공.
//   4. getTimetableWithEvents 로직을 모듈화해 가독성 향상.
//   5. 각 함수마다 try/catch 및 상세 로그로 디버깅 편의성 강화.
// -------------------------------------------------------------------------

const dayjs = require("dayjs");
const pool = require("../config/db");
const subjectController = require("./subjectController");
const { getPublicHolidaysInRangeWithFallback } = require("../services/holidayService");

// ------------------------ 유틸리티 --------------------------------------

/**
 * 요일 문자열을 0‑6 숫자로 매핑한다.
 * 한글·영문(세 글자/두 글자) 모두 지원.
 */
function mapDayOfWeek(day) {
    return {
        "일": 0, "월": 1, "화": 2, "수": 3, "목": 4, "금": 5, "토": 6,
        "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6,
        "Su": 0,  "Mo": 1,  "Tu": 2,  "We": 3,  "Th": 4,  "Fr": 5,  "Sa": 6,
    }[day] ?? null;
}

/**
 * 주어진 기간(startDate~endDate) 동안 특정 요일 수업을 실제 날짜 배열로 확장한다.
 * 반환 객체에 day_ko / day_en / weekday_index 세 필드를 추가해
 * 프론트에서 어떤 포맷이든 바로 사용할 수 있도록 했다.
 */
function expandTimetableToDates(timetable, startDate, endDate) {
    const result = [];
    const start = dayjs(startDate).startOf('day');
    const end   = dayjs(endDate).endOf('day');
    const weekday = mapDayOfWeek(timetable.day);

    // 시작일부터 종료일까지 하루씩 순회
    for (let d = start; d.isBefore(end) || d.isSame(end, 'day'); d = d.add(1, 'day')) {
        if (d.day() === weekday) {
            result.push({
                ...timetable,
                date: d.format("YYYY-MM-DD"),
                day_ko: timetable.day,      // 예: "화"
                day_en: d.format("dd"),     // 예: "Tu"
                weekday_index: weekday,     // 0‑6
            });
        }
    }
    return result;
}

/**
 * period_time_map 테이블을 한 번 읽어 Map(period -> { start_time, end_time })으로 변환.
 */
async function getPeriodMap() {
    const [rows] = await pool.query("SELECT * FROM period_time_map");
    return Object.fromEntries(rows.map(p => [p.period, p]));
}

// ------------------------ 과목 ------------------------
exports.getSubjects = async (req, res) => subjectController.getSubjects(req, res);
exports.getSubjectsByYear = async (req, res) => subjectController.getSubjectsByYear(req, res);

// ------------------------ 정규 시간표 -----------------
/**
 * /timetables?year=2&semester=spring
 * 학년·학기 기준으로 정규 수업 목록을 반환한다.
 * ※ level 파라미터는 무시한다(정규 수업은 학년만으로 결정).
 */
exports.getTimetables = async (req, res) => {
    const { year, semester, day } = req.query;

    if (!semester) {
        return res.status(400).json({ message: "semester 파라미터 필수" });
    }

    try {
        // 기본 쿼리 구성
        let query = `
            SELECT t.*, s.name AS subject_name
            FROM timetables t
            LEFT JOIN subjects s ON t.subject_id = s.id
            WHERE t.semester = ?
            AND t.is_special_lecture = 0
        `;
        const params = [semester];

        // 학년 필터 추가 (옵션)
        if (year) {
            query += ` AND t.year = ?`;
            params.push(year);
        }

        // 요일 필터 추가 (옵션)
        if (day) {
            query += ` AND t.day = ?`;
            params.push(day);
        }

        const [rows] = await pool.query(query, params);
        const periodMap = await getPeriodMap();

        // 현재 날짜 기준으로 휴강/보강 정보 조회
        const today = dayjs().format('YYYY-MM-DD');
        const [events] = await pool.query(
            `SELECT * FROM timetable_events 
             WHERE event_date >= ? 
             AND (event_type = 'cancel' OR event_type = 'makeup')`,
            [today]
        );

        // 수업 정보에 휴강/보강 정보 추가
        const formatted = rows.map(t => {
            // 해당 수업의 휴강/보강 이벤트 찾기
            const relatedEvents = events.filter(e => 
                e.timetable_id === t.id || 
                (e.subject_id === t.subject_id && 
                 !(e.end_period < t.start_period || e.start_period > t.end_period))
            );

            return {
                ...t,
                subject_name: t.subject_name || "미지정 과목",
                professor_name: t.professor_name || "미지정 교수",
                start_time: periodMap[t.start_period]?.start_time,
                end_time: periodMap[t.end_period]?.end_time,
                events: relatedEvents.map(e => ({
                    id: e.id,
                    event_type: e.event_type,
                    event_date: e.event_date,
                    description: e.description
                }))
            };
        });

        res.json({ timetables: formatted });
    } catch (err) {
        console.error("❌ getTimetables 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

// ------------------------ 특강 -----------------------
/**
 * /special-lectures?semester=spring&level=mid&group_level=A&start_date=2025-03-01&end_date=2025-06-30
 * 레벨·그룹·학기 범위에 맞는 특강을 요일별로 날짜 확장해 반환한다.
 */
// ✅ [특강 조회 API]
exports.getSpecialLectures = async (req, res) => {
    const { level, start_date, end_date, group_level = "A", semester } = req.query;

    if (!start_date || !end_date || !semester) {
        return res.status(400).json({ message: "semester, start_date, end_date는 필수입니다." });
    }

    const ignoreLevelFilter = level === 'ALL' || !level;
    const ignoreGroupFilter = group_level === 'ALL' || !group_level;

    try {
        let query = `
            SELECT t.*, s.name AS subject_name
            FROM timetables t
                     LEFT JOIN subjects s ON t.subject_id = s.id
            WHERE t.semester = ?
              AND t.is_special_lecture = 1
        `;
        const params = [semester];

        if (!ignoreLevelFilter) {
            query += ` AND (t.level = ? OR t.level IS NULL)`;
            params.push(level);
        }

        if (!ignoreGroupFilter) {
            query += ` AND (t.group_levels IS NULL OR JSON_CONTAINS(t.group_levels, JSON_QUOTE(?)))`;
            params.push(group_level);
        }
        console.log("🔍 쿼리:", query.trim());
        console.log("🧾 파라미터:", params);

        const [specials] = await pool.query(query, params);

        const periodMap = await getPeriodMap();
        const expanded = [];

        for (const t of specials) {
            const dates = expandTimetableToDates(t, start_date, end_date);
            for (const e of dates) {
                expanded.push({
                    ...e,
                    subject_name: t.subject_name || "미지정 과목",
                    professor_name: t.professor_name || "미지정 교수",
                    start_time: periodMap[e.start_period]?.start_time || "09:00",
                    end_time: periodMap[e.end_period]?.end_time || "18:00",
                    event_type: "special",
                });
            }
        }

        console.log(`📦 반환 특강 개수: ${expanded.length}`);
        res.json(expanded);

    } catch (err) {
        console.error("❌ getSpecialLectures 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

// ------------------------ 통합 조회 ------------------
/**
 * /timetable-with-events
 * 정규 + 특강 + 이벤트 + 공휴일을 한 번에 반환한다.
 * 프론트에서 event_type 우선순위로 셀 겹침 처리.
 */
exports.getTimetableWithEvents = async (req, res) => {
    const {
        year,
        semester,
        start_date,
        end_date,
        level,
        group_level = "A",
        type = "all"
    } = req.query;

    if (!year || !semester || !start_date || !end_date) {
        return res.status(400).json({ message: "필수 파라미터 누락" });
    }

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
            WHERE t.semester = ?
              AND t.is_special_lecture = 1
              AND (t.level = ? OR t.level IS NULL)
              AND (t.group_levels IS NULL OR JSON_CONTAINS(t.group_levels, JSON_QUOTE(?)))
        `, [semester, level, group_level]);

        const [events] = await pool.query(`
            SELECT e.*, s.name AS subject_name,
                   DATE_FORMAT(e.event_date, '%Y-%m-%d') AS event_date_local,
                   t.day AS original_day,
                   t.year AS original_year, 
                   t.level AS original_level, 
                   t.start_period AS original_start_period,
                   t.end_period AS original_end_period,
                   t.professor_name AS original_professor,
                   t.subject_id AS original_subject_id,
                   t.room AS original_room
            FROM timetable_events e
            LEFT JOIN subjects s ON e.subject_id = s.id
            LEFT JOIN timetables t ON e.timetable_id = t.id
            WHERE DATE(e.event_date) BETWEEN ? AND ?
              AND (
                  (e.event_type IN ('cancel', 'makeup') AND (
                      (t.is_special_lecture = 0 AND t.year = ?) OR
                      (t.is_special_lecture = 1 AND (t.level = ? OR t.level IS NULL))
                  )) OR
                  (e.event_type IN ('short_lecture', 'event') AND (
                      (e.year = ? OR e.year IS NULL) AND (e.level = ? OR e.level IS NULL)
                  ))
              )
              AND (
                  e.event_type IN ('cancel', 'makeup') OR
                  e.group_levels IS NULL OR e.group_levels = '[]' OR 
                  JSON_CONTAINS(e.group_levels, JSON_QUOTE(?))
              )
        `, [start_date, end_date, year, level, year, level, group_level]);

        const cancelMap = new Map();
        for (const ev of events) {
            if (ev.event_type === 'cancel') {
                const date = ev.event_date_local;
                if (!cancelMap.has(date)) cancelMap.set(date, new Set());
                cancelMap.get(date).add(ev.timetable_id);
            }
        }

        const baseLectures = (type === "regular")
            ? regulars : (type === "special")
                ? specials : [...regulars, ...specials];

        const result = [];
        const pushedEventSet = new Set();

        for (const lecture of baseLectures) {
            const dates = expandTimetableToDates(lecture, start_date, end_date);
            for (const instance of dates) {
                const isCancelled = cancelMap.get(instance.date)?.has(lecture.id);

                if (isCancelled) {
                    const cancelEvent = events.find(e =>
                        e.event_type === 'cancel' &&
                        e.event_date_local === instance.date &&
                        e.timetable_id === lecture.id
                    );

                    const dateValue = cancelEvent.event_date_local || cancelEvent.event_date || instance.date || null;

                    if (cancelEvent && !pushedEventSet.has(cancelEvent.id)) {
                        pushedEventSet.add(cancelEvent.id);
                        result.push({
                            ...instance,
                            id: `event-${cancelEvent.id}`,
                            event_type: "cancel",
                            date: dateValue,
                            description: cancelEvent.description || "휴강",
                            isCancelled: true,
                            priority: 1,
                            original_class: {
                                day: cancelEvent.original_day,
                                start_period: cancelEvent.original_start_period,
                                end_period: cancelEvent.original_end_period,
                                year: cancelEvent.original_year,
                                level: cancelEvent.original_level,
                                room: cancelEvent.original_room,
                                professor_name: cancelEvent.original_professor,
                                subject_id: cancelEvent.original_subject_id
                            }
                        });
                    }
                } else {
                    result.push({
                        ...instance,
                        id: lecture.id,
                        event_type: lecture.is_special_lecture ? "special" : "regular",
                        subject_name: lecture.subject_name || "미지정",
                        professor_name: lecture.professor_name || "",
                        room: lecture.room || "",
                        start_time: periodMap[lecture.start_period]?.start_time || "09:00",
                        end_time: periodMap[lecture.end_period]?.end_time || "18:00",
                        isCancelled: false,
                        priority: lecture.is_special_lecture ? 3 : 5
                    });
                }
            }
        }

        for (const ev of events) {
            const key = `event-${ev.id}`;
            if (pushedEventSet.has(ev.id)) continue;

            result.push({
                id: key,
                event_type: ev.event_type,
                date: ev.event_date_local,
                subject_name: ev.subject_name || "미지정",
                professor_name: ev.professor_name || "",
                room: ev.room || "",
                description: ev.description || "",
                start_period: ev.start_period || 1,
                end_period: ev.end_period || 1,
                start_time: periodMap[ev.start_period]?.start_time || "09:00",
                end_time: periodMap[ev.end_period]?.end_time || "18:00",
                year: ev.original_year || ev.year || year,
                level: ev.original_level || ev.level || level,
                isCancelled: ev.event_type === "cancel",
                priority: {
                    cancel: 1,
                    makeup: 2,
                    short_lecture: 2,
                    event: 4
                }[ev.event_type] || 99,
                original_class: ev.event_type === 'cancel' || ev.event_type === 'makeup' ? {
                    day: ev.original_day,
                    start_period: ev.original_start_period,
                    end_period: ev.original_end_period,
                    year: ev.original_year,
                    level: ev.original_level,
                    room: ev.original_room,
                    professor_name: ev.original_professor,
                    subject_id: ev.original_subject_id
                } : null
            });
        }

        for (const holiday of holidays) {
            result.push({
                id: `holiday-${holiday}`,
                date: holiday,
                event_type: "holiday",
                subject_name: "공휴일",
                description: "공휴일",
                start_period: 1,
                end_period: 9,
                start_time: "09:00",
                end_time: "18:00",
                day_ko: dayjs(holiday).format("dd"),
                priority: 0
            });
        }

        res.json({ timetables: result, events, holidays });
    } catch (err) {
        console.error("❌ getTimetableWithEvents 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};


// ------------------------ CRUD -----------------------
exports.createTimetable = async (req, res) => {
    const {
        year, level, subject_id, room = "", description = "",
        day, start_period, end_period,
        professor_name = "", semester,
        is_special_lecture = 0,
        group_levels = []  // 👈 여기를 기본 빈 배열로 받기
    } = req.body;

    if (!year || !semester || !day || !start_period || !end_period || !subject_id) {
        return res.status(400).json({ message: "필수 필드가 누락되었습니다." });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO timetables (
                year, level, subject_id, room, description,
                day, start_period, end_period, professor_name, semester, is_special_lecture, group_levels
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                year, level || null, subject_id, room, description,
                day, start_period, end_period, professor_name, semester,
                is_special_lecture,
                group_levels.length ? JSON.stringify(group_levels) : null // ✅ 핵심
            ]
        );

        res.status(201).json({ status: "success", message: "시간표 등록 완료", data: { id: result.insertId } });
    } catch (err) {
        console.error("❌ createTimetable 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

exports.updateTimetable = async (req, res) => {
    const { id } = req.params;
    const {
        year, level, subject_id, room = "", description = "",
        day, start_period, end_period,
        professor_name = "", semester,
        is_special_lecture = 0,
    } = req.body;

    if (!id || !year || !semester || !day || !start_period || !end_period || !subject_id) {
        return res.status(400).json({ message: "필수 필드 누락" });
    }

    try {
        const [result] = await pool.query(
            `UPDATE timetables SET
                                   year = ?, level = ?, subject_id = ?, room = ?, description = ?,
                                   day = ?, start_period = ?, end_period = ?, professor_name = ?,
                                   semester = ?, is_special_lecture = ?
             WHERE id = ?`,
            [year, level || null, subject_id, room, description,
                day, start_period, end_period, professor_name,
                semester, is_special_lecture, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "존재하지 않는 시간표" });
        }

        res.json({ status: "success", message: "수정 완료", data: { id } });
    } catch (err) {
        console.error("❌ updateTimetable 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

exports.deleteTimetable = async (req, res) => {
    const { id } = req.params;

    if (!id) return res.status(400).json({ message: "ID 필요" });

    try {
        const [result] = await pool.query("DELETE FROM timetables WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "삭제할 수업이 없음" });
        }

        res.json({ status: "success", message: "삭제 완료", data: { id } });
    } catch (err) {
        console.error("❌ deleteTimetable 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};
