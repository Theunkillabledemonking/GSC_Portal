// Express 모듈을 불러옵니다.
// Express는 Node.js에서 사용되는 웹 프레임워크로, 라우트 및 미들웨어 기능을 제공합니다.
const express = require('express');

// 인증 컨트롤러에서 Google 로그인 및 회원가입 함수를 불러옵니다.
const { googleLogin, registerUser } = require('../controllers/authController');

// Express의 라우터 객체를 생성합니다.
// 라우터 객체를 사용하면 각 기능별로 라우트를 모듈화할 수 있어 유지보수가 쉽습니다.
const router = express.Router();

// -------------------------------------------
// 1. Google 로그인 라우트
// -------------------------------------------

// HTTP POST 요청을 처리합니다.
// 엔드포인트: /api/auth/google-login
// 설명: 사용자가 Google 로그인을 시도하면, Authorization Code를 받아 인증 및 JWT 토큰을 반환합니다.
router.post('/google-login', googleLogin);

// -------------------------------------------
// 2. 회원가입 라우트
// -------------------------------------------

// HTTP POST 요청을 처리합니다.
// 엔드포인트: /api/auth/register
// 설명: 사용자가 Google 로그인 이후, 이름, 학번, 전화번호 등을 입력하여 계정을 등록합니다.
router.post('/register', registerUser);



// 라우터 객체를 외부에서 사용할 수 있도록 내보냅니다.
// 이를 통해 서버(server.js)에서 해당 라우터를 사용할 수 있습니다.
module.exports = router;