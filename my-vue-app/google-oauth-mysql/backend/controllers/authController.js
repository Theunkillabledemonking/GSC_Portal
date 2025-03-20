const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { getGoogleTokens, getGoogleUser } = require("../services/googleService");
require("dotenv").config();

/**
 * ✅ 공통 함수: 이메일로 사용자 조회
 */
const findUserByEmail = async (email) => {
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    return users.length > 0 ? users[0] : null;
};

/**
 * ✅ 공통 함수: JWT 발급 및 로그인 처리
 */
const generateJWT = (user) => {
    return jwt.sign(
        {
            id: user.id,
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
};

/**
 * ✅ Google OAuth 콜백 (로그인 & 회원가입 처리)
 */
exports.googleCallback = async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).json({ message: "인가 코드가 없습니다." });

    console.log("📌 Google Callback 실행 - 받은 인증 코드:", code);
    console.log("📌 사용된 REDIRECT_URI:", process.env.REDIRECT_URL);

    try {
        // ✅ Google API에서 Access Token 및 Refresh Token 요청
        const { access_token, refresh_token } = await getGoogleTokens(code);
        console.log("✅ Access Token:", access_token);
        console.log("✅ Refresh Token:", refresh_token);

        // ✅ Access Token으로 사용자 정보 요청
        const userInfo = await getGoogleUser(access_token);
        console.log("사용자 정보", userInfo);

        // ✅ 학교 이메일 검증
        if (!userInfo.email.endsWith("@g.yju.ac.kr")) {
            console.error("유효한 이메일이 아닙니다");
            return res.redirect(`${process.env.VITE_FRONTEND_URL}/login?error=invalid_email`);
        }

        // ✅ DB에서 사용자 확인
        let user = await findUserByEmail(userInfo.email);

        // ✅ 신규 사용자라면 회원가입 유도
        if (!user) {
            console.log("📌 신규 사용자 → 회원가입 페이지로 이동");
            return res.redirect(`${process.env.VITE_FRONTEND_URL}/register?email=${userInfo.email}`);
        }

        // ✅ 승인 상태(status) 체크 (1: 승인 완료, 0: 승인 대기, 2: 승인 거부)
        if (user.status === 2) {
            console.error("승인 거부된 사용자");
            return res.redirect(`${process.env.VITE_FRONTEND_URL}/login?error=rejected`);
        } else if (user.status === 0) {
            console.log("📌 승인 대기 중 사용자 → 로그인 불가");
            return res.redirect(`${process.env.VITE_FRONTEND_URL}/login?error=pending_approval`);
        }

        // ✅ JWT Access Token 발급
        const jwtToken = generateJWT(user);
        console.log("✅ JWT 생성 완료:", jwtToken);

        // ✅ Refresh Token을 httpOnly 쿠키로 저장
        res.cookie("refreshToken", refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== "production",
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
        });

        // ✅ 프론트엔드로 리다이렉트하여 토큰 전달
        const redirectURL = `${process.env.VITE_FRONTEND_URL}/oauth/success?token=${jwtToken}&role=${user.role}&name=${encodeURIComponent(user.name)}&grade=${user.grade}&level=${user.level}&status=${user.status}`;
        console.log("🔗 최종 리다이렉트 URL:", redirectURL);
        return res.redirect(redirectURL);

    } catch (err) {
        console.error("로그인 실패:", err.message);
        return res.redirect(`${process.env.VITE_FRONTEND_URL}/login?error=${encodeURIComponent(err.message)}`);
    }
};

/**
 * ✅ 회원가입 API
 */
exports.registerUser = async (req, res) => {
    const { email, name, student_id, phone, role, grade, level } = req.body;

    try {
        // ✅ 이메일 중복 확인
        let existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: "이미 등록된 이메일입니다." });
        }

        // ✅ 기본 상태(status=0: 승인 대기)
        const status = 0;

        // ✅ 사용자 데이터 삽입
        const result = await pool.query(
            "INSERT INTO users (email, name, student_id, phone, role, grade, level, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [email, name, student_id, phone, role, grade, level, status]
        );

        return res.status(201).json({ message: "회원가입 성공! 관리자의 승인을 기다려주세요." });
    } catch (error) {
        console.error("회원가입 오류:", error);
        return res.status(500).json({ message: "서버 오류, 다시 시도해주세요." });
    }
};
