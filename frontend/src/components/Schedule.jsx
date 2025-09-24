import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/schedule.css';
import { fetchLectures } from '../services/lectureApi';
import { fetchCourses } from '../services/courseApi';
import { fetchLocations } from '../services/locationApi';
import { fetchUserPermissions, fetchUsers } from '../services/userApi';
import Spinner from './Spinner';

function Schedule() {
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
      if (classes.length === 0) {
        cards.push({ day, classes: [] });
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
        <header className='schedule-head'>
          <h1>جدول المحاضرات</h1>
          {/* Course filter (optional) */}
          <div className="schedule-filter-box">
            <label className="schedule-filter-label">تصفية بالمقرر:</label>
            <select className="schedule-filter-select" value={selectedCourse} onChange={(e)=>setSelectedCourse(e.target.value)}>
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
                  <div className="time">🕒{class_.time}</div>
                  <div className="duration">{class_.duration}</div>
                </div>
                <div className="class-info">
                  <h4>{class_.course}</h4>
                  <p><strong>المحاضر:</strong> {class_.instructor}</p>
                  <p><strong>القاعة:</strong> {class_.room}</p>
                  <span className="class-type">{class_.type}</span>
                </div>
               {/* check if the user has the permission to add student attendance */}
                {
                  permissions.includes('Can add student attendance') && (
                <div className="class-actions">
                  <Link
                    to={`/attendance/${class_.id}`}
                    className="btn"
                    title="عرض الحضور لهذه المحاضرة"
                  >
                    الحضور
                  </Link>
                </div>
                )
                } 
              </div>
            ))}
          </div>
        </section>

        <section className="week-schedule">
          <h2>جدول الأسبوع</h2>
          <div className="week-grid" style={{ alignItems: 'flex-start' }}>
            {weekCards.map((card, idx) => (
              <div key={`${card.day}-${idx}`} className="day-card" style={{ alignSelf: 'flex-start' }}>
                <h3>{card.day}</h3>
                <div className="day-classes">
                  {card.classes.map((class_, index) => (
                    <div key={index} className="day-class">
                      <span className="class-time">{class_.time12}</span>
                      <span className="class-name">{class_.course}</span>
                      {class_.instructor ? (
                        <span className="class-instructor">{class_.instructor}</span>
                      ) : null}
                      <span className="class-room">{class_.room}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {permissions.includes('Can export week schedule') && (
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn" onClick={handleExportWeekExcel}>
              تصدير جدول الأسبوع إلى Excel
            </button>
          </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Schedule; 