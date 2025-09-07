// UploadExcel.js
import React, { useState } from "react";

export default function UploadExcel() {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload-excel/", {
        method: "POST",
        body: formData,
      });

      const data = await res.json(); // ✅ parse JSON
      if (res.ok) {
        alert(data.success || "Upload successful");
      } else {
        alert("Upload failed: " + (data.error || res.statusText));
      }
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
  };

  return (
    <div>
      <h2>Upload Students Excel</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}
