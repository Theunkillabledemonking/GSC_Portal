const db = require("../config/db");

// 이메일로 사용자 찾기
const findUserByEmail = async (eamil) => {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows.length ? rows[0] : null; // 사용자가 있으면 첫 번째 레코드 반환
};

// 사용자 ID로 사용자 찾기
const findUserById = async (id) => {
  const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows.length ? rows[0] : null;
};

// 새 사용자 추가 (Google OAuth 로그인 시)
const createUser = async (googleId, name, email, refreshToken) => {
  const [result] = await db.query(
    "INSERT INTO users (google_id, name, email, refresh_token) VALUES (?, ?, ?, ?)",
    [googleId, name, email, refreshToken]
  );
  return result.insertId; // 삽입된 사용자의 ID 반환
};

// 사용자 Refresh Token 업데이트 (토큰 재발급 사용)
const updateRefreshToken = async (userId, refreshToken) => {
  await db.query("UPDATE users SET refresh_token = ? WHERE id = ?", [
    refreshToken,
    userId,
  ]);
};

moduel.export = {
  findUserByEmail,
  findUserById,
  createUser,
  updateRefreshToken,
};
