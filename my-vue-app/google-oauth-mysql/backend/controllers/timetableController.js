const axios = require("axios");
const dayjs = require("dayjs");
const pool = require("../config/db");
const subjectController = require("./subjectController");

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
            result.push({ ...timetable, date: date.format("YYYY-MM-DD") });
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
    const { year, level } = req.query;

    try {
        const [timetables] = await pool.query(`
      SELECT t.*, s.name AS subject_name
      FROM timetables t
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE t.year = ?
        AND t.is_special_lecture = 0
          ${level ? "AND (t.level = ? OR t.level IS NULL)" : ""}
    `, level ? [year, level] : [year]);

        const periodMap = await getPeriodMap();

        const formatted = timetables.map(t => ({
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
    const { year, level, start_date, end_date } = req.query;

    try {
        // 1️⃣ 공휴일 API
        const holidayRes = await axios.get(`${process.env.KOREA_HOLIDAY_API_URL}`, {
            params: {
                ServiceKey: process.env.KOREA_HOLIDAY_KEY,
                year,
                month: "",
                _type: "json"
            }
        });
        const holidays = parseHolidays(holidayRes); // ex) ["2025-04-08", ...]

        // 2️⃣ 정규 수업 (is_special_lecture = 0)
        const [regulars] = await pool.query(`
            SELECT t.*, s.name AS subject_name
            FROM timetables t
                     LEFT JOIN subjects s ON t.subject_id = s.id
            WHERE t.year = ?
              AND t.is_special_lecture = 0
                ${level ? "AND (t.level = ? OR t.level IS NULL)" : ""}
        `, level ? [year, level] : [year]);

        // 3️⃣ 이벤트 (보강, 휴강, 특강, 행사)
        const [events] = await pool.query(`
            SELECT e.*, s.name AS subject_name
            FROM timetable_events e
                     LEFT JOIN subjects s ON e.subject_id = s.id
            WHERE e.event_date BETWEEN ? AND ?
                ${level ? "AND (e.level = ? OR e.level IS NULL)" : ""}
        `, level ? [start_date, end_date, level] : [start_date, end_date]);

        // 4️⃣ 교시 → 시간 변환
        const periodMap = await getPeriodMap();

        // 5️⃣ 정규 수업 확장 + 휴강 처리
        const expandedTimetables = [];

        for (const t of regulars) {
            const expandedDates = expandTimetableToDates(t, start_date, end_date);
            for (const e of expandedDates) {
                const isCancelled = events.some(ev =>
                    ev.event_type === "cancel" &&
                    ev.timetable_id === t.id &&
                    ev.event_date === e.date
                );

                expandedTimetables.push({
                    ...e,
                    start_time: periodMap[e.start_period]?.start_time || "09:00",
                    end_time: periodMap[e.end_period]?.end_time || "18:00",
                    event_type: isCancelled ? "cancel" : "regular",
                    isCancelled
                });
            }
        }

        // 6️⃣ 이벤트 항목 추가
        for (const ev of events) {
            const base = {
                id: `${ev.event_type}-${ev.id}`,
                date: ev.event_date,
                subject_name: ev.subject_name || "이벤트 과목",
                professor_name: ev.professor_name || "",
                room: ev.room || "-",
                description: ev.description || "",
                start_period: ev.start_period,
                end_period: ev.end_period,
                start_time: periodMap[ev.start_period]?.start_time || "09:00",
                end_time: periodMap[ev.end_period]?.end_time || "18:00",
                event_type: ev.event_type,
                level: ev.level || null,
                day: dayjs(ev.event_date).format('dd') // 요일 문자: '월', '화' 등
            };

            // 보강/특강/행사는 직접 추가 (휴강은 위에서 처리했음)
            if (["makeup", "special", "event"].includes(ev.event_type)) {
                expandedTimetables.push(base);
            }
        }

        // 7️⃣ 공휴일 추가
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
                day: dayjs(holiday).format('dd')
            });
        }

        // 8️⃣ 응답
        res.json({
            timetables: expandedTimetables,
            events,
            holidays
        });

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
        professor_name,
        is_special_lecture = 0
    } = req.body;

    try {
        const [result] = await pool.query(`
      INSERT INTO timetables (
        year, level, subject_id, room, description,
        day, start_period, end_period, professor_name, is_special_lecture
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            year, level || null, subject_id, room || '', description || '',
            day, start_period, end_period, professor_name || '', is_special_lecture
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
