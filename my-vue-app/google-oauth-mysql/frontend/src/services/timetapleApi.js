
import apiClient from "@/services/apiClient.js";

/**
 * 학년별 시간표 및 이벤트 조회 API 호출
 * @param {Object} params - year, level, start_date, end_date
 * @returns {Promise<Object>} - { timetables: [], events: []}
 */
export const fetchTimetableWithEvents = async ({ year, level, start_date, end_date }) => {
    try {
        const response = await apiClient.get('/timetable-with-events', {
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