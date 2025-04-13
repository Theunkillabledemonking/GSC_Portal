// 📁 utils/subjectQueryUtils.js

/**
 * 공통 과목 조회 조건 생성기
 * @param {Object} options - 쿼리 필터 옵션
 * @param {boolean} [options.isSpecial] - true: 특강 / false: 정규 / undefined: 전체
 * @param {number|string} [options.year] - 정규 과목용 학년
 * @param {string} [options.level] - 특강용 레벨
 * @param {number} [options.isForeigner] - 0: 한국인 / 1: 외국인
 * @param {string} [options.groupLevel] - 그룹 (A, B 등)
 * @param {string} [options.semester] - 학기 (spring, summer, fall, winter)
 */
exports.buildSubjectQuery = ({ isSpecial, year, level, isForeigner, groupLevel, semester }) => {
    let query = `SELECT * FROM subjects WHERE 1=1`;
    const params = [];

    if (isSpecial === true) {
        query += ` AND is_special_lecture = 1`;
    } else if (isSpecial === false) {
        query += ` AND is_special_lecture = 0`;
    }

    if (year) {
        query += ` AND year = ?`;
        params.push(year);
    }

    if (level) {
        query += ` AND (level = ? OR level IS NULL)`;
        params.push(level);
    }

    if (isForeigner !== undefined && isForeigner !== null && (isForeigner === 0 || isForeigner === 1)) {
        query += ` AND (is_foreigner_target = ? OR is_foreigner_target IS NULL)`;
        params.push(isForeigner);
    }

    if (groupLevel) {
        query += ` AND (group_level = ? OR group_level IS NULL)`;
        params.push(groupLevel);
    }

    if (semester) {
        query += ` AND semester = ?`;
        params.push(semester);
    }

    query += ` ORDER BY is_special_lecture DESC, name ASC`;
    return { query, params };
};