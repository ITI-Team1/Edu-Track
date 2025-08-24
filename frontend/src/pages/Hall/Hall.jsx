import React, { useEffect, useState } from "react";
import "./hall.css";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import {
  fetchLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../../services/locationApi";
import { fetchFaculties } from "../../services/facultyApi";

export default function Hall() {
  const [halls, setHalls] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [facultiesLoaded, setFacultiesLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hallToDelete, setHallToDelete] = useState(null);
  const [modalType, setModalType] = useState("create");
  const [selectedHall, setSelectedHall] = useState(null);
  const [form, setForm] = useState({
    name: "",
    faculty: "",
    slug: "",
    capacity: "",
  });

  // Helpers to work with both shapes coming from API:
  // hall.faculty could be an object {id, name} (mock) OR just an ID (real API)
  const getFacultyId = (facultyValue) =>
    typeof facultyValue === "object" && facultyValue !== null
      ? facultyValue.id
      : Number(facultyValue);

  const getFacultyName = (hall) => {
    const fid = getFacultyId(hall?.faculty);
    const fac = faculties.find((f) => f.id === fid);
    // If backend returns nested object, fallback to it; otherwise use looked-up name
    return fac?.name ?? (typeof hall?.faculty === "object" ? hall?.faculty?.name : "");
  };

  // MOCK DATA FOR DEMO/DEV - REMOVE THIS BLOCK FOR PRODUCTION
  // To show mock data, uncomment the following and comment out the useEffect below
  /*
  useEffect(() => {
    setHalls([
      { slug: 'hall-101', name: 'قاعة 101', faculty: { id: 1, name: 'كلية الهندسة' }, capacity: 120 },
      { slug: 'hall-202', name: 'قاعة 202', faculty: { id: 2, name: 'كلية العلوم' }, capacity: 80 },
      { slug: 'hall-303', name: 'قاعة 303', faculty: { id: 3, name: 'كلية التجارة' }, capacity: 60 },
    ]);
    setFaculties([
      { id: 1, name: 'كلية الهندسة' },
      { id: 2, name: 'كلية العلوم' },
      { id: 3, name: 'كلية التجارة' },
    ]);
  }, []);
  */
  // END MOCK DATA

  useEffect(() => {
    loadHalls();
    loadFaculties();
  }, []);

  const loadHalls = async () => {
    setLoading(true);
    try {
      const data = await fetchLocations();
      // If no real data, show mock data for demo
      setHalls(
        data.length
          ? data
          : [
              {
                slug: "hall-101",
                name: "قاعة 101",
                faculty: { id: 1, name: "كلية الهندسة" },
                capacity: 120,
              },
              {
                slug: "hall-202",
                name: "قاعة 202",
                faculty: { id: 2, name: "كلية العلوم" },
                capacity: 80,
              },
              {
                slug: "hall-303",
                name: "قاعة 303",
                faculty: { id: 3, name: "كلية التجارة" },
                capacity: 60,
              },
            ]
      );
      setError(null);
    } catch (err) {
      setHalls([
        {
          slug: "hall-101",
          name: "قاعة 101",
          faculty: { id: 1, name: "كلية الهندسة" },
          capacity: 120,
        },
        {
          slug: "hall-202",
          name: "قاعة 202",
          faculty: { id: 2, name: "كلية العلوم" },
          capacity: 80,
        },
        {
          slug: "hall-303",
          name: "قاعة 303",
          faculty: { id: 3, name: "كلية التجارة" },
          capacity: 60,
        },
      ]);
      setError(err?.message || null);
    }
    setLoading(false);
  };

  const loadFaculties = async () => {
    try {
      const data = await fetchFaculties();
      setFaculties(data.length ? data : []);
      setFacultiesLoaded(!!data.length);
    } catch (err) {
      setFaculties([]);
      setFacultiesLoaded(false);
      setError(
        err?.message ||
          "تعذر تحميل قائمة الكليات. لا يمكن إضافة/تعديل قاعة بدون الكليات."
      );
    }
  };

  const handleDelete = async (slug) => {
    setLoading(true);
    try {
      await deleteLocation(slug);
      await loadHalls();
      setShowDeleteModal(false);
      setHallToDelete(null);
    } catch (err) {
      setError(err?.message);
    }
    setLoading(false);
  };

  const openDeleteModal = (hall) => {
    setHallToDelete(hall);
    setShowDeleteModal(true);
  };

  const handleUpdate = (hall) => {
    setModalType("update");
    setSelectedHall(hall);
    setForm({
      name: hall.name,
      faculty: getFacultyId(hall.faculty),
      slug: hall.slug,
      capacity: hall.capacity,
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setModalType("create");
    setSelectedHall(null);
    setForm({ name: "", faculty: "", slug: "", capacity: "" });
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
    // Client-side validations to prevent 500 from NOT NULL at DB level
    if (!form.name?.trim()) {
      setError("اسم القاعة مطلوب");
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
    const facultyId = Number(form.faculty);
    if (!facultyId) {
      setError("يجب اختيار الكلية");
      return;
    }
    const cap = Number(form.capacity ?? 1);
    if (!Number.isFinite(cap) || cap <= 0) {
      setError("مساحة القاعة يجب أن تكون رقمًا أكبر من 0");
      return;
    }
    setLoading(true);
    try {
      if (modalType === "create") {
        await createLocation({
          name: form.name.trim(),
          slug: form.slug?.trim(),
          capacity: cap,
          faculty: facultyId,
        });
      } else {
        await updateLocation(selectedHall.slug, {
          name: form.name.trim(),
          slug: form.slug?.trim(),
          capacity: cap,
          faculty: facultyId,
        });
      }
      setShowModal(false);
      await loadHalls();
    } catch (err) {
      setError(err?.message);
    }
    setLoading(false);
  };

  return (
    <div className="hall-page">
      <div className="page-header">
        
        <h1>القاعات</h1>
        <div
          className="add-hall-btn"
          onClick={handleCreate}
          style={{
            minWidth: "140px",
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
            اضافه قاعة
          </span>
        </div>
      </div>
      {error && (
        <div
          style={{ color: "red", textAlign: "center", marginBottom: "1rem" }}
        >
          {error}
        </div>
      )}
      <div className="hall-table-wrapper">
        {loading ? (
          <div style={{ textAlign: "center", color: "#646cff" }}>
            جاري التحميل...
          </div>
        ) : (
          <table className="hall-table">
            <thead>
              <tr>
                <th>اسم القاعة</th>
                <th>اسم الكلية</th>
                <th>slug</th>
                <th>مساحه القاعة</th>
                <th>تعديل القاعة</th>
                <th>مسح القاعة</th>
              </tr>
            </thead>
            <tbody>
              {halls.map((hall) => (
                <tr key={hall.slug} className="hall-row">
                  <td>{hall.name}</td>
                  <td>{getFacultyName(hall)}</td>
                  <td>{hall.slug}</td>
                  <td>{hall.capacity}</td>
                  <td>
                    <Button
                      className="btn update"
                      variant="update"
                      onClick={() => handleUpdate(hall)}
                    >
                      تعديل{" "}
                    </Button>
                  </td>
                  <td>
                    <Button
                      className="btn delete"
                      variant="delete"
                      onClick={() => openDeleteModal(hall)}
                    >
                      <span
                        style={{ verticalAlign: "middle", marginRight: "4px" }}
                      >
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
          title={modalType === "create" ? "اضافة القاعة" : "تعديل القاعة"}
          backdropClass="hall-modal-bg"
          modalClass="hall-modal"
          showClose
          containerStyle={{ paddingTop: "80px" }}
        >
          <form
            onSubmit={handleSubmit}
            style={{ maxWidth: 520, padding: "0.6rem 0.75rem", gap: "0.5rem" }}
          >
            <label>
              اسم القاعة:
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label>
              اسم الكلية:
              <select
                name="faculty"
                value={form.faculty}
                onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                required
                disabled={!facultiesLoaded}
              >
                <option value="">اختر الكلية</option>
                {facultiesLoaded &&
                  faculties.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              slug:
              <input
                name="slug"
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
              />
            </label>
            <label>
              مساحه القاعة:
              <input
                name="capacity"
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                required
              />
            </label>
            <Button
              type="submit"
              className="btn update"
              variant="update"
              disabled={!facultiesLoaded}
            >
              {modalType === "create" ? "اضافة القاعة" : "تحديث القاعة"}
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
      {showDeleteModal && hallToDelete && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          title={"تأكيد حذف القاعة"}
          backdropClass="hall-modal-bg"
          modalClass="hall-modal"
          showClose
          containerStyle={{ paddingTop: "80px" }}
        >
          <p>
            هل أنت متأكد من حذف القاعة <b>{hallToDelete.name}</b>؟ لا يمكن
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
              onClick={() => handleDelete(hallToDelete.slug)}
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
      )}
    </div>
  );
}
