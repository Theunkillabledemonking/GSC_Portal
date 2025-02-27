// API 요청 함수
import axios from 'axios';

// API 기본 URL
const API_BASE_URL = import.meta.env.VITE_API_URL;

// ✅ 공지사항 전체 조회
export const fetchNotices = async () => {
    const token = localStorage.getItem("accessToken");
    const response = await axios.get(`${API_BASE_URL}/notices`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.notices.sort((a, b) => b.is_important - a.is_important); // ✅ 중요 공지를 맨 위로 정렬
};

// ✅ 공지사항 상세 조회
export const fetchNoticeById = async (id) => {
    const token = localStorage.getItem("accessToken");
    const response = await axios.get(`${API_BASE_URL}/notices/${id}`, {
        headers: { Authorization: `Bearer ${token}`}
    })
    return response.data;
}

// ✅ 공지사항 등록 (is_important 추가)
export const createNotice = async (noticeData) => {
    const token = localStorage.getItem("accessToken");
    const response = await axios.post(`${API_BASE_URL}/notices`, noticeData, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// ✅ 공지사항 수정 (is_important 추가)
export const updateNotice = async (id, noticeData) => {
    const token = localStorage.getItem("accessToken");
    const response = await axios.put(`${API_BASE_URL}/notices/${id}`, noticeData, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// ✅ 공지사항 삭제
export const deleteNotice = async (id) => {
    const token = localStorage.getItem("accessToken");
    const response = await axios.delete(`${API_BASE_URL}/notices/${id}`, {
        headers: {Authorization: `Bearer ${token}` }
    });
};