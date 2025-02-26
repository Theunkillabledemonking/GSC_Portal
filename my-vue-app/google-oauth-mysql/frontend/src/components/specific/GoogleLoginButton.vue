<script setup>
// Pinia 스토어 불러오기
import { useAuthStore } from '@/store/authStore.js';

// Google OAuth 클라이언트 ID (환경 변수 사용 권장)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

// Pinia 인증 스토어 사용
const authStore = useAuthStore();

// ========================
// ✅ Google 로그인 처리 함수
// ========================
const handleGoogleLogin = async () => {
  try {
    // 1. Google OAuth 팝업 열기 (OAuth 인증 창)
    const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}` +
        `&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;

    const popup = window.open(authUrl, '_blank', 'width=500,height=600');

    // 2. 인가코드 가져오기 (팝업이 닫힐 때까지 대기)
    const code = await waitForGoogleCode(popup);

    // 3. Pinia 스토어의 loginWithGoogle 함수 호출 (백엔드에 코드 전송 및 JWT 수신)
    await authStore.loginWithGoogle(code);

    // 4. 로그인 성공 시 페이지 새로고침 또는 메인 페이지로 이동
    if (authStore.status === 1) {
      alert('로그인 성공!');
      window.location.href = '/dashboard'; // 메인 페이지로 이동
    } else if (authStore.status === 0) {
      alert('승인 대기 중입니다. 관리자의 승인을 기다려주세요.');
    } else if (authStore.status === 2) {
      alert('로그인 실패 or 승인 거부');
    } else if (authStore.status === 3) {
      alert('회원 정보 입력창으로 이동합니다.');
    }
  } catch (error) {
    console.error('Google 로그인 오류:', error);
    alert('로그인 중 오류가 발생했습니다.');
  }
};

// ========================
// ✅ 팝업으로부터 Google 인가코드(code) 가져오기
// ========================
const waitForGoogleCode = (popup) => {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      try {
        // 팝업이 닫히면 오류 처리
        if (!popup || popup.closed) {
          clearInterval(interval);
          reject(new Error('Google 로그인 팝업이 닫혔습니다.'));
        }

        // 팝업의 URL에서 'code' 파라미터 추출
        const url = popup.location.href;
        if (url.includes('?code=')) {
          const code = new URL(url).searchParams.get('code');
          clearInterval(interval);
          popup.close();
          resolve(code); // 인가 코드 반환
        }
      } catch(error) {
        // CORS 정책으로 인해 오류가 발생할 수 있음
      }
    }, 500);
  });
};
</script>

<template>
  <div class="google-login-button">
    <!-- Google 로그인 버튼 -->
    <button @click="handleGoogleLogin">Google 로그인</button>
  </div>
</template>

<style scoped>
.google-login-button button {
  display: inline-block;
  padding: 10px 20px;
  background-color: #4285F4;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}
.google-login-button button:hover {
  background-color: #357AE8;
}
</style>