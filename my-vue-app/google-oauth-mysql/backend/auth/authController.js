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
            return res.send(`
               <script>
                window.opener.postMessage({ error: "유효한 이메일이 아닙니다." }, "http://localhost:5173");
                window.close();
               </script>
            `);
        }

        // ✅ DB에서 사용자 확인
        const [results] = await pool.promise().query("SELECT * FROM users WHERE email = ?", [userInfo.email]);
        let user = results[0];

        if (results.length === 0) {
            return res.send(`
                <script>
                    window.opener.postMessage({ needRegister: true, email: "${userInfo.email}" }, "http://localhost:5173");
                    window.close();
                </script>
            `);
        }

        // ✅ JWT Access Token 발급
        const jwtToken = jwt.sign(
            {
                email: user.email,
                role: user.role || 3,
                is_verified: Boolean(user.verified) || false,
            },
            JWT_SECRET,
            { expiresIn: "2h" }
        );

        // ✅ Refresh Token을 httpOnly 쿠키로 저장
        res.cookie("refreshToken", refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== "production",
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
        });

        return res.send(`
            <script>
                if (window.opener) {
                    window.opener.postMessage({
                      token: "${jwtToken}", 
                      googleAccessToken: "${access_token}",
                      email: "${user.email}",
                      role: "${user.role || 3}",
                    }, "http://localhost:5173");
                    window.close();
                } else {
                    window.location.href = "http://localhost:5173/dashboard";
                }
            </script>
        `);
    } catch (err) {
        return res.status(500).json({ message: "Google 로그인 실패", error: err.message });
    }
};
