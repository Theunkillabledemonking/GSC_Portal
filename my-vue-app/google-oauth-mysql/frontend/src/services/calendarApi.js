import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/calendar';

// 일정 조회
export const listEvents = async (timeMin, timeMax) => {
    const res = await axios.get(`${API_BASE_URL}/events`, { params: { timeMin, timeMax } });
    return res.data;
};

// 일정 추가
export const createEvent = async (eventData) => {
    const res = await axios.post(`${API_BASE_URL}/events`, eventData);
    return res.data;
};

// 일정 삭제
export const deleteEvent = async (eventId) => {
    const res = await axios.delete(`${API_BASE_URL}/events/${eventId}`);
    return res.data;
};

// 일정 수정 (필요시 추가 가능)
export const updateEvent = async (eventId, eventData) => {
    const res = await axios.put(`${API_BASE_URL}/events/${eventId}`, eventData);
    return res.data;
};
