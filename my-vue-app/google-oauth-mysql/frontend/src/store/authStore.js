// Pinia의 defineStore을 가져옵니다.
// defineStore는 스토어를 정의하는 Pinia의 함수입니다.
import { defineStore } from "pinia";

// 사용자 인증 관련 API 함수를 가져옵니다.
// googleLogin: Google 로그인 요청 함수
// registerUser: 회원가입 요청 함수
import { googleLogin, registerUser } from "../services/authService";

// 'auth'라는 이름의 스토어를 정의합니다.
// 이 스토어는 인증과 관련된 상태 및 액션을 관리합니다.
export const useAuthStore = defineStore('auth', {

    // ========================
    // ✅ 1. State (상태 정의)
    // ========================
    // 'state'는 스토어가 관리하는 데이터를 정의합니다.
    // 함수 형태로 작성하여 상태가 초기화될 때마다 새로운 객체를 반환합니다.
    state: () => ({
        status: null,   // 사용자 승인 상태 (0: 대기, 1: 승인, 2: 거부)
        token: null,    // JWT 액세스 토큰 (사용자 인증에 사용됨)
        role: null,     // 사용자 권한 (1: 관리자, 2: 교수, 3: 학생)
        grade: null,    // 사용자 학년 (1, 2, 3)
        level: null     // 사용자 레벨 (N3=3, N2=2, N1=1, TOPIK 6=6, TOPIK 4=4)
    }),

    // =========================
    // ✅ 2. Actions (액션 정의)
    // =========================
    // `actions`는 상태를 변경하거나 비동기 작업을 처리합니다.
    actions: {
        /**
         * ✅ Google 로그인 처리
         * 사용자가 Google 로그인을 하면 API를 호출하여 상태와 토큰을 업데이트합니다.
         * @param {string} code - Google OAuth에서 받은 인증 코드
         */
        async loginWithGoogle(code) {
            // 1. Google 로그인 API 호출 (authService.js의 googleLogin 함수 사용)
            const response = await googleLogin(code);

            // 2. 서버 응답에서 사용자 승인 상태를 업데이트
            this.status = response.status;

            // 3. 사용자가 승인 상태(1)일 때만 토큰과 정보를 저장
            if (response.status === 1) {
                this.token = response.accessToken; // JWT 액세스 토큰 저장
                this.role = response.role;         // 사용자 권한 저장
                this.grade = response.grade;       // 사용자 학년 저장
                this.level = response.level;       // 사용자 레벨 저장
            } else if (response.status === 'new') {
                // 최초 사용자라면 Register 페이지로 이동
                window.location.href = `/register?email=${response.email}$name=${response.name}`;
            }
        },


        /**
         * ✅ 사용자 회원가입 처리
         * 사용자가 Google 로그인 후 추가 정보를 입력하면 API를 호출하여 등록합니다.
         * @param {Object} userData - 사용자 데이터 (이메일, 이름, 학번, 전화번호, 학년, 레벨 등)
         */
        async register(userData) {
            // 1. 회원가입 API 호출 (authService.js의 registerUser 함수 사용)
            await registerUser(userData);

            // 2. 회원가입이 완료되면 승인 대기 상태(0)로 설정
            this.status = 0;
        }
    }
});