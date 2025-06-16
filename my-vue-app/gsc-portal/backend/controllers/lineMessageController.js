const axios = require("axios");
require("dotenv").config();

const LINE_API_URL = "https://api.line.me/v2/bot/message/push";
const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

/**
 * ✅ LINE 메시지 전송 유틸 함수
 */
exports.sendLineMessage = async (to, message) => {
    if (!ACCESS_TOKEN) {
        console.error("❌ [LINE] Access Token 누락! .env 설정 확인 필요.");
        return false;
    }
    if (!to || !message) {
        console.warn("⚠️ [LINE] 전송 대상 또는 메시지 내용 누락됨:", { to, message });
        return false;
    }

    try {
        await axios.post(
            LINE_API_URL,
            { to, messages: [{ type: "text", text: message }] },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                },
            }
        );
        console.log(`✅ [LINE] 메시지 전송 성공 → ${to}`);
        return true;
    } catch (error) {
        console.error(`❌ [LINE] 메시지 전송 실패 → ${to}`, error.response?.data || error.message);
        return false;
    }
};
