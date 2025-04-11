const axios = require("axios");
require("dotenv").config();

const LINE_API_URL = "https://api.line.me/v2/bot/message/push";
const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

/**
 * LINE 메시지 전송 유틸 함수
 * @param {string} to - 사용자 ID
 * @param {string} message - 전송할 텍스트 메시지
 */
exports.sendLineMessage = async (to, message) => {
    if (!ACCESS_TOKEN) {
        console.error("❌ LINE Access Token 누락! .env 설정 확인 필요.");
        return;
    }

    try {
        const response = await axios.post(
            LINE_API_URL,
            {
                to,
                messages: [
                    {
                        type: "text",
                        text: message,
                    },
                ],
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                },
            }
        );

        console.log("✅ LINE 메시지 전송 성공:", response.data);
    } catch (error) {
        console.error("❌ LINE 메시지 전송 실패:", error.response?.data || error.message);
    }
};
