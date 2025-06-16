const jwt = require('jsonwebtoken');

// ✅ 공통 함수: 토큰 추출
const extractToken = (authorization) =>
    authorization?.startsWith("Bearer ") ? authorization.split(" ")[1] : null;

// ✅ 1. JWT 인증 미들웨어
exports.verifyToken = (req, res, next) => {
    const token = extractToken(req.headers.authorization);
    if (!token) return res.status(403).json({ message: "토큰이 없습니다." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log("✅ [Token 인증 완료] 사용자:", decoded);
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "토큰이 만료되었습니다." });
        }
        return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    }
};

// ✅ 2. 권한(role) 확인 미들웨어
exports.hasRole = (requiredRole) => {
    return (req, res, next) => {
        const userRole = req.user?.role;

        if (typeof userRole !== 'number') {
            return res.status(403).json({ message: "사용자 권한 정보를 찾을 수 없습니다." });
        }

        console.log(`🔐 [권한 확인] 사용자 role: ${userRole}, 필요 role: ${requiredRole}`);

        if (userRole <= requiredRole) {
            return next();
        }

        return res.status(403).json({ message: "접근 권한이 없습니다." });
    };
};

// ✅ 3. 승인 상태 확인 미들웨어
exports.checkStatus = (req, res, next) => {
    const bypass = ["/auth/me"]; // 예외 경로

    if (bypass.includes(req.path)) return next();

    const userStatus = req.user?.status;
    if (typeof userStatus !== "number") {
        return res.status(403).json({ message: "승인 상태 확인 불가" });
    }

    switch (userStatus) {
        case 1:
            return next(); // 승인 완료
        case 0:
            return res.status(200).json({ status: 0, message: "승인 대기 중입니다." });
        default:
            return res.status(403).json({ message: "승인 거부되었습니다." });
    }
};
