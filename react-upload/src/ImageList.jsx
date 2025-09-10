import React, { useEffect, useState } from "react";
import "./ImageList.css";

const ImageList = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const url = "http://localhost:4000/images";
      console.log("요청 URL:", url);

      const res = await fetch(url);
      console.log("응답 상태:", res.status);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("받은 데이터:", data);
      setImages(data);
      setError(null);
    } catch (err) {
      console.error("이미지 목록 조회 실패:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  if (loading) {
    return (
      <div className="image-list-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>이미지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="image-list-container">
        <div className="error-message">
          <h3>❌ 에러 발생</h3>
          <p>{error}</p>
          <button onClick={fetchImages} className="retry-button">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="image-list-container">
      <div className="image-list-header">
        <h2 className="image-list-title">📸 업로드된 이미지 목록</h2>
        <div className="image-count">총 {images.length}개의 이미지</div>
        <button onClick={fetchImages} className="refresh-button">
          🔄 새로고침
        </button>
      </div>

      {images.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">��</div>
          <h3>아직 업로드된 이미지가 없습니다</h3>
          <p>위에서 이미지를 업로드해보세요!</p>
        </div>
      ) : (
        <div className="image-grid">
          {images.map((img, index) => (
            <div key={img.id} className="image-card">
              <div className="image-wrapper">
                <img
                  src={`http://localhost:4000/image/${img.id}`}
                  alt={`업로드된 이미지 ${index + 1}`}
                  className="image-item"
                  loading="lazy"
                />
                <div className="image-overlay">
                  <div className="image-actions">
                    <button
                      className="action-button"
                      onClick={() =>
                        window.open(
                          `http://localhost:4000/image/${img.id}`,
                          "_blank"
                        )
                      }
                    >
                      🔍 확대보기
                    </button>
                  </div>
                </div>
              </div>
              <div className="image-info">
                <div className="image-type">
                  {img.contentType.split("/")[1].toUpperCase()}
                </div>
                <div className="image-id">ID: {img.id.slice(-8)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageList;
