const mysql = require("mysql2/promise");
const keys = require("./keys");

// MySQL 연결 풀 생성 (Connection Pool)
// - 연결 풀을 사용하면 여러 요청을 효율적으로 처리할 수 있음
const pool = mysql.createPool({
  host: keys.dbHost,     // 원격 서버 IP
  port: keys.dbPort || 3306, // 기본 포트는 3306
  user: keys.dbUser,     // 데이터베이스 사용자
  password: keys.dbPass, // 비밀번호
  database: keys.dbName, // 데이터베이스 이름
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // 연결 시간 초과 (10초)
});

module.exports = pool;