// services/eventService.js
import apiClient from "@/services/apiClient";

/**
 * 🔍 이벤트 목록 조회
 * @param {Object} filters - { start_date, end_date, level }
 * @returns {Promise<Array>} - 이벤트 배열
 */
export const fetchEvents = async ({ start_date, end_date, level } = {}) => {
    try {
        const res = await apiClient.get("/events", {
            params: {
                start_date,
                end_date,
                level: level || undefined
            }
        });

        return res.data?.events || [];
    } catch (err) {
        console.error("❌ 이벤트 조회 실패:", err);
        return [];
    }
};

/**
 * ✅ 이벤트 등록
 * @param {Object} payload - 이벤트 데이터
 * @returns {Promise<Object>} - 생성된 이벤트 정보
 */
export const createEvent = async (payload) => {
    try {
        const res = await apiClient.post("/events", payload);
        return res.data;
    } catch (err) {
        console.error("❌ 이벤트 등록 실패:", err);
        throw err;
    }
};

/**
 * ✏️ 이벤트 수정
 * @param {Number} eventId - 수정할 이벤트 ID
 * @param {Object} payload - 수정 데이터
 * @returns {Promise<Object>}
 */
export const updateEvent = async (eventId, payload) => {
    try {
        const res = await apiClient.put(`/events/${eventId}`, payload);
        return res.data;
    } catch (err) {
        console.error("❌ 이벤트 수정 실패:", err);
        throw err;
    }
};

/**
 * ❌ 이벤트 삭제
 * @param {Number} eventId - 삭제 대상 ID
 * @returns {Promise<Object>}
 */
export const deleteEvent = async (eventId) => {
    try {
        const res = await apiClient.delete(`/events/${eventId}`);
        return res.data;
    } catch (err) {
        console.error("❌ 이벤트 삭제 실패:", err);
        throw err;
    }
};
