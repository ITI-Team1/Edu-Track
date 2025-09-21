import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/enrollment.css';

// API imports
import { fetchCourses } from '../services/courseApi';
import { fetchFaculties } from '../services/facultyApi';
import { fetchPrograms } from '../services/programApi';
import { fetchStudents, enrollStudents } from '../services/enrollmentApi';

// Component imports
import UploadExcel from './UploadUsersData';
import Spinner from './Spinner';

// Constants
const ITEM_HEIGHT = 80;
const OVERSCAN = 6;
const DEFAULT_CONTAINER_HEIGHT = 380;
const DEBOUNCE_DELAY = 500;
const AUTO_DISMISS_DELAY = 4000;

// User permission constants
const SUPER_USER_GROUPS = [1, 6]; // مدير النظام (1) or رئيس الجامعة (6)

const Enrollment = () => {
  // ===== STATE MANAGEMENT =====
  
  // Data states
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterName, setFilterName] = useState('');
  const [debouncedName, setDebouncedName] = useState('');

  // Virtualization states
  const scrollRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(DEFAULT_CONTAINER_HEIGHT);

  // ===== HOOKS =====
  const { user } = useAuth();
  const location = useLocation();

  // ===== MEMOIZED VALUES =====
  
  // User permissions and data
  const userPermissions = useMemo(() => {
    if (!user) return { isSuperUser: false, facultyId: null, programId: null };
    
    const isSuperUser = user.groups?.some(group => {
      const groupId = typeof group === 'object' ? group.id : group;
      return SUPER_USER_GROUPS.includes(groupId);
    }) || false;
    
    const facultyId = user.faculty?.id || user.faculty_id || user.faculty;
    const programId = user.program?.id || user.program_id || user.program;
    
    return { isSuperUser, facultyId, programId };
  }, [user]);

  // Quick lookup maps for performance
  const lookupMaps = useMemo(() => ({
    faculty: (faculties || []).reduce((map, faculty) => {
      map[String(faculty.id)] = faculty.name;
      return map;
    }, {}),
    program: (programs || []).reduce((map, program) => {
      map[String(program.id)] = program.name;
      return map;
    }, {})
  }), [faculties, programs]);

  // Quick lookup of full program objects by id (to access faculty for each course's programs)
  const programsById = useMemo(() => {
    const map = {};
    (programs || []).forEach(p => {
      map[String(p.id)] = p;
    });
    return map;
  }, [programs]);

  // Filtered programs based on selected faculty
  const filteredPrograms = useMemo(() => {
    if (!filterFaculty) return programs || [];
    
    return (programs || []).filter(program => 
      [program.faculty, program.faculty_id, program.faculty?.id]
        .some(id => String(id) === String(filterFaculty))
    );
  }, [programs, filterFaculty]);

  // Filtered courses based on faculty and program
  const filteredCourses = useMemo(() => {
    let courseList = Array.isArray(courses) ? [...courses] : [];
    
    const getProgramId = program => program && typeof program === 'object' ? program.id : program;
    const getCourseProgramIds = course => 
      Array.isArray(course?.programs) ? course.programs.map(getProgramId) : [];

    if (filterProgram) {
      courseList = courseList.filter(course =>
        getCourseProgramIds(course).some(programId => 
          String(programId) === String(filterProgram)
        )
      );
    }

    if (filterFaculty) {
      const facultyProgramIds = (programs || [])
        .filter(program => 
          [program.faculty, program.faculty_id, program.faculty?.id]
            .some(id => String(id) === String(filterFaculty))
        )
        .map(program => String(program.id));
      
      if (facultyProgramIds.length) {
        courseList = courseList.filter(course =>
          getCourseProgramIds(course).some(programId => 
            facultyProgramIds.includes(String(programId))
          )
        );
      }
    }
    
    return courseList;
  }, [courses, programs, filterFaculty, filterProgram]);

  // ===== REACT QUERY =====
  
  const { 
    data: usersData, 
    isLoading: usersLoading, 
    error: usersError, 
    refetch: refetchUsers 
  } = useQuery({
    queryKey: ['students', filterLevel, debouncedName],
    queryFn: () => fetchStudents(user, {
      level: filterLevel,
      name: debouncedName
    }),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: !!user,
  });

  const { refetch: refetchCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
    enabled: false
  });

  const { refetch: refetchStudents } = useQuery({
    queryKey: ['students'],
    queryFn: fetchStudents,
    enabled: false
  });

  // ===== FILTERED DATA =====
  
  const filteredStudents = useMemo(() => {
    const students = usersData?.results || usersData || [];
    
    return (Array.isArray(students) ? students : []).filter(student => {
      const facultyMatch = !filterFaculty || 
        [student.faculty, student.faculty_id, student.faculty?.id]
          .some(id => String(id) === String(filterFaculty));
      
      const programMatch = !filterProgram || 
        [student.program, student.program_id, student.program?.id]
          .some(id => String(id) === String(filterProgram));
      
      const levelMatch = !filterLevel || String(student.level || '') === String(filterLevel);
      
      const nameText = `${student.first_name || ''} ${student.last_name || ''} ${student.username || ''} ${student.email || ''}`.toLowerCase();
      const nameMatch = !debouncedName || nameText.includes(debouncedName.toLowerCase());
      
      return facultyMatch && programMatch && levelMatch && nameMatch;
    });
  }, [usersData, filterFaculty, filterProgram, filterLevel, debouncedName]);

  // ===== VIRTUALIZATION CALCULATIONS =====
  
  const virtualizationData = useMemo(() => {
    const totalCount = filteredStudents.length;
    const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + OVERSCAN * 2;
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
    const endIndex = Math.min(totalCount, startIndex + visibleCount);
    
    return {
      totalCount,
      startIndex,
      endIndex,
      topSpacer: startIndex * ITEM_HEIGHT,
      bottomSpacer: (totalCount - endIndex) * ITEM_HEIGHT,
      visibleStudents: filteredStudents.slice(startIndex, endIndex)
    };
  }, [filteredStudents, containerHeight, scrollTop]);

  // ===== UTILITY FUNCTIONS =====
  
  const translateToArabic = (message) => {
    if (!message) return '';
    
    const translations = {
      'No lectures found for the given courses.': 'لا توجد محاضرات مسجلة لهذه المقررات.',
      'Failed to load users': 'فشل تحميل المستخدمين',
      'Failed to enroll': 'فشل التسجيل',
      'NetworkError': 'خطأ في الشبكة',
      'Unauthorized': 'غير مصرح بالدخول',
      'Forbidden': 'غير مسموح لك بتنفيذ هذه العملية',
      'Not Found': 'غير موجود',
    };
    
    const msg = String(message);
    
    if (translations[msg]) return translations[msg];
    if (msg.includes('No lectures found')) return 'لا توجد محاضرات مسجلة لهذه المقررات.';
    if (msg.includes('detail') && msg.includes('Not Found')) return 'غير موجود';
    
    return msg;
  };

  // ===== EVENT HANDLERS =====
  
  const handleEnroll = async (e) => {
    e.preventDefault();
    
    if (selectedStudents.length === 0 || selectedCourses.length === 0) {
      setError('الرجاء اختيار طالب واحد على الأقل ومقرر واحد على الأقل.');
      return;
    }
    // Faculty validation: ensure each selected student belongs to a faculty compatible with selected courses
    try {
      // 1) Resolve selected students and courses objects
      const allStudents = (usersData?.results || usersData || []);
      const studentsById = new Map((Array.isArray(allStudents) ? allStudents : []).map(s => [String(s.id), s]));
      const chosenStudents = selectedStudents.map(id => studentsById.get(String(id))).filter(Boolean);
      const chosenCourses = selectedCourses.map(cid => (Array.isArray(courses) ? courses.find(c => c.id === cid) : null)).filter(Boolean);

      // 2) Compute set of faculty IDs covered by the selected courses (via their programs)
      const courseFacultyIds = new Set();
      const getProgramId = (prog) => (prog && typeof prog === 'object') ? prog.id : prog;
      chosenCourses.forEach(course => {
        const courseProgramIds = Array.isArray(course?.programs) ? course.programs.map(getProgramId) : [];
        courseProgramIds.forEach(pid => {
          const prog = programsById[String(pid)];
          const facId = (prog && (prog.faculty?.id ?? prog.faculty_id ?? prog.faculty)) ?? null;
          if (facId != null) courseFacultyIds.add(String(facId));
        });
      });

      // If we cannot determine any faculty from the courses, block to avoid cross-faculty enrollment
      if (courseFacultyIds.size === 0) {
        setError('تعذر تحديد كلية المقررات المختارة. يرجى التأكد من ربط البرامج بالمقررات أو تحديد مقررات صحيحة.');
        return;
      }

      // 3) Check each student's faculty against the course faculties set
      const getStudentFacultyId = (stu) => (
        (stu?.faculty && typeof stu.faculty === 'object' ? stu.faculty.id : (stu?.faculty_id ?? stu?.faculty))
      );
      const mismatchedStudents = chosenStudents.filter(stu => {
        const sfid = getStudentFacultyId(stu);
        if (sfid == null) return true; // no faculty -> treat as mismatch
        return !courseFacultyIds.has(String(sfid));
      });

      if (mismatchedStudents.length > 0) {
        // Build a readable Arabic message listing first few names/usernames
        const names = mismatchedStudents.slice(0, 5).map(stu => {
          const name = `${stu?.first_name || ''} ${stu?.last_name || ''}`.trim();
          return name || stu?.username || `ID ${stu?.id}`;
        }).join('، ');
        const more = mismatchedStudents.length > 5 ? ` و${mismatchedStudents.length - 5} آخرين` : '';
        setError(`لا يمكن تسجيل الطلاب في مقررات من كلية مختلفة. الطلاب غير المتوافقين: ${names}${more}. يرجى اختيار مقررات من نفس كلية الطالب.`);
        return;
      }
    } catch (_e) {
      // Fallback: if validation itself fails, show a safe error and stop
      setError('حدث خطأ أثناء التحقق من الكليات. يرجى المحاولة مرة أخرى.');
      return;
    }

    try {
      setError(null);
      setSuccess('');
      setSubmitting(true);
      
      const results = await enrollStudents(selectedStudents, selectedCourses);
      const failed = results.filter(result => result.status === 'rejected');
      
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
    } finally {
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
      const allCourseIds = filteredCourses.map(course => course.id);
      setSelectedCourses(allCourseIds);
    } else {
      setSelectedCourses([]);
    }
  };

  const handleStudentSelection = (studentId, checked) => {
    const idStr = String(studentId);
    
    if (checked) {
      setSelectedStudents(prev => 
        prev.includes(idStr) ? prev : [...prev, idStr]
      );
    } else {
      setSelectedStudents(prev => 
        prev.filter(id => id !== idStr)
      );
    }
  };

  const handleCourseSelection = (courseId, checked) => {
    if (checked) {
      setSelectedCourses(prev => 
        prev.includes(courseId) ? prev : [...prev, courseId]
      );
    } else {
      setSelectedCourses(prev => 
        prev.filter(id => id !== courseId)
      );
    }
  };

  const handleUploadSuccess = (message) => {
    setSuccess(message || 'تم رفع الملف بنجاح');
    refetchCourses?.();
    refetchStudents?.();
  };

  const handleUploadError = (error) => {
    setError(error || 'حدث خطأ أثناء رفع الملف');
  };

  // ===== EFFECTS =====
  
  // Load initial data
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

  // Initialize filters based on user permissions
  useEffect(() => {
    if (!user || !faculties.length || !programs.length) return;
    
    const { facultyId, programId } = userPermissions;
    
    if (facultyId && !filterFaculty) {
      setFilterFaculty(String(facultyId));
    }
    
    if (programId && !filterProgram) {
      setFilterProgram(String(programId));
    }
  }, [user, userPermissions, faculties.length, programs.length, filterFaculty, filterProgram]);

  // Debounce name filter
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(filterName), DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [filterName]);

  // Handle program filter changes when faculty changes
  useEffect(() => {
    if (filterFaculty && filterProgram) {
      const programExists = filteredPrograms.some(
        program => String(program.id) === String(filterProgram)
      );
      if (!programExists) {
        setFilterProgram('');
      }
    }
  }, [filterFaculty, filteredPrograms, filterProgram]);

  // Measure container height for virtualization
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    
    const measureHeight = () => setContainerHeight(element.clientHeight || DEFAULT_CONTAINER_HEIGHT);
    measureHeight();
    
    const resizeObserver = new ResizeObserver(measureHeight);
    resizeObserver.observe(element);
    
    return () => resizeObserver.disconnect();
  }, []);

  // Handle refresh events
  useEffect(() => {
    const handleRefresh = () => refetchUsers();
    
    window.addEventListener('enrollment-refresh', handleRefresh);
    return () => window.removeEventListener('enrollment-refresh', handleRefresh);
  }, [refetchUsers]);

  // Handle URL refresh parameter
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      if (params.has('refresh')) {
        refetchUsers();
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, [location.search, refetchUsers]);

  // Auto-dismiss messages
  useEffect(() => {
    if (!success && !error) return;
    
    const timer = setTimeout(() => {
      setSuccess('');
      setError(null);
    }, AUTO_DISMISS_DELAY);
    
    return () => clearTimeout(timer);
  }, [success, error]);

  // ===== RENDER HELPERS =====
  
  const renderStudentLabel = (student) => {
    const facultyId = String(
      (student.faculty && typeof student.faculty === 'object' ? student.faculty.id : student.faculty_id) ??
      student.faculty
    );
    const programId = String(
      (student.program && typeof student.program === 'object' ? student.program.id : student.program_id) ??
      student.program
    );
    
    const facultyName = (student.faculty && typeof student.faculty === 'object' && student.faculty.name) || 
                       lookupMaps.faculty[facultyId] || 'كلية غير محددة';
    const programName = (student.program && typeof student.program === 'object' && student.program.name) || 
                        lookupMaps.program[programId] || 'برنامج غير محدد';
    const levelName = student.level || 'مستوى غير محدد';
    const displayName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
    
    if (displayName) {
      return (
        <>
          <span className="student-name">{displayName}</span>
          {student.username && (
            <span className="student-username"> ({student.username})</span>
          )}
          <br />
          <span className="student-meta">{facultyName} | {programName} | {levelName}</span>
        </>
      );
    } else if (student.username) {
      return (
        <>
          <span className="student-name">{student.username}</span>
          <br />
          <span className="student-meta">{facultyName} | {programName} | {levelName}</span>
        </>
      );
    }
    
    return null;
  };

  // ===== LOADING STATE =====
  
  const combinedLoading = loading || usersLoading;
  const combinedError = error || usersError?.message;

  if (combinedLoading) {
    return <div className="loading-container">
    <span className='text-blue-800'>اخميل المزيد</span>
        <Spinner size='lg' color='primary' />
      </div>;
  }

  // ===== MAIN RENDER =====
  
  return (
    <div className="enrollment-page" dir="rtl">
      <h1>تسجيل الطلاب و المقررات</h1>
      
      {success && (
        <div className="success-message" role="status">
          {success}
        </div>
      )}
      
      {combinedError && (
        <div className="error-message" role="alert">
          خطأ: {translateToArabic(combinedError)}
        </div>
      )}
      
      {/* Filters Section */}
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
          disabled={!userPermissions.isSuperUser}
        >
          <option value="">كل الكليات</option>
          {faculties.map(faculty => (
            <option key={faculty.id} value={faculty.id}>
              {faculty.name}
            </option>
          ))}
        </select>
        
        <select 
          value={filterProgram} 
          onChange={e => setFilterProgram(e.target.value)}
          disabled={!userPermissions.isSuperUser}
        >
          <option value="">كل البرامج</option>
          {filteredPrograms.map(program => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </select>
        
        <select 
          value={filterLevel} 
          onChange={e => setFilterLevel(e.target.value)}
          disabled={!userPermissions.isSuperUser}
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
        
        {!userPermissions.isSuperUser && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            * فلاتر الكلية والبرنامج والمستوى ثابتة بناءً على صلاحياتك - يمكنك البحث بالاسم
          </div>
        )}
      </div>

      {/* Main Form */}
      <form onSubmit={handleEnroll} className="enrollment-form two-col">
        {/* Students Selection */}
        <div className="form-group section-card">
          <div className="group-head">
            <label>
              اختر الطلاب
              <span className="enr-badge">
                {selectedStudents.length}/{filteredStudents.length}
              </span>
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
            <div style={{ 
              paddingTop: virtualizationData.topSpacer, 
              paddingBottom: virtualizationData.bottomSpacer 
            }}>
              <div className="students-checkbox-group">
                {virtualizationData.visibleStudents.map((student) => {
                  const idStr = String(student.id);
                  const checked = selectedStudents.includes(idStr);
                  
                  return (
                    <div 
                      key={student.id} 
                      className="checkbox-item" 
                      style={{ height: ITEM_HEIGHT }}
                    >
                      <input
                        type="checkbox"
                        id={`student-${student.id}`}
                        value={idStr}
                        checked={checked}
                        onChange={(e) => handleStudentSelection(student.id, e.target.checked)}
                      />
                      <label htmlFor={`student-${student.id}`}>
                        {renderStudentLabel(student)}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Courses Selection */}
        <div className="form-group section-card">
          <div className="group-head">
            <label>
              اختر المقررات
              <span className="enr-badge">
                {selectedCourses.length}/{filteredCourses.length}
              </span>
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
                  <input 
                    type="checkbox" 
                    id={`course-${course.id}`} 
                    value={course.id} 
                    checked={selectedCourses.includes(course.id)} 
                    onChange={(e) => handleCourseSelection(course.id, e.target.checked)}
                  />
                  <label htmlFor={`course-${course.id}`}>
                    {course.title}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Action Section */}
        <div className="enroll-actions">
          <div className="enroll-actions__inner enroll-card no-accent">
            <button 
              type="submit" 
              className="btn btn-primary enroll-submit" 
              disabled={submitting}
            >
              {submitting ? 'جارٍ التسجيل...' : 'تسجيل'}
            </button>
            
            <div className="upload-section">
              <h3>رفع ملف Excel</h3>
              <UploadExcel 
                onUploadComplete={handleUploadSuccess}
                onError={handleUploadError}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Enrollment;