import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchLectures,
  createLecture,
  updateLecture,
  deleteLecture,
} from "../../services/lectureApi";
import { fetchLocations } from "../../services/locationApi";
import { fetchCourses } from "../../services/courseApi"
import { fetchUsers } from "../../services/userApi"
import './AttendanceRecords.css';
import '../../styles/tableScroll.css'; // shared table scrollbar
import toast from '../../utils/toast';
import { AttendanceAPI } from '../../services/attendanceApi';
export default function AttendanceRecords() {
  const { _isAuthenticated, user } = useAuth();
  const [lectures, setLectures] = useState([]);
  const [locations, setLocations] = useState([]);
  const [courses, setCourses] = useState([])
  const [users, setUsers] = useState([])
  const [_loading, setLoading] = useState(false);
  const [_error, setError] = useState(null);
  const [_showModal, setShowModal] = useState(false);
  const [_showDeleteModal, setShowDeleteModal] = useState(false);
  const [_lectureToDelete, setLectureToDelete] = useState(null);
  const [modalType, setModalType] = useState("create");
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);

  // Loaders and CRUD handlers (restored)
  useEffect(() => {
    loadLectures();
    loadLocations();
    loadCourses();
    loadUsers();
    loadAttendances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const hasGroup = useCallback((groupId) => {
    if (!user?.groups) return false;
    return user.groups.some(group => {
      const id = typeof group === 'object' ? group.id : group;
      return id === groupId;
    });
  }, [user?.groups]);

  // Define hasAnyGroup BEFORE any usage
  const hasAnyGroup = useCallback((groupIds) => {
    return groupIds.some(groupId => hasGroup(groupId));
  }, [hasGroup]);

  // Fetch all attendance sessions and keep only those for instructor's lectures
  const loadAttendances = async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const data = await AttendanceAPI.listAttendances().then(r => r.data);
      // If doctor, filter by their lectures; else keep empty or all as needed
      if (hasAnyGroup([3])) {
        // Use currently known lectures set if available
        const lectureIds = new Set(
          lectures && lectures.length
            ? lectures.map(l => Number(l.id))
            : []
        );
        // If lectures not loaded yet, we still set raw; another effect below will re-filter
        const filtered = lectureIds.size > 0
          ? data.filter(a => lectureIds.has(Number(a.lecture)))
          : data;
        setSessions(filtered);
      } else {
        setSessions(data);
      }
    } catch (err) {
      const msg = err?.message || 'فشل تحميل جلسات الحضور';
      setSessionsError(msg);
      toast.error(msg);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  // Re-filter sessions whenever lectures list updates (ensures instructor scoping)
  useEffect(() => {
    if (!sessions.length) return;
    if (hasAnyGroup([3]) && lectures.length) {
      const lectureIds = new Set(lectures.map(l => Number(l.id)));
      setSessions(prev => prev.filter(a => lectureIds.has(Number(a.lecture))));
    }
  }, [lectures, sessions.length, hasAnyGroup]);

  // hasAnyGroup already defined above

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

  const _handleCreate = () => {
    setModalType("create");
    setSelectedLecture(null);
    resetForm();
    setShowModal(true);
  };

  const _handleUpdate = (lec) => {
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

  const _handleDelete = async (id) => {
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

  const _dayOptions = useMemo(
    () => [
      "السبت",
      "الأحد",
      "الإثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
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

  const _openDeleteModal = (lecture) => {
    setLectureToDelete(lecture);
    setShowDeleteModal(true);
  };

  const _handleSubmit = async (e) => {
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

  const _getLocationName = (lec) => {
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

  const _getUserName = (lec) => {
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
        <h1>سجل الحضور</h1>
      </div>
      {/* Keep minimal inline error, but primary channel is toast */}
      {sessionsError && (
        <div style={{ color: "#ef4444", textAlign: "center", marginBottom: "1rem" }}>
          {sessionsError}
        </div>
      )}

      {/* Sessions list for the instructor's lectures only */}
      <div className="lecture-table-wrapper">
        {sessionsLoading ? (
          <div style={{ textAlign: "center", color: "#646cff" }}>جاري التحميل...</div>
        ) : (
          <div>
            <table className="lecture-table">
              <thead>
                <tr>
                  <th>المقرر</th>
                  <th>المحاضرة</th>
                  <th>تاريخ الجلسة</th>
                  <th>الانتقال</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '12px' }}>لا توجد جلسات متاحة</td>
                  </tr>
                ) : (
                  sessions
                    .slice()
                    .sort((a, b) => new Date(b.time) - new Date(a.time))
                    .map((att) => {
                      const lec = lectures.find(l => Number(l.id) === Number(att.lecture));
                      return (
                        <tr key={att.id}>
                          <td>{lec ? getCourseName(lec) : att.lecture}</td>
                          <td>{lec ? `${lec.day} (${formatTimeArabic(lec.starttime)} - ${formatTimeArabic(lec.endtime)})` : '-'}</td>
                          <td>{new Date(att.time).toLocaleString('ar-EG')}</td>
                          <td>
                            <Link
                              to={`/attendance/${att.lecture}`}
                              state={{ fromAttendanceRecords: true }}
                              className="btn-main !px-4 !py-2"
                            >
                               تقرير الغياب
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      

 
    </div>
  );
}
