import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './dashboard.css';

// Lazy load all heavy components
const Schedule = lazy(() => import('../../components/Schedule'));
const FacultyManage = lazy(() => import('../FacultyManage/FacultyManage'));
const Department = lazy(() => import('../Department/Department'));
const Hall = lazy(() => import('../Hall/Hall'));
const CoursesMange = lazy(() => import('../courseMange/CoursesMange'));
const Lecture = lazy(() => import('../Lecture/Lecture'));
const Enrollment = lazy(() => import('../../components/Enrollment'));
const Courses = lazy(() => import('../../components/Courses'));

function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  // Calendar and Live Clock state
  const [viewDate, setViewDate] = useState(new Date()); // month being viewed
  const [now, setNow] = useState(new Date()); // live updating current time

  // Tick every second to keep time/date current
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Ensure we scroll to the top whenever switching dashboard tabs
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab]);

  // Calendar helpers
  const monthNames = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];
  const weekdayShort = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const daysInMonth = endOfMonth.getDate();
  const prefixBlanks = startOfMonth.getDay(); // 0=Sun ... 6=Sat

  const calendarCells = [
    ...Array(prefixBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Ensure 6 rows (like Google Calendar)
  while (calendarCells.length < 42) calendarCells.push(null);

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const goToToday = () => {
    const d = new Date();
    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Removed unused mock data

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }
// console.log(user.groups);


  return (

    <div className="flex min-h-screen flex-col md:flex-row">
      {/* <PlexusBackground /> */}
      {/* Sidebar */}
      <aside className="
      flex flex-col 
    w-full h-auto relative top-0 left-0 
    border-b border-[rgba(100,108,255,0.2)]
    bg-[linear-gradient(180deg,#1e1e2e_0%,#282c4e_50%,#2d3748_100%)]
    overflow-visible 
    z-[1000]
    shadow-[4px_0_20px_rgba(0,0,0,0.1)]
    md:fixed md:h-screen md:w-[240px] md:border-b-0 md:border-r
    lg:w-[280px]
  
      ">
        <nav className="    flex flex-row
    !w-full !order-2
    !gap-[0.3rem] !p-[0.3rem]      
    !overflow-x-auto !overflow-y-visible
    !min-h-0
    !mt-0
    ![scrollbar-width:thin]
    ![scrollbar-color:rgba(100,108,255,0.3)_transparent]
    sm:!gap-[0.4rem] sm:!p-[0.4rem]   
    md:flex-col md:overflow-y-auto md:overflow-x-hidden
    md:!gap-[0.5rem] md:!p-2 md:!mt-12 md:!order-none
    md:![scrollbar-width:none] ">
          {/* 2 طالب */}
          {/* 4 مدير القسم */}
          {/* 3 دكتور معيد */}
          {/* 6 مدير الجامعة */}
          {/* 5 مدير الكليه */}

          <h3 className='hidden md:block !m-3.5' >لوحة التحكم</h3>
          <button
            className={`sidebar-tabs 
              ${activeTab === "overview" ? "sidebar-active" : ""
              }`}
            onClick={() => setActiveTab("overview")}
          >
            <span className="text-center text-[0.75rem] md:text-xl  min-w-5 ">📊</span>
            <span className="md:text-lg font-medium text-xs ">نظرة عامة</span>
          </button>
                    {/* التسجيل الإكاديمي */}
          {(user.groups.includes(2) || user.groups.includes(6) || user.groups.includes(1)) && (
          <button
            className={`sidebar-tabs ${activeTab === "courses" ? 'sidebar-active' : ""}`}
            onClick={() => setActiveTab("courses")}
          >
            <span className="text-center text-[0.75rem] md:text-xl  min-w-5 ">📚</span>
            <span className="md:text-lg font-medium text-xs ">التسجيل الإكاديمي</span>
          </button>
          )}
          {/* الجدول */}
          {(user.groups.includes(1) || user.groups.includes(2) || user.groups.includes(3) || user.groups.includes(6)) && (
          <button
            className={`sidebar-tabs ${activeTab === "schedule" ? 'sidebar-active' : ""
              }`}
            onClick={() => setActiveTab("schedule")}
          >
            <span className="text-center text-[0.75rem] md:text-xl  min-w-5 ">📅</span>
            <span className="md:text-lg font-medium text-xs ">الجدول</span>
          </button>
          )}
          {/* جدول الأمتحانات */}
          {(user.groups.includes(2) || user.groups.includes(6) || user.groups.includes(1)) && (
          <button
            className={`sidebar-tabs ${activeTab === "progress" ? 'sidebar-active' : ""
              }`}
            onClick={() => setActiveTab("progress")}
          >
            <span className="text-center text-[0.75rem] md:text-xl  min-w-5 ">📈</span>
            <span className="md:text-lg font-medium text-xs ">جدول الأمتحانات</span>
          </button>
          )}
          {/* تسجيل طلاب */}
          {(user.groups.includes(6) || user.groups.includes(4) || user.groups.includes(5) || user.groups.includes(1)) && (
          <button
            className={`sidebar-tabs ${activeTab === "enroll" ? 'sidebar-active' : ""}`}
            onClick={() => setActiveTab("enroll")}
          >
            <span className="text-center text-[0.75rem] md:text-xl  min-w-5 ">🧾</span>
            <span className="md:text-lg font-medium text-xs ">تسجيل الطلاب</span>
          </button>
          )}
          {/* الكليات */}
          {(user.groups.includes(6) || user.groups.includes(5) || user.groups.includes(1)) && (
          <button
            className={`sidebar-tabs ${activeTab === "facultyManagement" ? 'sidebar-active' : ""
              }`}
            onClick={() => setActiveTab("facultyManagement")}
          >
            <span className="text-center text-[0.75rem] md:text-xl  min-w-5 ">🏫</span>
            <span className="md:text-lg font-medium text-xs "> الكليات</span>
          </button>
          )}
          {/* الأقسام */}
          {(user.groups.includes(6) || user.groups.includes(5) || user.groups.includes(1)) && (
          <button
            className={`sidebar-tabs ${activeTab === "department" ? 'sidebar-active' : ""
              }`}
            onClick={() => setActiveTab("department")}
          >
            <span className="text-center text-[0.75rem] md:text-xl  min-w-5 "> 🗂️ </span>
            <span className="md:text-lg font-medium text-xs "> الأقسام</span>
          </button>
          )}
          {/* المقررات */}
          {(user.groups.includes(6) || user.groups.includes(5) || user.groups.includes(1)) && (
          <button
            className={`sidebar-tabs ${activeTab === "coursesMange" ? 'sidebar-active' : ""}`}
            onClick={() => setActiveTab("coursesMange")}
          >
            <span className="text-center text-[0.75rem] md:text-xl  min-w-5 ">📝</span>
            <span className="md:text-lg font-medium text-xs ">المقررات</span>
          </button>
          )}
           {/* المحاضرات */}
          {(user.groups.includes(6) || user.groups.includes(4) || user.groups.includes(5) || user.groups.includes(1)) &&  (
          <button
            className={`sidebar-tabs ${activeTab === "lecture" ? 'sidebar-active' : ""}`}
            onClick={() => setActiveTab("lecture")}
          >
            <span className="text-center text-[0.75rem] md:text-xl  min-w-5 ">📝</span>
            <span className="md:text-lg font-medium text-xs ">المحاضرات</span>
          </button>
          )}
          {/* القاعات */}
          {(user.groups.includes(6) || user.groups.includes(5) || user.groups.includes(1)) && (
          <button
            className={`sidebar-tabs ${
              activeTab === "hall" ? 'sidebar-active' : ""
            }`}
            onClick={() => setActiveTab("hall")}
          >
            <span className="text-center text-[0.75rem] md:text-xl  min-w-5 ">🏛️</span>
            <span className="md:text-lg font-medium text-xs "> القاعات</span>
          </button>
          )}

     
          


          


        

          
          {/* الحضور */}
          {user.groups.includes(6)|| user.groups.includes(3) || user.groups.includes(1) && (
          <button
            className={`sidebar-tabs ${activeTab === "attendance" ? 'sidebar-active' : ""}`}
            style={{ display: '' }}
            onClick={() => {}}
          >
            <span className="text-center text-[0.75rem] md:text-xl  min-w-5 ">✅</span>
            <span className="md:text-lg font-medium text-xs ">الحضور</span>
          </button>
          )}
        </nav>
        <div className="!p-[2rem_1.5rem_1.5rem] !text-center md:!text-right">
          {/* Mobile-only header title; styled to show only on small screens in CSS */}
          <h2 className="md:hidden block  ">لوحة التحكم</h2>
          <div className="md:text-xl md:font-bold">
            <span>مرحباً بك، {user?.first_name || "طالب"}!</span>
          </div>
        </div>
        <div className="!p-6 hidden md:block  border-gray-500 border-t-2">
          <Link to="/profile" className="btn-main !w-full !p-[0.75rem_1rem] text-center !block    ">
            الملف الشخصي
          </Link>
        </div>
      </aside>

      {/* Main Content */}

      <main className="dashboard-main">
        <div className="dashboard-content">
          {activeTab === "overview" && (
            <div className="calendar-overview" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
              {/* Calendar (month view) */}
              <div className="stats-card" style={{ padding: 0, overflow: "hidden" }}>
                <div className="calendar-toolbar">
                  <button aria-label="الشهر السابق" onClick={prevMonth} className="btn btn-secondary-calender">‹</button>
                  <h3 style={{ margin: 0 }}>{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</h3>
                  <button aria-label="الشهر التالي" onClick={nextMonth} className="btn btn-secondary-calender">›</button>
                </div>
                <div style={{ padding: "12px 16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 8 }}>
                    {weekdayShort.map((d) => (
                      <div key={d} style={{ textAlign: "center", fontWeight: 600, color: "#555" }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                    {calendarCells.map((day, idx) => {
                      const isToday = day !== null &&
                        viewDate.getFullYear() === now.getFullYear() &&
                        viewDate.getMonth() === now.getMonth() &&
                        day === now.getDate();
                      return (
                        <div
                          key={idx}
                          style={{
                            height: 72,
                            border: "1px solid #eee",
                            borderRadius: 8,
                            padding: 8,
                            background: isToday ? "#1976d2" : "#fff",
                            color: isToday ? "#fff" : "#333",
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "flex-end",
                            fontWeight: isToday ? 700 : 500,
                          }}
                          title={day ? `${day} ${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}` : ""}
                        >
                          {day !== null ? day : ""}
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
              <div className="stats-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <h3 style={{ marginBottom: 8 }}>الوقت الآن</h3>
                <div className="stat-number-dashboard" style={{ fontFamily: "monospace", fontSize: 28, marginBottom: 8 }}>
                  {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </div>
                <p style={{ margin: 0 }}>
                  {now.toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
              
            </div>
          )}
  <Suspense fallback={<div className="p-6 text-center">
    {/*should be loader */}
    🔄 جاري التحميل...</div>}>
            {activeTab === "enroll" && <Enrollment />}
            {activeTab === "courses" && <Courses />}
            {activeTab === "facultyManagement" && <FacultyManage />}
            {activeTab === "coursesMange" && <CoursesMange />}
            {activeTab === "schedule" && <Schedule />}
            {activeTab === "department" && <Department />}
            {activeTab === "hall" && <Hall />}
            {activeTab === "lecture" && <Lecture />}
          </Suspense>
          {activeTab === "progress" && (
            <div className="content-card progress-section-applying">
              <h2>التقدم الأكاديمي</h2>
              <div className="progress-chart">
                <div className="chart-placeholder">
                  <p>سيتم عرض الرسوم البيانية والتحليلات هنا</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;