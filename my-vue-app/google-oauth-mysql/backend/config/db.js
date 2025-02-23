const mysql = require("mysql2/promise");
const keys = require("./keys");

// MySQL 연결 풀 생성 (Connection Pool)
// - 연결 풀을 사용하면 여러 요청을 효율적으로 처리할 수 있음
const pool = mysql.createPool({
  host: keys.dbHost,
  user: keys.dbUser,
  password: keys.dbPass,
  database: keys.dbName,
  waitForConnections: true,
  connectionLimit: 10, // 최대 연결 수
  queueLimit: 0, // 큐 제한 없음
});

// 모듈 외부에서 사용 가능하도록 pool을 내보냄
module.exports = pool;
