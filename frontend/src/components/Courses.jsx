import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/courses.css';
import { fetchLectures } from '../services/lectureApi';
import { fetchCourses } from '../services/courseApi';
import { fetchLocations } from '../services/locationApi';
import { fetchUsers } from '../services/userApi';
import { useQuery } from '@tanstack/react-query';
import { AttendanceAPI } from '../services/attendanceApi';

function Courses() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // New: load real data and compute user's enrolled courses
  // Reuse services similar to Schedule.jsx
  // Imports moved to top in a separate edit hunk below
  const { data: lectures = [], isLoading: lecLoading, error: lecError } = useQuery({
    queryKey: ['lectures'],
    queryFn: fetchLectures,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const { data: allCourses = [], isLoading: crsLoading, error: crsError } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const { data: locations = [], isLoading: locLoading, error: locError } = useQuery({
    queryKey: ['locations'],
    queryFn: fetchLocations,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const { data: users = [], isLoading: usrLoading, error: usrError } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  // Load student marks to determine which courses have degrees
  const { data: studentMarks = [], isLoading: marksLoading, error: marksError } = useQuery({
    queryKey: ['studentMarks', user?.id],
    queryFn: () => AttendanceAPI.getStudentMarksByStudent(user.id),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 60_000,
  });

  // Helpers copied from Schedule.jsx for names
  const getInstructorNames = useCallback((lec) => {
    if (!lec) return '';
    // Prefer server-provided instructor_details (from LectureSerializer)
    const details = Array.isArray(lec.instructor_details) ? lec.instructor_details : [];
    let names = details
      .map(d => `${d.first_name || ''} ${d.last_name || ''}`.trim())
      .filter(Boolean);
    if (names.length === 0) {
      // Fallback to local users list by IDs
      const ids = Array.isArray(lec.instructor)
        ? lec.instructor.map(ins => (typeof ins === 'object' ? ins.id : ins))
        : (lec.instructor ? [ (typeof lec.instructor === 'object' ? lec.instructor.id : lec.instructor) ] : []);
      names = ids.map(id => {
        const u = users.find(u => Number(u.id) === Number(id));
        return u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : '';
      }).filter(Boolean);
    }
    return names.join('، ');
  }, [users]);
  const getRoomName = useCallback((lec) => {
    if (lec.location && typeof lec.location === 'object') return lec.location.name || lec.location.title || lec.location.slug;
    const l = locations.find(l => l.id === lec.location || l.slug === lec.location);
    return l ? l.name : lec.location;
  }, [locations]);

  // Determine enrolled course IDs from lectures that include current user
  const enrolledCourseIds = React.useMemo(() => {
    if (!user?.id) return new Set();
    return new Set(
      lectures
        .filter(lec => {
          const st = Array.isArray(lec.students) ? lec.students : [];
          const ids = st.map(s => (typeof s === 'object' && s !== null) ? s.id : s).map(Number);
          return ids.includes(Number(user.id));
        })
        .map(lec => (typeof lec.course === 'object' ? lec.course?.id : lec.course))
        .map(Number)
    );
  }, [lectures, user?.id]);

  // Build UI-friendly course cards for the user's enrolled courses
  const enrolledCourseCards = React.useMemo(() => {
    const filtered = (Array.isArray(allCourses) ? allCourses : []).filter(c => enrolledCourseIds.has(Number(c.id)));
    // Build lookup: lectureId -> courseId
    const lectureIdToCourseId = new Map();
    (Array.isArray(lectures) ? lectures : []).forEach(lec => {
      const cid = Number(typeof lec.course === 'object' ? lec.course?.id : lec.course);
      lectureIdToCourseId.set(Number(lec.id), cid);
    });
    // Build sets based on POSITIVE marks only (attendance or instructor)
    const courseIdsWithPositiveMarks = new Set();
    const lectureIdsWithPositiveMarks = new Set();
    (Array.isArray(studentMarks) ? studentMarks : []).forEach(m => {
      const lecIdRaw = (m && typeof m.lecture === 'object') ? m.lecture?.id : m?.lecture;
      const lecId = Number(lecIdRaw);
      const attendance = Number(m?.attendance_mark || 0);
      const instructor = Number(m?.instructor_mark || 0);
      const hasPositive = (attendance > 0) || (instructor > 0);
      if (!Number.isFinite(lecId) || !hasPositive) return;
      lectureIdsWithPositiveMarks.add(lecId);
      const cid = lectureIdToCourseId.get(lecId);
      if (cid != null) courseIdsWithPositiveMarks.add(Number(cid));
    });
    return filtered.map(c => {
      const relatedLectures = lectures.filter(lec => {
        const cid = Number(typeof lec.course === 'object' ? lec.course?.id : lec.course);
        return cid === Number(c.id);
      });
      const firstLec = relatedLectures[0];
      const nextClass = firstLec ? `${firstLec.day || ''} ${String(firstLec.starttime || '').slice(0,5)}`.trim() : '—';
      // Course is eligible for survey only if the current student has POSITIVE marks for ANY lecture in this course
      const hasDegree = courseIdsWithPositiveMarks.has(Number(c.id));
      // Prefer a lecture that actually has POSITIVE marks when navigating to survey
      const markedLectureForCourse = relatedLectures.find(lec => lectureIdsWithPositiveMarks.has(Number(lec.id)));
      return {
        id: c.id,
        name: c.title || c.name || c.slug,
        instructor: firstLec ? getInstructorNames(firstLec) : '—',
        room: firstLec ? getRoomName(firstLec) : '—',
        nextClass,
        sessionsCount: relatedLectures.length,
        representativeLectureId: (markedLectureForCourse?.id) ?? (firstLec ? firstLec.id : null),
        hasDegree,
      };
    });
  }, [allCourses, lectures, enrolledCourseIds, getInstructorNames, getRoomName, studentMarks]);

  // New: total number of lectures across the user's enrolled courses
  const totalLecturesCount = React.useMemo(() => {
    return (Array.isArray(lectures) ? lectures : []).filter(lec => {
      const cid = Number(typeof lec.course === 'object' ? lec.course?.id : lec.course);
      return enrolledCourseIds.has(cid);
    }).length;
  }, [lectures, enrolledCourseIds]);

  const combinedLoading = lecLoading || crsLoading || locLoading || usrLoading || marksLoading;
  const combinedError = lecError?.message || crsError?.message || locError?.message || usrError?.message || marksError?.message || '';

  // Modal state for course details
  const [modalCourseId, setModalCourseId] = React.useState(null);
  const openCourseModal = (courseId) => setModalCourseId(courseId);
  const closeCourseModal = () => setModalCourseId(null);

  // Navigation handlers
  const goToDegreesPage = React.useCallback(() => {
    navigate('/student-degrees');
  }, [navigate]);
  const goToSurvey = React.useCallback((lectureId, enabled) => {
    // Hard guard: do not navigate if not enabled
    if (!enabled) return;
    if (lectureId) {
      navigate(`/survey?lectureId=${lectureId}`);
    } else {
      navigate('/survey');
    }
  }, [navigate]);

  // Build details for selected course
  const modalCourse = React.useMemo(() => {
    if (!modalCourseId) return null;
    const course = (Array.isArray(allCourses) ? allCourses : []).find(c => Number(c.id) === Number(modalCourseId));
    if (!course) return null;
    const relatedLectures = (Array.isArray(lectures) ? lectures : []).filter(lec => {
      const cid = Number(typeof lec.course === 'object' ? lec.course?.id : lec.course);
      return cid === Number(course.id);
    });
    const mapLecture = (lec) => ({
      id: lec.id,
      day: lec.day,
      time: String(lec.starttime || '').slice(0,5),
      room: getRoomName(lec),
      instructor: getInstructorNames(lec),
    });
    return {
      id: course.id,
      title: course.title || course.name || course.slug,
      credits: course.credits || 0,
      programs: Array.isArray(course.programs) ? course.programs : [],
      lectures: relatedLectures.map(mapLecture),
    };
  }, [modalCourseId, allCourses, lectures, getInstructorNames, getRoomName]);

  // ESC key closes modal
  useEffect(() => {
    if (!modalCourseId) return;
    const onKey = (e) => { if (e.key === 'Escape') closeCourseModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalCourseId]);

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="courses-page">
      {/* <PlexusBackground /> */}
      <header className="courses-header">
        <h1>مقرراتي</h1>
      
      </header>

      <div className="courses-stats">
        <div className="stat-card-contact">
          <h3>إجمالي المقررات</h3>
          <div className="stat-number-contact">{enrolledCourseCards.length}</div>
          <p>مقررات مسجلة هذا الفصل</p>
        </div>
        <div className="stat-card-contact">
          <h3>إجمالي المحاضرات</h3>
          <div className="stat-number-contact">{totalLecturesCount}</div>
          <p>محاضرات ضمن مقرراتك</p>
        </div>
      </div>

      <main className="courses-content">
        <div className="courses-grid">
          {combinedLoading && (
            <div className="course-card" style={{ textAlign: 'center' }}>جارٍ التحميل...</div>
          )}
          {!combinedLoading && combinedError && (
            <div className="course-card" style={{ textAlign: 'center', color: 'red' }}>خطأ: {combinedError}</div>
          )}
          {!combinedLoading && !combinedError && enrolledCourseCards.length === 0 && (
            <div className="course-card  text-gray-800 " style={{ textAlign: 'center' }}>لا توجد مقررات مسجلة</div>
          )}
          {!combinedLoading && !combinedError && enrolledCourseCards.map(course => (
            <div key={course.id} className="course-card">
              <div className="course-header">
                <h3 className='!w-2/3'>{course.name}</h3>
                <span className="course-credits !w-fit  text-left"> المحاضرات: {course.sessionsCount}</span>
              </div>
              
              <div className="course-info">
                <p><strong>المحاضر:</strong> {course.instructor}</p>
                <p><strong>القاعة:</strong> {course.room}</p>
                <p><strong>المحاضرة القادمة:</strong> {course.nextClass}</p>
              </div>
              
              <div className="course-actions">
                <button type="button" className="btn btn-primary" onClick={() => openCourseModal(course.id)}>عرض التفاصيل</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={goToDegreesPage}
                >
                  الدرجات
                </button>
                <button
                  type="button"
                  className={`btn btn-secondary ${!course.hasDegree ? 'is-disabled' : ''}`}
                  aria-disabled={!course.hasDegree}
                  disabled={!course.hasDegree}
                  title={course.hasDegree ? '' : 'سيتم تفعيل زر الاستبيان بعد تسجيل درجاتك لهذه المادة'}
                  onClick={course.hasDegree ? (() => goToSurvey(course.representativeLectureId, true)) : undefined}
                >
                  استبيان
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
      {/* Course details overlay */}
      {modalCourse && (
        <div className="course-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeCourseModal(); }}>
          <div className="course-modal" role="dialog" aria-modal="true" aria-labelledby="course-modal-title">
            <div className="course-modal-header">
              <h3 id="course-modal-title">{modalCourse.title}</h3>
              <button className="course-modal-close" aria-label="Close" onClick={closeCourseModal}>×</button>
            </div>
            <div className="course-modal-body">
              <div className="course-modal-meta">
                {Array.isArray(modalCourse.programs) && modalCourse.programs.length > 0 && (
                  <span className="courses-badge alt">البرامج المرتبطة: {modalCourse.programs.length}</span>
                )}
              </div>
              <div className="course-modal-section">
                <h4>المحاضرات</h4>
                {modalCourse.lectures.length === 0 ? (
                  <div className="course-modal-empty">لا توجد محاضرات مرتبطة حالياً</div>
                ) : (
                  <ul className="course-lectures-list">
                    {modalCourse.lectures.map(lec => (
                      <li key={lec.id} className="course-lecture-item">
                        <div className="lec-row">
                          <span className="lec-day">{lec.day}</span>
                          <span className="lec-time">{lec.time}</span>
                        </div>
                        <div className="lec-row">
                          <span className="lec-room">{lec.room}</span>
                          <span className="lec-instructor">{lec.instructor}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="course-modal-actions">
              <button className="btn btn-primary" onClick={closeCourseModal}>حسناً</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Courses; 