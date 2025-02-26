// 데이터베이스 연결 풀을 불러옵니다.
// 이 풀을 통해 MySQL 데이터에비스에 쿼리를 실행합니다.
const pool = require("../config/db");

// JWT (JSON Web Token) 모듈을 불러옵니다.
// 사용자의 인증 및 권한 부여를 위해 JWT를 생성합니다.
const jwt = require("jsonwebtoken");

// Google OAuth 사용자 정보를 가져오는 서비스 함수를 불러옵니다.
const { getGoogleUser } = require('../services/googleService');

// -------------------------------------------
// 1. Google 로그인 함수 (googleLogin)
// -------------------------------------------

// 사용자가 Google 로그인을 하면 이 함수가 실행합니다.
exports.googleLogin = async (req, res) => {
    try {
        // 1. 프론트엔드에서 전송한 Authorization Code를 가져옵니다.
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: "No authorization code provided"})
        }

        // 2. Google OAuth 서버에 Authorization Code를 보내 Access Token 및 사용자 정보를 가져옵니다.
        const googleUser = await getGoogleUser(code);

        // 3. MySQL 데이터베이스에서 사용자의 이메일로 기존 사용자가 있는지 조회합니다.
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [googleUser.email]);

        // 4. 데이터베이스에 사용자가 없을 경우 (최초 사용자)
        if (rows.length === 0) {
            // 신규 사용자일 경우 이름과 이메일반환
            res.status(200).json({ status: 3, email: googleUser.email, name: googleUser.name });
        } else {
            // 5. 기존 사용자가 있을 경우
            const user = rows[0];

            // 6. 사용자가 '승인 완료(1)' 상태인 경우 -> JWT Access Token 및 Refresh Token 발급
            if (user.status === 1) {
                // Access Token 생성 (1시간 유효)
                const accessToken = jwt.sign(
                    {
                        id: user.id,
                        email: user.email,
                        role: user.role,        // 권한
                        grade: user.grade,      // 학년
                        level: user.level,      // 레벨
                    },
                    process.env.JWT_SECRET,     // JWT 암호화에 사용되는 비밀키 (환경 변수로 관리)
                    { expiresIn: '1h'}  // 토큰 유효시간: 1시간
                );

                // Refresh Token 생성 (7일 유효)
                const refreshToken = jwt.sign(
                    { id: user.id },
                    process.env.JWT_SECRET,
                    { expiresIn: '7d'}
                );

                // 7. 데이터베이스에 Access Token 및 Refresh Token을 업데이트합니다.
                await pool.query(
                    'UPDATE users SET access_token = ?, refresh_token = ? WHERE id = ?',
                    [accessToken, refreshToken, user.id]
                );

                // 8.사용자가 승인된 경우, Access Token과 Refresh Token을 응답으로 반환합니다.
                res.status(200).json({
                    status: 1,
                    accessToken,
                    refreshToken,
                    role: user.role
                });

                // 9. 사용자가 승인 '대기(0)' 상태인 경우
            } else if (user.status === 0) {
                res.status(200).json({ status: 0 });

                // 10. 사용자가 '승인 거부(2)' 상태인 경우
            } else {
                res.status(403).json({ status: 2 });
            }
        }
    } catch (error) {
        // 11. 오류 발생 시, 500 상태 코드와 오류 메시지를 반환합니다.
        console.error('Google Login Error:', error);
        res.status(500).json({ status: error.message });
    }
};


// -------------------------------------------
// 2. 회원가입 함수 (registerUser)
// -------------------------------------------

// 사용자가 Google 로그인 후 최초로 회원 정보를 등록할 때 실행됩니다.
exports.registerUser = async (req, res) => {
    try {
        const { email, name, student_id, phone, grade, level } = req.body;
        console.log(req.body);
        await pool.query(
            'INSERT INTO users (email, name, student_id, phone, grade, level, role, status) VALUES (?, ?, ?, ?, ?, ?, 3, 0)',
            [email, name, student_id, phone, grade, level]
        );
        return res.status(200).json({ message: '등록 완료. 승인 대기 중입니다.' });
    } catch (error) {
        console.error('회원가입 INSERT 오류:', error);
        return res.status(500).json({ error: error.message });
    }
};