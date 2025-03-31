import apiClient from "@/services/apiClient";

/**
 * 🔍 정규 + 공통 과목 조회 (학년 기준)
 * @param {number} year
 * @returns {Promise<{ subjects: Array }>}
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

export const getSubjectsByLevel = async (level) => {
    try {
        const res = await apiClient.get('/subjects/level', {
            params: { level }
        });
        return res.data;
    } catch (err) {
        console.error("❌ 레벨 기준 과목 조회 실패", err);
        return { subjects: [] };
    }
}


/**
 * 🔍 전체 과목 조회 (관리자용)
 * @returns {Promise<{ subjects: Array }>}
 */
export const getAllSubjects = async () => {
    try {
        const res = await apiClient.get("/subjects");
        return res.data;
    } catch (err) {
        console.error("❌ 전체 과목 조회 실패", err);
        throw err;
    }
};

/**
 * ➕ 과목 등록
 * @param {Object} subjectData - { name, year, level, is_special_lecture }
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
 * @param {Object} subject - { id, name, year, level, ... }
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
 * @param {number} id - 과목 ID
 */
export const deleteSubject = async (id) => {
    try {
        await apiClient.delete(`/subjects/${id}`);
    } catch (err) {
        console.error("❌ 과목 삭제 실패", err);
        throw err;
    }
};

/**
 * 🔍 특강 과목 조회 (사용자 레벨 기준)
 * @returns {Promise<{ specialLectures: Array }>}
 */
export const getSpecialLectures = async () => {
    try {
        const res = await apiClient.get("/subjects/special");
        return res.data;
    } catch (err) {
        console.error("❌ 특강 과목 조회 실패", err);
        throw err;
    }
};