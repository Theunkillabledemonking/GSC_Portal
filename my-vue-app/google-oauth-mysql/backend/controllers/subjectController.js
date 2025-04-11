const pool = require('../config/db');

/**
 * ✅ 특강(레벨별) 과목 조회 (레벨이 있는 사용자만 조회 가능)
 */
exports.getSpecialLectures = async (req, res) => {
    const userLevel = req.query.level || req.user?.level;
    const groupLevel = req.query.group_level || null;
    const isForeigner = req.query.is_foreigner ?? req.user?.is_foreigner;

    if (!userLevel) {
        return res.status(403).json({ message: "레벨 정보가 없습니다. 관리자에게 문의하세요." });
    }

    try {
        // group_level 조건은 groupLevel 값이 있을 때에만 추가합니다.
        let query = `
            SELECT id, name, year, level, group_level
            FROM subjects
            WHERE is_special_lecture = 1
              AND (level = ? OR level IS NULL)
              AND (is_foreigner_target = ? OR is_foreigner IS NULL)
        `;
        const params = [userLevel, isForeigner];

        if (groupLevel) {
            query += ` AND (group_level = ? OR group_level IS NULL)`;
            params.push(groupLevel);
        }

        query += ` ORDER BY name ASC`;

        const [specialLectures] = await pool.query(query, params);

        res.status(200).json({ specialLectures });
    } catch (error) {
        console.error("❌ 특강 과목 조회 실패:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};


/**
 * 🔍 이벤트용 과목 통합 조회
 */
exports.getSubjectsForEvent = async (req, res) => {
    // year, level, group_level을 모두 고려해
    // "정규 과목(해당 year)" + "특강 과목(해당 level, group_level)"을 한 번에 조회
    const { year, level, group_level, is_foreigner } = req.query;

    // year나 level이 없다면 기본값 설정 또는 에러 처리
    if (!year && !level) {
        return res.status(400).json({ message: "year 또는 level이 필요합니다." });
    }

    try {
        // year = 정규 과목 / level = 특강 과목
        // group_level도 고려하려면 아래 쿼리에 추가
        let query = `
            SELECT *
            FROM subjects
            WHERE
                (is_special_lecture = 0 AND year = ?)
                  OR
                (
                  is_special_lecture = 1
                  AND (level = ? OR level IS NULL)
                  AND (is_foreigner_target = ? OR is_foreigner IS NULL)
        `;

        const params = [year, level, is_foreigner];

        // group_level이 있으면 AND (group_level=? OR group_level IS NULL) 추가
        if (group_level) {
            query += ` AND (group_level = ? OR group_level IS NULL)`;
            params.push(group_level);
        }

        query += ` )
            ORDER BY is_special_lecture DESC, name ASC
        `;

        const [rows] = await pool.query(query, params);
        return res.status(200).json({ subjects: rows });
    } catch (err) {
        console.error("❌ getSubjectsForEvent 오류:", err);
        return res.status(500).json({ message: "서버 오류 발생" });
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
    const { level, is_foreigner } = req.query;

    try {
        const [rows] = await pool.query(`
            SELECT * FROM subjects
            WHERE (level = ? OR level IS NULL)
              AND (is_foreigner_target = ? OR is_foreigner IS NULL)
        `, [level, is_foreigner]);

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
    const { name, year, level, is_special_lecture, semester, is_foreigner_target, group_level } = req.body;

    if (!name || (!year && !is_special_lecture)) {
        return res.status(400).json({ message: "과목명과 학년 또는 특강 여부를 입력해야 합니다." });
    }

    try {
        await pool.query(
            "INSERT INTO subjects (name, year, level, is_special_lecture, semester, is_foreigner_target, group_level) VALUES (?, ?, ?, ?, ?, ? ,?)",
            [name, year || null, level || null, is_special_lecture || 0, semester || null, is_foreigner_target ?? null, group_level || null]
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
    const { name, year, level, is_special_lecture, semester, is_foreigner_target, group_level } = req.body;

    if (!name || (!year && !is_special_lecture)) {
        return res.status(400).json({ message: "과목명과 학년 또는 특강 여부를 입력해야 합니다." });
    }

    try {
        const [result] = await pool.query(
            "UPDATE subjects SET name = ?, year = ?, level = ?, is_special_lecture = ?, semester = ?, is_foreigner_target = ?, group_level = ? WHERE id = ?",
            [name, year || null, level || null, is_special_lecture || 0, semester || null, is_foreigner_target ?? null, group_level || null, id]
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