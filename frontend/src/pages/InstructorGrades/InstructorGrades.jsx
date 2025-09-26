import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import logoRaw from '../../assets/psu-logo.svg?raw';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { fetchLectures } from '../../services/lectureApi';
import { fetchCourses } from '../../services/courseApi';
import { fetchUsers } from '../../services/userApi';
import { AttendanceAPI } from '../../services/attendanceApi';
import Modal from '../../components/ui/Modal';
import '../../styles/tableScroll.css'; // shared table scrollbar
// import '../../styles/global.css';
import './instructorgrades.css';
import toast from '../../utils/toast';

export default function InstructorGrades() {
    const { user } = useAuth();
    const [lectures, setLectures] = useState([]);
    const [courses, setCourses] = useState([]);
    const [users, setUsers] = useState([]);
    const [studentMarks, setStudentMarks] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [courseStudents, setCourseStudents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    // Load initial data
      // Helper function to check if user has a specific group
  const hasGroup = (groupId) => {
    if (!user?.groups) return false;
    return user.groups.some(group => {
      const id = typeof group === 'object' ? group.id : group;
      return id === groupId;
    });
  };

  // Helper function to check if user has any of the specified groups
  const hasAnyGroup = (groupIds) => {
    return groupIds.some(groupId => hasGroup(groupId));
  };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [lecturesData, coursesData, usersData, marksData] = await Promise.all([
                    fetchLectures(),
                    fetchCourses(),
                    fetchUsers(),
                    AttendanceAPI.listStudentMarks(),
                ]);
                
                // Normalize and save lectures
                const normalizedLectures = Array.isArray(lecturesData) ? lecturesData : [];
                setLectures(normalizedLectures);
                // If the user is an instructor (group id 3), show only courses linked to lectures they teach
                if (hasAnyGroup([3])) {
                    const currentDoctorLectures = normalizedLectures.filter(l => {
                        const instructorIds = Array.isArray(l.instructor)
                            ? l.instructor.map(i => (typeof i === 'object' ? i.id : i))
                            : [];
                        return instructorIds.includes(user?.id);
                    });

                    const courseIds = currentDoctorLectures.map(l =>
                        typeof l.course === 'object' ? l.course.id : l.course
                    );
                    const uniqueCourseIds = [...new Set(courseIds)];

                    const allCourses = Array.isArray(coursesData) ? coursesData : [];
                    const courseByName = allCourses.filter(c => uniqueCourseIds.includes(c.id));

                    setCourses(courseByName);
                } else {
                    setCourses(Array.isArray(coursesData) ? coursesData : []);
                }


                
                
                
               


                setUsers(Array.isArray(usersData) ? usersData : []);
                setStudentMarks(Array.isArray(marksData.data) ? marksData.data : []);
                setError('');
            } catch (err) {
                const msg = err?.message || 'فشل في تحميل البيانات';
                setError(msg);
                toast.error(msg);
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Load course students when course is selected
    const loadCourseStudents = useCallback(async () => {
        if (!selectedCourse) {
            setCourseStudents([]);
            return;
        }

        try {
            // Find lectures for the selected course
            const courseLectures = lectures.filter(lec => 
                (typeof lec.course === 'object' ? lec.course.id : lec.course) === Number(selectedCourse)
            );

            if (courseLectures.length === 0) {
                setCourseStudents([]);
                return;
            }

            // Get all unique students from all lectures of this course
            const allStudentIds = new Set();
            courseLectures.forEach(lec => {
                if (Array.isArray(lec.students)) {
                    lec.students.forEach(student => {
                        const id = typeof student === 'object' ? student.id : student;
                        if (id) allStudentIds.add(Number(id));
                    });
                }
            });

            // Build student data with marks
            const studentsData = Array.from(allStudentIds).map(studentId => {
                const user = users.find(u => u.id === studentId);
                const studentMarksForCourse = studentMarks.filter(mark => 
                    mark.student === studentId && 
                    courseLectures.some(lec => lec.id === mark.lecture)
                );

                const totalAttendanceMark = studentMarksForCourse.reduce((sum, mark) => sum + (mark.attendance_mark || 0), 0);
                const totalInstructorMark = studentMarksForCourse.reduce((sum, mark) => sum + (mark.instructor_mark || 0), 0);
                const totalFinalMark = studentMarksForCourse.reduce((sum, mark) => sum + (mark.final_mark || 0), 0);

                return {
                    id: studentId,
                    username: user ? `${user.first_name} ${user.last_name}` : `مستخدم ${studentId}`,
                    attendanceMark: totalAttendanceMark,
                    instructorMark: totalInstructorMark,
                    finalMark: totalFinalMark,
                    marksData: studentMarksForCourse
                };
            });

            setCourseStudents(studentsData);
        } catch (error) {
            console.error('Failed to load course students:', error);
            setCourseStudents([]);
            toast.error('فشل في تحميل طلاب المقرر');
        }
    }, [selectedCourse, lectures, users, studentMarks]);

    useEffect(() => {
        loadCourseStudents();
    }, [loadCourseStudents]);

    const handleEditStudent = (student) => {
        setEditingStudent(student);
        // Restore original behavior: edit value is the total instructor mark to set
        setEditValue(student.instructorMark.toFixed(1));
        setShowModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editingStudent || !editValue) return;

        setLoading(true);
        try {
            // Treat entered value as the NEW total to set (will be distributed across marks)
            const newInstructorMarkTotal = parseFloat(editValue);
            if (!Number.isFinite(newInstructorMarkTotal)) {
                throw new Error('قيمة غير صالحة');
            }
            
            if (editingStudent.marksData.length > 0) {
                // Distribute the NEW total evenly across existing marks (overwrite)
                const perMark = newInstructorMarkTotal / editingStudent.marksData.length;
                const updatePromises = editingStudent.marksData.map(mark => 
                    AttendanceAPI.updateStudentMark(mark.id, {
                        instructor_mark: perMark,
                    })
                );
                await Promise.all(updatePromises);
            } else {
                // Create new marks for all lectures in this course
                const courseLectures = lectures.filter(lec => 
                    (typeof lec.course === 'object' ? lec.course.id : lec.course) === Number(selectedCourse)
                );
                
                const createPromises = courseLectures.map(lecture => 
                    AttendanceAPI.createStudentMark({
                        student: editingStudent.id,
                        lecture: lecture.id,
                        instructor_mark: newInstructorMarkTotal / courseLectures.length // Distribute evenly
                    })
                );
                await Promise.all(createPromises);
            }

            // Refresh data
            const marksData = await AttendanceAPI.listStudentMarks();
            setStudentMarks(Array.isArray(marksData.data) ? marksData.data : []);
            
            setShowModal(false);
            setEditValue('');
            setEditingStudent(null);
        } catch (error) {
            console.error('Failed to update student marks:', error);
            toast.error('فشل في تحديث الدرجة. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = async () => {
        if (!selectedCourse || courseStudents.length === 0) return;

        const selectedCourseData = courses.find(c => c.id === Number(selectedCourse));
        const courseName = selectedCourseData?.title || `المقرر ${selectedCourse}`;

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
                    <div style="font-size:18px;margin-top:4px;color:#2c3649;">تقرير درجات المقرر: ${courseName}</div>
                    <div style="font-size:12px;color:#555;margin-top:4px;">تاريخ التوليد: ${new Date().toLocaleString('ar-EG')}</div>
                </div>
            </div>
            <table style="border-collapse:collapse;width:100%;font-size:13px;">
                <thead>
                    <tr style="background:#2c3649;color:#fff;">
                        <th style='border:1px solid #fff;padding:6px 8px;'>#</th>
                        <th style='border:1px solid #fff;padding:6px 8px;'>الكود</th>
                        <th style='border:1px solid #fff;padding:6px 8px;'>الاسم</th>
                        <th style='border:1px solid #fff;padding:6px 8px;'>درجة الحضور</th>
                        <th style='border:1px solid #fff;padding:6px 8px;'>درجة أعمال السنة</th>
                        <th style='border:1px solid #fff;padding:6px 8px;'>الدرجة النهائية</th>
                    </tr>
                </thead>
                <tbody>
                    ${courseStudents
                        .map(
                            (s, i) => `<tr ${i % 2 ? "style='background:#f5f5f5;'" : ''}>
                                <td style='border:1px solid #666;padding:6px 8px;text-align:center;color:#2c3649;'>${i + 1}</td>
                                <td style='border:1px solid #666;padding:6px 8px;text-align:center;color:#2c3649;'>${s.id}</td>
                                <td style='border:1px solid #666;padding:6px 8px;text-align:center;color:#2c3649;'>${s.username}</td>
                                <td style='border:1px solid #666;padding:6px 8px;text-align:center;color:#2c3649;'>${s.attendanceMark.toFixed(1)}</td>
                                <td style='border:1px solid #666;padding:6px 8px;text-align:center;color:#2c3649;'>${s.instructorMark.toFixed(1)}</td>
                                <td style='border:1px solid #666;padding:6px 8px;text-align:center;color:#2c3649;'>${s.finalMark.toFixed(1)}</td>
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
            const imgWidth = pageWidth - 40;
            const ratio = canvas.height / canvas.width;
            const imgHeight = imgWidth * ratio;
            pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, Math.min(imgHeight, pageHeight - 40));
            pdf.save(`grades_${courseName}_${new Date().toISOString().split('T')[0]}.pdf`);
        } finally {
            document.body.removeChild(container);
        }
    };

    return (
        <div className='attendance-page instructor-grades'>
            <div className='attendance-header'>
                <h2 className='attendance-title'>إدارة درجات الطلاب</h2>
            </div>

            {error && (
                <div style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            <div className='attendance-wrapper container !my-10'>
                <div className='students-section'>
                    <div className='students-toolbar'>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h3 style={{ color: '#2c3649', margin: 0 }}>اختر المقرر:</h3>
                            <select 
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                className="h-14 px-20 border border-gray-300 rounded bg-white"
                                style={{ minWidth: '200px' }}
                            >
                                <option value="">-- اختر المقرر --</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>
                            {/* search students  by name */}
                            <input type="text" placeholder='ابحث عن طالب' onChange={(e) => setSearch(e.target.value)} />

                        </div>
                        
                        {selectedCourse && courseStudents.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className='btn btn-secondary-attendance'
                                    onClick={generatePDF}
                                    disabled={loading}
                                >
                                    تنزيل PDF
                                </button>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#646cff' }}>
                            جاري التحميل...
                        </div>
                    ) : selectedCourse && courseStudents.length > 0 ? (
                        <div className='students-table-scroll !h-[480px] !overflow-y-auto'>
                        <table>
                            <thead>
                                <tr>
                                    <th>الكود</th>
                                    <th>الاسم</th>
                                    <th>درجة الحضور</th>
                                    <th>درجة أعمال السنة</th>
                                    <th>الدرجة النهائية</th>
                                    <th>تعديل</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courseStudents.filter(s => s.username.toLowerCase().includes(search.toLowerCase())).map((student) => (
                                    <tr key={student.id}>
                                        <td>{student.id}</td>
                                        <td>{student.username}</td>
                                        <td>{student.attendanceMark.toFixed(1)}</td>
                                        <td>{student.instructorMark.toFixed(1)}</td>
                                        <td>{student.finalMark.toFixed(1)}</td>
                                        {hasAnyGroup([3]) && (
                                        <td>
                                            <button 
                                                className='btn btn-secondary-attendance'
                                                onClick={() => handleEditStudent(student)}
                                                disabled={loading}
                                            >
                                                تعديل
                                            </button>
                                        </td>
                                        )}
                                        {!hasAnyGroup([3]) && (
                                            <td>
                                                لا يمكن التعديل
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    ) : selectedCourse ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                            لا توجد بيانات طلاب لهذا المقرر
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                            يرجى اختيار مقرر لعرض درجات الطلاب
                        </div>
                    )}
                </div>
            </div>

            {showModal && editingStudent && (
                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title='تعديل درجة أعمال السنة'>
                    <div className='flex flex-col gap-2 !h-fit !w-fit'>
                        <div className='flex flex-col gap-5 !mb-5'>
                            <div className='flex gap-2 text-2xl'>
                                <p>اسم الطالب:</p>
                                <p>{editingStudent.username}</p>
                            </div>
                            <div className='flex gap-2 text-2xl'>
                                <p>الدرجة الحالية لأعمال السنة:</p>
                                <p>{editingStudent.instructorMark.toFixed(1)}</p>
                            </div>
                        </div>
                        <div className='flex gap-2 text-2xl'>
                            <p className='!w-50'>أضف مقدارًا إلى أعمال السنة:</p>
                            <input 
                                type='number' 
                                className='h-8 w-40 !p-2'
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                step="0.1"
                                min="0"
                                placeholder="مثال: 3 لإضافة ثلاث درجات"
                            />
                        </div>
                        <button 
                            className='btn btn-secondary-attendance !w-full'
                            onClick={handleSaveEdit}
                            disabled={loading}
                        >
                            {loading ? 'جاري التحديث...' : 'حفظ التعديل'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
