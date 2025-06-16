// services/timetableService.js -------------------------------------------------

import apiClient from "@/services/apiClient.js";
import { getSemesterRange } from "@/utils/semester";
import { normalizeLevel } from "@/utils/level";
import dayjs from "dayjs";

/**
 * 📌 엔드포인트 맵 – 라우트가 바뀌면 여기만 수정하면 됨.
 */
const ENDPOINTS = {
    timetableWithEvents: "/timetables/full",
    specialLectures:     "/timetables/special",
    timetables:          "/timetables",               // 정규 수업 CRUD
    semester:            "/timetable/semester"        // 학기별 조회
};

/**
 * 🗓️ start_date / end_date 가 없으면 학기 범위를 계산해 반환한다.
 */
function resolveDateRange(year, semester, start_date, end_date) {
    if (start_date && end_date) return { start_date, end_date };
    return getSemesterRange(year, semester);
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/**
 * Fetch all timetable data for a semester
 */
export const fetchAllBySemester = async (params) => {
  const response = await apiClient.get(ENDPOINTS.semester, { params })
  return response.data
}

// ---------------------------------------------------------------------------
// 1) 정규 + 특강 + 이벤트 + 공휴일 통합 조회
// ---------------------------------------------------------------------------

/**
 * @param {Object} options
 *   @property {number}  year
 *   @property {string}  semester  – 'spring' | 'summer' | 'fall' | 'winter'
 *   @property {string}  level
 *   @property {string}  [group_level='A']
 *   @property {string}  [start_date]
 *   @property {string}  [end_date]
 *   @property {string}  [type='all']     – 'regular' | 'special' | 'all'
 */
export const fetchTimetableWithEvents = async ({
    year,
    semester,
    level,
    group_level = '',
    start_date,
    end_date,
    type = 'all'
}) => {
    // 날짜 처리
    const { start_date: s, end_date: e } = resolveDateRange(year, semester, start_date, end_date);
    
    // 날짜가 문자열로 들어온 경우 처리
    const normalizedStartDate = s.includes('-') ? s : `${year}-${s}`;
    const normalizedEndDate = e.includes('-') ? e : `${year}-${e}`;

    // 필수 파라미터 검증
    if (!year || isNaN(year)) {
        console.warn('❌ year must be a valid number');
        return [];
    }

    // 파라미터 정규화
    const params = {
        year: Number(year),
        type
    };

    // 선택적 파라미터는 값이 있을 때만 추가
    if (semester) params.semester = semester;
    if (level && level !== '') params.level = normalizeLevel(level);
    if (group_level && group_level !== '') params.group_level = group_level;
    if (normalizedStartDate) params.start_date = normalizedStartDate;
    if (normalizedEndDate) params.end_date = normalizedEndDate;

    console.log("📡 [fetchTimetableWithEvents]", params);

    try {
        const { data } = await apiClient.get(ENDPOINTS.timetableWithEvents, { params });
        
        // 중복 방지를 위한 Set
        const processedItems = new Set();
        
        // 데이터 정규화
        const timetables = (data?.timetables || []).reduce((acc, item) => {
            // 중복 체크를 위한 키 생성
            const itemKey = `${item.event_type || 'regular'}-${item.id}-${item.date || item.day}-${item.start_period}`;
            if (processedItems.has(itemKey)) {
                console.warn('⚠️ 중복 데이터 무시:', item);
                return acc;
            }
            processedItems.add(itemKey);

            // 기본 필드 정규화
            const normalized = {
                ...item,
                original_class: item.original_class || null,
                year: Number(item.year || year),
                level: item.level || level || '',
                date: item.date || item.event_date || item.event_date_local || null,
                start_period: Number(item.start_period || 1),
                end_period: Number(item.end_period || 1),
                day: item.day?.toLowerCase() || null  // 요일은 소문자로 통일
            };

            // ✅ original_class 수동 생성
            const original_class = (
                item.original_day || item.original_start_period
            ) ? {
                day: item.original_day || null,
                start_period: item.original_start_period || null,
                end_period: item.original_end_period || null,
                year: item.original_year || null,
                professor_name: item.original_professor || null,
                subject_id: item.original_subject_id || null
            } : null

            // 이벤트 타입별 처리
            let processedItem;
            if (item.event_type === 'cancel') {
                processedItem = {
                    ...normalized,
                    event_type: 'cancel',
                    original_class,
                    description: item.description || '휴강',
                    date: item.event_date ? dayjs(item.event_date).format('YYYY-MM-DD') : normalized.date
                };
            } else if (item.event_type === 'makeup') {
                processedItem = {
                    ...normalized,
                    event_type: 'makeup',
                    description: item.description || '보강',
                    date: item.event_date ? dayjs(item.event_date).format('YYYY-MM-DD') : normalized.date
                };
            } else if (item.event_type === 'holiday') {
                processedItem = {
                    ...normalized,
                    event_type: 'holiday',
                    description: item.description || '공휴일',
                    start_period: 1,
                    end_period: 9
                };
            } else if (item.is_special_lecture) {
                processedItem = {
                    ...normalized,
                    event_type: 'special',
                    description: item.description || '특강',
                    date: item.event_date ? dayjs(item.event_date).format('YYYY-MM-DD') : normalized.date
                };
            } else {
                // 기본은 정규 수업
                processedItem = {
                    ...normalized,
                    event_type: 'regular',
                    description: item.description || '정규 수업'
                };
            }

            acc.push(processedItem);
            return acc;
        }, []);

        // 이벤트 타입별 분류 및 로깅
        const eventsByType = timetables.reduce((acc, item) => {
            if (!acc[item.event_type]) {
                acc[item.event_type] = [];
            }
            acc[item.event_type].push(item);
            return acc;
        }, {});

        // 통계 로깅
        console.log("📊 이벤트 타입별 통계:", Object.entries(eventsByType).map(([type, items]) => ({
            type,
            count: items.length,
            sample: items[0] ? {
                date: items[0].date,
                day: items[0].day,
                start_period: items[0].start_period,
                event_type: items[0].event_type
            } : null
        })));

        return timetables;
    } catch (err) {
        console.error("❌ fetchTimetableWithEvents failed:", err);
        return [];
    }
};

// ---------------------------------------------------------------------------
// 2) 특강 전용 조회
// ---------------------------------------------------------------------------

export const fetchSpecialLectures = async (params = {}) => {
    try {
        // Normalize parameters
        const normalizedParams = {
            year: params.year || 1,
            semester: params.semester || 'spring'
        }

        // Only add level and group_level if they have values
        if (params.level && params.level !== '') {
            normalizedParams.level = params.level
        }
        if (params.group_level && params.group_level !== '' && params.group_level !== 'ALL') {
            normalizedParams.group_level = params.group_level
        }

        // Add date range if provided
        if (params.start_date) {
            normalizedParams.start_date = params.start_date
        }
        if (params.end_date) {
            normalizedParams.end_date = params.end_date
        }

        console.log('📡 [fetchSpecialLectures] Request:', {
            url: ENDPOINTS.specialLectures,
            params: normalizedParams
        })

        const response = await apiClient.get(ENDPOINTS.specialLectures, {
            params: normalizedParams
        })

        const lectures = response.data || []
        console.log('📚 특강 데이터:', {
            total: lectures.length,
            dates: lectures.map(l => l.date),
            params: normalizedParams,
            raw: lectures
        })

        // Normalize lecture data
        return lectures.map(lecture => ({
            ...lecture,
            event_type: 'special',
            is_special_lecture: true,
            start_time: lecture.start_time || '00:00',
            end_time: lecture.end_time || '00:00',
            room: lecture.room || lecture.classroom || '-',
            professor_name: lecture.professor_name || '-',
            start_period: Number(lecture.start_period || 1),
            end_period: Number(lecture.end_period || 1)
        }))
    } catch (error) {
        console.error('❌ [fetchSpecialLectures] Error:', error)
        return []
    }
}

// ---------------------------------------------------------------------------
// 3) 정규 수업 전용 조회
// ---------------------------------------------------------------------------

export const fetchTimetables = async ({ year, semester, day }) => {
    try {
        const params = { semester }
        if (year) params.year = year
        if (day) params.day = day

        const { data } = await apiClient.get(ENDPOINTS.timetables, { params });
        return data?.timetables || [];
    } catch (err) {
        console.error("❌ fetchTimetables failed:", err);
        return [];
    }
};

// ---------------------------------------------------------------------------
// 4) CRUD Operations
// ---------------------------------------------------------------------------

/**
 * Create a new timetable entry
 */
export const createTimetable = async timetableData => {
    try {
        const { data } = await apiClient.post(ENDPOINTS.timetables, timetableData);
        console.log("📡 createTimetable", timetableData);
        return data;
    } catch (err) {
        console.error("❌ createTimetable failed:", err);
        throw err;
    }
};

/**
 * Update an existing timetable entry
 */
export const updateTimetable = async (id, timetableData) => {
    try {
        const { data } = await apiClient.put(`${ENDPOINTS.timetables}/${id}`, timetableData);
        return data;
    } catch (err) {
        console.error("❌ updateTimetable failed:", err);
        throw err;
    }
};

/**
 * Delete a timetable entry
 */
export const deleteTimetable = async id => {
    try {
        const { data } = await apiClient.delete(`${ENDPOINTS.timetables}/${id}`);
        return data;
    } catch (err) {
        console.error("❌ deleteTimetable failed:", err);
        throw err;
    }
};

// Export all functions as a service object
export default {
  fetchAllBySemester,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  fetchTimetableWithEvents,
  fetchSpecialLectures,
  fetchTimetables
}
