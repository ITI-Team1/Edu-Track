import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './dashboard.css';
import Overview from '../Overview/Overview';

// Lazy load all heavy components
const Schedule = lazy(() => import('../../components/Schedule'));
const FacultyManage = lazy(() => import('../FacultyManage/FacultyManage'));
const Department = lazy(() => import('../Department/Department'));
const Hall = lazy(() => import('../Hall/Hall'));
const CoursesMange = lazy(() => import('../courseMange/CoursesMange'));
const Lecture = lazy(() => import('../Lecture/Lecture'));
const Enrollment = lazy(() => import('../../components/Enrollment'));
const Courses = lazy(() => import('../../components/Courses'));
const AttendanceRecords = lazy(() => import('../AttendanceRecords/AttendanceRecords'));

function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  



  // Ensure we scroll to the top whenever switching dashboard tabs
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab]);

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
            className={`sidebar-tabs ${activeTab === "attendance-records" ? 'sidebar-active' : ""}`}
            style={{ display: '' }}
            onClick={() => setActiveTab("attendance-records")}
          >
            <span className="text-center text-[0.75rem] md:text-xl  min-w-5 ">✅</span>
            <span className="md:text-lg font-medium text-xs ">تقرير الغياب</span>
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
           <Overview />
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
            {activeTab === "attendance-records" && <AttendanceRecords />}
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