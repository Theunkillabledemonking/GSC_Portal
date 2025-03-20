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

    // noticeData 객체 확인
    console.log("📌 전달받은 noticeData:", noticeData);

    // noticeData에서 files 프로퍼티 제거
    const dataToSend = { ...noticeData };
    delete dataToSend.files;

    /// ✅ subject_id가 '0'일 경우 제거
    Object.entries(dataToSend).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
            if (key === "subject_id" && value === "0") return; // subject_id가 0이면 추가 안 함
            formData.append(key, value);
        }
    });

    // 첨부파일 추가 (files는 반드시 배열이어야 함)
    if (Array.isArray(files)) {
        files.forEach(file => {
            formData.append("attachments", file);
        });
    } else {
        console.warn("files 파라미터는 배열이어야 합니다.", files);
    }

    // FormData 내용 콘솔 출력 (디버깅용)
    let formEntries = {};
    for (let [key, value] of formData.entries()) {
        formEntries[key] = value;
    }
    console.log("📌 FormData 확인:", formEntries);

    // 여기에서 Content-Type을 명시적으로 설정
    const response = await apiClient.post("/notices", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
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
