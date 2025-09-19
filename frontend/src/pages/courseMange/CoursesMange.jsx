import React, { useEffect, useState } from "react";
import "./coursesMange.css";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import {
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../../services/courseApi";
import { fetchPrograms } from "../../services/programApi";

export default function CoursesMange() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [modalType, setModalType] = useState("create");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [form, setForm] = useState({ title: "", slug: "", programs: [] });
  const [programs, setPrograms] = useState([]);
  const [programsLoaded, setProgramsLoaded] = useState(false);

  // MOCK DATA FOR DEMO/DEV - REMOVE THIS BLOCK FOR PRODUCTION
  // To show mock data, uncomment the following and comment out the useEffect below
  /*
  useEffect(() => {
    setCourses([
      { slug: 'math-101', name: 'الرياضيات 101', code: 'MATH101', credits: 3 },
      { slug: 'phys-lab', name: 'معمل الفيزياء', code: 'PHYS201', credits: 2 },
      { slug: 'eng-lit', name: 'الأدب الإنجليزي', code: 'ENG301', credits: 2 },
    ]);
  }, []);
  */
  // END MOCK DATA

  useEffect(() => {
    loadPrograms();
    loadCourses();
  }, []);

  const loadPrograms = async () => {
    try {
      const data = await fetchPrograms();
      setPrograms(Array.isArray(data) ? data : []);
      setProgramsLoaded(!!(data && data.length));
    } catch (err) {
      setPrograms([]);
      setProgramsLoaded(false);
      setError(
        err?.message ||
          "تعذر تحميل الاقسام الأكاديمية (البرامج). لا يمكن إضافة/تعديل مقرّر بدون الاقسام."
      );
    }
  };

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await fetchCourses();
      // If no real data, show mock data for demo
      setCourses(
        data.length
          ? data
          : [
              {
                slug: "math-101",
                name: "الرياضيات 101",
                code: "MATH101",
                credits: 3,
              },
              {
                slug: "phys-lab",
                name: "معمل الفيزياء",
                code: "PHYS201",
                credits: 2,
              },
              {
                slug: "eng-lit",
                name: "الأدب الإنجليزي",
                code: "ENG301",
                credits: 2,
              },
            ]
      );
      setError(null);
    } catch (err) {
      setCourses([
        {
          slug: "math-101",
          name: "الرياضيات 101",
          code: "MATH101",
          credits: 3,
        },
        {
          slug: "phys-lab",
          name: "معمل الفيزياء",
          code: "PHYS201",
          credits: 2,
        },
        {
          slug: "eng-lit",
          name: "الأدب الإنجليزي",
          code: "ENG301",
          credits: 2,
        },
      ]);
      setError(err?.message || null);
    }
    setLoading(false);
  };

  const handleDelete = async (slug) => {
    setLoading(true);
    try {
      await deleteCourse(slug);
      await loadCourses();
      setShowDeleteModal(false);
      setCourseToDelete(null);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const openDeleteModal = (course) => {
    setCourseToDelete(course);
    setShowDeleteModal(true);
  };

  const handleUpdate = (course) => {
    setModalType("update");
    setSelectedCourse(course);
    setForm({
      title: course.title || "",
      slug: course.slug || "",
      programs: (course.programs || []).map((p) => p.id ?? p),
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setModalType("create");
    setSelectedCourse(null);
    setForm({ title: "", slug: "", programs: [] });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!programsLoaded) {
      setError(
        "تعذر تحميل الأقسام الأكاديمية. يرجى إعادة تحميل الصفحة أو التأكد من تشغيل السيرفر."
      );
      return;
    }
    if (!form.title?.trim()) {
      setError("اسم المقرر مطلوب");
      return;
    }
    if (!form.slug?.trim()) {
      setError("المعرف (Slug) مطلوب");
      return;
    }
    const slugPattern = /^[A-Za-z0-9_-]+$/;
    if (!slugPattern.test(form.slug)) {
      setError(
        "المعرف (Slug) يجب أن يحتوي على أحرف إنجليزية أو أرقام أو - أو _ فقط"
      );
      return;
    }
    if (!Array.isArray(form.programs) || form.programs.length === 0) {
      setError("يجب اختيار برنامج واحد على الأقل");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        programs: form.programs.map(Number),
      };
      if (modalType === "create") {
        await createCourse(payload);
      } else if (modalType === "update" && selectedCourse) {
        await updateCourse(selectedCourse.slug, payload);
      }
      setShowModal(false);
      await loadCourses();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="courses-mange-page">
      <div className="page-header">
        <h1>ادارة المقررات</h1>
        <Button
          className="courses-mange-add-btn"
          onClick={handleCreate}
          disabled={!programsLoaded}
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
            اضافة مقرر جديد
          </span>
        </Button>
      </div>
      {error && (
        <div
          style={{ color: "red", textAlign: "center", marginBottom: "1rem" }}
        >
          {error}
        </div>
      )}
      <div className="courses-mange-table-wrapper">
        {loading ? (
          <div style={{ textAlign: "center", color: "#646cff" }}>
            جاري التحميل...
          </div>
        ) : (
          <table className="courses-mange-table">
            <thead>
              <tr>
                <th>اسم المقرر</th>
                <th>المعرف (Slug)</th>
                <th>البرامج المرتبطة</th>
                <th>تعديل</th>
                <th>حذف</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.slug}>
                  <td data-label="اسم المقرر">{course.title}</td>
                  <td data-label="المعرف (Slug)">{course.slug}</td>
                  <td data-label="البرامج المرتبطة">
                    {Array.isArray(course.programs) ? course.programs
                          .map((p) => {
                            const program = programs.find((pr) => pr.id === (p.id || p));
                            return program?.name || p;
                          })
                          .join(" - ")
                      : "-"}
                  </td>
                  <td data-label="تعديل">
                    <Button
                      className="btn update"
                      variant="update"
                      onClick={() => handleUpdate(course)}
                    >
                      تعديل
                    </Button>
                  </td>
                  <td data-label="حذف">
                    <Button
                      className="btn delete"
                      variant="delete"
                      onClick={() => openDeleteModal(course)}
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
      {/* Modal for Create/Update */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          title={modalType === "create" ? "اضافة مقرر جديد" : "تعديل المقرر"}
          backdropClass="courses-mange-modal-bg"
          modalClass="courses-mange-modal"
          showClose
          containerStyle={{ paddingTop: "80px" }}
        >
          <form
            onSubmit={handleSubmit}
            style={{ maxWidth: 520, padding: "0.6rem 0.75rem", gap: "0.5rem" }}
          >
            <label>
              اسم المقرر:
              <input
                name="title"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </label>
            <label>
              المعرف (Slug):
              <input
                name="slug"
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
              />
            </label>
            <label>
              اختر البرامج المرتبطة:
              <select
                name="programs"
                multiple
                size={Math.min(6, Math.max(3, programs.length || 3))}
                value={(form.programs || []).map(String)}
                onChange={(e) => {
                  const opts = Array.from(e.target.selectedOptions).map(
                    (o) => o.value
                  );
                  setForm({ ...form, programs: opts });
                }}
                disabled={!programsLoaded || !programs.length}
                required
              >
                {!programsLoaded && (
                  <option value="" disabled>
                    جاري تحميل البرامج...
                  </option>
                )}
                {programsLoaded && !programs.length && (
                  <option value="" disabled>
                    لا توجد برامج متاحة
                  </option>
                )}
                {programsLoaded && programs.length > 0 && (
                  <option value="" disabled>
                    — اختر برنامج/برامج —
                  </option>
                )}
                {programsLoaded &&
                  programs.map((p) => (
                    <option key={p.slug || p.id} value={String(p.id)}>
                      {p.name || p.title}
                    </option>
                  ))}
              </select>
            </label>
            <Button
              type="submit"
              className="btn update"
              variant="update"
              disabled={!programsLoaded}
            >
              {modalType === "create" ? "اضافة المقرر" : "تحديث المقرر"}
            </Button>
            <Button
              type="button"
              className="btn cancel"
              variant="cancel"
              onClick={() => {
                setShowModal(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
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
      {showDeleteModal && courseToDelete && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title={"تأكيد حذف المقرر"}
          backdropClass="courses-mange-modal-bg"
          modalClass="courses-mange-modal"
          showClose
          containerStyle={{ paddingTop: "80px" }}
        >
          <p>
            هل أنت متأكد من حذف المقرر <b>{courseToDelete.title}</b>؟ لا يمكن
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
              onClick={() => handleDelete(courseToDelete.slug)}
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
