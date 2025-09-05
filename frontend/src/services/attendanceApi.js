import { apiClient } from './apiClient';

// Helper wrapper (expects apiClient configured with auth headers elsewhere)
export const AttendanceAPI = {
  rotateQR: (attendanceId) => apiClient.post(`attendance/${attendanceId}/qr/rotate/`),
  listStudents: (attendanceId) => apiClient.get(`attendance/${attendanceId}/students/list/`),
  getMe: (attendanceId) => apiClient.get(`attendance/${attendanceId}/students/me/`),
  markPresent: (studentAttendanceId, payload) => apiClient.patch(`attendance/students/${studentAttendanceId}/update/`, payload),
  getOrCreateActiveByLecture: (lectureId) => apiClient.get(`attendance/lecture/${lectureId}/active/`)
  ,joinViaLink: (att, j) => apiClient.post('attendance/join/', { att, j })
  ,override: (attendanceId, studentId, present) => apiClient.post(`attendance/${attendanceId}/override/${studentId}/`, { present })
};
