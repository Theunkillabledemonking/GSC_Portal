import apiClient from "./apiClient.js";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const googleLogin = async (code) => {
    try {
        // 백엔드로 code 전송
        const response = await apiClient.post(`${API_BASE_URL}/auth/google-login`, {code});
        return response.data;
    } catch (error) {
        console.error("Google 로그인 요청 실패", error.message?.data || error.message);
        throw error;
    }
};

export const registerUser = async (userData) => {
    try {
    const response = await apiClient.post(`${API_BASE_URL}/auth/register`, userData);
    return response.data;
    } catch (error) {
        console.error("회원가입 요청 실패", error.response?.data || error.message);
        throw error;
    }
};