const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
// 서버 실행 포트
const PORT = 4000;

const app = express();
app.use(cors());

// MongoDB 연결 (로컬 기준)
// MongoDB Compass에서 mydb 확인 가능
mongoose.connect("mongodb://127.0.0.1:27017/mydb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 이미지 스키마 & 모델
const ImageSchema = new mongoose.Schema({
  data: Buffer, // 실제 이미지 데이터
  contentType: String, // MIME 타입 (image/png, image/jpeg 등)
  createdAt: { type: Date, default: Date.now },
});

const Image = mongoose.model("Image", ImageSchema);

// multer (메모리 저장)
const storage = multer.memoryStorage(); // 파일이 디스크가 아니라 메모리에 올라옴
const upload = multer({ storage });

// 이미지 업로드 API
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("파일 없음");

    const newImage = new Image({
      data: req.file.buffer,
      contentType: req.file.mimetype,
    });

    await newImage.save();

    res.json({ success: true, id: newImage._id });
  } catch (err) {
    console.error(err);
    res.status(500).send("업로드 실패");
  }
});

// 이미지 조회 API
app.get("/image/:id", async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) return res.status(404).send("이미지 없음");

    res.set("Content-Type", image.contentType);
    res.send(image.data);
  } catch (err) {
    console.error(err);
    res.status(500).send("이미지 불러오기 실패");
  }
});

app.get("/images", async (req, res) => {
  const images = await Image.find().sort({ createdAt: -1 });
  res.json(
    images.map((img) => ({ id: img._id, contentType: img.contentType }))
  );
});

app.get("/", (req, res) => {
  res.json({
    message: "Upload Server is running!",
    endpoints: {
      upload: "POST /upload",
      getImage: "GET /image/:id",
      getImages: "GET /images",
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Upload server running on http://localhost:${PORT}`);
});
