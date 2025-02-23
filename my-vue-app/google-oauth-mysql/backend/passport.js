const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const keys = require("./config/keys");
const { findUserByEmail, createUser } = require("./models/userModel");

// Google OAuth 설정
passport.use(
  new GoogleStrategy(
    {
      clientID: keys.googleClientID, // 클라이언트 ID
      clinetSecret: keys.googleClientSecret, // 클라이언트 비밀 키
      callbackURL: keys.googleCallbackURL, // 인증 후 리디렉션 URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1) 사용자의 이메일로 DB에서 사용자 찾기
        let user = await findUserByEmail(profile.emails[0].value);

        // 2) 사용자가 없으면 새로 생성
        if (!user) {
          const userId = await createUser(
            profile.id,
            profile.displayName,
            profile.emails[0].value,
            refreshToken
          );
          user = {
            id: userId,
            google_id: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            status: "pending",
          };
        }

        done(null, user); // 사용자 정보를 done()을 통해 반환
      } catch (error) {
        done(error, null); // 오류 발생 시 null 반환
      }
    }
  )
);

// 사용자 직렬화 (세션에 사용자 정보 저장)
passport.serializeUser((user, done) => done(null, user));

// 사용자 역직렬화 (세션에서 사용자 정보 복원)
passport.deserializeUser((user, done) => done(null, user));
