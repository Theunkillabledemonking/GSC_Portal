// API 호출 모듈

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const googleLogin = async (code) => {
    // 백엔드로 code 전송
    const response = await axios.post(`${API_BASE_URL}/auth/google-login`, { code });
    return response.data;
};

export const registerUser = async (userData) => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
    return response.data;
};