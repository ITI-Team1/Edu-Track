import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AttendanceAPI } from '../../services/attendanceApi';
import { useAuth } from '../../context/AuthContext';

// Page reached when scanning QR deep link. If not logged in redirect to login with next param.
export default function JoinAttendance() {
  const { user } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('جاري المعالجة...');

  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    const att = params.get('att');
    const j = params.get('j');
    if (!att || !j) { setStatus('رابط غير صالح'); return; }
    if (!user) { // send to login with next
      navigate(`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`, { replace: true });
      return;
    }
    (async () => {
      try {
        await AttendanceAPI.joinViaLink(att, j);
        setStatus('تم تسجيل حضورك بنجاح ✅');
        setTimeout(()=>navigate('/', { replace:true }), 2000);
      } catch (e) {
        setStatus(e?.response?.data?.error || 'فشل التسجيل');
      }
    })();
  }, [loc, user, navigate]);

  return <div style={{direction:'rtl', padding:40}}><h2>تسجيل الحضور</h2><p>{status}</p></div>;
}