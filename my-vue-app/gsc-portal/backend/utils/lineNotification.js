// utils/lineNotification.js
const pool = require("../config/db");
const { sendLineMessage } = require("../controllers/lineMessageController");

/**
 * 📢 LINE 대상 필터링 후 메시지 전송
 * @param {Object} options - 필터링 및 전송 정보
 * @param {number} options.id - 공지사항 ID (URL 생성용)
 * @param {string} options.title - 공지사항 제목
 * @param {string} options.content - 공지사항 내용
 * @param {number|null} options.grade - 학년
 * @param {string|null} options.level - 레벨
 * @param {number|null} options.is_foreigner - 외국인 여부
 * @param {string} options.author - 작성자 이름
 * @param {string} options.subject_name - 과목명
 * @param {boolean} options.isUpdate - 수정 여부
 */
const sendLineNotification = async ({ id, title, content, grade, level, is_foreigner, author, subject_name, isUpdate = false }) => {
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

    // 대상 그룹 정보 메시지 생성
    let targetGroupInfo = "";
    if (grade) targetGroupInfo += `${grade}학년`;
    if (level && level !== "ALL") {
        if (targetGroupInfo) targetGroupInfo += " / ";
        targetGroupInfo += `${level}`;
    }
    if (is_foreigner === 1) {
        if (targetGroupInfo) targetGroupInfo += " / ";
        targetGroupInfo += "외국인 대상";
    }

    // 포털 URL 생성
    const portalUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const noticeUrl = `${portalUrl}/notice/${id}`;

    // 메시지 구성
    const message = `📢 [공지${isUpdate ? " 수정됨" : ""}] ${title}
${targetGroupInfo ? `📌 ${targetGroupInfo}` : ""}
👨‍🏫 ${author || "관리자"}${subject_name ? ` (${subject_name})` : ""}
📝 ${content.length > 50 ? content.substring(0, 50) + "..." : content}
👉 확인하기: ${noticeUrl}`;

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
