const jwt = require("jsonwebtoken");
const keys = require("../config/keys");
const { updateRefreshToken, findUserById } = require("../models/userModel");

// Access Token 생성
function generateAccessToken(user) {
  // user.id는 DB의 user_id
  return jwt.sign(
      { id: user.user_id, email: user.email },
      keys.jwtSecret,
      { expiresIn: keys.jwtAccessExpiration }
  );
}

// Refresh Token 생성
function generateRefreshToken(user) {
  return jwt.sign(
      { id: user.user_id },
      keys.jwtSecret,
      { expiresIn: keys.jwtRefreshExpiration }
  );
}

// Google OAuth 로그인 콜백
exports.googleCallback = async (req, res) => {
  const user = req.user; // Passport에서 전달 (user.id = user.user_id)

  // ✅ 승인 상태 확인
  if (user.is_approved === 0) {
    return res.redirect(`${keys.frontendUrl}/pending-approval`);
  }
  if (user.is_approved === -1) { // 예시: -1이면 승인 거부 상태로 정의 가능
    return res.redirect(`${keys.frontendUrl}/rejected`);
  }

  // 토큰 발급
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  console.log("Generated Refresh Token:", refreshToken);

  // Refresh Token DB 저장
  await updateRefreshToken(user.user_id, refreshToken);

  // 첫 회원가입이라 student_id가 없으면 register 페이지로
  if (!user.student_id) {
    return res.redirect(
        `${keys.frontendUrl}/register?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  } else {
    return res.redirect(
        `${keys.frontendUrl}/dashboard?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  }
};

// Refresh Token으로 Access Token 재발급
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(refreshToken, keys.jwtSecret);
    const user = await findUserById(decoded.id);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.refresh_token !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user);
    return res.json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};
