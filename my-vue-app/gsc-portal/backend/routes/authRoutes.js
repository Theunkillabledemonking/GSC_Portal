const express = require("express");
const { googleCallback, registerUser } = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// ✅ Google OAuth 로그인 URL 반환
router.get("/google", (req, res) => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URL}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;
    res.json({ authUrl: googleAuthUrl });
});

// ✅ Google OAuth 콜백 (로그인 처리 및 JWT 발급)
router.get("/callback", googleCallback);

// 회원가입 API
router.post("/register", registerUser);

// ✅ JWT를 사용한 사용자 정보 확인
router.get("/me", verifyToken, (req, res) => {
    res.json({ email: req.user.email, role: req.user.role, is_verified: req.user.is_verified });
});

module.exports = router;
