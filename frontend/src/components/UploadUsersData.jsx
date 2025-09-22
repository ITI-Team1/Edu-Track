// UploadUsersData.jsx
import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Spinner from "./Spinner";
import toast from '../utils/toast';

export default function UploadExcel({ onUploadComplete, onError }) {
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

  const handleUpload = async (e) => {
    if (e) {
      e.preventDefault(); // Prevent form submission if called from a form
      e.stopPropagation(); // Stop event bubbling
    }
    
    if (!file) {
      const errorMsg = "الرجاء اختيار ملف Excel أولاً";
      setStatus(errorMsg);
      setStatusType('error');
      // Only toast if no parent error handler is provided
      if (onError) {
        onError(errorMsg);
      } else {
        toast.error(errorMsg);
      }
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
        
        const msg = successMsg(data.success);
        setStatus(msg);
        setStatusType('success');
        // Only toast if no parent success handler is provided
        if (!onUploadComplete) {
          toast.success(msg);
        }
        setFile(null);
        
        // Call the success callback if provided
        if (onUploadComplete) {
          onUploadComplete(msg);
        } else {
          // Fallback to default behavior
          try {
            window.dispatchEvent(new Event('dashboard-refresh'));
            navigate(`/dashboard?refresh=${Date.now()}`);
          } catch {}
        }
      } else {
        const errorMsg = "فشل الرفع: " + (data.error || arabicStatus(res.status, res.statusText));
        setStatus(errorMsg);
        setStatusType('error');
        if (onError) {
          onError(errorMsg);
        } else {
          toast.error(errorMsg);
        }
      }
    } catch (_err) {
      const errorMsg = "فشل الرفع: " + ("خطأ في الشبكة أو الخادم");
      setStatus(errorMsg);
      setStatusType('error');
      if (onError) {
        onError(errorMsg);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setUploading(false);
    }
  };

  // While uploading: block navigation (back/forward) and page unload, and trap interactions with an overlay
  useEffect(() => {
    if (!uploading) return;
    const beforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);

    // Block SPA back navigation
    const onPopState = (_) => {
      if (uploading) {
        // push back into the current URL
        window.history.pushState(null, '', window.location.href);
      }
    };
    // push a new state to trap the back button
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('popstate', onPopState);
    };
  }, [uploading]);

  return (
    <div className="enroll-upload" aria-busy={uploading}>
      {uploading && createPortal(
        <div
          className="upload-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999, // ensure above Navbar
            backdropFilter: 'blur(1px)'
          }}
          aria-live="polite"
          aria-label="يتم رفع الملف، الرجاء الانتظار"
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Spinner size="large" color="white" />
            <div style={{ color: '#fff', fontWeight: 600 }}>

              <Spinner size="lg" color="primary" />
            
            
            </div>
          </div>
        </div>,
        document.body
      )}
      <div
        className="enroll-upload__drop"
        onDragOver={prevent}
        onDragEnter={prevent}
        onDrop={handleDrop}
      >
        <input id="excel-input" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} hidden disabled={uploading} />
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