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
                                                   group_level = "A",
                                                   start_date,
                                                   end_date,
                                                   type = "all"
                                               }) => {
    const { start_date: s, end_date: e } = resolveDateRange(year, semester, start_date, end_date);
    const normalizedLevel = normalizeLevel(level);

    const params = {
        year,
        semester,
        level: normalizedLevel,
        group_level,
        start_date: s,
        end_date: e,
        type
    };

    console.log("📡 [fetchTimetableWithEvents]", params);

    try {
        const { data } = await apiClient.get(ENDPOINTS.timetableWithEvents, { params });
        return {
            timetables: data?.timetables || [],
            events:     data?.events     || [],
            holidays:   data?.holidays   || []
        };
    } catch (err) {
        console.error("❌ fetchTimetableWithEvents failed:", err);
        return { timetables: [], events: [], holidays: [] };
    }
};

// ---------------------------------------------------------------------------
// 2) 특강 전용 조회
// ---------------------------------------------------------------------------

export const fetchSpecialLectures = async ({
                                               year,
                                               semester,
                                               level,
                                               group_level = "A",
                                               start_date,
                                               end_date
                                           }) => {
    const { start_date: s, end_date: e } = resolveDateRange(year, semester, start_date, end_date);
    const normalizedLevel = normalizeLevel(level);

    const params = { semester, level: normalizedLevel, group_level, start_date: s, end_date: e };
    console.log("📡 [fetchSpecialLectures]", params);

    try {
        const { data } = await apiClient.get(ENDPOINTS.specialLectures, { params });
        return data;
    } catch (err) {
        console.error("❌ fetchSpecialLectures failed:", err);
        return [];
    }
};

// ---------------------------------------------------------------------------
// 3) 정규 수업 전용 조회
// ---------------------------------------------------------------------------

export const fetchTimetables = async ({ year, semester }) => {
    try {
        const { data } = await apiClient.get(ENDPOINTS.timetables, { params: { year, semester } });
        return data?.timetables || [];
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
