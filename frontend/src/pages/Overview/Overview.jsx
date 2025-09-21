import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/schedule.css';
import { fetchLectures } from '../../services/lectureApi';
import { fetchCourses } from '../../services/courseApi';
import { fetchLocations } from '../../services/locationApi';


import { fetchUsers } from '../../services/userApi';
import { fetchUserPermissions } from '../../services/userApi';

export default function Overview() {
  const [viewDate, setViewDate] = useState(new Date()); 
  const [now, setNow] = useState(new Date());

  // Live clock update every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const monthNames = [
    "يناير","فبراير","مارس","أبريل","مايو","يونيو",
    "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"
  ];
  const weekdayShort = ["سبت","أحد","إثنين","ثلاثاء","أربعاء","خميس","جمعة"];

  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const daysInMonth = endOfMonth.getDate();

  // Get which day of week the 1st falls on (0=Sunday .. 6=Saturday)
  const firstDayIndex = startOfMonth.getDay();

  // In Arabic we want week starting on Saturday (like your weekdayShort)
  // JS getDay(): 0=Sunday .. 6=Saturday
  // So we rotate it to make Saturday=0
  const offset = (firstDayIndex + 1) % 7;

  // Fill blanks then days
  const calendarCells = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];
  while (calendarCells.length < 42) calendarCells.push(null);

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const goToToday = () => {
    const d = new Date();
    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Data
  const [lectures, setLectures] = useState([]);
  const [courses, setCourses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState([]);

  // Filters
  const [selectedCourse, setSelectedCourse] = useState('');

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Get user permissions
  useEffect(() => {
    if (user) {
      fetchUserPermissions(user).then(permissions => {
        setPermissions(permissions);
      });
    }
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
    if (!lec) return '';
    if (lec.course && typeof lec.course === 'object') return lec.course.title;
    const c = courses.find(c => c.id === lec.course);
    return c ? c.title : lec.course || '';
  }, [courses]);

  const getInstructorName = useCallback((lec) => {
    if (!lec) return '';
    if (lec.instructor && typeof lec.instructor === 'object') {
      return `${lec.instructor.first_name || ''} ${lec.instructor.last_name || ''}`.trim();
    }
    const u = users.find(u => u.id === lec.instructor);
    return u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : lec.instructor || '';
  }, [users]);

  const getRoomName = useCallback((lec) => {
    if (!lec) return '';
    if (lec.location && typeof lec.location === 'object') {
      return lec.location.name || lec.location.title || lec.location.slug || '';
    }
    const l = locations.find(l => l.id === lec.location || l.slug === lec.location);
    return l ? (l.name || '') : (lec.location || '');
  }, [locations]);

  // Determine role from user groups (IDs/names): 3 = Doctor/TA, 2 = Student
  const { isDoctor, isStudent } = useMemo(() => {
    if (!user) return { isDoctor: false, isStudent: false };
    const groups = Array.isArray(user.groups) ? user.groups : [];
    const getId = (g) => (g && typeof g === 'object') ? g.id : g;
    const getName = (g) => (g && typeof g === 'object') ? (g.name || '') : '';
    const isDoc = groups.some(g => getId(g) === 3 || getName(g).includes('دكاترة'));
    const isStu = groups.some(g => getId(g) === 2 || getName(g).includes('طلاب'));
    return { isDoctor: isDoc, isStudent: isStu };
  }, [user]);

  // Filter lectures for current user by role
  const userLectures = useMemo(() => {
    if (!user?.id || !Array.isArray(lectures)) return [];
    const uidNum = Number(user.id);

    let filtered = [];
    if (isDoctor) {
      // Doctors: only lectures where they are the instructor
      filtered = lectures.filter(lec => {
        if (!lec) return false;
        const instructorId = Number(
          (lec.instructor && typeof lec.instructor === 'object') 
            ? lec.instructor.id 
            : lec.instructor
        );
        return instructorId === uidNum;
      });
    } else if (isStudent) {
      // Students: lectures where they appear in the students list
      filtered = lectures.filter(lec => {
        if (!lec) return false;
        const st = Array.isArray(lec.students) ? lec.students : [];
        const ids = st
          .filter(s => s != null)
          .map(s => (typeof s === 'object' ? s.id : s))
          .map(Number);
        return ids.includes(uidNum);
      });
    }

    // Optional course dropdown filter applies to both roles
    if (selectedCourse) {
      const cid = Number(selectedCourse);
      filtered = filtered.filter(lec => {
        if (!lec) return false;
        return (
          lec.course === cid || 
          (typeof lec.course === 'object' && lec.course?.id === cid)
        );
      });
    }
    
    return filtered.filter(Boolean); // Remove any null/undefined entries
  }, [lectures, user?.id, selectedCourse, isDoctor, isStudent]);

  // Build "today" schedule
  const daysOrder = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const jsToArabic = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const todayIndex = new Date().getDay();
  const todayName = jsToArabic[todayIndex];

  // Time formatting helpers
  const formatTime12 = (t) => {
    if (!t) return '';
    const [hhStr, mmStr] = t.split(':');
    let hh = parseInt(hhStr, 10);
    if (isNaN(hh)) return '';
    const mm = (mmStr || '00').slice(0, 2);
    const suffix = hh >= 12 ? 'م' : 'ص';
    hh = hh % 12;
    if (hh === 0) hh = 12;
    return `${hh}:${mm} ${suffix}`;
  };

  const durationMinutes = (s, e) => {
    if (!s || !e) return 90;
    const [sh, sm] = s.split(':').map(Number);
    const [eh, em] = e.split(':').map(Number);
    return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  };

  const todaySchedule = useMemo(() => {
    const list = userLectures
      .filter(lec => lec && lec.day === todayName)
      .sort((a, b) => (a.starttime || '').localeCompare(b.starttime || ''))
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
  }, [userLectures, todayName, getCourseTitle, getInstructorName, getRoomName]);

  return (
    <div className="flex flex-col">
    <div className=" !h-1/2 grid grid-cols-1 md:grid-cols-3 gap-4 !mb-2 ">
      {/* Calendar */}
      <div className="col-span-2 bg-white rounded-lg feature-card">
        <div className="flex justify-between !p-1 border-b-2 !mb-2 !border-gray-200">
          <button aria-label="الشهر السابق" onClick={prevMonth} className="btn-main !px-2 text-2xl">‹</button>
          <h3 className="text-lg font-medium">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</h3>
          <button aria-label="الشهر التالي" onClick={nextMonth} className="btn-main !px-2 text-2xl">›</button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-7">
            {weekdayShort.map((d) => (
              <div key={d} className="!text-center  !w-20 !h-7 font-medium text-gray-500">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((day, idx) => {
              const isToday =
                day !== null &&
                viewDate.getFullYear() === now.getFullYear() &&
                viewDate.getMonth() === now.getMonth() &&
                day === now.getDate();

              return (
                <div
                  key={idx}
                  title={day ? `${day} ${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}` : ""}
                  className={`h-10 !text-center w-20 border border-gray-200 rounded-lg !p-2 flex !items-end !justify-center font-medium ${
                    isToday ? "!bg-[#1976d2] text-white font-bold" : "bg-white text-gray-700"
                  }`}
                >
                  {day ?? ""}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12, textAlign: "center" }}>
            <button onClick={goToToday} className="btn btn-secondary-calender">اليوم</button>
          </div>
        </div>
      </div>

      {/* Live Clock */}
      <div className="flex flex-col items-center justify-center bg-white rounded-lg feature-card">
        <h3 style={{ marginBottom: 8 }}>الوقت الآن</h3>
        <div className="stat-number-dashboard" style={{ fontFamily: "monospace", fontSize: 28, marginBottom: 8 }}>
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
        <p style={{ margin: 0 }}>
          {now.toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>
    </div>
    <div>
        
    </div>
    <section className="today-schedule content-card">
          <h2>جدول اليوم</h2>
          <div className="schedule-list">
            {todaySchedule.length === 0 && (
              <div className=" text-gray-800 !text-lg schedule-item content-card" style={{ textAlign: 'center', padding: '16px' }}>
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
                  {/* <Link
                    to={`/attendance/${class_.id}`}
                    className="btn"
                    title="عرض الحضور لهذه المحاضرة"
                  >
                    الحضور
                  </Link> */}
                </div>
              </div>
            ))}
          </div>
        </section>

    </div>
  );
}
