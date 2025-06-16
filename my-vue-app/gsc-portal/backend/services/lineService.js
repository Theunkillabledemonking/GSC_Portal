// services/lineService.js
const pool = require("../config/db");
const { sendLineMessage } = require("../controllers/lineMessageController");

/**
 * ✨ 6자리 랜덤 인증번호 생성
 */
const generate6DigitCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * ✅ 인증번호 DB에 저장
 */
const storeAuthCode = async ({ code, user_id, line_user_id, expires_at }) => {
    return await pool.query(
        `INSERT INTO line_auth_codes (code, user_id, line_user_id, expires_at) VALUES (?, ?, ?, ?)`,
        [code, user_id, line_user_id, expires_at]
    );
};

/**
 * ✅ 인증번호로 유효한 코드 조회
 */
const findValidAuthCode = async (code) => {
    const [rows] = await pool.query(
        `SELECT * FROM line_auth_codes WHERE code = ? AND used = 0 AND expires_at > NOW()`,
        [code]
    );
    return rows[0];
};

/**
 * ✅ 인증번호 사용 처리
 */
const markAuthCodeUsed = async (id) => {
    return await pool.query(`UPDATE line_auth_codes SET used = 1 WHERE id = ?`, [id]);
};

/**
 * ✅ 사용자에 LINE ID 등록
 */
const linkLineIdToUser = async (user_id, line_user_id) => {
    return await pool.query(`UPDATE users SET line_user_id = ? WHERE id = ?`, [line_user_id, user_id]);
};

/**
 * ✅ 인증번호 생성 + DB 저장 + LINE 전송
 */
const generateAndSendCode = async ({ user_id, line_user_id }) => {
    const code = generate6DigitCode();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10분 유효

    await storeAuthCode({ code, user_id, line_user_id, expires_at });

    const message = `🔐 인증번호: ${code}\n가입 후 웹사이트에 입력해주세요!`;
    await sendLineMessage(line_user_id, message);

    return code;
};

module.exports = {
    generate6DigitCode,
    storeAuthCode,
    findValidAuthCode,
    markAuthCodeUsed,
    linkLineIdToUser,
    generateAndSendCode,
};
