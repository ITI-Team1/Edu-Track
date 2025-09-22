import React, { useEffect, useState } from "react";
import "../Department/department.css";
import {
  fetchPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
} from "../../services/programApi";
import { fetchFaculties } from "../../services/facultyApi";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import Select from "../../components/ui/Select";
import toast from '../../utils/toast';

export default function Department({_permissions, _facultiesData}) {
  const { user: _user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [facultiesLoaded, setFacultiesLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // For create/update modal
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [modalType, setModalType] = useState("create"); // 'create' or 'update'
  const [selectedDept, setSelectedDept] = useState(null);
  const [form, setForm] = useState({ name: "", slug: "", faculty: "" });
  const [submitting, setSubmitting] = useState(false);

  // slugify removed because not used in this module

  // Note: data is fully dynamic now (no mock fallbacks)

  // Wrap loaders in useCallback and include them as deps to satisfy hooks lint rules
  const loadDepartmentsCb = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPrograms();
      const list = Array.isArray(data) ? data : (data?.results ?? []);
      const patched = list.map((dept) => ({
        ...dept,
        faculty:
          typeof dept.faculty === "object"
            ? dept.faculty
            : faculties.find((fac) => fac.id === dept.faculty) || dept.faculty,
      }));
      setDepartments(patched);
      setError(null);
    } catch (err) {
      setDepartments([]);
      const msg = 'فشل تحميل الأقسام';
      setError(msg);
      toast.apiError(err, msg);
    } finally {
      setLoading(false);
    }
  }, [faculties]);

  const loadFacultiesCb = React.useCallback(async () => {
    try {
      const data = await fetchFaculties();
      const list = Array.isArray(data) ? data : (data?.results ?? []);
      setFaculties(list);
      setFacultiesLoaded(!!(list && list.length));
    } catch (err) {
      setFaculties([]);
      setFacultiesLoaded(false);
      const msg = "تعذر تحميل قائمة الكليات. لا يمكن إضافة/تعديل قسم بدون الكليات.";
      setError(msg);
      toast.apiError(err, msg);
    }
  }, []);

  useEffect(() => {
    loadFacultiesCb();
  }, [loadFacultiesCb]);

  useEffect(() => {
    if (facultiesLoaded) {
      loadDepartmentsCb();
    }
  }, [loadDepartmentsCb, facultiesLoaded]);
  // loaders replaced by useCallbacks above

  const handleDelete = async (slug) => {
    setLoading(true);
    try {
      await deleteProgram(slug);
      await loadDepartmentsCb();
      setShowDeleteModal(false);
      setDeptToDelete(null);
      toast.success('تم حذف القسم بنجاح');
    } catch (err) {
      const msg = 'فشل حذف القسم';
      setError(msg);
      toast.apiError(err, msg);
    }
    setLoading(false);
  };

  const openDeleteModal = (dept) => {
    setDeptToDelete(dept);
    setShowDeleteModal(true);
  };

  const handleUpdate = (dept) => {
    setModalType("update");
    setSelectedDept(dept);
    setForm({ name: dept.name, slug: dept.slug, faculty: dept.faculty.id });
    setShowModal(true);
  };

  const handleCreate = () => {
    setModalType("create");
    setSelectedDept(null);
    setForm({ name: "", slug: "", faculty: "" });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!facultiesLoaded) {
      const msg = "تعذر تحميل الكليات. يرجى إعادة تحميل الصفحة أو التأكد من تشغيل السيرفر.";
      setError(msg);
      toast.error(msg);
      return;
    }
    // Client-side validation
    if (!form.name?.trim()) {
      const msg = "اسم القسم مطلوب";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!form.slug?.trim()) {
      const msg = "الاسم المختصر مطلوب";
      setError(msg);
      toast.error(msg);
      return;
    }
    // Slug must be ASCII letters/numbers/-/_ to match Django SlugField default
    const slugPattern = /^[A-Za-z0-9_-]+$/;
    if (!slugPattern.test(form.slug)) {
      const msg = "الاسم المختصر يجب أن يحتوي على أحرف إنجليزية أو أرقام أو - أو _ فقط";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!form.faculty) {
      const msg = "يجب اختيار الكلية";
      setError(msg);
      toast.error(msg);
      return;
    }
    setLoading(true);
    setSubmitting(true);
    try {
      if (modalType === "create") {
        const payload = {
          name: form.name.trim(),
          slug: form.slug.trim(),
          faculty: Number(form.faculty),
        };
        await createProgram(payload);
        toast.success('تم إنشاء القسم بنجاح');
      } else if (modalType === "update" && selectedDept) {
        const payload = {
          name: form.name,
          slug: form.slug.trim(),
          faculty: Number(form.faculty),
        };
        await updateProgram(selectedDept.slug, payload);
        toast.success('تم تحديث القسم بنجاح');
      }
      setShowModal(false);
      await loadDepartmentsCb();
    } catch (err) {
      const msg = "حدث خطأ أثناء حفظ القسم";
      setError(msg);
      toast.apiError(err, msg);
    }
    setLoading(false);
    setSubmitting(false);
  };

  return (
    <div className="department-page">
     
      
         <div className="page-header">
         <h1>الأقسام</h1>
        <Button
          className="add-department-card"
          onClick={handleCreate}
          
        >
          <span
           className="text-xl"
          >
            +
          </span>
          <span className="text-lg">
            اضافه قسم
          </span>
        </Button>
      </div>
      {/* Toasts handle feedback globally */}
      <div className="department-grid">
        {/* Department Cards */}
        {loading ? (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              color: "#646cff",
            }}
          >
            جاري التحميل...
          </div>
        ) : (
          departments.map((dept) => (
            <div key={dept.slug} className="department-card">
              <div className="department-info">
                <div className="department-name">
                  اسم القسم: <span>{dept.name}</span>
                </div>
                <div className="faculty-name">
                  اسم الكليه: <span>{dept.faculty?.name}</span>
                </div>
              </div>
              <div className="department-actions">
                <Button className="btn update btn-lg" variant="update" onClick={() => handleUpdate(dept)}>
                  تعديل
                </Button>
                <Button
                  variant="delete"
                  onClick={() => openDeleteModal(dept)}
                  className="btn delete btn-lg"
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
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Create/Update */}
      {showModal && (
        <div style={{ paddingTop: "80px" }}>
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            backdropClass="department-modal-bg"
            modalClass="department-modal"
            containerStyle={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}
          >
            <h3>{modalType === "create" ? "اضافة قسم جديد" : "تعديل القسم"}</h3>
            <form onSubmit={handleSubmit}>
              <label>
                اسم القسم:
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label>
                الاسم المختصر:
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="مثال: algorithms"
                  required
                />
              </label>
              <label>
                الكلية:
                <Select
                  value={form.faculty}
                  onChange={(val) => setForm({ ...form, faculty: val })}
                  placeholder="اختر الكلية"
                  options={facultiesLoaded? faculties.map(f=>({value:f.id, label:f.name})) : []}
                  disabled={!facultiesLoaded}
                />
              </label>
              <Button
                type="submit"
                variant="update"
                className="btn update"
                disabled={submitting || !facultiesLoaded}
              >
                {submitting
                  ? "جارٍ الحفظ..."
                  : modalType === "create"
                  ? "اضافة القسم"
                  : "تحديث القسم"}
              </Button>
              <Button
                type="button"
                variant="cancel"
                className="btn cancel"
                onClick={() => {
                  setShowModal(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{
                  background: "#eee",
                  color: "#333",
                  border: "1px solid #bbb",
                }}
              >
                الغاء
              </Button>
            </form>
          </Modal>
        </div>
      )}
      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && deptToDelete && (
        <div style={{ paddingTop: "80px" }}>
          <Modal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            backdropClass="department-modal-bg"
            modalClass="department-modal"
            containerStyle={{
              maxWidth: 400,
              textAlign: "center",
              maxHeight: "calc(100vh - 120px)",
              overflowY: "auto",
            }}
          >
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              <span style={{ color: "#d32f2f", fontSize: "1.5rem" }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 6h18v2H3V6zm2 3h14v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9zm5 2v7h2v-7h-2zm-4 0v7h2v-7H6zm8 0v7h2v-7h-2z" />
                </svg>
              </span>
              تأكيد حذف القسم
            </h3>
            <p>
              هل أنت متأكد من حذف القسم <b>{deptToDelete.name}</b>؟ لا يمكن
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
                className="btn delete btn-lg"
                variant="delete"
                onClick={() => handleDelete(deptToDelete.slug)}
                disabled={loading}
              >
                <span style={{ verticalAlign: "middle", marginRight: "4px" }}>
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
        </div>
      )}
    </div>
  );
}
