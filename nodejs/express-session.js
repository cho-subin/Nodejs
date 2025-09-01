const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const path = require("path");
const bodyParser = require("body-parser");

const app = express();

// EJS 템플릿 엔진
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// body-parser
app.use(bodyParser.urlencoded({ extended: false }));

// 세션 설정
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: new FileStore(),
  })
);

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// 유저 데이터 (DB 대신 하드코딩)
const users = [{ id: 1, username: "binsu", password: "1234" }];

// Passport Local 전략
passport.use(
  new LocalStrategy((username, password, done) => {
    const user = users.find(
      (u) => u.username === username && u.password === password
    );
    if (user) return done(null, user);
    return done(null, false, { message: "아이디 또는 비밀번호가 틀렸습니다." });
  })
);

// 세션에 사용자 저장
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// 세션에서 사용자 불러오기
passport.deserializeUser((id, done) => {
  const user = users.find((u) => u.id === id);
  done(null, user);
});

// 미들웨어 (로그인 여부 확인)
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

// 라우트
app.get("/", (req, res) => {
  res.render("index", { user: req.user });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

app.get("/main", isAuthenticated, (req, res) => {
  res.render("main", { user: req.user });
});

// 서버 실행
app.listen(3000, () => {
  console.log("🚀 서버 실행 중: http://localhost:3000");
});
