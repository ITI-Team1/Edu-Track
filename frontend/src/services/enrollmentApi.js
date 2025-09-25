import api from './api';

// Version 9.0 - Clean version

// Helper function to check if a user is a student (by group ID)
const isStudent = (user) => {
  if (!user) return false;
  
  // debug log removed
  
  // Check if user has staff/admin privileges (exclude them even if in students group)
  const isStaffOrAdmin = user.is_staff || user.is_superuser || user.is_admin;
  if (isStaffOrAdmin) {
    return false;
  }
  
  // Check groups for 'طلاب' group ID (2)
  const groups = user.groups;
  if (Array.isArray(groups)) {
    const isInStudentsGroup = groups.some(group => {
      if (!group) return false;
      // Handle both formats: [2] and [{"id": 2, "name": "طلاب"}]
      const groupId = typeof group === 'object' ? group.id : group;
      const isStudentGroup = groupId === 2; // Group ID 2 = 'طلاب'
      return isStudentGroup;
    });
    return isInStudentsGroup;
  }
  
  return false;
};

// Fetch students - using regular user token (user will be staff)
export const fetchStudents = async (user, filters = {}) => {
  
  // Build query parameters - only basic filters
  const params = new URLSearchParams();
  
  // Always filter out staff and superusers at API level
  params.append('is_staff', 'false');
  params.append('is_superuser', 'false');
  params.append('is_active', 'true');
  
  // Apply additional filters
  if (filters.name) {
    params.append('search', filters.name); // Djoser uses 'search' parameter
  }
  if (filters.level) {
    params.append('level', filters.level);
  }
  
  const url = `${api.baseURL}/auth/users/?${params.toString()}`;
  
  const res = await fetch(url, { headers: api.getAuthHeaders() });
  
  if (!res.ok) {
    throw new Error('فشل تحميل الطلاب');
  }
  
  const data = await res.json();
  
  // Handle both array and object response formats
  const allUsers = Array.isArray(data) ? data : (data.results || []);
  
  // Debug: log first few users and their groups
  // removed debug sampling logs
  
  // Client-side filtering to ensure only students are returned
  const studentsOnly = allUsers.filter(user => isStudent(user));
  
  // removed summary logs
  
  // Return in consistent format
  return { results: studentsOnly };
};

// Enroll students in courses
export const enrollStudents = async (studentIds, courseIds) => {
  const courseids = courseIds.map((id) => Number(id));
  
  const results = await Promise.allSettled(
    studentIds.map(async (sid) => {
      const res = await fetch(`${api.baseURL}/lecture/enroll/`, {
        method: 'POST',
        headers: api.getAuthHeaders(),
        body: JSON.stringify({ studentid: Number(sid), courseids }),
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.detail || err?.message || 'فشل التسجيل';
        throw new Error(msg);
      }
      
      return res.json();
    })
  );
  
  return results;
};

// Upload Excel file for user import
export const uploadExcelFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  
  const token = localStorage.getItem('access_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  
  const res = await fetch(`${api.baseURL}/upload-excel/`, {
    method: "POST",
    headers,
    body: formData,
  });
  
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    throw new Error(data.error || 'فشل الرفع');
  }
  
  return data;
};
