const express = require("express");
const router = express.Router();
const template = require("../lib/template.js");

// 라우터 설정 , express에서 2번째 인자인 콜백은 미들웨어임.
router.get("/", (request, response) => {
  var title = "Welcome";
  var description = "Hello, Node.js";
  var list = template.list(request.list);
  var html = template.HTML(
    title,
    list,
    `<h2>${title}</h2>${description}
    <img src="/images/hateJS.gif" style="width:300px; display:block; margin-top:10px;">
    `,
    `<a href="/topic/create">create</a>`
  );

  response.send(html);
});

module.exports = router;
