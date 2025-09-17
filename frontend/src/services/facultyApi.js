import api from './api';

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
      msg = data?.detail || Object.values(data).flat().join(' \n ') || msg;
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
      msg = data?.detail || Object.values(data).flat().join(' \n ') || msg;
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
      msg = data?.detail || Object.values(data).flat().join(' \n ') || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  return true;
};
