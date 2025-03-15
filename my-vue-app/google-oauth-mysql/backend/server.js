// =======================
// ✅ 서버 시작 파일 (server.js)
// =======================

// 모듈 및 패키지 불러오기
const app = require('./app'); // ✅ app.js 파일을 불러옴
const pool = require('./config/db'); // ✅ MySQL 연결 설정
require('dotenv').config(); // ✅ 환경 변수 로드

// 포트 설정 및 서버 시작
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`🚀 서버 실행 중: ${process.env.SERVER_URL || 'http://localhost'}:${PORT}`);

    // 데이터베이스 연결 테스트
    try {
        const connection = await pool.getConnection();
        console.log('✅ 데이터베이스 연결 성공!');
        connection.release();
    } catch (error) {
        console.error('❌ 데이터베이스 연결 실패:', error.message);
        process.exit(1); // 서버 종료
    }
});
