import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import QRCode from 'qrcode';
import logoRaw from '../../assets/psu-logo.svg?raw';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLecture, fetchLectures } from '../../services/lectureApi';
import { fetchCourses } from '../../services/courseApi';
import { fetchUsers } from '../../services/userApi';
import { AttendanceAPI } from '../../services/attendanceApi';
import Modal from '../../components/ui/Modal';
import './attendance.css';
import toast from '../../utils/toast';
import { useAuth } from '../../context/AuthContext';

// Instructor view (QR + students). Frontend-only QR rotation; no DB storage.
// Treat route param as lectureId. Optional prop to override.
const AttendancePage = ({ attendanceId: propAttendanceId }) => {
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const lectureId = propAttendanceId || params.attendanceId;
    const queryClient = useQueryClient();
    const [qrToken, setQrToken] = useState(null);
    const [qrSvg, setQrSvg] = useState('');
    const [joinLink, setJoinLink] = useState(null);
    const [students, setStudents] = useState([]);
    const [secondsLeft, setSecondsLeft] = useState(30); // Extended to 20 seconds
    const [headingText, setHeadingText] = useState('');
    const [attendanceGrade, setAttendanceGrade] = useState(0);
    const [showAttendanceGradeModal, setShowAttendanceGradeModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    // If navigated from AttendanceRecords, modify layout: hide QR and use full-width students pane
    const fromAttendanceRecords = Boolean(location?.state?.fromAttendanceRecords);

    // React Query for students data with automatic refresh
    const { data: studentsData, refetch: refetchStudents, isLoading: _studentsLoading } = useQuery({
        queryKey: ['students', lectureId],
        queryFn: () => fetchStudentsData(),
        enabled: !!lectureId,
        refetchInterval: 1000, // Auto refresh every 1 second for faster responsiveness
        refetchIntervalInBackground: true,
        staleTime: 200, // Consider data stale after 0.2 seconds
        retry: 3,
        retryDelay: 1000, // Wait 1 second between retries
        onError: (error) => {
            console.error('Failed to fetch students data:', error);
        }
    });

    // React Query for lecture data
    const { data: _lectureData } = useQuery({
        queryKey: ['lecture', lectureId],
        queryFn: () => getLecture(lectureId),
        enabled: !!lectureId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2
    });

    // Function to fetch students data with attendance status from backend
    const fetchStudentsData = useCallback(async () => {
        if (!lectureId) return [];
        
        try {
            // Get lecture data to extract students
            let lec = await getLecture(lectureId);
            const pickStudents = (lecture) => {
                const cands = [
                    Array.isArray(lecture?.students) ? lecture.students : null,
                    Array.isArray(lecture?.students?.results) ? lecture.students.results : null,
                    Array.isArray(lecture?.students?.items) ? lecture.students.items : null,
                    Array.isArray(lecture?.students_list) ? lecture.students_list : null,
                    Array.isArray(lecture?.studentsIds) ? lecture.studentsIds : null,
                    Array.isArray(lecture?.students_ids) ? lecture.students_ids : null,
                    Array.isArray(lecture?.enrolled_students) ? lecture.enrolled_students : null,
                    Array.isArray(lecture?.enrolled_students_ids) ? lecture.enrolled_students_ids : null,
                ];
                return cands.find((arr) => Array.isArray(arr)) || [];
            };
            
            let raw = pickStudents(lec);
            if (!raw.length) {
                // retry up to 2 times with a small delay
                for (let i = 0; i < 2 && raw.length === 0; i++) {
                    await new Promise((r) => setTimeout(r, 300));
                    lec = await getLecture(lectureId);
                    raw = pickStudents(lec);
                }
            }
            if (!raw.length) {
                // Final fallback: fetch list and read the same lecture by id
                try {
                    const list = await fetchLectures();
                    const target = (Array.isArray(list) ? list : []).find((l) => Number(l.id) === Number(lectureId));
                    if (target) {
                        raw = pickStudents(target);
                    }
                } catch {}
            }
            
            // Preload course title to display as heading (fallback to lecture id)
            try {
                const courses = await fetchCourses();
                const courseId = (typeof lec?.course === 'object' && lec?.course !== null) ? lec.course.id : lec?.course;
                const courseTitle = courses.find((c) => Number(c.id) === Number(courseId))?.title;
                setHeadingText(courseTitle ? `المحاضرة: ${courseTitle}` : `المحاضرة رقم ${lectureId}`);
            } catch (courseError) {
                console.warn('Failed to fetch course data:', courseError);
                setHeadingText(`المحاضرة رقم ${lectureId}`);
            }
            
            // Fetch users to resolve first/last names when students are IDs
            let usersMap = {};
            try {
                const users = await fetchUsers();
                usersMap = Object.fromEntries(users.map((u) => [Number(u.id), u]));
            } catch {
                // ignore, will fallback
            }
            
            // Get attendance records from backend instead of localStorage
            let attendancePresenceMap = new Set();
            try {
                // Get attendance record for this lecture
                const attendanceRecords = await AttendanceAPI.getAttendanceByLecture(lectureId);
                if (attendanceRecords.length > 0) {
                    // Get student attendance records for the latest attendance session
                    const latestAttendance = attendanceRecords[attendanceRecords.length - 1]; // Get most recent
                    const studentAttendances = await AttendanceAPI.getStudentAttendancesByAttendance(latestAttendance.id);
                    
                    // Build set of present students from backend data
                    attendancePresenceMap = new Set(
                        studentAttendances
                            .filter(att => att.present === true)
                            .map(att => Number(att.student))
                    );
                }
            } catch (attendanceError) {
                console.warn('Failed to fetch attendance from backend:', attendanceError);
                // Fallback to empty set if backend fails
                attendancePresenceMap = new Set();
            }
            
            const mapped = raw.map((s) => {
                // Extract a student id from multiple possible shapes
                let sid = null;
                if (typeof s === 'object' && s !== null) {
                    // common direct id
                    sid = s.id ?? s.student_id ?? s.user_id ?? s.pk ?? null;
                    // nested under student or user
                    if (sid == null) sid = s.student?.id ?? s.user?.id ?? s.student?.pk ?? s.user?.pk ?? null;
                    if (sid == null) sid = (typeof s.student === 'number' ? s.student : null) ?? (typeof s.user === 'number' ? s.user : null);
                } else {
                    sid = Number(s);
                }
                sid = Number(sid);
                // Try to build a display object using users map or nested object
                const fromUsers = Number.isFinite(sid) ? usersMap[sid] : undefined;
                const cand = fromUsers || (typeof s === 'object' ? (s.student || s.user || s) : {});
                const first = cand?.first_name || cand?.firstname || '';
                const last = cand?.last_name || cand?.lastname || '';
                const uname = first && last
                    ? `${first} ${last}`
                    : (first || cand?.username || cand?.englishfullname || cand?.name || (Number.isFinite(sid) ? `مستخدم ${sid}` : 'مستخدم'));
                
                return {
                    id: sid,
                    student_id: sid,
                    username: uname,
                    present: Number.isFinite(sid) ? attendancePresenceMap.has(sid) : false, // Use backend data
                };
            });
            
            return mapped;
        } catch (error) {
            console.error('Failed to fetch students data:', error);
            return [];
        }
    }, [lectureId]);

    // Update students when data changes
    useEffect(() => {
        if (studentsData) {
            setStudents(studentsData);
        }
    }, [studentsData]);

    // If a logged-in user is enrolled in this lecture, auto-navigate to JoinAttendance to mark attendance
    useEffect(() => {
        try {
            if (!user || !lectureId || !Array.isArray(studentsData)) return;
            const uid = Number(user?.id || user?.pk || user?.user_id);
            if (!Number.isFinite(uid)) return;
            const isEnrolled = studentsData.some((s) => Number(s.student_id) === uid);
            if (!isEnrolled) return;
            // Use the rotating token if available, otherwise a fallback token
            const token = (typeof qrToken === 'string' && qrToken.length) ? qrToken : Math.random().toString(36).slice(2);
            navigate(`/attendance/join?lec=${encodeURIComponent(lectureId)}&j=${encodeURIComponent(token)}`, { replace: false });
        } catch {}
        // Only re-check when these change
    }, [user, studentsData, lectureId, qrToken, navigate]);

    // Frontend-only QR rotation: random token + deep link to /attendance/join
    const generateQR = useCallback(async () => {
        if (!lectureId) return;
        const rand = crypto?.getRandomValues
            ? Array.from(crypto.getRandomValues(new Uint8Array(12)))
                    .map((b) => b.toString(16).padStart(2, '0'))
                    .join('')
            : Math.random().toString(36).slice(2);
        setQrToken(rand);
        // Always use the production URL for QR codes, fallback to current origin if not set
        const base = (import.meta.env.VITE_PUBLIC_BASE_URL || 'https://psu-platform.vercel.app').replace(/\/$/, '');
        setJoinLink(`${base}/attendance/join?lec=${encodeURIComponent(lectureId)}&j=${rand}`);
    }, [lectureId]);

    const toggleStudent = useCallback(
        async (studentId) => {
            if (!lectureId || !studentId) return;
            
            try {
                // Get or create attendance record for this lecture
                const attendanceRecords = await AttendanceAPI.getAttendanceByLecture(lectureId);
                let attendanceRecord;
                
                if (attendanceRecords.length === 0) {
                    // Create new attendance record
                    const newAttendance = await AttendanceAPI.createAttendance({
                        lecture: Number(lectureId)
                    });
                    attendanceRecord = newAttendance.data;
                } else {
                    attendanceRecord = attendanceRecords[attendanceRecords.length - 1]; // Get most recent
                }
                
                // Check if student already has an attendance record
                const studentAttendances = await AttendanceAPI.getStudentAttendancesByAttendance(attendanceRecord.id);
                const existingRecord = studentAttendances.find(att => att.student === Number(studentId));
                
                if (existingRecord) {
                    // Toggle existing record
                    await AttendanceAPI.updateStudentAttendance(existingRecord.id, {
                        present: !existingRecord.present
                    });
                } else {
                    // Create new record as present (since they're clicking to mark present)
                    await AttendanceAPI.createStudentAttendance({
                        attendance: attendanceRecord.id,
                        student: Number(studentId),
                        present: true
                    });
                }
                
                // FIXED: Invalidate and refetch queries to refresh data immediately
                // This ensures the instructor dashboard auto-updates when student attendance changes
                queryClient.invalidateQueries(['students', lectureId]);
                queryClient.invalidateQueries(['attendance', lectureId]);
                queryClient.invalidateQueries(['studentAttendances']);
                
                // Force immediate refetch for better real-time updates
                refetchStudents();
                
            } catch (error) {
                console.error('Failed to toggle student attendance:', error);
                toast.error('فشل في تعديل حضور الطالب');
            }
        },
        [lectureId, queryClient, refetchStudents]
    );

    // Removed markAllAbsent functionality per request to simplify UI and improve responsiveness

    // Rotation timer (one interval every second; when counter hits 0 rotate & reset)
    const rotateNow = useCallback(async () => {
        await generateQR();
        setSecondsLeft(30); // Extended to 20 seconds
    }, [generateQR]);

    useEffect(() => {
        if (!lectureId) return;
        rotateNow();
        const intv = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    // Trigger rotation
                    rotateNow();
                    return 30; // Extended to 20 seconds
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(intv);
    }, [lectureId, rotateNow]);

    useEffect(() => {
        if (qrToken) {
            const payload = joinLink || JSON.stringify({ token: qrToken, lectureId });
            QRCode.toString(payload, { type: 'svg', width: 260 }, (err, str) => {
                if (!err) setQrSvg(str);
            });
        }
    }, [qrToken, lectureId, joinLink]);

    // Handle setting attendance grade for the lecture
    const handleSetAttendanceGrade = async () => {
        if (!attendanceGrade || attendanceGrade <= 0) {
            toast.error('يرجى إدخال درجة صحيحة للحضور');
            return;
        }

        setLoading(true);
        try {
            // First, create an Attendance record for this lecture if it doesn't exist
            const attendances = await AttendanceAPI.getAttendanceByLecture(lectureId);
            let attendanceId;
            
            if (attendances.length === 0) {
                // Create new attendance record
                const newAttendance = await AttendanceAPI.createAttendance({
                    lecture: Number(lectureId)
                });
                attendanceId = newAttendance.data.id;
            } else {
                attendanceId = attendances[0].id;
            }
            
            // Get present students from backend database
            const studentAttendances = await AttendanceAPI.getStudentAttendancesByAttendance(attendanceId);
            const presentStudents = students.filter(student => {
                const attendanceRecord = studentAttendances.find(att => att.student === student.id);
                return attendanceRecord && attendanceRecord.present === true;
            });
            
            // Update StudentAttendance records for present students (they are auto-created by signal)
            const updatePromises = presentStudents.map(async (student) => {
                try {
                    // Find the existing record created by the signal
                    const existingAttendances = await AttendanceAPI.getStudentAttendancesByAttendance(attendanceId);
                    const existingRecord = existingAttendances.find(att => 
                        att.student === student.id
                    );
                    
                    if (existingRecord) {
                        // Update the existing record to mark as present
                        await AttendanceAPI.updateStudentAttendance(existingRecord.id, {
                            present: true
                        });
                    } else {
                        // If for some reason the record doesn't exist, create it
                        await AttendanceAPI.createStudentAttendance({
                            attendance: attendanceId,
                            student: student.id,
                            present: true
                        });
                    }
                } catch (error) {
                    console.error(`Failed to update attendance for student ${student.id}:`, error);
                }
            });
            
            await Promise.all(updatePromises);
            
            // Create StudentMark records for present students with attendance grade
            const markPromises = presentStudents.map(async (student) => {
                try {
                    await AttendanceAPI.createStudentMark({
                        student: student.id,
                        lecture: Number(lectureId),
                        attendance_mark: Number(attendanceGrade) // Set the attendance grade manually
                    });
                } catch (error) {
                    // If record already exists, update it
                    if (error.response?.status === 400) {
                        // Try to find and update existing record
                        const existingMarks = await AttendanceAPI.getStudentMarksByLecture(lectureId);
                        const existingRecord = existingMarks.find(mark => 
                            mark.student === student.id && mark.lecture === Number(lectureId)
                        );
                        if (existingRecord) {
                            await AttendanceAPI.updateStudentMark(existingRecord.id, {
                                attendance_mark: Number(attendanceGrade) // Set the attendance grade manually
                            });
                        }
                    }
                }
            });
            
            await Promise.all(markPromises);
            
            // Recalculate attendance marks to ensure they're properly calculated
            await AttendanceAPI.recalculateAttendanceMarks(lectureId);
            
            setShowAttendanceGradeModal(false);
            setAttendanceGrade(0);
            toast.success(`تم تعيين درجة الحضور ${attendanceGrade} للطلاب الحاضرين`);
        } catch (error) {
            console.error('Failed to set attendance grade:', error);
            toast.error('فشل في تعيين درجة الحضور');
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh when tab becomes visible again (e.g., after student interaction in another tab)
    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                queryClient.invalidateQueries(['students', lectureId]);
                queryClient.invalidateQueries(['attendance', lectureId]);
                refetchStudents();
            }
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [lectureId, queryClient, refetchStudents]);
  
  return (
    <>
      {fromAttendanceRecords ? (
        <div className="flex min-h-screen flex-col md:flex-row">
          <aside className="flex flex-col w-full h-auto relative top-0 left-0 border-b border-[rgba(100,108,255,0.2)] bg-[linear-gradient(180deg,#1e1e2e_0%,#282c4e_50%,#2d3748_100%)] overflow-visible z-[100] shadow-[4px_0_20px_rgba(0,0,0,0.1)] md:fixed md:h-screen md:w-[240px] md:border-b-0 md:border-r lg:w-[280px]">
            <nav className="flex flex-row !w-full !order-2 !gap-[0.4rem] !p-[0.4rem] !overflow-x-auto !overflow-y-visible !min-h-0 [scrollbar-width:thin] [scrollbar-color:rgba(100,108,255,0.3)_transparent] sm:!gap-[0.5rem] sm:!p-[0.5rem] md:flex-col md:overflow-y-auto md:overflow-x-hidden md:!gap-[0.75rem] md:!p-3 md:!mt-14 md:!order-none md:[scrollbar-width:none]">
              <h3 className='hidden md:block !m-4 text-xl font-bold text-white'>لوحة التحكم</h3>
              <button className="sidebar-tabs sidebar-active">
                <span className="text-center text-lg md:text-2xl min-w-7">✅</span>
                <span className="text-sm md:text-lg font-medium">تقرير الغياب</span>
              </button>
            </nav>
            <div className="!p-6 hidden md:block border-gray-500 border-t-2">
              <button onClick={() => window.history.back()} className="btn-main !w-full !p-[0.75rem_1rem] text-center !block">رجوع</button>
            </div>
          </aside>

          <main className="dashboard-main">
            <div className="dashboard-content">
              <div className='attendance-page'>
                <div className='attendance-header'>
                  <h2 className='attendance-title'>{headingText || `المحاضرة رقم ${lectureId}`}</h2>
                  <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <div className='safety-alert'>تنبيه: يُمنع مشاركة هذه الشاشة أو رمز الاستجابة السريعة خارج قاعة المحاضرة. هذا الرمز مُخصص فقط للحضور الفعلي داخل القاعة.</div>
                  </div>
                </div>
                <div className='attendance-wrapper' style={{ display: 'block' }}>
                  <div className='students-section' style={{ width: '100%' }}>
                    <h3 style={{ color: '#2c3649' }}>الطلاب</h3>
                    <div className='students-toolbar'>
                      <div>
                        <span style={{ color: '#2c3649', fontSize: '14px' }}>({students.length})طالب</span>
                        <div style={{ color: '#2c3649', fontSize: '14px' }}>عدد الطلاب الحاضرين: {students.filter(s => s.present).length}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input onChange={(e) => setSearch(e.target.value)} type="text" placeholder='ابحث عن طالب' style={{ width: '100%', padding: '8px 12px', border: '1px solid #2c3649', borderRadius: '5px' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className='btn btn-secondary-attendance' onClick={() => setShowAttendanceGradeModal(true)} disabled={loading} style={{ fontSize: '14px', padding: '8px 12px' }}>تعيين درجة الحضور</button>
                        <button className='btn btn-secondary-attendance' onClick={async () => {
                          const container = document.createElement('div');
                          container.style.direction = 'rtl';
                          container.style.fontFamily = "'Tahoma','Segoe UI',sans-serif";
                          container.style.padding = '16px';
                          container.style.width = '1000px';
                          container.innerHTML = `...`;
                          document.body.appendChild(container);
                          try {
                            const canvas = await html2canvas(container, { scale: 2, useCORS: true });
                            const imgData = canvas.toDataURL('image/png');
                            const pdf = new jsPDF('p', 'pt', 'a4');
                            const pageWidth = pdf.internal.pageSize.getWidth();
                            const pageHeight = pdf.internal.pageSize.getHeight();
                            const imgWidth = pageWidth - 40;
                            const ratio = canvas.height / canvas.width;
                            const imgHeight = imgWidth * ratio;
                            pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, Math.min(imgHeight, pageHeight - 40));
                            pdf.save(`attendance_${lectureId}.pdf`);
                          } finally {
                            document.body.removeChild(container);
                          }
                        }}>تنزيل PDF</button>
                      </div>
                    </div>
                    <div className='students-table-scroll !h-[448px] !overflow-y-auto'>
                      <table>
                        <thead>
                          <tr>
                            <th>الكود</th>
                            <th>الاسم</th>
                            <th>الحالة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.filter(s => s.username.toLowerCase().includes(search.toLowerCase())).map((s) => (
                            <tr key={s.id}>
                              <td>{s.student_id}</td>
                              <td>{s.username}</td>
                              <td className={`status ${s.present ? 'present' : 'absent'}`} onClick={() => toggleStudent(s.student_id)} title="تبديل الحالة (محلي فقط)">{s.present ? 'حضور' : 'غياب'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      ) : (
        <div className='attendance-page'>
          <div className='attendance-header'>
            <h2 className='attendance-title'>{headingText || `المحاضرة رقم ${lectureId}`}</h2>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <div className='safety-alert'>تنبيه: يُمنع مشاركة هذه الشاشة أو رمز الاستجابة السريعة خارج قاعة المحاضرة. هذا الرمز مُخصص فقط للحضور الفعلي داخل القاعة.</div>
            </div>
          </div>
          <div className='attendance-wrapper'>
            <div className='students-section'>
              <h3 style={{ color: '#2c3649' }}>الطلاب</h3>
              <div className='students-toolbar'>
                <div>
                  <span style={{ color: '#2c3649', fontSize: '14px' }}>({students.length})طالب</span>
                  <div style={{ color: '#2c3649', fontSize: '14px' }}>عدد الطلاب الحاضرين: {students.filter(s => s.present).length}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input onChange={(e) => setSearch(e.target.value)} type="text" placeholder='ابحث عن طالب' style={{ width: '100%', padding: '8px 12px', border: '1px solid #2c3649', borderRadius: '5px' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className='btn btn-secondary-attendance' onClick={() => setShowAttendanceGradeModal(true)} disabled={loading} style={{ fontSize: '14px', padding: '8px 12px' }}>تعيين درجة الحضور</button>
                  <button className='btn btn-secondary-attendance'>تنزيل PDF</button>
                </div>
              </div>
              <div className='students-table-scroll !h-[448px] !overflow-y-auto'>
                <table>
                  <thead>
                    <tr><th>الكود</th><th>الاسم</th><th>الحالة</th></tr>
                  </thead>
                  <tbody>
                    {students.filter(s => s.username.toLowerCase().includes(search.toLowerCase())).map((s) => (
                      <tr key={s.id}>
                        <td>{s.student_id}</td>
                        <td>{s.username}</td>
                        <td className={`status ${s.present ? 'present' : 'absent'}`} onClick={() => toggleStudent(s.student_id)} title="تبديل الحالة (محلي فقط)">{s.present ? 'حضور' : 'غياب'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className='qr-section'>
              <div className='qr-inline-bar'>
                <h3 className='qr-inline-heading'><span className='attendance-countdown-large'>يتجدد خلال {secondsLeft} ث</span></h3>
                <button className='btn btn-secondary-attendance' onClick={rotateNow}>تحديث فوري</button>
              </div>
              {!lectureId && <p>لم يتم تحديد محاضرة.</p>}
              {lectureId && (qrSvg ? <div className='qr-box' dangerouslySetInnerHTML={{ __html: qrSvg }} /> : <p>جاري التحميل...</p>)}
            </div>
          </div>
        </div>
      )}

      {showAttendanceGradeModal && (
        <Modal isOpen={showAttendanceGradeModal} onClose={() => setShowAttendanceGradeModal(false)} title='تعيين درجة الحضور'>
          <div className='flex flex-col gap-2 !h-fit !w-fit'>
            <div className='flex flex-col gap-5 !mb-5'>
              <p className='text-lg'>المحاضرة: {headingText || `المحاضرة رقم ${lectureId}`}</p>
              <p className='text-sm text-gray-600'>سيتم تعيين هذه الدرجة للطلاب الحاضرين فقط</p>
            </div>
            <div className='flex gap-2 text-xl items-center'>
              <p className='!w-40'>درجة الحضور:</p>
              <input type='number' className='h-10 w-32 !p-2 border border-gray-300 rounded' value={attendanceGrade} onChange={(e) => setAttendanceGrade(parseFloat(e.target.value) || 0)} step="0.1" min="0" max="100" placeholder="0.0" />
            </div>
            <button className='btn btn-secondary-attendance !w-full' onClick={handleSetAttendanceGrade} disabled={loading}>
              {loading ? 'جاري التطبيق...' : 'تطبيق الدرجة'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default AttendancePage;

AttendancePage.propTypes = {
    attendanceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
