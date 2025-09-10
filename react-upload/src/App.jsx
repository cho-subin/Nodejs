import { useState } from "react";
import axios from "axios";
import "./App.css";
import ImageList from "./ImageList";

function App() {
  const [file, setFile] = useState(null);
  const [imageId, setImageId] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("파일을 선택하세요!");

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await axios.post("http://localhost:4000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setImageId(res.data.id);
    } catch (error) {
      alert("업로드 실패: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <h1 className="upload-title">이미지 업로드</h1>
      <p className="upload-subtitle">
        React + MongoDB로 이미지를 업로드해보세요!
      </p>

      <div className="file-input-container">
        <div className="file-input-wrapper">
          <input
            type="file"
            id="fileInput"
            className="file-input"
            onChange={(e) => setFile(e.target.files[0])}
            accept="image/*"
          />
          <label htmlFor="fileInput" className="file-input-label">
            {file ? file.name : "이미지 파일을 선택하세요"}
          </label>
        </div>

        {file && (
          <div className="selected-file">
            <strong>선택된 파일:</strong> {file.name} (
            {(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}
      </div>

      <button
        className="upload-button"
        onClick={handleUpload}
        disabled={!file || isUploading}
      >
        {isUploading ? (
          <>
            <span className="loading"></span> 업로드 중...
          </>
        ) : (
          "업로드하기"
        )}
      </button>

      {imageId && (
        <div className="uploaded-image-container">
          <h2 className="uploaded-image-title">✅ 업로드 완료!</h2>
          <img
            src={`http://localhost:4000/image/${imageId}`}
            alt="uploaded"
            className="uploaded-image"
          />
        </div>
      )}

      <ImageList />
    </div>
  );
}

export default App;
