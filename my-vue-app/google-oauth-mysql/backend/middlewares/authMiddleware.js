// JSON Web Token (JWT) 모듈을 불러옵니다.
// 사용자의 인증 및 권한 검증을 위해 JWT를 사용합니다.
const jwt = require('jsonwebtoken');

// -------------------------------------------
// 1. JWT 토큰 검증 미들웨어 (verifyToken)
// -------------------------------------------

// 요청 헤더에 포함된 JWT를 검증합니다.
exports.verifyToken = (req, res, next) => {
    // 1. 요청 헤더에서 'authorization' 값을 가져옵니다.
    const token = req.headers['authorization'];

    // 2. 토큰이 없으면 403 상태 코드와 메시지를 반환합니다.
    if (!token) return res.status(403).json({ message: '토큰이 없습니다.'});

    try {
        // 3. JWT 토큰을 검증합니다.
        // - 'Bearer [토큰값]' 형식으로 전달되므로, 'Bearer ' 이후의 실제 토큰 값을 추출합니다.
        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);

        // 4. 검증된 토큰의 payload 정보를 요청 객체 (req)에 추가됩니다.
        req.user = decoded;

        // 5. 다음 미들웨어로 넘어갑니다.
        next();

    } catch (error) {
        // 6. 토큰이 유효하지 않으면 401 상태 코드와 메시지를 반환합니다.
        res.status(401).json({ message: '유효하지 않은 토큰입니다.'});
    }
};

// -------------------------------------------
// 2. 권한 확인 미들웨어 (hasRole)
// -------------------------------------------

// 사용자의 권한(role)에 주어진 역할(role) 이상인지 확인합니다.
// - 관리자(1), 교수(2), 학생(3) 순으로 낮은 숫자가 더 높은 권한을 의미합니다.
exports.hasRole = (role) => {
    return (req, res, next) => {
        // 1. 요청된 사용자의 권한이 파라미터로 받은 권한보다 작거나 같으면 접근 허용
        if (req.user.role <= role) {
            next(); // 다음 미들웨어 또는 라우트 핸들러로 넘어감
        } else {
            // 2. 권한이 부족하면 403 상태 코드와 메시지를 반환
            res.status(403).json({ message: '접근 권한이 없습니다.' });
        }
    };
};

// -------------------------------------------
// 3. 승인 상태 확인 미들웨어 (checkStatus)
// -------------------------------------------

// 사용자의 승인 상태(status)를 확인합니다.
// - 1: 승인 완료, 0: 승인 대기, 2: 승인 거부
exports.checkStatus = (req, res, next) => {
    if (req.path === "/auth/me") {
        return next();
    }

    if (req.user.status === 1) {
        // 1. 사용자가 승인 완료 상태이면 다음 미들웨어로 넘어감
        next();
    } else if (req.user.status === 0) {
        // 2. 사용자가 승인 대기 상태이면 200 상태 코드와 메시지를 반환
        res.status(200).json({ status: 0 });
    } else {
        // 3. 사용자가 승인 거부 상태이면 403 상태 코드와 메시지를 반환
        res.status(403).json({ message: '승인 거부되었습니다.' });
    }
};