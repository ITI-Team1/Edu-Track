import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import '../styles/enrollment.css';
import api from '../services/api';
import { fetchCourses } from '../services/courseApi';
import { fetchFaculties } from '../services/facultyApi';
import { fetchPrograms } from '../services/programApi';
import UploadExcel from './UploadUsersData';


function Enrollment() {
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');


  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterName, setFilterName] = useState('');
  const [debouncedName, setDebouncedName] = useState('');


  // Quick lookup maps for faculty/program names
  const facultyNameMap = useMemo(() => {
    const m = {};
    (faculties || []).forEach((f) => {
      m[String(f.id)] = f.name;
    });
    return m;
  }, [faculties]);

  const programNameMap = useMemo(() => {
    const m = {};
    (programs || []).forEach((p) => {
      m[String(p.id)] = p.name;
    });
    return m;
  }, [programs]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [coursesData, facultiesData, programsData] = await Promise.all([
          fetchCourses(),
          fetchFaculties(),
          fetchPrograms(),
        ]);
        setCourses(coursesData);
        setFaculties(facultiesData.results || facultiesData);
        setPrograms(programsData.results || programsData);
      } catch (err) {
        setError(err.message || 'حدث خطأ غير متوقع');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);


  // Debounce name filter (0.5s)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedName(filterName), 500);
    return () => clearTimeout(t);
  }, [filterName]);

  // React Query: fetch and cache users
  const fetchUsers = async () => {
    const res = await fetch(`${api.baseURL}/auth/users/`, { headers: api.getAuthHeaders() });
    if (!res.ok) throw new Error('فشل تحميل المستخدمين');
    return res.json();
  };

  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 1000 * 60, // 1 min
    gcTime: 1000 * 60 * 5, // 5 min
    refetchOnWindowFocus: false,
  });

  // Client-side filtered students based on selects and debounced name
  const filteredStudents = useMemo(() => {
    const src = usersData?.results || usersData || [];
    return (Array.isArray(src) ? src : []).filter(u => {
      const facOk = !filterFaculty || [u.faculty, u.faculty_id, u.faculty?.id].some(v => String(v) === String(filterFaculty));
      const progOk = !filterProgram || [u.program, u.program_id, u.program?.id].some(v => String(v) === String(filterProgram));
      const levelOk = !filterLevel || String(u.level || '') === String(filterLevel);
      const name = `${u.first_name || ''} ${u.last_name || ''} ${u.username || ''} ${u.email || ''}`.toLowerCase();
      const nameOk = !debouncedName || name.includes(debouncedName.toLowerCase());
      return facOk && progOk && levelOk && nameOk;
    });
  }, [usersData, filterFaculty, filterProgram, filterLevel, debouncedName]);

  // Programs filtered by selected faculty for the Program select
  const filteredPrograms = useMemo(() => {
    const list = programs || [];
    if (!filterFaculty) return list;
    return list.filter((pr) => [pr.faculty, pr.faculty_id, pr.faculty?.id].some((v) => String(v) === String(filterFaculty)));
  }, [programs, filterFaculty]);

  // If selected program doesn't belong to current faculty, clear it
  useEffect(() => {
    if (!filterProgram) return;
    const exists = (filteredPrograms || []).some((pr) => String(pr.id) === String(filterProgram));
    if (!exists) setFilterProgram('');
  }, [filterFaculty, filteredPrograms, filterProgram]);


  const handleEnroll = async (e) => {
    e.preventDefault();
    if (selectedStudents.length === 0 || selectedCourses.length === 0) {
      setError('الرجاء اختيار طالب واحد على الأقل ومقرر واحد على الأقل.');
      return;
    }
    try {
      setError(null);
      setSuccess('');
      // Backend endpoint accepts a SINGLE studentid and MULTIPLE courseids per request
      // so we call it once per selected student.
      const courseids = selectedCourses.map((id) => Number(id));
      const results = await Promise.allSettled(
        selectedStudents.map(async (sid) => {
          const res = await fetch(`${api.baseURL}/lecture/enroll/`, {
            method: 'POST',
            headers: api.getAuthHeaders(),
            body: JSON.stringify({ studentid: Number(sid), courseids }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            const msg = err?.detail || err?.message || 'فشل التسجيل';
            throw new Error(msg);
          }
          return res.json();
        })
      );

      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length === 0) {
        setSuccess('تم تسجيل جميع الطلاب بنجاح');
      } else if (failed.length === results.length) {
        throw new Error('فشل التسجيل لجميع الطلاب المحددين');
      } else {
        setSuccess(`تم بعض التسجيلات بنجاح. فشل: ${failed.length}/${results.length}`);
      }
      setSelectedStudents([]);
      setSelectedCourses([]);
    } catch (err) {
      setError(err.message || 'فشل التسجيل');
    }
  };


  const handleSelectAll = (checked) => {
    if (checked) {
      const allStudentIds = filteredStudents.map(student => String(student.id));
      setSelectedStudents(allStudentIds);
    } else {
      setSelectedStudents([]);
    }
  };

  // Fetch students with optional filters. If backend doesn't support filters, it will still return all users.
  const _fetchFilteredStudents = async ({ faculty, program, name }) => {
    const params = new URLSearchParams();
    if (faculty) params.append('faculty', faculty);
    if (program) params.append('program', program);
    if (name) params.append('name', name);
    const url = `${api.baseURL}/auth/users/${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, { headers: api.getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load users');
    return res.json();
  };

  // Courses filtered by Program and Faculty using same selects
  const filteredCourses = useMemo(() => {
    let list = Array.isArray(courses) ? [...courses] : [];
    const getProgId = (p) => (p && typeof p === 'object' ? p.id : p);
    const courseProgramIds = (c) => Array.isArray(c?.programs) ? c.programs.map(getProgId) : [];

    if (filterProgram) {
      list = list.filter((c) => courseProgramIds(c).some((pid) => String(pid) === String(filterProgram)));
    }

    if (filterFaculty) {
      const programIdsForFaculty = (Array.isArray(programs) ? programs : [])
        .filter((pr) => [pr.faculty, pr.faculty_id, pr.faculty?.id].some((v) => String(v) === String(filterFaculty)))
        .map((pr) => String(pr.id));
      if (programIdsForFaculty.length) {
        list = list.filter((c) => courseProgramIds(c).some((pid) => programIdsForFaculty.includes(String(pid))));
      }
    }
    return list;
  }, [courses, programs, filterFaculty, filterProgram]);


  const combinedLoading = loading || usersLoading;
  const combinedError = error || usersError?.message;

  if (combinedLoading) return <div>جارٍ التحميل...</div>;
  if (combinedError) return <div className="error-message">خطأ: {combinedError}</div>;


  return (
    <div className="enrollment-page" dir="rtl">
      <h1>تسجيل الطلاب و المقررات</h1>
      {success && <div className="success-message">{success}</div>}
      
      <div className="filters section-card">
        <input type="text" placeholder="فلترة حسب الاسم" value={filterName} onChange={e => setFilterName(e.target.value)} />
        <select value={filterFaculty} onChange={e => setFilterFaculty(e.target.value)}>
          <option value="">كل الكليات</option>
          {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
          <option value="">كل البرامج</option>
          {filteredPrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
          <option value="">كل المستويات</option>
          <option value="المستوى الأول">المستوى الأول</option>
          <option value="المستوى الثاني">المستوى الثاني</option>
          <option value="المستوى الثالث">المستوى الثالث</option>
          <option value="المستوى الرابع">المستوى الرابع</option>
          <option value="المستوى الخامس">المستوى الخامس</option>
          <option value="المستوى السادس">المستوى السادس</option>
          <option value="المستوى السابع">المستوى السابع</option>
        </select>
      </div>


      <form onSubmit={handleEnroll} className="enrollment-form two-col">
        <div className="form-group section-card">
          <div className="group-head">
            <label>اختر الطلاب</label>
            <div className="checkbox-item inline">
              <input
                type="checkbox"
                id="students-select-all"
                checked={selectedStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              <label htmlFor="students-select-all">تحديد الكل</label>
            </div>
          </div>
          <div className="scroll-area">
            <div className="students-checkbox-group">
              {filteredStudents.map((student) => {
                const idStr = String(student.id);
                const checked = selectedStudents.includes(idStr);
                return (
                  <div key={student.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      id={`student-${student.id}`}
                      value={idStr}
                      checked={checked}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (e.target.checked) {
                          setSelectedStudents((prev) => (prev.includes(v) ? prev : [...prev, v]));
                        } else {
                          setSelectedStudents((prev) => prev.filter((id) => id !== v));
                        }
                      }}
                    />
                    <label htmlFor={`student-${student.id}`}>
                      {(() => {
                        const facId = String(
                          (student.faculty && typeof student.faculty === 'object' ? student.faculty.id : student.faculty_id) ??
                          student.faculty
                        );
                        const progId = String(
                          (student.program && typeof student.program === 'object' ? student.program.id : student.program_id) ??
                          student.program
                        );
                        const facName = (student.faculty && typeof student.faculty === 'object' && student.faculty.name) || facultyNameMap[facId] || 'كلية غير محددة';
                        const progName = (student.program && typeof student.program === 'object' && student.program.name) || programNameMap[progId] || 'برنامج غير محدد';
                        const levelName = student.level || 'مستوى غير محدد';
                        const displayName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
                        if (displayName) {
                          return (
                            <>
                              <span className="student-name">{displayName}</span>{' '}
                              {student.username ? (
                                <span className="student-username">({student.username})</span>
                              ) : null}
                              <br />
                              <span className="student-meta">{facName} | {progName} | {levelName}</span>
                            </>
                          );
                        } else if (student.username) {
                          return (
                            <>
                              <span className="student-name">{student.username}</span>
                              <br />
                              <span className="student-meta">{facName} | {progName} | {levelName}</span>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


        <div className="form-group section-card">
          <label>اختر المقررات</label>
          <div className="scroll-area">
            <div className="courses-checkbox-group">
              {filteredCourses.map(course => (
                <div key={course.id} className="checkbox-item">
                  <input type="checkbox" id={`course-${course.id}`} value={course.id} checked={selectedCourses.includes(course.id)} onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCourses((prev) => (prev.includes(course.id) ? prev : [...prev, course.id]));
                    } else {
                      setSelectedCourses((prev) => prev.filter(id => id !== course.id));
                    }
                  }} />
                  <label htmlFor={`course-${course.id}`}>{course.title}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="enroll-actions">
          <div className="enroll-actions__inner enroll-card no-accent">
            <button type="submit" className="btn btn-primary enroll-submit">تسجيل</button>
            <UploadExcel />
          </div>
        </div>
      </form>
    </div>
  );
}


export default Enrollment;