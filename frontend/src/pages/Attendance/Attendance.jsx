import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import logoRaw from '../../assets/psu-logo.svg?raw';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getLecture } from '../../services/lectureApi';
import { fetchCourses } from '../../services/courseApi';
import { fetchUsers } from '../../services/userApi';
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
            const lec = await getLecture(lectureId);
            const raw = Array.isArray(lec?.students) ? lec.students : [];
            // Preload course title to display as heading (fallback to lecture id)
            try {
                const courses = await fetchCourses();
                const courseTitle = courses.find((c) => Number(c.id) === Number(lec.course))?.title;
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
                const obj = typeof s === 'object' && s ? s : { id: Number(s), username: String(s) };
                const u = usersMap[Number(obj.id)] || obj;
                const first = u.first_name || u.firstname || '';
                const last = u.last_name || u.lastname || '';
                const name = first && last ? `${first} ${last}` : first || u.username || u.englishfullname || u.name || `مستخدم ${obj.id}`;
                return {
                    id: Number(obj.id),
                    student_id: Number(obj.id),
                    username: name,
                    present: presentSet.has(Number(obj.id)),
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
        </div>
    );
};

export default AttendancePage;

AttendancePage.propTypes = {
    attendanceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
