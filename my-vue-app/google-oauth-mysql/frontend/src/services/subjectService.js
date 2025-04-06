import apiClient from "@/services/apiClient";

// ✅ 응답 구조 안전 처리 함수
const handleResponse = async (promise, fallback = {}) => {
    try {
        const res = await promise;
        return res.data;
    } catch (err) {
        console.error("❌ API 요청 실패:", err);
        return fallback;
    }
};

// 🔍 전체 과목 조회 (관리자용)
export const getAllSubjects = () =>
    handleResponse(apiClient.get("/subjects"), { subjects: [] });

// 🔍 학년 기준 정규 과목 조회
export const getSubjectsByYear = (year) => {
    if (!year) return Promise.resolve({ subjects: [] });
    return handleResponse(apiClient.get(`/subjects/year/${year}`), { subjects: [] });
};

// 🔍 레벨 기준 과목 조회
export const getSubjectsByLevel = (level) => {
    if (!level) return Promise.resolve({ subjects: [] });
    return handleResponse(apiClient.get("/subjects/level", { params: { level } }), { subjects: [] });
};

// 🔍 학기 기준 정규 과목 조회
export const getSubjectsBySemester = ({ year, semester }) => {
    if (!year || !semester) return Promise.resolve({ subjects: [] });
    return handleResponse(apiClient.get("/subjects/by-semester", { params: { year, semester } }), { subjects: [] });
};

// 🔍 특강 과목 조회 (레벨, 분반 기반)
export const getSpecialLectures = ({ level, group_level, semester } = {}) => {
    if (!level || !semester) return Promise.resolve({ specialLectures: [] });
    
    const params = {
        level,
        semester,
        start_date: new Date().toISOString().split('T')[0],  // 오늘부터
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0]  // 6개월 후까지
    };
    if (group_level) params.group_level = group_level;
    
    console.log('📡 [getSpecialLectures]', params);
    return handleResponse(apiClient.get("/subjects/special", { params }), { specialLectures: [] });
};

// 🔍 이벤트 등록용 과목 조회
export const getSubjectsForEvent = async ({ year, level, group_level }) => {
    // 파라미터를 함께 전달 (year, level, group_level)
    const params = {};
    if (year) params.year = year;
    if (level) params.level = level;
    if (group_level) params.group_level = group_level;

    return handleResponse(
        apiClient.get("/subjects/event", { params }),
        { subjects: [] }
    );
};

// ➕ 과목 등록
export const createSubject = async (subjectData) => {
    try {
        await apiClient.post("/subjects", subjectData);
    } catch (err) {
        console.error("❌ 과목 등록 실패:", err);
        throw err;
    }
};

// ✏️ 과목 수정
export const updateSubject = async (subject) => {
    try {
        await apiClient.put(`/subjects/${subject.id}`, subject);
    } catch (err) {
        console.error("❌ 과목 수정 실패:", err);
        throw err;
    }
};

// ❌ 과목 삭제
export const deleteSubject = async (id) => {
    try {
        await apiClient.delete(`/subjects/${id}`);
    } catch (err) {
        console.error("❌ 과목 삭제 실패:", err);
        throw err;
    }
};
