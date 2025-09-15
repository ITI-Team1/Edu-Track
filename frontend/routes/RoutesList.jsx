import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../src/pages/Home/Home";
import Login from "../src/pages/Login/Login";
import Register from "../src/pages/Register/Register";
import Dashboard from "../src/pages/Dashboard/Dashboard";
import Profile from "../src/pages/Profile/Profile";
import ProtectedRoute from "../src/components/ProtectedRoute";
import Features from "../src/pages/Features/Features";
import Contact from "../src/pages/Contact/Contact";
import FacultyManage from "../src/pages/FacultyManage/FacultyManage";
import PageNotFound from "../src/pages/PageNotFound/PageNotFound";
import ForgotPassword from "../src/pages/ForgotPassword/ForgotPassword";
import HelpCenter from "../src/pages/HelpCenter/HelpCenter";
import ChangePassword from "../src/pages/ChangePassword/ChangePassword";
import About from "../src/pages/About/About";
import ResetPassword from "../src/pages/ResetPassword/ResetPassword";
import Logs from "../src/pages/Logs/Logs";
import Enrollment from "../src/components/Enrollment";
import AttendancePage from "../src/pages/Attendance/Attendance";
import JoinAttendance from "../src/pages/Attendance/JoinAttendance";
import Activation from "../src/pages/Activation/Activation";
import AttendanceSheet from "../src/pages/AttendanceSheet/AttendanceSheet";

// Small helper to set the page title per route
const Page = ({ title, children }) => {
  useEffect(() => {
    const prev = document.title;
    const base = "جامعة بورسعيد";
    document.title = title ? `${title} - ${base}` : base;
    return () => {
      document.title = prev;
    };
  }, [title]);
  return children;
};


const RoutesList = () => {
  return (
    <Routes>
  <Route path="/" element={<Page title="الرئيسية"><Home /></Page>} />
  <Route path="/login" element={<Page title="تسجيل الدخول"><Login /></Page>} />
  <Route path="/forgot-password" element={<Page title="استعادة كلمة المرور"><ForgotPassword /></Page>} />
  <Route path="/resetpassword/:uid-:token" element={<Page title="إعادة تعيين كلمة المرور"><ResetPassword /></Page>} />
  {/* Fallback matcher to capture any dash pattern, e.g., :combo = "<uid>-<token>" */}
  <Route path="/resetpassword/:combo" element={<Page title="إعادة تعيين كلمة المرور"><ResetPassword /></Page>} />
  {/* Account activation from Djoser emails */}
  <Route path="/activation/:uid-:token" element={<Page title="تفعيل الحساب"><Activation /></Page>} />
  {/* Fallback with single param */}
  <Route path="/activation/:combo" element={<Page title="تفعيل الحساب"><Activation /></Page>} />
  <Route path="/register" element={<Page title="إنشاء حساب"><Register /></Page>} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Page title="لوحة التحكم"><Dashboard /></Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Page title="الملف الشخصي"><Profile /></Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <Page title="تغيير كلمة المرور"><ChangePassword /></Page>
          </ProtectedRoute>
        }
      />
      <Route path="/features" element={<Page title="المميزات"><Features /></Page>} />
      <Route path="/contact" element={<Page title="اتصل بنا"><Contact /></Page>} />
  
      <Route
        path="/universities/:slug/faculties"
        element={
          <ProtectedRoute>
            <Page title="إدارة الكليات"><FacultyManage /></Page>
          </ProtectedRoute>
        }
      />
      <Route path="/help" element={<Page title="مركز المساعدة"><HelpCenter /></Page>} />    
      <Route path="*" element={<Page title="الصفحة غير موجودة"><PageNotFound /></Page>} />
      <Route path="/about" element={<Page title="حول"><About /></Page>} />
      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <Page title="السجلات"><Logs /></Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/enroll"
        element={
          <ProtectedRoute>
            <Page title="تسجيل الطلاب"><Enrollment /></Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/:attendanceId"
        element={
          <ProtectedRoute>
            <Page title="الحضور"><AttendancePage /></Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/sheet/:attendanceId"
        element={
          <ProtectedRoute>
            <Page title="الحضور"><AttendanceSheet /></Page>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/join"
        element={<Page title="تسجيل الحضور"><JoinAttendance /></Page>}
      />

    </Routes>
  );
};

export default RoutesList;
