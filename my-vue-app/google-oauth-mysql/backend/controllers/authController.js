const axios = require("axios");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
require("dotenv").config();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URL, JWT_SECRET } = process.env;

/**
 * 1. Google 로그인 요청
 */
const getGoogleAuthUrl = (req, res) => {
    const baseUrl = "https://accounts.google.com/o/oauth2/auth";

    const options = {
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URL,
        response_type: "code", // Authorization Code 요청
        access_type: "offline", // Refresh Token 요청
        prompt: "consent", // Oauth에서 권한 요청
        scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.readonly" // Google Calendar API 호출
        ].join(" "),
    };

    const authUrl = `${baseUrl}?${new URLSearchParams(options).toString()}`;
    return res.json({ authUrl });
};

/**
 * Google Oauth 콜백 (인가 코드 받아서 사용자 정보 조회 후 응답)
 */
const googleCallback = async (req, res) => {
    const {code} = req.query;
    if (!code) return res.status(400).json({message: '인가 코드가 없습니다.'});

    try {
        // Google에서 Access Token 및 Refresh Token 요청
        const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: REDIRECT_URL,
            response_type: "authorization_code",
            code,
        });

        const {access_token, refresh_token} = tokenResponse.data;

        // Access Token으로 사용자 정보 요청
        const userInfoResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {Authorization: `Bearer ${access_token}`},
        });

        const userInfo = userInfoResponse.data;

        // 이메일 검증
        if (!userInfo.email.endsWith("@g.yju.ac.kr")) {
            return res.send(`
               <script>
                window.opener.postMessage({ error: '유효한 이메일이 아닙니다.' }, "http://localhost:5173");
                window.close()
               </script>
            `);
        }

        // DB에서 사용자 확인
        const [results] = await db.promise().query("SELECT * FROM users WHERE email = ?", [userInfo.email]);
        let user = results[0];

        if (results.length === 0) {
            return res.send(`
                <script>
                    window.opener.postMessage({ needRegister: true, email: "${userInfo.email}" }, "http://localhost:5173");
                    window.close();
                </script>
            `);
        }

        // JWT Access Token 발급 (1시간)
        const jwtToken = jwt.sign(
            {
                sub: user.google_id || "unknown",
                email: user.email,
                name: user.name,
                role: user.role || "student",
                is_verified: user.is_verified || 0,
            },
            JWT_SECRET,
            {expiresIn: "2h"}
        );

        // Refresh Token을 httpOnly 쿠키로 저장
        res.cookie("refreshToken", refresh_token, {
            httpOnly: true, // JavaScript 접근 불가능
            secure: process.env.NODE_ENV !== "production", // HTTPS에서만 쿠기 저장
            sameSite: "Strict", // CSRF 공격 방지
            maxAge: 7 * 60 * 60 * 1000 // 7일 동안 유지
        });

        return res.send(`
            <script>
                window.opener.postMessage({
                  token: "${jwtToken}", 
                  googleAccessToken: "${access_token}",
                  email: "${user.email}",
                  role: "${user.role || "student"}",
                  grade: "${user.grade || ""}"
                }, "http://localhost:5173");
            </script>
        `);
    } catch (err) {
        return res.status(500).json({message: "Google 로그인 실패", error: err.message});
    }
};

module.exports = { getGoogleAuthUrl, googleCallback };