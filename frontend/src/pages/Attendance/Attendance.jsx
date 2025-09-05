import React, { useEffect, useState, useCallback } from 'react';
// NOTE: Now generating downloadable PDF (no print dialog) using jsPDF + embedded simple Arabic text.
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
// Import raw SVG so we can embed it directly inside the print window (works in Vite via ?raw)
import logoRaw from '../../assets/psu-logo.svg?raw';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AttendanceAPI } from '../../services/attendanceApi';
// Removed camera scanner: QR now encodes a deep link URL; student device opens it -> login -> auto mark.
import './attendance.css';

// Simplified unified instructor view only (QR + students table)
// Accepts either an attendance id or a lecture id (auto-resolves / creates active attendance session)
const AttendancePage = ({ attendanceId: propAttendanceId }) => {
    const params = useParams();
    const routeId = propAttendanceId || params.attendanceId; // could be attendance id or lecture id
    const [attendanceId, setAttendanceId] = useState(null);
    const [qrToken, setQrToken] = useState(null);
    const [qrSvg, setQrSvg] = useState('');
    const [joinLink, setJoinLink] = useState(null);
    const [students, setStudents] = useState([]);
    const [secondsLeft, setSecondsLeft] = useState(10);

    // Resolve route id -> real attendance id (treat route id first as attendance id; if 404 fallback to lecture active)
    useEffect(() => {
        if (!routeId) return;
        // First optimistic assumption: routeId IS an attendance id; set directly and later calls may 404 -> handled in fetch functions
        setAttendanceId(routeId);
    }, [routeId]);

    const generateQR = useCallback(async () => {
        try {
            if (!attendanceId) return;
            const { data } = await AttendanceAPI.rotateQR(attendanceId);
            setQrToken(data.token);
            if (data.join_link) setJoinLink(data.join_link);
        } catch (e) {
            if (e?.response?.status === 404 && routeId) {
                // Treat original id as lecture id; fetch/create active attendance then retry
                try {
                    const { data: attData } = await AttendanceAPI.getOrCreateActiveByLecture(routeId);
                    setAttendanceId(attData.id);
                } catch {/* ignore */ }
            }
        }
    }, [attendanceId, routeId]);

    const fetchStudents = useCallback(async () => {
        try {
            if (!attendanceId) return;
            const { data } = await AttendanceAPI.listStudents(attendanceId);
            setStudents(data.students || []);
        } catch (e) {
            if (e?.response?.status === 404 && routeId) {
                try {
                    const { data: attData } = await AttendanceAPI.getOrCreateActiveByLecture(routeId);
                    setAttendanceId(attData.id);
                } catch {/* ignore */ }
            }
        }
    }, [attendanceId, routeId]);

    const toggleStudent = useCallback(async (studentId, present) => {
        if (!attendanceId) return;
        try {
            await AttendanceAPI.override(attendanceId, studentId, !present);
            fetchStudents();
        } catch {/* noop */ }
    }, [attendanceId, fetchStudents]);

    // Initial load
    useEffect(() => { fetchStudents(); }, [attendanceId, fetchStudents]);
    // Rotation timer (one interval every second; when counter hits 0 rotate & reset)
    const rotateNow = useCallback(async () => {
        await generateQR();
        setSecondsLeft(10);
    }, [generateQR]);
    useEffect(() => {
        if (!attendanceId) return; // wait until we have an id
        rotateNow();
        const intv = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    // Trigger rotation
                    rotateNow();
                    return 10;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(intv);
    }, [attendanceId, rotateNow]);
    useEffect(() => {
        if (qrToken) {
            // Use configurable public base (for LAN access) else current origin
            const publicBase = import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin;
            const payload = joinLink ? (publicBase.replace(/\/$/, '') + joinLink) : JSON.stringify({ token: qrToken, attendanceId });
            QRCode.toString(payload, { type: 'svg', width: 260 }, (err, str) => { if (!err) setQrSvg(str); });
        }
    }, [qrToken, attendanceId, joinLink]);
    useEffect(() => { const intv = setInterval(fetchStudents, 5000); return () => clearInterval(intv); }, [fetchStudents]);

    return (
        <div className='attendance-wrapper'>
            <div className='qr-section'>
                <div className='qr-inline-bar'>
                    <h3 className='qr-inline-heading' style={{margin:0}}><span className='attendance-countdown-large'>يتجدد خلال {secondsLeft} ث</span></h3>
                    <button className='btn btn-secondary-attendance' onClick={rotateNow} style={{padding:'6px 18px'}}>تحديث فوري</button>
                </div>
                {!attendanceId && <p>لم يتم تحديد جلسة حضور.</p>}
                {attendanceId && (qrSvg ? <div className='qr-box' dangerouslySetInnerHTML={{ __html: qrSvg }} /> : <p>جاري التحميل...</p>)}
                {joinLink && <div style={{ marginTop: 8, direction: 'ltr', fontSize: 12, textAlign: 'center', width: '100%' }}>Join: {joinLink}</div>}

            </div>
            <div className='students-section'>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h3 style={{ margin: 0 }}>الطلاب</h3>
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
                                        <div style="font-size:18px;margin-top:4px;color:#2c3649;">تقرير حضور الجلسة رقم ${attendanceId}</div>
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
                                        ${students.map((s,i)=>`<tr ${i%2?"style='background:#f5f5f5;'":""}>
                                            <td style='border:1px solid #fff;padding:6px 8px;text-align:center; color: #2c3649;'>${i+1}</td>
                                            <td style='border:1px solid #fff;padding:6px 8px;text-align:center; color: #2c3649;'>${s.student_id}</td>
                                            <td style='border:1px solid #fff;padding:6px 8px;text-align:center; color: #2c3649;'>${s.username}</td>
                                            <td style='border:1px solid #fff;padding:6px 8px;text-align:center;font-weight:600;color:#fff;background:${s.present?'#16a34a':'#dc2626'}'>${s.present? 'حضور':'غياب'}</td>
                                        </tr>`).join('')}
                                    </tbody>
                                </table>`;
                            document.body.appendChild(container);
                            try {
                                const canvas = await html2canvas(container, { scale: 2, useCORS: true });
                                const imgData = canvas.toDataURL('image/png');
                                const pdf = new jsPDF('p','pt','a4');
                                const pageWidth = pdf.internal.pageSize.getWidth();
                                const pageHeight = pdf.internal.pageSize.getHeight();
                                // Fit image proportionally
                                const imgWidth = pageWidth - 40; // margins
                                const ratio = canvas.height / canvas.width;
                                const imgHeight = imgWidth * ratio;
                                pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, Math.min(imgHeight, pageHeight-40));
                                pdf.save(`attendance_${attendanceId}.pdf`);
                            } finally {
                                document.body.removeChild(container);
                            }
                        }}
                    >تنزيل PDF</button>
                </div>
                <table>
                    <thead><tr><th>الكود</th><th>الاسم</th><th>الحالة</th></tr></thead>
                    <tbody>
                        {students.map(s => (
                            <tr key={s.id}>
                                <td>{s.student_id}</td>
                                <td>{s.username}</td>
                                <td
                                    className={`status ${s.present ? 'present' : 'absent'}`}
                                    onClick={() => toggleStudent(s.student_id, s.present)}
                                    title="تبديل الحالة يدويًا"
                                >
                                    {s.present ? 'حضور' : 'غياب'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendancePage;

AttendancePage.propTypes = {
    attendanceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};
