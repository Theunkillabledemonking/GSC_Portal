import apiClient from "@/services/apiClient";

/**
 * 🔍 이벤트(휴강·보강·특강·행사) 조회
 * @param {Object} filters - start_date, end_date, level
 * @returns {Promise<{ events: Array }>}
 */
export const fetchEvents = async ({ start_date, end_date, level } = {}) => {
    try {
        const response = await apiClient.get("/events", {
            params: {
                start_date,
                end_date,
                level: level ?? undefined,
            },
        });
        return response.data;
    } catch (err) {
        console.error("❌ 이벤트 조회 실패", err);
        throw err;
    }
};

/**
 * ✅ 이벤트 등록
 * @param {Object} payload - 이벤트 데이터
 * @returns {Promise<Object>} - 생성된 이벤트 정보
 */
export const createEvent = async (payload) => {
    try {
        const response = await apiClient.post("/events", payload);
        return response.data;
    } catch (err) {
        console.error("❌ 이벤트 생성 실패", err);
        throw err;
    }
};

/**
 * ✏️ 이벤트 수정
 * @param {Number} eventId - 수정 대상 이벤트 ID
 * @param {Object} payload - 수정할 데이터
 * @returns {Promise<Object>}
 */
export const updateEvent = async (eventId, payload) => {
    try {
        const response = await apiClient.put(`/events/${eventId}`, payload);
        return response.data;
    } catch (err) {
        console.error("❌ 이벤트 수정 실패", err);
        throw err;
    }
};

/**
 * ❌ 이벤트 삭제
 * @param {Number} eventId - 삭제 대상 이벤트 ID
 * @returns {Promise<Object>}
 */
export const deleteEvent = async (eventId) => {
    try {
        const response = await apiClient.delete(`/events/${eventId}`);
        return response.data;
    } catch (err) {
        console.error("❌ 이벤트 삭제 실패", err);
        throw err;
    }
};
