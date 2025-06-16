// =======================
// ✅ 서버 시작 파일 (server.js)
// =======================

// 모듈 및 패키지 불러오기
const express = require("express");
const http = require("http");
const app = require("./app"); // ✅ app.js 파일을 불러옴
const pool = require("./config/db"); // ✅ MySQL 연결 설정
require("dotenv").config(); // ✅ 환경 변수 로드

const server = http.createServer(app);
// ✅ WebSocket 초기화
const { initializeSocket } = require("./socket");
initializeSocket(server); // 💡 socket.io와 서버 연결

// 포트 설정 및 서버 시작
const PORT = process.env.PORT || 5000;

pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ 데이터베이스 연결 실패:", err.message);
        process.exit(1);
    }
    console.log("✅ 데이터베이스 연결 성공!!");
    connection.release();
});

server.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: ${process.env.SERVER_URL || "http://localhost"}:${PORT}`);
});