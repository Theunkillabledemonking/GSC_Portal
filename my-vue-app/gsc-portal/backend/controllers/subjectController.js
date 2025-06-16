const pool = require('../config/db');
// 이제 buildSubjectQuery는 내부적으로 구현되었으므로 외부 모듈에서 가져오지 않음
/**
 * ✍️ 내부 공통 쿼리 생성 함수
 */
function buildSubjectQuery({
                               isSpecial,
                               year,
                               level,
                               semester,
                               isForeigner,
                               groupLevels
                           }) {
    let query = `
    SELECT 
      id, name, year, level, group_level, 
      is_foreigner_target, semester, is_special_lecture
    FROM subjects WHERE 1=1
  `;

    const params = [];

    if (!semester) throw new Error("semester 파라미터는 필수입니다.");
    query += ` AND semester = ?`;
    params.push(semester);

    if (isSpecial !== undefined) {
        query += ` AND is_special_lecture = ?`;
        params.push(isSpecial ? 1 : 0);

        if (isSpecial && isForeigner === false) {
            query += ` AND is_foreigner_target = 0`;
            if (level) {
                query += ` AND level = ?`;
                params.push(level);
            }
        } else if (!isSpecial && isForeigner === true) {
            query += ` AND is_foreigner_target = 1`;
            if (level) {
                query += ` AND level = ?`;
                params.push(level);
            }
        }
    }

    if (isForeigner !== undefined) {
        query += ` AND (is_foreigner_target = ? OR is_foreigner_target IS NULL)`;
        params.push(isForeigner ? 1 : 0);
    }

    if (year !== undefined) {
        query += ` AND (year = ? OR year IS NULL)`;
        params.push(year);
    }

    if (level !== undefined && isForeigner !== true) {
        query += ` AND level = ?`;
        params.push(level);
    }

    if (groupLevels) {
        if (Array.isArray(groupLevels)) {
            const inClause = groupLevels.map(() => '?').join(',');
            query += ` AND (group_level IN (${inClause}) OR group_level IS NULL)`;
            params.push(...groupLevels);
        } else if (typeof groupLevels === 'string') {
            query += ` AND (group_level = ? OR group_level IS NULL)`;
            params.push(groupLevels);
        }
    }

    query += ` ORDER BY is_special_lecture, year, name`;
    return { query, params };
}

/** ✅ 특강(레벨별) 과목 조회 */
exports.getSpecialLectures = async (req, res) => {
    const level = req.query.level || req.user?.level;
    const groupLevel = req.query.group_level || null;
    const isForeigner = req.query.is_foreigner ?? req.user?.is_foreigner;
    const semester = req.query.semester || 'spring';

    if (!level) return res.status(403).json({ message: "레벨 정보가 없습니다." });

    try {
        const { query, params } = buildSubjectQuery({ isSpecial: true, level, isForeigner, groupLevels: groupLevel, semester });
        const [rows] = await pool.query(query, params);
        res.status(200).json({ specialLectures: rows });
    } catch (error) {
        console.error("❌ 특강 과목 조회 실패:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/** 🔍 이벤트용 과목 통합 조회 */
exports.getSubjectsForEvent = async (req, res) => {
    const { year, level, group_level, is_foreigner, semester } = req.query;
    if (!year && !level) return res.status(400).json({ message: "year 또는 level이 필요합니다." });

    try {
        const queries = [];
        if (year) queries.push(buildSubjectQuery({ isSpecial: false, year, semester }));
        if (level) queries.push(buildSubjectQuery({ isSpecial: true, level, isForeigner: is_foreigner, groupLevels: group_level, semester }));

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

/** ✅ 학년별 과목 조회 */
exports.getSubjectsByYear = async (req, res) => {
    const { year } = req.params;
    const isForeigner = req.query.is_foreigner ?? null;

    try {
        const { query, params } = buildSubjectQuery({
            isSpecial: false,
            year,
            semester: 'spring',
            isForeigner: isForeigner === '1' ? true : isForeigner === '0' ? false : undefined
        });
        const [subjects] = await pool.query(query, params);
        res.status(200).json({ subjects });
    } catch (err) {
        console.error("❌ 학년별 과목 조회 실패:", err);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};


/** ✅ 레벨별 과목 조회 */
exports.getSubjectsByLevel = async (req, res) => {
    const { level, is_foreigner, semester } = req.query;
    try {
        const { query, params } = buildSubjectQuery({ isSpecial: true, level, isForeigner: is_foreigner, semester });
        const [subjects] = await pool.query(query, params);
        res.status(200).json({ subjects });
    } catch (err) {
        console.error("❌ 레벨별 과목 조회 실패:", err);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/** ✅ 학기별 과목 조회 */
exports.getSubjectsBySemester = async (req, res) => {
    const { year, semester } = req.query;
    if (!year || !semester) return res.status(400).json({ message: "year 또는 semester가 누락되었습니다." });

    try {
        const { query, params } = buildSubjectQuery({ isSpecial: false, year, semester });
        const [subjects] = await pool.query(query, params);
        res.status(200).json({ subjects });
    } catch (err) {
        console.error("❌ getSubjectsBySemester 오류:", err);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

/** ✅ 전체 과목 목록 */
exports.getSubjects = async (req, res) => {
    try {
        const [subjects] = await pool.query(`SELECT * FROM subjects ORDER BY is_special_lecture DESC, year, name`);
        res.json({ subjects });
    } catch (error) {
        console.error("과목 목록 조회 실패:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/** ✅ 과목 등록 */
exports.createSubject = async (req, res) => {
    const { name, year, level, is_special_lecture, semester, is_foreigner_target, group_level } = req.body;
    if (!name) return res.status(400).json({ message: "과목명을 입력해야 합니다." });

    try {
        await pool.query(
            `INSERT INTO subjects (name, year, level, is_special_lecture, semester, is_foreigner_target, group_level)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, year || null, level || null, is_special_lecture || 0, semester || null, is_foreigner_target ?? null, group_level || null]
        );
        res.status(201).json({ message: "과목이 추가되었습니다." });
    } catch (error) {
        console.error("❌ 과목 등록 실패:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/** ✅ 과목 수정 */
exports.updateSubject = async (req, res) => {
    const { id } = req.params;
    const { name, year, level, is_special_lecture, semester, is_foreigner_target, group_level } = req.body;

    if (!name || (!year && !is_special_lecture)) return res.status(400).json({ message: "과목명과 학년 또는 특강 여부를 입력해야 합니다." });

    try {
        const [result] = await pool.query(
            `UPDATE subjects SET name = ?, year = ?, level = ?, is_special_lecture = ?, semester = ?, is_foreigner_target = ?, group_level = ? WHERE id = ?`,
            [name, year || null, level || null, is_special_lecture || 0, semester || null, is_foreigner_target ?? null, group_level || null, id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: "존재하지 않는 과목입니다." });
        res.json({ message: "과목이 수정되었습니다." });
    } catch (error) {
        console.error("❌ 과목 수정 실패:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/** ✅ 과목 삭제 */
exports.deleteSubject = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(`DELETE FROM subjects WHERE id = ?`, [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "존재하지 않는 과목입니다." });
        res.json({ message: "과목이 삭제되었습니다." });
    } catch (error) {
        console.error("❌ 과목 삭제 실패:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

/** ✅ 필터링 조건에 맞는 과목 목록 */
exports.getFilteredSubjects = async (req, res) => {
    try {
        const { isSpecial, year, level, semester, isForeigner, groupLevels } = req.query;
        const parsedIsSpecial = isSpecial !== undefined ? isSpecial === 'true' : undefined;
        const parsedIsForeigner = isForeigner !== undefined ? isForeigner === 'true' : undefined;

        let parsedGroupLevels = groupLevels;
        if (groupLevels && typeof groupLevels === 'string') {
            try {
                if (groupLevels.startsWith('[') && groupLevels.endsWith(']')) {
                    parsedGroupLevels = JSON.parse(groupLevels);
                } else if (groupLevels.includes(',')) {
                    parsedGroupLevels = groupLevels.split(',').map(item => item.trim());
                }
            } catch (e) {
                console.error('그룹 레벨 파싱 오류:', e);
            }
        }

        const { query, params } = buildSubjectQuery({
            isSpecial: parsedIsSpecial,
            year,
            level,
            semester,
            isForeigner: parsedIsForeigner,
            groupLevels: parsedGroupLevels
        });

        const [results] = await pool.query(query, params);
        res.json({ success: true, count: results.length, data: results });
    } catch (error) {
        console.error('과목 필터링 조회 오류:', error);
        res.status(500).json({ success: false, message: error.message || '과목 필터링 조회 중 오류가 발생했습니다.' });
    }
};
