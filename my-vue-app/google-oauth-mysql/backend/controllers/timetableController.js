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

// ------------------------ 주간 시간표 이벤트 -----------------
/**
 * GET /api/timetable/events
 * 학년/레벨 기준으로 시간표 이벤트를 조회한다.
 * - 정규 수업: 학년(year) 기준
 * - 특강: 레벨(level) + 그룹(group_levels) + 외국인 대상(is_foreigner_target) 기준
 * - 공휴일: 날짜(date) 기준
 */
exports.getEvents = async (req, res) => {
    const { grade, level, week, is_foreigner } = req.query;
    
    if (!grade) {
        return res.status(400).json({ message: "grade는 필수 파라미터입니다." });
    }

    try {
        const weekStart = dayjs(week || new Date()).startOf('week');
        const weekEnd = dayjs(week || new Date()).endOf('week');
        console.log(`주 범위: ${weekStart.format('YYYY-MM-DD')} ~ ${weekEnd.format('YYYY-MM-DD')}`);
        
        // 외국인 조건 처리 (문자열을 불리언으로 변환)
        const isForeigner = is_foreigner === 'true' || is_foreigner === '1';
        
        // 1. 정규 수업 조회 (학년 기준)
        const [regulars] = await pool.query(`
            SELECT 
                t.*,
                s.name AS subject_name,
                'regular' AS event_type
            FROM timetables t
            LEFT JOIN subjects s ON t.subject_id = s.id
            WHERE t.year = ?
            AND t.is_special_lecture = 0
        `, [grade]);
        console.log(`정규 수업 조회: ${regulars.length}개`);

        // 2. 특강 조회 (레벨 + 그룹 기준)
        const [specials] = await pool.query(`
            SELECT 
                t.*,
                s.name AS subject_name,
                'special' AS event_type
            FROM timetables t
            LEFT JOIN subjects s ON t.subject_id = s.id
            WHERE t.is_special_lecture = 1
            AND (t.level = ? OR t.level IS NULL)
            AND (
                t.group_levels IS NULL 
                OR JSON_CONTAINS(t.group_levels, JSON_QUOTE(?))
            )
        `, [level || 'N1', 'A']);
        console.log(`특강 조회: ${specials.length}개`);

        // 3. 휴강/보강 이벤트 조회
        let eventsQuery = `
            SELECT e.*, s.name AS subject_name, e.event_type AS type, t.year as timetable_year
            FROM timetable_events e
            LEFT JOIN subjects s ON e.subject_id = s.id
            LEFT JOIN timetables t ON e.timetable_id = t.id
            WHERE e.event_date BETWEEN ? AND ?
        `;

        const eventsParams = [weekStart, weekEnd];

        // 학년 필터 적용 (이벤트)
        const ignoreGradeFilter = !grade;
        if (!ignoreGradeFilter) {
            eventsQuery += ` AND (t.year = ? OR e.year = ? OR (t.year IS NULL AND e.year IS NULL))`;
            eventsParams.push(grade, grade);
        }

        console.log(`🔍 이벤트 쿼리: ${eventsQuery}`);
        console.log(`🔍 이벤트 파라미터: ${eventsParams}`);

        const [events] = await pool.query(eventsQuery, eventsParams);
        console.log(`📊 이벤트 조회 결과: ${events.length}개`);

        // 4. 공휴일 조회
        const holidays = await getPublicHolidaysInRangeWithFallback(
            weekStart.format('YYYY-MM-DD'),
            weekEnd.format('YYYY-MM-DD')
        );
        console.log(`공휴일 조회: ${holidays.length}개`);

        // 5. 모든 이벤트를 요일별, 교시별로 정리
        const allEvents = [];
        
        // 정규 수업 처리
        regulars.forEach(t => {
            allEvents.push({
                id: t.id,
                event_type: t.event_type,
                day: t.day,
                start_period: t.start_period,
                end_period: t.end_period,
                subject_name: t.subject_name || "미지정 과목",
                professor_name: t.professor_name || "미지정 교수",
                room: t.room || "",
                year: parseInt(t.year),
                level: t.level,
                is_foreigner_target: false
            });
        });
        
        // 특강 처리
        specials.forEach(t => {
            allEvents.push({
                id: t.id,
                event_type: t.event_type,
                day: t.day,
                start_period: t.start_period,
                end_period: t.end_period,
                subject_name: t.subject_name || "미지정 과목",
                professor_name: t.professor_name || "미지정 교수",
                room: t.room || "",
                year: parseInt(t.year),
                level: t.level,
                is_foreigner_target: false
            });
        });
        
        // 이벤트(휴강/보강) 처리
        events.forEach(e => {
            // 이벤트 날짜로부터 요일 추출 (0: 일, 1: 월, ... 6: 토)
            const eventDate = dayjs(e.event_date);
            const dayOfWeek = eventDate.day();
            
            // 숫자 요일 인덱스를 요일 문자열로 변환
            const dayMap = {1: '월', 2: '화', 3: '수', 4: '목', 5: '금'};
            const day = dayMap[dayOfWeek] || null;
            
            if (day) { // 평일인 경우만 추가
                // 원본 수업에서 교수, 강의실 정보 가져오기
                const originalTimetable = e.timetable_id ? timetables.find(t => t.id === e.timetable_id) : null;
                
                allEvents.push({
                    id: e.id,
                    event_type: e.event_type,
                    event_date: e.event_date,
                    day: day, // 요일 추가
                    start_period: e.start_period,
                    end_period: e.end_period,
                    subject_name: e.subject_name || "미지정 과목",
                    // 교수명과 강의실 정보는 이벤트에 명시된 값이 있으면 사용, 없으면 원본 수업 정보 사용
                    professor_name: e.professor_name || (originalTimetable ? originalTimetable.professor_name : "미지정 교수"),
                    room: e.room || (originalTimetable ? originalTimetable.room : ""),
                    year: parseInt(e.year),
                    level: e.level,
                    is_foreigner_target: false,
                    description: e.description
                });
            }
        });
        
        // 공휴일 처리
        holidays.forEach(h => {
            // 공휴일 날짜로부터 요일 추출
            const holidayDate = dayjs(h.date);
            const dayOfWeek = holidayDate.day();
            
            // 숫자 요일 인덱스를 요일 문자열로 변환
            const dayMap = {1: '월', 2: '화', 3: '수', 4: '목', 5: '금'};
            const day = dayMap[dayOfWeek] || null;
            
            if (day) { // 평일 공휴일만 추가
                allEvents.push({
                    id: `holiday-${h.date}`,
                    event_type: 'holiday',
                    event_date: h.date,
                    day: day, // 요일 추가
                    title: h.name,
                    subject_name: h.name,
                    description: h.description
                });
            }
        });

        console.log(`총 이벤트 수: ${allEvents.length}개`);
        res.json(allEvents);
    } catch (err) {
        console.error("❌ getEvents 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

/**
 * 프론트엔드 레벨 코드를 백엔드 레벨 값으로 매핑
 * @param {string} frontendLevel - 프론트에서 받은 레벨 코드 (예: 'beginner', 'JLPT3' 등)
 * @returns {Array} - DB에서 사용되는 레벨 값 배열 (여러 값 매칭 가능)
 */
function mapFrontendLevelToDBLevels(frontendLevel) {
  if (!frontendLevel || frontendLevel === 'ALL') return [];
  
  // 다양한 네이밍 컨벤션 지원을 위한 매핑 테이블
  const levelMap = {
    // JLPT 레벨 (직접 매핑)
    'JLPT1': ['JLPT1', 'N1'],
    'JLPT2': ['JLPT2', 'N2'],
    'JLPT3': ['JLPT3', 'N3'],
    'N1': ['N1', 'JLPT1'],
    'N2': ['N2', 'JLPT2'],
    'N3': ['N3', 'JLPT3'],
    
    // TOPIK 레벨
    'TOPIK4': ['TOPIK4'],
    'TOPIK6': ['TOPIK6'],
    
    // 수준별 레벨 매핑 (요청대로 구현)
    'beginner': ['N1', 'N2', 'N3'],
    'intermediate': ['N2', 'N3'],
    'advanced': ['N1']
  };
  
  // 레벨 값 가져오기
  const mappedLevels = levelMap[frontendLevel] || [frontendLevel];
  
  // 디버깅 로그 추가
  console.log(`🔄 레벨 매핑 확장: ${frontendLevel} → ${mappedLevels.join(', ')}`);
  
  // 매핑 값이 없는 경우 추가 로깅
  if (!levelMap[frontendLevel]) {
    console.warn(`⚠️ 알 수 없는 레벨 코드: ${frontendLevel} - 원본 값 그대로 사용`);
  }
  
  return mappedLevels;
}

/**
 * 주간 시간표 조회 API
 * /api/timetable/weekly?grade=1&level=JLPT3&group_level=A&is_foreigner=1&student_type=foreigner&semester=spring&week=2023-09-04
 * 
 * 주어진 week(월요일 날짜) 기준으로 해당 주의 모든 이벤트 반환
 * - 정규수업 (grade 필터, is_special_lecture=0)
 * - 특강 (level + group_level 필터, is_special_lecture=1)
 * - 휴강/보강 이벤트 (timetable_events 테이블)
 * - 공휴일 (holidays 테이블)
 * 
 * 요일별 + 교시별로 정렬된 이벤트 배열 반환
 */
exports.getWeeklyTimetable = async (req, res) => {
  const { 
    grade, 
    level, 
    group_level = 'ALL',
    is_foreigner,
    student_type, 
    semester,
    week,
    ignoreGradeFilter = 'false', // 특강의 학년 필터링 무시 여부
    ignoreLevelFilter = 'false'  // 특강의 레벨 필터링 무시 여부 (추가)
  } = req.query;

  if (!week || !semester) {
    return res.status(400).json({ message: "week와 semester는 필수 파라미터입니다." });
  }

  try {
    // 1. 주 시작일(월요일)과 종료일(일요일) 계산
    const weekStart = dayjs(week).startOf('week').add(1, 'day').format('YYYY-MM-DD'); // 월요일
    const weekEnd = dayjs(week).startOf('week').add(7, 'day').format('YYYY-MM-DD');   // 일요일
    
    console.log(`📅 주간 조회: ${weekStart} ~ ${weekEnd}`);
    console.log(`🔍 조회 파라미터: grade=${grade}, level=${level}, group=${group_level}, is_foreigner=${is_foreigner}, semester=${semester}, ignoreGradeFilter=${ignoreGradeFilter}, ignoreLevelFilter=${ignoreLevelFilter}`);

    // 2. 필터 옵션 처리
    const skipGradeFilter = ignoreGradeFilter === 'true' || !grade;
    const skipLevelFilter = ignoreLevelFilter === 'true' || !level || level === 'ALL';
    const ignoreGroupFilter = group_level === 'ALL' || !group_level;
    const isForeigner = is_foreigner === 'true' || is_foreigner === '1';
    
    // 레벨 값을 DB에서 사용되는 값으로 매핑
    const dbLevels = mapFrontendLevelToDBLevels(level);
    console.log(`🔄 레벨 매핑: ${level} → ${dbLevels.join(', ') || '매핑 없음'}`);
    
    // 3. 정규 수업 조회 (is_special_lecture=0)
    let regularQuery = `
      SELECT t.*, s.name AS subject_name, 'regular' AS type
      FROM timetables t
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE t.semester = ?
        AND t.is_special_lecture = 0
    `;
    
    const regularParams = [semester];
    
    // 학년 필터 적용 (정규 수업)
    if (!skipGradeFilter) {
      regularQuery += ` AND t.year = ?`;
      regularParams.push(grade);
    }

    // 외국인 필터링을 위한 쿼리 추가 (한국인/외국인용 수업 구분)
    if (isForeigner) {
      // 외국인용 수업은 주로 한국어 관련 수업과 전공 수업
      regularQuery += ` AND (s.name LIKE '%한국어%' OR s.name LIKE '%Korean%' OR s.name NOT LIKE '%일본어%')`;
    } else {
      // 한국인용 수업은 일본어 관련 수업을 포함
      regularQuery += ` AND (s.name NOT LIKE '%한국어%' AND s.name NOT LIKE '%Korean%')`;
    }
    
    console.log(`🔍 정규 수업 쿼리: ${regularQuery}`);
    console.log(`🔍 정규 수업 파라미터: ${regularParams}`);
    
    const [regulars] = await pool.query(regularQuery, regularParams);
    console.log(`📊 정규 수업 조회 결과: ${regulars.length}개`);
    
    // 4. 특강 조회 (is_special_lecture=1)
    // 특강(N1, N2, N3)은 학년에 관계없이 level 기준으로 조회하고 표시
    let specialQuery = `
      SELECT t.*, s.name AS subject_name, 'special' AS type
      FROM timetables t
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE t.semester = ?
        AND t.is_special_lecture = 1
    `;
    
    const specialParams = [semester];
    
    // 레벨 필터 적용 (특강) - 더 유연한 조건 추가
    if (!skipLevelFilter && dbLevels.length > 0) {
      const placeholders = dbLevels.map(() => '?').join(', ');
      specialQuery += ` AND (t.level IS NULL OR t.level = '' OR t.level IN (${placeholders}))`;
      specialParams.push(...dbLevels);
      console.log(`🔍 특강 레벨 필터 적용: ${dbLevels.join(', ')} (${dbLevels.length}개 값)`);
      console.log(`🔹 생성된 SQL 조건: t.level IN (${placeholders})`);
    } else {
      console.log(`🔍 특강 레벨 필터 미적용 (모든 특강 조회)`);
    }
    
    // 분반 필터 적용 (특강)
    if (!ignoreGroupFilter) {
      specialQuery += ` AND (t.group_levels IS NULL OR JSON_CONTAINS(t.group_levels, JSON_QUOTE(?)))`;
      specialParams.push(group_level);
    }
    
    console.log(`🔍 특강 쿼리: ${specialQuery}`);
    console.log(`🔍 특강 파라미터: ${specialParams}`);
    
    const [specials] = await pool.query(specialQuery, specialParams);
    console.log(`📊 특강 조회 결과: ${specials.length}개`);
    
    // 특강 결과가 없는 경우 추가 디버깅
    if (specials.length === 0) {
      console.log(`⚠️ 특강 조회 결과가 없습니다. 더 넓은 조건으로 재시도...`);
      
      // 모든 특강을 가져와서 실제 DB 내용 확인
      const [allSpecials] = await pool.query(`
        SELECT t.id, t.level, t.semester, t.group_levels, s.name AS subject_name
        FROM timetables t
        LEFT JOIN subjects s ON t.subject_id = s.id
        WHERE t.is_special_lecture = 1
        LIMIT 5
      `);
      
      if (allSpecials.length > 0) {
        console.log(`💡 DB에서 확인된 특강 샘플 데이터 (총 ${allSpecials.length}개):`);
        allSpecials.forEach((s, i) => {
          console.log(`  특강 #${i+1}: id=${s.id}, level=${s.level || 'NULL'}, subject=${s.subject_name || 'NULL'}, group_levels=${s.group_levels || 'NULL'}`);
        });
      } else {
        console.log(`❗ DB에 특강 데이터가 없습니다.`);
      }
    }
    
    // 모든 특강 조회를 위한 디버깅 코드 추가
    if (skipLevelFilter) {
      console.log(`💡 ignoreLevelFilter=${ignoreLevelFilter}, 모든 특강 조회 모드 활성화`);
    }
    
    // 5. 보강/휴강 이벤트 조회 - 선택한 week에 맞게 이벤트 필터링 강화
    let eventsQuery = `
      SELECT 
        e.*, 
        s.name AS subject_name, 
        e.event_type AS type, 
        t.year as timetable_year,
        t.is_special_lecture,
        t.level as timetable_level,
        t.professor_name AS inherited_professor_name,
        t.room AS inherited_room,
        CASE 
          WHEN e.inherit_attributes = 1 AND t.professor_name IS NOT NULL THEN t.professor_name 
          ELSE NULL
        END AS professor_name,
        CASE 
          WHEN e.inherit_attributes = 1 AND t.room IS NOT NULL THEN t.room
          ELSE NULL
        END AS room
      FROM timetable_events e
      LEFT JOIN subjects s ON e.subject_id = s.id
      LEFT JOIN timetables t ON e.timetable_id = t.id
      WHERE e.event_date BETWEEN ? AND ?
    `;

    let eventsParams = [weekStart, weekEnd];

    // 🚧 학년 필터링 개선 🚧
    // 특강 수업(is_special_lecture = 1)은 학년 필터를 무시하고 level로 필터링
    // 정규 수업(is_special_lecture = 0)은 학년(year)으로 필터링
    if (!skipGradeFilter) {
      eventsQuery += ` AND (
        (t.is_special_lecture = 0 AND (t.year = ? OR e.year = ?)) OR 
        (t.is_special_lecture = 1) OR
        (t.is_special_lecture IS NULL AND (e.year = ? OR e.year IS NULL))
      )`;
      eventsParams.push(grade, grade, grade);
    }

    // 레벨 필터링 (특강 대상)
    if (!skipLevelFilter && dbLevels.length > 0) {
      const placeholders = dbLevels.map(() => '?').join(', ');
      eventsQuery += ` AND (
        t.is_special_lecture = 0 OR 
        t.is_special_lecture IS NULL OR
        (t.is_special_lecture = 1 AND (t.level IS NULL OR t.level = '' OR t.level IN (${placeholders})))
      )`;
      eventsParams.push(...dbLevels);
      console.log(`🔍 이벤트 레벨 필터 적용: ${dbLevels.join(', ')} (${dbLevels.length}개 값)`);
      console.log(`🔹 이벤트 SQL 조건: t.level IN (${placeholders})`);
    }

    // Query 실행 - 이벤트 검색
    console.log(`🔍 이벤트 쿼리 실행: ${eventsQuery}`);
    console.log(`🔢 이벤트 파라미터:`, eventsParams);

    const [events] = await pool.query(eventsQuery, eventsParams);
    console.log(`📊 조회된 이벤트 수: ${events.length}개`);
    
    // 상속 관련 디버깅 로그
    const inheritEvents = events.filter(e => e.inherit_attributes === 1);
    console.log(`👨‍🏫 상속 속성(inherit_attributes=1) 이벤트: ${inheritEvents.length}개`);
    
    if (inheritEvents.length > 0) {
      // 첫 번째 상속 이벤트 상세 정보 출력
      const sampleEvent = inheritEvents[0];
      console.log('📌 상속 이벤트 샘플:', {
        id: sampleEvent.id,
        event_type: sampleEvent.event_type,
        timetable_id: sampleEvent.timetable_id,
        inherit_attributes: sampleEvent.inherit_attributes,
        professor_name: sampleEvent.professor_name,
        inherited_professor_name: sampleEvent.inherited_professor_name,
        room: sampleEvent.room,
        inherited_room: sampleEvent.inherited_room
      });
    }
    
    // 상속 실패 이벤트 (inherit_attributes=1이지만 상속 값이 null인 경우)
    const failedInheritEvents = events.filter(e => 
      e.inherit_attributes === 1 && 
      (e.inherited_professor_name === null || e.inherited_room === null)
    );
    
    if (failedInheritEvents.length > 0) {
      console.warn(`⚠️ 상속 실패 이벤트: ${failedInheritEvents.length}개`);
      console.warn('첫 번째 실패 이벤트:', failedInheritEvents[0]);
    }
    
    // 6. 공휴일 조회 - 선택한 week에 맞게 공휴일 필터링
    const holidays = await getPublicHolidaysInRangeWithFallback(weekStart, weekEnd);
    console.log(`📊 공휴일 조회 결과: ${holidays.length}개`);
    
    const formattedHolidays = holidays.map(h => ({
      ...h,
      type: 'holiday',
      title: h.name || '공휴일',
      date: h.date,
      color: '#ef4444', // 휴일 색상 (빨간색)
      start_period: '1', // 기본값 설정
      end_period: '9',   // 기본값 설정
      id: `holiday-${h.date || new Date().toISOString()}`
    }));
    
    // 7. 교시별 시간 매핑 
    const periodMap = await getPeriodMap();
    
    // 8. 정규 수업을 주간 날짜로 확장
    const expandedRegulars = [];
    for (const item of regulars) {
      // 기본값 설정해 item 보강
      const safeItem = {
        ...item,
        subject_name: item.subject_name || "미지정 과목",
        professor_name: item.professor_name || "미지정 교수",
        start_period: item.start_period || "1",
        end_period: item.end_period || "1",
        day: item.day || "월", // 요일 기본값 설정
      };

      try {
        const dates = expandTimetableToDates(safeItem, weekStart, weekEnd);
        for (const expandedItem of dates) {
          expandedRegulars.push({
            ...expandedItem,
            id: item.id || `regular-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            subject_name: expandedItem.subject_name || "미지정 과목",
            title: expandedItem.subject_name || "미지정 과목",
            professor: expandedItem.professor_name || "미지정 교수",
            type: 'regular',
            start_time: periodMap[expandedItem.start_period]?.start_time || "09:00",
            end_time: periodMap[expandedItem.end_period]?.end_time || "18:00",
            color: '#3b82f6', // 정규 수업 색상 (파란색)
            start_period: expandedItem.start_period || "1",
            end_period: expandedItem.end_period || "1",
            year: item.year // 학년 정보 명시적으로 추가
          });
        }
      } catch (err) {
        console.error(`❌ 정규 수업 확장 중 오류:`, err, safeItem);
      }
    }
    
    // 9. 특강을 주간 날짜로 확장 - 특강은 학년에 관계없이 표시
    const expandedSpecials = [];
    for (const item of specials) {
      // 기본값 설정해 item 보강
      const safeItem = {
        ...item,
        subject_name: item.subject_name || "미지정 특강",
        professor_name: item.professor_name || "미지정 교수",
        start_period: item.start_period || "1",
        end_period: item.end_period || "1",
        day: item.day || "월", // 요일 기본값 설정
      };

      try {
        const dates = expandTimetableToDates(safeItem, weekStart, weekEnd);
        for (const expandedItem of dates) {
          expandedSpecials.push({
            ...expandedItem,
            id: item.id || `special-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            subject_name: expandedItem.subject_name || "미지정 특강",
            title: expandedItem.subject_name || "미지정 특강",
            professor: expandedItem.professor_name || "미지정 교수",
            type: 'special',
            start_time: periodMap[expandedItem.start_period]?.start_time || "09:00",
            end_time: periodMap[expandedItem.end_period]?.end_time || "18:00",
            color: '#10b981', // 특강 색상 (녹색)
            start_period: expandedItem.start_period || "1",
            end_period: expandedItem.end_period || "1",
            level: item.level // 레벨 정보 명시적으로 추가
          });
        }
      } catch (err) {
        console.error(`❌ 특강 확장 중 오류:`, err, safeItem);
      }
    }
    
    // 10. 보강/휴강 이벤트 포맷팅 - 이벤트 날짜 필터링 강화
    const formattedEvents = events
      .filter(event => {
        // event_date가 weekStart와 weekEnd 사이에 있는지 확인
        const eventDate = dayjs(event.event_date);
        const isInRange = (
          eventDate.isAfter(dayjs(weekStart).subtract(1, 'day')) && 
          eventDate.isBefore(dayjs(weekEnd).add(1, 'day'))
        );
        
        // 날짜 범위를 벗어난 이벤트 로깅
        if (!isInRange) {
          console.log(`⏩ 날짜 범위 밖 이벤트 제외: id=${event.id}, 날짜=${event.event_date}, 범위=${weekStart}~${weekEnd}`);
          return false;
        }
        
        return isInRange;
      })
      .map(event => {
        try {
          // event_date 처리 - Date 객체 또는 날짜 문자열을 통일된 형식으로 변환
          let formattedDate = event.event_date;
          if (event.event_date instanceof Date) {
            formattedDate = dayjs(event.event_date).format('YYYY-MM-DD');
          } else if (typeof event.event_date === 'string' && event.event_date.includes('T')) {
            // ISO date format or other date string with time component
            formattedDate = dayjs(event.event_date).format('YYYY-MM-DD');
          }

          // 교수명과 강의실 처리 - inherit_attributes가 1이면 timetable에서 상속
          const effectiveProfessorName = (event.inherit_attributes === 1 && event.inherited_professor_name) 
            ? event.inherited_professor_name 
            : (event.professor_name || "미지정 교수");
          
          const effectiveRoom = (event.inherit_attributes === 1 && event.inherited_room) 
            ? event.inherited_room 
            : (event.room || "");
          
          return {
            ...event,
            id: event.id || `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            subject_name: event.subject_name || (event.type === 'cancel' ? '휴강' : '보강'),
            title: event.subject_name || (event.type === 'cancel' ? '휴강' : '보강'),
            color: event.type === 'cancel' 
              ? '#9ca3af'  // 휴강 색상 (회색)
              : '#f59e0b', // 보강 색상 (주황색)
            start_time: periodMap[event.start_period]?.start_time || "09:00",
            end_time: periodMap[event.end_period]?.end_time || "18:00",
            start_period: event.start_period || "1",
            end_period: event.end_period || "1",
            professor: effectiveProfessorName,
            professor_name: effectiveProfessorName,
            room: effectiveRoom,
            date: formattedDate,
            inherit_attributes: event.inherit_attributes,
            inherited_professor_name: event.inherited_professor_name || null,
            inherited_room: event.inherited_room || null
          };
        } catch (err) {
          console.error(`❌ 이벤트 포맷팅 중 오류:`, err, event);
          // 오류 발생 시 최소한의 데이터로 반환
          return {
            ...event,
            id: event.id || `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            subject_name: "이벤트",
            title: "이벤트",
            start_period: "1",
            end_period: "1",
            professor_name: (event.inherit_attributes === 1 && event.inherited_professor_name) 
              ? event.inherited_professor_name 
              : "미지정 교수",
            professor: (event.inherit_attributes === 1 && event.inherited_professor_name) 
              ? event.inherited_professor_name 
              : "미지정 교수",
            room: (event.inherit_attributes === 1 && event.inherited_room) 
              ? event.inherited_room 
              : "",
            color: '#9ca3af',
            date: event.event_date || weekStart,
            inherited_professor_name: event.inherited_professor_name || null,
            inherited_room: event.inherited_room || null
          };
        }
      });
    
    // 11. 모든 이벤트 병합
    const allEvents = [
      ...expandedRegulars,
      ...expandedSpecials,
      ...formattedEvents,
      ...formattedHolidays
    ];
    
    // 데이터 무결성 검사 - ID와 날짜 필드 확인
    allEvents.forEach((event, index) => {
      if (!event.id) {
        console.warn(`⚠️ ID가 없는 이벤트 발견 [${index}]:`, event);
        event.id = `generated-${Date.now()}-${index}`; // ID 생성
      }
      
      if (!event.date) {
        console.warn(`⚠️ 날짜가 없는 이벤트 발견 [${index}]:`, event);
        // 요일 정보가 있으면 해당 주의 요일로 날짜 생성
        if (event.day) {
          const dayMap = {'월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 0};
          const dayIndex = dayMap[event.day];
          if (dayIndex !== undefined) {
            const dayDate = dayjs(weekStart).day(dayIndex).format('YYYY-MM-DD');
            event.date = dayDate;
            console.log(`🔧 요일(${event.day})에 맞게 날짜(${dayDate}) 생성함`);
          } else {
            event.date = weekStart; // 기본값
          }
        } else {
          event.date = weekStart; // 기본값
        }
      }
    });

    // 데이터 안전성 검증 로그
    const problematicEvents = allEvents.filter(
      event => !event.title || !event.date || !event.start_period || event.start_period === undefined
    );

    if (problematicEvents.length > 0) {
      console.warn(`⚠️ 누락된 필드가 있는 이벤트 ${problematicEvents.length}개 발견:`, 
        problematicEvents.map(e => ({ id: e.id, title: e.title, date: e.date, start_period: e.start_period }))
      );
    }

    // 정렬 전 날짜 필드 체크 및 로그
    console.log(`🔍 정렬 전 날짜 필드 샘플 확인 (처음 5개):`);
    allEvents.slice(0, 5).forEach((event, i) => {
      console.log(`  이벤트 ${i+1}: id=${event.id}, date=${event.date}, type=${event.type}`);
    });

    // 12. 이벤트 정렬 (날짜 > 요일 > 교시 > 우선순위)
    // 우선순위: holiday > cancel > makeup > special > regular
    let sortedEvents = [];

    try {
      // 정렬 전 데이터 복사 및 날짜 필드 문자열화
      const safeEvents = allEvents.map(event => ({
        ...event,
        // 모든 핵심 필드에 안전한 기본값 적용
        date: typeof event.date === 'string' ? event.date : (
          event.date instanceof Date ? event.date.toISOString().split('T')[0] : weekStart
        ),
        start_period: String(event.start_period || '1'),
        type: event.type || 'event'
      }));
      
      sortedEvents = safeEvents.sort((a, b) => {
        try {
          // 1) 날짜 기준 정렬 (안전하게 문자열로 변환)
          const dateA = String(a.date || '');
          const dateB = String(b.date || '');
          
          if (dateA !== dateB) {
            try {
              return dateA.localeCompare(dateB);
            } catch (err) {
              console.error(`❌ 날짜 비교 오류(${dateA} vs ${dateB}):`, err);
              return 0; // 오류 시 동등 처리
            }
          }
          
          // 2) 교시 기준 정렬 (안전하게 숫자로 변환)
          let startA, startB;
          try {
            startA = parseInt(String(a.start_period || '0')) || 0;
          } catch (err) {
            console.error(`❌ 교시 파싱 오류(A):`, a.start_period, err);
            startA = 0;
          }
          
          try {
            startB = parseInt(String(b.start_period || '0')) || 0;
          } catch (err) {
            console.error(`❌ 교시 파싱 오류(B):`, b.start_period, err);
            startB = 0;
          }
          
          if (startA !== startB) {
            return startA - startB;
          }
          
          // 3) 타입 우선순위 기준 정렬
          const priorityMap = {
            'holiday': 0,
            'cancel': 1,
            'makeup': 2,
            'special': 3,
            'regular': 4
          };
          
          const priorityA = priorityMap[String(a.type)] !== undefined ? priorityMap[String(a.type)] : 99;
          const priorityB = priorityMap[String(b.type)] !== undefined ? priorityMap[String(b.type)] : 99;
          
          return priorityA - priorityB;
        } catch (sortErr) {
          console.error("❌ 이벤트 정렬 중 오류:", sortErr, { 
            a: { id: a.id, title: a.title, date: a.date, start_period: a.start_period, type: a.type },
            b: { id: b.id, title: b.title, date: b.date, start_period: b.start_period, type: b.type }
          });
          return 0; // 오류 시 순서 유지
        }
      });
    } catch (sortError) {
      console.error("❌ 이벤트 배열 정렬 중 오류:", sortError, {
        eventsLength: allEvents.length,
        sampleEvent: allEvents.length > 0 ? allEvents[0] : null
      });
      
      // 정렬 실패 시 날짜 필드만 문자열 처리 후 재시도
      try {
        console.log("🔄 안전 모드로 정렬 재시도...");
        sortedEvents = allEvents.map(e => ({
          ...e,
          date: String(e.date || weekStart),
          start_period: String(e.start_period || '1'),
          type: String(e.type || 'event')
        }));
      } catch (fallbackError) {
        console.error("❌ 안전 모드 정렬도 실패:", fallbackError);
        // 모든 정렬 실패 시 원본 배열 유지
        sortedEvents = allEvents;
      }
    }

    // 13. 최종 결과 반환
    console.log(`🔢 주간 이벤트 합계: 정규(${expandedRegulars.length}), 특강(${expandedSpecials.length}), 이벤트(${formattedEvents.length}), 공휴일(${formattedHolidays.length})`);

    // 마지막 안전 검사 - 정렬된 결과의 날짜 체크
    sortedEvents.forEach((event, index) => {
      if (!event.date) {
        console.warn(`⚠️ 정렬 후 날짜 필드 없음 [${index}]:`, event);
        event.date = weekStart; // 기본값 설정
      }
    });

    res.json({
      week_start: weekStart,
      week_end: weekEnd,
      events: sortedEvents
    });
  } catch (err) {
    console.error("❌ getWeeklyTimetable 오류:", err);
    res.status(500).json({ message: "서버 오류 발생" });
  }
};

// ------------------------ CRUD -----------------------

/**
 * 시간표 등록 API
 * POST /api/timetable
 * 
 * 정규 수업 또는 특강 생성을 위한 API
 */
exports.createTimetable = async (req, res) => {
  const {
    year,
    level,
    subject_id,
    day,
    start_period,
    end_period,
    semester,
    room,
    professor_name,
    is_special_lecture,
    group_levels
  } = req.body;
  
  // 필수 필드 검증
  if (!subject_id || !day || !start_period || !end_period || !semester) {
    return res.status(400).json({ 
      message: "subject_id, day, start_period, end_period, semester는 필수 필드입니다." 
    });
  }
  
  // 요일 검증
  const validDays = ['월', '화', '수', '목', '금'];
  if (!validDays.includes(day)) {
    return res.status(400).json({ 
      message: "유효하지 않은 요일입니다. '월', '화', '수', '목', '금' 중 하나여야 합니다." 
    });
  }
  
  // 교시 검증
  if (parseInt(start_period) > parseInt(end_period)) {
    return res.status(400).json({ 
      message: "start_period는 end_period보다 작거나 같아야 합니다." 
    });
  }
  
  try {
    // 수업 타입에 따른 필수 필드 검증
    const isSpecial = is_special_lecture === 1 || is_special_lecture === '1' || is_special_lecture === true;
    
    if (!isSpecial && !year) {
      return res.status(400).json({ 
        message: "정규 수업 등록 시 year 필드가 필요합니다." 
      });
    }
    
    if (isSpecial && !level) {
      return res.status(400).json({ 
        message: "특강 등록 시 level 필드가 필요합니다." 
      });
    }
    
    // 중복 시간표 확인
    let overlapQuery = `
      SELECT * FROM timetables
      WHERE semester = ?
        AND day = ?
        AND ((start_period <= ? AND end_period >= ?) OR
             (start_period <= ? AND end_period >= ?) OR
             (start_period >= ? AND end_period <= ?))
    `;
    
    const overlapParams = [
      semester,
      day,
      end_period, start_period,    // 케이스 1: 기존 수업이 새 수업을 포함
      start_period, start_period,  // 케이스 2: 기존 수업 시작이 새 수업 시간 내
      end_period, end_period,      // 케이스 3: 기존 수업 종료가 새 수업 시간 내
      start_period, end_period     // 케이스 4: 새 수업이 기존 수업을 포함
    ];
    
    // 같은 과목을 제외하려면 subject_id로 추가 필터링
    if (subject_id) {
      overlapQuery += ` AND subject_id <> ?`;
      overlapParams.push(subject_id);
    }
    
    // 정규수업/특강 구분
    overlapQuery += ` AND is_special_lecture = ?`;
    overlapParams.push(isSpecial ? 1 : 0);
    
    // 학년/레벨 필터링 추가
    if (!isSpecial && year) {
      overlapQuery += ` AND year = ?`;
      overlapParams.push(year);
    }
    
    if (isSpecial && level) {
      overlapQuery += ` AND level = ?`;
      overlapParams.push(level);
    }
    
    const [overlaps] = await pool.query(overlapQuery, overlapParams);
    
    if (overlaps.length > 0) {
      const overlapInfo = overlaps.map(o => ({
        id: o.id,
        subject_id: o.subject_id,
        day: o.day,
        period: `${o.start_period}-${o.end_period}교시`
      }));
      
      return res.status(409).json({ 
        message: "해당 요일과 시간에 중복된 수업이 있습니다.",
        conflicts: overlapInfo
      });
    }
    
    // group_levels가 문자열로 들어온 경우 처리
    let parsedGroupLevels = group_levels;
    if (typeof group_levels === 'string') {
      try {
        parsedGroupLevels = JSON.parse(group_levels);
      } catch (e) {
        parsedGroupLevels = [group_levels]; // 문자열 하나를 배열로 변환
      }
    }
    
    // DB에 시간표 저장
    const [result] = await pool.query(
      `INSERT INTO timetables (
        year, level, subject_id, day, start_period, end_period, semester,
        room, professor_name, is_special_lecture, group_levels, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        year || null,
        level || null,
        subject_id,
        day,
        start_period,
        end_period,
        semester,
        room || null,
        professor_name || null,
        isSpecial ? 1 : 0,
        parsedGroupLevels ? JSON.stringify(parsedGroupLevels) : null
      ]
    );
    
    // 새로 생성된 시간표 정보 조회
    const [newTimetable] = await pool.query(
      `SELECT t.*, s.name AS subject_name 
       FROM timetables t
       LEFT JOIN subjects s ON t.subject_id = s.id
       WHERE t.id = ?`,
      [result.insertId]
    );
    
    // 교시 -> 시간 매핑 추가
    const periodMap = await getPeriodMap();
    const formatted = {
      ...newTimetable[0],
      subject_name: newTimetable[0].subject_name || "미지정 과목",
      start_time: periodMap[newTimetable[0].start_period]?.start_time || "09:00",
      end_time: periodMap[newTimetable[0].end_period]?.end_time || "18:00"
    };
    
    // 결과 반환
    res.status(201).json({
      message: isSpecial ? "특강 등록 성공" : "정규 수업 등록 성공",
      timetable: formatted
    });
    
  } catch (err) {
    console.error("❌ createTimetable 오류:", err);
    res.status(500).json({ message: "서버 오류 발생", error: err.message });
  }
};

/**
 * 시간표 수정 API
 * PUT /api/timetable/:id
 * 
 * 정규 수업 또는 특강 수정을 위한 API
 */
exports.updateTimetable = async (req, res) => {
  const { id } = req.params;
  const {
    year,
    level,
    subject_id,
    day,
    start_period,
    end_period,
    semester,
    room,
    professor_name,
    is_special_lecture,
    group_levels
  } = req.body;
  
  if (!id) return res.status(400).json({ message: "ID가 필요합니다." });
  
  try {
    // 시간표 존재 여부 확인
    const [existingRows] = await pool.query("SELECT * FROM timetables WHERE id = ?", [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ message: "수정할 수업이 없습니다." });
    }
    
    const existing = existingRows[0];
    
    // 수정할 필드 구성
    const updates = [];
    const params = [];
    
    if (year !== undefined) {
      updates.push("year = ?");
      params.push(year);
    }
    
    if (level !== undefined) {
      updates.push("level = ?");
      params.push(level);
    }
    
    if (subject_id !== undefined) {
      updates.push("subject_id = ?");
      params.push(subject_id);
    }
    
    if (day !== undefined) {
      // 요일 검증
      const validDays = ['월', '화', '수', '목', '금'];
      if (!validDays.includes(day)) {
        return res.status(400).json({ 
          message: "유효하지 않은 요일입니다. '월', '화', '수', '목', '금' 중 하나여야 합니다." 
        });
      }
      updates.push("day = ?");
      params.push(day);
    }
    
    if (start_period !== undefined) {
      updates.push("start_period = ?");
      params.push(start_period);
    }
    
    if (end_period !== undefined) {
      updates.push("end_period = ?");
      params.push(end_period);
    }
    
    if (semester !== undefined) {
      updates.push("semester = ?");
      params.push(semester);
    }
    
    if (room !== undefined) {
      updates.push("room = ?");
      params.push(room);
    }
    
    if (professor_name !== undefined) {
      updates.push("professor_name = ?");
      params.push(professor_name);
    }
    
    if (is_special_lecture !== undefined) {
      updates.push("is_special_lecture = ?");
      params.push(is_special_lecture === 1 || is_special_lecture === '1' || is_special_lecture === true ? 1 : 0);
    }
    
    if (group_levels !== undefined) {
      // group_levels가 문자열로 들어온 경우 처리
      let parsedGroupLevels = group_levels;
      if (typeof group_levels === 'string') {
        try {
          parsedGroupLevels = JSON.parse(group_levels);
        } catch (e) {
          parsedGroupLevels = [group_levels]; // 문자열 하나를 배열로 변환
        }
      }
      
      updates.push("group_levels = ?");
      params.push(parsedGroupLevels ? JSON.stringify(parsedGroupLevels) : null);
    }
    
    // 수정할 내용이 없는 경우
    if (updates.length === 0) {
      return res.status(400).json({ message: "수정할 내용이 없습니다." });
    }
    
    // 중복 시간표 확인 (자기 자신은 제외)
    const updatedStartPeriod = start_period !== undefined ? start_period : existing.start_period;
    const updatedEndPeriod = end_period !== undefined ? end_period : existing.end_period;
    const updatedDay = day !== undefined ? day : existing.day;
    const updatedSemester = semester !== undefined ? semester : existing.semester;
    const updatedIsSpecial = is_special_lecture !== undefined 
      ? (is_special_lecture === 1 || is_special_lecture === '1' || is_special_lecture === true)
      : (existing.is_special_lecture === 1);
    const updatedYear = year !== undefined ? year : existing.year;
    const updatedLevel = level !== undefined ? level : existing.level;
    
    let overlapQuery = `
      SELECT * FROM timetables
      WHERE semester = ?
        AND day = ?
        AND ((start_period <= ? AND end_period >= ?) OR
             (start_period <= ? AND end_period >= ?) OR
             (start_period >= ? AND end_period <= ?))
        AND id <> ?
    `;
    
    const overlapParams = [
      updatedSemester,
      updatedDay,
      updatedEndPeriod, updatedStartPeriod,    // 케이스 1: 기존 수업이 새 수업을 포함
      updatedStartPeriod, updatedStartPeriod,  // 케이스 2: 기존 수업 시작이 새 수업 시간 내
      updatedEndPeriod, updatedEndPeriod,      // 케이스 3: 기존 수업 종료가 새 수업 시간 내
      updatedStartPeriod, updatedEndPeriod,    // 케이스 4: 새 수업이 기존 수업을 포함
      id
    ];
    
    // 정규수업/특강 구분
    overlapQuery += ` AND is_special_lecture = ?`;
    overlapParams.push(updatedIsSpecial ? 1 : 0);
    
    // 학년/레벨 필터링 추가
    if (!updatedIsSpecial && updatedYear) {
      overlapQuery += ` AND year = ?`;
      overlapParams.push(updatedYear);
    }
    
    if (updatedIsSpecial && updatedLevel) {
      overlapQuery += ` AND level = ?`;
      overlapParams.push(updatedLevel);
    }
    
    const [overlaps] = await pool.query(overlapQuery, overlapParams);
    
    if (overlaps.length > 0) {
      const overlapInfo = overlaps.map(o => ({
        id: o.id,
        subject_id: o.subject_id,
        day: o.day,
        period: `${o.start_period}-${o.end_period}교시`
      }));
      
      return res.status(409).json({ 
        message: "해당 요일과 시간에 중복된 수업이 있습니다.",
        conflicts: overlapInfo
      });
    }
    
    // 업데이트 쿼리 실행
    const updateQuery = `UPDATE timetables SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
    params.push(id);
    
    const [result] = await pool.query(updateQuery, params);
    
    if (result.affectedRows === 0) {
      return res.status(500).json({ message: "수정 실패" });
    }
    
    // 업데이트된 시간표 정보 조회
    const [updatedTimetable] = await pool.query(
      `SELECT t.*, s.name AS subject_name 
       FROM timetables t
       LEFT JOIN subjects s ON t.subject_id = s.id
       WHERE t.id = ?`,
      [id]
    );
    
    // 교시 -> 시간 매핑 추가
    const periodMap = await getPeriodMap();
    const formatted = {
      ...updatedTimetable[0],
      subject_name: updatedTimetable[0].subject_name || "미지정 과목",
      start_time: periodMap[updatedTimetable[0].start_period]?.start_time || "09:00",
      end_time: periodMap[updatedTimetable[0].end_period]?.end_time || "18:00"
    };
    
    // 결과 반환
    res.json({
      message: "시간표 수정 성공",
      timetable: formatted
    });
    
  } catch (err) {
    console.error("❌ updateTimetable 오류:", err);
    res.status(500).json({ message: "서버 오류 발생", error: err.message });
  }
};

/**
 * 시간표 삭제 API
 * DELETE /api/timetable/:id
 * 
 * 정규 수업 또는 특강 삭제를 위한 API
 */
exports.deleteTimetable = async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "ID가 필요합니다." });

  try {
    const [result] = await pool.query("DELETE FROM timetables WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "삭제할 수업이 없습니다." });
    }

    res.json({ status: "success", message: "삭제 완료", data: { id } });
  } catch (err) {
    console.error("❌ deleteTimetable 오류:", err);
    res.status(500).json({ message: "서버 오류 발생" });
  }
};

/**
 * 이벤트 등록 API
 * POST /api/timetable/events
 * 
 * 보강/휴강/행사 이벤트 등록
 */
exports.createEvent = async (req, res) => {
  const {
    timetable_id,
    subject_id,
    event_type,
    event_date,
    level,
    group_levels,
    start_period,
    end_period,
    description,
    year,
    inherit_attributes
  } = req.body;
  
  // 필수 필드 검증
  if (!event_type || !event_date || !start_period || !end_period) {
    return res.status(400).json({ 
      message: "event_type, event_date, start_period, end_period는 필수 필드입니다." 
    });
  }
  
  // 이벤트 타입 검증
  const validEventTypes = ['makeup', 'cancel', 'event'];
  if (!validEventTypes.includes(event_type)) {
    return res.status(400).json({ 
      message: "유효하지 않은 event_type입니다. makeup, cancel, event 중 하나여야 합니다." 
    });
  }
  
  // 교시 검증
  if (parseInt(start_period) > parseInt(end_period)) {
    return res.status(400).json({ 
      message: "start_period는 end_period보다 작거나 같아야 합니다." 
    });
  }
  
  try {
    // 이벤트 중복 체크
    if (timetable_id) {
      const [existing] = await pool.query(
        `SELECT * FROM timetable_events 
         WHERE timetable_id = ? AND event_date = ? AND event_type = ?`,
        [timetable_id, event_date, event_type]
      );
      
      if (existing.length > 0) {
        return res.status(409).json({ 
          message: "해당 날짜에 동일한 타입의 이벤트가 이미 등록되어 있습니다." 
        });
      }
    }
    
    // group_levels가 문자열로 들어온 경우 처리
    let parsedGroupLevels = group_levels;
    if (typeof group_levels === 'string') {
      try {
        parsedGroupLevels = JSON.parse(group_levels);
      } catch (e) {
        parsedGroupLevels = [group_levels]; // 문자열 하나를 배열로 변환
      }
    }
    
    // DB에 이벤트 저장 - 컬럼명 실제 테이블 구조에 맞게 수정
    const [result] = await pool.query(
      `INSERT INTO timetable_events (
        timetable_id, subject_id, event_type, event_date, level, 
        group_levels, start_period, end_period, description, 
        year, inherit_attributes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        timetable_id || null,
        subject_id || null,
        event_type,
        event_date,
        level || null,
        parsedGroupLevels ? JSON.stringify(parsedGroupLevels) : null,
        start_period,
        end_period,
        description || null,
        year || null,
        inherit_attributes === true || inherit_attributes === 1 ? 1 : 0 // 기본값은 1(true)
      ]
    );
    
    // 새로 생성된 이벤트 정보 조회 - 수정된 쿼리로 변경
    const [newEvent] = await pool.query(
      `SELECT e.*, s.name AS subject_name,
             t.professor_name AS inherited_professor_name,
             t.room AS inherited_room
       FROM timetable_events e
       LEFT JOIN subjects s ON e.subject_id = s.id
       LEFT JOIN timetables t ON e.timetable_id = t.id
       WHERE e.id = ?`,
      [result.insertId]
    );
    
    // 교수명과 강의실 처리 - inherit_attributes가 1이면 timetable에서 상속
    const formattedEvent = {
      ...newEvent[0],
      professor_name: newEvent[0].inherited_professor_name || "미지정 교수",
      room: newEvent[0].inherited_room || "",
      inherited_professor_name: newEvent[0].inherited_professor_name || null,
      inherited_room: newEvent[0].inherited_room || null
    };
    
    // 결과 반환
    res.status(201).json({
      message: "이벤트 등록 성공",
      event: formattedEvent
    });
    
  } catch (err) {
    console.error("❌ createEvent 오류:", err);
    res.status(500).json({ message: "서버 오류 발생", error: err.message });
  }
};

/**
 * 이벤트 수정 API
 * PUT /api/timetable/events/:id
 * 
 * 보강/휴강/행사 이벤트 수정
 */
exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const {
    timetable_id,
    subject_id,
    event_type,
    event_date,
    level,
    group_levels,
    start_period,
    end_period,
    description,
    year,
    inherit_attributes
  } = req.body;
  
  if (!id) return res.status(400).json({ message: "ID가 필요합니다." });
  
  try {
    // 이벤트 존재 여부 확인
    const [existingRows] = await pool.query("SELECT * FROM timetable_events WHERE id = ?", [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ message: "수정할 이벤트가 없습니다." });
    }
    
    // 수정할 필드 구성
    const updates = [];
    const params = [];
    
    if (timetable_id !== undefined) {
      updates.push("timetable_id = ?");
      params.push(timetable_id);
    }
    
    if (subject_id !== undefined) {
      updates.push("subject_id = ?");
      params.push(subject_id);
    }
    
    if (event_type !== undefined) {
      // 이벤트 타입 검증
      const validEventTypes = ['makeup', 'cancel', 'event'];
      if (!validEventTypes.includes(event_type)) {
        return res.status(400).json({ 
          message: "유효하지 않은 event_type입니다. makeup, cancel, event 중 하나여야 합니다." 
        });
      }
      updates.push("event_type = ?");
      params.push(event_type);
    }
    
    if (event_date !== undefined) {
      updates.push("event_date = ?");
      params.push(event_date);
    }
    
    if (level !== undefined) {
      updates.push("level = ?");
      params.push(level);
    }
    
    if (start_period !== undefined) {
      updates.push("start_period = ?");
      params.push(start_period);
    }
    
    if (end_period !== undefined) {
      updates.push("end_period = ?");
      params.push(end_period);
    }
    
    if (description !== undefined) {
      updates.push("description = ?");
      params.push(description);
    }
    
    if (year !== undefined) {
      updates.push("year = ?");
      params.push(year);
    }
    
    if (group_levels !== undefined) {
      // group_levels가 문자열로 들어온 경우 처리
      let parsedGroupLevels = group_levels;
      if (typeof group_levels === 'string') {
        try {
          parsedGroupLevels = JSON.parse(group_levels);
        } catch (e) {
          parsedGroupLevels = [group_levels]; // 문자열 하나를 배열로 변환
        }
      }
      
      updates.push("group_levels = ?");
      params.push(parsedGroupLevels ? JSON.stringify(parsedGroupLevels) : null);
    }
    
    if (inherit_attributes !== undefined) {
      updates.push("inherit_attributes = ?");
      params.push(inherit_attributes === true || inherit_attributes === 1 ? 1 : 0);
    }
    
    // 수정할 내용이 없는 경우
    if (updates.length === 0) {
      return res.status(400).json({ message: "수정할 내용이 없습니다." });
    }
    
    // 업데이트 쿼리 실행
    const updateQuery = `UPDATE timetable_events SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
    params.push(id);
    
    const [result] = await pool.query(updateQuery, params);
    
    if (result.affectedRows === 0) {
      return res.status(500).json({ message: "수정 실패" });
    }
    
    // 업데이트된 이벤트 정보 조회
    const [newEvent] = await pool.query(
      `SELECT e.*, s.name AS subject_name,
             t.professor_name AS inherited_professor_name,
             t.room AS inherited_room
       FROM timetable_events e
       LEFT JOIN subjects s ON e.subject_id = s.id
       LEFT JOIN timetables t ON e.timetable_id = t.id
       WHERE e.id = ?`,
      [id]
    );
    
    // 교수명과 강의실 처리 - inherit_attributes가 1이면 timetable에서 상속
    const formattedEvent = {
      ...newEvent[0],
      professor_name: newEvent[0].inherited_professor_name || "미지정 교수",
      room: newEvent[0].inherited_room || "",
      inherited_professor_name: newEvent[0].inherited_professor_name || null,
      inherited_room: newEvent[0].inherited_room || null
    };
    
    // 결과 반환
    res.json({
      message: "이벤트 수정 성공",
      event: formattedEvent
    });
    
  } catch (err) {
    console.error("❌ updateEvent 오류:", err);
    res.status(500).json({ message: "서버 오류 발생", error: err.message });
  }
};

/**
 * 이벤트 삭제 API
 * DELETE /api/timetable/events/:id
 * 
 * 보강/휴강/행사 이벤트 삭제
 */
exports.deleteEvent = async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "ID가 필요합니다." });

  try {
    const [result] = await pool.query("DELETE FROM timetable_events WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "삭제할 이벤트가 없습니다." });
    }

    res.json({ status: "success", message: "이벤트 삭제 완료", data: { id } });
  } catch (err) {
    console.error("❌ deleteEvent 오류:", err);
    res.status(500).json({ message: "서버 오류 발생" });
  }
};