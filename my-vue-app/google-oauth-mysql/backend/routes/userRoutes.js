const express = require('express');
const { verifyToken, checkStatus } = require('../middlewares/authMiddleware');
const { getUserInfo, updateUserInfo, getAccessibleBoards } = require('../controllers/userController');

const router = express.Router();

// 사용자 정보 조회 (GET /api/user/me)
router.get('/me', verifyToken, checkStatus, getUserInfo);

// 사용자 정보 수정 (PUT /api/user/update)
router.put('/update', verifyToken, checkStatus, updateUserInfo);

// 사용자가 접근할 수 있는 게시판 목록 조회 (GET /api/user/boards)
router.get('/boards', verifyToken, checkStatus, getAccessibleBoards);

module.exports = router;