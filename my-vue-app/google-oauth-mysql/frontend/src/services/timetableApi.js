
import apiClient from "@/services/apiClient.js";

/**
 * 학년별 시간표 및 이벤트 조회 API 호출
 * @param {Object} params - year, level, start_date, end_date
 * @returns {Promise<Object>} - { timetables: [], events: []}
 */
export const fetchTimetableWithEvents = async ({ year, level, start_date, end_date }) => {
    try {
        const response = await apiClient.get('/timetables/timetable-with-events', {
            params: {
                year,
                level,
                start_date,
                end_date
            }
        });

        // 응답 데이터 반환
        return response.data;
    } catch (error) {
        console.error('시간표 및 이벤트 조회 실패', error);
        throw error; // 상위 컴포넌트에서 에러 처리
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

/**
 * 이벤트(휴강/보강/특강) 등록 API
 * @param {Object} eventData - 이벤트 정보
 */
export const createEvent = async (eventData) => {
    try {
        await apiClient.post('/timetables/events', eventData);
    } catch (error) {
        console.error('이벤트 등록 실패', error);
        throw error;
    }
};

/**
 * 이벤트(휴강/보강/특강) 수정 API
 * @param {Number} eventId - 이벤트 ID
 * @param {Object} eventData - 이벤트 정보
 */
export const updateEvent = async (eventId, eventData) => {
    try {
        await apiClient.put(`/timetable/events/${eventId}`, eventData);
    } catch (error) {
        console.error('이벤트 수정 실패', error);
        throw error;
    }
};

/**
 * 이벤트(휴강/보강/특강) 삭제 API
 * @param {Number} eventId - 이벤트 ID
 */
export const deleteEvent = async (eventId) => {
    try {
        await apiClient.delete(`/timetable/events/${eventId}`);
    } catch (error) {
        console.error('이벤트 삭제 실패', error);
        throw error;
    }
};