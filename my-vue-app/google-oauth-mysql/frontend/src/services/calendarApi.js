import axios from 'axios';
const API_BASE_URL = 'http://localhost:5000/api/calendar';

export const listEvents = async (timeMin, timeMax) => {
    return (await axios.get(`${API_BASE_URL}/events`, { params: { timeMin, timeMax } })).data;
};

export const createEvent = async (data) => (await axios.post(`${API_BASE_URL}/events`, data)).data;
export const updateEvent = async (id, data) => (await axios.put(`${API_BASE_URL}/events/${id}`, data)).data;
export const deleteEvent = async (id) => (await axios.delete(`${API_BASE_URL}/events/${id}`)).data;
