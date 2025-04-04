// services/eventService.js

import apiClient from "@/services/apiClient";
import { getSemesterRange } from "@/utils/semester";
import { normalizeLevel } from "@/utils/level"; // ✅ 레벨 정규화 유틸

/**
 * 📦 학기 기반 이벤트 조회
 * - 내부적으로 start_date, end_date 자동 계산
 * @param {Object} filters
 * @param {number} filters.year - 실제 연도 (ex: 2025)
 * @param {string} filters.semester - 'spring' | 'summer' | 'fall' | 'winter'
 * @param {string} [filters.level] - 레벨 (N1, N2 등)
 * @returns {Promise<Array>} 이벤트 리스트
 */
export const fetchEventsBySemester = async ({ year, semester, level }) => {
    try {
        const { start_date, end_date } = getSemesterRange(year, semester);
        const normalizedLevel = normalizeLevel(level);

        return await fetchEvents({
            year,
            start_date,
            end_date,
            level: normalizedLevel
        });
    } catch (error) {
        console.error("❌ fetchEventsBySemester 실패:", error);
        return [];
    }
};

/**
 * 🔍 이벤트 목록 조회
 * - 날짜 기준 필터 필수
 * - level, group_level, year 조건부 필터 지원
 * @param {Object} filters
 * @param {string} filters.start_date - YYYY-MM-DD
 * @param {string} filters.end_date - YYYY-MM-DD
 * @param {string} [filters.level]
 * @param {number} [filters.year]
 * @param {string} [filters.group_level]
 * @returns {Promise<Array>}
 */
export const fetchEvents = async ({
                                      start_date,
                                      end_date,
                                      level,
                                      year,
                                      group_level
                                  } = {}) => {
    try {
        const normalizedLevel = normalizeLevel(level);

        const params = {
            start_date,
            end_date,
            ...(year && { year }),
            ...(normalizedLevel && { level: normalizedLevel }),
            ...(group_level && { group_level })
        };

        const res = await apiClient.get("/events", { params });
        return res.data?.events || [];
    } catch (err) {
        console.error("❌ 이벤트 조회 실패:", err);
        return [];
    }
};

/**
 * 🆕 이벤트 등록
 * @param {Object} payload - 등록 데이터
 * @returns {Promise<Object>} 등록 결과
 */
export const createEvent = async (payload) => {
    try {
        const res = await apiClient.post("/events", payload);
        return res.data;
    } catch (err) {
        console.error("❌ 이벤트 등록 실패:", err);
        throw err;
    }
};

/**
 * ✏️ 이벤트 수정
 * @param {number} eventId
 * @param {Object} payload - 수정 데이터
 * @returns {Promise<Object>}
 */
export const updateEvent = async (eventId, payload) => {
    try {
        const res = await apiClient.put(`/events/${eventId}`, payload);
        return res.data;
    } catch (err) {
        console.error("❌ 이벤트 수정 실패:", err);
        throw err;
    }
};

/**
 * ❌ 이벤트 삭제
 * @param {number} eventId
 * @returns {Promise<Object>}
 */
export const deleteEvent = async (eventId) => {
    try {
        const res = await apiClient.delete(`/events/${eventId}`);
        return res.data;
    } catch (err) {
        console.error("❌ 이벤트 삭제 실패:", err);
        throw err;
    }
};
