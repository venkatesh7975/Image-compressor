import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const ImageUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await axios.post(
        "http://localhost:5000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setResult(response.data);
      setError("");
    } catch (error) {
      setError("Image upload failed. Please try again.");
      setResult(null);
    }
  };

  return (
    <div className="container mt-5">
      <h1>Image Compression Tool</h1>
      <input
        type="file"
        accept="image/*"
        className="form-control"
        onChange={handleFileChange}
      />
      <button className="btn btn-primary mt-3" onClick={handleUpload}>
        Upload
      </button>

      {error && <div className="alert alert-danger mt-3">{error}</div>}
      {result && (
        <div className="mt-4">
          <h3>Compression Results:</h3>
          <p>Original Size: {result.originalSize} bytes</p>
          <p>Compressed Size: {result.compressedSize} bytes</p>
          <p>Reduction: {result.reductionPercentage}%</p>
          <a
            href={`http://localhost:5000${result.downloadLink}`} // Updated link
            className="btn btn-success mt-2"
          >
            Download Compressed Image
          </a>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
