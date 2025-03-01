import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/calendar';

export const listEvents = async (timeMin, timeMax) => {
    const res = await axios.get(`${API_BASE_URL}/events`, {
        params: { timeMin, timeMax },
    });
    return res.data; // 구글 이벤트 목록
}

export const createEvent = async (eventData) => {
    // { summary, description, startDate, endDate }
    const res = await axios.post(`${API_BASE_URL}/events`, eventData);
    return res.data;
}

// 일정 수정
export const updateEvent = async (eventId, eventData) => {
    const res = await axios.put(`${API_BASE_URL}/events/${eventId}`, eventData);
    return res.data;
}

export const deleteEvent = async (eventId) => {
    const res = await axios.delete(`${API_BASE_URL}/events/${eventId}`);
    return res.data;
};