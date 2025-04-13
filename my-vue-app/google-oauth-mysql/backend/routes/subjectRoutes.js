const express = require('express');
const { verifyToken, hasRole } = require('../middlewares/authMiddleware');
const {
    getSubjects,
    getSpecialLectures,
    getSubjectsByLevel,
    getSubjectsByYear,
    getSubjectsBySemester,
    getSubjectsForEvent,
    createSubject,
    updateSubject,
    deleteSubject,
    getFilteredSubjects
} = require('../controllers/subjectController');

const router = express.Router();

// ✅ 전체 과목 목록 조회 (모든 사용자 가능)
router.get("/", getSubjects);

// ✅ 필터링된 과목 조회 (구체적인 조건으로 필터링)
router.get("/filter", getFilteredSubjects);

// ✅ 학년별 과목 조회 (정규 수업만, 학생은 본인 학년만)
router.get("/year/:year", verifyToken, getSubjectsByYear);

// ✅ 학기별 과목 조회 (정규 수업만, year + semester)
router.get("/by-semester", verifyToken, getSubjectsBySemester);

// ✅ 레벨별 과목 조회 (레벨 지정 시 전체 포함)
router.get("/level", getSubjectsByLevel);

// ✅ 특강(레벨별) 과목 조회 (로그인 필요)
router.get("/special", verifyToken, getSpecialLectures);

router.get("/event", verifyToken, getSubjectsForEvent);

// ✅ 과목 등록 (관리자 전용)
router.post("/", verifyToken, hasRole(1), createSubject);

// ✅ 과목 수정 (관리자 전용)
router.put("/:id", verifyToken, hasRole(1), updateSubject);

// ✅ 과목 삭제 (관리자 전용)
router.delete("/:id", verifyToken, hasRole(1), deleteSubject);

module.exports = router;
