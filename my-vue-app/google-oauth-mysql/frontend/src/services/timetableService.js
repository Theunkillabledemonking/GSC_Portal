
import apiClient from "@/services/apiClient.js";

/**
 * 학년별 시간표 및 이벤트 조회 API 호출
 * @param {Object} params - year, level, start_date, end_date
 * @returns {Promise<Object>} - { timetables: [], events: []}
 */
export const fetchTimetableWithEvents = async ({ year, level, start_date, end_date }) => {
    try {
        const response = await apiClient.get('/timetables/full', {
            params: {
                year,
                level: level !== null ? level : undefined,
                start_date,
                end_date
            }
        });

        const { timetables = [], events = [], holidays = [] } = response.data || {};

        return { timetables, events, holidays }

    } catch (error) {
        console.error('시간표 및 이벤트 조회 실패', error);
        return { timetables: [], events: [], holidays: [] };
    }
};

/**
 * 단순 정규 시간표만 조회 (목록 리스트용)
 * @param {number} year
 * @param {string} level
 * @returns {Promise<{ timetables: Array }>}
 */
export const fetchTimetables = async (year, level) => {
    try {
        const res = await apiClient.get('/timetables', {
            params: { level, year }
        });
        return res.data?.timetables || [];

    } catch (error) {
        console.error('정규 시간표 조회 실패', error);
        return [];
    }
};


/**
 * 정규 시간표 등록 API
 * @param {Object} timetableData - 시간표 정보
 */
export const createTimetable = async (timetableData) => {
    try {
        await apiClient.post('/timetables', timetableData);
    } catch (error) {
        console.error('시간표 등록 실패', error);
        throw error;
    }
};

/**
 * 정규 시간표 수정 API
 * @param {Number} id - 시간표 ID
 * @param {Object} timetableData - 시간표 정보
 */
export const updateTimetable = async (id, timetableData) => {
    try {
        await apiClient.put(`/timetables/${id}`, timetableData);
    } catch (error) {
        console.error('시간표 수정 실패', error);
        throw error;
    }
};


/**
 * 정규 시간표 삭제 API
 * @param {Number} id - 시간표 ID
 */
export const deleteTimetable = async (id) => {
    try {
        await apiClient.delete(`/timetables/${id}`);
    } catch (error) {
        console.error('시간표 삭제 실패', error);
        throw error;
    }
};
