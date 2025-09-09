// UploadUsersData.jsx
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function UploadExcel() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState(null); // 'success' | 'error' | null
  const [uploading, setUploading] = useState(false);

  // Helper: Arabic text for common HTTP status
  const arabicStatus = (code, text = '') => {
    const map = {
      400: 'طلب غير صالح',
      401: 'غير مصرح بالدخول',
      403: 'ممنوع',
      404: 'غير موجود',
      413: 'الملف كبير جداً',
      415: 'نوع الملف غير مدعوم',
      500: 'خطأ في الخادم',
      502: 'بوابة خاطئة',
      503: 'الخدمة غير متاحة',
    };
    if (map[code]) return map[code];
    // Fallback to generic Arabic if unknown
    return text ? `خطأ: ${text}` : 'حدث خطأ غير متوقع';
  };

  const onFilePicked = useCallback((f) => {
    if (!f) return;
    setFile(f);
    setStatus("");
    setStatusType(null);
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
      setStatusType(null);
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
        // Normalize success message to Arabic regardless of backend text
        const successMsg = (msg) => {
          if (!msg) return "تم الرفع بنجاح";
          const m = String(msg).toLowerCase();
          if (m.includes('users imported successfully')) return 'تم استيراد المستخدمين بنجاح';
          if (m.includes('imported successfully')) return 'تم الاستيراد بنجاح';
          if (m.includes('uploaded successfully')) return 'تم الرفع بنجاح';
          return 'تم الرفع بنجاح';
        };
        setStatus(successMsg(data.success));
        setStatusType('success');
        setFile(null);
        // Signal Dashboard to refresh and navigate there without full reload
        try {
          window.dispatchEvent(new Event('dashboard-refresh'));
        } catch {}
        navigate(`/dashboard?refresh=${Date.now()}`);
      } else {
        setStatus("فشل الرفع: " + (data.error || arabicStatus(res.status, res.statusText)));
        setStatusType('error');
        
      }
    } catch (_err) {
      setStatus("فشل الرفع: " + ("خطأ في الشبكة أو الخادم"));
      setStatusType('error');
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
      {status && (
        <div
          className={`enroll-upload__status ${statusType === 'error' ? 'is-error' : 'is-success'}`}
          role={statusType === 'error' ? 'alert' : 'status'}
        >
          {status}
        </div>
      )}
    </div>
  );
}