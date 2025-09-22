import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PlexusBackground from '../../components/PlexusBackground';
import api from '../../services/api';
import './reset-password.css';

function ResetPassword() {
  const navigate = useNavigate();
  const params = useParams();
  // Support both /resetpassword/:uid-:token and /resetpassword/:combo
  let uid = params.uid;
  let token = params.token;
  if (!uid || !token) {
    const combo = params.combo;
    if (combo && combo.includes('-')) {
      const i = combo.indexOf('-');
      uid = combo.slice(0, i);
      token = combo.slice(i + 1);
    }
  }

  const [form, setForm] = useState({ new_password: '', re_new_password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState({ new: false, confirm: false });

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!form.new_password || !form.re_new_password) {
        throw new Error('يرجى إدخال كلمة المرور الجديدة وتأكيدها');
      }
      if (form.new_password !== form.re_new_password) {
        throw new Error('كلمتا المرور غير متطابقتين');
      }

      const resp = await fetch(`${api.baseURL}/auth/users/reset_password_confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, token, new_password: form.new_password, re_new_password: form.re_new_password })
      });

      if (!resp.ok) {
        let msg = 'تعذر إعادة تعيين كلمة المرور';
  try {
          const data = await resp.json();
          if (data?.token) msg = 'رابط غير صالح أو منتهي الصلاحية';
          else if (data?.new_password) msg = Array.isArray(data.new_password) ? data.new_password[0] : data.new_password;
          else if (data?.re_new_password) msg = Array.isArray(data.re_new_password) ? data.re_new_password[0] : data.re_new_password;
          else if (data?.detail) msg = data.detail;
  } catch (e) { void e; }
        // Translate to Arabic when possible
        throw new Error(api.translateError(String(msg)));
      }

      setSuccess('تم تعيين كلمة المرور بنجاح. سيتم تحويلك لتسجيل الدخول.');
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      setError(api.translateError(err.message || 'تعذر إعادة التعيين'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <PlexusBackground />

      <div className="reset-password-form-section">
        <div className="reset-password-container">
          <h2>إعادة تعيين كلمة المرور</h2>
          <p>أدخل كلمة المرور الجديدة لحسابك</p>

          {error && <div className="reset-password-error">{error}</div>}
          {success && <div className="reset-password-success">{success}</div>}

          <form onSubmit={handleSubmit} className="reset-password-form">
            <div className="form-group">
              <label htmlFor="new_password">كلمة المرور الجديدة</label>
              <div className="password-input-wrapper ">
                <input
                  type={showPassword.new ? 'text' : 'password'}
                  id="new_password"
                  name="new_password"
                  value={form.new_password}
                  onChange={handleChange}
                  placeholder="على الأقل 8 أحرف"
                  required
                  className="password-input"
                  dir="ltr"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('new')}
                  aria-label={showPassword.new ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword.new ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12S5.636 6 12 6s10 6 10 6-3.636 6-10 6S2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.94 17.94C16.23 19.243 14.149 19.965 12 20 5 20 1 12 1 12c1.244-2.318 2.969-4.344 6.06-5.94M9.9 4.24C10.588 4.079 11.293 3.998 12 4c7 0 11 8 11 8-.607 1.136-1.331 2.205-2.16 3.19M14.12 14.12A3 3 0 0 1 9.88 9.88M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="re_new_password">تأكيد كلمة المرور</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword.confirm ? 'text' : 'password'}
                  id="re_new_password"
                  name="re_new_password"
                  value={form.re_new_password}
                  onChange={handleChange}
                  placeholder="أعد إدخال كلمة المرور"
                  required
                  className="password-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('confirm')}
                  aria-label={showPassword.confirm ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword.confirm ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12S5.636 6 12 6s10 6 10 6-3.636 6-10 6S2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.94 17.94C16.23 19.243 14.149 19.965 12 20 5 20 1 12 1 12c1.244-2.318 2.969-4.344 6.06-5.94M9.9 4.24C10.588 4.079 11.293 3.998 12 4c7 0 11 8 11 8-.607 1.136-1.331 2.205-2.16 3.19M14.12 14.12A3 3 0 0 1 9.88 9.88M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="reset-password-btn" disabled={loading}>
              {loading ? 'جاري التعيين...' : 'تعيين كلمة المرور'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
