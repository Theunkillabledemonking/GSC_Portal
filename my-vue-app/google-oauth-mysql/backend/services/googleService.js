// axios 모듈을 불러옵니다.
// Axios는 HTTP 요청을 보낼 때 사용하는 Promise 기반의 라이브러리입니다.
const axios = require('axios');

// Google OAuth를 통해 사용자의 이메일과 이름을 가져오는 비동기 함수입니다.
exports.getGoogleUser = async (code) => {
    // 1. Google 서버에 Authorization code를 사용해 Access Token 요청
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code,                                           // 사용자가 Google 로그인 후 받은 Authorization Code
        client_id: process.env.GOOGLE_CLIENT_ID,        // Google OAuth 클라이언트 ID (환경 변수로 관리)
        client_secret: process.env.GOOGLE_CLIENT_SECRET,// Google OAuth 클라이언트 시크릿 키 (환경 변수로 관리)
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,  // Google OAuth 콜백 URL (환경 변수로 관리)
        grant_type: 'authorization_code'                // OAuth 2.0 표준에 따라 'authorization_code' 사용
    });

    // 2. Access Token을 사용해 사용자 정보 요청
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.data.accessToken}` } // HTTP 헤더에 Bearer Token 추가
    });

    // 3. 사용자 이메일과 이름을 반환
    return {
        email: userResponse.data.email, // 사용자의 이메일 주소
        name: userResponse.data.name,    // 사용자의 이름
        sub: userResponse.data.sub,
    };
};