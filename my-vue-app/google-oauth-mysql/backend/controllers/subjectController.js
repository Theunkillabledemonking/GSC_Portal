const pool = require('../config/db');

/**
 * 0. 학년별 과목 조회
 */
exports.getSubjectsByYear = async (req, res) => {
    const { year } = req.params;

    // 1. 학년 유효성 체크 (1, 2, 3학년만 허용)
    if (![1, 2, 3].includes(Number(year))) {
        return res.status(400).json({ message: "올바른 학년을 선택해주세요 (1, 2, 3학년만 가능합니다)." });
    }

    try {
        const query = `
            SELECT id, name, year, level
            FROM subjects
            WHERE year = ?
            ORDER BY name ASC
        `;
        const [subjects] = await pool.query(query, [year]);
        res.status(200).json({ subjects });
    } catch (error) {
        console.error('학년별 과목 조회 실패:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

/**
 * 1. 과목 목록 조회 (전체)
 */
exports.getSubjects = async (req, res) => {
    try {
        const [subjects] = await pool.query('SELECT * FROM subjects ORDER BY year, name');
        res.json({ subjects });
    } catch (error) {
        console.log('과목 목록 조회 실패:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

/**
 * 2. 과목 등록 (관리자 전용)
 */
exports.createSubject = async (req, res) => {
    const { name, year, level } = req.body;

    if (!name || !year ) {
        return res.status(400).json({ message: '과목명과 학년은 필수입니다.' });
    }

    try {
        await pool.query('INSERT INTO subjects (name, year, level) VALUES (?, ?, ?)', [name, year, level]);
        res.status(201).json({ message: '과목이 추가되었습니다.' });
    } catch (error) {
        console.log('과목 등록 실패', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' })
    }
}

/**
 * 3. 과목 수정 (관리자 전용)
 */
exports.updateSubject = async (req, res) => {
    const { id } = req.params;
    const { name, year, level } = req.body;

    if (!name || !year) {
        return res.status(400).json({ message: '과목명과 학년은 필수입니다.' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE subjects SET name = ?, year = ?, level = ? WHERE id =?',
                [name, year, level, id]
        );

        if (result.affectedRows === 0) {
            return res.status(200).json({ message: '존재하지 않는 과목입니다.' });
        }

        res.json({ message: '과목이 수정되었습니다.' });
    } catch (error) {
        console.log('과목 수정 실패:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다' });
    }
};

/**
 * 4. 과목 삭제 (관리자 전용)
 */
exports.deleteSubject = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM subjects WHERE id =?', [id]);

        if (result.affectedRows > 0) {
            return res.status(404).json({ message: '존재하지 않는 과목입니다.'});
        }

        res.json({ message: '과목이 삭제되었습니다.' });
    } catch (error) {
        console.error('과목 삭제 실패:', error);
        res.status(500).json({ message: '서버 오류가 발생'});
    }
};