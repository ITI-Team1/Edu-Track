import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/schedule.css';
import { fetchLectures } from '../services/lectureApi';
import { fetchCourses } from '../services/courseApi';
import { fetchLocations } from '../services/locationApi';
import { fetchUsers } from '../services/userApi';

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
  const getCourseTitle = (lec) => {
    if (lec.course && typeof lec.course === 'object') return lec.course.title;
    const c = courses.find(c => c.id === lec.course);
    return c ? c.title : lec.course;
  };
  const getInstructorName = (lec) => {
    if (lec.instructor && typeof lec.instructor === 'object') return `${lec.instructor.first_name} ${lec.instructor.last_name}`;
    const u = users.find(u => u.id === lec.instructor);
    return u ? `${u.first_name} ${u.last_name}` : lec.instructor;
  };
  const getRoomName = (lec) => {
    if (lec.location && typeof lec.location === 'object') return lec.location.name || lec.location.title || lec.location.slug;
    const l = locations.find(l => l.id === lec.location || l.slug === lec.location);
    return l ? l.name : lec.location;
  };

  // Normalize Arabic day names to canonical forms (match backend choices)
  const canonicalDays = ['السبت','الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس'];
  const dayMap = {
    'الاحد': 'الأحد', 'الأحد': 'الأحد', 'اﻷحد': 'الأحد',
    'السبت': 'السبت',
    'الاثنين': 'الإثنين', 'الإثنين': 'الإثنين',
    'الثلاثاء': 'الثلاثاء',
    'الاربعاء': 'الأربعاء', 'الأربعاء': 'الأربعاء',
    'الخميس': 'الخميس',
    'الجمعة': 'الجمعة',
  };
  const normalizeDay = (d) => dayMap[(d || '').trim()] || d;

  // Filter lectures for current user (by enrolled courses) and selected course
  const userLectures = useMemo(() => {
    if (!user?.id) return [];
    // 1) Find courses where this user already appears in at least one lecture.students
    const courseIdsSet = new Set(
      lectures
        .filter(lec => {
          const st = Array.isArray(lec.students) ? lec.students : [];
          const ids = st.map(s => (typeof s === 'object' && s !== null) ? s.id : s).map(Number);
          return ids.includes(Number(user.id));
        })
        .map(lec => (typeof lec.course === 'object' ? lec.course?.id : lec.course))
        .map(Number)
    );
    // 2) Include ALL lectures whose course is in that set, even if students list wasn't updated yet
    let filtered = lectures.filter(lec => {
      const cid = Number(typeof lec.course === 'object' ? lec.course?.id : lec.course);
      return courseIdsSet.has(cid);
    });
    // 3) Optional course dropdown filter
    if (selectedCourse) {
      const cid = Number(selectedCourse);
      filtered = filtered.filter(lec => (
        lec.course === cid || (typeof lec.course === 'object' && lec.course?.id === cid)
      ));
    }
    return filtered;
  }, [lectures, user?.id, selectedCourse]);

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
        instructor: getInstructorName(lec),
        room: getRoomName(lec),
        duration: `${durationMinutes(lec.starttime, lec.endtime)} دقيقة`,
        type: 'محاضرة',
      }));
    return list;
  }, [userLectures, todayName, courses, users, locations]);

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
  }, [userLectures, courses, locations]);

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="schedule-page">
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
              <div className="schedule-item content-card" style={{ textAlign: 'center', padding: '16px' }}>
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
                <div className="class-actions">
                  <Link to={`/course/${class_.id}`} className="btn btn-outline">تفاصيل المقرر</Link>
                  <Link
                    to={`/attendance/${class_.id}`}
                    className="btn"
                    title="عرض الحضور لهذه المحاضرة"
                  >
                    الحضور
                  </Link>
                </div>
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
                      <span className="class-room">{class_.room}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Schedule; 