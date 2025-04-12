// utils/lineNotification.js
const pool = require("../config/db");
const { sendLineMessage } = require("../controllers/lineMessageController");

/**
 * 📢 LINE 대상 필터링 후 메시지 전송
 * @param {Object} options - 필터링 및 전송 정보
 * @param {string} options.title
 * @param {string} options.content
 * @param {number|null} options.grade
 * @param {string|null} options.level
 * @param {number|null} options.is_foreigner
 * @param {boolean} options.isUpdate - 수정 여부
 */
const sendLineNotification = async ({ title, content, grade, level, is_foreigner, isUpdate = false }) => {
    let query = `SELECT line_user_id FROM users WHERE line_user_id IS NOT NULL`;
    const params = [];

    if (grade && Number(grade) > 0) {
        query += " AND grade = ?";
        params.push(Number(grade));
    }
    if (level && level !== "ALL") {
        query += " AND level = ?";
        params.push(level);
    }
    if (is_foreigner !== undefined && is_foreigner !== null) {
        query += " AND is_foreigner = ?";
        params.push(is_foreigner);
    }


    const [targets] = await pool.query(query, params);
    console.log("📨 전송 대상 수:", targets.length);

    const message = `📢 [공지${isUpdate ? " 수정됨" : ""}] ${title}\n${content}\n👉 포털에서 확인하세요`;

    for (const { line_user_id } of targets) {
        if (!line_user_id || !message) {
            console.warn("⚠️ [LINE] 전송 대상 또는 메시지 누락됨:", { to: line_user_id, message });
            continue;
        }

        try {
            await sendLineMessage(line_user_id, message);
            console.log("📤 전송 성공:", line_user_id);
        } catch (e) {
            console.error("❌ 전송 실패:", line_user_id, e.message);
        }
    }
};

module.exports = { sendLineNotification };
