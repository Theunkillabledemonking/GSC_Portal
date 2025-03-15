const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { getGoogleTokens, getGoogleUser } = require("../services/googleService");
require("dotenv").config();

const { JWT_SECRET } = process.env;

/**
 * Google OAuth 콜백 (로그인 및 JWT 발급)
 */
exports.googleCallback = async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).json({ message: "인가 코드가 없습니다." });

    console.log("📌 Google Callback 실행 - 받은 인증 코드:", code);
    console.log("📌 사용된 REDIRECT_URI:", process.env.REDIRECT_URL); // 🚨 실제 사용된 값 확인

    try {
        // ✅ Google API에서 Access Token 및 Refresh Token 요청
        const { access_token, refresh_token } = await getGoogleTokens(code);
        console.log("✅ Access Token:", access_token);
        console.log("✅ Refresh Token:", refresh_token);

        // ✅ Access Token으로 사용자 정보 요청
        const userInfo = await getGoogleUser(access_token);

        // ✅ 학교 이메일 검증
        if (!userInfo.email.endsWith("@g.yju.ac.kr")) {
            return res.redirect(`${process.env.VITE_FRONTEND_URL}/login?error=invalid_email`);
        }

        // ✅ DB에서 사용자 확인
        const [results] = await pool.promise().query("SELECT * FROM users WHERE email = ?", [userInfo.email]);

        if (results.length === 0) {
            return res.redirect(`${process.env.VITE_FRONTEND_URL}/register?email=${userInfo.email}`)
        }

        const user = results[0];

        // ✅ 승인 상태(status) 체크 (1: 승인 완료, 0: 승인 대기, 2: 승인 거부)
        if (user.status === 2) {
            return res.redirect(`${process.env.VITE_FRONTEND_URL}/login?error=rejected`);
        }

        // ✅ JWT Access Token 발급
        const jwtToken = jwt.sign(
            {
                email: user.email,
                role: user.role || 3,
                is_verified: Boolean(user.verified),
                name: user.name,
                grade: user.grade,
                level: user.level,
                status: user.status
            },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        // ✅ Refresh Token을 httpOnly 쿠키로 저장
        res.cookie("refreshToken", refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== "production",
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
        });

        // ✅ **프론트엔드로 리다이렉트하여 토큰 전달**
        return res.redirect(
            `${process.env.VITE_FRONTEND_URL}/oauth/success?token=${jwtToken}&role=${user.role}&name=${encodeURIComponent(user.name)}&grade=${user.grade}&level=${user.level}&status=${user.status}`
        );

    } catch (err) {
        return res.redirect(`${process.env.VITE_FRONTEND_URL}/login?error=${encodeURIComponent(err.message)}`);
    }
};
