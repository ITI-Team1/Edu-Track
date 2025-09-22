import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import {
  fetchLectures,
  createLecture,
  updateLecture,
  deleteLecture,
} from "../../services/lectureApi";
import { fetchLocations } from "../../services/locationApi";
import { fetchCourses } from "../../services/courseApi"
import { fetchUsers } from "../../services/userApi"
import './style.css';
import toast from '../../utils/toast';
export default function AttendanceRecords() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [lectures, setLectures] = useState([]);
  const [locations, setLocations] = useState([]);
  const [courses, setCourses] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lectureToDelete, setLectureToDelete] = useState(null);
  const [modalType, setModalType] = useState("create");
  const [selectedLecture, setSelectedLecture] = useState(null);

  // Loaders and CRUD handlers (restored)
  useEffect(() => {
    loadLectures();
    loadLocations();
    loadCourses();
    loadUsers();
  }, []);


  const hasGroup = (groupId) => {
    if (!user?.groups) return false;
    return user.groups.some(group => {
      const id = typeof group === 'object' ? group.id : group;
      return id === groupId;
    });
  };

  // Helper function to check if user has any of the specified groups
  const hasAnyGroup = (groupIds) => {
    return groupIds.some(groupId => hasGroup(groupId));
  };

  const loadLectures = async () => {
    setLoading(true);
    try {
      const data = await fetchLectures();
      //   // check if user has program only set the courses that the user has program
      
        if(hasAnyGroup([3])){
          
          const currentDoctorLectures = data.filter(l => l.instructor.map(i => i).includes(user.id));
          setLectures(currentDoctorLectures);
      }else{
      setLectures(Array.isArray(data) ? data : []);
      }
      setError(null);
    } catch (err) {
      setLectures([]);
      const msg = err?.message || "فشل تحميل المحاضرات";
      setError(msg);
      toast.error(msg);
    }
    setLoading(false);
  };

  const loadLocations = async () => {
    try {
      const data = await fetchLocations();
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      setLocations([]);
      const msg = err?.message || "فشل تحميل القاعات";
      setError(msg);
      toast.error(msg);
    }
  };

  const loadCourses = async () => {
    try {
      const data = await fetchCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setCourses([]);
      const msg = err?.message || "فشل تحميل المقررات";
      setError(msg);
      toast.error(msg);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setUsers([]);
      const msg = err?.message || "فشل تحميل المستخدمين";
      setError(msg);
      toast.error(msg);
    }
  };

  const handleCreate = () => {
    setModalType("create");
    setSelectedLecture(null);
    resetForm();
    setShowModal(true);
  };

  const handleUpdate = (lec) => {
    setModalType("update");
    setSelectedLecture(lec);
    setForm({
      course: lec.course || "",
      instructorIds: Array.isArray(lec.instructor)
        ? lec.instructor.map((ins) => (typeof ins === 'object' ? ins.id : ins))
        : (lec.instructor ? [ (typeof lec.instructor === 'object' ? lec.instructor.id : lec.instructor) ] : []),
      location: lec.location || lec.location_id || "",
      day: lec.day || "",
      starttime: (lec.starttime || "").slice(0, 5),
      endtime: (lec.endtime || "").slice(0, 5),
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await deleteLecture(id);
      await loadLectures();
      setShowDeleteModal(false);
      setLectureToDelete(null);
      toast.success('تم حذف المحاضرة بنجاح');
    } catch (err) {
      const msg = err?.message || 'فشل في حذف المحاضرة';
      setError(msg);
      toast.error(msg);
    }
    setLoading(false);
  };

  const [form, setForm] = useState({
    course: "",
    instructorIds: [], // array of user ids
    location: "", // location id
    day: "",
    starttime: "", // HH:MM
    endtime: "", // HH:MM
  });

  const dayOptions = useMemo(
    () => [
      "السبت",
      "الأحد",
      "الإثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
    ],
    []
  );

  const resetForm = () => {
    setForm({
      course: "",
      instructorIds: [],
      location: "",
      day: "",
      starttime: "",
      endtime: "",
    });
  };

  const openDeleteModal = (lecture) => {
    setLectureToDelete(lecture);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic client-side validations
    const courseId = Number(form.course);
    if (!Number.isFinite(courseId) || courseId <= 0) {
      setError("المقرر مطلوب");
      toast.error('المقرر مطلوب');
      return;
    }
    if (!Array.isArray(form.instructorIds) || form.instructorIds.length === 0) {
      setError("المٌحاضر مطلوب");
      toast.error('المٌحاضر مطلوب');
      return;
    }
    const locationId = Number(form.location);
    if (!Number.isFinite(locationId) || locationId <= 0) {
      setError("القاعه مطلوبة");
      toast.error('القاعه مطلوبة');
      return;
    }
    if (!form.day) {
      setError("اليوم مطلوب");
      toast.error('اليوم مطلوب');
      return;
    }
    setLoading(true);
    try {
      const startDate = new Date(`1970-01-01T${form.starttime}:00`);
      const endDate = new Date(`1970-01-01T${form.endtime}:00`);
      if (!(startDate < endDate)) {
        const msg = "وقت البدء يجب أن يكون قبل وقت الانتهاء";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      const payload = {
        course: courseId,
        instructor: form.instructorIds.map((id) => Number(id)),
        location: locationId,
        day: form.day,
        starttime: form.starttime,
        endtime: form.endtime,
      };

      if (modalType === "create") {
        await createLecture(payload);
        toast.success('تم إنشاء المحاضرة بنجاح');
      } else if (modalType === "update" && selectedLecture) {
        await updateLecture(selectedLecture.id, payload);
        toast.success('تم تحديث المحاضرة بنجاح');
      }
      setShowModal(false);
      resetForm();
      await loadLectures();
      setError(null);
    } catch (err) {
      const msg = err?.message || 'حدث خطأ أثناء الحفظ';
      setError(msg);
      toast.error(msg);
    }
    setLoading(false);
  };

  const getLocationName = (lec) => {
    // If backend provides nested object
    if (lec.location && typeof lec.location === "object")
      return lec.location.name || lec.location.title || lec.location.slug;
    // Try match by id
    const loc = locations.find(
      (l) => l.id === lec.location || l.slug === lec.location
    );
    return loc ? loc.name : lec.location;
  };

  const getCourseName = (lec) => {
    if (lec.course && typeof lec.course === "object")
      return lec.course.title || lec.location.slug;
    const course = courses.find((c) => c.id === lec.course);
    return course ? course.title : lec.course;
  };

  const getUserName = (lec) => {
    const ids = Array.isArray(lec.instructor)
      ? lec.instructor.map((ins) => (typeof ins === 'object' ? ins.id : ins))
      : (lec.instructor ? [ (typeof lec.instructor === 'object' ? lec.instructor.id : lec.instructor) ] : []);
    const names = ids.map((id) => {
      const user = users.find((u) => u.id === id);
      return user ? `${user.first_name} ${user.last_name}` : String(id);
    });
    return names.join(', ');
  };

  // Format time (HH:MM or HH:MM:SS) into Arabic 12-hour with suffixes: ص for AM, م for PM
  const formatTimeArabic = (t) => {
    if (!t || typeof t !== "string") return t || "";
    const [hhRaw, mmRaw] = t.split(":");
    let hh = Number(hhRaw);
    const mm = Number(mmRaw);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return (t || "").slice(0,5);
    const isPM = hh >= 12;
    const suffix = isPM ? "م" : "ص";
    let hour12 = hh % 12;
    if (hour12 === 0) hour12 = 12;
    const minutes = String(mm).padStart(2, "0");
    return `${hour12}:${minutes} ${suffix}`;
  };

  return (
    <div className="lecture-page attendance-records-page">
      <div className="page-header">
        <h1>المحاضرات</h1>
        <Link 
          to="/instructor-grades" 
          className="btn-main !px-4 !py-2"
          title="إدارة درجات الطلاب"
        >
          إدارة الدرجات
        </Link>
      </div>
      {/* Keep minimal inline error, but primary channel is toast */}
      {error && (
        <div
          style={{ color: "#ef4444", textAlign: "center", marginBottom: "1rem" }}
        >
          {error}
        </div>
      )}

      <div className="lecture-table-wrapper">
        {loading ? (
          <div style={{ textAlign: "center", color: "#646cff" }}>
            جاري التحميل...
          </div>
        ) : (
          <table className="lecture-table">
            <thead>
              <tr>
                <th>المقرر</th>
                
                <th>القاعة</th>
                <th>اليوم</th>
                <th>الوقت</th>
                <th>الحضور</th>
                
              </tr>
            </thead>
            <tbody>
              {lectures.map((lec) => (
                <tr key={lec.id} className="lecture-row">
                  <td data-label="المقرر">{getCourseName(lec)}</td>
                
                  <td data-label="القاعة">{getLocationName(lec)}</td>
                  <td data-label="اليوم">{lec.day}</td>
                  <td data-label="الوقت">
                    {formatTimeArabic(lec.starttime)} - {formatTimeArabic(lec.endtime)}
                  </td>
                  <td data-label="الحضور">
                  <div className="class-actions justify-center">
                  <Link
                    to={`/attendance/${lec.id}`}
                    className="btn-main !px-4 !py-2 "
                    title="عرض الحضور لهذه المحاضرة"
                  >
                    تقرير الغياب
                  </Link>
                </div>
                  </td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      

 
    </div>
  );
}
