// 서버 설정 및 모든 라우트 통합

// 모듈 및  패키지 불러오기
const express = require('express');
const cors = require('cors');

// 환경 변수 로드
require('dotenv').config(); // .env 파일 로드

// mysql 연결 설정
const pool = require('./config/db');

// 라우터 불러오기
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes =  require('./routes/adminRoutes');

// Express 앱 초기화
const app = express();

// 미들웨어 설정
app.use(cors()); // CORS 설정
app.use(express.json()); // JSON 요청 본문 파싱

// 라우터 등록
app.use('/api/auth', authRoutes); // 인증 라우팅
app.use('/api/user', userRoutes); // 사용자 라우팅
app.use('/api/admin', adminRoutes); // 관리자 라우팅

// 에러 핸들러
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: err.message || '서버 오류 발생' });
});

// 포트 설정 및 서버 시작
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`서버 포트 ${PORT}에서 실행 중입니다.`);
});

// 데이터베이스 연결 테스트
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ 데이터베이스 연결 성공!');
        connection.release(); // 연결 해제
    } catch (error) {
        console.error('❌ 데이터베이스 연결 실패:', error.message);
    }
})();