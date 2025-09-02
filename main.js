// express : 웹 서버 프레임워크
const express = require("express");
// compression : 압축 라이브러리
const compression = require("compression");
// body-parser : 요청 본문 파싱 라이브러리
const bodyParser = require("body-parser");
// application 객체 생성
const app = express();
// fs : node.js 파일 시스템 내장 모듈. 파일 읽기, 쓰기, 삭제 등의 작업 가능
const fs = require("fs");
// path : node.js 경로 내장 모듈. 파일 경로 조작 가능
const path = require("path");
// sanitize-html : 태그 제거 라이브러리
const sanitizeHtml = require("sanitize-html");
// template : 템플릿 라이브러리
const template = require("./lib/template.js");
// helmet : 보안 라이브러리
const helmet = require("helmet");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

app.use(helmet());

// 보안 + 기본 세팅
app.use(helmet());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());

app.set("view engine", "ejs"); // ejs 템플릿 엔진 사용
app.set("views", "./views"); // views 폴더에 템플릿을 저장할 것임

// 🔑 세션
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: new FileStore(),
  })
);

// 🚀 Passport 설정
app.use(passport.initialize());
app.use(passport.session());

// 유저 데이터 (DB 대신 하드코딩)
const users = [{ id: 1, username: "subin", password: "1234" }];

// 로컬 id, 비밀번호 인증 LocalStrategy
passport.use(
  new LocalStrategy((username, password, done) => {
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (user) return done(null, user);

    return done(null, false, { message: "아이디/비밀번호 틀림" });
  })
);

// LocalStrategy 성공하면 user.id를 세션에 저장
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// 아래의 요청마다 passport가 세션을 확인해서 DB(or 배열)에서 유저 객체를 꺼내
// req.user에 넣어줌
passport.deserializeUser((id, done) => {
  const user = users.find((u) => u.id === id);
  done(null, user);
});

// 인증 체크 미들웨어(로그인 여부 체크)
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();

  res.redirect("/login");
}

// 로그인 페이지
app.get("/login", (req, res) => {
  res.render("login");
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/", // 로그인 성공 → main.js 대시보드로
    failureRedirect: "/login",
  })
);

// 로그아웃
app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/login");
  });
});

// 여기부터 기존 main.js 라우트들은 로그인 필요!
app.use((req, res, next) => {
  if (!req.isAuthenticated()) return res.redirect("/login");
  next();
});

const topicRouter = require("./routes/topic");
const indexRouter = require("./routes/index");
// querystring : node.js 쿼리 문자열 내장 모듈. 쿼리 문자열 파싱 가능
// const querystring = require("querystring");

app.use(express.static("public")); // public 폴더 안에 있는 파일을 정적 파일로 제공
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());

// 직접 만드는 미들웨어
// 미들웨어를 만들어 쓰는 이유 : 데이터 처리 로직을 중앙 집중화하여 재사용성 증가, 코드 구조 개선, 유지보수 용이
// 사실상 express는 모든게 미들웨어라고 해도 과언이 아님. 모든 요청은 미들웨어를 거쳐 처리됨.
// app.get("*", (request, response, next) => {
app.use((request, response, next) => {
  fs.readdir("./data", function (error, filelist) {
    request.list = filelist;

    next(); // 그 다음 미들웨어 실행
  });
});

app.use((req, res, next) => {
  res.locals.user = req.user; // 모든 템플릿에서 user 변수 사용 가능
  next();
});

app.use("/", indexRouter);
app.use("/topic", topicRouter);

app.get("/topic/create", (request, response) => {
  var title = "WEB - create";
  var list = template.list(request.list);
  var html = template.HTML(
    title,
    list,
    `
    <form action="/topic/create_process" method="post">
                <p><input type="text" name="title" placeholder="title"></p>
                <p>
                  <textarea name="description" placeholder="description"></textarea>
                </p>
                <p>
                  <input type="submit">
                </p>
              </form>
            `,
    ""
  );

  response.send(html);
});

app.get("/topic/:pageId", (request, response) => {
  var filteredId = path.parse(request.params.pageId).base;

  fs.readFile(`data/${filteredId}`, "utf8", function (err, description) {
    if (err) {
      next(err);
    } else {
      var title = request.params.pageId;
      var sanitizedTitle = sanitizeHtml(title);
      var sanitizedDescription = sanitizeHtml(description, {
        allowedTags: ["h1"],
      });
      var list = template.list(request.list);
      var html = template.HTML(
        sanitizedTitle,
        list,
        `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
        ` <a href="/topic/create">create</a>
           <a href="/topic/update/${sanitizedTitle}">update</a>
           <form action="/topic/delete_process" method="post">
             <input type="hidden" name="id" value="${sanitizedTitle}">
             <input type="submit" value="delete">
           </form>`
      );

      response.send(html);
    }
  });
});

// 에러 미들웨어는 아래에 두는 이유 : 미들웨어는 순차적으로 동작함.
// 라우터 바로 뒤에 위치하면 모든 요청이 라우터를 거쳐 처리되기 때문에
// 에러 미들웨어가 실행되지 않음.
app.use((request, response, next) => {
  response.status(404).send("Not found error");
});

// 4개의 인자를 가진 미들웨어는 에러 미들웨어임.
// 에러 미들웨어는 에러가 발생했을 때 실행됨.
app.use((err, request, response, next) => {
  console.error(err.stack);
  response.status(500).send("Something broke!");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
