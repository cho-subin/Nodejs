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
// querystring : node.js 쿼리 문자열 내장 모듈. 쿼리 문자열 파싱 가능
// const querystring = require("querystring");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());

// 직접 만드는 미들웨어
// 미들웨어를 만들어 쓰는 이유 : 데이터 처리 로직을 중앙 집중화하여 재사용성 증가, 코드 구조 개선, 유지보수 용이
// 사실상 express는 모든게 미들웨어라고 해도 과언이 아님. 모든 요청은 미들웨어를 거쳐 처리됨.
app.get("*", (request, response, next) => {
  fs.readdir("./data", function (error, filelist) {
    request.list = filelist;

    next(); // 그 다음 미들웨어 실행
  });
});

// 라우터 설정 , express에서 2번째 인자인 콜백은 미들웨어임.
app.get("/", (request, response) => {
  var title = "Welcome";
  var description = "Hello, Node.js";
  var list = template.list(request.list);
  var html = template.HTML(
    title,
    list,
    `<h2>${title}</h2>${description}`,
    `<a href="/create">create</a>`
  );

  response.send(html);
});

app.get("/page/:pageId", (request, response) => {
  var filteredId = path.parse(request.params.pageId).base;

  fs.readFile(`data/${filteredId}`, "utf8", function (err, description) {
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
      ` <a href="/create">create</a>
           <a href="/update/${sanitizedTitle}">update</a>
           <form action="/delete_process" method="post">
             <input type="hidden" name="id" value="${sanitizedTitle}">
             <input type="submit" value="delete">
           </form>`
    );

    response.send(html);
  });
});

app.get("/create", (request, response) => {
  var title = "WEB - create";
  var list = template.list(request.list);
  var html = template.HTML(
    title,
    list,
    `
    <form action="/create_process" method="post">
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

app.post("/create_process", (request, response) => {
  // body parser middleware를 사용하면 데이터 스트림 처리 (request.on 콜백을 직접 할 필요가 없음)
  // 메모리 관리를 알아서 처리 / 버퍼 오버플로우 방지
  const post = request.body;
  const title = post.title;
  const description = post.description;
  fs.writeFile(`data/${title}`, description, "utf8", function (err) {
    response.redirect(`/page/${title}`);
  });

  // var body = "";

  // request.on("data", function (data) {
  //   body = body + data;
  // });

  // request.on("end", function () {
  //   var post = querystring.parse(body);
  //   var title = post.title;
  //   var description = post.description;

  //   fs.writeFile(`data/${title}`, description, "utf8", function (err) {
  //     response.redirect(`/page/${title}`);
  //   });
  // });
});

app.get("/update/:pageId", (request, response) => {
  var filteredId = path.parse(request.params.pageId).base;

  fs.readFile(`data/${filteredId}`, "utf8", function (err, description) {
    var title = request.params.pageId;
    var list = template.list(request.list);
    var html = template.HTML(
      title,
      list,
      `
        <form action="/update_process" method="post">
          <input type="hidden" name="id" value="${title}">
          <p><input type="text" name="title" placeholder="title" value="${title}"></p>
          <p>
            <textarea name="description" placeholder="description">${description}</textarea>
          </p>
          <p>
            <input type="submit">
          </p>
        </form>
        `,
      `<a href="/create">create</a> <a href="/update/${title}">update</a>`
    );

    response.send(html);
  });
});

app.post("/update_process", (request, response) => {
  const post = request.body;
  const id = post.id;
  const title = post.title;
  const description = post.description;

  fs.rename(`data/${id}`, `data/${title}`, function (error) {
    fs.writeFile(`data/${title}`, description, "utf8", function (err) {
      response.redirect(`/page/${title}`);
    });
  });

  // var body = "";

  // request.on("data", function (data) {
  //   body = body + data;
  // });

  // request.on("end", function () {
  //   var post = querystring.parse(body);
  //   var id = post.id;
  //   var title = post.title;
  //   var description = post.description;

  //   fs.rename(`data/${id}`, `data/${title}`, function (error) {
  //     fs.writeFile(`data/${title}`, description, "utf8", function (err) {
  //       response.redirect(`/page/${title}`); // 수정된 부분
  //     });
  //   });
  // });
});

app.post("/delete_process", (request, response) => {
  const post = request.body;
  const id = post.id;
  const filteredId = path.parse(id).base;

  fs.unlink(`data/${filteredId}`, function (error) {
    response.redirect(`/`);
  });

  // var body = "";

  // request.on("data", function (data) {
  //   body = body + data;
  // });

  // request.on("end", function () {
  //   var post = querystring.parse(body);
  //   var id = post.id;
  //   var filteredId = path.parse(id).base;

  //   fs.unlink(`data/${filteredId}`, function (error) {
  //     response.redirect(`/`);
  //   });
  // });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

// var http = require('http');
// var fs = require('fs');
// var url = require('url');
// var qs = require('querystring');
// var template = require('./lib/template.js');
// var path = require('path');
// var sanitizeHtml = require('sanitize-html');

// var app = http.createServer(function(request,response){
//     var _url = request.url;
//     var queryData = url.parse(_url, true).query;
//     var pathname = url.parse(_url, true).pathname;
//     if(pathname === '/'){
//       if(queryData.id === undefined){
//         fs.readdir('./data', function(error, filelist){
//           var title = 'Welcome';
//           var description = 'Hello, Node.js';
//           var list = template.list(filelist);
//           var html = template.HTML(title, list,
//             `<h2>${title}</h2>${description}`,
//             `<a href="/create">create</a>`
//           );
//           response.writeHead(200);
//           response.end(html);
//         });
//       } else {
//         fs.readdir('./data', function(error, filelist){
//           var filteredId = path.parse(queryData.id).base;
//           fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
//             var title = queryData.id;
//             var sanitizedTitle = sanitizeHtml(title);
//             var sanitizedDescription = sanitizeHtml(description, {
//               allowedTags:['h1']
//             });
//             var list = template.list(filelist);
//             var html = template.HTML(sanitizedTitle, list,
//               `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
//               ` <a href="/create">create</a>
//                 <a href="/update?id=${sanitizedTitle}">update</a>
//                 <form action="delete_process" method="post">
//                   <input type="hidden" name="id" value="${sanitizedTitle}">
//                   <input type="submit" value="delete">
//                 </form>`
//             );
//             response.writeHead(200);
//             response.end(html);
//           });
//         });
//       }
//     } else if(pathname === '/create'){
//       fs.readdir('./data', function(error, filelist){
//         var title = 'WEB - create';
//         var list = template.list(filelist);
//         var html = template.HTML(title, list, `
//           <form action="/create_process" method="post">
//             <p><input type="text" name="title" placeholder="title"></p>
//             <p>
//               <textarea name="description" placeholder="description"></textarea>
//             </p>
//             <p>
//               <input type="submit">
//             </p>
//           </form>
//         `, '');
//         response.writeHead(200);
//         response.end(html);
//       });
//     } else if(pathname === '/create_process'){
//       var body = '';
//       request.on('data', function(data){
//           body = body + data;
//       });
//       request.on('end', function(){
//           var post = qs.parse(body);
//           var title = post.title;
//           var description = post.description;
//           fs.writeFile(`data/${title}`, description, 'utf8', function(err){
//             response.writeHead(302, {Location: `/?id=${title}`});
//             response.end();
//           })
//       });
//     } else if(pathname === '/update'){
//       fs.readdir('./data', function(error, filelist){
//         var filteredId = path.parse(queryData.id).base;
//         fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
//           var title = queryData.id;
//           var list = template.list(filelist);
//           var html = template.HTML(title, list,
//             `
//             <form action="/update_process" method="post">
//               <input type="hidden" name="id" value="${title}">
//               <p><input type="text" name="title" placeholder="title" value="${title}"></p>
//               <p>
//                 <textarea name="description" placeholder="description">${description}</textarea>
//               </p>
//               <p>
//                 <input type="submit">
//               </p>
//             </form>
//             `,
//             `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
//           );
//           response.writeHead(200);
//           response.end(html);
//         });
//       });
//     } else if(pathname === '/update_process'){
//       var body = '';
//       request.on('data', function(data){
//           body = body + data;
//       });
//       request.on('end', function(){
//           var post = qs.parse(body);
//           var id = post.id;
//           var title = post.title;
//           var description = post.description;
//           fs.rename(`data/${id}`, `data/${title}`, function(error){
//             fs.writeFile(`data/${title}`, description, 'utf8', function(err){
//               response.writeHead(302, {Location: `/?id=${title}`});
//               response.end();
//             })
//           });
//       });
//     } else if(pathname === '/delete_process'){
//       var body = '';
//       request.on('data', function(data){
//           body = body + data;
//       });
//       request.on('end', function(){
//           var post = qs.parse(body);
//           var id = post.id;
//           var filteredId = path.parse(id).base;
//           fs.unlink(`data/${filteredId}`, function(error){
//             response.writeHead(302, {Location: `/`});
//             response.end();
//           })
//       });
//     } else {
//       response.writeHead(404);
//       response.end('Not found');
//     }
// });
// app.listen(3000);
