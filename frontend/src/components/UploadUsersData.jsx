// UploadUsersData.jsx
import React, { useState, useCallback } from "react";
import api from "../services/api";

export default function UploadExcel() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  const onFilePicked = useCallback((f) => {
    if (!f) return;
    setFile(f);
    setStatus("");
  }, []);

  const handleFileChange = (e) => onFilePicked(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    onFilePicked(f);
  };
  const prevent = (e) => e.preventDefault();

  const handleUpload = async () => {
    if (!file) {
      setStatus("الرجاء اختيار ملف Excel أولاً");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploading(true);
      setStatus("");
      // Build auth header without Content-Type so browser sets multipart boundary
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await fetch(`${api.baseURL}/upload-excel/`, {
        method: "POST",
        headers,
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus(data.success || "تم رفع الملف بنجاح");
        setFile(null);
      } else {
        setStatus("فشل الرفع: " + (data.error || res.statusText));
        console.log(data);
        console.log(formData);
        
      }
    } catch (err) {
      setStatus("فشل الرفع: " + (err?.message || "خطأ غير معلوم"));
    } finally {
      
      
      setUploading(false);
    }
  };

  return (
    <div className="enroll-upload">
      <div
        className="enroll-upload__drop"
        onDragOver={prevent}
        onDragEnter={prevent}
        onDrop={handleDrop}
      >
        <input id="excel-input" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} hidden />
        <label htmlFor="excel-input" className="btn btn-primary-outline">
          اختر ملف Excel
        </label>
        <div className="enroll-upload__meta">
          {file ? (
            <span className="enroll-upload__file-name">{file.name}</span>
          ) : (
            <span className="enroll-upload__file-hint">يمكنك السحب والإفلات هنا</span>
          )}
        </div>
      </div>
      <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
        {uploading ? "جارٍ الرفع..." : "رفع"}
      </button>
      {status && <div className="enroll-upload__status">{status}</div>}
    </div>
  );
}