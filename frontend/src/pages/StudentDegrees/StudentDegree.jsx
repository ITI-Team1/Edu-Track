import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext';
import { fetchLectures } from '../../services/lectureApi';
import { fetchCourses } from '../../services/courseApi';
import { fetchLocations } from '../../services/locationApi';
import { fetchUsers } from '../../services/userApi';
import { AttendanceAPI } from '../../services/attendanceApi';
import './StudentDegree.css';
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
    <div className=' relative '>
            {/* Header with title */}
            <div className='student-degrees-header before:block  before:!content-[""] rounded-3xl before:rounded-t-3xl  before:top-0 before:left-0 before:right-0 before:!h-1 '>
                <h2 className='student-degrees-title !text-gray-800 md:!text-3xl !mt-2 md:!mt-4 !text-center '>درجات المواد</h2>
            </div>

            {/* Content wrapper optimized for mobile */}
            <div className='student-degrees-wrapper'>
                <div className='student-degrees-content'>
                    
                    <div className='student-degrees-table-container '>
                        <table className='student-degrees-table'>
                            <thead>
                                <tr>
                                    <th className='col-code'>الكود</th>
                                    <th className='col-name'>اسم المادة</th>
                                    <th className='col-attendance'>درجة الحضور</th>
                                    <th className='col-year'>درجة أعمال السنة</th>
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
                                        <tr key={course.id} className='student-degrees-row'>
                                            <td className='col-code'>{course.id}</td>
                                            <td className='col-name'>{course.title}</td>
                                            <td className='col-attendance'>{totalAttendanceMark.toFixed(1)}</td>
                                            <td className='col-year'>{totalInstructorMark.toFixed(1)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
        </div>
  )
}