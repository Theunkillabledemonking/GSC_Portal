// services/timetableService.js
import apiClient from "@/services/apiClient.js";

/**
 * 📦 학년별 시간표 + 이벤트 + 공휴일 조회
 * @param {Object} params - year, level, start_date, end_date
 * @returns {Promise<{ timetables: Array, events: Array, holidays: Array }>}
 */
export const fetchTimetableWithEvents = async ({ year, level, start_date, end_date }) => {
    try {
        const res = await apiClient.get('/timetables/full', {
            params: {
                year,
                level: level || undefined,
                start_date,
                end_date
            }
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
 * 📘 정규 시간표만 조회 (TimetableList 용)
 * @param {number} year
 * @param {string} level
 * @returns {Promise<Array>}
 */
export const fetchTimetables = async (year, level) => {
    try {
        const res = await apiClient.get('/timetables', {
            params: { year, level }
        });
        return res.data?.timetables || [];
    } catch (error) {
        console.error('❌ 정규 시간표 조회 실패:', error);
        return [];
    }
};

/**
 * 🆕 정규 수업 생성
 * @param {Object} timetableData
 */
export const createTimetable = async (timetableData) => {
    try {
        const res = await apiClient.post('/timetables', timetableData);
        return res.data;
    } catch (error) {
        console.error('❌ 시간표 등록 실패:', error);
        throw error;
    }
};

/**
 * ✏️ 정규 수업 수정
 * @param {number} id
 * @param {Object} timetableData
 */
export const updateTimetable = async (id, timetableData) => {
    try {
        const res = await apiClient.put(`/timetables/${id}`, timetableData);
        return res.data;
    } catch (error) {
        console.error('❌ 시간표 수정 실패:', error);
        throw error;
    }
};

/**
 * ❌ 정규 수업 삭제
 * @param {number} id
 */
export const deleteTimetable = async (id) => {
    try {
        const res = await apiClient.delete(`/timetables/${id}`);
        return res.data;
    } catch (error) {
        console.error('❌ 시간표 삭제 실패:', error);
        throw error;
    }
};
