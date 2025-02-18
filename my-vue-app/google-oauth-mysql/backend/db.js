const mysql = require("mysql2/promise");
require("dotenv").config();

// MySQL 연결 풀 생성
const pool = mysql.createPool({
    host: process.env.DB_HOST,       // 리눅스 서버의 MySQL 주소
    user: process.env.DB_USER,       // MySQL 계정
    password: process.env.DB_PASS,   // MySQL 비밀번호
    database: process.env.DB_NAME,   // 사용할 데이터베이스 이름
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
