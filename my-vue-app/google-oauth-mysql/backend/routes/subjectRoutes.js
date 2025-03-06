const express = require('express');
const { verifyToken, hasRole } = require('../middlewares/authMiddleware');
const {
    getSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    getSubjectsByYear
} = require('../controllers/subjectController');

const router = express.Router();

// 학년별 조회
router.get('/year/:year', getSubjectsByYear);

// 1. 과목 목록 조회 (전체)
router.get('/', getSubjects);

// 2. 과목 등록 (관리자만)
router.post('/', verifyToken, hasRole(1), createSubject);

// 3. 과목 수정 (관리자만)
router.put('/:id', verifyToken, hasRole(1), updateSubject);

// 4. 과목 삭제 (관리자만)
router.delete('/:id', verifyToken, hasRole(1), deleteSubject);

module.exports = router;