// fetch exam table data and photo
import api from './api';

export const fetchExamTable = async (data) => {
const res = await fetch(`${api.baseURL}/exam/create/`, {
    method: 'POST',
    headers: api.getAuthHeaders(true),
    body: data,
  });
  if (!res.ok) throw new Error('فشل في جلب جدول الامتحانات');
  return res.json();
};
export const fetchExamTableList = async () => {
  const res = await fetch(`${api.baseURL}/exam/`, {
    headers: api.getAuthHeaders(),
  });
  if (!res.ok) throw new Error('فشل في جلب جدول الامتحانات');
  return res.json();
};


