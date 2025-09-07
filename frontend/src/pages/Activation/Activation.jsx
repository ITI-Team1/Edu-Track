import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import './activation.css';

export default function Activation() {
  const params = useParams();
  const { uid: uidParam, token: tokenParam, combo } = params;
  const navigate = useNavigate();
  const [phase, setPhase] = useState('loading'); // loading | success | error
  const [status, setStatus] = useState('جاري تفعيل الحساب...');

  // Support both /activation/:uid-:token and /activation/:combo
  const { uid, token } = useMemo(() => {
    if (uidParam && tokenParam) return { uid: uidParam, token: tokenParam };
    if (combo) {
      const firstDash = combo.indexOf('-');
      if (firstDash > 0) {
        const u = combo.slice(0, firstDash);
        const t = combo.slice(firstDash + 1);
        return { uid: u, token: t };
      }
    }
    return { uid: undefined, token: undefined };
  }, [uidParam, tokenParam, combo]);

  useEffect(() => {
    if (!uid || !token) { setPhase('error'); setStatus('رابط تفعيل غير صالح'); return; }
    (async () => {
      try {
        await api.activateAccount({ uid, token });
        setPhase('success');
        setStatus('تم تفعيل الحساب بنجاح ✅');
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      } catch (e) {
        setPhase('error');
        setStatus(e?.message || 'تعذر تفعيل الحساب');
      }
    })();
  }, [uid, token, navigate]);

  return (
    <div className="activation-page" dir="rtl">
      <div className={`activation-card ${phase}`}>
        <div className="activation-header">
          <h1 className="activation-title">تفعيل الحساب</h1>
          <div className="activation-strip"/>
        </div>
        {phase === 'loading' && (
          <div className="activation-body">
            <div className="activation-spinner" aria-hidden="true"/>
            <p className="activation-status">{status}</p>
            <p className="activation-hint">يرجى الانتظار لحظات...</p>
          </div>
        )}
        {phase === 'success' && (
          <div className="activation-body">
            <div className="activation-icon success" aria-hidden="true">✓</div>
            <p className="activation-status success-text">{status}</p>
            <div className="activation-actions">
              <Link to="/login" className="btn btn-primary">الذهاب لتسجيل الدخول</Link>
            </div>
          </div>
        )}
        {phase === 'error' && (
          <div className="activation-body">
            <div className="activation-icon error" aria-hidden="true">!</div>
            <p className="activation-status error-text">{status}</p>
            <div className="activation-actions">
              <Link to="/login" className="btn btn-outline">تسجيل الدخول</Link>
              <Link to="/" className="btn">العودة للرئيسية</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
