import apiClient from "@/services/apiClient";

// ✅ 공지사항 목록 조회 (필터링 적용)
export const fetchNotices = async (filters = {}) => {
    const response = await apiClient.get("/notices", { params: filters });
    return response.data.notices;
};

// ✅ 공지사항 상세 조회 (조회수 증가 포함)
export const fetchNoticeById = async (id) => {
    const response = await apiClient.get(`/notices/${id}`);
    return response.data;
};

// ✅ 공지사항 등록 (첨부파일 여러 개 가능)
export const createNotice = async (noticeData, files = []) => {
    const formData = new FormData();

    // 기본 공지사항 정보 추가
    Object.keys(noticeData).forEach(key => {
        formData.append(key, noticeData[key]);
    });

    // 첨부파일 추가
    files.forEach(file => {
        formData.append("attachments", file);
    });

    console.log("FormData 전송 확인:", Object.fromEntries(formData));

    const response = await apiClient.post("/notices", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
};

// ✅ 공지사항 수정 (첨부파일 포함)
export const updateNotice = async (id, noticeData, files = []) => {
    const formData = new FormData();

    // 기본 공지사항 정보 추가
    Object.keys(noticeData).forEach(key => {
        formData.append(key, noticeData[key]);
    });

    // 첨부파일 추가
    files.forEach(file => {
        formData.append("attachments", file);
    });

    const response = await apiClient.put(`/notices/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
};

// ✅ 공지사항 삭제
export const deleteNotice = async (id) => {
    const response = await apiClient.delete(`/notices/${id}`);
    return response.data;
};
