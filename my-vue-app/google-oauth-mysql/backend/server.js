const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passprot");
const authRoutes = require("./routes/authoRoutes");
const keys = require("./config/keys");

require("dotenv").config();
require("./passport");

const app = express();

// CORS 설정
app.use(
  cors({
    origin: ["http://localhost:5176"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json()); // JSON 요청 파싱
app.use(
  session({
    secret: keys.jwtSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// 라우트 연결
app.use("/auth", authRoutes);

// 서버 실행
app.listen(keys.port, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${keys.port}`);
});
