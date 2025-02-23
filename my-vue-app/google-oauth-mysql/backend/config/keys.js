require("dotenv").config(); // .env 파일을 로드하여 proccess.env로 사용

module.exports = {
  port: process.env.PORT || 5000,
  googleClientID: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackURL: process.env.GOOGLE_CALLBACK_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION || "15m",
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || "7d",
  dbHost: process.env.DB_HOST,
  dbUSER: process.env.DB_USER,
  dbPass: process.env.DB_PASS,
  dbName: process.env.DB_NAME,
};
