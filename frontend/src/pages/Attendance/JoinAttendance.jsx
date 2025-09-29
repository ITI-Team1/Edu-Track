import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLecture } from '../../services/lectureApi';
import { AttendanceAPI } from '../../services/attendanceApi';
import toast from '../../utils/toast';
import './joinAttendance.css';
import psuLogo from '../../assets/psu-logo.svg';

// Enhanced student attendance joining with React Query integration
export default function JoinAttendance() {
  const { user } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('جاري المعالجة...');
  const [lectureInfo, setLectureInfo] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);
  const markingRef = useRef(false); // prevent concurrent or repeated marking

  const params = new URLSearchParams(loc.search);
  const lectureId = params.get('lec');
  const token = params.get('j');

  // Fetch lecture information with React Query
  const { data: lecture, isLoading: lectureLoading, error: lectureError } = useQuery({
    queryKey: ['lecture', lectureId],
    queryFn: () => getLecture(lectureId),
    enabled: !!lectureId && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: 1000,
    onError: (error) => {
      console.error('Failed to fetch lecture data:', error);
    }
  });

  // Fetch additional data to resolve course and instructor names
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { fetchCourses } = await import('../../services/courseApi');
      return fetchCourses();
    },
    enabled: !!lecture,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { fetchUsers } = await import('../../services/userApi');
      return fetchUsers();
    },
    enabled: !!lecture,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Enhanced lecture info with resolved course and instructor names
  const enhancedLectureInfo = useMemo(() => {
    if (!lecture) return null;

    let courseName = 'غير محدد';
    let instructorName = 'غير محدد';

    // Resolve course name
    if (lecture.course) {
      if (typeof lecture.course === 'object' && lecture.course.title) {
        courseName = lecture.course.title;
      } else if (typeof lecture.course === 'string') {
        courseName = lecture.course;
      } else if (typeof lecture.course === 'number' && courses) {
        const course = courses.find(c => c.id === lecture.course);
        if (course) courseName = course.title;
      }
    }

    // Resolve instructor name (prefer backend-provided instructor_details)
    if (Array.isArray(lecture.instructor_details) && lecture.instructor_details.length) {
      const names = lecture.instructor_details.map(u => `${u.first_name || ''} ${u.last_name || ''}`.trim()).filter(Boolean);
      if (names.length) instructorName = names.join('، ');
    } else if (lecture.instructor) {
      if (typeof lecture.instructor === 'object' && lecture.instructor.first_name) {
        instructorName = `${lecture.instructor.first_name} ${lecture.instructor.last_name || ''}`.trim();
      } else if (typeof lecture.instructor === 'string') {
        instructorName = lecture.instructor;
      } else if (Array.isArray(lecture.instructor) && users) {
        const instructorNames = lecture.instructor.map(inst => {
          const instructorId = typeof inst === 'object' ? inst.id : inst;
          const user = users.find(u => u.id === instructorId);
          return user ? `${user.first_name} ${user.last_name || ''}`.trim() : instructorId;
        }).filter(name => name && name !== 'غير محدد');
        instructorName = instructorNames.length > 0 ? instructorNames.join('، ') : 'غير محدد';
      } else if (typeof lecture.instructor === 'number' && users) {
        const user = users.find(u => u.id === lecture.instructor);
        if (user) instructorName = `${user.first_name} ${user.last_name || ''}`.trim();
      }
    }

    return {
      ...lecture,
      courseName,
      instructorName
    };
  }, [lecture, courses, users]);

  // Function to handle attendance marking
  const markAttendance = useCallback(async () => {
    if (!lectureId || !token || !user) return;
    if (markingRef.current || attendanceSuccess) return; // guard against multiple calls

    try {
      markingRef.current = true;
      setStatus('جاري تسجيل الحضور...');

      const uid = Number(user?.id || user?.pk || user?.user_id);
      if (!Number.isFinite(uid)) {
        throw new Error('Invalid user ID');
      }

      // Debug: Log basic context (avoid referencing lecture object to keep deps stable)
     

      // Get or create attendance record for this lecture
      let attendanceRecord;
      let sessionsMeta = { lectureId, foundCount: 0 };
      try {
        const attendances = await AttendanceAPI.getAttendanceByLecture(lectureId);
        console.error('Existing attendance sessions for lecture', lectureId, attendances);
        sessionsMeta.foundCount = Array.isArray(attendances) ? attendances.length : 0;

        if (attendances.length === 0) {
          // Determine if current user is allowed to create sessions (instructor/staff)
          const isInstructor = Boolean(
            user?.is_staff ||
            user?.is_superuser ||
            user?.role === 'instructor' ||
            (Array.isArray(user?.groups) && user.groups.some(g => ['دكاترة - معيدين', 'Instructor'].includes(g?.name || g)))
          );

          if (!isInstructor) {
            // Students should not create a session; show clear guidance
            throw new Error('لا توجد جلسة حضور مفتوحة لهذا الدرس. يرجى إبلاغ المحاضر بفتح الجلسة.');
          }

          // Only instructors create new attendance records
          const newAttendance = await AttendanceAPI.createAttendance({
            lecture: Number(lectureId)
          });
          attendanceRecord = newAttendance.data;
        } else {
          attendanceRecord = attendances[0];
        }
      } catch (attendanceError) {
        console.error('Failed to get/create attendance record:', attendanceError);
        // Build a rich error for the outer catch
        const status = attendanceError?.response?.status;
        const statusText = attendanceError?.response?.statusText;
        const method = attendanceError?.config?.method?.toUpperCase();
        const url = attendanceError?.config?.url;
        const backendMsg = attendanceError?.response?.data?.detail || attendanceError?.response?.data?.message || attendanceError?.message;
        const rawData = attendanceError?.response?.data;
        const dataStr = rawData && typeof rawData === 'object' ? JSON.stringify(rawData) : String(rawData || '');
        const userId = Number(user?.id || user?.pk || user?.user_id);
        const isInstructor = Boolean(
          user?.is_staff ||
          user?.is_superuser ||
          user?.role === 'instructor' ||
          (Array.isArray(user?.groups) && user.groups.some(g => ['دكاترة - معيدين', 'Instructor'].includes(g?.name || g)))
        );
        const composed = [
          status ? `[${status}${statusText ? ' ' + statusText : ''}]` : null,
          method && url ? `${method} ${url}` : null,
          backendMsg || 'Failed to create attendance session',
          sessionsMeta ? `sessions=${sessionsMeta.foundCount}` : null,
          `lec=${lectureId}`,
          userId ? `uid=${userId}` : null,
          `role=${isInstructor ? 'instructor' : 'student'}`,
          dataStr && !backendMsg ? `data=${dataStr}` : null,
        ].filter(Boolean).join(' | ');
        // Re-throw with composed message so outer catcher can toast
        throw new Error(composed);
      }

      // Check if student already has an attendance record for this session
      try {
        const existingAttendances = await AttendanceAPI.getStudentAttendancesByAttendance(attendanceRecord.id);
        const existingRecord = existingAttendances.find(att => att.student === uid);
        
        if (existingRecord) {
          // Update existing record to mark as present
          await AttendanceAPI.updateStudentAttendance(existingRecord.id, {
            present: true,
            ip_address: null // Let backend handle IP detection
          });
        } else {
          // Create new student attendance record
          await AttendanceAPI.createStudentAttendance({
            attendance: attendanceRecord.id,
            student: uid,
            present: true
          });
        }
      } catch (studentAttendanceError) {
        console.error('Failed to mark student attendance:', studentAttendanceError);
        throw new Error('Failed to mark attendance');
      }

      setAttendanceSuccess(true);
      setStatus('✅ تم تسجيل حضورك بنجاح!');
      toast.success('تم تسجيل حضورك بنجاح');
      
      // Invalidate relevant queries to refresh data across the app
      queryClient.invalidateQueries(['attendance', lectureId]);
      queryClient.invalidateQueries(['students', lectureId]);
      queryClient.invalidateQueries(['studentAttendances']);
      
      // Start countdown for redirect
      let count = 3;
      setCountdown(count);
      const countdownInterval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(countdownInterval);
          navigate('/dashboard', { replace: true });
        }
      }, 1000);

      return () => clearInterval(countdownInterval);
      
    } catch (error) {
      console.error('Attendance marking failed:', {
        error,
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      // Build a comprehensive message for mobile toasts
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      const method = error.config?.method?.toUpperCase();
      const url = error.config?.url;
      const backendMsg = error.response?.data?.detail || error.response?.data?.message || error.response?.data?.error || error.response?.data?.errors?.[0];
      const rawData = error.response?.data;
      const dataStr = rawData && typeof rawData === 'object' ? JSON.stringify(rawData) : String(rawData || '');

      const msgCore = backendMsg || error.message || 'حدث خطأ غير متوقع';
      const userId = Number(user?.id || user?.pk || user?.user_id);
      const isInstructor = Boolean(
        user?.is_staff ||
        user?.is_superuser ||
        user?.role === 'instructor' ||
        (Array.isArray(user?.groups) && user.groups.some(g => ['دكاترة - معيدين', 'Instructor'].includes(g?.name || g)))
      );
      const pieces = [
        status ? `[${status}${statusText ? ' ' + statusText : ''}]` : null,
        method && url ? `${method} ${url}` : null,
        msgCore,
        `lec=${lectureId}`,
        userId ? `uid=${userId}` : null,
        `role=${isInstructor ? 'instructor' : 'student'}`,
        dataStr && !backendMsg ? `data=${dataStr}` : null,
      ].filter(Boolean);

      setStatus(`❌ ${msgCore}`);
      toast.error(pieces.join(' | '));
    } finally {
      // Keep the guard latched after success to prevent duplicate toasts
      if (!attendanceSuccess) {
        markingRef.current = false;
      }
    }
  }, [lectureId, token, user, navigate, queryClient, attendanceSuccess]);

  useEffect(() => {
    // Validation checks
    if (!lectureId || !token) {
      setStatus('❌ رابط غير صالح');
      return;
    }
    
    // If user is not logged in, redirect to login with return path
    // FIXED: Only redirect if we're sure the user is not authenticated (not just loading)
    // This prevents the race condition where QR scanning triggers login redirect
    // even when the user is already authenticated but the auth check is still loading
    // Avoid redirect if a token exists (AuthContext may still be hydrating)
    const storedToken =
      localStorage.getItem('authToken') ||
      localStorage.getItem('access') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token');
    if (!user && !lectureLoading && !storedToken) {
      navigate(`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`, { replace: true });
      return;
    }

    // Set lecture info when available and auto-mark attendance
    if (lecture && user) {
      setLectureInfo(enhancedLectureInfo || lecture);
      // Auto-mark attendance after lecture info is loaded
      markAttendance();
    }
  }, [lecture, enhancedLectureInfo, lectureId, token, user, navigate, loc.pathname, loc.search, markAttendance, lectureLoading]);

  // Loading state
  if (lectureLoading) {
    return (
      <div className="join-attendance-container">
        <div className="join-attendance-card loading">
          <div className="loading-spinner"></div>
          <h2>جاري تحميل بيانات المحاضرة...</h2>
          <p>يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  return (
    <div className="join-attendance-container">
      <div className="join-attendance-card">
        {/* Header */}
        <div className="attendance-header">
          <div className="university-logo">
            <img src={psuLogo} alt="PSU Logo" className="logo-svg" />
          </div>
          <h1>جامعة بورسعيد</h1>
          <p>نظام تسجيل الحضور</p>
        </div>

        {/* Lecture Info */}
        {lectureInfo && (
          <div className="lecture-info">
            <h3>معلومات المحاضرة</h3>
            <div className="info-grid-attendance">
              <div className="info-item">
                <span className="label">المقرر:</span>
                <span className="value">
                  {lectureInfo.courseName || 
                   lectureInfo.course?.title || 
                   lectureInfo.course?.name || 
                   (typeof lectureInfo.course === 'string' ? lectureInfo.course : 'غير محدد')}
                </span>
              </div>
              <div className="info-item">
                <span className="label">المحاضر:</span>
                <span className="value">
                  {lectureInfo.instructorName ||
                   lectureInfo.instructor?.first_name || 
                   lectureInfo.instructor?.username ||
                   (typeof lectureInfo.instructor === 'string' ? lectureInfo.instructor : 'غير محدد')}
                </span>
              </div>
              <div className="info-item">
                <span className="label">التاريخ:</span>
                <span className="value">{new Date().toLocaleDateString('ar-EG')}</span>
              </div>
            </div>
          </div>
        )}

        {/* FIXED: Error state for lecture data - handles the "غير محدد" issue */}
        {/* This shows when lecture data fails to load, explaining why course/instructor show as "غير محدد" */}
        {lectureError && (
          <div className="lecture-error">
            <h3>معلومات المحاضرة</h3>
            <div className="info-grid-attendance">
              <div className="info-item">
                <span className="label">المقرر:</span>
                <span className="value error">غير محدد</span>
              </div>
              <div className="info-item">
                <span className="label">المحاضر:</span>
                <span className="value error">غير محدد</span>
              </div>
              <div className="info-item">
                <span className="label">التاريخ:</span>
                <span className="value">{new Date().toLocaleDateString('ar-EG')}</span>
              </div>
            </div>
            <p className="error-message">تعذر تحميل معلومات المحاضرة - تحقق من اتصال الإنترنت</p>
          </div>
        )}

        {/* Status Display */}
        <div
          className={`status-display ${attendanceSuccess ? 'success' : 'processing'}`}
          role="status"
          aria-live="polite"
        >
          {attendanceSuccess && (
            <div className="attended-toast" role="alert" aria-label="تم تأكيد الحضور">
              <span className="toast-icon" aria-hidden>✔</span>
              <span className="toast-text">تم تأكيد حضورك لهذه المحاضرة</span>
            </div>
          )}
          {attendanceSuccess ? (
            <div className="success-animation">
              <div className="checkmark">✓</div>
            </div>
          ) : (
            <div className="processing-animation">
              <div className="spinner"></div>
            </div>
          )}
          
          <h2 className="status-text">{status}</h2>
          
          {attendanceSuccess && (
            <div className="redirect-info">
              <p>سيتم توجيهك إلى لوحة التحكم خلال</p>
              <div className="countdown-display">
                <span className="countdown-number">{countdown}</span>
                <span>ثانية</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          {attendanceSuccess ? (
            <>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/dashboard')}
              >
                الانتقال إلى لوحة التحكم
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => window.close()}
              >
                إغلاق النافذة
              </button>
            </>
          ) : (
            <button 
              className="btn btn-outline"
              onClick={() => navigate('/dashboard')}
            >
              العودة إلى لوحة التحكم
            </button>
          )}
        </div>

        {/* Student Info */}
        {user && (
          <div className="student-info">
            <p>الطالب: {user.first_name} {user.last_name}</p>
            <p>الرقم الجامعي: {user.id}</p>
          </div>
        )}
      </div>
    </div>
  );
}