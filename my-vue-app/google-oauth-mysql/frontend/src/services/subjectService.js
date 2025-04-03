import apiClient from "@/services/apiClient";

/**
 * 🔍 전체 과목 조회 (관리자용)
 */
export const getAllSubjects = async () => {
    try {
        const res = await apiClient.get("/subjects");
        return res.data;
    } catch (err) {
        console.error("❌ 전체 과목 조회 실패", err);
        return { subjects: [] };
    }
};

/**
 * 🔍 학년 기준 과목 조회
 * @param {number} year
 */
export const getSubjectsByYear = async (year) => {
    try {
        const res = await apiClient.get(`/subjects/year/${year}`);
        return res.data;
    } catch (err) {
        console.error("❌ 학년별 과목 조회 실패", err);
        return { subjects: [] };
    }
};

/**
 * 🔍 레벨 기준 과목 조회
 * @param {string} level
 */
export const getSubjectsByLevel = async (level) => {
    try {
        const res = await apiClient.get('/subjects/level', { params: { level } });
        return res.data;
    } catch (err) {
        console.error("❌ 레벨 기준 과목 조회 실패", err);
        return { subjects: [] };
    }
};

/**
 * 🔍 학기 기준 과목 조회
 * @param {object} options - { year, semester }
 */
export const getSubjectsBySemester = async ({ year, semester }) => {
    try {
        const res = await apiClient.get('/subjects/by-semester', {
            params: { year, semester }
        });
        return res.data;
    } catch (err) {
        console.error("❌ 학기별 과목 조회 실패", err);
        return { subjects: [] };
    }
};

/**
 * 🔍 특강 과목 조회
 */
export const getSpecialLectures = async () => {
    try {
        const res = await apiClient.get("/subjects/special");
        return res.data;
    } catch (err) {
        console.error("❌ 특강 과목 조회 실패", err);
        return { specialLectures: [] };
    }
};

/**
 * ➕ 과목 등록
 */
export const createSubject = async (subjectData) => {
    try {
        await apiClient.post("/subjects", subjectData);
    } catch (err) {
        console.error("❌ 과목 등록 실패", err);
        throw err;
    }
};

/**
 * ✏️ 과목 수정
 */
export const updateSubject = async (subject) => {
    try {
        await apiClient.put(`/subjects/${subject.id}`, subject);
    } catch (err) {
        console.error("❌ 과목 수정 실패", err);
        throw err;
    }
};

/**
 * ❌ 과목 삭제
 */
export const deleteSubject = async (id) => {
    try {
        await apiClient.delete(`/subjects/${id}`);
    } catch (err) {
        console.error("❌ 과목 삭제 실패", err);
        throw err;
    }
};
