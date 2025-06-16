// services/userService.js
import apiClient from '@/services/apiClient';

// 전체 유저 조회
export const getAllUsers = () => apiClient.get('/admin/users');

// 승인 대기 유저 조회
export const getPendingUsers = () => apiClient.get('/admin/users/pending');

// 승인 상태 변경
export const updateUserStatus = (id, status) =>
    apiClient.patch(`/admin/users/${id}/status`, { status });

// 유저 정보 수정
export const updateUserInfo = (id, data) =>
    apiClient.patch(`/admin/users/${id}/info`, data);
