const express = require("express");
const db = require("./db"); // DB 연결 모듈
const router = express.Router();

// 승인 대기 중인 사용자 목록 가져오기
router.get("/pending-users", async (req, res) => {
    try {
        const users = await db.query("SELECT id, name, email FROM users WHERE role = 'pending'");
        res.json(users);
    } catch (error) {
        console.error("Error fetching pending users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 사용자 승인 API (관리자가 호출)
router.post("/approve-user", async (req, res) => {
    const { userId } = req.body;

    try {
        await db.query("UPDATE users SET role = 'approved' WHERE id = ?", [userId]);
        res.json({ message: "User approved successfully" });
    } catch (error) {
        console.error("Error approving user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
