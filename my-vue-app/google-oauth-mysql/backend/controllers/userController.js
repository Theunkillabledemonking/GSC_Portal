// 데이터베이스 연결 풀(pool)을 불러옵니다.
const pool = require('../config/db');

/**
 * ✅ 사용자 정보 조회
 * 사용자가 자신의 정보를 조회합니다.
 * 요청자는 JWT를 통해 인증되며, 사용자 ID는 req.user.id에서 가져옵니다.
 */
exports.getUserInfo = async (req, res) => {
    try {
        // JWT에서 사용자 ID 가져오기
        const userId = req.user.id;

        // MySQL에서 사용자 정보를 조회합니다.
        const [rows] = await pool.query(
            'SELECT name, email, phone, grade, level, role FROM users WHERE id = ?',
            [userId]
        );

        // 사용자가 존재하지 않으면 404 상태와 메시지를 반환합니다.
        if (rows.length === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        // 데이터베이스 오류 발생 시 500 상태 코드와 오류 메시지를 반환합니다.
        res.status(500).json({ error: error.message });
    }
};


/**
 * ✅ 사용자 정보 수정
 * 사용자가 자신의 정보를 업데이트합니다. (예: 전화번호, 레벨)
 */
exports.updateUserInfo = async (req, res) => {
    try {
        // JWT에서 사용자 ID 가져오기
        const userId = req.user.id;

        // 요청 본문에서 전화번호와 레벨을 가져옵니다.
        const { phone, level } = req.body;

        // MySQL에서 사용자의 정보를 업데이트합니다.
        await pool.query(
            'UPDATE users SET phone = ?, level = ? WHERE id = ?',
            [phone, level, userId]
        );

        // 업데이트 성공 시 메시지를 반환합니다.
        res.status(200).json({ message: '사용자 정보가 업데이트되었습니다.' });

    } catch (error) {
        // 데이터베이스 오류 발생 시 500 상태 코드와 오류 메시지를 반환합니다.
        res.status(500).json({ error: error.message });
    }
};


/**
 * ✅ 사용자가 접근할 수 있는 게시판 목록 조회 (예시 기능)
 * - 공용 게시판은 누구나 접근 가능
 * - 학생(role=3)은 자신의 학년 게시판만 볼 수 있음
 */
exports.getAccessibleBoards = async (req, res) => {
    try {
        // JWT에서 사용자 역할과 학년 가져오기
        const role = req.user.role;
        const grade = req.user.grade;

        // 기본 쿼리: 공용 게시판 조회
        let query = 'SELECT * FROM boards WHERE is_public = 1';

        // 학생인 경우 (role === 3): 자신의 학년 게시판만 추가로 볼 수 있음
        if (role === 3) query += ' OR grade = ?';

        // MySQL에서 게시판 목록을 조회합니다.
        const [boards] = await pool.query(query, [grade]);

        // 게시판 목록을 응답으로 반환합니다.
        res.status(200).json(boards);

    } catch (error) {
        // 데이터베이스 오류 발생 시 500 상태 코드와 오류 메시지를 반환합니다.
        res.status(500).json({ error: error.message });
    }
};
