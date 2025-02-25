
// mysql2/promise 모듈을 불러옵니다.
// 이 모듈은 MySQL 데이터베이스에 연결하기 위한 Promise 기반의 API를 제공합니다.
const mysql = require('mysql2/promise');

// MySQL 연결 풀(pool)을 생성합니다.
// CreatePool은 여러 클라이언트 요청이 동시에 발생해도 효율적으로 처리하기 위해 커넥션을 재사용하도록 도와줍니다.
const pool = mysql.createPool({
    host: process.env.DB_HOST,      // 데이터베이스 서버의 호스트명 또는 IP 주소
    user: process.env.DB_USER,      // 데이터베이스에 접속할 사용자명
    password: process.env.DB_PASS,  // 해당 사용자의 비밀번호
    database: process.env.DB_NAME,   // 사용할 데이터 베이스의 이름
    waitForConnections: true,
    connectionLimit: 10,     // 최대 연결 수
    queueLimit: 0            // 대기열 제한 없음
});

// MySQL 연결 풀 객체를 외부에서 사용할 수 있도록 내보냅니다.
// 이를 통해 다른 모듈에서 pool 객체를 불러와 데이터베이스 쿼리를 실행할 수 있습니다.
module.exports = pool;