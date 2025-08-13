import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './dashboard.css';
import Courses from '../../components/Courses';
import Schedule from '../../components/Schedule';
import FacultyManage from '../FacultyManage/FacultyManage';
import Department from '../Department/Department';
import Hall from '../Hall/Hall';
import CoursesMange from '../../components/CoursesMange';

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

  // Mock data - replace with real data from backend
  const mockData = {
    courses: [
      {
        id: 1,
        name: "الرياضيات 101",
        progress: 75,
        nextClass: "2024-01-15 10:00",
      },
      {
        id: 2,
        name: "معمل الفيزياء",
        progress: 60,
        nextClass: "2024-01-16 14:00",
      },
      {
        id: 3,
        name: "الأدب الإنجليزي",
        progress: 90,
        nextClass: "2024-01-17 09:00",
      },
    ],
    upcomingDeadlines: [
      {
        id: 1,
        title: "واجب الرياضيات",
        course: "الرياضيات 101",
        dueDate: "2024-01-20",
      },
      {
        id: 2,
        title: "تقرير الفيزياء",
        course: "معمل الفيزياء",
        dueDate: "2024-01-22",
      },
    ],
    recentActivity: [
      {
        id: 1,
        action: "تم إكمال الواجب",
        course: "الأدب الإنجليزي",
        time: "قبل ساعتين",
      },
      {
        id: 2,
        action: "حضور المحاضرة",
        course: "الرياضيات 101",
        time: "قبل يوم واحد",
      },
    ],
  };

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (

    <div className="dashboard-container">
      {/* <PlexusBackground /> */}
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <nav className="sidebar-nav">
          <h3 style={{ marginBottom: "10px" }}>لوحة التحكم</h3>
          <button
            className={`sidebar-tab ${activeTab === "overview" ? "active" : ""
              }`}
            onClick={() => setActiveTab("overview")}
          >
            <span className="tab-icon">📊</span>
            <span className="tab-text">نظرة عامة</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === "courses" ? "active" : ""}`}
            onClick={() => setActiveTab("courses")}
          >
            <span className="tab-icon">📚</span>
            <span className="tab-text">المقررات</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === "schedule" ? "active" : ""
              }`}
            onClick={() => setActiveTab("schedule")}
          >
            <span className="tab-icon">📅</span>
            <span className="tab-text">الجدول</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === "progress" ? "active" : ""
              }`}
            onClick={() => setActiveTab("progress")}
          >
            <span className="tab-icon">📈</span>
            <span className="tab-text">التقدم</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === "facultyManagement" ? "active" : ""
              }`}
            onClick={() => setActiveTab("facultyManagement")}
          >
            <span className="tab-icon">🏫</span>
            <span className="tab-text"> الكليات</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === "department" ? "active" : ""
              }`}
            onClick={() => setActiveTab("department")}
          >
            <span className="tab-icon"> 🗂️ </span>
            <span className="tab-text"> الأقسام</span>
          </button>
          <button
            className={`sidebar-tab ${
              activeTab === "hall" ? "active" : ""
            }`}
            onClick={() => setActiveTab("hall")}
          >
            <span className="tab-icon">🏛️</span>
            <span className="tab-text"> القاعات</span>
          </button>
          <button
            className={`sidebar-tab ${activeTab === "coursesMange" ? "active" : ""}`}
            onClick={() => setActiveTab("coursesMange")}
          >
            <span className="tab-icon">📝</span>
            <span className="tab-text">ادارة المقررات</span>
          </button>
        </nav>
        <div className="sidebar-header">
          <div className="user-info">
            <span>مرحباً بك، {user?.first_name || "طالب"}!</span>
          </div>
        </div>
        <div className="sidebar-footer">
          <Link to="/profile" className="btn btn-secondary">
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #eee" }}>
                  <button aria-label="الشهر السابق" onClick={prevMonth} className="btn btn-secondary-calender" style={{ padding: "4px 8px" }}>‹</button>
                  <h3 style={{ margin: 0 }}>{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</h3>
                  <button aria-label="الشهر التالي" onClick={nextMonth} className="btn btn-secondary-calender" style={{ padding: "4px 8px" }}>›</button>
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

          {activeTab === "courses" && <Courses />}
          {activeTab === "facultyManagement" && <FacultyManage />}
          {activeTab === "coursesMange" && <CoursesMange />}
          {activeTab === "schedule" && <Schedule />}
          {activeTab === "department" && <Department />}
          {activeTab === "hall" && <Hall />}

          {activeTab === "progress" && (
            <div className="progress-section-applying">
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
