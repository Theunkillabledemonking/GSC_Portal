const axios = require("axios");
require("dotenv").config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URL;

// ✅ Google OAuth 토큰 요청 함수
async function getGoogleTokens(code) {
    const response = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code"
    });

    return response.data; // { access_token, refresh_token, id_token, expires_in }
}

// ✅ Google 사용자 정보 요청 함수
async function getGoogleUser(accessToken) {
    const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    return response.data; // { email, name, sub }
}

// ✅ 서비스 함수 모듈 내보내기
module.exports = {
    getGoogleTokens,
    getGoogleUser
};
