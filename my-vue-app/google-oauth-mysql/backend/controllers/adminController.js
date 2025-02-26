// 데이터베이스 연결 풀(pool)을 불러옵니다.
const pool = require('../config/db');

/**
 * ✅ 사용자 목록 조회
 * 관리자가 모든 사용자의 목록을 조회합니다.
 */
exports.getUsers = async (req, res) => {
    try {
        // MySQL에서 모든 사용자의 ID, 이메일, 이름, 권한, 승인 상태를 조회합니다.
        const [users] = await pool.query(
            'SELECT id, email, name, phone, role, grade, level, status FROM users'
        );

        // 사용자 목록을 응답으로 반환합니다.
        res.status(200).json(users);

    } catch (error) {
        // 데이터베이스 오류 발생 시 500 상태 코드와 오류 메시지를 반환합니다.
        res.status(500).json({ error: error.message });
    }
};

/**
 *  대기 중인 사용자 목록 조회
 *  관리자가 승인해야 할 사용자만 조회합니다. (status = 0)
 */
exports.getPendingUsers = async (req, res) => {
    try {
        // MySQL에서 승인 대기 중(status = 0)인 사용자만 조회
        const [users] = await pool.query(
            'SELECT id, email, name, phone, role, grade, level, status FROM users WHERE status = 0'
        );

        // 승인 대기 중인 사용자 목록 반환
        res.status(200).json(users);
    } catch (error) {
        console.error('승인 대기 사용자 조회 오류:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * ✅ 사용자 승인 상태 업데이트
 * 관리자가 사용자의 승인 상태를 변경합니다. (0: 대기, 1: 승인, 2: 거부)
 */
exports.updateUserStatus = async (req, res) => {
    try {
        // 요청 본문에서 사용자 ID와 승인 상태를 가져옵니다.
        const { id, status } = req.body;

        // 1. status 값이 0, 1, 2 중 하나인지 확인 (유효성 검사)
        if (![0, 1, 2].includes(status)) {
            return res.status(400).json({ error: '잘못된 승인 상태입니다.'});
        }

        // 2. MySQL에서 사용자의 승인 상태를 업데이트
        const [result] = await pool.query("UPDATE users SET status = ? WHERE id = ?", [status, id])

        // 3. 변경된 행이 없을 경우 (존재하지 않는 사용자 ID)
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        }

        // 4. 업데이트 성공 시 메시지를 반환합니다.
        res.status(200).json({ message: '사용자 상태가 업데이트되었습니다.' });

    } catch (error) {
        // 데이터베이스 오류 발생 시 500 상태 코드와 오류 메시지를 반환합니다.
        console.log(error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * ✅ 사용자 권한 및 정보 수정
 * 관리자가 사용자의 권한(role), 학년(grade), 및 레벨(level)을 업데이트합니다.
 */
exports.updateUserRole = async (req, res) => {
    try {
        // 요청 본문에서 사용자 ID, 권한, 학년, 레벨을 가져옵니다.
        const { id, role, grade, level } = req.body;

        // 1. role 값이 유효한지 검사 (1: 관리자, 2: 교수, 3: 학생)
        if (![1, 2, 3].includes(role)) {
            return res.status(400).json({ error: '잘못된 역할 값입니다.'});
        }

        // 2. MySQL에서 사용자의 권한과 정보를 업데이트
        const [result] = await pool.query(
            'UPDATE users SET role = ?, grade = ?, level = ? WHERE id = ?',
            [role, grade, level, id]
        );

        // 3. 변경된 행이 없을 경우 (존재하지 않는 사용자 ID)
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '사용자를 찾을 수 없습니다.'});
        }

        // 4. 업데이트 성공 시 메시지를 반환합니다.
        res.status(200).json({ message: '사용자 권한 및 정보가 업데이트되었습니다.' });

    } catch (error) {
        // 데이터베이스 오류 발생 시 500 상태 코드와 오류 메시지를 반환합니다.
        console.error('사용자 권한 업데이트 오류:', error);
        res.status(500).json({ error: error.message });
    }
};
