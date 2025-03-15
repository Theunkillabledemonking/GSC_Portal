import apiClient from "@/services/apiClient";

/** 이벤트(휴강·보강·특강) 조회 */
export const fetchEvents = async () => {
    const res = await apiClient.get('/events');
    return res.data; // { events: [] }
};

/** 이벤트 생성 */
export const createEvent = async (payload) => {
    const res = await apiClient.post('/events', payload);
    return res.data;
};

/** 이벤트 수정 */
export const updateEvent = async (eventId, payload) => {
    const res = await apiClient.put(`/events/${eventId}`, payload);
    return res.data;
};

/** 이벤트 삭제 */
export const deleteEvent = async (eventId) => {
    const res = await apiClient.delete(`/events/${eventId}`);
    return res.data;
};
