const axios = require("axios");
require("dotenv").config();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URL } = process.env;

// ✅ Google OAuth 로그인 URL 생성
exports.getGoogleAuthUrl = () => {
    const baseUrl = "https://accounts.google.com/o/oauth2/auth";

    const options = {
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URL,
        response_type: "code",
        access_type: "offline",
        prompt: "consent",
        scope: ["openid", "email", "profile", "https://www.googleapis.com/auth/calendar.readonly"].join(" "),
    };

    return `${baseUrl}?${new URLSearchParams(options).toString()}`;
};

// ✅ Google OAuth를 사용하여 Access Token 및 Refresh Token 요청
exports.getGoogleTokens = async (code) => {
    const response = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URL,
        grant_type: "authorization_code"
    });

    return response.data; // { access_token, refresh_token, expires_in }
};

// ✅ Google API를 사용하여 사용자 정보 가져오기
exports.getGoogleUser = async (accessToken) => {
    const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    return {
        email: response.data.email,
        name: response.data.name,
        sub: response.data.sub
    };
};

// ✅ Google Calendar API - 사용자의 캘린더 일정 가져오기
exports.getGoogleCalendarEvents = async (accessToken) => {
    const response = await axios.get("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    return response.data.items; // ✅ 캘린더 이벤트 목록 반환
};
