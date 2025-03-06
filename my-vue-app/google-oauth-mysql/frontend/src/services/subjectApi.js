import axios from 'axios';
import apiClient from "@/services/apiClient.js";
const API_BASE_URL = import.meta.env.VITE_API_URL;  // 환경변수로 관리

export const getSubjectsByYear = async (year) => {
    const res = await apiClient.get(`/subjects/${year}`);
    return res.data;
}

// 과목 목록 조회
export const getSubjects = async () => {
    const token = localStorage.getItem("accessToken");  // 토큰 직접 가져오기
    const response = await axios.get(`${API_BASE_URL}/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// 과목 등록
export const createSubject = async (subject) => {
    const token = localStorage.getItem("accessToken");
    await axios.post(`${API_BASE_URL}/subjects`, subject, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// 과목 수정
export const updateSubject = async (subject) => {
    const token = localStorage.getItem("accessToken");
    await axios.put(`${API_BASE_URL}/subjects/${subject.id}`, subject, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// 과목 삭제
export const deleteSubject = async (id) => {
    const token = localStorage.getItem("accessToken");
    await axios.delete(`${API_BASE_URL}/subjects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
