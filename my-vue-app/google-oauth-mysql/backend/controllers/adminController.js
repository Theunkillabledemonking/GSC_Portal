// 데이터베이스 연결 풀(pool)을 불러옵니다.
const pool = require('../config/db');

/**
 * ✅ 전체 유저 목록 조회
 */
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query(`
      SELECT id, email, name, student_id, phone, role, status, grade, level, group_level, is_foreigner, created_at
      FROM users
      ORDER BY created_at DESC
    `);
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * ✅ 승인 대기 유저만 조회
 */
exports.getPendingUsers = async (req, res) => {
    try {
        const [users] = await pool.query(`
      SELECT id, email, name, student_id, phone, role, grade, level, group_level, is_foreigner, created_at
      FROM users
      WHERE status = 0
    `);
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * ✅ 유저 승인 상태 업데이트
 * PATCH /admin/users/:id/status
 */
exports.updateUserStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (![0, 1, 2].includes(status)) {
        return res.status(400).json({ error: '유효하지 않은 승인 상태입니다.' });
    }

    try {
        const [result] = await pool.query(`UPDATE users SET status = ? WHERE id = ?`, [status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '해당 사용자를 찾을 수 없습니다.' });
        }

        res.status(200).json({ message: '승인 상태가 변경되었습니다.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * ✅ 유저 권한(role), 학년(grade), 레벨(level) 등 수정
 * PATCH /admin/users/:id/info
 */
exports.updateUserInfo = async (req, res) => {
    const { id } = req.params;
    const { name, phone, role, grade, level, group_level, is_foreigner } = req.body;

    if (![1, 2, 3].includes(role)) {
        return res.status(400).json({ error: '유효하지 않은 역할(role)입니다.' });
    }

    try {
        const [result] = await pool.query(
            `UPDATE users 
       SET name = ?, phone = ?, role = ?, grade = ?, level = ?, group_level = ?, is_foreigner = ?
       WHERE id = ?`,
            [name, phone, role, grade, level, group_level, is_foreigner, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '해당 사용자를 찾을 수 없습니다.' });
        }

        res.status(200).json({ message: '유저 정보가 업데이트되었습니다.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
