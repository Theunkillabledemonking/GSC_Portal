// TimetableController.js -------------------------------------------------
// 전체 로직을 개선한 버전. Node.js + Express + MySQL(pool) 환경에서 동작한다.
// 변경·추가된 주요 사항
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
    const start = dayjs(startDate);
    const end   = dayjs(endDate);
    const weekday = mapDayOfWeek(timetable.day);

    for (let d = start; d.isBefore(end) || d.isSame(end); d = d.add(1, "day")) {
        if (d.day() === weekday) {
            result.push({
                ...timetable,
                date: d.format("YYYY-MM-DD"),
                day_ko: timetable.day,      // 예: "화"
                day_en: d.format("dd"),    // 예: "Tu"
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
    const { year, semester } = req.query;

    if (!year || !semester) {
        return res.status(400).json({ message: "year, semester 파라미터 필수" });
    }

    try {
        const [rows] = await pool.query(
            `SELECT t.*, s.name AS subject_name
         FROM timetables t
         LEFT JOIN subjects s ON t.subject_id = s.id
        WHERE t.year = ?
          AND t.semester = ?
          AND t.is_special_lecture = 0`,
            [year, semester]
        );

        const periodMap = await getPeriodMap();

        const formatted = rows.map(t => ({
            ...t,
            subject_name: t.subject_name || "미지정 과목",
            professor_name: t.professor_name || "미지정 교수",
            start_time: periodMap[t.start_period]?.start_time,
            end_time:   periodMap[t.end_period]?.end_time,
        }));

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
exports.getSpecialLectures = async (req, res) => {
    const { level, start_date, end_date, group_level = "A", semester } = req.query;

    if (!level || !start_date || !end_date || !semester) {
        return res.status(400).json({ message: "level, semester, start_date, end_date 파라미터 필수" });
    }

    try {
        const [specials] = await pool.query(
            `SELECT t.*, s.name AS subject_name
             FROM timetables t
                      LEFT JOIN subjects s ON t.subject_id = s.id
             WHERE t.semester = ?
               AND t.is_special_lecture = 1
               AND (t.level = ? OR t.level IS NULL)
               AND (t.group_levels IS NULL OR JSON_CONTAINS(t.group_levels, JSON_QUOTE(?)))`,
            [semester, level, group_level]
        );

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
                    end_time:   periodMap[e.end_period]?.end_time   || "18:00",
                    event_type: "special",
                });
            }
        }

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
        type = "all", // regular | special | all
    } = req.query;

    // 파라미터 최소 검증
    if (!year || !semester || !start_date || !end_date) {
        return res.status(400).json({ message: "year, semester, start_date, end_date 파라미터 필수" });
    }

    try {
        // 1) 공휴일 -------------------------------------------------------------
        const holidays = await getPublicHolidaysInRangeWithFallback(start_date, end_date);

        // 2) 기본 데이터 ---------------------------------------------------------
        const periodMap = await getPeriodMap();

        // 3) 정규 수업 (학년 기준) ----------------------------------------------
        const [regulars] = await pool.query(
            `SELECT t.*, s.name AS subject_name
             FROM timetables t
                      LEFT JOIN subjects s ON t.subject_id = s.id
             WHERE t.year = ?
               AND t.semester = ?
               AND t.is_special_lecture = 0`,
            [year, semester]
        );

        // 4) 특강 (레벨·그룹 기준) ----------------------------------------------
        const [specials] = await pool.query(
            `SELECT t.*, s.name AS subject_name
             FROM timetables t
                      LEFT JOIN subjects s ON t.subject_id = s.id
             WHERE t.semester = ?
               AND t.is_special_lecture = 1
               AND (t.level = ? OR t.level IS NULL)
               AND (t.group_levels IS NULL OR JSON_CONTAINS(t.group_levels, JSON_QUOTE(?)))`,
            [semester, level, group_level]
        );

        // 5) 이벤트 (보강·휴강·행사) -------------------------------------------
        const [events] = await pool.query(
            `SELECT e.*, s.name AS subject_name
             FROM timetable_events e
                      LEFT JOIN subjects s ON e.subject_id = s.id
             WHERE e.event_date BETWEEN ? AND ?
               AND (e.year IS NULL OR e.year = ?)
               AND (e.level IS NULL OR e.level = ?)
               AND (e.group_levels IS NULL OR JSON_CONTAINS(e.group_levels, JSON_QUOTE(?)))`,
            [start_date, end_date, year, level, group_level]
        );

        // 6) 수업 + 특강을 날짜별로 확장 ----------------------------------------
        let baseLectures = [];
        if (type === "regular")      baseLectures = regulars;
        else if (type === "special") baseLectures = specials;
        else                          baseLectures = [...regulars, ...specials];

        const expanded = [];

        for (const t of baseLectures) {
            const dates = expandTimetableToDates(t, start_date, end_date);
            for (const e of dates) {
                // 휴강(cancel) 이벤트와 충돌 검사
                const isCancelled = events.some(ev =>
                    ev.event_type === "cancel" &&
                    ev.event_date === e.date &&
                    (ev.timetable_id === t.id || (
                        !ev.timetable_id && ev.subject_id === t.subject_id &&
                        !(ev.end_period < t.start_period || ev.start_period > t.end_period)
                    ))
                );

                expanded.push({
                    ...e,
                    event_type: isCancelled ? "cancel" : "regular",
                    isCancelled,
                    start_time: periodMap[e.start_period]?.start_time || "09:00",
                    end_time:   periodMap[e.end_period]?.end_time   || "18:00",
                });
            }
        }

        // 7) 이벤트 자체(보강·특강·행사)를 push ----------------------------------
        for (const ev of events) {
            if (["makeup", "special", "event"].includes(ev.event_type)) {
                expanded.push({
                    id: `event-${ev.id}`,
                    date: ev.event_date,
                    day_ko: dayjs(ev.event_date).format("dd"),
                    subject_name: ev.subject_name || "이벤트",
                    professor_name: ev.professor_name || "",
                    room: ev.room || "",
                    description: ev.description || "",
                    start_period: ev.start_period,
                    end_period: ev.end_period,
                    start_time: periodMap[ev.start_period]?.start_time || "09:00",
                    end_time:   periodMap[ev.end_period]?.end_time   || "18:00",
                    event_type: ev.event_type,
                });
            }
        }
        // 8) 공휴일 push --------------------------------------------------------
        for (const holiday of holidays) {
            expanded.push({
                id: `holiday-${holiday}`,
                date: holiday,
                subject_name: "공휴일",
                description: "공휴일",
                start_period: 1,
                end_period: 9,
                start_time: "09:00",
                end_time: "18:00",
                event_type: "holiday",
                day_ko: dayjs(holiday).format("dd"),
            });
        }

        res.json({ timetables: expanded, events, holidays });
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
    } = req.body;

    if (!year || !semester || !day || !start_period || !end_period || !subject_id) {
        return res.status(400).json({ message: "필수 필드가 누락되었습니다." });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO timetables (
                year, level, subject_id, room, description,
                day, start_period, end_period, professor_name, semester, is_special_lecture
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [year, level || null, subject_id, room, description,
                day, start_period, end_period, professor_name, semester, is_special_lecture]
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
