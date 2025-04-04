// services/timetableService.js

import apiClient from "@/services/apiClient.js";
import { getSemesterRange } from "@/utils/semester";
import { normalizeLevel } from "@/utils/level"; // ✅ 레벨 정규화


/**
 * 📦 정규 수업 + 이벤트 + 공휴일 전체 조회
 * @param {Object} params - { year, level, semester, start_date, end_date }
 * @returns {Promise<{ timetables: Array, events: Array, holidays: Array }>}
 */
export const fetchTimetableWithEvents = async ({ year, level, semester, start_date, end_date }) => {
    try {
        console.log("📡 fetchTimetableWithEvents 파라미터:", { year, level, semester, start_date, end_date });
        if (!semester) throw new Error("학기 정보 없음");

        const allowed = ['spring', 'summer', 'fall', 'winter', 'full'];
        if (!allowed.includes(semester)) throw new Error(`허용되지 않은 학기값: ${semester}`);

        // start_date와 end_date가 제공되지 않으면 학기 범위로 계산
        if (!start_date || !end_date) {
            ({ start_date, end_date } = getSemesterRange(year, semester));
        }

        console.log("📡 호출: /timetables/full", { year, level, start_date, end_date });
        const res = await apiClient.get('/timetables/full', {
            params: { year, level, start_date, end_date, semester }
        });

        return {
            timetables: res.data?.timetables || [],
            events: res.data?.events || [],
            holidays: res.data?.holidays || []
        };
    } catch (error) {
        console.error('❌ 시간표 및 이벤트 조회 실패:', error);
        return { timetables: [], events: [], holidays: [] };
    }
};

/**
 * 🎓 특강 시간표 조회 (is_special_lecture = 1)
 * @param {number|string} year - 달력 연도 (예: 2025)
 * @param {string} semester - 학기 (예: 'spring')
 * @param {string} level - 레벨 (예: N1, N2)
 * @param {string} [start_date] - (선택) 직접 지정한 시작 날짜
 * @param {string} [end_date] - (선택) 직접 지정한 종료 날짜
 * @returns {Promise<Array>}
 */
export const fetchSpecialLectures = async (year, semester, level, start_date, end_date) => {
    try {
        // start_date와 end_date가 제공되지 않으면 학기 범위로 계산
        if (!start_date || !end_date) {
            ({ start_date, end_date } = getSemesterRange(year, semester));
        }

        const normalizedLevel = normalizeLevel(level);
        const res = await apiClient.get('/timetables/special', {
            params: {
                level: normalizedLevel,
                start_date,
                end_date
            }
        });
        return res.data;
    } catch (error) {
        console.error("❌ 특강 시간표 조회 실패:", error);
        return [];
    }
};

/**
 * 📘 정규 수업만 조회
 * @param {number} year - 달력 연도 (예: 2025)
 * @param {string} semester
 * @param {string} level
 */
export const fetchTimetables = async (year, semester, level) => {
    try {
        const normalizedLevel = normalizeLevel(level);
        const res = await apiClient.get("/timetables", {
            params: { year, semester, level: normalizedLevel }
        });
        return res.data?.timetables || [];
    } catch (error) {
        console.error("❌ 정규 시간표 조회 실패:", error);
        return [];
    }
};


/**
 * 🆕 정규 or 특강 수업 등록
 * @param {Object} timetableData
 * @returns {Promise<Object>}
 */
export const createTimetable = async (timetableData) => {
    try {
        const res = await apiClient.post("/timetables", timetableData);
        return res.data;
    } catch (error) {
        console.error("❌ 시간표 등록 실패:", error);
        throw error;
    }
};

/**
 * ✏️ 정규 or 특강 수업 수정
 * @param {number} id
 * @param {Object} timetableData
 */
export const updateTimetable = async (id, timetableData) => {
    try {
        const res = await apiClient.put(`/timetables/${id}`, timetableData);
        return res.data;
    } catch (error) {
        console.error("❌ 시간표 수정 실패:", error);
        throw error;
    }
};

/**
 * ❌ 정규 or 특강 수업 삭제
 * @param {number} id
 */
export const deleteTimetable = async (id) => {
    try {
        const res = await apiClient.delete(`/timetables/${id}`);
        return res.data;
    } catch (error) {
        console.error("❌ 시간표 삭제 실패:", error);
        throw error;
    }
};
