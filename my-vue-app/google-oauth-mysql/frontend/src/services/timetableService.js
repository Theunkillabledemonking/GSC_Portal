// services/timetableService.js
import apiClient from "@/services/apiClient.js";

/**
 * 📦 정규 수업 + 이벤트 + 공휴일 전체 조회
 * @param {Object} params - { year, level, start_date, end_date }
 * @returns {Promise<{ timetables: Array, events: Array, holidays: Array }>}
 */
export const fetchTimetableWithEvents = async ({ year, level, start_date, end_date }) => {
    try {
        const res = await apiClient.get('/timetables/full', {
            params: {
                year,
                level: level || null,
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
 * 📘 정규 수업만 조회 (is_special_lecture = 0)
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
 * 🎓 특강 시간표 조회 (is_special_lecture = 1)
 * @param {string} level
 * @param {number} startDate
 * @param {number} endDate
 * @returns {Promise<Array>}
 */
export const fetchSpecialLectures = async ( level, startDate, endDate) => {
    try {
        const res = await apiClient.get('/timetables/special', {
            params: {
                level,
                start_date: startDate,
                end_date: endDate
            }
        });
        return res.data;
    } catch (error) {
        console.error('❌ 특강 시간표 조회 실패:', error);
        return [];
    }
};

/**
 * 🆕 정규 or 특강 수업 등록
 * @param {Object} timetableData
 * @returns {Promise<Object>} 생성된 ID 포함 응답
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
 * ✏️ 정규 or 특강 수업 수정
 * @param {number} id
 * @param {Object} timetableData
 * @returns {Promise<Object>}
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
 * ❌ 정규 or 특강 수업 삭제
 * @param {number} id
 * @returns {Promise<Object>}
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
