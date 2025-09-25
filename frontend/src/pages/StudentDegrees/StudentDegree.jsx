import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext';
import { fetchLectures } from '../../services/lectureApi';
import { fetchCourses } from '../../services/courseApi';
import { fetchLocations } from '../../services/locationApi';
import { fetchUsers } from '../../services/userApi';
import { AttendanceAPI } from '../../services/attendanceApi';
import '../Attendance/attendance.css';
export default function StudentDegree() {
    const [lectures, setLectures] = useState([]);
    const [courses, setCourses] = useState([]);
    const [_locations, setLocations] = useState([]);
    const [_users, setUsers] = useState([]);
    const [studentMarks, setStudentMarks] = useState([]);
    const [_loading, setLoading] = useState(false);
    const [_error, setError] = useState('');
    const { isAuthenticated, user } = useAuth();
    
    // Derive only the lectures and courses that this student is enrolled in (based on marks)
    const { enrolledLectures, filteredCourses } = useMemo(() => {
      // Build a set of lecture IDs that the student has marks for
      const enrolledLectureIds = new Set((studentMarks || []).map(m => m.lecture));
      // Filter lectures to only the ones the student is related to
      const enrolledLects = (lectures || []).filter(lec => enrolledLectureIds.has(lec.id));
      // Map those lectures to their course IDs
      const enrolledCourseIds = new Set(enrolledLects.map(lec => (typeof lec.course === 'object' ? lec.course.id : lec.course)));
      // Filter courses list accordingly
      const filteredCrs = (courses || []).filter(crs => enrolledCourseIds.has(crs.id));
      return { enrolledLectures: enrolledLects, filteredCourses: filteredCrs };
    }, [lectures, courses, studentMarks]);
    useEffect(() => {
        if (!isAuthenticated) return;
        const load = async () => {
          setLoading(true);
          try {
            const [lec, crs, locs, us, marks] = await Promise.all([
              fetchLectures(),
              fetchCourses(),
              fetchLocations(),
              fetchUsers(),
              AttendanceAPI.getStudentMarksByStudent(user.id),
            ]);
            setLectures(Array.isArray(lec) ? lec : (lec?.results ?? []));
            setCourses(Array.isArray(crs) ? crs : (crs?.results ?? []));
            setLocations(Array.isArray(locs) ? locs : (locs?.results ?? []));
            setUsers(Array.isArray(us) ? us : (us?.results ?? []));
            setStudentMarks(Array.isArray(marks) ? marks : []);
            setError('');
          } catch (err) {
            setError(err?.message || 'فشل تحميل الجدول');
          } finally {
            setLoading(false);
          }
        };
        load();
      }, [isAuthenticated, user.id]);
  return (
    <div className='attendance-page'>
            {/* Header with title and safety alert under it */}
            

            {/* Two-column content: students left, QR right */}
            <div className='attendance-wrapper container !my-10'>
            <div className='students-section'>
                <div className='students-toolbar'>
                    <h3 style={{ color: '#2c3649' }}>درجات المواد</h3>
                    
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
                        {(filteredCourses || []).map((course) => {
                            // Find all lectures for this course, restricted to lectures the student is enrolled in
                            const courseLectures = enrolledLectures.filter(lec => 
                                (typeof lec.course === 'object' ? lec.course.id : lec.course) === course.id
                            );
                            
                            // Find all marks for this course's lectures
                            const courseMarks = studentMarks.filter(mark => 
                                courseLectures.some(lec => lec.id === mark.lecture)
                            );
                            
                            // Calculate total attendance and instructor marks
                            const totalAttendanceMark = courseMarks.reduce((sum, mark) => sum + (mark.attendance_mark || 0), 0);
                            const totalInstructorMark = courseMarks.reduce((sum, mark) => sum + (mark.instructor_mark || 0), 0);
                            
                            return (
                                <tr key={course.id}>
                                    <td>{course.id}</td>
                                    <td>{course.title}</td>
                                    <td>{totalAttendanceMark.toFixed(1)}</td>
                                    <td>{totalInstructorMark.toFixed(1)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            </div>
            
        </div>
  )
}