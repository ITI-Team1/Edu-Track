import { toast as baseToast } from 'react-toastify';

const common = { theme: 'light', rtl: true };


function extractApiMessage(err, fallback = 'حدث خطأ') {
  // Axios-style error response
  const data = err?.response?.data ?? err?.data;
  if (data) {
    // Common patterns: { detail: '...' } or { error: '...' } or field errors
    if (typeof data === 'string') return data;
    if (typeof data.detail === 'string') return data.detail;
    if (typeof data.error === 'string') return data.error;
    // If data is an object with arrays of messages, pick first
    for (const k of Object.keys(data)) {
      const v = data[k];
      if (Array.isArray(v) && v.length) return String(v[0]);
      if (typeof v === 'string') return v;
    }
  }
  if (typeof err?.message === 'string' && err.message.trim().length) return err.message;
  return fallback;
}

function toArabic(msg) {
  if (!msg) return msg;
  const s = String(msg);
  const l = s.toLowerCase();
  // Quick common patterns
  if (l.includes('already exists')) {
    if (l.includes('slug')) return 'المعرف (Slug) موجود بالفعل';
    return 'القيمة موجودة بالفعل';
  }
  if (l.includes('this field may not be blank') || l.includes('required')) return 'هذا الحقل مطلوب';
  if (l.includes('invalid') || l.includes('not valid')) return 'قيمة غير صالحة';
  if (l.includes('not found')) return 'غير موجود';
  if (l.includes('permission') || l.includes('forbidden')) return 'غير مسموح';
  if (l.includes('unauthorized')) return 'غير مصرح';
  if (l.includes('unique')) return 'القيمة يجب أن تكون فريدة';
  if (l.includes('server error')) return 'خطأ في الخادم';
  return s;
}

export const toast = {
  success: (msg, opts = {}) => baseToast.success(toArabic(msg), { ...common, ...opts }),
  error: (msg, opts = {}) => baseToast.error(toArabic(msg), { ...common, ...opts }),
  info: (msg, opts = {}) => baseToast.info(toArabic(msg), { ...common, ...opts }),
  warn: (msg, opts = {}) => baseToast.warn(toArabic(msg), { ...common, ...opts }),
  apiError: (err, fallback, opts = {}) => baseToast.error(toArabic(extractApiMessage(err, fallback)), { ...common, ...opts }),
};

export default toast;
