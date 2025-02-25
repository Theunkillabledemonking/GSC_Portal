const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const keys = require("./config/keys");
const { findUserByEmail, createUser } = require("./models/userModel");

// Google OAuth 설정
passport.use(
    new GoogleStrategy(
        {
            clientID: keys.googleClientID,
            clientSecret: keys.googleClientSecret,
            callbackURL: keys.googleCallbackURL,
            scope: ["profile", "email"],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // 구글 계정 이메일
                const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
                if (!email) {
                    return done(new Error("Google account has no email"), null);
                }

                // 사용자 찾기
                let user = await findUserByEmail(email);
                if (!user) {
                    // 새 사용자 생성
                    const userId = await createUser(profile.id, profile.displayName, email, refreshToken);
                    // user_id를 id로 매핑
                    user = {
                        user_id: userId,         // DB PK
                        google_id: profile.id,   // 구글 식별자
                        name: profile.displayName,
                        email: email,
                        status: "pending",
                    };
                } else {
                    // 이미 존재하면 그대로 사용
                }

                // 세션에 저장할 객체.
                // 내부 로직에서 "user.id"를 참조하므로, user_id를 별도 프로퍼티로 배치
                // 만약 userModel의 결과가 { user_id: 1, google_id: "...", ... } 형태라면 다음처럼 정리:
                const finalUser = {
                    id: user.user_id,        // jwt 생성 시 user.id => user_id로 사용
                    user_id: user.user_id,
                    google_id: user.google_id,
                    name: user.name,
                    email: user.email,
                    status: user.status,
                };

                return done(null, finalUser);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

