const pool = require('../config/db');
const { buildSubjectQuery } = require('../utils/subjectQueryUtils');

/**
 * ✅ 특강(레벨별) 과목 조회 (레벨이 있는 사용자만 조회 가능)
 */
exports.getSpecialLectures = async (req, res) => {
    const level = req.query.level || req.user?.level;
    const groupLevel = req.query.group_level || null;
    const isForeigner = req.query.is_foreigner ?? req.user?.is_foreigner;

    if (!level) {
        return res.status(403).json({ message: "레벨 정보가 없습니다. 관리자에게 문의하세요." });
    }

    try {
        const { query, params } = buildSubjectQuery({
            isSpecial: true,
            level,
            isForeigner,
            groupLevel
        });

        const [rows] = await pool.query(query, params);
        return res.status(200).json({ specialLectures: rows });
    } catch (error) {
        console.error("❌ 특강 과목 조회 실패:", error);
        return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/**
 * 🔍 이벤트용 과목 통합 조회
 * - 정규 과목: year 기준
 * - 특강 과목: level, group_level, is_foreigner 기준
 */
exports.getSubjectsForEvent = async (req, res) => {
    const { year, level, group_level, is_foreigner } = req.query;

    if (!year && !level) {
        return res.status(400).json({ message: "year 또는 level이 필요합니다." });
    }

    try {
        const queries = [];

        // 1. 정규 과목 쿼리 (is_special_lecture = 0)
        if (year) {
            queries.push(
                buildSubjectQuery({
                    isSpecial: false,
                    year
                })
            );
        }

        // 2. 특강 과목 쿼리 (is_special_lecture = 1)
        if (level) {
            queries.push(
                buildSubjectQuery({
                    isSpecial: true,
                    level,
                    isForeigner: is_foreigner,
                    groupLevel: group_level
                })
            );
        }

        const result = [];

        for (const q of queries) {
            const [rows] = await pool.query(q.query, q.params);
            result.push(...rows);
        }

        res.status(200).json({ subjects: result });
    } catch (err) {
        console.error("❌ getSubjectsForEvent 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

/**
 * ✅ 학년별 과목 조회 (정규 과목만)
 */
exports.getSubjectsByYear = async (req, res) => {
    const { year } = req.params;

    try {
        const { query, params } = buildSubjectQuery({
            isSpecial: false,
            year
        });

        const [subjects] = await pool.query(query, params);
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
        const { query, params } = buildSubjectQuery({
            isSpecial: true,
            level,
            isForeigner: is_foreigner
        });

        const [subjects] = await pool.query(query, params);
        res.status(200).json({ subjects });
    } catch (err) {
        console.error("❌ 레벨별 과목 조회 실패:", err);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
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
        const { query, params } = buildSubjectQuery({
            isSpecial: false,
            year,
            semester
        });

        const [subjects] = await pool.query(query, params);
        res.status(200).json({ subjects });
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
        const [subjects] = await pool.query(
            `SELECT * FROM subjects ORDER BY is_special_lecture DESC, year, name`
        );
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
            `INSERT INTO subjects (name, year, level, is_special_lecture, semester, is_foreigner_target, group_level)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                year || null,
                level || null,
                is_special_lecture || 0,
                semester || null,
                is_foreigner_target ?? null,
                group_level || null
            ]
        );

        res.status(201).json({ message: "과목이 추가되었습니다." });
    } catch (error) {
        console.error("❌ 과목 등록 실패:", error);
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
            `UPDATE subjects
                 SET name = ?, year = ?, level = ?, is_special_lecture = ?, semester = ?, is_foreigner_target = ?, group_level = ?
                 WHERE id = ?`,
            [
                name,
                year || null,
                level || null,
                is_special_lecture || 0,
                semester || null,
                is_foreigner_target ?? null,
                group_level || null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "존재하지 않는 과목입니다." });
        }

        res.json({ message: "과목이 수정되었습니다." });
    } catch (error) {
        console.error("❌ 과목 수정 실패:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};


/**
 * ✅ 과목 삭제
 */
exports.deleteSubject = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query(`DELETE FROM subjects WHERE id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "존재하지 않는 과목입니다." });
        }

        res.json({ message: "과목이 삭제되었습니다." });
    } catch (error) {
        console.error("❌ 과목 삭제 실패:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};
