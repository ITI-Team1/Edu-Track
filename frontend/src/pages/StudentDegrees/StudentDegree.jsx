import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext';
import { fetchLectures } from '../../services/lectureApi';
import { fetchCourses } from '../../services/courseApi';
import { fetchLocations } from '../../services/locationApi';
import { fetchUsers } from '../../services/userApi';
import '../Attendance/attendance.css';
export default function StudentDegree() {
    const [lectures, setLectures] = useState([]);
    const [courses, setCourses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { isAuthenticated, user } = useAuth();
    useEffect(() => {
        if (!isAuthenticated) return;
        const load = async () => {
          setLoading(true);
          try {
            const [lec, crs, locs, us] = await Promise.all([
              fetchLectures(),
              fetchCourses(),
              fetchLocations(),
              fetchUsers(),
            ]);
            setLectures(Array.isArray(lec) ? lec : (lec?.results ?? []));
            setCourses(Array.isArray(crs) ? crs : (crs?.results ?? []));
            setLocations(Array.isArray(locs) ? locs : (locs?.results ?? []));
            setUsers(Array.isArray(us) ? us : (us?.results ?? []));
            setError('');
          } catch (err) {
            setError(err?.message || 'فشل تحميل الجدول');
          } finally {
            setLoading(false);
          }
          console.log(lectures, courses, locations, user,users);
        };
        load();
      }, [isAuthenticated]);
  return (
    <div className='aسttendance-page'>
            {/* Header with title and safety alert under it */}
            

            {/* Two-column content: students left, QR right */}
            <div className='attendance-wrapper container !my-10'>
            <div className='students-section'>
                <div className='students-toolbar'>
                    <h3 style={{ color: '#2c3649' }}>درجات المواد</h3>
                    {/* <button
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
                                            <th style='border:1px solid #fff;padding:6px 8px;'>درجه الحضور</th>
                                            <th style='border:1px solid #fff;padding:6px 8px;'>درجة اعمال السنة</th>
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
                                                        <td style='border:1px solid #fff;padding:6px 8px;text-align:center; color: #2c3649;'>${i +10}</td>
                                                        <td style='border:1px solid #fff;padding:6px 8px;text-align:center; color: #2c3649;'>${i +20}</td>
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
                    </button> */}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>الكود</th>
                            <th>اسم المادة</th>
                            
                            <th>درجه الحضور</th>
                            <th>درجة اعمال السنة</th>
                            
                            
                        </tr>
                    </thead>
                    <tbody>
                        {courses.map((s) => (
                            <tr key={s.id}>
                                <td>{s.id}</td>
                                <td>{s.title}</td>
                                
                                
                                <td>{s.id+5}</td>
                                <td>{s.id+20}</td>
                                
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            </div>
            
        </div>
  )
}
