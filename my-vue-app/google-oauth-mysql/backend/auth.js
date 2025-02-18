const express = require("express");
const passport = require("passport");
const db = require("./db"); // DB 연결 모듈
const router = express.Router();

// Google 로그인 요청
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google 로그인 콜백
router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    async (req, res) => {
        const { profile, token } = req.user;

        try {
            // DB에서 사용자 확인
            let user = await db.query("SELECT * FROM users WHERE google_id = ?", [profile.id]);

            if (!user.length) {
                // 새로운 사용자는 가입 처리 (대기 상태)
                await db.query("INSERT INTO users (google_id, name, email) VALUES (?, ?, ?)", [
                    profile.id,
                    profile.displayName,
                    profile.emails[0].value
                ]);
            }

            // 로그인 성공 후, 승인 여부 확인
            user = await db.query("SELECT * FROM users WHERE google_id = ?", [profile.id]);

            if (user[0].role === "pending") {
                // 승인 대기 중이면 승인 대기 페이지로 리다이렉트
                return res.redirect("http://localhost:5173/pending-approval");
            }

            // 승인된 사용자라면 로그인 성공 후 메인 페이지로 이동
            res.redirect(`http://localhost:5173/login-success?token=${token}`);
        } catch (error) {
            console.error("Database error:", error);
            res.redirect("/");
        }
    }
);

module.exports = router;
