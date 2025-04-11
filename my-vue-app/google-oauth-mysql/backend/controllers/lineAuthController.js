// controllers/lineAuthController.js
const pool = require("../config/db");
const crypto = require("crypto");
const { sendLineMessage } = require("./lineMessageController");

// ✅ 인증번호 생성 + 저장만 (LINE 전송은 사용자가 직접 입력)
exports.generateAuthCode = async (req, res) => {
    try {
        const { user_id, line_user_id } = req.body;
        if (!user_id) {
            return res.status(400).json({ message: "사용자 ID 누락됨" });
        }

        const code = crypto.randomInt(100000, 999999).toString();
        const expires_at = new Date(Date.now() + 10 * 60 * 1000);

        await pool.query(
            `INSERT INTO line_auth_codes (code, user_id, expires_at)
             VALUES (?, ?, ?)`,
            [code, user_id, expires_at]
        );

        res.status(200).json({ message: "✅ 인증번호가 생성되었습니다.", code });
    } catch (err) {
        console.error("인증번호 생성 실패:", err);
        res.status(500).json({ message: "서버 오류" });
    }
};

// ✅ 인증번호 자동 발송 + 저장
exports.generateAndSendAuthCode = async (req, res) => {
    try {
        const {line_user_id} = req.body;
        if (!line_user_id) return res.status(400).json({message: "line_user_id 누락됨"});

        const code = crypto.randomInt(100000, 999999).toString();
        const expires_at = new Date(Date.now() + 10 * 60 * 1000);

        // DB 저장
        await pool.query(
            `INSERT INTO line_auth_codes (code, line_user_id, expires_at)
             VALUES (?, ?, ?)`,
            [code, line_user_id, expires_at]
        );

        // LINE 메시지 전송
        const message = `🔐 인증번호: ${code}\n글시융포털 웹사이트에 입력해주세요!`;
        await sendLineMessage(line_user_id, message);

        res.status(200).json({message: "인증번호 전송 완료!"});
    } catch (err) {
        console.error("인증번호 전송 실패:", err);
        res.status(500).json({message: "서버 오류"});
    }
}

// ✅ 올바른 인증 흐름
exports.verifyAuthCode = async (req, res) => {
    try {
        const { code, line_user_id } = req.body;
        if (!code || !line_user_id) return res.status(400).json({ message: "필수 데이터 누락" });

        const [rows] = await pool.query(
            `SELECT * FROM line_auth_codes WHERE code = ? AND used = 0 AND expires_at > NOW()`,
            [code]
        );

        if (rows.length === 0) {
            return res.status(400).json({ message: "인증번호가 유효하지 않거나 만료되었습니다." });
        }

        const entry = rows[0];

        // 유저 정보에 LINE ID 매핑
        await pool.query(`UPDATE users SET line_user_id = ? WHERE id = ?`, [line_user_id, entry.user_id]);

        // 인증번호 사용 처리
        await pool.query(`UPDATE line_auth_codes SET used = 1 WHERE id = ?`, [entry.id]);

        res.status(200).json({ message: "LINE 연동 완료!" });
    } catch (err) {
        console.error("연동 실패:", err);
        res.status(500).json({ message: "서버 오류" });
    }
};


