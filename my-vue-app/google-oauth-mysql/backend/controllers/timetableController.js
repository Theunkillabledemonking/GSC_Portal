
// 정규 수업은 level이 Null, 이벤트(특강 등)는 level이 특정 문자열일 경우
const pool = require('../config/db'); // MYSQL 연결 유지
const { Op } = require('sequelize');
const { Timetable, Event, Subject, User } = require('../models'); // Sequelize ORM 사용
const subjectController = require('./subjectController'); // 과목 컨트롤러 가져오기

console.log("timetable 모델 확인", Timetable);


// (임시) 교시 -> 시간 변환 함수 (원치 않으면 제거)
function getClassTime(startPeriod, endPeriod) {
    // 예시 변환 로직
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

    if (!startPeriod || !endPeriod) {
        return { start_time: '', end_time: '' };
    }
    return {
        start_time: periodTimeMap[startPeriod]?.start || '',
        end_time: periodTimeMap[endPeriod]?.end || '',
    };
}

console.log("timetable 모델 확인", Timetable);


/**
 * 과목 목록 조회 (subjectController API 호출)
 * @route GET /api/timetables/subjects
 */
exports.getSubjects = async (req, res) => {
    return subjectController.getSubjects(req, res); // 과목 목록 조회 API 호출
}

/**
 * 학년별 과목 조회 (subjectController API 호출)
 * @route GET /api/timetables/subjects/:year
 */
exports.getSubjectsByYear = async (req, res) => {
    const { year } = req.params;
    return subjectController.getSubjectsByYear(req, res); // 학년별 과목 조회 API 호출
}
/**
 * 정규 시간표 조회
 */
exports.getTimetables = async (req, res) => {
    try {
        const timetables = await Timetable.findAll();

        // 교시 -> 시간 변환
        const formattedTimetables = timetables.map(timetable => {
            const timeData = getClassTime(timetable.start_period, timetable.end_period);
            return {
                ...timetable.toJSON(),
                start_time: timeData.start_time,
                end_time: timeData.end_time
            };
        });
        res.status(200).json({ timetables: formattedTimetables });
    } catch (error) {
        console.log('시간표 조회 오류', error);
        res.status(500).json({ message: ' 서버 오류가 발생했습니다.' });
    }
}


exports.getTimetableWithEvents = async (req, res) => {
    const { year, start_date, end_date } = req.query;

    const levelParam = req.query.level;
    const levelValue = (levelParam === undefined || levelParam === "") ? null : levelParam;

    const specialLevels = ['N1', 'N2', 'N3', 'TOPIK4', 'TOPIK6'];

    try {
        const timetables = await Timetable.findAll({
            where: {
                year,
                // 정규 수업은 level이 null이어야 하므로, OR 조건을 사용
                [Op.or]: [
                    { level: null },
                    { level: { [Op.in]: specialLevels } }
                ]
            },
            include: [
                { model: Subject, attributes: ['name'], as: 'subject' },
                { model: User, attributes: ['name'], as: 'professor', required: false }
            ]
        });

        // (이벤트 관련 데이터 처리 예시는 필요에 따라 추가)
        res.status(200).json({ timetables, events: [] });
    } catch (error) {
        console.error("❌ 시간표 조회 오류:", error);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

/**
 * ✅ 정규 시간표 등록
 * @route POST /api/timetables
 */
exports.createTimetable = async (req, res) => {
    try {
        console.log("📌 요청 받은 데이터:", req.body);
        // event_type이 없으면 "normal"로 처리
        const { year, level, subject_id, room, description, day, start_period, end_period, event_type } = req.body;
        const effectiveEventType = event_type || "normal";
        // 정규수업은 level을 무시하고 null로 저장
        const levelValue = effectiveEventType === "normal" ? null : level;

        // 필수 데이터 체크 (정규수업인 경우 day, start_period, end_period가 필요)
        if (!year || !subject_id || !day || !start_period || !end_period) {
            return res.status(400).json({ error: "필수 데이터가 누락되었습니다." });
        }

        // DB에 level 컬럼이 있다면 여기서 levelValue로 저장해야 함!
        const newTimetable = await Timetable.create({
            year,
            level: levelValue,  // DB 필드와 매핑
            subject_id,
            room,
            description: description || '',
            day,
            start_period,
            end_period,
        });

        res.status(201).json(newTimetable);
    } catch (error) {
        console.error("❌ 시간표 생성 중 오류:", error);
        res.status(500).json({ error: "서버 에러 발생" });
    }
};

/**
 * ✅ 정규 시간표 수정
 * @route PUT /api/timetables/:id
 */
exports.updateTimetable = async (req, res) => {
    const { id } = req.params;
    const { year, level, day, start_period, end_period, subject_id, room, professor_id } = req.body;

    try {
        const timetable = await Timetable.findByPk(id);
        if (!timetable) {
            return res.status(404).json({ error: "해당 시간표를 찾을 수 없습니다." });
        }

        await timetable.update({
            year, level, day, start_period, end_period, subject_id, room, professor_id,
        });

        res.status(200).json({ message: "✅ 시간표가 수정되었습니다." });
    } catch (error) {
        console.error("❌ 시간표 수정 오류:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/**
 * ✅ 정규 시간표 삭제
 * @route DELETE /api/timetables/:id
 */
exports.deleteTimetable = async (req, res) => {
    const { id } = req.params;

    try {
        const timetable = await Timetable.findByPk(id);
        if (!timetable) {
            return res.status(404).json({ error: "해당 시간표를 찾을 수 없습니다." });
        }

        await timetable.destroy();
        res.status(200).json({ message: "✅ 시간표가 삭제되었습니다." });
    } catch (error) {
        console.error("❌ 시간표 삭제 오류:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};