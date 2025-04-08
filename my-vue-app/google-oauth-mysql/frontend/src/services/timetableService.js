// services/timetableService.js -------------------------------------------------
// 백엔드 라우팅 구조(리팩터링된 TimetableController)에 맞춰 전체 API 래퍼를 재정비했다.
// 주요 변경 사항
//   1. 엔드포인트 상수화 → 한 곳에서 경로 관리.
//   2. 날짜 범위(resolveDateRange) 유틸 → start_date·end_date가 없으면 학기 범위 자동 계산.
//   3. fetchTimetableWithEvents → /timetable-with-events 로 경로 통일, group_level·type 파라미터 추가.
//   4. fetchSpecialLectures → /special-lectures 로 경로 통일.
//   5. fetchTimetables → 정규 수업 전용, level 파라미터 제거(백엔드에서 무시하므로).
//   6. CRUD 함수는 ENDPOINTS.timetables 기반으로 경로 일원화.
// ---------------------------------------------------------------------------

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
    timetables:          "/timetables"                // 정규 수업 CRUD
};

/**
 * 🗓️ start_date / end_date 가 없으면 학기 범위를 계산해 반환한다.
 */
function resolveDateRange(year, semester, start_date, end_date) {
    if (start_date && end_date) return { start_date, end_date };
    return getSemesterRange(year, semester);
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
        
        // 데이터 정규화
        const timetables = (data?.timetables || []).map(item => {
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
            if (item.event_type === 'cancel') {
                return {
                    ...normalized,
                    event_type: 'cancel',
                    original_class,
                    description: item.description || '휴강',
                    date: item.event_date ? dayjs(item.event_date).format('YYYY-MM-DD') : normalized.date
                }
            }

            if (item.event_type === 'makeup') {
                return {
                    ...normalized,
                    event_type: 'makeup',
                    description: item.description || '보강',
                    date: item.event_date ? dayjs(item.event_date).format('YYYY-MM-DD') : normalized.date
                };
            }

            if (item.event_type === 'holiday') {
                return {
                    ...normalized,
                    event_type: 'holiday',
                    description: item.description || '공휴일',
                    start_period: 1,
                    end_period: 9
                };
            }

            if (item.is_special_lecture) {
                return {
                    ...normalized,
                    event_type: 'special',
                    description: item.description || '특강',
                    date: item.event_date ? dayjs(item.event_date).format('YYYY-MM-DD') : normalized.date
                };
            }

            // 기본은 정규 수업
            return {
                ...normalized,
                event_type: 'regular',
                description: item.description || '정규 수업'
            };
        });

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

export const fetchSpecialLectures = async ({
    year,
    semester,
    level = '1',  // 기본값 설정
    group_level = '',
    start_date,
    end_date
}) => {
    // 필수 파라미터 검증
    if (!year || isNaN(year)) {
        console.warn('❌ year must be a valid number for fetchSpecialLectures');
        return [];
    }

    if (!semester) {
        console.warn('❌ semester is required for fetchSpecialLectures');
        return [];
    }

    // 날짜 범위 계산 (학기 기준)
    const dateRange = resolveDateRange(year, semester, start_date, end_date);
    
    // 파라미터 정규화
    const params = {
        year: Number(year),
        semester,
        level: normalizeLevel(level || '1'),  // level은 필수이므로 기본값 설정
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
    };

    // group_level은 선택적 파라미터
    if (group_level && group_level !== '') {
        params.group_level = group_level;
    }

    console.log("📡 [fetchSpecialLectures] Request:", { 
        url: ENDPOINTS.specialLectures,
        params 
    });

    try {
        const { data } = await apiClient.get(ENDPOINTS.specialLectures, { params });
        
        // 응답 데이터 정규화
        const lectures = (data?.timetables || []).map(lecture => ({
            ...lecture,
            event_type: 'special',
            year: Number(lecture.year || year),
            level: lecture.level || level || '1',
            date: lecture.date ? dayjs(lecture.date).format('YYYY-MM-DD') : null,
            start_period: Number(lecture.start_period || 1),
            end_period: Number(lecture.end_period || 1)
        }));

        console.log("📚 특강 데이터:", {
            total: lectures.length,
            dates: lectures.map(l => l.date),
            params
        });

        return lectures;
    } catch (err) {
        // 에러 응답 상세 로깅
        if (err.response) {
            console.error("❌ fetchSpecialLectures failed:", {
                status: err.response.status,
                statusText: err.response.statusText,
                data: err.response.data,
                params
            });
        } else {
            console.error("❌ fetchSpecialLectures failed:", err);
        }
        return [];
    }
};

// ---------------------------------------------------------------------------
// 3) 정규 수업 전용 조회
// ---------------------------------------------------------------------------

export const fetchTimetables = async ({ year, semester, day }) => {
    try {
        const params = { semester }
        if (year) params.year = year
        if (day) params.day = day

        const { data } = await apiClient.get(ENDPOINTS.timetables, { params });
        return data?.timetables || [];  // 백엔드 응답 구조에 맞춰 수정
    } catch (err) {
        console.error("❌ fetchTimetables failed:", err);
        return [];
    }
};

// ---------------------------------------------------------------------------
// 4) CRUD – 정규·특강 모두 사용
// ---------------------------------------------------------------------------

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

export const updateTimetable = async (id, timetableData) => {
    try {
        const { data } = await apiClient.put(`${ENDPOINTS.timetables}/${id}`, timetableData);
        return data;
    } catch (err) {
        console.error("❌ updateTimetable failed:", err);
        throw err;
    }
};

export const deleteTimetable = async id => {
    try {
        const { data } = await apiClient.delete(`${ENDPOINTS.timetables}/${id}`);
        return data;
    } catch (err) {
        console.error("❌ deleteTimetable failed:", err);
        throw err;
    }
};
