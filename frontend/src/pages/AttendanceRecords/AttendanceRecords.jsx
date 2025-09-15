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

  const loadLectures = async () => {
    setLoading(true);
    try {
      const data = await fetchLectures();
      setLectures(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setLectures([]);
      setError(err?.message || "");
    }
    setLoading(false);
  };

  const loadLocations = async () => {
    try {
      const data = await fetchLocations();
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      setLocations([]);
      setError(err?.message || "");
    }
  };

  const loadCourses = async () => {
    try {
      const data = await fetchCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setCourses([]);
      setError(err?.message || "");
    }
  };

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setUsers([]);
      setError(err?.message || "");
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
      instructor: lec.instructor || "",
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
    } catch (err) {
      setError(err?.message || "");
    }
    setLoading(false);
  };

  const [form, setForm] = useState({
    course: "",
    instructor: "", // user name
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
      instructor: "",
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
      return;
    }
    const instructorId = Number(form.instructor);
    if (!Number.isFinite(instructorId) || instructorId <= 0) {
      setError("المٌحاضر مطلوب");
      return;
    }
    const locationId = Number(form.location);
    if (!Number.isFinite(locationId) || locationId <= 0) {
      setError("القاعه مطلوبة");
      return;
    }
    if (!form.day) {
      setError("اليوم مطلوب");
      return;
    }
    setLoading(true);
    try {
      const startDate = new Date(`1970-01-01T${form.starttime}:00`);
      const endDate = new Date(`1970-01-01T${form.endtime}:00`);
      if (!(startDate < endDate)) {
        setError("وقت البدء يجب أن يكون قبل وقت الانتهاء");
        setLoading(false);
        return;
      }

      const payload = {
        course: courseId,
        instructor: instructorId,
        location: locationId,
        day: form.day,
        starttime: form.starttime,
        endtime: form.endtime,
      };

      if (modalType === "create") {
        await createLecture(payload);
      } else if (modalType === "update" && selectedLecture) {
        await updateLecture(selectedLecture.id, payload);
      }
      setShowModal(false);
      resetForm();
      await loadLectures();
      setError(null);
    } catch (err) {
      setError(err?.message);
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
    if (lec.instructor && typeof lec.instructor === "object")
      return `${lec.instructor.first_name} ${lec.instructor.last_name}`;
    const user = users.find((u) => u.id === lec.instructor);
    return user ? `${user.first_name} ${user.last_name}` : lec.instructor;
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
    <div className="lecture-page">
      <div className="page-header">
               
        <h1>المحاضرات</h1>
        
      </div>
      {error && (
        <div
          style={{ color: "red", textAlign: "center", marginBottom: "1rem" }}
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
                  <td>{getCourseName(lec)}</td>
                
                  <td>{getLocationName(lec)}</td>
                  <td>{lec.day}</td>
                  <td>
                    {formatTimeArabic(lec.starttime)} - {formatTimeArabic(lec.endtime)}
                  </td>
                  <td>
                  <div className="class-actions">
                  <Link
                    to={`/attendance/sheet/${lec.id}`}
                    className="btn"
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
