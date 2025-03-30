const axios = require("axios");
const dayjs = require("dayjs");
const pool = require("../config/db");
const subjectController = require("./subjectController");

function mapDayOfWeek(day) {
    return { "일": 0, "월": 1, "화": 2, "수": 3, "목": 4, "금": 5, "토": 6 }[day] ?? null;
}

// 🔁 요일 ➜ 날짜 반복 생성
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

async function getPeriodMap() {
    const [rows] = await pool.query(`SELECT * FROM period_time_map`);
    return Object.fromEntries(rows.map(p => [p.period, p]));
}

function parseHolidays(holidayRes) {
    return (holidayRes.data.response?.body?.items?.item || []).map(item =>
        item.locdate.toString().replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
    );
}

exports.getSubjects = async (req, res) => subjectController.getSubjects(req, res);
exports.getSubjectsByYear = async (req, res) => subjectController.getSubjectsByYear(req, res);

// 📌 정규 수업 목록
exports.getTimetables = async (req, res) => {
    const { level } = req.query;
    try {
        const [timetables] = await pool.query(`
            SELECT t.*, s.name AS subject_name, s.professor_name
            FROM timetables t
                     LEFT JOIN subjects s ON t.subject_id = s.id
                ${level ? "WHERE t.level = ?" : ""}
            ORDER BY t.day, t.start_period
        `, level ? [level] : []);

        const periodMap = await getPeriodMap();

        const formatted = timetables.map(t => ({
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

// 📌 정규 + 이벤트 + 공휴일
exports.getTimetableWithEvents = async (req, res) => {
    const { year, start_date, end_date, level } = req.query;

    try {
        // 1️⃣ 공휴일
        const holidayRes = await axios.get(`${process.env.KOREA_HOLIDAY_API_URL}`, {
            params: {
                ServiceKey: process.env.KOREA_HOLIDAY_KEY,
                year,
                month: "",
                _type: "json"
            }
        });
        const holidays = parseHolidays(holidayRes);

        // 2️⃣ 정규 수업
        const [timetables] = await pool.query(`
            SELECT t.*, s.name AS subject_name
            FROM timetables t
                     LEFT JOIN subjects s ON t.subject_id = s.id
            WHERE t.year = ?
                ${level ? "AND t.level = ?" : ""}
        `, level ? [year, level] : [year]);

        // 3️⃣ 이벤트
        const [events] = await pool.query(`
            SELECT * FROM timetable_events
            WHERE event_date BETWEEN ? AND ?
                ${level ? "AND level = ?" : ""}
        `, level ? [start_date, end_date, level] : [start_date, end_date]);

        // 4️⃣ 교시 시간 매핑
        const periodMap = await getPeriodMap();

        // 5️⃣ 정규 수업 ➜ 날짜별 확장
        const expandedTimetables = [];

        for (const t of timetables) {
            const expanded = expandTimetableToDates(t, start_date, end_date);
            for (const e of expanded) {
                e.start_time = periodMap[e.start_period]?.start_time || "09:00";
                e.end_time = periodMap[e.end_period]?.end_time || "18:00";
                e.isCancelled = events.some(ev => ev.event_type === "cancel" && ev.timetable_id === t.id && ev.event_date === e.date);
            }
            expandedTimetables.push(...expanded);
        }

        // 6️⃣ 응답
        res.json({ timetables: expandedTimetables, events, holidays });

    } catch (err) {
        console.error("❌ getTimetableWithEvents 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

// 📌 정규 수업 생성
exports.createTimetable = async (req, res) => {
    const {
        year, level, subject_id, room, description,
        day, start_period, end_period,
        professor_name
    } = req.body;

    try {
        const [result] = await pool.query(`
            INSERT INTO timetables (year, level, subject_id, room, description, day, start_period, end_period, professor_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [year, level || null, subject_id, room || '', description || '', day, start_period, end_period, professor_name || '']);

        res.status(201).json({ message: "정규 수업 등록 완료", id: result.insertId });
    } catch (err) {
        console.error("❌ createTimetable 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

// 📌 정규 수업 수정
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
            return res.status(404).json({ message: "해당 시간표를 찾을 수 없습니다." });
        }

        res.json({ message: "정규 수업 수정 완료" });

    } catch (err) {
        console.error("❌ updateTimetable 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

// 📌 정규 수업 삭제
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
