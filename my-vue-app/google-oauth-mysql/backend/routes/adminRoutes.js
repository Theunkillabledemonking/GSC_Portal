// Express 모듈을 불러옵니다.
const express = require('express');

// JWT 인증 및 권한 검증을 위한 미들웨어를 불러옵니다.
const { verifyToken, hasRole } = require('../middlewares/authMiddleware');

// 관리자 컨트롤러 불러오기
const { getUsers, updateUserStatus, updateUserRole } = require('../controllers/adminController');

// Express의 라우터 객체를 생성합니다.
const router = express.Router();

// -------------------------------------------
// 1. 사용자 목록 조회 (Get All Users)
// -------------------------------------------

// HTTP GET 요청을 처리합니다.
// 엔드포인트: /api/admin/users
router.get('/users', verifyToken, hasRole(1), getUsers);


// -------------------------------------------
// 2. 사용자 승인 상태 업데이트 (Update User Status)
// -------------------------------------------

// HTTP PUT 요청을 처리합니다.
// 엔드포인트: /api/admin/user/status
router.put('/user/status', verifyToken, hasRole(1), updateUserStatus);


// -------------------------------------------
// 3. 사용자 권한 및 정보 업데이트 (Update User Role and Info)
// -------------------------------------------

// HTTP PUT 요청을 처리합니다.
// 엔드포인트: /api/admin/user/role
router.put('/user/role', verifyToken, hasRole(1), updateUserRole);


// 라우터 객체를 외부에서 사용할 수 있도록 내보냅니다.
module.exports = router;
