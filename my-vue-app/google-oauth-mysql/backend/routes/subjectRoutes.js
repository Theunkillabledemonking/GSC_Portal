const express = require('express');
const { verifyToken, hasRole } = require('../middlewares/authMiddleware');
const {
    getSubjects,
    getSpecialLectures,
    getSubjectsByLevel,
    createSubject,
    updateSubject,
    deleteSubject,
    getSubjectsByYear
} = require('../controllers/subjectController');

const router = express.Router();

// ✅ 학년별 과목 조회 (로그인 필요, 학생은 본인 학년만 조회 가능)
router.get("/year/:year", verifyToken, getSubjectsByYear);

// ✅ 특강(레벨별) 과목 조회 (로그인 필요, 레벨이 있는 사용자만 가능)
router.get("/special", verifyToken, getSpecialLectures);

// ✅ 전체 과목 목록 조회 (모든 사용자 가능)
router.get("/", getSubjects);

router.get('/level', getSubjectsByLevel);


// ✅ 과목 등록 (관리자만 가능)
router.post("/", verifyToken, hasRole(1), createSubject);

// ✅ 과목 수정 (관리자만 가능)
router.put("/:id", verifyToken, hasRole(1), updateSubject);

// ✅ 과목 삭제 (관리자만 가능)
router.delete("/:id", verifyToken, hasRole(1), deleteSubject);

module.exports = router;
