import React, { useEffect, useMemo, useState } from "react";
import "./lecture.css";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import TimePicker from "../../components/ui/TimePicker";
import Select from "../../components/ui/Select";
import {
  fetchLectures,
  createLecture,
  updateLecture,
  deleteLecture,
} from "../../services/lectureApi";
import { fetchLocations } from "../../services/locationApi";
import { fetchCourses } from "../../services/courseApi"
import { fetchUsers } from "../../services/userApi"
import { useAuth } from "../../context/AuthContext";
import toast from '../../utils/toast';

export default function Lecture() {
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
  const {user} = useAuth()
  const [doctors, setDoctors] = useState([])
  // Loaders and CRUD handlers (restored)
  useEffect(() => {
    loadLectures();
    loadLocations();
    loadCourses();
    loadDoctors();
  }, []);

  const loadLectures = async () => {
    setLoading(true);
    try {
      const data = await fetchLectures();
      setLectures(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setLectures([]);
      const msg = 'فشل تحميل المحاضرات';
      setError(msg);
      toast.apiError(err, msg);
    }
    setLoading(false);
  };

  const loadLocations = async () => {
    try {
      const data = await fetchLocations();
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      setLocations([]);
      const msg = 'فشل تحميل القاعات';
      setError(msg);
      toast.apiError(err, msg);
    }
  };

  const loadCourses = async () => {
    try {
      const data = await fetchCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setCourses([]);
      const msg = 'فشل تحميل المقررات';
      setError(msg);
      toast.apiError(err, msg);
    }
  };
//check  which user  has the same faculty
  const loadDoctors = async () => {
    try {
      const allUsers = await fetchUsers();
      const doctors = allUsers.filter(u => u.groups.map(g => g.name).includes('دكاترة - معيدين'));
//check if the doctor has the same faculty
if(user.faculty){
      const doctorsWithSameFaculty = doctors.filter(d => d.faculty?.id == user.faculty?.id );
      setDoctors(doctorsWithSameFaculty);
    }else{
      setDoctors(doctors);
    }
     
      
      
    } catch (err) {
      setDoctors([]);
      const msg = 'فشل تحميل قائمة الدكاترة';
      setError(msg);
      toast.apiError(err, msg);
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
      toast.success('تم حذف المحاضرة بنجاح');
    } catch (err) {
      const msg = 'فشل حذف المحاضرة';
      setError(msg);
      toast.apiError(err, msg);
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

  // Compute selected course object and its program IDs
  const selectedCourse = useMemo(() => {
    const cid = Number(form.course);
    return Array.isArray(courses) ? courses.find(c => Number(c.id) === cid) : null;
  }, [courses, form.course]);

  const selectedCourseProgramIds = useMemo(() => {
    if (!selectedCourse) return [];
    const getId = (p) => (p && typeof p === 'object') ? p.id : p;
    return Array.isArray(selectedCourse.programs)
      ? selectedCourse.programs.map(getId).map(id => String(id))
      : [];
  }, [selectedCourse]);

  // Filter doctors by selected course program(s). If course has no programs, show all doctors.
  const filteredDoctors = useMemo(() => {
    if (!selectedCourseProgramIds.length) return doctors;
    return doctors.filter(d => {
      const pid = (d.program && typeof d.program === 'object') ? d.program.id : (d.program_id ?? d.program);
      return selectedCourseProgramIds.includes(String(pid));
    });
  }, [doctors, selectedCourseProgramIds]);

  // Helper to add minutes in 24h string HH:MM -> HH:MM
  const addMinutes = (time, mins) => {
    if (!time) return time;
    const [h, m] = time.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return time;
    const base = new Date(1970, 0, 1, h, m, 0);
    base.setMinutes(base.getMinutes() + mins);
    const HH = String(base.getHours()).padStart(2, "0");
    const MM = String(base.getMinutes()).padStart(2, "0");
    return `${HH}:${MM}`;
  };

  // When start time changes, auto bump end if empty or <= start
  const onStartChange = (v) => {
    setForm((prev) => {
      const next = { ...prev, starttime: v };
      if (!prev.endtime || !isEndAfter(prev.endtime, v)) {
        // default duration 90 minutes
        next.endtime = addMinutes(v, 90);
      }
      return next;
    });
  };

  const onEndChange = (v) => {
    setForm((prev) => ({ ...prev, endtime: v }));
  };

  const isEndAfter = (end, start) => {
    if (!end || !start) return false;
    const a = new Date(`1970-01-01T${start}:00`);
    const b = new Date(`1970-01-01T${end}:00`);
    return b > a;
  };

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
      const msg = "المقرر مطلوب";
      setError(msg);
      toast.error(msg);
      return;
    }
    const instructorId = Number(form.instructor);
    if (!Number.isFinite(instructorId) || instructorId <= 0) {
      const msg = "المٌحاضر مطلوب";
      setError(msg);
      toast.error(msg);
      return;
    }
    const locationId = Number(form.location);
    if (!Number.isFinite(locationId) || locationId <= 0) {
      const msg = "القاعه مطلوبة";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!form.day) {
      const msg = "اليوم مطلوب";
      setError(msg);
      toast.error(msg);
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
        instructor: instructorId,
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
      const msg = 'فشل حفظ المحاضرة';
      setError(msg);
      toast.apiError(err, msg);
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
        <div
          className="add-lecture-btn"
          onClick={handleCreate}
          style={{
            minWidth: "160px",
            minHeight: "80px",
            padding: "1rem 0.7rem",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.5rem",
            boxSizing: "border-box",
            display: "flex",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              fontSize: "1.5rem",
              marginBottom: 0,
              marginLeft: "0.5rem",
            }}
          >
            +
          </span>
      <span style={{ fontWeight: "bold", fontSize: "1rem" }}>
        اضافة محاضرة
      </span>
    </div>
  </div>

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
                <th>المحاضر</th>
                <th>القاعة</th>
                <th>اليوم</th>
                <th>الوقت</th>
                <th>تعديل</th>
                <th>حذف</th>
              </tr>
            </thead>
            <tbody>
              {lectures.map((lec) => (
                <tr key={lec.id} className="lecture-row">
                  <td data-label="المقرر">{getCourseName(lec)}</td>
                  <td data-label="المحاضر">{getUserName(lec)}</td>
                  <td data-label="القاعة">{getLocationName(lec)}</td>
                  <td data-label="اليوم">{lec.day}</td>
                  <td data-label="الوقت">
                    {formatTimeArabic(lec.starttime)} - {formatTimeArabic(lec.endtime)}
                  </td>
                  <td data-label="تعديل">
                    <Button
                      className="btn update"
                      variant="update"
                      onClick={() => handleUpdate(lec)}
                    >
                      تعديل
                    </Button>
                  </td>
                  <td data-label="حذف">
                    <Button
                      className="btn delete"
                      variant="delete"
                      onClick={() => openDeleteModal(lec)}
                    >
                      <span className="btn-icon-left" aria-hidden="true">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M3 6h18v2H3V6zm2 3h14v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9zm5 2v7h2v-7h-2zm-4 0v7h2v-7H6zm8 0v7h2v-7h-2z" />
                        </svg>
                      </span>
                      حذف
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          title={modalType === "create" ? "اضافة محاضرة جديدة" : "تعديل محاضرة"}
          backdropClass="lecture-modal-bg"
          modalClass="lecture-modal"
          showClose
          containerStyle={{ paddingTop: "80px" }}
        >
          <form
            onSubmit={handleSubmit}
            style={{ maxWidth: 520, padding: "0.6rem 0.75rem", gap: "0.5rem" }}
          >
            <label>
              المقرر:
              <Select
                value={form.course}
                onChange={(val) => {
                  // When course changes, reset instructor to avoid mismatches
                  setForm({ ...form, course: val, instructor: "" });
                }}
                placeholder="اختر المقرر"
                options={courses.map(c=>({value:c.id, label:c.title}))}
              />
            </label>
            <label>
              المٌحاضر:
              <Select
                value={form.instructor}
                onChange={(val) => setForm({ ...form, instructor: val })}
                placeholder="اختر المحاضر"
                options={filteredDoctors.map(u => ({
                  value: u.id,
                  label: `${u.first_name} ${u.last_name} ${u.faculty?.name ? ` - ${u.faculty.name}` : ''}${u.program?.name ? ` - ${u.program.name}` : ''}`
                }))}
              />
            </label>
            <label>
              القاعة:
              <Select
                value={form.location}
                onChange={(val) => setForm({ ...form, location: val })}
                placeholder="اختر القاعة"
                options={locations.map(l=>({value:l.id, label:l.name}))}
              />
  
            </label>
            <label>
              اليوم:
              <Select
                value={form.day}
                onChange={(val) => setForm({ ...form, day: val })}
                placeholder="اختر اليوم"
                options={dayOptions.map(d=>({value:d, label:d}))}
              />
            </label>
            <div className="time-row">
              <label>
                وقت البدء:
                <TimePicker
                  value={form.starttime}
                  onChange={onStartChange}
                />
              </label>
              <label>
                وقت الانتهاء:
                <TimePicker
                  value={form.endtime}
                  onChange={onEndChange}
                />
              </label>
            </div>
            <Button type="submit" className="btn update" variant="update" disabled={loading}>
              {loading
                ? "جارٍ الحفظ..."
                : modalType === "create"
                ? "اضافة"
                : "تحديث"}
            </Button>
            <Button
              type="button"
              className="btn cancel"
              variant="cancel"
              onClick={() => {
                setShowModal(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={loading}
              style={{
                background: "#eee",
                color: "#333",
                border: "1px solid #bbb",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f5c6cb")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "#eee")}
            >
              الغاء
            </Button>
          </form>
        </Modal>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && lectureToDelete && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          title={"تأكيد حذف المحاضرة"}
          backdropClass="lecture-modal-bg"
          modalClass="lecture-modal"
          showClose
          containerStyle={{ paddingTop: "80px" }}
        >
          <p>
            هل أنت متأكد من حذف المحاضرة <b>{lectureToDelete.title}</b>؟ لا يمكن
            التراجع عن هذا الإجراء.
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
              marginTop: "1.5rem",
            }}
          >
            <Button
              className="btn delete"
              variant="delete"
              onClick={() => handleDelete(lectureToDelete.id)}
              disabled={loading}
            >
              <span className="btn-icon-left" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 6h18v2H3V6zm2 3h14v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9zm5 2v7h2v-7h-2zm-4 0v7h2v-7H6zm8 0v7h2v-7h-2z" />
                </svg>
              </span>
              نعم، حذف
            </Button>
            <Button
              className="btn cancel"
              variant="cancel"
              style={{
                background: "#eee",
                color: "#333",
                border: "1px solid #bbb",
              }}
              onClick={() => {
                setShowDeleteModal(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f5c6cb")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#eee")
              }
            >
              إلغاء
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
