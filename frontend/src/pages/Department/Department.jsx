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

  // Mock data for style testing (memoized)
  const mockFaculties = React.useMemo(
    () => [
      { id: 1, name: "كلية الهندسة" },
      { id: 2, name: "كلية العلوم" },
      { id: 3, name: "كلية التجارة" },
    ],
    []
  );
  const mockDepartments = React.useMemo(
    () => [
      { slug: "cs", name: "قسم الحاسبات", faculty: mockFaculties[0] },
      { slug: "physics", name: "قسم الفيزياء", faculty: mockFaculties[1] },
      { slug: "chemistry", name: "قسم الكيمياء", faculty: mockFaculties[1] },
      {
        slug: "business",
        name: "قسم إدارة الأعمال",
        faculty: mockFaculties[2],
      },
    ],
    [mockFaculties]
  );

  // Wrap loaders in useCallback and include them as deps to satisfy hooks lint rules
  const loadDepartmentsCb = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPrograms();
      const patched = data.map(dept => ({
        ...dept,
        faculty: typeof dept.faculty === 'object' ? dept.faculty : faculties.find(fac => fac.id === dept.faculty) || dept.faculty,
      }));
      setDepartments(patched.length ? patched : mockDepartments);
      setError(null);
    } catch (err) {
      setDepartments(mockDepartments);
      setError(err?.message || null);
    }
    setLoading(false);
  }, [mockDepartments, faculties]);

  const loadFacultiesCb = React.useCallback(async () => {
    try {
      const data = await fetchFaculties();
      setFaculties(data.length ? data : mockFaculties);
      setFacultiesLoaded(!!data.length);
    } catch (err) {
      setFaculties([]);
      setFacultiesLoaded(false);
      setError(
        err?.message ||
          "تعذر تحميل قائمة الكليات. لا يمكن إضافة/تعديل قسم بدون الكليات."
      );
    }
  }, [mockFaculties]);

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
    } catch (err) {
      setError(err.message);
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
      setError(
        "تعذر تحميل الكليات. يرجى إعادة تحميل الصفحة أو التأكد من تشغيل السيرفر."
      );
      return;
    }
    // Client-side validation
    if (!form.name?.trim()) {
      setError("اسم القسم مطلوب");
      return;
    }
    if (!form.slug?.trim()) {
      setError("الاسم المختصر مطلوب");
      return;
    }
    // Slug must be ASCII letters/numbers/-/_ to match Django SlugField default
    const slugPattern = /^[A-Za-z0-9_-]+$/;
    if (!slugPattern.test(form.slug)) {
      setError("الاسم المختصر يجب أن يحتوي على أحرف إنجليزية أو أرقام أو - أو _ فقط");
      return;
    }
    if (!form.faculty) {
      setError("يجب اختيار الكلية");
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
      } else if (modalType === "update" && selectedDept) {
        const payload = {
          name: form.name,
          slug: form.slug.trim(),
          faculty: Number(form.faculty),
        };
        await updateProgram(selectedDept.slug, payload);
      }
      setShowModal(false);
      await loadDepartmentsCb();
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء حفظ القسم");
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
      {error && (
        <div
          style={{ color: "red", textAlign: "center", marginBottom: "1rem" }}
        >
          {error}
        </div>
      )}
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
