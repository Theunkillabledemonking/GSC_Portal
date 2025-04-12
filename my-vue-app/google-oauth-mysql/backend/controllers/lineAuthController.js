const {
    generate6DigitCode,
    storeAuthCode,
    findValidAuthCode,
    markAuthCodeUsed,
    linkLineIdToUser,
} = require("../services/lineService");

// ✅ 인증번호 생성 (전송은 안 함, 사용자 직접 입력 유도)
exports.generateAuthCode = async (req, res) => {
    try {
        const { user_id } = req.body;
        if (!user_id) return res.status(400).json({ message: "사용자 ID 누락됨" });

        const code = generate6DigitCode();
        const expires_at = new Date(Date.now() + 10 * 60 * 1000);

        await storeAuthCode({ code, user_id, line_user_id: null, expires_at });

        res.status(200).json({ message: "✅ 인증번호 생성됨", code });
    } catch (err) {
        console.error("❌ 인증번호 생성 실패:", err);
        res.status(500).json({ message: "서버 오류" });
    }
};

// ✅ 수동 검증 (테스트용)
exports.verifyAuthCode = async (req, res) => {
    try {
        const { code, line_user_id } = req.body;
        const entry = await findValidAuthCode(code);
        if (!entry) return res.status(400).json({ message: "❌ 유효하지 않거나 만료됨" });

        await linkLineIdToUser(entry.user_id, line_user_id);
        await markAuthCodeUsed(entry.id);
        res.status(200).json({ message: "✅ LINE 연동 완료" });
    } catch (err) {
        console.error("❌ 인증 실패:", err);
        res.status(500).json({ message: "서버 오류" });
    }
};
