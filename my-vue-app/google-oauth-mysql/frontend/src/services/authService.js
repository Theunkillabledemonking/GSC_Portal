// API 호출 모듈
import axios from 'axios';

const API_BASE_URL = import.meta.env.API_BASE_URL;

// Google 로그인 API 호출
export const googleLogin = async (code) => {
    // 백엔드 API에 Google OAuth 인가 코드를 전달
    const response = await axios.post(`${API_BASE_URL}/auth/google-login`, { code });
    return response.data;
}

// 사용자 회원가입 API 호출
export const registerUser = async (userData) => {
    // 백엔드 API에 사용자 정보를 전달하여 회원가입
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
    return response.data;
}