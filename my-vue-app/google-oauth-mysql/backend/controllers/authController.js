const jwt = require("jsonwebtoken");
const keys = require("../config/keys");
const { updateRefreshToken, findUserById } = require("../modles/userModel");

// Access Token 생성 함수
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    keys.jwtSecret,
    {
      expiresIn: keys.jwtAccessExpiration, // Access Token 만료 시간 (15분)
    }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id }, keys.jwtSecret, {
    expiresIn: keys.jwtRefreshExpiration, // Refresh Token 만료 시간 (7일)
  });
};

// Google OAuth 로그인 콜백 함수
exports.gooleCallback = async (req, res) => {
  const user = req.user; // Passport에서 전달한 사용자 정보

  // 1) 사용자가 승인 상태인지 확인
  if (user.status === "pending") {
    return res.status(403).json({ message: "승인 대기 중인 사용자입니다." });
  }
  if (user.status === "rejected") {
    return res.status(403).json({ message: "승인이 거부된 사용자입니다." });
  }

  // 2) Access Token과 Refresh Token 발급
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // 3) Refresh Token을 DB에 저장 (토큰 재발급 시 사용)
  await updateRefreshToken(user.id, refreshToken);

  // 4) Access Token과 Refresh Token을 JSON을 응답
  res.json({ accessToken, refreshToken });
};

// Refresh Token을 사용한 Access Token 재발급 함수
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "Unauthorized" });

  try {
    // 1) Refresh Token 검증
    const decoded = jwt.verify(refreshToken, keys.jwtSecret);

    // 2) DB에서 사용자 정보 조회
    const user = await findUserById(decoded.id);

    // 3) Refresh Token이 일치하는지 확인
    if (!user || user.refresh_token !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // 4) 새로운 Access Token 발급
    const accessToken = generateAccessToken(user);
    res.json({ accessToken }); // 새로운 Access Token 반환
  } catch (error) {
    res.status(403).json({ message: "Invalid refresh token " });
  }
};
