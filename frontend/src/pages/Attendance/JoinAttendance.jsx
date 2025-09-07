import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Frontend-only join: marks presence in localStorage for lecture.
export default function JoinAttendance() {
  const { user } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('جاري المعالجة...');

  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    const lec = params.get('lec');
    const j = params.get('j');
    if (!lec || !j) { setStatus('رابط غير صالح'); return; }
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`, { replace: true });
      return;
    }
    try {
      // Mark this user as present locally for this lecture
      const key = `attend:lec:${lec}`;
      const raw = localStorage.getItem(key);
      const set = new Set((raw ? JSON.parse(raw) : []).map(Number));
      // Assuming user.id available in context
      const uid = Number(user?.id || user?.pk || user?.user_id);
      if (!Number.isNaN(uid)) set.add(uid);
      localStorage.setItem(key, JSON.stringify(Array.from(set)));
      setStatus('تم تسجيل حضورك بنجاح ✅');
      setTimeout(()=>navigate(`/attendance/${encodeURIComponent(lec)}`, { replace:true }), 1500);
    } catch {
      setStatus('تعذر إتمام العملية');
    }
  }, [loc, user, navigate]);

  return <div style={{direction:'rtl', padding:40}}><h2>تسجيل الحضور</h2><p>{status}</p></div>;
}