import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import logoRaw from '../../assets/psu-logo.svg?raw';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getLecture, fetchLectures } from '../../services/lectureApi';
import { fetchCourses } from '../../services/courseApi';
import { fetchUsers } from '../../services/userApi';
import { AttendanceAPI } from '../../services/attendanceApi';
import Modal from '../../components/ui/Modal';
import './attendance.css';

// Instructor view (QR + students). Frontend-only QR rotation; no DB storage.
// Treat route param as lectureId. Optional prop to override.
const AttendancePage = ({ attendanceId: propAttendanceId }) => {
    const params = useParams();
    const lectureId = propAttendanceId || params.attendanceId;
    const [qrToken, setQrToken] = useState(null);
    const [qrSvg, setQrSvg] = useState('');
    const [joinLink, setJoinLink] = useState(null);
    const [students, setStudents] = useState([]);
    const [secondsLeft, setSecondsLeft] = useState(10);
    const [headingText, setHeadingText] = useState('');
    const [attendanceGrade, setAttendanceGrade] = useState(0);
    const [showAttendanceGradeModal, setShowAttendanceGradeModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Build present set from localStorage (same-origin, cross-tab)
    const readPresentSet = useCallback(() => {
        try {
            const raw = localStorage.getItem(`attend:lec:${lectureId}`);
            const arr = raw ? JSON.parse(raw) : [];
            return new Set(arr.map(Number));
        } catch {
            return new Set();
        }
    }, [lectureId]);

    // Frontend-only QR rotation: random token + deep link to /attendance/join
    const generateQR = useCallback(async () => {
        if (!lectureId) return;
        const rand = crypto?.getRandomValues
            ? Array.from(crypto.getRandomValues(new Uint8Array(12)))
                    .map((b) => b.toString(16).padStart(2, '0'))
                    .join('')
            : Math.random().toString(36).slice(2);
        setQrToken(rand);
        const base = (import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin).replace(/\/$/, '');
        setJoinLink(`${base}/attendance/join?lec=${encodeURIComponent(lectureId)}&j=${rand}`);
    }, [lectureId]);

    const fetchStudents = useCallback(async () => {
        if (!lectureId) return;
        try {
            // Small retry to handle eventual consistency right after lecture creation
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
            // raw now contains the best-effort students array from lecture payload
            // Preload course title to display as heading (fallback to lecture id)
            try {
                const courses = await fetchCourses();
                const courseId = (typeof lec?.course === 'object' && lec?.course !== null) ? lec.course.id : lec?.course;
                const courseTitle = courses.find((c) => Number(c.id) === Number(courseId))?.title;
                setHeadingText(courseTitle ? `المحاضرة: ${courseTitle}` : `المحاضرة رقم ${lectureId}`);
            } catch {
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
            const presentSet = readPresentSet();
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
                    present: Number.isFinite(sid) ? presentSet.has(sid) : false,
                };
            });
            setStudents(mapped);
        } catch {
            setStudents([]);
        }
    }, [lectureId, readPresentSet]);

    const toggleStudent = useCallback(
        (studentId) => {
            const set = readPresentSet();
            if (set.has(Number(studentId))) set.delete(Number(studentId));
            else set.add(Number(studentId));
            localStorage.setItem(`attend:lec:${lectureId}`, JSON.stringify(Array.from(set)));
            fetchStudents();
        },
        [lectureId, readPresentSet, fetchStudents]
    );

    // Initial load
    useEffect(() => {
        fetchStudents();
    }, [lectureId, fetchStudents]);

    // Rotation timer (one interval every second; when counter hits 0 rotate & reset)
    const rotateNow = useCallback(async () => {
        await generateQR();
        setSecondsLeft(10);
    }, [generateQR]);

    useEffect(() => {
        if (!lectureId) return;
        rotateNow();
        const intv = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    // Trigger rotation
                    rotateNow();
                    return 10;
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
            alert('يرجى إدخال درجة صحيحة للحضور');
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
            
            // Get present students from localStorage
            const presentSet = readPresentSet();
            const presentStudents = students.filter(student => presentSet.has(student.id));
            
            // Create StudentAttendance records for present students
            const createPromises = presentStudents.map(async (student) => {
                try {
                    await AttendanceAPI.createStudentAttendance({
                        attendance: attendanceId,
                        student: student.id,
                        present: true
                    });
                } catch (error) {
                    // If record already exists, update it
                    if (error.response?.status === 400) {
                        // Try to find and update existing record
                        const existingAttendances = await AttendanceAPI.listStudentAttendances();
                        const existingRecord = existingAttendances.data.find(att => 
                            att.attendance === attendanceId && att.student === student.id
                        );
                        if (existingRecord) {
                            await AttendanceAPI.updateStudentAttendance(existingRecord.id, {
                                present: true
                            });
                        }
                    }
                }
            });
            
            await Promise.all(createPromises);
            
            // Create StudentMark records for present students with attendance grade
            const markPromises = presentStudents.map(async (student) => {
                try {
                    await AttendanceAPI.createStudentMark({
                        student: student.id,
                        lecture: Number(lectureId),
                        instructor_mark: 0 // Only attendance grade, no year work grade
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
                                instructor_mark: 0 // Keep year work grade as 0
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
            alert(`تم تعيين درجة الحضور ${attendanceGrade} للطلاب الحاضرين`);
        } catch (error) {
            console.error('Failed to set attendance grade:', error);
            alert('فشل في تعيين درجة الحضور');
        } finally {
            setLoading(false);
        }
    };

    // Sync across tabs on same device
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === `attend:lec:${lectureId}`) fetchStudents();
        };
        window.addEventListener('storage', onStorage);
        const intv = setInterval(fetchStudents, 5000);
        return () => {
            window.removeEventListener('storage', onStorage);
            clearInterval(intv);
        };
    }, [lectureId, fetchStudents]);

    return (
        <div className='attendance-page'>
            {/* Header with title and safety alert under it */}
            <div className='attendance-header'>
                <h2 className='attendance-title'>
                    {headingText || `المحاضرة رقم ${lectureId}`}
                </h2>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <div className='safety-alert'>
                        تنبيه: يُمنع مشاركة هذه الشاشة أو رمز الاستجابة السريعة خارج قاعة المحاضرة. هذا الرمز مُخصص فقط للحضور الفعلي داخل القاعة.
                    </div>
                </div>
            </div>

            {/* Two-column content: students left, QR right */}
            <div className='attendance-wrapper'>
            <div className='students-section'>
                <div className='students-toolbar'>
                    <h3 style={{ color: '#2c3649' }}>الطلاب</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className='btn btn-secondary-attendance'
                            onClick={() => setShowAttendanceGradeModal(true)}
                            disabled={loading}
                            style={{ fontSize: '14px', padding: '8px 12px' }}
                        >
                            تعيين درجة الحضور
                        </button>
                        <button
                        className='btn btn-secondary-attendance'
                        onClick={async () => {
                            // Build a temporary DOM node for rendering via html2canvas (ensures Arabic order preserved)
                            const container = document.createElement('div');
                            container.style.direction = 'rtl';
                            container.style.fontFamily = "'Tahoma','Segoe UI',sans-serif";
                            container.style.padding = '16px';
                            container.style.width = '1000px';
                            container.innerHTML = `
                                <div style="display:flex;align-items:center;gap:16px;border-bottom:2px solid #2c3649;padding-bottom:12px;margin-bottom:16px;">
                                    <div style="width:74px;height:74px;">${logoRaw}</div>
                                    <div>
                                        <div style="font-size:26px;font-weight:700;color:#2c3649;">جامعة بورسعيد</div>
                                        <div style="font-size:18px;margin-top:4px;color:#2c3649;">${headingText || `تقرير حضور المحاضرة رقم ${lectureId}`}</div>
                                        <div style="font-size:12px;color:#555;margin-top:4px;">تاريخ التوليد: ${new Date().toLocaleString('ar-EG')}</div>
                                    </div>
                                </div>
                                <table style="border-collapse:collapse;width:100%;font-size:13px;">
                                    <thead>
                                        <tr style="background:#2c3649;color:#fff;">
                                            <th style='border:1px solid #fff;padding:6px 8px;'>#</th>
                                            <th style='border:1px solid #fff;padding:6px 8px;'>الكود</th>
                                            <th style='border:1px solid #fff;padding:6px 8px;'>الاسم</th>
                                            <th style='border:1px solid #fff;padding:6px 8px;'>الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${students
                                            .map(
                                                (s, i) => `<tr ${i % 2 ? "style='background:#f5f5f5;'" : ''}>
                                                    <td style='border:1px solid #fff;padding:6px 8px;text-align:center; color: #2c3649;'>${i + 1}</td>
                                                    <td style='border:1px solid #fff;padding:6px 8px;text-align:center; color: #2c3649;'>${s.student_id}</td>
                                                    <td style='border:1px solid #fff;padding:6px 8px;text-align:center; color: #2c3649;'>${s.username}</td>
                                                    <td style='border:1px solid #fff;padding:6px 8px;text-align:center;font-weight:600;color:#fff;background:${s.present ? '#16a34a' : '#dc2626'}'>${
                                                        s.present ? 'حضور' : 'غياب'
                                                    }</td>
                                                </tr>`
                                            )
                                            .join('')}
                                    </tbody>
                                </table>`;
                            document.body.appendChild(container);
                            try {
                                const canvas = await html2canvas(container, { scale: 2, useCORS: true });
                                const imgData = canvas.toDataURL('image/png');
                                const pdf = new jsPDF('p', 'pt', 'a4');
                                const pageWidth = pdf.internal.pageSize.getWidth();
                                const pageHeight = pdf.internal.pageSize.getHeight();
                                const imgWidth = pageWidth - 40; // margins
                                const ratio = canvas.height / canvas.width;
                                const imgHeight = imgWidth * ratio;
                                pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, Math.min(imgHeight, pageHeight - 40));
                                pdf.save(`attendance_${lectureId}.pdf`);
                            } finally {
                                document.body.removeChild(container);
                            }
                        }}
                        >
                        تنزيل PDF
                    </button>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>الكود</th>
                            <th>الاسم</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((s) => (
                            <tr key={s.id}>
                                <td>{s.student_id}</td>
                                <td>{s.username}</td>
                                <td
                                    className={`status ${s.present ? 'present' : 'absent'}`}
                                    onClick={() => toggleStudent(s.student_id)}
                                    title="تبديل الحالة (محلي فقط)"
                                >
                                    {s.present ? 'حضور' : 'غياب'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className='qr-section'>
                <div className='qr-inline-bar'>
                    <h3 className='qr-inline-heading'>
                        <span className='attendance-countdown-large'>يتجدد خلال {secondsLeft} ث</span>
                    </h3>
                    <button className='btn btn-secondary-attendance' onClick={rotateNow}>
                        تحديث فوري
                    </button>
                </div>
                {!lectureId && <p>لم يتم تحديد محاضرة.</p>}
                {lectureId && (qrSvg ? <div className='qr-box' dangerouslySetInnerHTML={{ __html: qrSvg }} /> : <p>جاري التحميل...</p>)}
                {joinLink && (
                    <div style={{ marginTop: 8, direction: 'ltr', fontSize: 12, textAlign: 'center', width: '100%' }}>Join: {joinLink}</div>
                )}
            </div>
            </div>
            
            {showAttendanceGradeModal && (
                <Modal isOpen={showAttendanceGradeModal} onClose={() => setShowAttendanceGradeModal(false)} title='تعيين درجة الحضور'>
                    <div className='flex flex-col gap-2 !h-fit !w-fit'>
                        <div className='flex flex-col gap-5 !mb-5'>
                            <p className='text-lg'>المحاضرة: {headingText || `المحاضرة رقم ${lectureId}`}</p>
                            <p className='text-sm text-gray-600'>
                                سيتم تعيين هذه الدرجة للطلاب الحاضرين فقط
                            </p>
                        </div>
                        <div className='flex gap-2 text-xl items-center'>
                            <p className='!w-40'>درجة الحضور:</p>
                            <input 
                                type='number' 
                                className='h-10 w-32 !p-2 border border-gray-300 rounded'
                                value={attendanceGrade}
                                onChange={(e) => setAttendanceGrade(parseFloat(e.target.value) || 0)}
                                step="0.1"
                                min="0"
                                max="100"
                                placeholder="0.0"
                            />
                        </div>
                        <button 
                            className='btn btn-secondary-attendance !w-full'
                            onClick={handleSetAttendanceGrade}
                            disabled={loading}
                        >
                            {loading ? 'جاري التطبيق...' : 'تطبيق الدرجة'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AttendancePage;

AttendancePage.propTypes = {
    attendanceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
