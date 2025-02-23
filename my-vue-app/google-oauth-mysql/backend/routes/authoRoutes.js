const express = require("express");
const passport = require("passport");
const {
  googleCallback,
  refreshToken,
} = require("../controllers/authController");

const router = express.Router();

// Google OAuth 로그인 (구글 로그인 페이지로 리디렉션)
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth 콜백 처리
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  googleCallback
);

// Refresh Token을 사용하여 Access Token 재발급
router.post("/refresh-token", refreshToken);

module.exports = router;
