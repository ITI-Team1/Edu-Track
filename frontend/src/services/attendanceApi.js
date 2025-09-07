import { apiClient } from './apiClient';

// Helper wrapper (expects apiClient configured with auth headers elsewhere)
// Keeping only the stable methods that exist server-side. Others were removed to avoid 404s.
export const AttendanceAPI = {
  // markPresent and getMe may exist if backend supports them; leave as-is only if present in URLs.
  getMe: (attendanceId) => apiClient.get(`attendance/${attendanceId}/students/me/`),
  markPresent: (studentAttendanceId, payload) => apiClient.patch(`attendance/students/${studentAttendanceId}/update/`, payload)
};
