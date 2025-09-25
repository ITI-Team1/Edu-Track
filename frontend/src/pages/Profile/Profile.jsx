import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './profile.css';

function Profile() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/auth/users/me/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          setError('فشل في تحميل بيانات المستخدم');
        }
  } catch {
        setError('خطأ في الاتصال بالسيرفر');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated]);

  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    // Parse as local date to avoid timezone shifts and format in Gregorian Arabic
    const parts = String(dateString).split('-');
    if (parts.length !== 3) return 'غير محدد';
    const [y, m, d] = parts.map(Number);
    const date = new Date(y, (m || 1) - 1, d || 1);
    try {
      return new Intl.DateTimeFormat('ar-EG-u-ca-gregory', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    } catch {
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  const normalizeMediaUrl = (p) => {
    if (!p) return null;
    if (p.startsWith('http')) return p;
    if (p.startsWith('/')) return `http://localhost:8000${p}`;
    return `http://localhost:8000/media/${p}`;
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {error && (
          <div className="error-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Merged top header: avatar + info + actions in one card */}
        <div className="profile-header profile-main header-narrow">
          <div className="header-title-row">
            <h3 className="section-title">إعدادات الحساب</h3>
          </div>
          <div className="profile-avatar">
            {userData?.picture ? (
              <img
                src={`${normalizeMediaUrl(userData.picture)}?t=${Date.now()}`}
                alt="صورة المستخدم"
                className="avatar-image"
              />
            ) : (
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </div>
          <div className="profile-info">
            <h2>
              {userData?.first_name && userData?.last_name
                ? `${userData.first_name} ${userData.last_name}`
                : userData?.email}
            </h2>
            <p className="user-email">{userData?.email}</p>
            <p className="user-username">
              اسم المستخدم: {userData?.username || 'غير محدد'}
            </p>
          </div>
          <div className="profile-actions">
            <button
              onClick={() => navigate('/change-password')}
              className="profile-change-password-btn"
              title="تعديل إعدادات الملف الشخصي"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M15 7C15 9.20914 13.2091 11 11 11C8.79086 11 7 9.20914 7 7C7 4.79086 8.79086 3 11 3C13.2091 3 15 4.79086 15 7Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 21C3 17.6863 6.68629 15 10 15H12C15.3137 15 19 17.6863 19 21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              تغيير إعدادات حسابك
            </button>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="profile-section">
          <h3>المعلومات الشخصية</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>الاسم الأول:</label>
              <span>{userData?.first_name || 'غير محدد'}</span>
            </div>
            <div className="info-item">
              <label>الأسم الأخير:</label>
              <span>{userData?.last_name || 'غير محدد'}</span>
            </div>
            <div className="info-item">
              <label>الاسم الكامل باللغة الإنجليزية:</label>
              <span>{userData?.englishfullname || 'غير محدد'}</span>
            </div>
            <div className="info-item">
              <label>رقم الهاتف:</label>
              <span>{userData?.phonenumber || 'غير محدد'}</span>
            </div>
            <div className="info-item">
              <label>تاريخ الميلاد:</label>
              <span>{formatDate(userData?.birthday)}</span>
            </div>
            <div className="info-item">
              <label>مكان الميلاد:</label>
              <span>{userData?.placeofbirth || 'غير محدد'}</span>
            </div>
            <div className="info-item">
              <label>الرقم القومي:</label>
              <span>{userData?.nationalid || 'غير محدد'}</span>
            </div>
            <div className="info-item">
              <label>الجنسية:</label>
              <span>{userData?.nationality || 'غير محدد'}</span>
            </div>
            <div className="info-item">
              <label>الرمز البريدي:</label>
              <span>{userData?.zipcode || 'غير محدد'}</span>
            </div>
            <div className="info-item">
              <label>الجنس:</label>
              <span>{userData?.gender || 'غير محدد'}</span>
            </div>
            <div className="info-item">
              <label>الحالة الاجتماعية:</label>
              <span>{userData?.maritalstatus || 'غير محدد'}</span>
            </div>
            <div className="info-item">
              <label>الديانة:</label>
              <span>{userData?.religion || 'غير محدد'}</span>
            </div>
            <div className="info-item full-width">
              <label>العنوان:</label>
              <span>{userData?.address || 'غير محدد'}</span>
            </div>
          </div>
        </div>

        {/* Academic Information Section */}
        <div className="profile-section">
          <h3>المعلومات الأكاديمية</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>الجامعة:</label>
              <span>{userData?.university?.name || 'غير محدد'}</span>
            </div>
            <div className="info-item">
              <label>الكلية:</label>
              <span>{userData?.faculty?.name || 'غير محدد'}</span>
            </div>
            <div className="info-item">
              <label>البرنامج:</label>
              <span>{userData?.program?.name || 'غير محدد'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
