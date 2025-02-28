// =======================
// ✅ Express 앱 설정 파일 (app.js)
// =======================

// 모듈 및 패키지 불러오기
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // ✅ 환경 변수 로드

// =======================
// ✅ 라우터 불러오기
// =======================
const authRoutes = require('./routes/authRoutes');   // 인증 라우트
const userRoutes = require('./routes/userRoutes');   // 사용자 라우트
const adminRoutes = require('./routes/adminRoutes'); // 관리자 라우트
const noticeRoutes = require('./routes/noticeRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
// =======================
// ✅ Express 앱 초기화
// =======================
const app = express();

// =======================
// ✅ 미들웨어 설정
// =======================

// 1. CORS 설정 (Vue 프론트엔드만 허용)
app.use(cors({
    origin: process.env.VITE_FRONTEND_URL, // ✅ Vue 프론트엔드 URL
    credentials: true                      // ✅ 쿠키 전송 허용
}));

// 2. JSON 요청 본문 파싱
app.use(express.json());

const path = require('path');

// =======================
// ✅ 라우터 등록
// =======================
app.use('/api/auth', authRoutes);       // ✅ 인증 라우트 (Google 로그인 및 회원가입)
app.use('/api/user', userRoutes);       // ✅ 사용자 라우트 (사용자 정보 조회 및 수정)
app.use('/api/admin', adminRoutes);     // ✅ 관리자 라우트 (승인 및 권한 관리)
app.use('/api/notices', noticeRoutes);  // ✅ 공지사항 라우트
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // 파일 업로드 라우트
app.use('/api/calendar', calendarRoutes); // 구글 캘린더 라우트
// =======================
// ✅ 에러 핸들러 (Global Error Handler)
// =======================
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: err.message || '서버에서 오류가 발생했습니다.'
    });
});


// =======================
// ✅ 앱 객체 내보내기
// =======================
module.exports = app;
