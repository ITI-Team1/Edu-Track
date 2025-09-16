import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import '../styles/enrollment.css';
import { fetchCourses } from '../services/courseApi';
import { fetchFaculties } from '../services/facultyApi';
import { fetchPrograms } from '../services/programApi';
import { fetchStudents, enrollStudents } from '../services/enrollmentApi';
import UploadExcel from './UploadUsersData';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Enrollment() {
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterName, setFilterName] = useState('');
  const [debouncedName, setDebouncedName] = useState('');

  // Get current user from auth context
  const { user } = useAuth();

  // Virtualization state for students list
  const scrollRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(380);
  const ITEM_HEIGHT = 80;
  const OVERSCAN = 6;

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

  // Get user's faculty and program
  const userFacultyId = useMemo(() => {
    if (!user) return null;
    return user.faculty?.id || user.faculty_id || user.faculty;
  }, [user]);

  const userProgramId = useMemo(() => {
    if (!user) return null;
    return user.program?.id || user.program_id || user.program;
  }, [user]);

  // Check if user is superuser (can change filters)
  const isSuperUser = useMemo(() => {
    if (!user?.groups) return false;
    return user.groups.some(group => {
      const groupId = typeof group === 'object' ? group.id : group;
      return groupId === 1 || groupId === 6; // مدير النظام (1) or رئيس الجامعة (6)
    });
  }, [user]);

  // Check if user has faculty and program assigned
  const hasFacultyAndProgram = userFacultyId && userProgramId;

  // Debug logging for user object structure
  useEffect(() => {
    if (user) {
      console.log('=== ENROLLMENT COMPONENT v6.0 ===');
      console.log('User object:', user);
      console.log('User groups:', user.groups);
      console.log('User faculty:', user.faculty);
      console.log('User program:', user.program);
      console.log('Extracted faculty ID:', userFacultyId);
      console.log('Extracted program ID:', userProgramId);
      console.log('Has faculty and program:', hasFacultyAndProgram);
      console.log('Is superuser:', isSuperUser);
      console.log('Username:', user.username);
      console.log('Email:', user.email);
    }
  }, [user, userFacultyId, userProgramId, hasFacultyAndProgram, isSuperUser]);

  // Initialize filters based on user's faculty and program
  useEffect(() => {
    if (!user || !faculties.length || !programs.length) return;
    
    console.log('=== INITIALIZING FILTERS ===');
    console.log('User faculty ID:', userFacultyId);
    console.log('User program ID:', userProgramId);
    console.log('Current filter faculty:', filterFaculty);
    console.log('Current filter program:', filterProgram);
    console.log('Is superuser:', isSuperUser);
    
    // Only set filters if they haven't been set yet
    if (userFacultyId && !filterFaculty) {
      console.log('Setting default faculty filter to:', userFacultyId);
      setFilterFaculty(String(userFacultyId));
    }
    
    if (userProgramId && !filterProgram) {
      console.log('Setting default program filter to:', userProgramId);
      setFilterProgram(String(userProgramId));
    }
  }, [user, userFacultyId, userProgramId, faculties.length, programs.length]); // Removed filterFaculty and filterProgram from deps

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

  // Debounce name filter
  useEffect(() => {
    const t = setTimeout(() => setDebouncedName(filterName), 500);
    return () => clearTimeout(t);
  }, [filterName]);

  // React Query: fetch and cache students using the enrollmentApi service
  const { data: usersData, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useQuery({
    queryKey: ['students', filterLevel, debouncedName], // Removed userFacultyId and userProgramId from query key
    queryFn: () => {
      console.log('=== REACT QUERY CALLING fetchStudents ===');
      console.log('User passed to fetchStudents:', user);
      return fetchStudents(user, {
        level: filterLevel,
        name: debouncedName
      });
    },
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: !!user,
  });

  // Debug the usersData
  useEffect(() => {
    if (usersData) {
      console.log('=== USERS DATA RECEIVED ===');
      console.log('usersData:', usersData);
      console.log('usersData.results:', usersData.results);
      console.log('usersData.results length:', usersData.results?.length);
    }
  }, [usersData]);

  // Rerender users list when UploadUsersData signals
  const location = useLocation();
  useEffect(() => {
    const onRefresh = () => {
      refetchUsers();
    };
    window.addEventListener('enrollment-refresh', onRefresh);
    return () => window.removeEventListener('enrollment-refresh', onRefresh);
  }, [refetchUsers]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      if (params.has('refresh')) {
        refetchUsers();
      }
    } catch {}
  }, [location.search, refetchUsers]);

  // Client-side filtered students based on selects and debounced name
  const filteredStudents = useMemo(() => {
    const src = usersData?.results || usersData || [];
    console.log('=== CLIENT-SIDE FILTERING ===');
    console.log('Total students from API:', src.length);
    console.log('Filter faculty:', filterFaculty);
    console.log('Filter program:', filterProgram);
    console.log('Filter level:', filterLevel);
    console.log('Filter name:', debouncedName);
    
    const filtered = (Array.isArray(src) ? src : []).filter(u => {
      const facOk = !filterFaculty || [u.faculty, u.faculty_id, u.faculty?.id].some(v => String(v) === String(filterFaculty));
      const progOk = !filterProgram || [u.program, u.program_id, u.program?.id].some(v => String(v) === String(filterProgram));
      const levelOk = !filterLevel || String(u.level || '') === String(filterLevel);
      const name = `${u.first_name || ''} ${u.last_name || ''} ${u.username || ''} ${u.email || ''}`.toLowerCase();
      const nameOk = !debouncedName || name.includes(debouncedName.toLowerCase());
      
      if (facOk && progOk && levelOk && nameOk) {
        console.log('Student matches filters:', u.username, 'Faculty:', u.faculty?.id, 'Program:', u.program?.id);
      }
      
      return facOk && progOk && levelOk && nameOk;
    });
    
    console.log('Filtered students count:', filtered.length);
    return filtered;
  }, [usersData, filterFaculty, filterProgram, filterLevel, debouncedName]);

  // Measure container height
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setContainerHeight(el.clientHeight || 380);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Virtual window calculations
  const totalCount = filteredStudents.length;
  const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + OVERSCAN * 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(totalCount, startIndex + visibleCount);
  const topSpacer = startIndex * ITEM_HEIGHT;
  const bottomSpacer = (totalCount - endIndex) * ITEM_HEIGHT;
  const visibleStudents = filteredStudents.slice(startIndex, endIndex);

  // Programs filtered by selected faculty
  const filteredPrograms = useMemo(() => {
    const list = programs || [];
    if (!filterFaculty) return list;
    return list.filter((pr) => [pr.faculty, pr.faculty_id, pr.faculty?.id].some((v) => String(v) === String(filterFaculty)));
  }, [programs, filterFaculty]);

  // Clear program filter if it doesn't belong to current faculty
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
      setSubmitting(true);
      
      const results = await enrollStudents(selectedStudents, selectedCourses);

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
      setError(translateToArabic(err.message) || 'فشل التسجيل');
    }
    finally {
      setSubmitting(false);
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

  const handleSelectAllCourses = (checked) => {
    if (checked) {
      const allCourseIds = filteredCourses.map(c => c.id);
      setSelectedCourses(allCourseIds);
    } else {
      setSelectedCourses([]);
    }
  };

  // Courses filtered by Program and Faculty
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

  // Translate common backend messages to Arabic
  const translateToArabic = (msg) => {
    if (!msg) return '';
    const m = String(msg);
    const map = {
      'No lectures found for the given courses.': 'لا توجد محاضرات مسجلة لهذه المقررات.',
      'Failed to load users': 'فشل تحميل المستخدمين',
      'Failed to enroll': 'فشل التسجيل',
      'NetworkError': 'خطأ في الشبكة',
      'Unauthorized': 'غير مصرح بالدخول',
      'Forbidden': 'غير مسموح لك بتنفيذ هذه العملية',
      'Not Found': 'غير موجود',
    };
    if (map[m]) return map[m];
    if (m.includes('No lectures found')) return 'لا توجد محاضرات مسجلة لهذه المقررات.';
    if (m.includes('detail') && m.includes('Not Found')) return 'غير موجود';
    return m;
  };

  // Auto-dismiss success/error
  useEffect(() => {
    if (!success && !combinedError) return;
    const t = setTimeout(() => {
      setSuccess('');
      setError(null);
    }, 4000);
    return () => clearTimeout(t);
  }, [success, combinedError]);

  if (combinedLoading) return <div>جارٍ التحميل...</div>;

  return (
    <div className="enrollment-page" dir="rtl">
      <h1>تسجيل الطلاب و المقررات</h1>
      
      {success && <div className="success-message" role="status">{success}</div>}
      {combinedError && (
        <div className="error-message" role="alert">
          خطأ: {translateToArabic(combinedError)}
          {String(combinedError).includes('No lectures found') && (
            <>
              <br />
              <small>يبدو أنه لا توجد محاضرات مسجلة لهذه المقررات. الرجاء التأكد من إنشاء محاضرات لهذه المقررات أولاً.</small>
            </>
          )}
        </div>
      )}
      
      <div className="filters section-card">
        <input 
          type="text" 
          placeholder="فلترة حسب الاسم" 
          value={filterName} 
          onChange={e => setFilterName(e.target.value)}
        />
        <select 
          value={filterFaculty} 
          onChange={e => setFilterFaculty(e.target.value)}
          disabled={!isSuperUser}
        >
          <option value="">كل الكليات</option>
          {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select 
          value={filterProgram} 
          onChange={e => setFilterProgram(e.target.value)}
          disabled={!isSuperUser}
        >
          <option value="">كل البرامج</option>
          {filteredPrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select 
          value={filterLevel} 
          onChange={e => setFilterLevel(e.target.value)}
          disabled={!isSuperUser}
        >
          <option value="">كل المستويات</option>
          <option value="المستوى الأول">المستوى الأول</option>
          <option value="المستوى الثاني">المستوى الثاني</option>
          <option value="المستوى الثالث">المستوى الثالث</option>
          <option value="المستوى الرابع">المستوى الرابع</option>
          <option value="المستوى الخامس">المستوى الخامس</option>
          <option value="المستوى السادس">المستوى السادس</option>
          <option value="المستوى السابع">المستوى السابع</option>
        </select>
        {!isSuperUser && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            * فلاتر الكلية والبرنامج والمستوى ثابتة بناءً على صلاحياتك - يمكنك البحث بالاسم
          </div>
        )}
      </div>

      <form onSubmit={handleEnroll} className="enrollment-form two-col">
        <div className="form-group section-card">
          <div className="group-head">
            <label>
              اختر الطلاب
              <span className="enr-badge">{selectedStudents.length}/{filteredStudents.length}</span>
            </label>
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
          <div
            className="scroll-area"
            ref={scrollRef}
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          >
            <div style={{ paddingTop: topSpacer, paddingBottom: bottomSpacer }}>
              <div className="students-checkbox-group">
              {visibleStudents.map((student) => {
                const idStr = String(student.id);
                const checked = selectedStudents.includes(idStr);
                return (
                  <div key={student.id} className="checkbox-item" style={{ height: ITEM_HEIGHT }}>
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
        </div>

        <div className="form-group section-card">
          <div className="group-head">
            <label>
              اختر المقررات
              <span className="enr-badge">{selectedCourses.length}/{filteredCourses.length}</span>
            </label>
            <div className="checkbox-item inline">
              <input
                type="checkbox"
                id="courses-select-all"
                checked={selectedCourses.length > 0 && selectedCourses.length === filteredCourses.length}
                onChange={(e) => handleSelectAllCourses(e.target.checked)}
              />
              <label htmlFor="courses-select-all">تحديد الكل</label>
            </div>
          </div>
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
            <button type="submit" className="btn btn-primary enroll-submit" disabled={submitting}>
              {submitting ? 'جارٍ التسجيل...' : 'تسجيل'}
            </button>
            <UploadExcel />
          </div>
        </div>
      </form>
    </div>
  );
}

export default Enrollment;
