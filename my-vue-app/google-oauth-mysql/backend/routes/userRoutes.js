const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const { registerUser } = require('../controllers/userController');

// ✅ 사용자 승인 상태 조회
router.get("/user-status", authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT is_approved, is_first_input FROM users WHERE user_id = ?",
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        const { is_approved, is_first_input } = rows[0];
        res.json({ is_approved, is_first_input }); // ✅ 사용자 정보 반환
    } catch (error) {
        console.error("[ERROR] /user-status:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다.", error });
    }
});

// ✅ 사용자 정보 등록 (첫 입력만 허용)
router.post("/register", authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT is_first_input FROM users WHERE user_id = ?",
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        if (rows[0].is_first_input === 1) {
            return res.status(400).json({ message: "이미 첫 입력이 완료되었습니다. 더 이상 수정할 수 없습니다." });
        }

        await registerUser(req, res); // ✅ 첫 입력만 허용
    } catch (error) {
        console.error("[ERROR] /register:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다.", error });
    }
});

module.exports = router;
