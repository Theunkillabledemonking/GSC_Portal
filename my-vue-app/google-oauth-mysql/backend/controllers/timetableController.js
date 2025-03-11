// controllers/timetableController.js

// ------------------------------
// [IMPORTS & SETUP]
// ------------------------------
const pool = require('../config/db'); // MySQL 커넥션 (직접 사용 시)
const { Op } = require('sequelize');
const { Timetable, Event, Subject, User } = require('../models');
// ↑ Sequelize ORM 모델
// Timetable = 정규수업 테이블
// Event = timetable_events 테이블
const subjectController = require('./subjectController');

// ------------------------------
// [교시별 시간 표준 매핑 예시]
// ------------------------------
const periodTimeMap = {
    1: { start: '09:00', end: '09:50' },
    2: { start: '10:00', end: '10:50' },
    3: { start: '11:00', end: '11:50' },
    4: { start: '12:00', end: '12:50' },
    5: { start: '13:00', end: '13:50' },
    6: { start: '14:00', end: '14:50' },
    7: { start: '15:00', end: '15:50' },
    8: { start: '16:00', end: '16:50' },
    9: { start: '17:00', end: '17:50' },
    10: { start: '18:00', end: '18:50' },
};

// ------------------------------
// [요일 → FullCalendar dayOfWeek]
// ------------------------------
function mapDayOfWeek(day) {
    const map = {
        "일": 0, "월": 1, "화": 2, "수": 3, "목": 4, "금": 5, "토": 6
    };
    return map[day] ?? null;
}

// ------------------------------
// [과목 목록 조회 - 별도 subjectController 호출]
// ------------------------------
exports.getSubjects = async (req, res) => {
    return subjectController.getSubjects(req, res);
};

exports.getSubjectsByYear = async (req, res) => {
    const { year } = req.params;
    return subjectController.getSubjectsByYear(req, res);
};

// ------------------------------
// [정규 시간표 전체 조회 - (원하면 안 써도 됨)]
// ------------------------------
exports.getTimetables = async (req, res) => {
    try {
        const timetables = await Timetable.findAll();
        // 교시 → 시간 변환 (원하면 제거 가능)
        const formattedTimetables = timetables.map(t => {
            const { start_time, end_time } = periodTimeMap[t.start_period] || {};
            return { ...t.toJSON(), start_time, end_time };
        });
        res.status(200).json({ timetables: formattedTimetables });
    } catch (error) {
        console.error('시간표 조회 오류', error);
        res.status(500).json({ message: ' 서버 오류가 발생했습니다.' });
    }
};

// ------------------------------
// [정규수업 + 이벤트를 합쳐서 FullCalendar 형식으로 조회]
// ------------------------------
exports.getTimetableWithEvents = async (req, res) => {
    const { year, start_date, end_date } = req.query;

    try {
        // (1) year에 해당하는 Timetable 전부 조회
        const timetables = await Timetable.findAll({
            where: { year },
            include: [
                { model: Subject, attributes: ['name'], as: 'subject' },
                { model: User, attributes: ['name'], as: 'professor', required: false },
            ]
        });
        console.log("📌 📋 조회된 timetables:", JSON.stringify(timetables, null, 2));

        // (2) 이벤트 테이블에서 날짜 범위에 해당하는 레코드들
        const events = await Event.findAll({
            where: {
                event_date: { [Op.between]: [start_date, end_date] }
            }
        });
        console.log("📌 📆 조회된 events:", JSON.stringify(events, null, 2));

        // (3) 최종 FullCalendar 데이터
        let finalEvents = [];

        // 3-1) 정규수업: cancel 이벤트가 있는지에 따라 [휴강]/[정규] 설정
        timetables.forEach((t) => {
            const hasCancelEvent = events.some(e =>
                e.event_type === 'cancel' &&
                e.timetable_id === t.id &&
                e.event_date >= start_date &&
                e.event_date <= end_date
            );

            finalEvents.push({
                id: `t-${t.id}`,
                title: hasCancelEvent
                    ? `[휴강] ${t.subject?.name}`
                    : `[정규] ${t.subject?.name}`,
                daysOfWeek: [mapDayOfWeek(t.day)],
                startTime: periodTimeMap[t.start_period]?.start || "00:00",
                endTime: periodTimeMap[t.end_period]?.end || "23:59",
                backgroundColor: hasCancelEvent ? "#d3d3d3" : "#90caf9",
                extendedProps: {
                    ...t.toJSON(),
                    isCancelled: hasCancelEvent
                }
            });
        });

        // 3-2) 보강(makeup) / 특강(special) 이벤트는 별도 블록
        events.forEach(e => {
            if (e.event_type === 'makeup' || e.event_type === 'special') {
                finalEvents.push({
                    id: `e-${e.id}`,
                    title: e.event_type === 'makeup'
                        ? `보강: ${e.description || '상세정보'}`
                        : `특강: ${e.description || '상세정보'}`,
                    start: `${e.event_date}T${e.start_time || "00:00"}`,
                    end: `${e.event_date}T${e.end_time || "23:59"}`,
                    backgroundColor: e.event_type === 'makeup' ? "#4caf50" : "#ff9800",
                    extendedProps: { ...e.toJSON() }
                });
            }
        });

        console.log("📌 📊 최종 FullCalendar 데이터:", JSON.stringify(finalEvents, null, 2));
        res.status(200).json({ timetables, events: finalEvents });
    } catch (error) {
        console.error("❌ 시간표 조회 오류:", error);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

// ------------------------------
// [정규 시간표 등록 or 이벤트 생성]
// ------------------------------
exports.createTimetable = async (req, res) => {
    try {
        console.log("📌 Timetable 생성 요청:", req.body);
        const {
            year, level, subject_id, room, description,
            day, start_period, end_period,
            event_type, event_date, timetable_id
        } = req.body;

        // event_type이 'normal'이거나, 아예 안 왔으면 => 정규수업 처리
        if (!event_type || event_type === 'normal') {
            // 정규수업 등록에 필요한 필수 데이터 체크
            if (!year || !subject_id || !day || !start_period || !end_period) {
                return res.status(400).json({ error: "필수 데이터(학년, 과목, 요일, 교시)가 누락되었습니다." });
            }

            // level은 정규수업이면 DB에 null로 저장 (원하면 달리 처리 가능)
            const newTimetable = await Timetable.create({
                year,
                level: null,
                subject_id,
                room: room || '',
                description: description || '',
                day,
                start_period,
                end_period,
            });

            // 응답 후 함수 종료
            return res.status(201).json({
                message: "정규 시간표가 등록되었습니다.",
                newTimetable
            });
        }
            // --------------------------------------------------
        // 만약 event_type이 cancel/makeup/special 중 하나라면 => 이벤트 테이블에 기록
        else if (['cancel', 'makeup', 'special'].includes(event_type)) {
            // 이벤트 생성에 필요한 필수 데이터 (timetable_id, event_date 등) 체크
            if (!timetable_id) {
                return res.status(400).json({ error: "event_type이 cancel/makeup/special이면 timetable_id가 필요합니다." });
            }
            if (!event_date) {
                return res.status(400).json({ error: "이벤트 날짜(event_date)가 누락되었습니다." });
            }

            // 새 이벤트 생성
            const newEvent = await Event.create({
                timetable_id,
                subject_id,
                event_type,
                event_date,
                level: level || null,
                start_period: start_period || null,
                end_period: end_period || null,
                start_time: null,
                end_time: null,
                description: description || '',
            });

            // 응답 후 함수 종료
            return res.status(201).json({
                message: "휴강/보강/특강 이벤트가 생성되었습니다.",
                newEvent
            });
        }
            // --------------------------------------------------
        // 그 밖의 event_type → 에러
        else {
            return res.status(400).json({ error: "유효하지 않은 event_type 입니다." });
        }

    } catch (error) {
        console.error("❌ 시간표 생성 중 오류:", error);
        res.status(500).json({ error: "서버 에러 발생" });
    }
};

// ------------------------------
// [정규 시간표 수정 or 이벤트 생성]
// ------------------------------
exports.updateTimetable = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            event_type,    // normal | cancel | makeup | special
            year, level, day,
            start_period, end_period,
            subject_id, room, professor_id,
            description, event_date
        } = req.body;

        const timetable = await Timetable.findByPk(id);
        if (!timetable) {
            return res.status(404).json({ error: "해당 시간표를 찾을 수 없습니다." });
        }

        // (1) event_type이 없거나 'normal'이면 => 정규 시간표만 업데이트
        if (!event_type || event_type === 'normal') {
            await timetable.update({
                year,
                level: null, // 정규수업은 level=null로 관리
                day,
                start_period,
                end_period,
                subject_id,
                room,
                professor_id,
                description
            });
            // 응답 후 종료
            return res.status(200).json({ message: "✅ 정규 시간표가 수정되었습니다." });
        }
            // --------------------------------------------------
        // (2) event_type === 'cancel' | 'makeup' | 'special'인 경우 => Event 테이블에 새 레코드
        else if (['cancel','makeup','special'].includes(event_type)) {
            // event_date 없으면 안 됨
            if (!event_date) {
                return res.status(400).json({ error: "이벤트 날짜(event_date)가 필요합니다." });
            }
            // 새 이벤트 생성 (timetable.id와 subject_id를 연결)
            const newEvent = await Event.create({
                timetable_id: timetable.id,
                subject_id: timetable.subject_id,
                event_type,
                event_date,
                level: level || null,
                start_period,
                end_period,
                description
            });
            // 응답 후 종료
            return res.status(200).json({
                message: `✅ ${event_type} 이벤트가 생성되었습니다.`,
                newEvent
            });
        }
            // --------------------------------------------------
        // (3) 지원하지 않는 event_type
        else {
            return res.status(400).json({ error: "유효하지 않은 event_type 입니다." });
        }

    } catch (error) {
        console.error("❌ 시간표 수정 오류:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

// ------------------------------
// [정규 시간표 삭제]
// ------------------------------
exports.deleteTimetable = async (req, res) => {
    const { id } = req.params;
    try {
        const timetable = await Timetable.findByPk(id);
        if (!timetable) {
            return res.status(404).json({ error: "해당 시간표를 찾을 수 없습니다." });
        }

        // 정책상 이 timetable에 연결된 이벤트도 함께 지울지 여부는 필요에 따라 구현
        await timetable.destroy();

        return res.status(200).json({ message: "✅ 시간표가 삭제되었습니다." });
    } catch (error) {
        console.error("❌ 시간표 삭제 오류:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};
