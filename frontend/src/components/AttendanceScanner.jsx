import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AttendanceAPI } from '../services/attendanceApi';
import jsSHA from 'jssha';

// Very lightweight dynamic import of a QR reader library could be done; placeholder for real implementation.
// For now, component expects the scanned JSON string passed via handleManualScan for demo purposes.

const fingerprint = () => {
  const data = [navigator.userAgent, navigator.language, screen.width, screen.height, screen.colorDepth].join('|');
  const sha = new jsSHA('SHA-256', 'TEXT');
  sha.update(data);
  return sha.getHash('HEX');
};

// We dynamically import html5-qrcode to avoid bundling issues during SSR/build if any.
let Html5QrcodeScannerCls = null;

const AttendanceScanner = ({ studentAttendanceId }) => {
  const [status, setStatus] = useState('جاهز للمسح');
  const [lastToken, setLastToken] = useState(null);
  const scannerRef = useRef(null);
  const initializedRef = useRef(false);

  const mark = useCallback(async (payload) => {
    try {
      const { coords } = await new Promise(resolve => {
        if(!navigator.geolocation) return resolve({ coords: { latitude: null, longitude: null }});
        navigator.geolocation.getCurrentPosition(pos=>resolve(pos), ()=>resolve({ coords:{ latitude:null, longitude:null }}), { enableHighAccuracy:true, timeout:4000 });
      });
      const fp = fingerprint();
      const res = await AttendanceAPI.markPresent(studentAttendanceId, { token: payload.token, lat: coords.latitude, lon: coords.longitude, fingerprint: fp });
      if(res.data.present) setStatus('تم تسجيل الحضور ✅'); else setStatus('فشل غير متوقع');
    } catch (e) { setStatus('فشل: '+ (e.response?.data?.error || 'خطأ')); }
  }, [studentAttendanceId]);

  const handleManualScan = useCallback((input) => {
    try { const obj = JSON.parse(input); if(obj.token !== lastToken){ setLastToken(obj.token); mark(obj);} } catch { setStatus('رمز غير صالح'); }
  }, [lastToken, mark]);

  useEffect(()=>{
    if(initializedRef.current) return;
    (async () => {
      try {
        const mod = await import('html5-qrcode');
        Html5QrcodeScannerCls = mod.Html5QrcodeScanner;
        const scanner = new Html5QrcodeScannerCls('qr-reader', { fps: 10, qrbox: 250 }, false);
    scanner.render((decodedText)=>{ handleManualScan(decodedText); }, ()=>{});
        scannerRef.current = scanner;
        initializedRef.current = true;
      } catch {
        setStatus('فشل في تهيئة الكاميرا، يمكنك لصق الرمز يدوياً');
      }
    })();
    return () => { try { scannerRef.current?.clear(); } catch { /* noop */ } };
  }, [handleManualScan]);

  return (
    <div style={{direction:'rtl'}}>
      <div id="qr-reader" style={{width:300, margin:'0 auto'}} />
      <p>{status}</p>
      <input style={{width:'100%'}} type="text" placeholder="أو الصق الرمز JSON" onChange={e=>handleManualScan(e.target.value)} />
    </div>
  );
};

export default AttendanceScanner;