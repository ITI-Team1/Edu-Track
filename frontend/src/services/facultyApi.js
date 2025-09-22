import api from './api';

// Helper to translate common backend/Django messages to Arabic
const translate = (msg) => api.translateError(String(msg || ''));

// Extract readable error message from a JSON error object
const extractErrorMessage = (data, fallback) => {
  if (!data || typeof data !== 'object') return fallback;
  if (data.detail) return translate(data.detail);
  // Collect field errors into lines
  const parts = [];
  for (const [key, val] of Object.entries(data)) {
    if (key === 'detail' || key === 'non_field_errors') continue;
    if (Array.isArray(val)) {
      const line = val.map((v) => translate(v)).join('، ');
      parts.push(line);
    } else if (typeof val === 'string') {
      parts.push(translate(val));
    }
  }
  if (data.non_field_errors) {
    const nfe = Array.isArray(data.non_field_errors) ? data.non_field_errors : [data.non_field_errors];
    parts.push(nfe.map((v) => translate(v)).join('، '));
  }
  const message = parts.filter(Boolean).join(' \n ');
  return message || fallback;
};

export const fetchFaculties = async (facultySlug) => {
  const url = facultySlug ? `${api.baseURL}/faculty/${facultySlug}` : `${api.baseURL}/faculty/`;
  const res = await fetch(url, {
    headers: api.getAuthHeaders(),
  });
  if (!res.ok) throw new Error('فشل في جلب الكليات');
  return res.json();
};

export const createFaculty = async (formData) => {
  const headers = { ...api.getAuthHeaders() };
  delete headers['Content-Type']; 

  const res = await fetch(`${api.baseURL}/faculty/create/`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    let msg = 'فشل في إنشاء الكلية';
    try {
      const data = await res.json();
      msg = extractErrorMessage(data, msg);
    } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
};

export const updateFaculty = async ({ slug, formData }) => {
  const headers = { ...api.getAuthHeaders() };
  delete headers['Content-Type'];
  const res = await fetch(`${api.baseURL}/faculty/${slug}/update/`, {
    method: 'PATCH',
    headers,
    body: formData,
  });
  if (!res.ok) {
    let msg = 'فشل في تحديث الكلية';
    try {
      const data = await res.json();
      msg = extractErrorMessage(data, msg);
    } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
};

export const deleteFaculty = async (slug) => {
  const res = await fetch(`${api.baseURL}/faculty/${slug}/delete/`, {
    method: 'DELETE',
    headers: api.getAuthHeaders(),
  });
  if (!res.ok) {
    let msg = 'فشل في حذف الكلية';
    try {
      const data = await res.json();
      msg = extractErrorMessage(data, msg);
    } catch (_) {}
    throw new Error(msg);
  }
  return true;
};
