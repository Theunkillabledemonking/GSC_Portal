// passport.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
require("dotenv").config();

// GoogleStrategy 등록
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        (accessToken, refreshToken, profile, done) => {
            // JWT 발급
            const token = jwt.sign(
                { id: profile.id, name: profile.displayName },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );
            // done의 두 번째 인자: req.user로 들어갈 값
            return done(null, { profile, token });
        }
    )
);

// 직렬화 / 역직렬화 (OAuth 완료후 사용자 정보를 세션에 저장하는 용도)
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});
