const pool = require('../config/db');

/**
 * ✅ 특강(레벨별) 과목 조회 (레벨이 있는 사용자만 조회 가능)
 */
exports.getSpecialLectures = async (req, res) => {
    const userLevel = req.user.level;

    if (!userLevel) {
        return res.status(403).json({ message: "레벨 정보가 없습니다. 관리자에게 문의하세요." });
    }

    try {
        const query = `
            SELECT id, name, year, level
            FROM subjects
            WHERE is_special_lecture = 1 AND (level = ? OR level IS NULL)
            ORDER BY name ASC
        `;
        const [specialLectures] = await pool.query(query, [userLevel]);

        res.status(200).json({ specialLectures });

    } catch (error) {
        console.error("특강 과목 조회 실패:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/**
 * 🔍 이벤트용 과목 통합 조회
 */
exports.getSubjectsForEvent = async (req, res) => {
    const { year } = req.query;
    const level = req.user?.level;

    if (!year || !level) {
        return res.status(400).json({ message: "year 또는 사용자 레벨이 누락되었습니다." });
    }

    try {
        const [rows] = await pool.query(`
            SELECT * FROM subjects
            WHERE
                (
                    (is_special_lecture = 0 AND year = ?)
                        OR
                    (is_special_lecture = 1 AND (level = ? OR level IS NULL))
                    )
            ORDER BY is_special_lecture DESC, name ASC
        `, [year, level]);

        res.status(200).json({ subjects: rows });
    } catch (err) {
        console.error("❌ getSubjectsForEvent 오류:", err);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/**
 * ✅ 학년별 과목 조회 (정규 과목만)
 */
exports.getSubjectsByYear = async (req, res) => {
    const { year } = req.params;

    try {
        const [subjects] = await pool.query(
            `SELECT * FROM subjects WHERE is_special_lecture = 0 AND year = ? ORDER BY name ASC`,
            [year]
        );
        res.status(200).json({ subjects });
    } catch (err) {
        console.error("❌ 학년별 과목 조회 실패:", err);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/**
 * ✅ 레벨별 과목 조회
 */
exports.getSubjectsByLevel = async (req, res) => {
    const { level } = req.query;

    try {
        const [rows] = await pool.query(`
            SELECT * FROM subjects
            WHERE level = ? OR level IS NULL
        `, [level]);

        res.json({ subjects: rows });
    } catch (err) {
        console.error("❌ getSubjectsByLevel 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

/**
 * ✅ 학기별 과목 조회 (프론트 요청 기반)
 */
exports.getSubjectsBySemester = async (req, res) => {
    const { year, semester } = req.query;

    if (!year || !semester) {
        return res.status(400).json({ message: "year 또는 semester가 누락되었습니다." });
    }

    try {
        const [rows] = await pool.query(`
            SELECT * FROM subjects
            WHERE is_special_lecture = 0 AND year = ? AND semester = ?
            ORDER BY name ASC
        `, [year, semester]);

        res.status(200).json({ subjects: rows });
    } catch (err) {
        console.error("❌ getSubjectsBySemester 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

/**
 * ✅ 전체 과목 목록 조회
 */
exports.getSubjects = async (req, res) => {
    try {
        const [subjects] = await pool.query("SELECT * FROM subjects ORDER BY is_special_lecture DESC, year, name");
        res.json({ subjects });
    } catch (error) {
        console.error("과목 목록 조회 실패:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/**
 * ✅ 과목 등록
 */
exports.createSubject = async (req, res) => {
    const { name, year, level, is_special_lecture, semester } = req.body;

    if (!name || (!year && !is_special_lecture)) {
        return res.status(400).json({ message: "과목명과 학년 또는 특강 여부를 입력해야 합니다." });
    }

    try {
        await pool.query(
            "INSERT INTO subjects (name, year, level, is_special_lecture, semester) VALUES (?, ?, ?, ?, ?)",
            [name, year || null, level || null, is_special_lecture || 0, semester || null]
        );
        res.status(201).json({ message: "과목이 추가되었습니다." });
    } catch (error) {
        console.error("과목 등록 실패:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/**
 * ✅ 과목 수정
 */
exports.updateSubject = async (req, res) => {
    const { id } = req.params;
    const { name, year, level, is_special_lecture, semester } = req.body;

    if (!name || (!year && !is_special_lecture)) {
        return res.status(400).json({ message: "과목명과 학년 또는 특강 여부를 입력해야 합니다." });
    }

    try {
        const [result] = await pool.query(
            "UPDATE subjects SET name = ?, year = ?, level = ?, is_special_lecture = ?, semester = ? WHERE id = ?",
            [name, year || null, level || null, is_special_lecture || 0, semester || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "존재하지 않는 과목입니다." });
        }

        res.json({ message: "과목이 수정되었습니다." });
    } catch (error) {
        console.error("과목 수정 실패:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/**
 * ✅ 과목 삭제
 */
exports.deleteSubject = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query("DELETE FROM subjects WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "존재하지 않는 과목입니다." });
        }

        res.json({ message: "과목이 삭제되었습니다." });
    } catch (error) {
        console.error("과목 삭제 실패:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};