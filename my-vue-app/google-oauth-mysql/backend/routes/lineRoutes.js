const express = require("express");
const router = express.Router();
const lineAuthController = require("../controllers/lineAuthController");
const { verifyToken } = require("../middlewares/authMiddleware");

// ✅ 인증번호 생성 + 메시지 발송 (수동 호출)
router.post("/generate", lineAuthController.generateAuthCode);

// ✅ 인증번호 확인 → 사용자와 LINE 연결
router.post("/verify", verifyToken, lineAuthController.verifyAuthCode);


module.exports = router;
