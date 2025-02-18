// server.js
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const authRoutes = require("./auth");

require("dotenv").config();      // .env 로드
require("./passport");           // passport.js 설정 로드

const app = express();


app.use(
    cors({
        origin: ["http://abcqkdnxm.o-r.kr", "http://localhost:5176"], // 프론트엔드 주소 추가
        credentials: true,
    })
);

// 세션 설정
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }, // HTTPS 환경이라면 true
    })
);

// Passport 초기화 & 세션연동
app.use(passport.initialize());
app.use(passport.session());

// /auth 라우트 연결
app.use("/auth", authRoutes);

// JWT 검증용 테스트 API
app.get("/api/protected", (req, res) => {
    // Authorization: Bearer <토큰>
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ message: "Protected content", user: decoded });
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
