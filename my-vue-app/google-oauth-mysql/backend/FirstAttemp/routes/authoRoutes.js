const express = require("express");
const passport = require("passport");
const { registerUser } = require("../controllers/userController");
const { googleCallback, refreshToken } = require("../controllers/authController");

const router = express.Router();

// Google OAuth 로그인
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google OAuth 콜백 처리
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/" }), googleCallback);

// ✅ 사용자 정보 등록 (최초 회원가입)
router.post("/register", registerUser);  // ✅ 추가된 라우트

// Access Token 재발급
router.post("/refresh-token", refreshToken);

module.exports = router;