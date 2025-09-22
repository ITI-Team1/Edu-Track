import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './register.css';
import image2 from '../../assets/login.jpeg';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    re_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // global/server error
  const [errors, setErrors] = useState({}); // per-field errors
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // clear field-specific error as user types
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrors({});
    
    try {
      // Client-side validation with per-field messages
      const newErrors = {};
      if (!formData.username?.trim()) {
        newErrors.username = 'اسم المستخدم مطلوب';
      } else if (formData.username.trim().length < 3) {
        newErrors.username = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
      }

      if (!formData.first_name?.trim()) {
        newErrors.first_name = 'الاسم الأول مطلوب';
      }

      if (!formData.last_name?.trim()) {
        newErrors.last_name = 'اسم العائلة مطلوب';
      }

      const email = formData.email?.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        newErrors.email = 'البريد الإلكتروني مطلوب';
      } else if (!emailRegex.test(email)) {
        newErrors.email = 'البريد الإلكتروني غير صالح';
      }

      const pwd = formData.password ?? '';
      const repwd = formData.re_password ?? '';
      if (!pwd) {
        newErrors.password = 'كلمة المرور مطلوبة';
      } else if (pwd.length < 8) {
        newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
      }
      if (!repwd) {
        newErrors.re_password = 'تأكيد كلمة المرور مطلوب';
      } else if (pwd && repwd && pwd !== repwd) {
        newErrors.re_password = 'كلمتا المرور غير متطابقتين';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return; // stop before calling API
      }

      await register({
        username: formData.username.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email,
        password: pwd,
        re_password: repwd,
      });
      navigate('/login');
    } catch (error) {
      // Try to map server-side field errors if available; otherwise, show global error
      if (error && typeof error === 'object') {
        const fieldErrors = error.fieldErrors || error.fields || error.errors;
        if (fieldErrors && typeof fieldErrors === 'object') {
          setErrors(fieldErrors);
        } else if (error.message) {
          setError(error.message);
        } else {
          setError('حدث خطأ غير متوقع أثناء إنشاء الحساب');
        }
      } else {
        setError('حدث خطأ غير متوقع أثناء إنشاء الحساب');
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="register-split-page">
      <div className="register-image-section">
        <img src={image2} alt="Port Said University" className="register-bg-image" />
        <div className="university-logo"></div>
      </div>
      <div className="register-form-section">
        <div className="register-container">
          <h2>إنشاء حساب جديد</h2>
          <p>سجل بياناتك للانضمام إلى جامعة بورسعيد</p>
          {error && <div className="register-error-message">{error}</div>}
          <form className="register-form" onSubmit={handleSubmit}>
            <div className="register-form-group">
              <label htmlFor="username">اسم المستخدم</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="أدخل اسم المستخدم"
              />
              {errors.username && (
                <div className="register-field-error">{errors.username}</div>
              )}
            </div>
            <div className="register-form-row">
              <div className="register-form-group">
                <label htmlFor="first_name">الاسم الأول</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  placeholder="أدخل اسمك الأول"
                />
                {errors.first_name && (
                  <div className="register-field-error">{errors.first_name}</div>
                )}
              </div>
              <div className="register-form-group">
                <label htmlFor="last_name">اسم العائلة</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  placeholder="أدخل اسم العائلة"
                />
                {errors.last_name && (
                  <div className="register-field-error">{errors.last_name}</div>
                )}
              </div>
            </div>
            <div className="register-form-group">
              <label htmlFor="email">البريد الإلكتروني</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="أدخل بريدك الإلكتروني"
              />
              {errors.email && (
                <div className="register-field-error">{errors.email}</div>
              )}
            </div>
            <div className="register-form-row">
              <div className="register-form-group">
                <label htmlFor="password">كلمة المرور</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="أنشئ كلمة مرور"
                />
                {errors.password && (
                  <div className="register-field-error">{errors.password}</div>
                )}
              </div>
              <div className="register-form-group">
                <label htmlFor="re_password">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  id="re_password"
                  name="re_password"
                  value={formData.re_password}
                  onChange={handleChange}
                  required
                  placeholder="أكد كلمة المرور"
                />
                {errors.re_password && (
                  <div className="register-field-error">{errors.re_password}</div>
                )}
              </div>
            </div>
            <button type="submit" className="register-btn btn-primary" disabled={loading}>
              {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
            </button>
          </form>
          <div className="register-links">
            <p>
              لديك حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
