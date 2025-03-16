const express = require("express");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// ✅ 로그인한 사용자 정보 가져오기
router.get("/profile", verifyToken, (req, res) => {
    res.json({ email: req.user.email, role: req.user.role });
});

// ✅ 관리자만 유저 목록 조회 가능
router.get("/list", verifyToken, (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "권한이 없습니다." });
    res.json({ users: [{ email: "user1@yju.ac.kr" }, { email: "user2@yju.ac.kr" }] });
});

module.exports = router;
