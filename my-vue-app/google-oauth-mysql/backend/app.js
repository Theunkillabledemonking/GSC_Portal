// =======================
// ✅ Express 앱 설정 파일 (app.js)
// =======================

// 모듈 및 패키지 불러오기
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const fs = require('fs');
const cookieParser= require("cookie-parser");
require('dotenv').config(); // ✅ 환경 변수 로드

// ✅ 유틸 함수 - 공휴일 캐싱용
const { fetchAndCacheMonthlyHolidays } = require('./services/holidayService');
// =======================
// ✅ 라우터 불러오기
// =======================
const authRoutes = require('./routes/authRoutes');   // 인증 라우트
const userRoutes = require('./routes/userRoutes');   // 사용자 라우트
const adminRoutes = require('./routes/adminRoutes'); // 관리자 라우트
const noticeRoutes = require('./routes/noticeRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const eventRoutes = require('./routes/eventRoutes'); // 이벤트 (보강/휴강/특강)
const holidayRoutes = require('./routes/holidayRoutes');



// =======================
// ✅ Express 앱 초기화
// =======================
const app = express();

// =======================
// ✅ 미들웨어 설정
// =======================

// 1. CORS 설정 (Vue 프론트엔드만 허용)
app.use(cors({ origin: process.env.VITE_FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    extensions: ['png', 'jpg', 'jpeg', 'pdf']
}));

// =======================
// ✅ 라우터 등록
// =======================
app.use('/api/auth', authRoutes);       // ✅ 인증 라우트 (Google 로그인 및 회원가입)
app.use('/api/user', userRoutes);       // ✅ 사용자 라우트 (사용자 정보 조회 및 수정)
app.use('/api/admin', adminRoutes);     // ✅ 관리자 라우트 (승인 및 권한 관리)
app.use('/api/notices', noticeRoutes);  // ✅ 공지사항 라우트
app.use('/api/subjects', subjectRoutes);
app.use('/api/calendar', calendarRoutes); // 구글 캘린더 라우트
app.use('/api/timetables', timetableRoutes) // ✅ 정규 시간표 관리
app.use('/api/events', eventRoutes); // ✅ 이벤트 관리 (보강/휴강/특강)
app.use('/api/holidays', holidayRoutes);


// =======================
// ✅ 로깅 설정 (access.log 저장)
// =======================
const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'logs', 'access.log'),
    { flags: 'a' }
);
app.use(morgan('combined', { stream: accessLogStream }));

// =======================
// 🚀 앱 시작 시 공휴일 캐시 미리 저장
// =======================
(async () => {
    try {
        const year = new Date().getFullYear();
        for (let m = 1; m <= 12; m++) {
            await fetchAndCacheMonthlyHolidays(year, m);
        }
        console.log("✅ 공휴일 캐시 완료");
    } catch (err) {
        console.error("❌ 공휴일 캐시 실패:", err.message);
    }
})();

// =======================
// ✅ 글로벌 에러 핸들러
// =======================
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: err.message || '서버에서 오류가 발생했습니다.'
    });
});

// =======================
// ✅ 앱 내보내기 (server.js에서 사용)
// =======================
module.exports = app;