const db = require("../config/db");

// 이메일로 사용자 찾기
async function findUserByEmail(email) {
  const [rows] = await db.query(
      "SELECT user_id, google_id, name, email, refresh_token, is_approved FROM users WHERE email = ?",
      [email]
  );
  return rows.length ? rows[0] : null;
}

async function findUserById(id) {
  const [rows] = await db.query(
      "SELECT user_id, google_id, name, email, refresh_token, is_approved FROM users WHERE user_id = ?",
      [id]
  );
  return rows.length ? rows[0] : null;
}

// 새 사용자 추가 (Google OAuth 첫 로그인 시)
async function createUser(googleId, name, email, refreshToken) {
  const [result] = await db.query(
      "INSERT INTO users (google_id, name, email, refresh_token, is_approved) VALUES (?, ?, ?, ?, ?)",
      [googleId, name, email, refreshToken, 0]
  );
  return result.insertId; // 삽입된 user_id
}

// 사용자 Refresh Token 업데이트
async function updateRefreshToken(userId, refreshToken) {
  await db.query("UPDATE users SET refresh_token = ? WHERE user_id = ?", [
    refreshToken,
    userId,
  ]);
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateRefreshToken,
};
