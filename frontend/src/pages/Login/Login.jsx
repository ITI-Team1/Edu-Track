import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './login.css';
import image2 from '../../assets/login.jpeg';
import PlexusBackground from '../../components/PlexusBackground';


function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const next = params.get('next');

  // Image is loaded for the split layout

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(formData);
      if (next) {
        navigate(next, { replace: true });
      } else {
        navigate('/');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-page">
      <PlexusBackground />
      <div className="login-image-section hover:translate-x-1  duration-300">
        <img
          src={image2}
          alt="Port Said University"
          className="login-bg-image "
          decoding="async"
          loading="eager"
          fetchPriority="high"
        />
        <div className="university-logo"></div>
      </div>
      <div className="login-form-section ">
        <div className="login-container hover:-translate-x-1  duration-300">
          <h2>مرحباً بعودتك</h2>
          <p>سجل دخولك إلى حساب جامعة بورسعيد</p>
          
          {error && <div className="login-error-message">{error}</div>}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-form-group">
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
            </div>
            
            <div className="login-form-group">
              <label htmlFor="password">كلمة المرور</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="أدخل كلمة المرور"
              />
            </div>
            
            <button type="submit" className="login-btn !bg-amber-700 " disabled={loading}>
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
          
          <div className="login-links">
            <Link to="/forgot-password">نسيت كلمة المرور؟</Link>
            {/* <p>
              ليس لديك حساب؟ <Link to="/register">إنشاء حساب</Link>
            </p> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login; 
