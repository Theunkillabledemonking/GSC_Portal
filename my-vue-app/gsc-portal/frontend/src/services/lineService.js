// ✅ lineService.js
import apiClient from "@/services/apiClient";

// 인증번호 요청 → 백엔드에서 인증번호 생성 + DB 저장
export const requestLineAuthCode = async (user_id) => {
    const response = await apiClient.post("/line/generate", { user_id });
    return response.data;
};