import { apiClient } from './apiClient';

// Enhanced Attendance API service with full CRUD operations for attendance and marks
export const AttendanceAPI = {
  // Attendance operations
  listAttendances: () => apiClient.get('attendance/'),
  createAttendance: (data) => apiClient.post('attendance/create/', data),
  getAttendance: (id) => apiClient.get(`attendance/${id}/`),
  
  // Student Attendance operations
  listStudentAttendances: () => apiClient.get('attendance/students/'),
  createStudentAttendance: (data) => apiClient.post('attendance/students/create/', data),
  getStudentAttendance: (id) => apiClient.get(`attendance/students/${id}/`),
  updateStudentAttendance: (id, data) => apiClient.patch(`attendance/students/${id}/update/`, data),
  
  // Student Marks operations
  listStudentMarks: () => apiClient.get('attendance/marks/'),
  createStudentMark: (data) => apiClient.post('attendance/marks/create/', data),
  getStudentMark: (id) => apiClient.get(`attendance/marks/${id}/`),
  updateStudentMark: (id, data) => apiClient.patch(`attendance/marks/${id}/update/`, data),
  recalculateAttendanceMarks: (lectureId) => apiClient.post('attendance/marks/recalculate/', { lecture_id: lectureId }),
  
  // Helper methods for specific use cases
  getStudentMarksByLecture: (lectureId) => 
    apiClient.get('attendance/marks/').then(response => 
      response.data.filter(mark => mark.lecture === lectureId)
    ),
  
  getStudentMarksByStudent: (studentId) => 
    apiClient.get('attendance/marks/').then(response => 
      response.data.filter(mark => mark.student === studentId)
    ),
  
  getAttendanceByLecture: (lectureId) =>
    apiClient.get('attendance/').then(response =>
      response.data.filter(attendance => attendance.lecture === Number(lectureId))
    ),

  getStudentAttendancesByAttendance: (attendanceId) =>
    apiClient.get('attendance/students/').then(response =>
      response.data.filter(attendance => attendance.attendance === attendanceId)
    ),

  // Legacy methods (keeping for backward compatibility)
  getMe: (attendanceId) => apiClient.get(`attendance/${attendanceId}/students/me/`),
  markPresent: (studentAttendanceId, payload) => apiClient.patch(`attendance/students/${studentAttendanceId}/update/`, payload)
};
