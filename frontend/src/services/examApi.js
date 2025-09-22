// fetch exam table data and photo
import api from './api';

// Create exam table
export const createExamTable = async (data) => {
  const res = await fetch(`${api.baseURL}/exam/create/`, {
    method: 'POST',
    headers: api.getAuthHeaders(true),
    body: data,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'فشل في إنشاء جدول الامتحانات');
  }
  return res.json();
};

// Get all exam tables
export const fetchExamTableList = async () => {
  const res = await fetch(`${api.baseURL}/exam/`, {
    headers: api.getAuthHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'فشل في جلب جدول الامتحانات');
  }
  return res.json();
};

// Get single exam table
export const fetchExamTable = async (id) => {
  const res = await fetch(`${api.baseURL}/exam/${id}/`, {
    headers: api.getAuthHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'فشل في جلب جدول الامتحانات');
  }
  return res.json();
};

// Update exam table
export const updateExamTable = async (id, data) => {
  const res = await fetch(`${api.baseURL}/exam/${id}/update/`, {
    method: 'PUT',
    headers: api.getAuthHeaders(true),
    body: data,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'فشل في تحديث جدول الامتحانات');
  }
  return res.json();
};

// Delete exam table
export const deleteExamTable = async (id) => {
  const res = await fetch(`${api.baseURL}/exam/${id}/delete/`, {
    method: 'DELETE',
    headers: api.getAuthHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'فشل في حذف جدول الامتحانات');
  }
  return true;
};
