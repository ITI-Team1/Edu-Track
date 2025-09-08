import React, { useState } from 'react';
import './forgot-password.css';
import PlexusBackground from '../../components/PlexusBackground';
import api from '../../services/api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!email) {
        throw new Error('يرجى إدخال بريدك الإلكتروني.');
      }

      // Djoser endpoint for initiating password reset
      const response = await fetch(`${api.baseURL}/auth/users/reset_password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        let msg = 'حدث خطأ أثناء إرسال الرابط، حاول مرة أخرى.';
        try {
          const data = await response.json();
          if (data?.email) msg = Array.isArray(data.email) ? data.email[0] : data.email;
          else if (data?.detail) msg = data.detail;
        } catch {}
        throw new Error(msg);
      }

      setSuccess('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-split-page">
      <PlexusBackground />

      <div className="forgot-password-form-section">
        <div className="forgot-password-container">
          <h2>نسيت كلمة المرور</h2>
          <p>أدخل بريدك الإلكتروني لإرسال رابط إعادة تعيين كلمة المرور</p>

          {error && <div className="forgot-password-error-message">{error}</div>}
          {success && <div className="forgot-password-success-message">{success}</div>}

          <form onSubmit={handleSubmit} className="forgot-password-form">
            <div className="forgot-password-form-group">
              <label htmlFor="email">البريد الإلكتروني</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="أدخل البريد الإلكتروني"
              />
            </div>

            <button type="submit" className="forgot-password-btn btn-primary" disabled={loading}>
              {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
