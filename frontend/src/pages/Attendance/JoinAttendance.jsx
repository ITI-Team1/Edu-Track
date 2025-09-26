import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLecture } from '../../services/lectureApi';
import { AttendanceAPI } from '../../services/attendanceApi';
import toast from '../../utils/toast';
import './joinAttendance.css';

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

  // Function to handle attendance marking
  const markAttendance = useCallback(async () => {
    if (!lectureId || !token || !user) return;

    try {
      setStatus('جاري تسجيل الحضور...');

      const uid = Number(user?.id || user?.pk || user?.user_id);
      if (!Number.isFinite(uid)) {
        throw new Error('Invalid user ID');
      }

      // Debug: Log lecture data to help diagnose the "غير محدد" issue
      console.log('Lecture data for debugging:', {
        lectureId,
        lecture,
        course: lecture?.course,
        instructor: lecture?.instructor,
        user: { id: uid, name: user?.first_name }
      });

      // Get or create attendance record for this lecture
      let attendanceRecord;
      try {
        const attendances = await AttendanceAPI.getAttendanceByLecture(lectureId);
        
        if (attendances.length === 0) {
          // Create new attendance record
          const newAttendance = await AttendanceAPI.createAttendance({
            lecture: Number(lectureId)
          });
          attendanceRecord = newAttendance.data;
        } else {
          attendanceRecord = attendances[0];
        }
      } catch (attendanceError) {
        console.error('Failed to get/create attendance record:', attendanceError);
        throw new Error('Failed to create attendance session');
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
      console.error('Attendance marking failed:', error);
      setStatus('❌ فشل في تسجيل الحضور');
      toast.error('فشل في تسجيل الحضور. يرجى المحاولة مرة أخرى');
    }
  }, [lectureId, token, user, navigate, queryClient]);

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
    if (!user && !lectureLoading) {
      navigate(`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`, { replace: true });
      return;
    }

    // Set lecture info when available and auto-mark attendance
    if (lecture && user) {
      setLectureInfo(lecture);
      // Auto-mark attendance after lecture info is loaded
      markAttendance();
    }
  }, [lecture, lectureId, token, user, navigate, loc.pathname, loc.search, markAttendance, lectureLoading]);

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
            <svg viewBox="0 0 100 100" className="logo-svg">
              <circle cx="50" cy="50" r="45" fill="#1a365d" />
              <text x="50" y="58" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">PSU</text>
            </svg>
          </div>
          <h1>جامعة بورسعيد</h1>
          <p>نظام تسجيل الحضور</p>
        </div>

        {/* Lecture Info */}
        {lectureInfo && (
          <div className="lecture-info">
            <h3>معلومات المحاضرة</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">المقرر:</span>
                <span className="value">
                  {lectureInfo.course?.title || 
                   lectureInfo.course?.name || 
                   (typeof lectureInfo.course === 'string' ? lectureInfo.course : 'غير محدد')}
                </span>
              </div>
              <div className="info-item">
                <span className="label">المحاضر:</span>
                <span className="value">
                  {lectureInfo.instructor?.first_name || 
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
            <div className="info-grid">
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