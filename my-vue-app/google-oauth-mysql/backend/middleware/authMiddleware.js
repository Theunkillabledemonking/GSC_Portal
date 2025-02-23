const jwt = require("jsonwebtoken");
const keys = require("../config/keys");

// JWT 인증 미들웨어 (Access Token 검증)
module.exports = (req, res, next) => {
  // 1) Authorization 헤더에서 Bearer Token 추출
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    // 2) JWT 토큰 검증 (유효성 확인 및 디코딩)
    const decoded = jwt.verify(token, keys.jwtSecret);
    req.user = decoded; // 요청 객체에 사용자 정보 추가
    next(); // 다음 미들웨어로 이동
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
