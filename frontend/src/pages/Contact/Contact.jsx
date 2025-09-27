import React, { useEffect, useState } from "react";
import "./contact.css";
import { useForm } from "@formspree/react";
import { useNavigate } from "react-router-dom";

export default function Contact() {
  const [state, handleSubmit] = useForm("xvgqlqpd");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const navigate = useNavigate();

  // Validate individual fields on input
  const validateField = (name, value) => {
    let error = "";

    // Only validate if the field has content
    if (value.trim() !== "") {
      if (name === "name" && value.trim().length < 5) {
        error = "يجب أن يكون الاسم 5 أحرف على الأقل";
      }

      if (name === "email" && !/\S+@\S+\.\S+/.test(value)) {
        error = "البريد الإلكتروني غير صالح";
      }

      if (name === "subject" && value.trim().length < 3) {
        error = "الموضوع قصير جداً (3 أحرف على الأقل)";
      }

      if (name === "message" && value.trim().length < 10) {
        error = "يجب أن تحتوي الرسالة على 10 أحرف على الأقل";
      }
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Handle input change and validate
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    validateField(name, value);
  };

  // Only submit if no errors
  const onSubmit = async (e) => {
    e.preventDefault();
    const allValid = Object.values(errors).every((e) => e === "") &&
      Object.values(formData).every((v) => v.trim() !== "");

    if (!allValid) return;

    setLocalSubmitting(true);
    await handleSubmit(e);
    setLocalSubmitting(false);

    if (state.succeeded) {
      setShowSuccess(true);
    }
  };

  // Auto redirect after success
  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => {
        navigate("/");
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [showSuccess, navigate]);

  const subjectSuggestions = ["استفسار", "شكوى", "مقترح", "دعم فني"];  

  const handleSubjectClick = (val) => {
    setFormData((p) => ({ ...p, subject: val }));
    validateField("subject", val);
  };

  return (
    <div className="contact">
      <header className="contact-header inside-form">
        <h1>مركز التواصل</h1>
        <p>يرجى ملء النموذج أدناه وسنعود إليك في أقرب وقت ممكن.</p>
      </header>
      <div className="row">
        {/* Contact Form Section */}
        <div className="col-lg-6 d-flex align-items-center">
          <div className="contact-form">
            {showSuccess && (
              <div className="success-overlay" role="status" aria-live="polite">
                <div className="success-icon">✅</div>
                <h3>تم إرسال رسالتك بنجاح</h3>
                <p>سيتم تحويلك للصفحة الرئيسية خلال لحظات...</p>
              </div>
            )}
            <form id="contact-form" onSubmit={onSubmit} noValidate className="enhanced-form">
              <div className="field-grid">
                <div className="floating-group static-label">
                  <label htmlFor="name" className="field-label">
                    <span className="label-main">اسم المستخدم</span>
                    <span className="label-help">ادخل اسمك الكامل</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "error-name" : undefined}
                    placeholder=""
                  />
                  {errors.name && <p id="error-name" className="error mini">{errors.name}</p>}
                </div>
                <div className="floating-group static-label">
                  <label htmlFor="email" className="field-label">
                    <span className="label-main">البريد الإلكتروني</span>
                    <span className="label-help">سنستخدمه للرد عليك</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "error-email" : undefined}
                    placeholder=""
                  />
                  {errors.email && <p id="error-email" className="error mini">{errors.email}</p>}
                </div>
              </div>

              <div className="floating-group full static-label">
                <label htmlFor="subject" className="field-label">
                  <span className="label-main">الموضوع</span>
                  <span className="label-help">اختر أو اكتب موضوعاً</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  autoComplete="off"
                  aria-invalid={!!errors.subject}
                  aria-describedby={errors.subject ? "error-subject" : undefined}
                  placeholder=""
                />
                {errors.subject && <p id="error-subject" className="error mini">{errors.subject}</p>}
                <div className="subject-suggestions" aria-label="اقتراحات الموضوع">
                  {subjectSuggestions.map((s) => (
                    <button
                      type="button"
                      key={s}
                      className={`chip ${formData.subject === s ? 'active' : ''}`}
                      onClick={() => handleSubjectClick(s)}
                    >{s}</button>
                  ))}
                </div>
              </div>

              <div className="floating-group full static-label">
                <label htmlFor="message" className="field-label">
                  <span className="label-main">نص الرسالة</span>
                  <span className="label-help">اكتب تفاصيل رسالتك هنا</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                  maxLength={1000}
                  aria-invalid={!!errors.message}
                  aria-describedby={`message-counter ${errors.message ? 'error-message' : ''}`}
                  placeholder=""
                />
                <div className="message-meta compact">
                  <span id="message-counter" className="char-counter">
                    {formData.message.length}/1000
                  </span>
                  {errors.message && (
                    <p id="error-message" className="error inline-error mini">{errors.message}</p>
                  )}
                </div>
              </div>

              <div className="actions-row">
                <button
                  type="submit"
                  className="btn-big contact-btn btn-bg"
                  disabled={state.submitting || localSubmitting || showSuccess}
                >
                  {localSubmitting ? (
                    <span className="spinner" aria-hidden="true" />
                  ) : (
                    <i className="fas fa-paper-plane"></i>
                  )}
                  <span>{localSubmitting ? "جارٍ الإرسال" : "ارسل"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Contact Info Section */}
        <div className="col-lg-6 d-flex align-items-center">
          <div className="contact-info">
            <div className="overlay"></div>
            <div className="contact-info-content">
              <h2 className="contact-title">تواصل معنا</h2>
              <p>
                هل لديك أي استفسارات أو تحتاج إلى مساعدة؟ لا تتردد في التواصل
                معنا. نحن هنا لمساعدتك في كل ما تحتاجه.
              </p>
              <ul>
                <li>
                  <div className="info">
                    <i className="fas fa-mobile-alt"></i>
                    <h4>3402344 066</h4>
                  </div>
                </li>
                <li>
                  <div className="info">
                    <i className="fas fa-at"></i>
                    <h4>info@psu.edu.eg</h4>
                  </div>
                </li>
                <li>
                  <div className="info">
                    <i className="fas fa-map-marker-alt"></i>
                    <h4>
                      محافظة بورسعيد - بورفؤاد - رقم بريدى : 42526
 
                    </h4>
                  </div>
                </li>
              </ul>
              <div className="social-media">
                <a href="#" className="social-link" title="Facebook" aria-label="Facebook">
                  <i className="fa-brands fa-facebook-f"></i>
                </a>
                <a href="#" className="social-link" title="Twitter" aria-label="Twitter">
                  <i className="fa-brands fa-twitter"></i>
                </a>
                <a href="#" className="social-link" title="Instagram" aria-label="Instagram">
                  <i className="fa-brands fa-instagram"></i>
                </a>
                <a href="#" className="social-link" title="LinkedIn" aria-label="LinkedIn">
                  <i className="fa-brands fa-linkedin-in"></i>
                </a>
                <a href="#" className="social-link" title="YouTube" aria-label="YouTube">
                  <i className="fa-brands fa-youtube"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}