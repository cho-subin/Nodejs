const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const template = require("../lib/template.js");

router.post("/topic/create_process", (request, response) => {
  // body parser middleware를 사용하면 데이터 스트림 처리 (request.on 콜백을 직접 할 필요가 없음)
  // 메모리 관리를 알아서 처리 / 버퍼 오버플로우 방지
  const post = request.body;
  const title = post.title;
  const description = post.description;
  fs.writeFile(`data/${title}`, description, "utf8", function (err) {
    response.redirect(`/topic/${title}`);
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

router.get("/update/:pageId", (request, response) => {
  var filteredId = path.parse(request.params.pageId).base;

  fs.readFile(`data/${filteredId}`, "utf8", function (err, description) {
    var title = request.params.pageId;
    var list = template.list(request.list);
    var html = template.HTML(
      title,
      list,
      `
        <form action="/topic/update_process" method="post">
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
      `<a href="/topic/create">create</a> <a href="/topic/update/${title}">update</a>`
    );

    response.send(html);
  });
});

router.post("/update_process", (request, response) => {
  const post = request.body;
  const id = post.id;
  const title = post.title;
  const description = post.description;

  fs.rename(`data/${id}`, `data/${title}`, function (error) {
    fs.writeFile(`data/${title}`, description, "utf8", function (err) {
      response.redirect(`/topic/${title}`);
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

router.post("/delete_process", (request, response) => {
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

module.exports = router;
