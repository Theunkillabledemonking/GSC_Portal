const db = require("../config/db");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");

// controllers/userController.js
exports.registerUser = async (req, res) => {
    const { name, phone_number, student_id, user_type, grade, level } = req.body;

    if (!name || !phone_number || !student_id || !user_type) {
        return res.status(400).json({ message: "필수 정보를 모두 입력해주세요." });
    }

    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Unauthorized" });

        const decoded = jwt.verify(token, keys.jwtSecret);
        const userId = decoded.id;

        // ✅ 이미 입력한 사용자인지 확인
        const [existingUser] = await db.query("SELECT is_first_input FROM users WHERE user_id = ?", [userId]);
        if (existingUser.length > 0 && existingUser[0].is_first_input === 1) {
            return res.status(403).json({ message: "이미 정보를 입력하셨습니다." });
        }

        // ✅ 사용자 정보 업데이트 및 is_first_input = 1로 설정
        const [result] = await db.query(
            `UPDATE users
             SET name = ?, phone_number = ?, student_id = ?, user_type = ?, grade = ?, level = ?, is_approved = ?, is_first_input = 1
             WHERE user_id = ?`,
            [name, phone_number, student_id, user_type, grade || null, level || null, 0, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        res.status(200).json({ message: "회원 정보가 등록되었습니다. 승인 대기 중입니다." });
    } catch (error) {
        console.error("registerUser Error:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다.", error });
    }
};