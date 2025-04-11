const express = require('express');
const router = express.Router();

const { verifyToken, hasRole } = require('../middlewares/authMiddleware');
const {
    getAllUsers,
    getPendingUsers,
    updateUserStatus,
    updateUserInfo
} = require('../controllers/adminController');

// ✅ 전체 유저 목록 조회
router.get('/users', verifyToken, hasRole(1), getAllUsers);

// ✅ 승인 대기 유저만 조회
router.get('/users/pending', verifyToken, hasRole(1), getPendingUsers);

// ✅ 유저 승인 상태 변경 (0:대기, 1:승인, 2:거부)
router.patch('/users/:id/status', verifyToken, hasRole(1), updateUserStatus);

// ✅ 유저 정보 및 권한 수정
router.patch('/users/:id/info', verifyToken, hasRole(1), updateUserInfo);

module.exports = router;
