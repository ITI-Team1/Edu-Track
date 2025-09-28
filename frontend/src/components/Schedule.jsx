import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/schedule.css';
import { fetchLectures } from '../services/lectureApi';
import { fetchCourses } from '../services/courseApi';
import { fetchLocations } from '../services/locationApi';
import { fetchUserPermissions, fetchUsers } from '../services/userApi';
import { AttendanceAPI } from '../services/attendanceApi';
import toast from '../utils/toast';
import Spinner from './Spinner';
import ErrorBoundary from './ErrorBoundary';

function ScheduleInner() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Data
  const [lectures, setLectures] = useState([]);
  const [courses, setCourses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [selectedCourse, setSelectedCourse] = useState('');

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);


  // get user permissions using fetchUserPermissions
  const [permissions, setPermissions] = useState([]);
  useEffect(() => {
    fetchUserPermissions(user).then(permissions => {
      setPermissions(permissions);
      
    });
  }, [user]);


  // Load real data
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
    };
    load();
  }, [isAuthenticated]);

  // Helpers to resolve display names
  const getCourseTitle = useCallback((lec) => {
    if (lec.course && typeof lec.course === 'object') return lec.course.title;
    const c = courses.find(c => c.id === lec.course);
    return c ? c.title : lec.course;
  }, [courses]);
  const getInstructorNames = useCallback((lec) => {
    if (!lec) return '';
    // Prefer the server-provided instructor_details (added to LectureSerializer)
    const details = Array.isArray(lec.instructor_details) ? lec.instructor_details : [];
    let names = details.map(d => `${d.first_name || ''} ${d.last_name || ''}`.trim()).filter(Boolean);
    // Fallback to local users list if details are absent
    if (names.length === 0) {
      const ids = Array.isArray(lec.instructor)
        ? lec.instructor.map(ins => (typeof ins === 'object' ? ins.id : ins))
        : (lec.instructor ? [ (typeof lec.instructor === 'object' ? lec.instructor.id : lec.instructor) ] : []);
      names = ids.map(id => {
        const targetId = Number(id);
        const u = users.find(u => Number(u.id) === targetId);
        return u ? `${u.first_name} ${u.last_name}` : '';
      }).filter(Boolean);
    }
    return names.join('، ');
  }, [users]);
  const getRoomName = useCallback((lec) => {
    if (lec.location && typeof lec.location === 'object') return lec.location.name || lec.location.title || lec.location.slug;
    const l = locations.find(l => l.id === lec.location || l.slug === lec.location);
    return l ? l.name : lec.location;
  }, [locations]);

  // Normalize Arabic day names to canonical forms (match backend choices)
  const canonicalDays = ['السبت','الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس'];
  const dayMap = useMemo(() => ({
    'الاحد': 'الأحد', 'الأحد': 'الأحد', 'اﻷحد': 'الأحد',
    'السبت': 'السبت',
    'الاثنين': 'الإثنين', 'الإثنين': 'الإثنين',
    'الثلاثاء': 'الثلاثاء',
    'الاربعاء': 'الأربعاء', 'الأربعاء': 'الأربعاء',
    'الخميس': 'الخميس',
    'الجمعة': 'الجمعة',
  }), []);
  const normalizeDay = useCallback((d) => dayMap[(d || '').trim()] || d, [dayMap]);

  // Determine role from user groups (IDs/names): 3 = Doctor/TA, 2 = Student
  const { isDoctor, isStudent } = useMemo(() => {
    const groups = Array.isArray(user?.groups) ? user.groups : [];
    const getId = (g) => (g && typeof g === 'object') ? g.id : g;
    const getName = (g) => (g && typeof g === 'object') ? (g.name || '') : '';
    const isDoc = groups.some(g => getId(g) === 3 || getName(g).includes('دكاترة'));
    const isStu = groups.some(g => getId(g) === 2 || getName(g).includes('طلاب'));
    return { isDoctor: isDoc, isStudent: isStu };
  }, [user?.groups]);

  // Filter lectures for current user by role
  const userLectures = useMemo(() => {
    if (!user?.id) return [];
    const uidNum = Number(user.id);

    let filtered = [];
    if (isDoctor) {
      // Doctors: only lectures where they are among the instructors
      filtered = lectures.filter(lec => {
        const ids = Array.isArray(lec.instructor)
          ? lec.instructor.map(ins => (typeof ins === 'object' ? ins.id : ins)).map(Number)
          : (lec.instructor ? [Number(typeof lec.instructor === 'object' ? lec.instructor.id : lec.instructor)] : []);
        return ids.includes(uidNum);
      });
    } else if (isStudent) {
      // Students: lectures where they appear in the students list
      filtered = lectures.filter(lec => {
        const st = Array.isArray(lec.students) ? lec.students : [];
        const ids = st.map(s => (typeof s === 'object' && s !== null) ? s.id : s).map(Number);
        return ids.includes(uidNum);
      });
    } else {
      // Fallback (unknown role): show none
      filtered = [];
    }

    // Optional course dropdown filter applies to both roles
    if (selectedCourse) {
      const cid = Number(selectedCourse);
      filtered = filtered.filter(lec => (
        lec.course === cid || (typeof lec.course === 'object' && lec.course?.id === cid)
      ));
    }
    return filtered;
  }, [lectures, user?.id, selectedCourse, isDoctor, isStudent]);

  // Ref to weekly schedule section for PDF capture
  const weekRef = useRef(null);

  // Build "today" and "week" schedules
  const daysOrder = canonicalDays; // use canonical ordering starting with Saturday per backend choices
  const jsToArabic = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']; // 0..6
  const todayIndex = new Date().getDay();
  const todayName = normalizeDay(jsToArabic[todayIndex]);

  // Time formatting helpers
  const formatTime24 = (t) => (t || '').slice(0,5);
  const formatTime12 = (t) => {
    if (!t) return '';
    const [hhStr, mmStr] = t.split(':');
    let hh = parseInt(hhStr, 10);
    const mm = (mmStr || '00').slice(0,2);
    const suffix = hh >= 12 ? 'م' : 'ص';
    hh = hh % 12;
    if (hh === 0) hh = 12;
    return `${hh}:${mm} ${suffix}`;
  };
  const durationMinutes = (s, e) => {
    if (!s || !e) return 90;
    const [sh, sm] = s.split(':').map(Number);
    const [eh, em] = e.split(':').map(Number);
    return Math.max(0, (eh*60+em) - (sh*60+sm));
  };

  const todaySchedule = useMemo(() => {
    const list = userLectures.filter(lec => normalizeDay(lec.day) === todayName)
      .sort((a,b) => (a.starttime||'').localeCompare(b.starttime||''))
      .map(lec => ({
        id: lec.id,
        time: formatTime12(lec.starttime),
        course: getCourseTitle(lec),
        instructor: getInstructorNames(lec),
        room: getRoomName(lec),
        duration: `${durationMinutes(lec.starttime, lec.endtime)} دقيقة`,
        type: 'محاضرة',
      }));
    return list;
  }, [userLectures, todayName, getCourseTitle, getInstructorNames, getRoomName, normalizeDay]);

  const weekCards = useMemo(() => {
    // First, collect day -> class entries
    const grouped = daysOrder.reduce((acc, d) => { acc[d] = []; return acc; }, {});
    userLectures.forEach(lec => {
      const d = normalizeDay(lec.day);
      // Skip days that are not in our canonical list (e.g., الجمعة)
      if (!daysOrder.includes(d)) return;
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push({
        time24: formatTime24(lec.starttime),
        time12: formatTime12(lec.starttime),
        course: getCourseTitle(lec),
        room: getRoomName(lec),
        instructor: getInstructorNames(lec),
      });
    });
    Object.keys(grouped).forEach(d => grouped[d].sort((a,b) => a.time24.localeCompare(b.time24)));

    // Build cards: normally 1 per day. If duplicate times exist in a day, create extra cards for those time groups.
    const cards = [];
    daysOrder.forEach(day => {
      const classes = grouped[day] || [];
      // Skip empty days - don't add them to cards
      if (classes.length === 0) {
        return;
      }
      const timeCounts = classes.reduce((m, c) => { m[c.time24] = (m[c.time24]||0)+1; return m; }, {});
      const uniqueTimeClasses = classes.filter(c => (timeCounts[c.time24] || 0) === 1);
      const duplicateTimes = Object.keys(timeCounts).filter(t => timeCounts[t] > 1);
      // Base card with unique-time classes (if any) or with all classes when no duplicates
      if (duplicateTimes.length === 0) {
        cards.push({ day, classes });
      } else {
        if (uniqueTimeClasses.length > 0) cards.push({ day, classes: uniqueTimeClasses });
        duplicateTimes.forEach(t => {
          cards.push({ day, classes: classes.filter(c => c.time24 === t) });
        });
      }
    });
    return cards;
  }, [userLectures, normalizeDay, getCourseTitle, getRoomName, getInstructorNames, daysOrder]);

  // Open attendance session for a lecture
  const openAttendanceSession = useCallback(async (lectureId) => {
    try {
      // Check if there's already an active session for this lecture
      const existingSessions = await AttendanceAPI.getAttendanceByLecture(lectureId);
      
      if (existingSessions.length > 0) {
        toast.info('جلسة حضور مفتوحة بالفعل لهذه المحاضرة');
        // Navigate to the existing session
        navigate(`/attendance/${lectureId}`);
        return;
      }

      // Create new attendance session
      await AttendanceAPI.createAttendance({
        lecture: Number(lectureId)
      });

      toast.success('تم فتح جلسة الحضور بنجاح');
      // Navigate to the attendance page
      navigate(`/attendance/${lectureId}`);

    } catch (error) {
      console.error('Failed to open attendance session:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'فشل في فتح جلسة الحضور';
      toast.error(errorMessage);
    }
  }, [navigate]);

  // Export weekly schedule to Excel (xlsx if available, otherwise CSV fallback)
  const handleExportWeekExcel = async () => {
    // Build tabular data: header + rows
  const header = ['اليوم', 'الوقت', 'المقرر', 'المحاضر', 'القاعة'];
    const rows = [];
    weekCards.forEach(card => {
      if (!card.classes || card.classes.length === 0) {
        // Skip empty days to keep the sheet concise
        return;
      }
      card.classes.forEach(cls => {
        rows.push([card.day, cls.time12, cls.course, cls.instructor || '', cls.room]);
      });
    });
    const data = [header, ...rows];

    try {
      const XLSX = (await import('xlsx')).default || (await import('xlsx'));
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'الجدول');
      XLSX.writeFile(wb, 'جدول-الأسبوع.xlsx');
    } catch {
      // Fallback: CSV download (Excel-compatible)
      const csv = data
        .map(row => row
          .map(cell => {
            const s = String(cell ?? '');
            if (s.includes(',') || s.includes('\n') || s.includes('"')) {
              return '"' + s.replace(/"/g, '""') + '"';
            }
            return s;
          })
          .join(',')
        )
        .join('\n');
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'جدول-الأسبوع.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };
  
  // Export weekly schedule to PDF, preserving on-screen styles
  async function handleExportWeekPDF() {
    if (!weekRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default || (await import('html2canvas'));
      const { jsPDF } = await import('jspdf');

      const element = weekRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // higher scale for sharper text
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        onclone: (doc) => {
          // 1) Remove external styles that may include oklch() (Tailwind, etc.) from the cloned document
          try {
            const head = doc.head;
            const nodes = Array.from(head.querySelectorAll('link[rel="stylesheet"], style'));
            nodes.forEach(n => n.parentNode && n.parentNode.removeChild(n));
          } catch {}

          // 2) Add a compatibility class and inject safe CSS fallbacks
          const target = doc.getElementById('week-schedule');
          if (target) target.classList.add('pdf-compat');
          const style = doc.createElement('style');
          style.textContent = `
            /* Base container */
            #week-schedule.pdf-compat { 
              background: #ffffff !important; 
              color: #1f2937 !important; 
              font-family: system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif;
            }
            #week-schedule.pdf-compat h2, 
            #week-schedule.pdf-compat h3, 
            #week-schedule.pdf-compat h4 { color: #0f172a !important; }

            /* Buttons gradient (top actions) */
            #week-schedule.pdf-compat .bg-gradient-to-r.from-blue-700.to-blue-800 { 
              background-image: linear-gradient(90deg, #1d4ed8, #1e40af) !important; 
              color: #ffffff !important;
              cursor: pointer !important;
              display: none !important;
            }

            /* Section soft gradient background */
            #week-schedule.pdf-compat.bg-gradient-to-br.from-white.to-slate-50 {
              background-image: linear-gradient(135deg, #ffffff, #f8fafc) !important;
            }

            /* Grid layout for day cards (5 columns like the screenshot on wide pages) */
            #week-schedule.pdf-compat .grid { 
              display: grid !important; 
              grid-template-columns: repeat(5, minmax(0, 1fr)) !important; 
              gap: 16px !important; 
            }

            /* Day card visual */
            #week-schedule.pdf-compat .grid > div { 
              background: #ffffff !important; 
              border: 1px solid #e2e8f0 !important; 
              border-radius: 12px !important; 
              box-shadow: 0 8px 20px rgba(0,0,0,0.08) !important; 
              overflow: hidden !important; 
              display: flex !important; 
              flex-direction: column !important; 
            }

            /* Day header bar (deep blue gradient) */
            #week-schedule.pdf-compat .grid > div > div:first-child { 
              background-image: linear-gradient(90deg, #1e40af, #1e3a8a) !important; 
              color: #ffffff !important; 
              padding: 12px !important; 
              text-align: center !important; 
            }

            /* List area inside each day card */
            #week-schedule.pdf-compat .grid > div > div:nth-child(2) { 
              padding: 12px !important; 
            }

            /* Individual class card */
            #week-schedule.pdf-compat .grid > div > div:nth-child(2) > div { 
              background: #f8fafc !important; 
              border: 1px solid #f1f5f9 !important; 
              border-radius: 8px !important; 
              padding: 12px !important; 
            }

            /* Badges and text utility fallbacks */
            #week-schedule.pdf-compat .text-blue-600 { color: #2563eb !important; }
            #week-schedule.pdf-compat .bg-blue-100 { background-color: #dbeafe !important; }
            #week-schedule.pdf-compat .bg-slate-50 { background-color: #f8fafc !important; }
            #week-schedule.pdf-compat .text-slate-800 { color: #1e293b !important; }
            #week-schedule.pdf-compat .text-slate-600 { color: #475569 !important; }
            #week-schedule.pdf-compat .border-slate-100 { border-color: #f1f5f9 !important; }
            #week-schedule.pdf-compat .border-slate-200 { border-color: #e2e8f0 !important; }

            /* Hide pseudo elements that might rely on unsupported color functions */
            #week-schedule.pdf-compat *::before, #week-schedule.pdf-compat *::after { display: none !important; }
          `;
          doc.head.appendChild(style);

          // 3) Inline computed RGB colors to the clone to ensure stable rendering
          try {
            const root = doc.getElementById('week-schedule');
            if (root) {
              // Ensure no unsupported backgrounds leak in
              root.style.backgroundImage = 'none';
              const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
              let el = root;
              const isTransparent = (v) => !v || v === 'transparent' || v === 'rgba(0, 0, 0, 0)';
              while (el) {
                // Clear unknown gradient images; allow box-shadows we defined above
                el.style.backgroundImage = el.style.backgroundImage || 'none';
                const cs = doc.defaultView.getComputedStyle(el);
                const color = cs.color;
                const bg = cs.backgroundColor;
                const bcTop = cs.borderTopColor;
                const bcRight = cs.borderRightColor;
                const bcBottom = cs.borderBottomColor;
                const bcLeft = cs.borderLeftColor;
                if (!isTransparent(color)) el.style.color = color;
                if (!isTransparent(bg)) el.style.backgroundColor = bg;
                if (!isTransparent(bcTop)) el.style.borderTopColor = bcTop;
                if (!isTransparent(bcRight)) el.style.borderRightColor = bcRight;
                if (!isTransparent(bcBottom)) el.style.borderBottomColor = bcBottom;
                if (!isTransparent(bcLeft)) el.style.borderLeftColor = bcLeft;
                el = walker.nextNode();
              }
            }
          } catch {}
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Fit image to page width with small margins
      const margin = 24; // pts
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // If the rendered image is taller than the page height, paginate
      let heightLeft = imgHeight;
      let position = margin; // y start

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= (pageHeight - margin * 2);

      while (heightLeft > 0) {
        pdf.addPage('a4', 'landscape');
        position = margin - (imgHeight - heightLeft);
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= (pageHeight - margin * 2);
      }

      pdf.save('جدول-الأسبوع.pdf');
    } catch (e) {
      console.error('PDF export failed', e);
      toast.error('تعذر تصدير الجدول إلى PDF');
    }
  }

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="schedule-page">
        {loading && (
          <Spinner size="large" color="blue" />
        )}
        {!!error && (
          <div className="content-card" style={{ marginBottom: '12px', color: 'red' }}>خطأ: {error}</div>
        )}
        <header className='schedule-head flex flex-col md:flex-row'>
          <h1 className=' md:text-2xl'>جدول المحاضرات</h1>
          {/* Course filter (optional) */}
          <div className="schedusle-filter-box flex ">
            <label className="schedule-filter-label">تصفية بالمقرر:</label>
            <select className="schedule-filter-selesct !w-full" value={selectedCourse} onChange={(e)=>setSelectedCourse(e.target.value)}>
              <option value="">الكل</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </header>
       
      

      <div className="schedule-stats">
        <div className="stat-card">
          <h3>محاضرات اليوم</h3>
          <div className="stat-number">{todaySchedule.length}</div>
          <p>محاضرات ومعامل</p>
        </div>
        <div className="stat-card">
          <h3>إجمالي الساعات</h3>
          <div className="stat-number">
            {Math.round((todaySchedule.reduce((sum, c) => sum + (parseInt(c.duration) || 90), 0) / 60) * 10) / 10}
          </div>
          <p>ساعة دراسية</p>
        </div>
        <div className="stat-card">
          <h3>المحاضرة القادمة</h3>
          <div className="stat-number">
            {todaySchedule.length > 0 ? todaySchedule[0].time : 'لا توجد'}
          </div>
          <p>في اليوم</p>
        </div>
      </div>

      <main className="schedule-content schedule-columns">

        
        <section className="today-schedule content-card">
          <h2>جدول اليوم</h2>
          <div className="schedule-list">
            {todaySchedule.length === 0 && (
              <div className="text-gray-800 !text-lg schedule-item content-card" style={{ textAlign: 'center', padding: '16px' }}>
                لا توجد محاضرات اليوم
              </div>
            )}
            {todaySchedule.map(class_ => (
              <div key={class_.id} className="schedule-item content-card">
                <div className="time-section">
                <div className="flex items-center gap-2 md:gap-4 flex-col my-2">
                  <div>
                    <span>🕒</span>
                          <span className=" font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          {class_.time}
                          </span>
                    </div>
                          
                        <span className="text-ssm font-semibold text-blue-600 bg-gray-100 px-2 py-1 rounded-full">
              
              {class_.duration}
              </span>
                        </div>
                  <div className="duration flex flex-col md:flex-row items-center gap-2">
            
                    
                  </div>
                </div>
                <div className="class-info">
                  <h4>{class_.course}</h4>
                  <p><strong>المحاضر:</strong> {class_.instructor}</p>
                  <p><strong>القاعة:</strong> {class_.room}</p>
                  
                </div>
               {/* check if the user has the permission to add student attendance */}
                {
                  permissions.includes('Can add student attendance') && (
                <div className="class-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => openAttendanceSession(class_.id)}
                    title="فتح جلسة الحضور"
                  >
                    الحضور
                  </button>
                </div>
                )
                } 
              </div>
            ))}
          </div>
        </section>

        <section id="week-schedule" ref={weekRef} className="week-schedule w-full bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-6 shadow-lg">
          <div className='flex justify-between'>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">جدول الأسبوع</h2>
          {!permissions.includes('Can export week schedule') && weekCards.length > 0 && (
            <div className="mb-6 flex gap-3 justify-end">
              <button 
                className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white px-4 md:px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer"
                onClick={handleExportWeekExcel}
              >
                تصدير إلى Excel
              </button>
              <button 
                className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white px-4 md:px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer"
                onClick={handleExportWeekPDF}
              >
                تنزيل PDF
              </button>
            </div>
          )}
          </div>
          {weekCards.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-lg">
              لا توجد محاضرات هذا الأسبوع
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
              {weekCards.map((card, idx) => (
                <div key={`${card.day}-${idx}`} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
                  <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white p-3 text-center">
                    <h3 className="font-bold text-lg">{card.day}</h3>
                  </div>
                  <div className="p-3 space-y-2">
                    {card.classes.map((class_, index) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-100 hover:bg-slate-100 transition-colors duration-150">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            {class_.time12}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-medium !text-slate-800 text-sm leading-tight">{class_.course}</h4>
                          {class_.instructor && (
                            <p className="text-xs text-slate-600">
                              <span className="font-medium">المحاضر:</span> {class_.instructor}
                            </p>
                          )}
                          <p className="text-xs text-slate-600">
                            <span className="font-medium">القاعة:</span> {class_.room}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
        </section>
      </main>
    </div>
  );
}

// Default export wrapped with ErrorBoundary
export default function Schedule() {
  const fallback = (
    <div className="content-card" style={{ padding: '16px', direction: 'rtl' }}>
      <h3 style={{ marginBottom: '8px' }}>حدث خطأ أثناء عرض الجدول</h3>
      <p style={{ marginBottom: '12px' }}>حاول إعادة تحميل الصفحة أو المحاولة لاحقًا.</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded"
      >
        إعادة التحميل
      </button>
    </div>
  );
  return (
    <ErrorBoundary fallback={fallback}>
      <ScheduleInner />
    </ErrorBoundary>
  );
}