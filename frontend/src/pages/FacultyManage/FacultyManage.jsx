import React, { useState, useCallback, memo, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchFaculties,
  createFaculty,
  updateFaculty,
  deleteFaculty,
} from "../../services/facultyApi";
import "./FacultyManage.css";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { fetchUserPermissions } from "../../services/userApi";

const initialForm = { name: "", slug: "", logo: null, university: 1 };




// Form validation function
const validateForm = (form) => {
  const errors = {};
  if (!form.name.trim()) {
    errors.name = "اسم الكلية مطلوب";
  } else if (form.name.length > 30) {
    errors.name = "اسم الكلية يجب أن لا يتجاوز 30 حرف";
  }

  if (!form.slug.trim()) {
    errors.slug = "الرابط المختصر مطلوب";
  } else if (form.slug.length > 30) {
    errors.slug = "الرابط المختصر يجب أن لا يتجاوز 30 حرف";
  }

  if (form.logo && form.logo.size > 5 * 1024 * 1024) {
    // 5MB limit
    errors.logo = "حجم الصورة يجب أن لا يتجاوز 5 ميجابايت";
  }

  return errors;
};

// Memoized AddEditForm component
const AddEditForm = memo(
  ({ isClosing, editSlug, form, error, onClose, onSubmit, onChange }) => {
    return (
      <div className={`faculty-modal-bg ${isClosing ? "fadeOut" : ""}`}>
        <div className="faculty-modal">
          <button
            type="button"
            className="close-btn"
            onClick={() => {
              onClose();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            ×
          </button>

          <h3>{editSlug ? "تعديل كلية" : "إضافة كلية"}</h3>

          <form onSubmit={onSubmit} dir="rtl" autoComplete="off">
            <div >
              <label htmlFor="faculty-name" className="themed-label">
                اسم الكلية
              </label>
              <input
                id="faculty-name"
                type="text"
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="مثال: كلية الهندسة"
                required
                maxLength={30}
                autoComplete="off"
              />
              <small className="input-helper">{form.name.length}/30</small>
            </div>

            <div >
              <label htmlFor="faculty-slug" className="themed-label">
                الرابط المختصر
              </label>
              <input
                id="faculty-slug"
                type="text"
                name="slug"
                value={form.slug}
                onChange={onChange}
                placeholder="مثال: engineering-faculty"
                required
                maxLength={30}
                autoComplete="off"
                dir="ltr"
              />
              <small className="input-helper">
                {form.slug.length}/30 - سيتم استخدامه في الرابط
              </small>
            </div>

            <div >
              <label htmlFor="faculty-logo" className="themed-label">
                شعار الكلية
              </label>
              <input
                id="faculty-logo"
                type="file"
                name="logo"
                onChange={onChange}
                accept="image/*"
                className="file-input"
                autoComplete="off"
              />
              <small className="input-helper">الحد الأقصى: 5 ميجابايت</small>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="submit-button">
              {editSlug ? "حفظ التغييرات" : "إضافة الكلية"}
            </button>

            <div className="actions">
              <button
                type="button"
                className="btn cancel"
                onClick={() => {
                  onClose();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
);

// Provide displayName and propTypes to satisfy lint rules for memoized component
AddEditForm.displayName = "AddEditForm";
AddEditForm.propTypes = {
  isClosing: PropTypes.bool,
  editSlug: PropTypes.string,
  form: PropTypes.shape({
    name: PropTypes.string,
    slug: PropTypes.string,
    logo: PropTypes.any,
  }).isRequired,
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
};

// Memoized FacultyList component
const FacultyList = memo(
  ({ faculties, isLoading, isError, onAdd, onEdit, onDelete, permissions }) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [facultyToDelete, setFacultyToDelete] = useState(null);

    const openDeleteModal = (faculty) => {
      setFacultyToDelete(faculty);
      setShowDeleteModal(true);
    };

    const confirmDelete = () => {
      onDelete(facultyToDelete.slug);
      setShowDeleteModal(false);
      setFacultyToDelete(null);
    };
    return (
      <div className="faculty-list-container">
        <div className="header-actions">
          <h1>إدارة الكليات</h1>
          {permissions.includes('Can add faculty') &&
          <Button onClick={onAdd} className="add-button">
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
              إضافة كلية
            </span>
          </Button>
          }
        </div>
        {isLoading ? (
          <div className="loading">جاري التحميل...</div>
        ) : isError ? (
          <div className="error">حدث خطأ في تحميل البيانات</div>
        ) : (
          <div className="faculty-grid">
            {faculties?.map((faculty) => (
              <div key={faculty.slug} className="faculty-card content-card">
                {faculty.logo && (
                  <div className="faculty-logo">
                    <img src={faculty.logo} alt={faculty.name} />
                  </div>
                )}
                <div className="faculty-info">
                  <h3>{faculty.name}</h3>
                  <p>{faculty.slug}</p>
                </div>
                <div className="faculty-actions">
                  <Button onClick={() => onEdit(faculty)} className="edit-button">
                    تعديل
                  </Button>
                  <Button
                    onClick={() => openDeleteModal(faculty)}
                    className="btn delete"
                    variant="delete"
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
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Custom Delete Confirmation Modal */}
        {showDeleteModal && facultyToDelete && (
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            backdropClass="faculty-modal-bg"
            modalClass="faculty-modal"
            containerStyle={{ maxWidth: 400, textAlign: "center" }}
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
              تأكيد حذف الكلية
            </h3>
            <p>
              هل أنت متأكد من حذف الكلية <b>{facultyToDelete.name}</b>؟ لا يمكن
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
              <Button className="btn delete" variant="delete" onClick={confirmDelete}>
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
);

FacultyList.displayName = "FacultyList";
FacultyList.propTypes = {
  faculties: PropTypes.array,
  isLoading: PropTypes.bool,
  isError: PropTypes.bool,
  onAdd: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

const FacultyManage = () => {  
  const queryClient = useQueryClient();
  

  // get user permissions using fetchUserPermissions
  const { user } = useAuth();
  
  const [permissions, setPermissions] = useState([]);
  useEffect(() => {
    console.log(user);
    fetchUserPermissions(user).then(permissions => {
      
      setPermissions(permissions);
    });
  }, [user]);


  const [formState, setFormState] = useState({
    form: initialForm,
    editSlug: null,
    error: "",
    isOpen: false,
    isClosing: false,
  });

  const handleCloseForm = useCallback(() => {
    setFormState((prev) => ({ ...prev, isClosing: true }));
  }, []);

  useEffect(() => {
    let timer;
    if (formState.isClosing) {
      timer = setTimeout(() => {
        setFormState({
          form: initialForm,
          editSlug: null,
          error: "",
          isOpen: false,
          isClosing: false,
        });
      }, 300);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [formState.isClosing]);

  const {
    data: faculties,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["faculties"],
    queryFn: fetchFaculties('engineering'),
  });

  const createMutation = useMutation({
    mutationFn: createFaculty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculties"] });
      handleCloseForm();
    },
    onError: (error) =>
      setFormState((prev) => ({
        ...prev,
        error: error?.message || "فشل في إنشاء الكلية",
      })),
  });

  const updateMutation = useMutation({
    mutationFn: updateFaculty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculties"] });
      handleCloseForm();
    },
    onError: (error) =>
      setFormState((prev) => ({
        ...prev,
        error: error?.message || "فشل في تحديث الكلية",
      })),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFaculty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculties"] });
    },
    onError: (error) =>
      setFormState((prev) => ({
        ...prev,
        error: error?.message || "فشل في حذف الكلية",
      })),
  });

  // Optimized handleChange with useCallback and proper dependencies
  const handleChange = useCallback((e) => {
    const { name, value, files } = e.target;

    setFormState((prev) => {
      const newForm = { ...prev.form };

      if (files) {
        newForm[name] = files[0];
      } else {
        newForm[name] = value;
      }

      return {
        ...prev,
        form: newForm,
      };
    });
  }, []); // Empty dependencies since we're using functional updates

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      // Validate form
      const errors = validateForm(formState.form);
      if (Object.keys(errors).length > 0) {
        const errorMessage = Object.values(errors).join("\n");
        setFormState((prev) => ({ ...prev, error: errorMessage }));
        return;
      }

      const formData = new FormData();
      formData.append("name", formState.form.name);
      formData.append("slug", formState.form.slug);
      if (formState.form.logo) formData.append("logo", formState.form.logo);
      formData.append("university", formState.form.university);

      try {
        if (formState.editSlug) {
          updateMutation.mutate({ slug: formState.editSlug, formData });
        } else {
          createMutation.mutate(formData);
        }
      } catch (error) {
        setFormState((prev) => ({
          ...prev,
          error: error.response?.data?.message || "حدث خطأ أثناء حفظ البيانات",
        }));
      }
    },
    [formState.form, formState.editSlug, updateMutation, createMutation]
  );

  const handleEdit = useCallback((fac) => {
    setFormState((prev) => ({
      ...prev,
      form: {
        name: fac.name,
        slug: fac.slug,
        logo: null,
        university: 1
      },
      editSlug: fac.slug,
      isOpen: true,
      error: "",
    }));
  }, []);

  const handleAdd = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      form: initialForm,
      editSlug: null,
      isOpen: true,
      error: "",
    }));
  }, []);

  const handleDelete = useCallback(
    (slug) => {
      deleteMutation.mutate(slug);
    },
    [deleteMutation]
  );

  // Memoize props to prevent unnecessary re-renders
  const formProps = useMemo(
    () => ({
      isClosing: formState.isClosing,
      editSlug: formState.editSlug,
      form: formState.form,
      error: formState.error,
      onClose: handleCloseForm,
      onSubmit: handleSubmit,
      onChange: handleChange,
    }),
    [
      formState.isClosing,
      formState.editSlug,
      formState.form,
      formState.error,
      handleCloseForm,
      handleSubmit,
      handleChange,
    ]
  );

  const listProps = useMemo(
    () => ({
      faculties,
      isLoading,
      isError,
      onAdd: handleAdd,
      onEdit: handleEdit,
      onDelete: handleDelete,
    }),
    [faculties, isLoading, isError, handleAdd, handleEdit, handleDelete]
  );

  return (
    <div className="faculty-manage" dir="rtl">
      {formState.isOpen ? (
        <AddEditForm {...formProps} />
      ) : (
        <FacultyList {...listProps} permissions={permissions} />
      )}
    </div>
  );
};

export default FacultyManage;
