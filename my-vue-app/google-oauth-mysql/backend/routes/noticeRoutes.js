const express = require('express');
const { hasRole, verifyToken} = require('../middlewares/authMiddleware');
const {
    createNotices,
    getNotices,
    getNoticeById,
    updateNotice,
    deleteNotice,
} = require('../controllers/noticeController');

const router = express.Router();

const upload = require('../middlewares/uploadMiddleware');

// 공지사항 등록 API (POST /api/notices)
router.post("/", verifyToken, hasRole(2), upload.single('attachment'), createNotices);

// 공지사항 조회 ( 전체 조회 & 학생은 본인 학년 공지만)
router.get('/', verifyToken, getNotices);

// 공지사항 상세 조회
router.get('/:id', verifyToken, getNoticeById);

// 공지사항 수정 (교수는 본인 글만, 관리자는 모두 가능)
router.put("/:id", verifyToken, hasRole(2), upload.single('attachment'), updateNotice);

// 공지사항 삭제 (교수는 본인 글만, 관리자는 모두 가능)
router.delete('/:id', verifyToken, hasRole(2), deleteNotice);

module.exports = router;